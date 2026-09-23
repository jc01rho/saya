import type { components } from "../contract/decoded";
import type { HttpOutcome, JsonRequest } from "../transport/http";
import { HttpProtocolError } from "../transport/http";
import type { SseRecord } from "../transport/sse";
import { type BoundedCache, payloadBytes } from "./cache";
import type { ContextTransport } from "./context";
import { compareDecimalIds } from "./ids";
import type { Immutable, Message } from "./stores";
import { immutable } from "./stores/slices";

type Context = components["schemas"]["Context"];
type Cursor = components["schemas"]["Cursor"];
export type ReconcileGap =
  | "journal-overflow"
  | "conflicting-payload"
  | "discarded-frame"
  | "not-retained"
  | "live-start";
export type Provenance =
  | { kind: "stream"; revision: number }
  | { kind: "snapshot"; generation: number; revision: number };
export type Version = { message: Immutable<Message>; source: Provenance };
export type Conflict = { id: string; versions: readonly Version[] };
export type ContextTicket = {
  roomId: string;
  generation: number;
  /** Local apply revision at request start, not a server revision. */
  revision: number;
  signal: AbortSignal;
};
export type ReconcileSnapshot = {
  revision: number;
  request: ContextTicket | null;
  complete: boolean;
  gaps: readonly ReconcileGap[];
  conflicts: readonly Conflict[];
  journalBytes: number;
};
export type ContextApplication =
  | { kind: "applied"; data: Context }
  | { kind: "discarded" }
  | { kind: "resync"; reason: ReconcileGap };
type RequestState = {
  ticket: ContextTicket;
  controller: AbortController;
  detach: () => void;
  journal: Map<string, Version>;
  bytes: number;
  overflow: boolean;
};
type RoomState = {
  revision: number;
  request: RequestState | null;
  frontier: string | null;
  observations: Map<string, Provenance>;
  conflicts: Map<string, Conflict>;
  conflictBytes: number;
  gaps: Set<ReconcileGap>;
  complete: boolean;
  snapshot: ReconcileSnapshot;
};
const EMPTY: ReconcileSnapshot = Object.freeze({
  revision: 0,
  request: null,
  complete: false,
  gaps: Object.freeze([]),
  conflicts: Object.freeze([]),
  journalBytes: 0,
});
export type ReconcilerOptions = {
  http?: ContextTransport;
  onResync?: (roomId: string, reason: ReconcileGap) => void;
  /** Fired after the domain gap is recorded, before any covered cursor advances. */
  onGap?: (roomId: string, reason: ReconcileGap) => void;
  journalEvents?: number;
  journalBytes?: number;
};

/**
 * Synchronous domain apply, never DOM/rAF acknowledgement. Use request() as a
 * ContextTransport or pair beginContext()/completeContext() around another loader.
 * Feed validated SSE/fan-out records in wire order through accept().
 * Gap/conflict snapshots are separate from the cache's resource-policy gaps.
 */
export class Reconciler implements ContextTransport {
  private readonly rooms = new Map<string, RoomState>();
  private readonly listeners = new Map<string, Set<() => void>>();
  private generation = 0;
  private discarded = false;
  private previousCursorRooms = new Set<string>();
  private readonly unlisten: () => void;
  private readonly eventLimit: number;
  private readonly byteLimit: number;

  constructor(
    private readonly cache: BoundedCache,
    private readonly options: ReconcilerOptions = {},
  ) {
    this.eventLimit = options.journalEvents ?? 2048;
    this.byteLimit = options.journalBytes ?? 2 * 1024 * 1024;
    if (
      !Number.isInteger(this.eventLimit) ||
      this.eventLimit < 1 ||
      this.eventLimit > 2048 ||
      !Number.isInteger(this.byteLimit) ||
      this.byteLimit < 1 ||
      this.byteLimit > 2 * 1024 * 1024
    )
      throw new RangeError("Invalid reconciliation journal bound");
    this.unlisten = cache.subscribe(() => this.prune());
  }

  readonly getSnapshot = (roomId: string): ReconcileSnapshot =>
    this.rooms.get(roomId)?.snapshot ?? EMPTY;

  readonly subscribe = (roomId: string, listener: () => void): (() => void) => {
    const group = this.listeners.get(roomId) ?? new Set();
    group.add(listener);
    this.listeners.set(roomId, group);
    return () => {
      group.delete(listener);
      if (!group.size) this.listeners.delete(roomId);
    };
  };

