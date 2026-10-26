import { describe, expect, test } from "bun:test";
import type { components } from "../../src/contract/decoded";
import {
  ReconnectController,
  resumeUrl,
} from "../../src/coordination/reconnect";
import { BoundedCache } from "../../src/core/cache";
import { Reconciler } from "../../src/core/reconcile";
import type { HttpOutcome, JsonRequest } from "../../src/transport/http";
import type { SseOutcome } from "../../src/transport/sse";
import { FIRST_ROOM_ID, generateData } from "../fixtures/data";
import { deferred } from "../harness/barriers";

type Context = components["schemas"]["Context"];
type Message = components["schemas"]["Message"];
const data = generateData();
const room = data.rooms[0];
const rows = data.messages.get(FIRST_ROOM_ID);
if (!room || !rows) throw new Error("Missing synthetic data");
const ROOM = FIRST_ROOM_ID;
function message(index: number): Message {
  const row = rows?.[index];
  if (!row) throw new Error("Missing synthetic row");
  return row;
}
function context(messages: Message[]): Context {
  if (!room) throw new Error("Missing room");
  return {
    ok: true,
    room,
    messages,
    lastMessageFromMe: messages.at(-1)?.fromMe ?? null,
    attention: { mentionsMe: [], repliesToMe: [], mentionsEveryone: [] },
    coverage: {
      localOnly: true,
      reachesLatestKnown: true,
      catalogLatestMessageId: messages.at(-1)?.id ?? null,
      newestReadMessageId: messages.at(-1)?.id ?? null,
      hasEarlier: false,
      storedLocally: messages.length,
    },
  };
}
function setup(options: ConstructorParameters<typeof Reconciler>[1] = {}) {
  const cache = new BoundedCache();
  cache.selectRoom(ROOM);
  const reconcile = new Reconciler(cache, options);
  return {
    cache,
    reconcile,
    thread: () => cache.stores.getSnapshot(`thread.${ROOM}`),
  };
}

