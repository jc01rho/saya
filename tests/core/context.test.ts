import { describe, expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { components } from "../../src/contract/decoded";
import { validateContext } from "../../src/contract/validators.js";
import { BoundedCache } from "../../src/core/cache";
import {
  type ContextTransport,
  ContextWindows,
  describeWindow,
  nextWindowLimit,
  WINDOW_LIMITS,
} from "../../src/core/context";
import { compareDecimalIds } from "../../src/core/ids";
import { ThreadPane } from "../../src/features/thread";
import { THREAD_COPY } from "../../src/features/thread/copy";
import type { HttpOutcome, JsonRequest } from "../../src/transport/http";
import { COPY, kindLabel } from "../../src/ui/copy";
import { FIRST_ROOM_ID, generateData } from "../fixtures/data";

type Context = components["schemas"]["Context"];
type Message = components["schemas"]["Message"];
type Room = components["schemas"]["Room"];

const data = generateData("baseline");
const ROOM = FIRST_ROOM_ID;
const room0 = data.rooms[0];
const ROWS = data.messages.get(ROOM);
if (!room0 || !ROWS?.length) throw new Error("Fixture lacks the first room");
const EPOCH = Date.UTC(2037, 3, 7, 9);

type Pending = {
  request: JsonRequest<"/context">;
  resolve: (outcome: HttpOutcome<Context>) => void;
  reject: (reason: unknown) => void;
};

/** A transport whose answers the test releases by hand, in any order. */
function fakeTransport() {
  const pending: Pending[] = [];
  const transport: ContextTransport = {
    request: (request) =>
      new Promise<HttpOutcome<Context>>((resolve, reject) => {
        pending.push({ request, resolve, reject });
      }),
  };
  const limitOf = (entry: Pending | undefined) =>
    entry?.request.query?.get("limit") ?? null;
  return { transport, pending, limitOf };
}

function roomFor(id: string, title: string): Room {
  return {
    id,
    title,
    kind: "group",
    type: "MultiChat",
    memberCount: 5,
    unread: 0,
    lastMessageId: null,
    lastActivityAt: null,
    readable: true,
  };
}

/** Invented Hangul rows with ids beyond 2^53; `from` shifts the whole run. */
function syntheticRows(roomId: string, count: number, from = 0): Message[] {
  return Array.from({ length: count }, (_, index) => {
    const serial = from + index;
    return {
      id: (28100000000000000n + BigInt(serial)).toString(),
      roomId,
      senderId: "38000000000000001",
      sender: "가상참여자-1",
      text: `가상 등불 ${serial}번, 합성 창의 ${serial}번째 줄입니다.`,
      kind: "text",
      sentAt: new Date(EPOCH + serial * 60_000).toISOString(),
      fromMe: false,
    };
  });
}

/** The newest `limit` of `all`, framed the way the bridge frames a window. */
function windowOf(room: Room, all: Message[], limit: number): Context {
  const messages = limit === 0 ? [] : all.slice(-limit);
  const newest = messages.at(-1) ?? null;
  const context: Context = {
    ok: true,
    room,
    messages,
    lastMessageFromMe: newest?.fromMe ?? null,
    attention: { mentionsMe: [], repliesToMe: [], mentionsEveryone: [] },
    coverage: {
      localOnly: true,
      reachesLatestKnown: true,
      catalogLatestMessageId: newest?.id ?? null,
      newestReadMessageId: newest?.id ?? null,
      hasEarlier: all.length > messages.length,
      storedLocally: all.length,
    },
  };
  if (!validateContext(context))
    throw new Error(
      `Synthetic context breaks the contract: ${validateContext.errors?.[0]?.instancePath}`,
    );
  return context;
}

const success = (data: Context): HttpOutcome<Context> => ({
  kind: "success",
  data,
});

/** Resolves on the store notification that ends the request; registered before the answer is released. */
function whenSettled(windows: ContextWindows, roomId: string) {
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      off();
      reject(new Error(`Timeout: window ${roomId} never settled`));
    }, 5_000);
    const off = windows.subscribe(roomId, () => {
      if (windows.getSnapshot(roomId).loading !== null) return;
      clearTimeout(timer);
      off();
      resolve();
    });
  });
}

/** One macrotask turn: every reaction to an already-released answer has run by then. */
const drain = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

