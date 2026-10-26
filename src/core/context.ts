import type { components } from "../contract/decoded";
import {
  type HttpFailure,
  type HttpOutcome,
  HttpProtocolError,
  type JsonRequest,
} from "../transport/http";
import type { BoundedCache } from "./cache";
import { compareDecimalIds } from "./ids";
import type { Coverage, Immutable, ThreadSnapshot } from "./stores";
import { immutable, SliceStore } from "./stores/slices";

type Context = components["schemas"]["Context"];

/**
 * GET /context takes a newest-N limit and nothing else (G3): no offset, no
 * before-id, no older-than cursor. The reader widens the newest window in
 * these three steps and then stops; it never pages into older history.
 */
export const WINDOW_LIMITS = [40, 200, 1000] as const;
export type WindowLimit = (typeof WINDOW_LIMITS)[number];
export const DEFAULT_WINDOW: WindowLimit = 40;
export const WINDOW_CEILING: WindowLimit = 1000;

export function nextWindowLimit(limit: WindowLimit): WindowLimit | null {
  return WINDOW_LIMITS[WINDOW_LIMITS.indexOf(limit) + 1] ?? null;
}

/** The slice of the transport the reader needs; HttpClient satisfies it and tests fake it. */
export interface ContextTransport {
  request(request: JsonRequest<"/context">): Promise<HttpOutcome<Context>>;
}

export type ContextFailure =
  /** The bridge answered with an error envelope. Only its code is ever shown. */
  | { kind: "bridge"; outcome: HttpFailure }
  /** No answer reached us. */
  | { kind: "network" }
  /** An answer arrived that is not the contract's. */
  | { kind: "protocol" };

export type LoadReason = "open" | "widen" | "retry";

export type WindowSnapshot = {
  /** The newest-N limit this room currently asks for. */
  limit: WindowLimit;
  /** The request in flight, if any, and why it was made. */
  loading: LoadReason | null;
  /** A window answer has been applied for this room and nothing has invalidated it since. */
  settled: boolean;
  /** The last request's failure; cleared when the next request starts. */
  failure: ContextFailure | null;
  /** Rows whose older neighbour in the store was never observed contiguous with them. */
  discontinuities: readonly string[];
};

const IDLE = immutable<WindowSnapshot>({
  limit: DEFAULT_WINDOW,
  loading: null,
  settled: false,
  failure: null,
  discontinuities: [],
});

type WindowSlices = { [key: `window.${string}`]: WindowSnapshot };

class WindowStore extends SliceStore<WindowSlices> {
  constructor() {
    super(
      <K extends keyof WindowSlices>() => IDLE as Immutable<WindowSlices[K]>,
    );
  }
  publish(roomId: string, value: WindowSnapshot): void {
    this.set(`window.${roomId}`, value);
  }
}

type RoomRequest = { generation: number; controller: AbortController | null };

/**
 * Per-room newest windows: the limit a room asks for, what is in flight, and
 * whether the rows in the store are a settled answer. Answers land in the
 * bounded cache; a superseded, aborted or closed request never lands at all.
 */
export class ContextWindows {
  private readonly store = new WindowStore();
  private readonly requests = new Map<string, RoomRequest>();
  private readonly refreshes = new Set<string>();

  constructor(
    private readonly http: ContextTransport,
    private readonly cache: BoundedCache,
  ) {}

  readonly subscribe = (roomId: string, listener: () => void): (() => void) =>
    this.store.subscribe(`window.${roomId}`, listener);

  readonly getSnapshot = (roomId: string): Immutable<WindowSnapshot> =>
    this.store.getSnapshot(`window.${roomId}`);

  /** Ask for the room's newest window at its current limit; cached rows stay visible meanwhile. */
  open(roomId: string): void {
    this.load(roomId, this.getSnapshot(roomId).limit, "open");
  }

  retry(roomId: string): void {
    this.load(roomId, this.getSnapshot(roomId).limit, "retry");
  }

  /** Coalesce live refills without cancelling or settling the initial window. */
  refresh(roomId: string): void {
    if (this.getSnapshot(roomId).loading !== null) this.refreshes.add(roomId);
    else this.retry(roomId);
  }

  closeAll(): void {
    for (const roomId of this.requests.keys()) this.close(roomId);
  }

  /** 40 → 200 → 1000. At the ceiling nothing is sent and false comes back: there is no older page to ask for. */
  widen(roomId: string): boolean {
    const next = nextWindowLimit(this.getSnapshot(roomId).limit);
    if (next === null) return false;
    this.load(roomId, next, "widen");
    return true;
  }

  /** Abort what is in flight and stop calling the store's rows a settled window. The limit and the rows stay. */
  close(roomId: string): void {
    this.refreshes.delete(roomId);
    const request = this.requests.get(roomId);
    if (request) {
      request.controller?.abort();
      request.controller = null;
    }
    this.store.publish(roomId, {
      ...this.getSnapshot(roomId),
      loading: null,
      settled: false,
    });
  }

  private track(roomId: string): RoomRequest {
    const request: RoomRequest = { generation: 0, controller: null };
    this.requests.set(roomId, request);
    return request;
  }