describe("snapshot and stream reconciliation", () => {
  test("context fills a SafeBot cover without a false conflict or journal overwrite", () => {
    const { reconcile, thread } = setup();
    const shown = { ...message(0), covered: "safebot" as const };
    const hidden = { ...shown, text: "" };
    const ticket = reconcile.beginContext(ROOM);
    reconcile.observe(hidden);
    expect(reconcile.completeContext(ticket, context([shown])).kind).toBe(
      "applied",
    );
    expect(thread().messages[shown.id]?.text).toBe(shown.text);
    expect(thread().messages[shown.id]?.covered).toBe("safebot");
    expect(reconcile.getSnapshot(ROOM).conflicts).toEqual([]);
    expect(reconcile.observe(hidden)).toBe("duplicate");
    expect(thread().messages[shown.id]?.text).toBe(shown.text);
    // A real nonempty text edit is still a conflict, not a cover refill.
    expect(
      reconcile.observe({ ...shown, text: "Another synthetic body" }),
    ).toBe("gap");
    expect(reconcile.getSnapshot(ROOM).conflicts).toHaveLength(1);
  });

  test("a stale generation cannot erase a newer observed id; current snapshot merges its journal", () => {
    const { reconcile, thread } = setup();
    const first = reconcile.beginContext(ROOM);
    reconcile.observe(message(0));
    const second = reconcile.beginContext(ROOM);
    expect(second.revision).toBe(1);
    expect(first.signal.aborted).toBe(true);
    reconcile.observe(message(2));
    expect(reconcile.completeContext(first, context([])).kind).toBe(
      "discarded",
    );
    expect(
      reconcile.completeContext(second, context([message(0), message(1)])).kind,
    ).toBe("applied");
    expect(thread().order).toEqual([
      message(0).id,
      message(1).id,
      message(2).id,
    ]);
  });

  test("cancelled HTTP requests carry a generation and revision and never apply", async () => {
    const pending: {
      request: JsonRequest<"/context">;
      result: ReturnType<typeof deferred<HttpOutcome<Context>>>;
    }[] = [];
    const { reconcile, thread } = setup({
      http: {
        request(request) {
          const result = deferred<HttpOutcome<Context>>();
          pending.push({ request, result });
          return result.promise;
        },
      },
    });
    const controller = new AbortController();
    const answer = reconcile.request({
      path: "/context",
      query: new URLSearchParams({ roomId: ROOM }),
      signal: controller.signal,
    });
    const request = pending[0];
    expect(request?.request.generationKey).toBe(`context:${ROOM}`);
    expect(reconcile.getSnapshot(ROOM).request).toMatchObject({
      generation: 1,
      revision: 0,
    });
    controller.abort();
    request?.result.resolve({ kind: "success", data: context([message(0)]) });
    expect(await answer).toEqual({ kind: "discarded" });
    expect(thread().order).toEqual([]);
  });

  test("same id and structurally identical payload is a notification/revision no-op", () => {
    const { reconcile, cache, thread } = setup();
    reconcile.observe(message(0));
    const snapshot = thread();
    const revision = reconcile.getSnapshot(ROOM).revision;
    let notifications = 0;
    cache.stores.subscribe(`thread.${ROOM}`, () => notifications++);
    expect(reconcile.observe({ ...message(0) })).toBe("duplicate");
    expect(thread()).toBe(snapshot);
    expect(reconcile.getSnapshot(ROOM).revision).toBe(revision);
    expect(notifications).toBe(0);
  });

  test("conflicts keep snapshot and observation provenance and request an authoritative retry", () => {
    const resyncs: string[] = [];
    const { reconcile, thread } = setup({ onResync: (id) => resyncs.push(id) });
    const ticket = reconcile.beginContext(ROOM);
    reconcile.observe(message(0));
    const conflicting = { ...message(0), text: "가상 충돌 본문" };
    expect(reconcile.completeContext(ticket, context([conflicting])).kind).toBe(
      "resync",
    );
    expect(thread().messages[message(0).id]?.text).toBe(message(0).text);
    const conflict = reconcile.getSnapshot(ROOM).conflicts[0];
    expect(conflict?.versions.map((v) => v.source.kind).sort()).toEqual([
      "snapshot",
      "stream",
    ]);
    expect(conflict?.versions.map((v) => v.message.text)).toContain(
      conflicting.text,
    );
    expect(resyncs).toEqual([ROOM]);
    const retry = reconcile.beginContext(ROOM);
    expect(reconcile.completeContext(retry, context([conflicting])).kind).toBe(
      "applied",
    );
    expect(thread().messages[message(0).id]?.text).toBe(conflicting.text);
    expect(reconcile.getSnapshot(ROOM).conflicts).toEqual([]);
  });

  test("journal overflow discloses a gap and never emits a complete snapshot", () => {
    const resyncs: string[] = [];
    const { reconcile, thread } = setup({
      journalEvents: 1,
      onResync: (id) => resyncs.push(id),
    });
    const ticket = reconcile.beginContext(ROOM);
    reconcile.observe(message(0));
    reconcile.observe(message(1));
    expect(reconcile.getSnapshot(ROOM).gaps).toContain("journal-overflow");
    expect(reconcile.completeContext(ticket, context([])).kind).toBe("resync");
    expect(reconcile.getSnapshot(ROOM).complete).toBe(false);
    expect(thread().order).toEqual([message(0).id, message(1).id]);
    expect(resyncs).toEqual([ROOM]);
  });

  test("byte overflow is bounded even with one giant message", () => {
    const { reconcile } = setup({ journalBytes: 100 });
    const ticket = reconcile.beginContext(ROOM);
    reconcile.observe(message(0));
    expect(reconcile.getSnapshot(ROOM).journalBytes).toBe(0);
    expect(reconcile.completeContext(ticket, context([])).kind).toBe("resync");
  });

  test("cursor advances only after synchronous cache apply or an explicit discarded-frame gap", () => {
    const order: string[] = [];
    const { reconcile, cache, thread } = setup({
      onGap: (id, reason) => {
        if (id === ROOM) {
          expect(thread().cursor).toBe(message(0).id);
          order.push(reason);
        }
      },
    });
    cache.stores.subscribe(`message.${ROOM}.${message(0).id}`, () => {
      expect(thread().cursor).toBeNull();
      order.push("applied");
    });
    reconcile.accept({
      type: "message",
      data: { ok: true, message: message(0) },
    });
    expect(thread().cursor).toBeNull();
    reconcile.accept({
      type: "cursor",
      data: { ok: true, cursor: { [ROOM]: message(0).id } },
    });
    expect(thread().cursor).toBe(message(0).id);
    reconcile.accept({ type: "discarded-frame", bytes: 300_000 });
    reconcile.accept({
      type: "cursor",
      data: { ok: true, cursor: { [ROOM]: message(1).id } },
    });
    expect(order).toEqual(["applied", "discarded-frame"]);
    expect(thread().cursor).toBe(message(1).id);
    expect(thread().order).toEqual([message(0).id]);
  });

  test("an equal cursor cannot hide a discarded frame and ready cannot clear it", () => {
    const { reconcile } = setup();
    reconcile.accept({
      type: "cursor",
      data: { ok: true, cursor: { [ROOM]: message(0).id } },
    });
    reconcile.accept({ type: "discarded-frame", bytes: 1 });
    reconcile.accept({
      type: "ready",
      data: { ok: true, resumed: true, cursor: { [ROOM]: message(0).id } },
    });
    reconcile.accept({
      type: "cursor",
      data: { ok: true, cursor: { [ROOM]: message(0).id } },
    });
    expect(reconcile.getSnapshot(ROOM).gaps).toContain("discarded-frame");
  });

  test("evicted replay stays evicted using a bounded frontier independent of the cursor", () => {
    const cache = new BoundedCache({ activeMessages: 1 });
    cache.selectRoom(ROOM);
    const reconcile = new Reconciler(cache);
    reconcile.observe(message(0));
    reconcile.observe(message(1));
    expect(reconcile.observe(message(0))).toBe("duplicate");
    expect(cache.stores.getSnapshot(`thread.${ROOM}`).order).toEqual([
      message(1).id,
    ]);
  });

  test("1000-room cursor ingress retains at most five since parameters and discloses other live starts", () => {
    const { reconcile, cache } = setup();
    const cursor: Record<string, string> = {};
    for (let index = 0; index < 1000; index++) {
      const id = (BigInt(ROOM) + BigInt(index)).toString();
      cursor[id] = "28000000000000046";
      if (index < 5) cache.putMessages(id, []);
    }
    reconcile.accept({ type: "cursor", data: { ok: true, cursor } });
    const selected = reconcile.resume();
    const url = resumeUrl(selected.cursor);
    expect(Object.keys(selected.cursor)).toHaveLength(5);
    expect(selected.liveGap).toBe(true);
    expect(
      new URL(url, "http://127.0.0.1").searchParams.getAll("since"),
    ).toHaveLength(5);
    expect(new TextEncoder().encode(url).byteLength).toBeLessThanOrEqual(8192);
    console.log("CAPTURED_RESUME_URL", url);
    cache.putMessages("new-room", []);
    expect(
      Object.hasOwn(reconcile.resume().cursor, (BigInt(ROOM) + 1n).toString()),
    ).toBe(false);
    expect(() => resumeUrl({ ["1".repeat(8192)]: "2" })).toThrow(RangeError);
    expect(() => resumeUrl(cursor)).toThrow(RangeError);
  });
});

