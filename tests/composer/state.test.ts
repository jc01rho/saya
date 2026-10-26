import { describe, expect, test } from "bun:test";
import {
  ComposerState,
  type ConsentFingerprint,
  ImeEnterGuard,
} from "../../src/features/composer/state";

const roomId = "18491246151592761";
const text = "한글 조합은 원문 그대로입니다.\n둘째 줄";

function fingerprint(revision: number): ConsentFingerprint {
  return { roomId, text, openRoom: true, draftRevision: revision };
}

describe("composer consent state", () => {
  test("a consent is usable only for its exact room, text, openRoom and draft revision", () => {
    const state = new ComposerState();
    const first = state.setText(roomId, text);
    expect(first.text).toBe(text);
    expect(state.grantConsent(fingerprint(first.revision))).toBe(true);
    expect(state.hasConsent(fingerprint(first.revision))).toBe(true);

    const changed = state.setText(roomId, `${text}!`);
    expect(state.hasConsent(fingerprint(first.revision))).toBe(false);
    expect(state.hasConsent(fingerprint(changed.revision))).toBe(false);
    expect(state.grantConsent(fingerprint(changed.revision))).toBe(false);

    const current: ConsentFingerprint = {
      roomId,
      text: `${text}!`,
      openRoom: true,
      draftRevision: changed.revision,
    };
    expect(state.grantConsent(current)).toBe(true);
    expect(state.hasConsent({ ...current, openRoom: false })).toBe(false);
    expect(state.hasConsent({ ...current, roomId: "18491246151592762" })).toBe(
      false,
    );
  });

  test("does not turn Hangul composition Enter into a send, including after compositionend", () => {
    const ime = new ImeEnterGuard();
    const composingEnter = {
      key: "Enter",
      shiftKey: false,
      isComposing: true,
      keyCode: 229,
    };

    ime.start();
    expect(ime.decide(composingEnter)).toBe("ignore");
    ime.end();
    // WebKit reports the committing key after compositionend; it is still the
    // IME's key, and says so with 229.
    expect(
      ime.decide({
        key: "Enter",
        shiftKey: false,
        isComposing: false,
        keyCode: 229,
      }),
    ).toBe("ignore");
    expect(
      ime.decide({
        key: "Enter",
        shiftKey: false,
        isComposing: false,
        keyCode: 13,
      }),
    ).toBe("send");

    expect(
      ime.decide({
        key: "Enter",
        shiftKey: true,
        isComposing: false,
        keyCode: 13,
      }),
    ).toBe("newline");
  });

  test("the Enter after a committed Hangul word sends it", () => {
    const ime = new ImeEnterGuard();

    // 한글 typed, then a space: the IME takes the space and ends the
    // composition. Nothing here is the send's Enter.
    ime.start();
    expect(
      ime.decide({
        key: " ",
        shiftKey: false,
        isComposing: true,
        keyCode: 229,
      }),
    ).toBe("none");
    ime.end();

    // This one is the person's, and it must not be swallowed as the IME's.
    expect(
      ime.decide({
        key: "Enter",
        shiftKey: false,
        isComposing: false,
        keyCode: 13,
      }),
    ).toBe("send");
  });

  test("composition events block Enter even when its native flags are missing", () => {
    const ime = new ImeEnterGuard();
    const enter = {
      key: "Enter",
      shiftKey: false,
      isComposing: false,
      keyCode: 13,
    };
    ime.start();
    expect(ime.decide(enter)).toBe("ignore");
    ime.end();
    expect(ime.decide(enter)).toBe("send");
  });

  test("native isComposing blocks Enter without a compositionstart or 229", () => {
    const ime = new ImeEnterGuard();
    expect(
      ime.decide({
        key: "Enter",
        shiftKey: false,
        isComposing: true,
        keyCode: 13,
      }),
    ).toBe("ignore");
  });

  test("keeps each room draft exactly and gives changes a new revision", () => {
    const state = new ComposerState();
    const first = state.setText(roomId, "  앞뒤 공백도 보냅니다  ");
    const secondRoom = "18491246151592762";
    state.setText(secondRoom, "다른 방 초안");

    expect(state.getDraft(roomId)).toEqual(first);
    expect(state.getDraft(secondRoom).text).toBe("다른 방 초안");
    const changed = state.setText(roomId, "  앞뒤 공백도 보냅니다  \n");
    expect(changed.revision).toBeGreaterThan(first.revision);
    expect(changed.text).toBe("  앞뒤 공백도 보냅니다  \n");
  });
});