  beginContext(roomId: string, signal?: AbortSignal): ContextTicket {
    // A context request admits a thread, unlike inactive-room stream traffic.
    if (!this.retained(roomId)) this.cache.putMessages(roomId, []);
    const state = this.state(roomId);
    this.cancelRequest(state);
    const controller = new AbortController();
    const abort = () => controller.abort();
    signal?.addEventListener("abort", abort, { once: true });
    if (signal?.aborted) controller.abort();
    const ticket = Object.freeze({
      roomId,
      generation: ++this.generation,
      revision: state.revision,
      signal: controller.signal,
    });
    state.request = {
      ticket,
      controller,
      detach: () => signal?.removeEventListener("abort", abort),
      journal: new Map(),
      bytes: 0,
      overflow: false,
    };
    state.complete = false;
    this.publish(roomId, state);
    return ticket;
  }

  async request(
    request: JsonRequest<"/context">,
  ): Promise<HttpOutcome<Context>> {
    if (!this.options.http)
      throw new Error("Reconciler requires a context transport");
    const roomId = request.query?.get("roomId");
    if (!roomId) throw new Error("Context request requires roomId");
    const ticket = this.beginContext(roomId, request.signal);
    try {
      const outcome = await this.options.http.request({
        ...request,
        signal: ticket.signal,
        generationKey: `context:${roomId}`,
      });
      if (!this.current(ticket)) return { kind: "discarded" };
      if (outcome.kind !== "success") return outcome;
      const applied = this.completeContext(ticket, outcome.data);
      return applied.kind === "applied"
        ? { kind: "success", data: applied.data }
        : { kind: "discarded" };
    } catch (error) {
      if (!this.current(ticket)) return { kind: "discarded" };
      throw error;
    } finally {
      const state = this.rooms.get(roomId);
      if (state?.request?.ticket === ticket) {
        this.cancelRequest(state);
        this.publish(roomId, state);
      }
    }
  }

  completeContext(ticket: ContextTicket, context: Context): ContextApplication {
    if (!this.current(ticket)) return { kind: "discarded" };
    if (
      context.room.id !== ticket.roomId ||
      context.messages.some((message) => message.roomId !== ticket.roomId)
    )
      throw new HttpProtocolError();
    const state = this.state(ticket.roomId);
    const request = state.request;
    if (!request) return { kind: "discarded" };
    if (request.overflow) {
      this.cancelRequest(state);
      this.publish(ticket.roomId, state);
      return { kind: "resync", reason: "journal-overflow" };
    }
    const source: Provenance = {
      kind: "snapshot",
      generation: ticket.generation,
      revision: ticket.revision,
    };
    const merged = new Map<string, Message>();
    for (const message of context.messages) {
      const existing =
        request.journal.get(message.id)?.message ??
        this.cache.stores.getSnapshot(`message.${ticket.roomId}.${message.id}`);
      const earlier = merged.get(message.id);
      const previous = earlier ?? existing;
      const same = previous && immutable(message, previous) === previous;
      const priorConflict = state.conflicts.get(message.id);
      // Only a NEW authoritative request, with no later observation of this ID,
      // may resolve an already disclosed conflict. A racing answer cannot.
      const resolves =
        !earlier && priorConflict && !request.journal.has(message.id);
      if (previous && !same && !resolves) {
        const previousSource = earlier
          ? source
          : (state.observations.get(message.id) ?? {
              kind: "stream" as const,
              revision: ticket.revision,
            });
        this.conflict(
          ticket.roomId,
          state,
          { message: previous, source: previousSource },
          { message, source },
        );
        continue;
      }
      if (resolves) state.conflicts.delete(message.id);
      merged.set(message.id, message);
      state.observations.set(message.id, source);
    }
    for (const [id, version] of request.journal) {
      if (!state.conflicts.has(id))
        merged.set(id, structuredClone(version.message) as Message);
    }
    state.conflictBytes = payloadBytes([...state.conflicts.values()]);
    // Cache put is a union, not snapshot replacement: ids observed after the
    // captured revision (and bounded cached rows before it) cannot be deleted.
    const coverage = {
      ...context.coverage,
      reachesLatestKnown:
        context.coverage.reachesLatestKnown &&
        state.revision === ticket.revision &&
        state.gaps.size === 0,
    };
    const before = this.cache.stores.getSnapshot(`thread.${ticket.roomId}`);
    this.cache.putMessages(ticket.roomId, [...merged.values()], { coverage });
    if (this.cache.stores.getSnapshot(`thread.${ticket.roomId}`) !== before)
      state.revision++;
    this.cancelRequest(state);
    this.pruneObservations(ticket.roomId, state);
    state.complete = state.conflicts.size === 0 && !request.overflow;
    this.publish(ticket.roomId, state);
    if (!state.complete)
      return {
        kind: "resync",
        reason: request.overflow ? "journal-overflow" : "conflicting-payload",
      };
    const thread = this.cache.stores.getSnapshot(`thread.${ticket.roomId}`);
    return {
      kind: "applied",
      data: {
        ...context,
        coverage,
        messages: thread.order.map(
          (id) => structuredClone(thread.messages[id]) as Message,
        ),
      },
    };
  }