function harness(roomId: string) {
  const fake = fakeTransport();
  const cache = new BoundedCache();
  cache.selectRoom(roomId);
  const windows = new ContextWindows(fake.transport, cache);
  const view = () =>
    describeWindow(
      cache.stores.getSnapshot(`thread.${roomId}`),
      windows.getSnapshot(roomId),
    );
  const html = () =>
    renderToStaticMarkup(
      createElement(ThreadPane, { stores: cache.stores, windows, roomId }),
    );
  return { ...fake, cache, windows, view, html };
}

const messageIds = (html: string) =>
  [...html.matchAll(/data-message-id="([^"]*)"/g)].map((m) => m[1] ?? "");

/** The log's first child is the coverage line with its hairline. */
const COVERAGE_FIRST =
  /<section[^>]*role="log"[^>]*>\s*<p[^>]*data-ui="coverage-line"[^>]*data-kind="coverage"/;

describe("newest windows", () => {
  test("widen 40 → 200 → 1000 and then stop: the contract has no older page", () => {
    expect([...WINDOW_LIMITS]).toEqual([40, 200, 1000]);
    expect(nextWindowLimit(40)).toBe(200);
    expect(nextWindowLimit(200)).toBe(1000);
    expect(nextWindowLimit(1000)).toBeNull();
  });

  test("open asks for the newest 40 and renders them oldest first", async () => {
    const { pending, limitOf, cache, windows, view, html } = harness(ROOM);
    windows.open(ROOM);
    expect(pending).toHaveLength(1);
    const [first] = pending;
    expect(first?.request.path).toBe("/context");
    expect(first?.request.query?.get("roomId")).toBe(ROOM);
    expect(limitOf(first)).toBe("40");

    // Not answered yet: unknown is not empty.
    expect(view().loading).toBe("open");
    expect(view().empty).toBe(false);
    expect(html()).not.toContain(THREAD_COPY.empty);

    // Newest first on the wire on purpose: the reader's order must not lean on it.
    const settled = whenSettled(windows, ROOM);
    first?.resolve(success(windowOf(room0, [...ROWS].reverse(), ROWS.length)));
    await settled;

    const expected = ROWS.map((row) => row.id).sort(compareDecimalIds);
    expect(cache.stores.getSnapshot(`order.${ROOM}`)).toEqual(expected);
    const ready = view();
    expect(ready.order).toEqual(expected);
    expect(ready.shown).toBe(ROWS.length);
    expect(ready.loading).toBeNull();
    expect(ready.empty).toBe(false);
    expect(ready.failure).toBeNull();
    // Everything stored is on screen: nothing to widen, no ceiling to state.
    expect(ready.edge).toBe("none");

    const markup = html();
    expect(messageIds(markup)).toEqual(expected);
    expect(markup).toMatch(COVERAGE_FIRST);
    expect(markup).toContain(COPY.coverageLocal);
    expect(markup).toContain(`${ROWS.length}개 저장`);
    expect(markup).not.toContain(COPY.coverageEarlier);
    expect(markup).not.toContain(COPY.coverageBehind);
    expect(markup).not.toContain('data-ui="widen"');
    expect(markup).not.toContain(COPY.ceiling);
    const oldest = ROWS[0];
    const newest = ROWS.at(-1);
    if (!oldest || !newest) throw new Error("unreachable");
    expect(markup.indexOf(oldest.text.split("\n")[0] ?? "")).toBeLessThan(
      markup.indexOf(newest.text.split("\n")[0] ?? ""),
    );
    // Both sides are turns in the same column; fromMe is a side, never a mirror.
    expect(markup).toContain('data-side="self"');
    expect(markup).toContain('data-side="other"');
  });

  test("an empty window says nothing is stored here, never that the conversation is missing", async () => {
    const { pending, windows, view, html } = harness(ROOM);
    windows.open(ROOM);
    const settled = whenSettled(windows, ROOM);
    pending[0]?.resolve(success(windowOf(room0, [], 0)));
    await settled;

    const ready = view();
    expect(ready.empty).toBe(true);
    expect(ready.shown).toBe(0);
    expect(ready.edge).toBe("none");
    expect(ready.coverage?.storedLocally).toBe(0);

    expect(THREAD_COPY.empty).toBe("이 기기에 저장된 대화가 없습니다");
    const markup = html();
    expect(markup).toContain(THREAD_COPY.empty);
    expect(markup).toMatch(COVERAGE_FIRST);
    expect(markup).toContain("0개 저장");
    expect(markup.replaceAll(THREAD_COPY.empty, "")).not.toContain(
      "대화가 없습니다",
    );
    expect(markup).not.toContain("존재하지 않");
  });

  test("a superseded, aborted or closed request never lands", async () => {
    const wide = roomFor("18491246151592999", "가상 관측소 넓은 창");
    const all = syntheticRows(wide.id, 1200);
    const { pending, limitOf, cache, windows, view } = harness(wide.id);
    windows.open(wide.id);
    windows.widen(wide.id);
    const [first, second] = pending;
    expect(pending).toHaveLength(2);
    expect(first?.request.signal.aborted).toBe(true);
    expect(limitOf(second)).toBe("200");
    expect(view().loading).toBe("widen");

    const settled = whenSettled(windows, wide.id);
    second?.resolve(success(windowOf(wide, all, 200)));
    await settled;
    expect(view().order).toHaveLength(200);
    expect(view().limit).toBe(200);

    // The older generation answers late with different bodies; nothing may change.
    const stale = windowOf(
      wide,
      all.map((row) => ({ ...row, text: `구세대 응답 ${row.id}` })),
      40,
    );
    first?.resolve(success(stale));
    await drain();
    const kept = cache.stores.getSnapshot(`thread.${wide.id}`);
    const newest = all.at(-1);
    if (!newest) throw new Error("unreachable");
    expect(kept.order).toHaveLength(200);
    expect(kept.messages[newest.id]?.text).toBe(newest.text);
    expect(view().loading).toBeNull();
    expect(view().limit).toBe(200);
    expect(view().failure).toBeNull();

    // A closed room's answer is discarded, and the room is not called settled.
    windows.close(wide.id);
    expect(view().empty).toBe(false);
    const other = roomFor("18491246151592998", "가상 관측소 닫힌 창");
    windows.open(other.id);
    const third = pending[2];
    expect(limitOf(third)).toBe("40");
    windows.close(other.id);
    expect(third?.request.signal.aborted).toBe(true);
    third?.resolve(success(windowOf(other, syntheticRows(other.id, 40), 40)));
    await drain();
    expect(cache.stores.getSnapshot(`order.${other.id}`)).toEqual([]);
    expect(windows.getSnapshot(other.id).settled).toBe(false);
    expect(windows.getSnapshot(other.id).loading).toBeNull();
  });

  test("a fresh window that does not touch the cached rows is marked, not glued on", async () => {
    const busy = roomFor("18491246151592997", "가상 관측소 바쁜 방");
    const before = syntheticRows(busy.id, 1200);
    const { pending, windows, view, html } = harness(busy.id);
    windows.open(busy.id);
    let settled = whenSettled(windows, busy.id);
    pending[0]?.resolve(success(windowOf(busy, before, 40)));
    await settled;

    // A hundred messages arrive while the reader is away; the next newest-40 starts after everything cached.
    const after = syntheticRows(busy.id, 1300);
    windows.close(busy.id);
    windows.open(busy.id);
    settled = whenSettled(windows, busy.id);
    pending[1]?.resolve(success(windowOf(busy, after, 40)));
    await settled;
    const boundary = after.at(-40);
    if (!boundary) throw new Error("unreachable");
    expect(view().order).toHaveLength(80);
    expect(view().discontinuities).toEqual([boundary.id]);
    const markup = html();
    const gap = markup.indexOf('data-ui="thread-gap"');
    expect(gap).toBeGreaterThan(-1);
    expect(markup.indexOf(`data-message-id="${boundary.id}"`)).toBeLessThan(
      gap,
    );
    expect(markup.indexOf(`data-message-id="${boundary.id}"`)).toBeGreaterThan(
      markup.indexOf(`data-message-id="${before.at(-1)?.id}"`),
    );

    // Widening spans the hole, so the marker goes.
    windows.widen(busy.id);
    settled = whenSettled(windows, busy.id);
    pending[2]?.resolve(success(windowOf(busy, after, 200)));
    await settled;
    expect(view().order).toHaveLength(200);
    expect(view().discontinuities).toEqual([]);
    expect(html()).not.toContain('data-ui="thread-gap"');
  });

  test("더 불러오기 widens to 200 and 1000, then states the ceiling and sends nothing more", async () => {
    const deep = roomFor("18491246151592996", "가상 관측소 깊은 방");
    const all = syntheticRows(deep.id, 1200);
    const { pending, limitOf, windows, view, html } = harness(deep.id);
    windows.open(deep.id);
    let settled = whenSettled(windows, deep.id);
    pending[0]?.resolve(success(windowOf(deep, all, 40)));
    await settled;
    expect(view().edge).toBe("widen");
    expect(view().coverage?.hasEarlier).toBe(true);
    let markup = html();
    expect(markup).toContain('data-ui="widen"');
    expect(markup).toContain(THREAD_COPY.widen);
    expect(markup).toContain(COPY.coverageEarlier);
    expect(markup).not.toContain(COPY.ceiling);

    expect(windows.widen(deep.id)).toBe(true);
    expect(limitOf(pending[1])).toBe("200");
    expect(view().edge).toBe("widening");
    expect(html()).toMatch(/data-ui="widen"[^>]*aria-disabled="true"/);
    settled = whenSettled(windows, deep.id);
    pending[1]?.resolve(success(windowOf(deep, all, 200)));
    await settled;
    expect(view().shown).toBe(200);
    expect(view().edge).toBe("widen");

    expect(windows.widen(deep.id)).toBe(true);
    expect(limitOf(pending[2])).toBe("1000");
    settled = whenSettled(windows, deep.id);
    pending[2]?.resolve(success(windowOf(deep, all, 1000)));
    await settled;
    expect(view().shown).toBe(1000);
    expect(view().limit).toBe(1000);
    expect(view().edge).toBe("ceiling");
    // Still true, still said: the 200 older rows are out of reach, not absent.
    expect(view().coverage?.hasEarlier).toBe(true);
    markup = html();
    expect(markup).toContain(COPY.ceiling);
    expect(markup).toContain(COPY.coverageEarlier);
    expect(markup).not.toContain('data-ui="widen"');
    expect(messageIds(markup)).toHaveLength(1000);

    expect(windows.widen(deep.id)).toBe(false);
    expect(pending).toHaveLength(3);
    expect(view().loading).toBeNull();

    // A room whose 1000 window is everything it holds has no ceiling to state.
    const whole = roomFor("18491246151592995", "가상 관측소 통째 방");
    const rows = syntheticRows(whole.id, 1000);
    const small = harness(whole.id);
    small.windows.open(whole.id);
    settled = whenSettled(small.windows, whole.id);
    small.pending[0]?.resolve(success(windowOf(whole, rows, 40)));
    await settled;
    expect(small.view().edge).toBe("widen");
    small.windows.widen(whole.id);
    settled = whenSettled(small.windows, whole.id);
    small.pending[1]?.resolve(success(windowOf(whole, rows, 200)));
    await settled;
    small.windows.widen(whole.id);
    settled = whenSettled(small.windows, whole.id);
    small.pending[2]?.resolve(success(windowOf(whole, rows, 1000)));
    await settled;
    expect(small.view().shown).toBe(1000);
    expect(small.view().edge).toBe("none");
    expect(small.view().coverage?.hasEarlier).toBe(false);
    expect(small.html()).not.toContain(COPY.ceiling);
  });

  test("bridge refusals keep their code and offer a retry; nothing is called empty", async () => {
    const locked = roomFor("18491246151592994", "가상 관측소 잠긴 방");
    const { pending, limitOf, windows, view, html } = harness(locked.id);
    windows.open(locked.id);
    let settled = whenSettled(windows, locked.id);
    pending[0]?.resolve({
      kind: "failure",
      status: 503,
      error: { code: "KEY_UNAVAILABLE", message: "synthetic" },
    });
    await settled;
    expect(view().failure).toEqual({
      kind: "bridge",
      outcome: {
        kind: "failure",
        status: 503,
        error: { code: "KEY_UNAVAILABLE", message: "synthetic" },
      },
    });
    expect(view().empty).toBe(false);
    let markup = html();
    expect(markup).toMatch(
      /data-ui="thread-notice"[^>]*data-code="KEY_UNAVAILABLE"/,
    );
    expect(markup).toContain(COPY.unreadable);
    expect(markup).toContain(THREAD_COPY.retry);
    expect(markup).not.toContain(THREAD_COPY.empty);

    // An invented code takes the default branch and is shown, not swallowed.
    windows.retry(locked.id);
    expect(limitOf(pending[1])).toBe("40");
    expect(view().failure).toBeNull();
    settled = whenSettled(windows, locked.id);
    pending[1]?.resolve({
      kind: "failure",
      status: 500,
      error: { code: "SYNTHETIC_UNKNOWN_CODE", message: "synthetic" },
    });
    await settled;
    markup = html();
    expect(markup).toContain('data-code="SYNTHETIC_UNKNOWN_CODE"');
    expect(markup).toContain(THREAD_COPY.failed);

    // No answer at all is a network failure, not an empty room.
    windows.retry(locked.id);
    settled = whenSettled(windows, locked.id);
    pending[2]?.reject(new TypeError("Failed to fetch"));
    await settled;
    expect(view().failure).toEqual({ kind: "network" });
    expect(html()).toContain(THREAD_COPY.network);
  });
});

