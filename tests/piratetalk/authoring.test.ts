import { describe, expect, test } from "bun:test";
import { validateExtension } from "../../src/contract/piratetalk/boundary";
import {
  editMentions,
  hasDecoration,
  insertMention,
  richTextRequest,
} from "../../src/features/piratetalk/authoring/model";

describe("native authoring request preparation", () => {
  test("emoji prefix uses UTF-16 while IDs remain strings", () => {
    const result = insertMention(
      "😀 ",
      3,
      3,
      { userId: "9007199254740995", name: "가나" },
      [],
    );
    expect(result).not.toBeNull();
    if (!result) throw new Error("Mention insertion failed");
    expect(result.mentions).toEqual([
      { userId: "9007199254740995", start: 3, length: 3 },
    ]);
    const request = richTextRequest("1", result.text, {
      roomId: "1",
      reply: { roomId: "1", messageId: "9007199254740993", text: "fixture" },
      mentions: result.mentions,
      mentionEveryone: false,
    });
    expect(validateExtension("SendRequest", request)).toBe(true);
    expect(request).toMatchObject({ replyTo: "9007199254740993" });
  });
  test("room switches cannot redirect selected reply", () => {
    expect(
      richTextRequest("2", "text", {
        roomId: "1",
        reply: { roomId: "1", messageId: "9007199254740993", text: "fixture" },
        mentions: [],
        mentionEveryone: false,
      }),
    ).toBeNull();
  });
  test("plain at text remains canonical and edits remove touched mentions", () => {
    expect(
      hasDecoration({ roomId: "1", mentions: [], mentionEveryone: false }),
    ).toBe(false);
    const mentions = [{ userId: "5", start: 0, length: 3 }];
    expect(editMentions("@가나 hi", "@다나 hi", mentions)).toEqual([]);
    expect(editMentions("@가나 hi", "x @가나 hi", mentions)).toEqual([
      { userId: "5", start: 2, length: 3 },
    ]);
    expect(
      insertMention("😀", 1, 1, { userId: "5", name: "가나" }, []),
    ).toBeNull();
  });
});
