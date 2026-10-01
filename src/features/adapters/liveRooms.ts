import {
  type AdapterProblem,
  type AdapterRoom,
  fetchCapabilities,
  fetchRooms,
  streamAdapter,
} from "../../transport/adapters";
import { onRead, rememberRooms } from "./rooms";

export type AdapterRooms =
  | { state: "loading" }
  | { state: "ready"; rooms: AdapterRoom[] }
  | { state: "problem"; problem: AdapterProblem };

const PREVIEW = 200;

let snapshot: ReadonlyMap<string, AdapterRooms> = new Map();
const listeners = new Set<() => void>();
const watched = new Map<string, { refs: number; stop: () => void }>();
const connections = new Map<string, number>();

function update(
  id: string,
  change: (current: AdapterRooms | undefined) => AdapterRooms | undefined,
) {
  const current = snapshot.get(id);
  const next = change(current);
  if (next === undefined || next === current) return;
  snapshot = new Map(snapshot).set(id, next);
  for (const listener of listeners) listener();
}

function pause(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });
}

/**
 * One adapter's rooms, kept current: a live message moves its room up and
 * becomes its preview at once, a change elsewhere or a new message asks for
 * the list again shortly after, so unread counts stay the messenger's own,
 * and a read mark from a room view zeroes that room's count. When the stream
 * comes back after a drop, the declaration is read again (the adapter may
 * have restarted as something else) and the list is asked for again, since
 * whatever happened while it was down never reached this stream.
 */
function start(id: string): () => void {
  const controller = new AbortController();
  const { signal } = controller;
  let refresh: ReturnType<typeof setTimeout> | undefined;
  const load = () =>
    fetchRooms(id, signal).then(
      (result) => {
        if (result.kind === "ok") rememberRooms(id, result.data.rooms);
        update(id, () =>
          result.kind === "ok"
            ? { state: "ready", rooms: result.data.rooms }
            : { state: "problem", problem: result },
        );
      },
      () => {
        // Only an abort rejects.
      },
    );
  const later = () => {
    clearTimeout(refresh);
    refresh = setTimeout(load, 3000);
  };
  update(id, (current) => current ?? { state: "loading" });
  const stopReads = onRead((adapterId, roomId) => {
    if (adapterId !== id) return;
    update(id, (current) =>
      current?.state === "ready"
        ? {
            state: "ready",
            rooms: current.rooms.map((room) =>
              room.id === roomId ? { ...room, unread: 0 } : room,
            ),
          }
        : current,
    );
  });
  void (async () => {
    // An adapter outside this client's contract range is drawn from nothing.
    const declared = await fetchCapabilities(id, signal).catch(() => null);
    if (signal.aborted) return;
    if (declared?.kind === "incompatible") {
      update(id, () => ({ state: "problem", problem: declared }));
      return;
    }
    void load();
    const recover = async () => {
      const again = await fetchCapabilities(id, signal).catch(() => null);
      if (signal.aborted) return;
      if (again?.kind === "incompatible") {
        update(id, () => ({ state: "problem", problem: again }));
        controller.abort();
        return;
      }
      void load();
    };
    let failures = 0;
    let connected = false;
    while (!signal.aborted) {
      const end = await streamAdapter(id, {
        since: {},
        signal,
        onEvent(event) {
          if (event.type === "ready") {
            if (connected || failures > 0) void recover();
            connected = true;
            failures = 0;
            connections.set(id, (connections.get(id) ?? 0) + 1);
            for (const listener of listeners) listener();
          }
          if (
            event.type === "message.edited" ||
            event.type === "message.deleted"
          ) {
            later();
            return;
          }
          if (event.type !== "message") return;
          const { message } = event.data;
          update(id, (current) =>
            current?.state === "ready"
              ? {
                  state: "ready",
                  rooms: current.rooms.map((room) =>
                    room.id === message.roomId
                      ? {
                          ...room,
                          lastActivityAt: message.sentAt,
                          lastMessage: {
                            text: [...message.text].slice(0, PREVIEW).join(""),
                            fromMe: message.fromMe,
                          },
                        }
                      : room,
                  ),
                }
              : current,
          );
          later();
        },
      });
      if (end.kind === "aborted" || signal.aborted) return;
      failures += 1;
      await pause(Math.min(30_000, 1000 * 2 ** Math.min(failures, 5)), signal);
    }
  })();
  return () => {
    controller.abort();
    clearTimeout(refresh);
    stopReads();
  };
}

/**
 * Keep these adapters' rooms live until the returned function is called.
 * Every view that shows them shares one list request and one stream per
 * adapter; the last one to let go closes them.
 */
export function watchAdapterRooms(ids: readonly string[]): () => void {
  for (const id of ids) {
    const held = watched.get(id);
    if (held) held.refs += 1;
    else watched.set(id, { refs: 1, stop: start(id) });
  }
  return () => {
    for (const id of ids) {
      const held = watched.get(id);
      if (!held) continue;
      held.refs -= 1;
      if (held.refs > 0) continue;
      held.stop();
      watched.delete(id);
    }
  };
}

export function subscribeAdapterRooms(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function adapterRoomsSnapshot(): ReadonlyMap<string, AdapterRooms> {
  return snapshot;
}

/**
 * How many times this adapter's shared stream has said `ready`; it moves on
 * every (re)connection, so a view can read the declaration again when it does.
 */
export function adapterConnections(id: string): number {
  return connections.get(id) ?? 0;
}

/** The messenger's own unread counts summed over the rooms it listed, once it has. */
export function unreadTotal(entry: AdapterRooms | undefined): number | null {
  return entry?.state === "ready"
    ? entry.rooms.reduce((sum, room) => sum + room.unread, 0)
    : null;
}
