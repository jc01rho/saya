import type { components } from "../contract/decoded";
import type { Attempt, MetadataStore } from "../coordination/metadata";
import type { HttpClient } from "../transport/http";
import { compareDecimalIds } from "./ids";

type Message = components["schemas"]["Message"];
export type SendAttemptState =
  | "editing"
  | "previewing"
  | "awaiting-consent"
  | "posting"
  | "submitted"
  | "unknown"
  | "rejected";
export type SendFingerprint = Readonly<{
  roomId: string;
  text: string;
  openRoom: boolean;
  draftRevision: number;
}>;
export type SendDraft = SendFingerprint &
  Readonly<{
    /** Newest observed context ID before dispatch; null means no matching baseline. */
    baseline: string | null;
  }>;
export type SendAttempt = Readonly<{
  uuid: string;
  draft: SendDraft;
  state: SendAttemptState;
  reason: string | null;
  preview: Readonly<{ room: string; wouldClearDraft: boolean }> | null;
  candidates: readonly string[];
  /** An explicit local user choice, never a receipt or a delivered state. */
  linkedMessageId: string | null;
}>;
export type SendLedgerOptions = {
  http: HttpClient;
  metadata: MetadataStore;
  /** Only the ready origin leader may dispatch; followers forward commands to it. */
  isReady: () => boolean;
  timeoutMs?: number;
};
const LIMIT_COUNT = 32;
const LIMIT_BYTES = 1024 * 1024;
const encoder = new TextEncoder();
const final = (state: SendAttemptState) =>
  state === "submitted" || state === "unknown" || state === "rejected";
function sameFingerprint(a: SendFingerprint, b: SendFingerprint) {
  return (
    a.roomId === b.roomId &&
    a.text === b.text &&
    a.openRoom === b.openRoom &&
    a.draftRevision === b.draftRevision
  );
}
function body(draft: SendDraft, dryRun: boolean) {
  return {
    room: draft.roomId,
    text: draft.text,
    openRoom: draft.openRoom,
    dryRun,
  };
}

/**
 * One instance per origin leader. The local queue serializes real POSTs; the
 * atomic UUID tombstone prevents a repeated command from dispatching after a
 * leader change. Never replay the queue or create a UUID on somebody's behalf.
 * Metadata contains only UUID/status. Drafts and observed candidates stay here.
 */
export class SendLedger {
  private snapshot: readonly SendAttempt[] = Object.freeze([]);
  private readonly listeners = new Set<() => void>();
  private readonly consumed = new Set<string>();
  private readonly jobs = new Map<string, Promise<void>>();
  private readonly controllers = new Map<string, AbortController>();
  private queue: Promise<void> = Promise.resolve();
  private stopped = false;

  constructor(private readonly options: SendLedgerOptions) {}

  readonly getSnapshot = () => this.snapshot;
  readonly subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  get(uuid: string) {
    return this.snapshot.find((item) => item.uuid === uuid);
  }

  /** Forwarders preserve the originating UUID; they must never mint a replacement on retry. */
  create(draft: SendDraft, uuid: string = crypto.randomUUID()): string {
    if (this.get(uuid)) return uuid;
    if (!draft.text.trim()) throw new Error("Empty send text");
    const attempt: SendAttempt = Object.freeze({
      uuid,
      draft: Object.freeze({ ...draft }),
      state: "editing",
      reason: null,
      preview: null,
      candidates: Object.freeze([]),
      linkedMessageId: null,
    });
    this.publish([...this.snapshot, attempt]);
    return attempt.uuid;
  }

  edit(uuid: string, draft: SendDraft): void {
    const attempt = this.get(uuid);
    if (!attempt || this.consumed.has(uuid)) return;
    if (!draft.text.trim()) throw new Error("Empty send text");
    this.controllers.get(uuid)?.abort();
    this.replace(uuid, {
      draft: Object.freeze({ ...draft }),
      state: "editing",
      preview: null,
      reason: null,
    });
  }

