import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { components } from "../../src/contract/decoded";
import { MessageBubble } from "../../src/ui/MessageBubble";

type Message = components["schemas"]["Message"];

const EPOCH = "2037-04-07T09:00:00+00:00";
const now = new Date(EPOCH);

const message = (overrides: Partial<Message> = {}): Message => ({
  id: "28000000000000101",
  roomId: "18491246151592762",
  senderId: "38000000000000001",
  sender: "가상참여자-1",
  text: "가상 등불 12번 줄입니다.",
  kind: "text",
  sentAt: EPOCH,
  fromMe: false,
  ...overrides,
});

const render = (value: Message, onRevisions?: () => void) =>
  renderToStaticMarkup(
    <MessageBubble message={value} now={now} onRevisions={onRevisions} />,
  );

describe("reactions", () => {
  test("each kind shows its count, and the accessible name says how many", () => {
    const html = render(
      message({
        reactions: [
          { label: "좋아요", count: 3 },
          { label: "최고", count: 12, code: "emoticon-7" },
        ],
      }),
    );
    expect(html).toContain('data-ui="reactions"');
    expect(html).toContain("좋아요 3명");
    expect(html).toContain("최고 12명");
    expect(html.match(/<li/g)).toHaveLength(2);
  });

  test("absent reactions draw nothing — an absent key is the negative", () => {
    expect(render(message())).not.toContain('data-ui="reactions"');
  });
});

describe("edited", () => {
  test("수정됨 is a plain word where no history can be asked", () => {
    const html = render(message({ edited: true }));
    expect(html).toContain('data-ui="edited"');
    expect(html).toContain(">수정됨<");
    expect(html).not.toContain("<button");
  });

  test("with a handler it opens the history", () => {
    const html = render(message({ edited: true }), () => {});
    expect(html).toMatch(/<button[^>]*data-ui="edited"/);
    expect(html).toContain('aria-label="수정됨, 수정 기록 보기"');
  });

  test("an unedited message never offers history", () => {
    expect(render(message(), () => {})).not.toContain('data-ui="edited"');
  });
});

describe("covered by SafeBot", () => {
  test("an empty covered body says it is covered, not that it is empty", () => {
    const html = render(message({ covered: "safebot", text: "" }));
    expect(html).toContain("세이프봇이 가린 메시지입니다");
    expect(html).not.toContain("본문 없음");
  });

  test("a covered body the caller asked to see is shown, and marked as covered", () => {
    const html = render(
      message({
        covered: "safebot",
        text: "가상 주소 https://example.invalid/가상",
      }),
    );
    expect(html).toContain("세이프봇이 가림");
    expect(html).toContain("가상 주소");
  });
});
