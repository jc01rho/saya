import type { components } from "../../../contract/piratetalk/decoded";

export type Schema = components["schemas"];
export type Mutation = Schema["MutationResponse"];
export type ReadResult = Schema["ReadResponse"] | Mutation;
export type Load<T> =
  | { readonly kind: "loading" }
  | { readonly kind: "unavailable"; readonly detail: string }
  | { readonly kind: "ready"; readonly value: T };
export type ReactionAction = (
  request: Schema["ReactionRequest"],
) => Promise<Mutation>;
export type ReadAction = (
  request: Schema["ReadRequest"],
) => Promise<ReadResult>;

export function safeResource(path: string | undefined): string | undefined {
  if (
    !path ||
    !/^\/(?!\/)/.test(path) ||
    /[\\\s%?#]/.test(path) ||
    [...path].some(
      (char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127,
    )
  )
    return undefined;
  if (path.split("/").some((part) => part === "." || part === ".."))
    return undefined;
  return `/api${path}`;
}

export function confirmedOwn(
  previous: boolean | null,
  request: Schema["ReactionRequest"],
  result: Mutation,
): boolean | null {
  return result.outcome === "confirmed" &&
    result.messageId === request.messageId
    ? request.selected
    : previous;
}

export function localUnread(
  boundary: string,
  messages: readonly { readonly id: string; readonly fromMe: boolean }[],
): number {
  return new Set(
    messages
      .filter(
        (message) => !message.fromMe && BigInt(message.id) > BigInt(boundary),
      )
      .map((message) => message.id),
  ).size;
}

export interface LocalReadSnapshot {
  readonly roomId: string;
  readonly messageId: string;
  readonly unread: number;
  readonly throughMessageId: string;
}

export class LocalReadState {
  private readonly rooms = new Map<
    string,
    { snapshot: LocalReadSnapshot; later: Set<string> }
  >();

  restore(snapshot: LocalReadSnapshot): void {
    const current = this.rooms.get(snapshot.roomId);
    if (
      current &&
      BigInt(current.snapshot.messageId) > BigInt(snapshot.messageId)
    )
      return;
    const later = new Set(
      [...(current?.later ?? [])].filter(
        (id) => BigInt(id) > BigInt(snapshot.throughMessageId),
      ),
    );
    this.rooms.set(snapshot.roomId, { snapshot, later });
  }

  observe(
    roomId: string,
    message: { readonly id: string; readonly fromMe: boolean },
  ): void {
    const room = this.rooms.get(roomId);
    if (
      room &&
      !message.fromMe &&
      BigInt(message.id) > BigInt(room.snapshot.throughMessageId) &&
      BigInt(message.id) > BigInt(room.snapshot.messageId)
    )
      room.later.add(message.id);
  }

  unread(roomId: string): number | undefined {
    const room = this.rooms.get(roomId);
    return room ? room.snapshot.unread + room.later.size : undefined;
  }
}

export class ReactionQueue {
  private readonly pending = new Map<string, Promise<Mutation>>();

  constructor(private readonly action: ReactionAction) {}

  run(request: Schema["ReactionRequest"]): Promise<Mutation> {
    const key = `${request.roomId}:${request.messageId}`;
    const previous = this.pending.get(key);
    const execute = () => this.action(request);
    const operation = previous ? previous.then(execute, execute) : execute();
    this.pending.set(key, operation);
    const clear = () => {
      if (this.pending.get(key) === operation) this.pending.delete(key);
    };
    operation.then(clear, clear);
    return operation;
  }
}
