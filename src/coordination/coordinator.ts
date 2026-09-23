import type { SseRecord } from "../transport/sse";
import type { MetadataStore } from "./metadata";
import type { ChannelPort, Platform } from "./platform";
import {
  REQUEST_CHANNEL,
  type Reply,
  type Request,
  type RingRecord,
  requestFrom,
  STREAM_LOCK,
  VERSION,
} from "./protocol";
import { RetryRequest } from "./retry";
import { ReplayRing } from "./ring";

export type CoordinatorStatus = {
  mode:
    | "starting"
    | "waiting"
    | "live"
    | "manual-refresh"
    | "resync-required"
    | "reload-required"
    | "terminal"
    | "stopped";
  role: "follower" | "leader";
  epoch: number;
  generation: number;
  label: string;
  reason?: string | undefined;
};
class Status {
  private value: CoordinatorStatus = {
    mode: "starting",
    role: "follower",
    epoch: 0,
    generation: 0,
    label: "동기화 대기",
  };
  private readonly listeners = new Set<() => void>();
  getSnapshot = () => this.value;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  set(change: Partial<CoordinatorStatus>) {
    this.value = { ...this.value, ...change };
    this.value.label =
      this.value.mode === "waiting" || this.value.mode === "starting"
        ? "동기화 대기"
        : this.value.mode === "manual-refresh"
          ? "수동 새로고침"
          : this.value.mode === "resync-required"
            ? "동기화 범위 확인 필요"
            : this.value.mode === "live"
              ? "실시간 수신 대기"
              : this.value.mode;
    for (const listener of this.listeners) listener();
  }
}
export type CoordinatorOptions = {
  platform: Platform | undefined;
  apply: (records: readonly RingRecord[]) => void | Promise<void>;
  onResync?: () => void;
  /** Reconnect owns resume selection; no cursor is persisted by coordination. */
  query?: () => URLSearchParams;
};
function gate() {
  let release = () => {};
  const promise = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { promise, release };
}

export class Coordinator {
  readonly status = new Status();
  readonly nonce: string;
  private metadata?: MetadataStore;
  private replies?: ChannelPort;
  private requests: ChannelPort | undefined;
  private readonly lifetime = gate();
  private readonly stopped = new AbortController();
  private election = new AbortController();
  private tabTask?: Promise<void>;
  private leaderTask?: Promise<void>;
  private streamAbort?: AbortController;
  private unlisten?: () => void;
  private timer: unknown;
  private retry?: RetryRequest;
  private pending: Request | undefined;
  private requestSeq = 0;
  private epoch = 0;
  private generation = 0;
  private afterSeq = 0;
  private head = 0;
  private ready = false;
  private leading = false;
  private started = false;
  private terminal?: string;
  private readonly ring = new ReplayRing();
  private work: Promise<void> = Promise.resolve();
  private flushing = false;
  private applying = false;
  constructor(private readonly options: CoordinatorOptions) {
    this.nonce = options.platform?.randomId() ?? "manual";
  }

  private get platform(): Platform {
    if (!this.options.platform) throw new Error("Coordination unavailable");
    return this.options.platform;
  }
  private get db(): MetadataStore {
    if (!this.metadata) throw new Error("Metadata not open");
    return this.metadata;
  }

  async start(): Promise<void> {
    if (this.started) return;
    this.started = true;
    const platform = this.options.platform;
    if (!platform) {
      this.fail("coordination-unavailable");
      return;
    }
    try {
      this.metadata = await platform.metadata();
      if (this.stopped.signal.aborted) {
        this.metadata.close();
        return;
      }
      const acquired = gate();
      let granted = false;
      this.tabTask = platform.locks
        .request(
          `saya:tab:${this.nonce}`,
          { mode: "exclusive", signal: this.stopped.signal },
          async () => {
            granted = true;
            acquired.release();
            await this.lifetime.promise;
          },
        )
        .catch(() => {
          if (!this.stopped.signal.aborted) this.fail("lock-unavailable");
          acquired.release();
        });
      await acquired.promise;
      if (!granted || this.stopped.signal.aborted) return;
      this.replies = platform.channels.open(`saya:reply:${this.nonce}`);
      this.replies.onmessage = (event) => {
        void this.receive(event.data as Reply).catch(() =>
          this.fail("reply-apply-failed"),
        );
      };
      this.elect();
      const state = await this.metadata.read();
      this.epoch = state.epoch;
      this.generation = state.generation;
      this.request("register");
      this.unlisten = platform.listen(() => {
        if (!platform.visible() && !this.leading) this.election.abort();
        else if (platform.visible()) this.elect();
        void this.checkEpoch().catch(() => this.fail("metadata-unavailable"));
      });
      this.scheduleCheck();
    } catch {
      this.fail("coordination-unavailable");
    }
  }

