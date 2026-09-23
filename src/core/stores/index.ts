import type { components } from "../../contract/decoded";
import { compareDecimalIds } from "../ids";
import { type Immutable, immutable, SliceStore } from "./slices";

export type Room = components["schemas"]["Room"];
export type Message = components["schemas"]["Message"];
export type Coverage = components["schemas"]["Coverage"];
export type GapReason =
  | "message-count"
  | "message-bytes"
  | "room-lru"
  | "pinned-capacity";
export type PendingSend = {
  attemptId: string;
  roomId: string;
  text: string;
  status: "posting" | "submitted" | "unknown" | "rejected";
  /** An explicitly linked observed row, never an inferred delivery receipt. */
  messageId?: string;
};
export type ConnectionSnapshot = {
  status: string;
  epoch: string | null;
  cursor: Readonly<Record<string, string>>;
};
export type SendSnapshot = {
  blocked: boolean;
  reason: "pending-count" | "pending-bytes" | null;
};
export type RoomSnapshot = {
  room: Immutable<Room>;
  preview: string | null;
  previewMessageId: string | null;
};
export type ThreadSnapshot = {
  order: readonly string[];
  messages: Readonly<Record<string, Immutable<Message>>>;
  coverage: Immutable<Coverage> | null;
  cursor: string | null;
  gaps: readonly GapReason[];
};
export interface StoreSlices {
  connection: ConnectionSnapshot;
  "rooms.order": readonly string[];
  send: SendSnapshot;
  [key: `room.${string}`]: RoomSnapshot | undefined;
  [key: `thread.${string}`]: ThreadSnapshot;
  [key: `order.${string}`]: readonly string[];
  [key: `pending.${string}`]: readonly PendingSend[];
  [key: `message.${string}.${string}`]: Immutable<Message> | undefined;
}
// Thread order lives in its own namespace: room IDs are opaque, so `thread.<id>`
// must never be able to spell another slice's key.
export type ThreadOrderKey = `order.${string}`;
const EMPTY = Object.freeze([]);
const EMPTY_THREAD = immutable<ThreadSnapshot>({
  order: EMPTY,
  messages: {},
  coverage: null,
  cursor: null,
  gaps: EMPTY,
});
const INITIAL_CONNECTION = immutable<ConnectionSnapshot>({
  status: "disconnected",
  epoch: null,
  cursor: {},
});
const INITIAL_SEND = immutable<SendSnapshot>({ blocked: false, reason: null });

function initial<K extends keyof StoreSlices>(
  key: K,
): Immutable<StoreSlices[K]> {
  let value: unknown;
  if (key === "connection") value = INITIAL_CONNECTION;
  else if (key === "send") value = INITIAL_SEND;
  else if (
    key === "rooms.order" ||
    key.startsWith("pending.") ||
    key.startsWith("order.")
  )
    value = EMPTY;
  else if (key.startsWith("thread.")) value = EMPTY_THREAD;
  return value as Immutable<StoreSlices[K]>;
}

/** Framework-independent store; bounded ingress belongs to BoundedCache. */
export class ClientStores {
  private readonly slices = new WritableSlices(initial);

  readonly getSnapshot = this.slices.getSnapshot;
  readonly subscribe = this.slices.subscribe;
  readonly batch = (action: () => void): void => this.slices.batch(action);

  setConnection(value: ConnectionSnapshot): void {
    this.slices.publish("connection", value);
  }
  setSend(value: SendSnapshot): void {
    this.slices.publish("send", value);
  }
  setPending(roomId: string, values: readonly PendingSend[]): void {
    this.slices.publish(`pending.${roomId}`, values);
  }

  setCatalog(rooms: readonly Room[]): void {
    this.batch(() => {
      const ids = new Set(rooms.map((room) => room.id));
      for (const id of this.getSnapshot("rooms.order")) {
        if (!ids.has(id)) this.slices.publish(`room.${id}`, undefined);
      }
      for (const room of rooms) {
        const previous = this.getSnapshot(`room.${room.id}`);
        this.slices.publish(`room.${room.id}`, {
          room,
          preview: previous?.preview ?? null,
          previewMessageId: previous?.previewMessageId ?? null,
        });
      }
      this.slices.publish("rooms.order", [...ids]);
    });
  }

  setPreview(roomId: string, messageId: string, preview: string): void {
    const previous = this.getSnapshot(`room.${roomId}`);
    if (
      !previous ||
      (previous.previewMessageId !== null &&
        compareDecimalIds(messageId, previous.previewMessageId) < 0)
    )
      return;
    this.slices.publish(`room.${roomId}`, {
      ...previous,
      preview,
      previewMessageId: messageId,
    });
  }

  setThread(
    roomId: string,
    messages: readonly Immutable<Message>[],
    metadata: Partial<
      Pick<ThreadSnapshot, "coverage" | "cursor" | "gaps">
    > = {},
  ): void {
    const key = `thread.${roomId}` as const;
    const previous = this.getSnapshot(key);
    const entities = Object.fromEntries(
      messages.map((message) => [message.id, message]),
    );
    const order = Object.keys(entities).sort(compareDecimalIds);
    this.batch(() => {
      this.slices.publish(key, {
        ...previous,
        ...metadata,
        order,
        messages: entities,
      });
      const next = this.getSnapshot(key);
      for (const id of previous.order) {
        if (!Object.hasOwn(entities, id))
          this.slices.publish(`message.${roomId}.${id}`, undefined);
      }
      for (const id of order)
        this.slices.publish(`message.${roomId}.${id}`, next.messages[id]);
      this.slices.publishOrder(`order.${roomId}`, next.order);
    });
  }
}

class WritableSlices extends SliceStore<StoreSlices> {
  publish<K extends keyof StoreSlices>(
    key: K,
    value: StoreSlices[K] | Immutable<StoreSlices[K]>,
  ): void {
    this.set(key, value);
  }
  publishOrder(key: ThreadOrderKey, value: readonly string[]): void {
    // Kept separately from the full thread so body/coverage updates don't notify lists.
    this.set(key, value);
  }
}

export type { Immutable } from "./slices";