  observe(message: Message): "applied" | "duplicate" | "gap" {
    if (!this.retained(message.roomId)) {
      this.options.onGap?.(message.roomId, "not-retained");
      return "gap";
    }
    const state = this.state(message.roomId);
    const previous = this.cache.stores.getSnapshot(
      `message.${message.roomId}.${message.id}`,
    );
    if (previous && immutable(message, previous) === previous)
      return "duplicate";
    if (
      !previous &&
      state.frontier !== null &&
      compareDecimalIds(message.id, state.frontier) <= 0
    )
      return "duplicate";
    const version: Version = {
      message: immutable(message),
      source: { kind: "stream", revision: ++state.revision },
    };
    if (previous) {
      this.conflict(
        message.roomId,
        state,
        {
          message: previous,
          source: state.observations.get(message.id) ?? {
            kind: "stream",
            revision: state.revision - 1,
          },
        },
        version,
      );
      this.journal(message.roomId, state, version);
      this.publish(message.roomId, state);
      return "gap";
    }
    state.observations.set(message.id, version.source);
    this.journal(message.roomId, state, version);
    if (
      state.frontier === null ||
      compareDecimalIds(message.id, state.frontier) > 0
    )
      state.frontier = message.id;
    // putMessages synchronously applies the row OR records a retention gap.
    const result = this.cache.putMessages(message.roomId, [message]);
    this.pruneObservations(message.roomId, state);
    this.publish(message.roomId, state);
    return result.retained ? "applied" : "gap";
  }

  accept(record: SseRecord): void {
    switch (record.type) {
      case "message":
        this.observe(record.data.message);
        break;
      case "discarded-frame":
        this.discarded = true;
        break;
      case "ready":
        // Ready is not a substitute for the cursor following a discarded frame.
        if (this.discarded) break;
        for (const roomId of this.cache.getSnapshot().retainedRoomIds) {
          const cursor = this.cache.stores.getSnapshot(
            `thread.${roomId}`,
          ).cursor;
          const ready = record.data.cursor[roomId];
          if (!ready || cursor === null || compareDecimalIds(ready, cursor) > 0)
            this.gap(roomId, this.state(roomId), "live-start");
        }
        this.checkpoint(record.data.cursor);
        break;
      case "cursor": {
        const named = new Set(
          Object.keys(record.data.cursor).filter((id) => this.retained(id)),
        );
        if (this.discarded) {
          for (const id of new Set([...this.previousCursorRooms, ...named]))
            if (this.retained(id))
              this.gap(id, this.state(id), "discarded-frame");
          this.discarded = false;
        }
        this.checkpoint(record.data.cursor);
        this.previousCursorRooms = named;
        break;
      }
      case "ping":
      case "error":
        break;
    }
  }

  /** Selected rooms alone are resumable. Every other room starts live with a gap. */
  resume(): { cursor: Cursor; resumeRooms: readonly string[]; liveGap: true } {
    const { activeRoomId, retainedRoomIds } = this.cache.getSnapshot();
    const selected = [
      ...(activeRoomId && retainedRoomIds.includes(activeRoomId)
        ? [activeRoomId]
        : []),
      ...[...retainedRoomIds]
        .reverse()
        .filter((id) => id !== activeRoomId)
        .slice(0, 4),
    ];
    const cursor: Cursor = Object.create(null);
    for (const id of selected) {
      const value = this.cache.stores.getSnapshot(`thread.${id}`).cursor;
      if (value !== null) cursor[id] = value;
    }
    return { cursor, resumeRooms: Object.keys(cursor), liveGap: true };
  }

  dispose(): void {
    this.unlisten();
    for (const state of this.rooms.values()) this.cancelRequest(state);
    this.rooms.clear();
    this.listeners.clear();
  }

