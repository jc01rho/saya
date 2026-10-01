import { useMemo, useSyncExternalStore } from "react";

/**
 * Hash routes. Room ids are opaque wire strings: they are percent-encoded into
 * the hash and decoded back, never parsed, compared numerically or shortened.
 */
export type Route =
  | { kind: "rooms" }
  | { kind: "room"; roomId: string }
  | { kind: "adapters" }
  | { kind: "adapter-room"; adapterId: string; roomId: string };

export const ROOMS_HASH = "#/rooms";
export const ADAPTERS_HASH = "#/adapters";

export function adapterRoomHash(adapterId: string, roomId: string): string {
  return `#/adapters/${encodeURIComponent(adapterId)}/${encodeURIComponent(roomId)}`;
}

const ADAPTER_ROOM = /^\/adapters\/([^/]+)\/([^/]+)$/;

export function roomHash(roomId: string): string {
  return `#/room/${encodeURIComponent(roomId)}`;
}

const INDEX: Route = { kind: "rooms" };
// `#/room/<id>` is the route this app writes; `#/rooms/<id>` is what
// core/ids.ts#roomHash spells, accepted so neither helper yields a dead link.
const ROOM = /^\/rooms?\/([^/]+)$/;

export function parseHash(hash: string): Route {
  const path = hash.replace(/^#/, "").replace(/\?.*$/, "");
  if (path === "/adapters") return { kind: "adapters" };
  const adapterRoom = ADAPTER_ROOM.exec(path);
  if (adapterRoom?.[1] && adapterRoom[2]) {
    try {
      return {
        kind: "adapter-room",
        adapterId: decodeURIComponent(adapterRoom[1]),
        roomId: decodeURIComponent(adapterRoom[2]),
      };
    } catch {
      return { kind: "adapters" };
    }
  }
  const match = ROOM.exec(path);
  if (!match?.[1]) return INDEX;
  try {
    const roomId = decodeURIComponent(match[1]);
    return roomId ? { kind: "room", roomId } : INDEX;
  } catch {
    // A malformed escape is not a room; the index is the honest fallback.
    return INDEX;
  }
}

function subscribeHash(listener: () => void) {
  window.addEventListener("hashchange", listener);
  return () => window.removeEventListener("hashchange", listener);
}

function readHash() {
  return window.location.hash;
}

/** The current route; the snapshot is the hash string so an unchanged hash never rerenders. */
export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribeHash, readHash, readHash);
  return useMemo(() => parseHash(hash), [hash]);
}