  private elect() {
    const platform = this.options.platform;
    if (
      !platform ||
      this.leading ||
      this.stopped.signal.aborted ||
      (this.leaderTask && !this.election.signal.aborted)
    )
      return;
    this.election = new AbortController();
    const election = this.election;
    this.leaderTask = platform.locks
      .request(
        STREAM_LOCK,
        { mode: "exclusive", signal: election.signal },
        async () => {
          this.leading = true;
          // Listener installation MUST precede the transaction publishing the new epoch.
          this.requests = platform.channels.open(REQUEST_CHANNEL);
          this.requests.onmessage = (event) => {
            const request = requestFrom(event.data);
            if (!request) return;
            if (!this.ready) {
              this.reply(request.nonce, {
                kind: "not-ready",
                requestSeq: request.requestSeq,
              });
              return;
            }
            this.enqueue(() => this.handle(request));
          };
          try {
            const state = await this.db.update((state) => {
              state.epoch++;
              state.generation++;
              return {
                epoch: state.epoch,
                generation: state.generation,
                head: state.head,
              };
            });
            this.epoch = state.epoch;
            this.generation = state.generation;
            this.head = state.head;
            this.ring.reset(this.head);
            this.ready = true;
            this.status.set({
              role: "leader",
              epoch: this.epoch,
              generation: this.generation,
            });
            this.retry?.cancel();
            this.pending = undefined;
            this.request("register");
            this.streamAbort = new AbortController();
            if (this.stopped.signal.aborted) this.streamAbort.abort();
            const outcome = await platform.openStream({
              signal: this.streamAbort.signal,
              ...(this.options.query ? { query: this.options.query() } : {}),
              onEvent: (event) => this.ingest(event),
            });
            if (!this.stopped.signal.aborted) {
              this.terminal ??= outcome.kind;
              await this.flushHead();
            }
            // Terminal reader failures retain ownership: no cascade of identical failing readers.
            await this.lifetime.promise;
          } catch {
            if (!this.stopped.signal.aborted) {
              this.terminal = "stream-failed";
              this.fail("stream-failed");
              await this.lifetime.promise;
            }
          } finally {
            this.ready = false;
            this.leading = false;
            this.requests?.close();
            this.requests = undefined;
          }
        },
      )
      .catch(() => {
        if (!election.signal.aborted) this.fail("lock-unavailable");
      });
  }

  private enqueue(action: () => Promise<void>) {
    this.work = this.work
      .then(action)
      .catch(() => this.fail("coordination-failed"));
  }
  private ingest(event: SseRecord) {
    if (!this.ready || this.stopped.signal.aborted) return;
    try {
      this.ring.append(++this.head, event);
    } catch {
      this.terminal = "resource-limited";
      this.streamAbort?.abort();
    }
    // The bounded ring is the only ingress queue. Coalesce metadata writes, not records.
    if (this.flushing) return;
    this.flushing = true;
    this.enqueue(async () => {
      this.flushing = false;
      await this.flushHead();
    });
  }
  private async flushHead() {
    const head = this.head;
    const recipients = await this.db.update((state) => {
      if (state.epoch !== this.epoch) return [];
      state.head = head;
      return state.subscribers
        .filter((subscriber) => subscriber.credit === 1)
        .map((subscriber) => {
          subscriber.credit = 0;
          return subscriber.nonce;
        });
    });
    for (const nonce of recipients)
      this.reply(nonce, {
        kind: this.terminal ? "terminal" : "hint",
        outcome: this.terminal,
      });
  }
  private reply(nonce: string, message: Pick<Reply, "kind"> & Partial<Reply>) {
    const channel = this.platform.channels.open(`saya:reply:${nonce}`);
    channel.postMessage({
      epoch: this.epoch,
      generation: this.generation,
      head: this.head,
      ...message,
    } satisfies Reply);
    channel.close();
  }
  private async reclaim() {
    const state = await this.db.read();
    for (const subscriber of state.subscribers) {
      await this.platform.locks.request(
        `saya:tab:${subscriber.nonce}`,
        { ifAvailable: true, mode: "exclusive" },
        async (lock) => {
          if (lock)
            await this.db.update((state) => {
              state.subscribers = state.subscribers.filter(
                (item) => item.nonce !== subscriber.nonce,
              );
            });
        },
      );
    }
  }
  private async handle(request: Request) {
    if (!this.ready) return;
    if (request.version !== VERSION) {
      this.reply(request.nonce, {
        kind: "reload-required",
        requestSeq: request.requestSeq,
      });
      return;
    }
    if (request.kind === "register") await this.reclaim();
    const batch = this.ring.after(request.afterSeq, request.creditBytes);
    const kind: Reply["kind"] = this.terminal
      ? "terminal"
      : request.epoch !== this.epoch || (request.kind === "pull" && batch.gap)
        ? "resync-required"
        : request.kind === "register"
          ? "registered"
          : "batch";
    const accepted = await this.db.update((state) => {
      let subscriber = state.subscribers.find(
        (item) => item.nonce === request.nonce,
      );
      if (!subscriber) {
        if (state.subscribers.length === 32)
          throw new Error("Subscriber limit");
        subscriber = { nonce: request.nonce, credit: 0, lastRequestSeq: 0 };
        state.subscribers.push(subscriber);
      }
      if (request.requestSeq <= subscriber.lastRequestSeq) return false;
      subscriber.lastRequestSeq = request.requestSeq;
      // The next distinct request acknowledges the prior reply and grants ONE credit.
      // Consume it before posting any response. Empty pull arms exactly one future hint.
      subscriber.credit =
        kind === "batch" && batch.records.length === 0 ? 1 : 0;
      return true;
    });
    if (!accepted) return;
    if (kind === "batch" && batch.records.length === 0) {
      // Empty acknowledgement spends no data/hint credit. It is sent once per request.
      this.reply(request.nonce, {
        kind,
        requestSeq: request.requestSeq,
        records: [],
      });
    } else
      this.reply(request.nonce, {
        kind,
        requestSeq: request.requestSeq,
        ...(kind === "batch"
          ? { records: batch.records }
          : { startSeq: this.ring.startSeq }),
        outcome: this.terminal,
      });
  }

