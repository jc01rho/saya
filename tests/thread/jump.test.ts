import { describe, expect, test } from "bun:test";
import type { components } from "../../src/contract/decoded";
import {
  countNewer,
  findReplyTarget,
  isFarFromEnd,
  isJumpable,
  mayBeOlder,
  nextJumpStep,
} from "../../src/features/thread/jump";

type Message = components["schemas"]["Message"];
type ReplySource = components["schemas"]["ReplySource"];

const row = (
  id: string,
  senderId: string,
  text: string,
  extra: Partial<Message> = {},
): Message => ({
  id,
  roomId: "9001",
  senderId,
  sender: `사람${senderId}`,
  text,
  kind: "text",
  sentAt: "2026-09-30T01:00:00Z",
  fromMe: false,
  ...extra,
});

const source = (extra: Partial<ReplySource>): ReplySource => ({
  messageId: null,
  senderId: null,
  sender: null,
  text: null,
  kind: null,
  ...extra,
});

const ROWS = [
  row("100", "1", "회의는 세 시에 시작합니다"),
  row("101", "2", "알겠습니다"),
  row("102", "1", "회의는 세 시에 시작합니다"),
  row("103", "1", "자료는 공유 폴더에 있습니다"),
  row("104", "2", "네 확인했어요", { kind: "reply" }),
  row("105", "1", "회의는 세 시에 시작합니다"),
];

describe("a reply finds the message it answered", () => {
  test("the reply's own messageId wins over any text match", () => {
    const quote = source({
      messageId: "100",
      senderId: "1",
      text: "회의는 세 시에 시작합니다",
    });
    expect(findReplyTarget(quote, "104", ROWS)).toBe("100");
  });

  test("without an id, the nearest earlier row by the same person with the same opening", () => {
    const quote = source({
      senderId: "1",
      text: "회의는 세 시에 시작합니다",
    });
    expect(findReplyTarget(quote, "104", ROWS)).toBe("102");
  });

  test("a row after the reply is never its original", () => {
    const quote = source({
      senderId: "1",
      text: "회의는 세 시에 시작합니다",
    });
    expect(findReplyTarget(quote, "101", ROWS)).toBe("100");
    expect(findReplyTarget(quote, "100", ROWS)).toBeNull();
  });

  test("the same words from someone else do not match", () => {
    const quote = source({
      senderId: "2",
      text: "회의는 세 시에 시작합니다",
    });
    expect(findReplyTarget(quote, "105", ROWS)).toBeNull();
  });

  test("the name decides only when the id is absent", () => {
    const quote = source({ sender: "사람1", text: "자료는 공유 폴더" });
    expect(findReplyTarget(quote, "104", ROWS)).toBe("103");
  });

  test("a quote clipped or longer than the row still agrees on its opening", () => {
    const long = source({
      senderId: "1",
      text: "자료는 공유 폴더에 있습니다 그리고 아주 긴 덧붙임이 이어집니다",
    });
    expect(findReplyTarget(long, "104", ROWS)).toBe("103");
  });

  test("a quote with no text matches on kind", () => {
    const rows = [row("10", "1", "사진", { kind: "photo" }), ...ROWS];
    expect(
      findReplyTarget(source({ senderId: "1", kind: "photo" }), "104", rows),
    ).toBe("10");
  });

  test("an id not on screen falls back to matching, and an all-null quote points nowhere", () => {
    const quote = source({
      messageId: "50",
      senderId: "1",
      text: "자료는 공유 폴더에 있습니다",
    });
    expect(findReplyTarget(quote, "104", ROWS)).toBe("103");
    expect(findReplyTarget(source({}), "104", ROWS)).toBeNull();
    expect(isJumpable(source({}))).toBe(false);
    expect(isJumpable(null)).toBe(false);
    expect(isJumpable(source({ messageId: "1" }))).toBe(true);
  });

  test("text alone without a speaker is not enough", () => {
    expect(
      findReplyTarget(source({ text: "알겠습니다" }), "104", ROWS),
    ).toBeNull();
  });
});

describe("the search widens only while the original can still be older", () => {
  test("an id older than the window can turn up; a newer missing one cannot", () => {
    expect(mayBeOlder(source({ messageId: "99" }), ROWS)).toBe(true);
    expect(mayBeOlder(source({ messageId: "103" }), ROWS)).toBe(false);
    expect(mayBeOlder(source({ senderId: "1" }), ROWS)).toBe(true);
  });

  test("each step: reveal, widen, wait or give up", () => {
    const base = {
      found: null,
      loading: false,
      failed: false,
      older: true,
    };
    expect(nextJumpStep({ ...base, found: "7", edge: "widen" })).toEqual({
      kind: "reveal",
      id: "7",
    });
    expect(nextJumpStep({ ...base, edge: "widen" }).kind).toBe("widen");
    expect(nextJumpStep({ ...base, edge: "widening" }).kind).toBe("wait");
    expect(nextJumpStep({ ...base, loading: true, edge: "none" }).kind).toBe(
      "wait",
    );
    expect(nextJumpStep({ ...base, edge: "ceiling" }).kind).toBe("missing");
    expect(nextJumpStep({ ...base, edge: "none" }).kind).toBe("missing");
    expect(nextJumpStep({ ...base, failed: true, edge: "widen" }).kind).toBe(
      "missing",
    );
    expect(nextJumpStep({ ...base, older: false, edge: "widen" }).kind).toBe(
      "missing",
    );
  });
});

describe("the way down", () => {
  test("counts rows newer than the one the reader left", () => {
    const order = ["98", "99", "100", "101", "102"];
    expect(countNewer(order, "100")).toBe(2);
    expect(countNewer(order, "102")).toBe(0);
    expect(countNewer(order, null)).toBe(0);
    // The row the reader left may have been trimmed away; ids still order.
    expect(countNewer(["101", "102"], "100")).toBe(2);
  });

  test("appears only a full screen above the end", () => {
    const at = (scrollTop: number) =>
      isFarFromEnd({ scrollTop, scrollHeight: 3000, clientHeight: 800 });
    expect(at(2200)).toBe(false);
    expect(at(1401)).toBe(false);
    expect(at(1400)).toBe(true);
    expect(at(0)).toBe(true);
    expect(
      isFarFromEnd({ scrollTop: 0, scrollHeight: 0, clientHeight: 0 }),
    ).toBe(false);
  });
});
