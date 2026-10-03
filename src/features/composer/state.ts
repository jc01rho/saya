import type { Mutation } from "../../transport/piratetalk";

export type Draft = Readonly<{
  text: string;
  revision: number;
  selectionStart: number;
  selectionEnd: number;
}>;

export type ConsentFingerprint = Readonly<{
  roomId: string;
  text: string;
  openRoom: boolean;
  draftRevision: number;
}>;

const EMPTY_DRAFT: Draft = Object.freeze({
  text: "",
  revision: 0,
  selectionStart: 0,
  selectionEnd: 0,
});

function sameFingerprint(
  left: ConsentFingerprint,
  right: ConsentFingerprint,
): boolean {
  return (
    left.roomId === right.roomId &&
    left.text === right.text &&
    left.openRoom === right.openRoom &&
    left.draftRevision === right.draftRevision
  );
}

/**
 * Per-tab drafts and one pending consent. This state deliberately never
 * normalizes text: the textarea's exact value is the value sent to the bridge.
 */
export class ComposerState {
  private readonly drafts = new Map<string, Draft>();
  private readonly pending = new Map<
    string,
    Readonly<{ text: string; kind: "posting" | "uncertain" | "submitted" }>
  >();
  private consent: ConsentFingerprint | null = null;
  private revision = 0;
  private readonly listeners = new Set<() => void>();
  getSnapshot = () => this.revision;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
  private publish(): void {
    this.revision++;
    for (const listener of this.listeners) listener();
  }

  getPending(roomId: string) {
    return this.pending.get(roomId);
  }

  setPending(
    roomId: string,
    text: string,
    kind: "posting" | "uncertain" | "submitted",
  ): void {
    this.pending.set(roomId, { text, kind });
    this.publish();
  }

  dismissPending(roomId: string): void {
    this.pending.delete(roomId);
    this.publish();
  }

  applyMutation(fingerprint: ConsentFingerprint, result: Mutation): void {
    switch (result.outcome) {
      case "confirmed":
        if (this.matches(fingerprint)) this.clear(fingerprint.roomId);
        this.dismissPending(fingerprint.roomId);
        break;
      case "unconfirmed":
        this.setPending(fingerprint.roomId, fingerprint.text, "uncertain");
        break;
      case "rejected":
        this.dismissPending(fingerprint.roomId);
        break;
    }
  }

  getDraft(roomId: string): Draft {
    return this.drafts.get(roomId) ?? EMPTY_DRAFT;
  }

  setText(roomId: string, text: string): Draft {
    const previous = this.getDraft(roomId);
    if (previous.text === text) return previous;
    const next: Draft = {
      text,
      revision: previous.revision + 1,
      selectionStart: text.length,
      selectionEnd: text.length,
    };
    this.drafts.set(roomId, next);
    this.consent = null;
    return next;
  }

  setSelection(
    roomId: string,
    selectionStart: number,
    selectionEnd: number,
  ): void {
    const previous = this.getDraft(roomId);
    if (
      previous.selectionStart === selectionStart &&
      previous.selectionEnd === selectionEnd
    )
      return;
    this.drafts.set(roomId, { ...previous, selectionStart, selectionEnd });
  }

  clear(roomId: string): Draft {
    return this.setText(roomId, "");
  }

  grantConsent(fingerprint: ConsentFingerprint): boolean {
    if (!this.matches(fingerprint)) return false;
    this.consent = fingerprint;
    return true;
  }

  hasConsent(fingerprint: ConsentFingerprint): boolean {
    return this.consent !== null && sameFingerprint(this.consent, fingerprint);
  }

  revokeConsent(): void {
    this.consent = null;
  }

  private matches(fingerprint: ConsentFingerprint): boolean {
    const draft = this.getDraft(fingerprint.roomId);
    return (
      draft.text === fingerprint.text &&
      draft.revision === fingerprint.draftRevision
    );
  }
}

/** Every engine still marks a key its IME swallowed with the legacy 229. */
const IME_KEY_CODE = 229;

/**
 * Browsers disagree on whether the committing Enter reports isComposing before
 * or after compositionend, so the key itself decides rather than its position
 * in that order: an IME-consumed key carries keyCode 229 everywhere, and
 * Firefox, which does not use 229, reports isComposing on it instead.
 *
 * Arming a one-key guard at compositionend cannot tell the committing Enter
 * from the send that follows an ordinary Hangul word — every composition ends,
 * including the one a space finished — so the person's next Enter was eaten.
 */
export class ImeEnterGuard {
  private composing = false;

  start(): void {
    this.composing = true;
  }

  end(): void {
    this.composing = false;
  }

  decide(
    event: Pick<KeyboardEvent, "key" | "shiftKey" | "isComposing" | "keyCode">,
  ): "send" | "newline" | "ignore" | "none" {
    if (event.key !== "Enter") return "none";
    if (this.composing || event.isComposing || event.keyCode === IME_KEY_CODE)
      return "ignore";
    return event.shiftKey ? "newline" : "send";
  }
}
