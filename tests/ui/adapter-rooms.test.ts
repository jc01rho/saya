import { afterEach, expect, test } from "bun:test";
import {
  adapterRoomsSnapshot,
  subscribeAdapterRooms,
  unreadTotal,
  watchAdapterRooms,
} from "../../src/features/adapters/liveRooms";
import { noteRead } from "../../src/features/adapters/rooms";
import { bounded, deferred } from "../harness/barriers";

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});

const json = (body: unknown) =>
  new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
  });

const declaration = {
  ok: true,
  contract: { version: "0.2.2" },
  adapter: { name: "synthetic-adapter", version: "0.0.0" },
  provider: { id: "example", name: "Example" },
  account: { kind: "user" },
  revision: "0123456789abcdef",
  features: { "rooms.list": {} },
};

function until(predicate: () => boolean, label: string) {
  const reached = deferred<void>();
  const check = () => {
    if (predicate()) reached.resolve();
  };
  const unsubscribe = subscribeAdapterRooms(check);
  check();
  return bounded(reached.promise, label).finally(unsubscribe);
}

test("watchers share one list and one stream; a live message moves its preview, a read mark zeroes its count, and the last watcher closes the stream", async () => {
  const id = "shared-one";
  let roomLists = 0;
  let streams = 0;
  let closed = false;
  const streamClosed = deferred<void>();
  const streamOpen = deferred<ReadableStreamDefaultController<Uint8Array>>();
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.endsWith("/capabilities")) return json(declaration);
    if (url.endsWith("/rooms")) {
      roomLists += 1;
      return json({
        ok: true,
        complete: true,
        rooms: [
          { id: "r1", title: "Synthetic one", kind: "group", unread: 3 },
          { id: "r2", title: "Synthetic two", kind: "direct", unread: 2 },
        ],
      });
    }
    streams += 1;
    init?.signal?.addEventListener("abort", () => {
      closed = true;
      streamClosed.resolve();
    });
    return new Response(
      new ReadableStream<Uint8Array>({
        start: (controller) => streamOpen.resolve(controller),
      }),
      { headers: { "content-type": "text/event-stream" } },
    );
  }) as unknown as typeof fetch;

  const first = watchAdapterRooms([id]);
  const second = watchAdapterRooms([id]);
  await until(
    () => adapterRoomsSnapshot().get(id)?.state === "ready",
    "rooms listed",
  );
  expect(unreadTotal(adapterRoomsSnapshot().get(id))).toBe(5);
  expect(roomLists).toBe(1);

  const stream = await bounded(streamOpen.promise, "stream opened");
  expect(streams).toBe(1);
  const frame = (event: string, data: unknown) =>
    new TextEncoder().encode(
      `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`,
    );
  stream.enqueue(frame("ready", { ok: true, resumed: false, cursor: {} }));
  stream.enqueue(
    frame("message", {
      ok: true,
      message: {
        id: "9",
        roomId: "r2",
        sender: "Synthetic",
        text: "Synthetic arrival",
        kind: "text",
        sentAt: "2037-04-07T09:00:00Z",
        fromMe: false,
      },
    }),
  );
  await until(() => {
    const entry = adapterRoomsSnapshot().get(id);
    return (
      entry?.state === "ready" &&
      entry.rooms.some((room) => room.lastMessage?.text === "Synthetic arrival")
    );
  }, "preview moved");

  noteRead(id, "r1");
  expect(unreadTotal(adapterRoomsSnapshot().get(id))).toBe(2);

  first();
  expect(closed).toBe(false);
  second();
  await bounded(streamClosed.promise, "stream closed");
});

test("an adapter outside this client's contract range is a problem, not a list", async () => {
  const id = "shared-two";
  let roomLists = 0;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    if (String(input).endsWith("/capabilities"))
      return json({ ...declaration, contract: { version: "0.3.0" } });
    roomLists += 1;
    return json({ ok: true, complete: true, rooms: [] });
  }) as unknown as typeof fetch;
  const stop = watchAdapterRooms([id]);
  await until(
    () => adapterRoomsSnapshot().get(id)?.state === "problem",
    "refused range",
  );
  expect(roomLists).toBe(0);
  expect(unreadTotal(adapterRoomsSnapshot().get(id))).toBeNull();
  stop();
});