describe("message shapes", () => {
  test("null quotes, unknown kinds, missing times and hostile text render truthfully", async () => {
    const odd = roomFor("18491246151592993", "가상 관측소 별난 방");
    const base = syntheticRows(odd.id, 9);
    const at = (index: number, patch: Partial<Message>): Message => {
      const row = base[index];
      if (!row) throw new Error("unreachable");
      return { ...row, ...patch };
    };
    const previous = base[0];
    if (!previous) throw new Error("unreachable");
    const malicious =
      '<img src="x" onerror="alert(1)"><script>alert(2)</script>';
    const rows: Message[] = [
      previous,
      at(1, {
        kind: "reply",
        text: "네, 새벽에 문제 없이 끝났습니다.",
        replyTo: {
          messageId: previous.id,
          senderId: previous.senderId,
          sender: previous.sender,
          text: previous.text,
          kind: previous.kind,
        },
      }),
      at(2, {
        kind: "reply",
        text: "그 메시지는 삭제된 것 같아요.",
        replyTo: {
          messageId: null,
          senderId: null,
          sender: null,
          text: null,
          kind: null,
        },
      }),
      at(3, { kind: "sticker-3d", text: "" }),
      at(4, { kind: "photo", text: "" }),
      at(5, { kind: "feed", text: "" }),
      at(6, { sentAt: null, text: "시간 정보가 없는 메시지입니다." }),
      at(7, { text: malicious }),
      at(8, {
        text: "@가상참여자-0 확인 부탁드립니다.",
        mentions: [
          {
            userId: "38000000000000000",
            name: "가상참여자-0",
            at: [0],
            length: 8,
          },
        ],
        mentionsMe: true,
        fromMe: false,
      }),
    ];
    const { pending, windows, html } = harness(odd.id);
    windows.open(odd.id);
    const settled = whenSettled(windows, odd.id);
    pending[0]?.resolve(success(windowOf(odd, rows, rows.length)));
    await settled;
    const markup = html();

    // A quote survives every member being null and says so.
    expect(markup).toMatch(
      new RegExp(
        `<blockquote[^>]*data-ui="quote"[^>]*data-empty="true"[^>]*>[\\s\\S]*?${COPY.quoteMissing}`,
      ),
    );
    // A full quote carries its speaker and text.
    expect(markup).toContain(previous.sender);
    expect(markup.match(/<blockquote[^>]*data-ui="quote"/g)?.length).toBe(2);

    // Non-text kinds get a label; an unrecognised kind describes itself.
    expect(kindLabel("sticker-3d")).toBe("sticker-3d");
    for (const kind of ["sticker-3d", "photo", "feed"]) {
      const label = kindLabel(kind);
      expect(label).not.toBeNull();
      expect(markup).toContain(`data-ui="kind-label">${label}<`);
    }

    // A missing time is said in words, never as Invalid Date.
    expect(markup).not.toContain("Invalid Date");
    expect(markup).toContain(COPY.unknownTime);

    // Bodies are text nodes: nothing in a message becomes markup.
    expect(markup).not.toContain("<img");
    expect(markup).not.toContain("<script");
    expect(markup).toContain("&lt;img src=&quot;x&quot;");

    // Mentions come from metadata, marked as a mention; the body text is untouched.
    expect(markup).toMatch(/<span[^>]*data-ui="mention"[^>]*>@가상참여자-0</);
    expect(markup).toContain("@가상참여자-0 확인 부탁드립니다.");
  });
});
