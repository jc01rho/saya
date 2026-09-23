import {
  createElement as h,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";
import { createRoot } from "react-dom/client";
import type { components } from "../../src/contract/decoded";
import { IndexedMetadata } from "../../src/coordination/metadata";
import { BoundedCache } from "../../src/core/cache";
import { ContextWindows } from "../../src/core/context";
import {
  type SendAttempt,
  type SendDraft,
  SendLedger,
} from "../../src/core/send";
import { Composer } from "../../src/features/composer";
import { Ledge } from "../../src/features/thread/ledge";
import { HttpClient } from "../../src/transport/http";

type Room = components["schemas"]["Room"];
type Message = components["schemas"]["Message"];

export type LedgeEvent =
  | { type: "ledger"; attempts: readonly SendAttempt[] }
  | { type: "context"; roomId: string }
  | { type: "room"; roomId: string };

/** Test-only controls. The ledger, windows, stores, Ledge and Composer are the shipped modules. */
export interface LedgeSurfaceControl {
  /** A whole fresh attempt: a new UUID with the newest observed id as its baseline, then its dry run. */
  preview(text: string): Promise<SendAttempt | undefined>;
  /** Consumes the consent and runs the one real POST; resolves with the final state. */
  confirm(uuid: string): Promise<string | undefined>;
  dismiss(uuid: string): void;
  readBack(): void;
  setRoom(roomId: string): void;
  snapshot(): readonly SendAttempt[];
  close(): void;
}

/*
 * The shell geometry the application gives the conversation pane (App.module.css),
 * reduced to what this fixture needs: a cream list column that the ledge must
 * never cross, and a header row above the pane. Below 768px the list is a
 * separate view, as in the product.
 */
const SHELL_CSS = `
[data-ui="fixture-shell"] { display: grid; grid-template-columns: var(--list-width) minmax(0, 1fr); height: 100dvh; overflow: hidden; background: var(--field-wall); color: var(--ink); }
[data-ui="fixture-list"] { display: grid; align-content: start; gap: var(--space-4); min-width: 0; padding: var(--space-12) 0; background: var(--field-list); border-inline-end: var(--rule-width) solid var(--rule); }
[data-ui="fixture-list"] a { display: block; padding: var(--space-8) var(--space-16); color: var(--ink); font-size: var(--text-title); line-height: var(--leading-title); text-decoration: none; }
[data-ui="fixture-list"] a[aria-current="page"] { font-weight: 600; }
[data-ui="fixture-main"] { display: grid; grid-template-rows: auto minmax(0, 1fr); min-width: 0; min-height: 0; }
[data-ui="fixture-head"] { display: flex; align-items: center; min-height: var(--space-48); padding: var(--space-12) var(--space-16); }
[data-ui="fixture-head"] h1 { font-size: var(--text-title); font-weight: 600; line-height: var(--leading-title); }
@media (max-width: 767.98px) {
  [data-ui="fixture-shell"] { grid-template-columns: minmax(0, 1fr); }
  [data-ui="fixture-list"] { display: none; }
}
`;

function emit(event: LedgeEvent) {
  (Reflect.get(window, "ledgeEvent") as (event: LedgeEvent) => void)(event);
}

/**
 * Composes the real send ledger, HTTP boundary, IndexedDB metadata, bounded
 * cache, context windows, the Ledge (wall + rule + ground) and the real
 * Composer against the synthetic bridge. Application wiring (src/app) is the
 * lead's; this proves the modules, not that the app already mounts them.
 */
export async function mountLedgeFixture(rooms: Room[]) {
  const initial = rooms[0];
  if (!initial) throw new Error("The fixture needs at least one room");
  const first: Room = initial;
  const metadata = await IndexedMetadata.open(indexedDB);
  const http = new HttpClient();
  const cache = new BoundedCache();
  cache.setCatalog(rooms);
  cache.selectRoom(first.id);
  const windows = new ContextWindows(http, cache);
  const ledger = new SendLedger({ http, metadata, isReady: () => true });
  await ledger.recover();
  ledger.subscribe(() =>
    emit({ type: "ledger", attempts: ledger.getSnapshot() }),
  );
  // Read-back rows become candidates only; nothing here links or retries.
  for (const room of rooms) {
    windows.subscribe(room.id, () => {
      const state = windows.getSnapshot(room.id);
      if (!state.settled || state.loading) return;
      const thread = cache.stores.getSnapshot(`thread.${room.id}`);
      for (const id of thread.order) {
        const message = thread.messages[id];
        if (message) ledger.observe(message as Message);
      }
      emit({ type: "context", roomId: room.id });
    });
  }
  let currentRoomId = first.id;

  function Surface(): ReactNode {
    const [roomId, setRoomId] = useState(first.id);
    const [draft, setDraft] = useState<string | null>(null);
    currentRoomId = roomId;
    useEffect(() => {
      cache.selectRoom(roomId);
      emit({ type: "room", roomId });
    }, [roomId]);
    useLayoutEffect(() => {
      const control: LedgeSurfaceControl = {
        preview: async (text) => {
          const order = cache.stores.getSnapshot(
            `thread.${currentRoomId}`,
          ).order;
          const uuid = ledger.create({
            roomId: currentRoomId,
            text,
            openRoom: true,
            draftRevision: 0,
            baseline: order.at(-1) ?? null,
          });
          await ledger.preview(uuid);
          return ledger.get(uuid);
        },
        confirm: async (uuid) => {
          const attempt = ledger.get(uuid);
          if (!attempt) throw new Error(`Unknown attempt ${uuid}`);
          await ledger.submit(uuid, attempt.draft);
          return ledger.get(uuid)?.state;
        },
        dismiss: (uuid) => ledger.dismiss(uuid),
        readBack: () => windows.retry(currentRoomId),
        setRoom: (id) => setRoomId(id),
        snapshot: () => ledger.getSnapshot(),
        close: () => {
          ledger.stop();
          for (const room of rooms) windows.close(room.id);
          metadata.close();
        },
      };
      Reflect.set(window, "ledgeSurface", control);
    }, []);
    const room = rooms.find((item) => item.id === roomId) ?? first;
    return h(
      "div",
      { "data-ui": "fixture-shell" },
      h("style", null, SHELL_CSS),
      h(
        "nav",
        { "data-ui": "fixture-list", "aria-label": "대화 목록" },
        rooms.map((item) =>
          h(
            "a",
            {
              key: item.id,
              href: `#/room/${encodeURIComponent(item.id)}`,
              "data-ui": "fixture-room",
              "data-room-id": item.id,
              "aria-current": item.id === roomId ? "page" : undefined,
              onClick: (event: { preventDefault(): void }) => {
                event.preventDefault();
                setRoomId(item.id);
              },
            },
            item.title,
          ),
        ),
      ),
      h(
        "main",
        { "data-ui": "fixture-main" },
        h("header", { "data-ui": "fixture-head" }, h("h1", null, room.title)),
        h(
          Ledge,
          {
            stores: cache.stores,
            windows,
            roomId,
            ledger,
            onNewAttempt: (next: SendDraft) => setDraft(next.text),
          },
          h(Composer, { http, roomId }),
          draft !== null
            ? h(
                "p",
                { className: "sr-only", "data-ui": "fixture-restored-draft" },
                draft,
              )
            : null,
        ),
      ),
    );
  }

  const root = document.createElement("div");
  root.id = "root";
  document.body.style.margin = "0";
  document.body.append(root);
  createRoot(root).render(h(Surface));
}
