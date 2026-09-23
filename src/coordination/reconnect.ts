import type { components } from "../contract/decoded";
import { HttpProtocolError } from "../transport/http";
import type { SseOutcome } from "../transport/sse";
import type { ClockPort } from "./platform";

/** Use Reconciler.resume().cursor, never the server's unpruned cursor map. */
export function resumeUrl(
  cursor: components["schemas"]["Cursor"],
  base = "/api/stream",
): string {
  const entries = Object.entries(cursor);
  if (entries.length > 5)
    throw new RangeError("Resume requires at most five retained rooms");
  const query = new URLSearchParams();
  for (const [roomId, logId] of entries)
    query.append("since", `${roomId}:${logId}`);
  const url = `${base}${query.size ? `?${query}` : ""}`;
  if (new TextEncoder().encode(url).byteLength > 8192)
    throw new RangeError("Resume URL exceeds 8 KiB");
  return url;
}

export type ReconnectSnapshot = {
  state: "stopped" | "connecting" | "receiving" | "waiting" | "terminal";
  attempt: number;
  capMs: number | null;
  delayMs: number | null;
  reason: string | null;
};
export type ReconnectOptions = {
  /** The lock owner supplies the ONLY stream opener; this class never elects a leader. */
  open: (signal: AbortSignal) => Promise<SseOutcome>;
  clock?: ClockPort;
  random?: () => number;
};
const browserClock: ClockPort = {
  setTimeout: (fn, ms) => setTimeout(fn, ms),
  clearTimeout: (handle) =>
    clearTimeout(handle as ReturnType<typeof setTimeout>),
};

/** No heartbeat timer: the wire contract specifies no ping cadence. */
export class ReconnectController {
  private readonly clock: ClockPort;
  private readonly random: () => number;
  private readonly listeners = new Set<() => void>();
  private snapshot: ReconnectSnapshot = Object.freeze({
    state: "stopped",
    attempt: 0,
    capMs: null,
    delayMs: null,
    reason: null,
  });
  private timer: unknown;
  private controller: AbortController | null = null;
  private task: Promise<void> = Promise.resolve();
  private generation = 0;
  private failures = 0;

  constructor(private readonly options: ReconnectOptions) {
    this.clock = options.clock ?? browserClock;
    this.random = options.random ?? Math.random;
  }
  readonly getSnapshot = (): ReconnectSnapshot => this.snapshot;
  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  /** Resolves when this attempt ends, not when a DOM update/paint finishes. */
  start(): Promise<void> {
    if (this.snapshot.state !== "stopped") return this.task;
    this.failures = 0;
    return this.connect();
  }
  currentAttempt(): Promise<void> {
    return this.task;
  }

  /** Only a validated received event supplies evidence, never online/visibility. */
  received(): void {
    if (!this.controller || this.controller.signal.aborted) return;
    this.failures = 0;
    this.set({ state: "receiving", capMs: null, delayMs: null, reason: null });
  }

  /** Online/foreground can expedite a pending retry, but cannot revive terminal errors. */
  hint(): void {
    if (this.snapshot.state !== "waiting") return;
    this.clock.clearTimeout(this.timer);
    this.timer = undefined;
    this.connect();
  }

  /** Caller awaits reader completion before releasing its cross-tab stream lock. */
  async stop(): Promise<void> {
    ++this.generation;
    this.clock.clearTimeout(this.timer);
    this.timer = undefined;
    this.controller?.abort();
    this.controller = null;
    this.set({ state: "stopped", capMs: null, delayMs: null, reason: null });
    await this.task;
  }

  private connect(): Promise<void> {
    const generation = ++this.generation;
    const controller = new AbortController();
    this.controller = controller;
    this.set({
      state: "connecting",
      attempt: this.snapshot.attempt + 1,
      capMs: null,
      delayMs: null,
      reason: null,
    });
    this.task = this.run(generation, controller);
    return this.task;
  }

  private async run(
    generation: number,
    controller: AbortController,
  ): Promise<void> {
    let outcome: SseOutcome;
    try {
      outcome = await this.options.open(controller.signal);
    } catch (error) {
      if (generation !== this.generation) return;
      if (error instanceof HttpProtocolError || error instanceof RangeError) {
        this.terminal("protocol-error");
        return;
      }
      // A rejected fetch is a network failure; no JSON/body/error text is logged.
      outcome = { kind: "eof" };
    }
    if (generation !== this.generation) return;
    this.controller = null;
    if (outcome.kind === "aborted") {
      this.set({ state: "stopped", capMs: null, delayMs: null, reason: null });
      return;
    }
    const retry =
      outcome.kind === "eof" ||
      ((outcome.kind === "failure" || outcome.kind === "error") &&
        outcome.error.code === "BUSY" &&
        (outcome.kind !== "failure" || outcome.status === 503));
    if (!retry) {
      this.terminal(
        outcome.kind === "failure" || outcome.kind === "error"
          ? outcome.error.code
          : outcome.kind,
      );
      return;
    }
    const capMs = Math.min(30_000, 500 * 2 ** Math.min(this.failures++, 6));
    const delayMs = this.random() * capMs;
    this.set({ state: "waiting", capMs, delayMs, reason: outcome.kind });
    this.timer = this.clock.setTimeout(() => {
      if (generation !== this.generation) return;
      this.timer = undefined;
      this.connect();
    }, delayMs);
  }
  private terminal(reason: string): void {
    this.controller = null;
    this.set({ state: "terminal", capMs: null, delayMs: null, reason });
  }
  private set(value: Partial<ReconnectSnapshot>): void {
    this.snapshot = Object.freeze({ ...this.snapshot, ...value });
    for (const listener of this.listeners) listener();
  }
}