  async preview(uuid: string): Promise<void> {
    const attempt = this.get(uuid);
    if (!attempt || this.consumed.has(uuid)) return;
    this.controllers.get(uuid)?.abort();
    const controller = new AbortController();
    this.controllers.set(uuid, controller);
    this.replace(uuid, { state: "previewing", preview: null, reason: null });
    try {
      const outcome = await this.options.http.request({
        path: "/send",
        body: body(attempt.draft, true),
        signal: controller.signal,
        generationKey: `send-preview:${uuid}`,
      });
      if (controller.signal.aborted) return;
      if (outcome.kind !== "success") {
        this.replace(uuid, {
          state: "rejected",
          reason:
            outcome.kind === "failure"
              ? outcome.error.code
              : "preview-unavailable",
        });
      } else if (
        !outcome.data.dryRun ||
        outcome.data.submitted ||
        outcome.data.roomId !== attempt.draft.roomId
      ) {
        this.replace(uuid, { state: "rejected", reason: "invalid-preview" });
      } else {
        this.replace(uuid, {
          state: "awaiting-consent",
          preview: Object.freeze({
            room: outcome.data.room,
            wouldClearDraft: outcome.data.wouldClearDraft === true,
          }),
        });
      }
    } catch {
      if (!controller.signal.aborted)
        this.replace(uuid, {
          state: "rejected",
          reason: "preview-unavailable",
        });
    } finally {
      if (this.controllers.get(uuid) === controller)
        this.controllers.delete(uuid);
    }
  }

  /** Consent is consumed synchronously, before any await or React render. */
  submit(
    uuid: string,
    current: SendFingerprint,
    signal?: AbortSignal,
  ): Promise<void> {
    const running = this.jobs.get(uuid);
    if (running) return running;
    const attempt = this.get(uuid);
    if (
      !attempt ||
      this.consumed.has(uuid) ||
      attempt.state !== "awaiting-consent"
    )
      return Promise.resolve();
    if (!sameFingerprint(attempt.draft, current)) {
      this.replace(uuid, { state: "editing", preview: null });
      return Promise.resolve();
    }
    this.consumed.add(uuid);
    this.replace(uuid, { state: "posting", reason: null, preview: null });
    const task = this.queue.then(() => this.dispatch(uuid, signal));
    this.jobs.set(uuid, task);
    this.queue = task;
    return task.finally(() => {
      this.jobs.delete(uuid);
    });
  }

  /** Call only on takeover/startup, not while this leader has active requests. */
  async recover(): Promise<readonly Attempt[]> {
    if (this.jobs.size) throw new Error("Cannot recover active send jobs");
    return this.options.metadata.update((state) => {
      for (const attempt of state.attempts)
        if (attempt.status === "attempting") attempt.status = "unknown";
      return state.attempts.map((attempt) => ({ ...attempt }));
    });
  }

  observe(message: Message): void {
    if (!message.fromMe) return;
    for (const attempt of this.snapshot) {
      const { draft } = attempt;
      if (
        (attempt.state !== "posting" &&
          attempt.state !== "submitted" &&
          attempt.state !== "unknown") ||
        attempt.linkedMessageId ||
        draft.baseline === null ||
        draft.roomId !== message.roomId ||
        draft.text !== message.text ||
        compareDecimalIds(message.id, draft.baseline) <= 0 ||
        attempt.candidates.some((id) => compareDecimalIds(id, message.id) === 0)
      )
        continue;
      // Candidates are bounded hints, not additional copies of message bodies.
      if (attempt.candidates.length < LIMIT_COUNT) {
        const candidates = Object.freeze([...attempt.candidates, message.id]);
        if (
          this.bytes(
            this.snapshot.map((item) =>
              item.uuid === attempt.uuid ? { ...item, candidates } : item,
            ),
          ) <= LIMIT_BYTES
        )
          this.replace(attempt.uuid, { candidates });
      }
    }
  }

  confirmLink(uuid: string, messageId: string): boolean {
    const attempt = this.get(uuid);
    if (
      !attempt ||
      (attempt.state !== "submitted" && attempt.state !== "unknown") ||
      attempt.linkedMessageId ||
      !attempt.candidates.includes(messageId)
    )
      return false;
    if (
      this.snapshot.some(
        (item) =>
          item.draft.roomId === attempt.draft.roomId &&
          item.linkedMessageId !== null &&
          compareDecimalIds(item.linkedMessageId, messageId) === 0,
      )
    )
      return false;
    this.replace(uuid, { linkedMessageId: messageId });
    return true;
  }

