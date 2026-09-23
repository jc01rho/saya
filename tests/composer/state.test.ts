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
    const composingEnter = { key: "Enter", shiftKey: false, isComposing: true };

    ime.start();
    expect(ime.decide(composingEnter)).toBe("ignore");
    ime.end();
    expect(
      ime.decide({ key: "Enter", shiftKey: false, isComposing: false }),
    ).toBe("ignore");
    expect(
      ime.decide({ key: "Enter", shiftKey: false, isComposing: false }),
    ).toBe("send");

    expect(
      ime.decide({ key: "Enter", shiftKey: true, isComposing: false }),
    ).toBe("newline");
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
