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
  private consent: ConsentFingerprint | null = null;

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

/**
 * Browsers disagree on whether the committing Enter reports isComposing before
 * or after compositionend. Consume both forms and the first Enter after end;
 * a later non-Enter key releases that one-key guard.
 */
export class ImeEnterGuard {
  private composing = false;
  private consumeNextEnter = false;

  start(): void {
    this.composing = true;
    this.consumeNextEnter = false;
  }

  end(): void {
    this.composing = false;
    this.consumeNextEnter = true;
  }

  decide(
    event: Pick<KeyboardEvent, "key" | "shiftKey" | "isComposing">,
  ): "send" | "newline" | "ignore" | "none" {
    if (event.key !== "Enter") {
      this.consumeNextEnter = false;
      return "none";
    }
    if (this.composing || event.isComposing || this.consumeNextEnter) {
      this.consumeNextEnter = false;
      return "ignore";
    }
    return event.shiftKey ? "newline" : "send";
  }
}