  private load(roomId: string, limit: WindowLimit, reason: LoadReason): void {
    const request = this.requests.get(roomId) ?? this.track(roomId);
    request.controller?.abort();
    const controller = new AbortController();
    request.controller = controller;
    const generation = ++request.generation;
    // Superseded by a newer request for this room, or aborted: the answer is nobody's.
    const live = () =>
      request.generation === generation && !controller.signal.aborted;
    this.store.publish(roomId, {
      ...this.getSnapshot(roomId),
      limit,
      loading: reason,
      failure: null,
    });
    this.http
      .request({
        path: "/context",
        signal: controller.signal,
        generationKey: `context:${roomId}`,
        // `open=true` always: a room whose key is not in memory answers 503
        // otherwise, and there is no way to know in advance which one that is.
        // The cost is real and stated in DESIGN.md G2 — the core opens the room
        // in the desktop client, which marks it read there.
        query: new URLSearchParams({
          roomId,
          limit: String(limit),
          open: "true",
        }),
      })
      .then(
        (outcome) => {
          if (!live() || outcome.kind === "discarded") return;
          if (outcome.kind === "failure")
            this.settle(roomId, { kind: "bridge", outcome });
          else this.apply(roomId, outcome.data);
          if (live() && this.refreshes.delete(roomId)) this.retry(roomId);
        },
        (error: unknown) => {
          if (!live()) return;
          this.settle(roomId, {
            kind: error instanceof HttpProtocolError ? "protocol" : "network",
          });
          if (live() && this.refreshes.delete(roomId)) this.retry(roomId);
        },
      );
  }

  private settle(roomId: string, failure: ContextFailure): void {
    this.store.publish(roomId, {
      ...this.getSnapshot(roomId),
      loading: null,
      failure,
    });
  }

  private apply(roomId: string, context: Context): void {
    // The routing key is the request's roomId; a window for another room is a broken bridge, not data.
    if (context.messages.some((message) => message.roomId !== roomId)) {
      this.settle(roomId, { kind: "protocol" });
      return;
    }
    const cached = this.cache.stores.getSnapshot(`thread.${roomId}`).order;
    // Oldest first is the reader's promise, so it is enforced here rather than trusted.
    const fresh = [...context.messages].sort((a, b) =>
      compareDecimalIds(a.id, b.id),
    );
    const marks = new Set(this.getSnapshot(roomId).discontinuities);
    const oldest = fresh[0];
    const newest = fresh.at(-1);
    const cachedNewest = cached.at(-1);
    if (oldest && newest) {
      // The fresh window starts after everything cached: what lies between was never observed.
      if (
        cachedNewest !== undefined &&
        compareDecimalIds(oldest.id, cachedNewest) > 0
      )
        marks.add(oldest.id);
      // A window that spans an earlier boundary closes it.
      for (const id of [...marks]) {
        if (
          compareDecimalIds(oldest.id, id) < 0 &&
          compareDecimalIds(newest.id, id) >= 0
        )
          marks.delete(id);
      }
    }
    this.cache.putMessages(roomId, fresh, { coverage: context.coverage });
    this.store.publish(roomId, {
      ...this.getSnapshot(roomId),
      loading: null,
      settled: true,
      failure: null,
      discontinuities: [...marks],
    });
  }
}

/** What the older edge of the window offers. */
export type WindowEdge = "none" | "widen" | "widening" | "ceiling";

export type WindowView = {
  /** Rows to render, oldest first. */
  order: readonly string[];
  /** The store's coverage, with hasEarlier narrowed to rows that are not already on screen. */
  coverage: Coverage | null;
  shown: number;
  /** A settled window with no rows. Never true while loading or after a refusal. */
  empty: boolean;
  loading: LoadReason | null;
  /** Rows or coverage from an earlier answer are on screen while a fresh one is in flight. */
  stale: boolean;
  failure: ContextFailure | null;
  edge: WindowEdge;
  limit: WindowLimit;
  /** Rows before which a "not loaded in between" marker belongs; only rows that are on screen, never the first. */
  discontinuities: readonly string[];
};

/**
 * Coverage is not emptiness: nothing here calls an unanswered or refused
 * window empty, and the only claim about older history is what the bridge said.
 */
export function describeWindow(
  thread: Pick<Immutable<ThreadSnapshot>, "order" | "coverage">,
  window: Immutable<WindowSnapshot>,
): WindowView {
  const shown = thread.order.length;
  const coverage: Coverage | null = thread.coverage
    ? {
        ...thread.coverage,
        hasEarlier:
          thread.coverage.hasEarlier && thread.coverage.storedLocally > shown,
      }
    : null;
  const settled =
    window.settled && window.loading === null && window.failure === null;
  let edge: WindowEdge = "none";
  if (coverage?.hasEarlier) {
    if (window.loading !== null) edge = "widening";
    else if (settled)
      edge = window.limit >= WINDOW_CEILING ? "ceiling" : "widen";
  }
  const first = thread.order[0];
  return {
    order: thread.order,
    coverage,
    shown,
    empty: settled && shown === 0,
    loading: window.loading,
    stale: window.loading !== null && (shown > 0 || coverage !== null),
    failure: window.failure,
    edge,
    limit: window.limit,
    discontinuities: window.discontinuities.filter(
      (id) => id !== first && thread.order.includes(id),
    ),
  };
}
