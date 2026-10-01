import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import {
  canEdit,
  type MessageAbilities,
  Turn,
  toggledReactions,
} from "../../src/features/adapters/turn";
import type { AdapterMessage } from "../../src/transport/adapters";

const SENT = "2037-04-07T09:00:00Z";
const now = new Date("2037-04-07T09:10:00Z");

const message = (overrides: Partial<AdapterMessage> = {}): AdapterMessage => ({
  id: "7",
  roomId: "-100123",
  senderId: "42",
  sender: "가상참여자-1",
  text: "가상 등불 12번 줄입니다.",
  kind: "text",
  sentAt: SENT,
  fromMe: false,
  ...overrides,
});

const nothing: MessageAbilities = {
  reply: false,
  edit: undefined,
  delete: undefined,
  react: false,
};
const everything: MessageAbilities = {
  reply: true,
  edit: { maxAgeSeconds: 3600 },
  delete: { forEveryone: true },
  react: true,
};

const render = (
  value: AdapterMessage,
  abilities: MessageAbilities,
  options: { open?: boolean; quoted?: AdapterMessage } = {},
) =>
  renderToStaticMarkup(
    <ol>
      <Turn
        adapterId="example"
        files={false}
        message={value}
        previous={undefined}
        quoted={options.quoted}
        now={now}
        abilities={abilities}
        open={options.open ?? false}
        note={null}
        busy={false}
        onOpen={() => {}}
        onAction={() => {}}
      />
    </ol>,
  );

describe("which reactions a tap leaves", () => {
  const reactions = [
    { emoji: "A", count: 2, mine: true },
    { emoji: "B", count: 1, mine: false },
  ];

  test("a tap on one of mine takes it off; on another, adds it", () => {
    expect(toggledReactions(reactions, "A", undefined)).toEqual([]);
    expect(toggledReactions(reactions, "B", undefined)).toEqual(["A", "B"]);
    expect(toggledReactions(undefined, "C", undefined)).toEqual(["C"]);
  });

  test("past the messenger's limit the oldest of mine goes", () => {
    expect(toggledReactions(reactions, "B", 1)).toEqual(["B"]);
  });
});

describe("which messages can be edited", () => {
  test("my own text, inside the messenger's window", () => {
    const edit = { maxAgeSeconds: 3600 };
    expect(canEdit(message({ fromMe: true }), edit, now.getTime())).toBe(true);
    expect(
      canEdit(message({ fromMe: true }), { maxAgeSeconds: 60 }, now.getTime()),
    ).toBe(false);
    expect(canEdit(message({ fromMe: true }), {}, now.getTime())).toBe(true);
  });

  test("not someone else's, not media, and not without the feature", () => {
    const edit = { maxAgeSeconds: 3600 };
    expect(canEdit(message(), edit, now.getTime())).toBe(false);
    expect(
      canEdit(message({ fromMe: true, kind: "media" }), edit, now.getTime()),
    ).toBe(false);
    expect(canEdit(message({ fromMe: true }), undefined, now.getTime())).toBe(
      false,
    );
  });
});

describe("a message's tools", () => {
  test("nothing declared draws no door and plain reaction counts", () => {
    const html = render(
      message({ reactions: [{ emoji: "A", count: 3, mine: false }] }),
      nothing,
    );
    expect(html).not.toContain('data-ui="adapter-more"');
    expect(html).toContain('data-ui="adapter-reactions"');
    expect(html).not.toContain("<button");
    expect(html).toContain("A 3명");
  });

  test("someone else's message offers reactions and a reply, never an edit or a delete", () => {
    const html = render(message(), everything, { open: true });
    expect(html).toContain('data-ui="adapter-more"');
    expect(html).toContain('data-ui="adapter-tools"');
    expect(html).toContain('data-ui="adapter-reply"');
    expect(html).not.toContain('data-ui="adapter-edit"');
    expect(html).not.toContain('data-ui="adapter-delete"');
  });

  test("my own recent text also offers an edit and a delete", () => {
    const html = render(message({ fromMe: true }), everything, { open: true });
    expect(html).toContain('data-ui="adapter-edit"');
    expect(html).toContain('data-ui="adapter-delete"');
  });

  test("a reply quotes what it answers, or says it is outside what was loaded", () => {
    const quoted = message({ id: "6", text: "가상 원문입니다." });
    const reply = message({ replyTo: "6" });
    const shown = render(reply, nothing, { quoted });
    expect(shown).toContain('data-ui="adapter-quote"');
    expect(shown).toContain("가상 원문입니다.");
    expect(render(reply, nothing)).toContain(
      "불러온 범위 밖의 메시지에 대한 답장",
    );
  });
});