  private checkpoint(cursor: Cursor): void {
    for (const [roomId, value] of Object.entries(cursor)) {
      if (!this.retained(roomId)) continue;
      const previous = this.cache.stores.getSnapshot(`thread.${roomId}`).cursor;
      if (previous === null || compareDecimalIds(value, previous) > 0)
        this.cache.putMessages(roomId, [], { cursor: value });
    }
  }

  private current(ticket: ContextTicket): boolean {
    return (
      !ticket.signal.aborted &&
      this.retained(ticket.roomId) &&
      this.rooms.get(ticket.roomId)?.request?.ticket === ticket
    );
  }
  private retained(roomId: string): boolean {
    return this.cache.getSnapshot().retainedRoomIds.includes(roomId);
  }
  private state(roomId: string): RoomState {
    let state = this.rooms.get(roomId);
    if (!state) {
      state = {
        revision: 0,
        request: null,
        frontier: null,
        observations: new Map(),
        conflicts: new Map(),
        conflictBytes: 0,
        gaps: new Set(),
        complete: false,
        snapshot: EMPTY,
      };
      this.rooms.set(roomId, state);
    }
    return state;
  }
  private cancelRequest(state: RoomState): void {
    state.request?.detach();
    state.request?.controller.abort();
    state.request = null;
  }
  private journal(roomId: string, state: RoomState, version: Version): void {
    const request = state.request;
    if (!request || request.overflow) return;
    const bytes = payloadBytes(version);
    const previous = request.journal.get(version.message.id);
    const nextBytes =
      request.bytes + bytes - (previous ? payloadBytes(previous) : 0);
    if (
      (!previous && request.journal.size >= this.eventLimit) ||
      nextBytes > this.byteLimit
    ) {
      request.overflow = true;
      request.journal.clear();
      request.bytes = 0;
      this.gap(roomId, state, "journal-overflow");
      return;
    }
    request.journal.set(version.message.id, version);
    request.bytes = nextBytes;
  }
  private conflict(
    roomId: string,
    state: RoomState,
    previous: Version,
    incoming: Version,
  ): void {
    const id = incoming.message.id;
    const existing = state.conflicts.get(id);
    const versions = existing ? [...existing.versions] : [previous];
    if (
      !versions.some(
        (version) =>
          immutable(incoming.message, version.message) === version.message,
      )
    )
      versions.push(incoming);
    const conflict = { id, versions };
    const bytes =
      state.conflictBytes +
      payloadBytes(conflict) -
      (existing ? payloadBytes(existing) : 0);
    if (
      bytes > this.byteLimit ||
      (!existing && state.conflicts.size >= this.eventLimit)
    ) {
      if (state.request) state.request.overflow = true;
      this.gap(roomId, state, "journal-overflow");
      return;
    }
    state.conflictBytes = bytes;
    state.conflicts.set(id, conflict);
    this.gap(roomId, state, "conflicting-payload");
  }
  private gap(roomId: string, state: RoomState, reason: ReconcileGap): void {
    state.complete = false;
    const fresh = !state.gaps.has(reason);
    state.gaps.add(reason);
    this.publish(roomId, state);
    if (fresh) {
      this.options.onGap?.(roomId, reason);
      this.options.onResync?.(roomId, reason);
    }
  }
  private pruneObservations(roomId: string, state: RoomState): void {
    const messages = this.cache.stores.getSnapshot(`thread.${roomId}`).messages;
    for (const id of state.observations.keys())
      if (!Object.hasOwn(messages, id)) state.observations.delete(id);
  }
  private prune(): void {
    for (const [id, state] of this.rooms) {
      if (this.retained(id)) {
        this.pruneObservations(id, state);
        continue;
      }
      this.cancelRequest(state);
      this.rooms.delete(id);
      this.previousCursorRooms.delete(id);
      for (const listener of this.listeners.get(id) ?? []) listener();
    }
  }
  private publish(roomId: string, state: RoomState): void {
    // AbortSignal is an identity-bearing platform object, not decoded JSON.
    state.snapshot = Object.freeze({
      revision: state.revision,
      request: state.request?.ticket ?? null,
      complete: state.complete,
      gaps: Object.freeze([...state.gaps]),
      conflicts: Object.freeze(
        [...state.conflicts.values()].map((conflict) => immutable(conflict)),
      ),
      journalBytes: state.request?.bytes ?? 0,
    });
    for (const listener of this.listeners.get(roomId) ?? []) listener();
  }
}