class FakeClock {
  time = 0;
  serial = 0;
  timers = new Map<number, { due: number; fn: () => void }>();
  setTimeout = (fn: () => void, ms: number) => {
    const id = ++this.serial;
    this.timers.set(id, { due: this.time + ms, fn });
    return id;
  };
  clearTimeout = (id: unknown) => {
    this.timers.delete(id as number);
  };
  advance(ms: number) {
    const end = this.time + ms;
    while (true) {
      const next = [...this.timers]
        .filter(([, item]) => item.due <= end)
        .sort((a, b) => a[1].due - b[1].due)[0];
      if (!next) break;
      this.time = next[1].due;
      this.timers.delete(next[0]);
      next[1].fn();
    }
    this.time = end;
  }
}

describe("reconnect without heartbeat assumptions", () => {
  test("fake-clock backoff uses 0.5, 1, 2, 4...30 seconds with full jitter", async () => {
    const clock = new FakeClock();
    let attempts = 0;
    const reconnect = new ReconnectController({
      clock,
      random: () => 0.5,
      open: async () => {
        attempts++;
        return { kind: "eof" };
      },
    });
    await reconnect.start();
    for (const cap of [500, 1000, 2000, 4000, 8000, 16000, 30000, 30000]) {
      expect(reconnect.getSnapshot()).toMatchObject({
        state: "waiting",
        capMs: cap,
        delayMs: cap / 2,
      });
      const before = attempts;
      clock.advance(cap / 2 - 1);
      expect(attempts).toBe(before);
      clock.advance(1);
      await reconnect.currentAttempt();
      expect(attempts).toBe(before + 1);
    }
    await reconnect.stop();
    expect(clock.timers.size).toBe(0);
  });

  test("auth, protocol and resource errors are terminal, BUSY retries", async () => {
    const outcomes: SseOutcome[] = [
      {
        kind: "failure",
        status: 401,
        error: { code: "UNAUTHORIZED", message: "synthetic" },
      },
      { kind: "protocol-error" },
      { kind: "resource-limited" },
      { kind: "error", error: { code: "UNAUTHORIZED", message: "synthetic" } },
    ];
    for (const outcome of outcomes) {
      const clock = new FakeClock();
      const reconnect = new ReconnectController({
        clock,
        open: async () => outcome,
      });
      await reconnect.start();
      reconnect.hint();
      clock.advance(1_000_000);
      expect(reconnect.getSnapshot().state).toBe("terminal");
      expect(clock.timers.size).toBe(0);
    }
    const reconnect = new ReconnectController({
      clock: new FakeClock(),
      open: async () => ({
        kind: "failure",
        status: 503,
        error: { code: "BUSY", message: "synthetic" },
      }),
    });
    await reconnect.start();
    expect(reconnect.getSnapshot().state).toBe("waiting");
    await reconnect.stop();
  });

  test("idle, online and visibility never prove health or kill an active connection", async () => {
    const clock = new FakeClock();
    const result = deferred<SseOutcome>();
    let count = 0;
    const reconnect = new ReconnectController({
      clock,
      open: async (signal) => {
        count++;
        signal.addEventListener(
          "abort",
          () => result.resolve({ kind: "aborted" }),
          { once: true },
        );
        return result.promise;
      },
    });
    const active = reconnect.start();
    clock.advance(86_400_000);
    reconnect.hint();
    expect(count).toBe(1);
    expect(reconnect.getSnapshot().state).toBe("connecting");
    expect(clock.timers.size).toBe(0);
    reconnect.received();
    expect(reconnect.getSnapshot().state).toBe("receiving");
    clock.advance(86_400_000);
    expect(count).toBe(1);
    await reconnect.stop();
    await active;
    expect(reconnect.getSnapshot().state).toBe("stopped");
  });
});