  private request(kind: Request["kind"]) {
    if (this.stopped.signal.aborted || this.pending) return;
    const platform = this.platform;
    const request: Request = {
      kind,
      version: VERSION,
      nonce: this.nonce,
      epoch: this.epoch,
      requestSeq: ++this.requestSeq,
      afterSeq: this.afterSeq,
      creditBytes: 64 * 1024,
    };
    this.pending = request;
    this.status.set({
      mode: "waiting",
      epoch: this.epoch,
      generation: this.generation,
    });
    this.retry = new RetryRequest(
      platform.clock,
      () => {
        const channel = platform.channels.open(REQUEST_CHANNEL);
        channel.postMessage(request);
        channel.close();
      },
      () => this.fail("request-unacknowledged"),
    );
    this.retry.start();
  }
  private async receive(reply: Reply) {
    if (
      this.stopped.signal.aborted ||
      reply.epoch < this.epoch ||
      (reply.epoch === this.epoch && reply.generation < this.generation)
    )
      return;
    if (reply.kind === "not-ready") return;
    if (reply.kind === "hint") {
      if (this.pending || this.applying) return;
      if (reply.epoch !== this.epoch) {
        await this.checkEpoch();
        return;
      }
      this.request("pull");
      return;
    }
    if (
      reply.requestSeq !== undefined &&
      reply.requestSeq !== this.pending?.requestSeq
    )
      return;
    this.retry?.cancel();
    this.pending = undefined;
    this.epoch = reply.epoch;
    this.generation = reply.generation;
    if (reply.kind === "reload-required" || reply.kind === "terminal") {
      this.status.set({ mode: reply.kind, reason: reply.outcome });
      return;
    }
    if (reply.kind === "resync-required" || reply.kind === "registered") {
      this.afterSeq = reply.startSeq ?? reply.head;
      this.options.onResync?.();
      this.status.set({ mode: "resync-required" });
      this.request("pull");
      return;
    }
    if (reply.kind === "batch") {
      this.applying = true;
      try {
        const records = reply.records ?? [];
        await this.options.apply(records);
        if (this.stopped.signal.aborted) return;
        this.afterSeq = records.at(-1)?.seq ?? this.afterSeq;
        if (records.length || this.afterSeq < reply.head) this.request("pull");
        else
          this.status.set({
            mode: "live",
            epoch: this.epoch,
            generation: this.generation,
          });
      } finally {
        this.applying = false;
      }
    }
  }
  private scheduleCheck() {
    const platform = this.platform;
    platform.clock.clearTimeout(this.timer);
    if (this.stopped.signal.aborted || !platform.visible()) return;
    this.timer = platform.clock.setTimeout(() => {
      void this.checkEpoch().catch(() => this.fail("metadata-unavailable"));
    }, 2000);
  }
  /** Foreground metadata check is recovery, never a server heartbeat or lock theft. */
  async checkEpoch() {
    if (this.stopped.signal.aborted || !this.metadata) return;
    this.scheduleCheck();
    if (!this.platform.visible() || this.applying) return;
    const state = await this.metadata.read();
    if (state.epoch !== this.epoch) {
      this.retry?.cancel();
      this.pending = undefined;
      this.epoch = state.epoch;
      this.generation = state.generation;
      this.request("register");
    } else if (
      !this.pending &&
      state.head > this.afterSeq &&
      this.status.getSnapshot().mode === "live"
    )
      this.request("pull");
  }
  private fail(reason: string) {
    this.retry?.cancel();
    this.status.set({ mode: "manual-refresh", reason });
  }
  async stop() {
    if (this.stopped.signal.aborted) return;
    this.stopped.abort();
    this.election.abort();
    this.retry?.cancel();
    this.options.platform?.clock.clearTimeout(this.timer);
    this.unlisten?.();
    this.streamAbort?.abort();
    this.lifetime.release();
    await this.leaderTask;
    await this.work;
    this.replies?.close();
    await this.tabTask;
    this.metadata?.close();
    this.status.set({ mode: "stopped" });
  }
}
