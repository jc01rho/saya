import { expect, test } from "bun:test";
import type { components } from "../../src/contract/decoded";
import { BoundedCache } from "../../src/core/cache";
import { ContextWindows } from "../../src/core/context";
import type { HttpOutcome, JsonRequest } from "../../src/transport/http";
import { FIRST_ROOM_ID, generateData } from "../fixtures/data";
import { bounded, deferred } from "../harness/barriers";

type Context = components["schemas"]["Context"];

function setup() {
  const pending: {
    request: JsonRequest<"/context">;
    answer: ReturnType<typeof deferred<HttpOutcome<Context>>>;
  }[] = [];
  const cache = new BoundedCache();
  const windows = new ContextWindows(
    {
      request(request) {
        const answer = deferred<HttpOutcome<Context>>();
        pending.push({ request, answer });
        return answer.promise;
      },
    },
    cache,
  );
  return { pending, windows };
}

test("live refills coalesce behind the initial context without settling or cancelling it", async () => {
  const { windows, pending } = setup();
  windows.open(FIRST_ROOM_ID);
  windows.refresh(FIRST_ROOM_ID);
  windows.refresh(FIRST_ROOM_ID);
  expect(pending).toHaveLength(1);
  expect(pending[0]?.request.signal.aborted).toBe(false);
  expect(windows.getSnapshot(FIRST_ROOM_ID)).toMatchObject({
    settled: false,
    loading: "open",
  });

  const refreshed = deferred<void>();
  const off = windows.subscribe(FIRST_ROOM_ID, () => {
    if (windows.getSnapshot(FIRST_ROOM_ID).loading === "retry")
      refreshed.resolve();
  });
  const room = generateData().rooms[0];
  if (!room) throw new Error("Missing synthetic room");
  pending[0]?.answer.resolve({
    kind: "success",
    data: {
      ok: true,
      room,
      messages: [],
      lastMessageFromMe: null,
      attention: { mentionsMe: [], repliesToMe: [], mentionsEveryone: [] },
      coverage: {
        localOnly: true,
        reachesLatestKnown: true,
        catalogLatestMessageId: null,
        newestReadMessageId: null,
        hasEarlier: false,
        storedLocally: 0,
      },
    },
  });
  await bounded(refreshed.promise, "queued refill starts");
  off();
  expect(pending).toHaveLength(2);
  expect(pending[1]?.request.query?.get("limit")).toBe("40");
  expect(pending[1]?.request.query?.has("messageId")).toBe(false);
  expect(windows.getSnapshot(FIRST_ROOM_ID).settled).toBe(true);
  windows.closeAll();
  expect(pending[1]?.request.signal.aborted).toBe(true);
});

test("closing a session aborts its initial read and forgets queued live refills", async () => {
  const { windows, pending } = setup();
  windows.open(FIRST_ROOM_ID);
  windows.refresh(FIRST_ROOM_ID);
  windows.closeAll();
  expect(pending[0]?.request.signal.aborted).toBe(true);
  const first = pending[0];
  if (!first) throw new Error("Missing request");
  // Await the exact released request; its previously registered reaction runs first.
  first.answer.resolve({ kind: "discarded" });
  await first.answer.promise;
  expect(pending).toHaveLength(1);
  expect(windows.getSnapshot(FIRST_ROOM_ID)).toMatchObject({
    loading: null,
    settled: false,
  });
});