  /** Explicit cleanup never deletes the durable UUID tombstone. */
  dismiss(uuid: string): void {
    const attempt = this.get(uuid);
    if (!attempt || (!final(attempt.state) && this.consumed.has(uuid))) return;
    this.controllers.get(uuid)?.abort();
    this.consumed.delete(uuid);
    this.publish(this.snapshot.filter((item) => item.uuid !== uuid));
  }

  /** Losing the leader/requester marks an in-flight result unknown, not retryable. */
  stop(): void {
    this.stopped = true;
    for (const controller of this.controllers.values()) controller.abort();
  }

  private async dispatch(uuid: string, signal?: AbortSignal): Promise<void> {
    const attempt = this.get(uuid);
    if (!attempt) return;
    if (this.stopped || !this.options.isReady()) {
      this.replace(uuid, { state: "rejected", reason: "not-ready" });
      return;
    }
    let existing: Attempt["status"] | null;
    try {
      existing = await this.options.metadata.update((state) => {
        const previous = state.attempts.find((item) => item.uuid === uuid);
        if (previous) return previous.status;
        if (state.attempts.length >= LIMIT_COUNT)
          throw new Error("Send metadata capacity exceeded");
        state.attempts.push({ uuid, status: "attempting" });
        return null;
      });
    } catch {
      this.replace(uuid, { state: "rejected", reason: "send-unavailable" });
      return;
    }
    if (existing) {
      this.replace(uuid, {
        state: existing === "attempting" ? "unknown" : existing,
        reason: "already-recorded",
      });
      return;
    }
    if (this.stopped || !this.options.isReady()) {
      await this.finish(uuid, "rejected", "not-ready");
      return;
    }
    const controller = new AbortController();
    this.controllers.set(uuid, controller);
    const abort = () => controller.abort();
    signal?.addEventListener("abort", abort, { once: true });
    if (signal?.aborted) controller.abort();
    const timer = setTimeout(abort, this.options.timeoutMs ?? 30_000);
    let state: "submitted" | "unknown" | "rejected" = "unknown";
    let reason: string | null = "result-unavailable";
    try {
      const outcome = await this.options.http.request({
        path: "/send",
        body: body(attempt.draft, false),
        signal: controller.signal,
        generationKey: `send-post:${uuid}`,
      });
      if (outcome.kind === "success") {
        if (
          outcome.data.submitted &&
          !outcome.data.dryRun &&
          outcome.data.roomId === attempt.draft.roomId
        ) {
          state = "submitted";
          reason = null;
        } else reason = "invalid-success";
      } else if (outcome.kind === "failure") {
        reason = outcome.error.code;
        // Only definite pre-dispatch client rejections are safe to call rejected.
        if (
          outcome.error.code !== "SEND_FAILED" &&
          [400, 401, 403, 404, 409, 429].includes(outcome.status)
        )
          state = "rejected";
      }
    } catch {
      // The HTTP boundary rejects malformed/network responses. Neither proves failure.
      reason = controller.signal.aborted
        ? "aborted-or-timeout"
        : "result-unavailable";
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
      this.controllers.delete(uuid);
    }
    await this.finish(uuid, state, reason);
  }

  private async finish(
    uuid: string,
    state: "submitted" | "unknown" | "rejected",
    reason: string | null,
  ) {
    try {
      await this.options.metadata.update((metadata) => {
        const attempt = metadata.attempts.find((item) => item.uuid === uuid);
        if (attempt) attempt.status = state;
      });
    } catch {
      state = "unknown";
      reason = "metadata-unavailable";
    }
    this.replace(uuid, { state, reason });
  }
  private replace(uuid: string, change: Partial<SendAttempt>) {
    this.publish(
      this.snapshot.map((item) =>
        item.uuid === uuid ? Object.freeze({ ...item, ...change }) : item,
      ),
    );
  }
  private bytes(snapshot: readonly SendAttempt[]) {
    return encoder.encode(JSON.stringify(snapshot)).byteLength;
  }
  private publish(snapshot: readonly SendAttempt[]) {
    if (snapshot.length > LIMIT_COUNT || this.bytes(snapshot) > LIMIT_BYTES)
      throw new Error("Pending send capacity exceeded");
    this.snapshot = Object.freeze(snapshot);
    for (const listener of this.listeners) listener();
  }
}
