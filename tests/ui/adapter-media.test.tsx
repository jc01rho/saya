import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { actionMember, groupMessages } from "../../src/features/adapters/group";
import { photoData, Turn } from "../../src/features/adapters/turn";
import type {
  AdapterAttachment,
  AdapterMessage,
} from "../../src/transport/adapters";

const message = (
  id: string,
  extra: Partial<AdapterMessage> = {},
): AdapterMessage => ({
  id,
  roomId: "synthetic",
  sender: "Synthetic",
  senderId: "sender",
  kind: "media",
  text: "",
  fromMe: false,
  sentAt: "2037-04-07T09:00:00Z",
  ...extra,
});
const image = (id: string): AdapterAttachment => ({
  id,
  kind: "image",
  mimeType: "image/png",
  width: 640,
  height: 480,
});
const abilities = {
  reply: false,
  edit: undefined,
  delete: undefined,
  react: false,
};
function render(members: AdapterMessage[], files = true) {
  return renderToStaticMarkup(
    <Turn
      adapterId="synthetic"
      message={actionMember(members)}
      members={members}
      files={files}
      avatars={false}
      previous={undefined}
      quoted={undefined}
      now={new Date("2037-04-07T09:01:00Z")}
      abilities={abilities}
      open={false}
      busy={false}
      note={null}
      onOpen={() => {}}
      onAction={() => {}}
    />,
  );
}

describe("adapter albums", () => {
  test("groups only consecutive, same-sender, same-direction, non-service members", () => {
    const a = message("a", { groupId: "album" });
    const b = message("b", { groupId: "album", text: "caption" });
    const c = message("c", { groupId: "album", senderId: "other" });
    const d = message("d", { groupId: "album", fromMe: true });
    const e = message("e", { groupId: "album", kind: "service" });
    expect(groupMessages([a, b, c, d, e, a, message("f"), a])).toEqual([
      [a, b],
      [c],
      [d],
      [e],
      [a],
      [message("f")],
      [a],
    ]);
    expect(actionMember([a, b])).toBe(b);
    expect(actionMember([a])).toBe(a);
    expect(groupMessages([])).toEqual([]);
  });
  test("maps opaque media ids, dimensions and only drawable image kinds", () => {
    const mapped = photoData("synthetic", [
      image("a&b"),
      { id: "s", kind: "sticker", mimeType: "image/png" },
      { id: "svg", kind: "image", mimeType: "image/svg+xml" },
    ]);
    expect(mapped).toEqual({
      url: "/adapters/synthetic/media?id=a%26b",
      width: 640,
      height: 480,
      count: 1,
      images: [
        { url: "/adapters/synthetic/media?id=a%26b", width: 640, height: 480 },
      ],
    });
  });
  test("one grid combines every member, keeps captions, ids, reactions and last time", () => {
    const members = Array.from({ length: 5 }, (_, i) =>
      message(String(i), {
        groupId: "album",
        attachments: [image(String(i))],
        text: i === 1 ? "https://example.com synthetic" : "",
        sentAt: `2037-04-07T09:0${i}:00Z`,
        reactions: [{ emoji: `R${i}`, count: 1, mine: false }],
      }),
    );
    const html = render(members);
    expect(html.match(/data-ui="photo"/g)).toHaveLength(4);
    expect(html).toContain("+1");
    expect(html).toContain('dateTime="2037-04-07T09:04:00Z"');
    for (const member of members) {
      expect(html).toContain(`data-message-id="${member.id}"`);
      expect(html).toContain(`R${member.id}`);
    }
    expect(html).toContain('href="https://example.com"');
    const gated = render(members, false);
    expect(gated).not.toContain('data-ui="photo"');
    expect(gated).not.toContain("/media?id=");
  });
  test("multiple images share a grid, video plays, animations loop and unknown types download", () => {
    const html = render([
      message("one", {
        attachments: [
          image("1"),
          image("2"),
          image("3"),
          { id: "v", kind: "video", mimeType: "video/mp4" },
          { id: "a", kind: "animation", mimeType: "video/webm" },
          { id: "gif", kind: "animation", mimeType: "image/gif" },
          { id: "bad", kind: "video", mimeType: "video/unknown" },
        ],
      }),
    ]);
    expect(html.match(/data-ui="photo"/g)).toHaveLength(3);
    expect(html).toContain('data-ui="video"');
    expect(html.match(/data-ui="adapter-animation"/g)).toHaveLength(2);
    expect(html).toContain('loop=""');
    expect(html).toContain('autoPlay=""');
    expect(html).toContain('muted=""');
    expect(html).toContain('data-ui="adapter-file"');
  });
});
