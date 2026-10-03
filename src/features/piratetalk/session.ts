import { validateExtension } from "../../contract/piratetalk/boundary";
import type { ClientStores } from "../../core/stores";
import {
  type Discovery,
  type Mutation,
  PirateTalkTransport,
  type Send,
} from "../../transport/piratetalk";
import type { ComposerState } from "../composer/state";
import {
  type LocalReadSnapshot,
  LocalReadState,
  ReactionQueue,
} from "./state-people/state";

export function localReadSnapshot(
  value: unknown,
  roomId: string,
): LocalReadSnapshot | null {
  if (
    value === null ||
    typeof value !== "object" ||
    !("roomId" in value) ||
    value.roomId !== roomId ||
    !("messageId" in value) ||
    !validateExtension("Id", value.messageId) ||
    !("throughMessageId" in value) ||
    !validateExtension("Id", value.throughMessageId) ||
    !("unread" in value) ||
    typeof value.unread !== "number" ||
    !Number.isSafeInteger(value.unread) ||
    value.unread < 0
  )
    return null;
  return {
    roomId,
    messageId: value.messageId,
    throughMessageId: value.throughMessageId,
    unread: value.unread,
  };
}

/** One probe per core session. Only explicit reconnect starts another. */
export class PirateTalkSession {
  private state: Discovery = { kind: "checking" };
  private readonly listeners = new Set<() => void>();
  private request: AbortController | null = null;
  private started = false;
  readonly reactions = new ReactionQueue((request) =>
    this.transport.reaction(request, new AbortController().signal),
  );
  readonly localRead = new LocalReadState();
  observeLocal(stores: ClientStores): () => void {
    const subscriptions = new Map<string, () => void>();
    const sync = () => {
      for (const roomId of stores.getSnapshot("rooms.order")) {
        const room = stores.getSnapshot(`room.${roomId}`)?.room;
        const overlay =
          room && "piratetalkLocalRead" in room
            ? localReadSnapshot(room.piratetalkLocalRead, roomId)
            : null;
        if (overlay) this.localRead.restore(overlay);
        if (subscriptions.has(roomId)) continue;
        const update = () => {
          const room = stores.getSnapshot(`room.${roomId}`)?.room;
          const overlay =
            room && "piratetalkLocalRead" in room
              ? localReadSnapshot(room.piratetalkLocalRead, roomId)
              : null;
          if (overlay) this.localRead.restore(overlay);
          const thread = stores.getSnapshot(`thread.${roomId}`);
          for (const id of thread.order) {
            const row = thread.messages[id];
            if (row) this.localRead.observe(roomId, row);
          }
        };
        const threadSubscription = stores.subscribe(`thread.${roomId}`, update);
        const roomSubscription = stores.subscribe(`room.${roomId}`, update);
        subscriptions.set(roomId, () => {
          threadSubscription();
          roomSubscription();
        });
        update();
      }
    };
    const unsubscribe = stores.subscribe("rooms.order", sync);
    sync();
    return () => {
      unsubscribe();
      for (const remove of subscriptions.values()) remove();
    };
  }
  restoreLocal(snapshot: LocalReadSnapshot): void {
    this.localRead.restore(snapshot);
  }

  constructor(readonly transport = new PirateTalkTransport()) {}

  getSnapshot = (): Discovery => this.state;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  start(): void {
    if (this.started) return;
    this.started = true;
    this.probe();
  }

  send(
    request: Send,
    composer: ComposerState,
    signal: AbortSignal,
  ): Promise<Mutation> {
    const required: (keyof Extract<
      Discovery,
      { kind: "available" }
    >["capabilities"]["features"])[] = [];
    if (request.kind === "media") required.push("media");
    if (request.kind === "sticker") required.push("stickers");
    if (request.kind === "text") {
      if (request.replyTo) required.push("reply");
      if (request.threadRoot) required.push("thread");
      if (request.mentions?.length || request.mentionEveryone)
        required.push("mentions");
    }
    const state = this.state;
    if (
      state.kind !== "available" ||
      required.some(
        (feature) => !state.capabilities.features[feature]?.available,
      )
    )
      return Promise.resolve({
        outcome: "rejected",
        error: {
          code: "feature_unavailable",
          detail: "Required capability is unavailable.",
        },
      });
    return composer.sendExtension(
      request,
      (body, abort) => this.transport.send(body, abort),
      signal,
    );
  }

  reconnect = (): void => {
    this.started = true;
    this.request?.abort();
    this.probe();
  };

  private probe(): void {
    const request = new AbortController();
    this.request = request;
    this.publish({ kind: "checking" });
    void this.transport.discover(request.signal).then(
      (state) => {
        if (this.request === request && !request.signal.aborted)
          this.publish(state);
      },
      () => {
        if (this.request === request && !request.signal.aborted)
          this.publish({ kind: "unreachable" });
      },
    );
  }

  private publish(state: Discovery): void {
    this.state = state;
    for (const listener of this.listeners) listener();
  }
}
