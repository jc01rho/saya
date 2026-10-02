import type { components } from "../contract/tsuba/decoded";
import { type SseEventName, sseValidators } from "../contract/tsuba/sse";
import {
  validateCapabilities,
  validateDone,
  validateEditAnswer,
  validateErrorEnvelope,
  validateMessagesAnswer,
  validateReactAnswer,
  validateRoomsAnswer,
  validateSendAnswer,
} from "../contract/tsuba/validators.js";
import { CONTRACT_VERSION } from "../contract/tsuba/version";

type Schema = components["schemas"];
export type Capabilities = Schema["Capabilities"];
export type AdapterRoom = Schema["Room"];
export type AdapterMessage = Schema["Message"];
export type AdapterAttachment = Schema["Attachment"];
export type AdapterReaction = Schema["Reaction"];
export type RoomsAnswer = Schema["RoomsAnswer"];
export type MessagesAnswer = Schema["MessagesAnswer"];
export type SendAnswer = Schema["SendAnswer"];

export type AdapterIndexOutcome =
  | { kind: "listed"; ids: string[] }
  /** The proxy has no `/adapters` facility, or answered something that is not one. */
  | { kind: "unconfigured" }
  | { kind: "unreachable" };

/** What any adapter request comes to, besides its own answer. */
export type AdapterProblem =
  /** The adapter answered with an error envelope; `code` is machine-readable. */
  | { kind: "refused"; status: number; code: string }
  /** Nothing behind the proxy answered: the adapter or the path to it is down. */
  | { kind: "unreachable" }
  /** Something answered, but not the adapter contract. */
  | { kind: "protocol" }
  /** The adapter answers a contract version outside this client's range. */
  | { kind: "incompatible"; version: string };

export type AdapterResult<T> = { kind: "ok"; data: T } | AdapterProblem;

export type AdapterOutcome =
  | { kind: "connected"; capabilities: Capabilities }
  | AdapterProblem;

const ADAPTERS = "/adapters";
const ID = /^[a-z][a-z0-9-]*$/;

type Reply = { status: number; ok: boolean; body: unknown } | "not-json";

function adapterPath(id: string, route: string) {
  return `${ADAPTERS}/${encodeURIComponent(id)}${route}`;
}

/** Same-origin only: the proxy owns every adapter token, never browser code. */
async function call(
  path: string,
  signal: AbortSignal,
  body?: unknown,
): Promise<Reply> {
  const response = await fetch(path, {
    credentials: "same-origin",
    signal,
    ...(body === undefined
      ? {}
      : {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        }),
  });
  const text = await response.text();
  try {
    return { status: response.status, ok: response.ok, body: JSON.parse(text) };
  } catch {
    return response.status >= 500
      ? { status: response.status, ok: false, body: undefined }
      : "not-json";
  }
}

/** Throws only when `signal` aborts; every other failure is an outcome. */
async function request<T>(
  path: string,
  valid: (value: unknown) => boolean,
  signal: AbortSignal,
  body?: unknown,
): Promise<AdapterResult<T>> {
  let reply: Reply;
  try {
    reply = await call(path, signal, body);
  } catch (error) {
    if (signal.aborted) throw error;
    return { kind: "unreachable" };
  }
  if (reply === "not-json") return { kind: "protocol" };
  if (validateErrorEnvelope(reply.body))
    return {
      kind: "refused",
      status: reply.status,
      code: reply.body.error.code,
    };
  if (reply.status >= 500 && reply.body === undefined)
    return { kind: "unreachable" };
  if (reply.ok && valid(reply.body))
    return { kind: "ok", data: reply.body as T };
  return { kind: "protocol" };
}

function isIndex(body: unknown): body is { adapters: { id: string }[] } {
  if (!body || typeof body !== "object" || !("adapters" in body)) return false;
  const { adapters } = body;
  return (
    Array.isArray(adapters) &&
    adapters.every(
      (entry: unknown) =>
        !!entry &&
        typeof entry === "object" &&
        "id" in entry &&
        typeof entry.id === "string" &&
        ID.test(entry.id),
    )
  );
}

/** Throws only when `signal` aborts; every other failure is an outcome. */
export async function listAdapters(
  signal: AbortSignal,
): Promise<AdapterIndexOutcome> {
  let reply: Reply;
  try {
    reply = await call(ADAPTERS, signal);
  } catch (error) {
    if (signal.aborted) throw error;
    return { kind: "unreachable" };
  }
  if (reply === "not-json") return { kind: "unconfigured" };
  if (reply.status >= 500) return { kind: "unreachable" };
  if (!reply.ok || !isIndex(reply.body)) return { kind: "unconfigured" };
  return { kind: "listed", ids: reply.body.adapters.map(({ id }) => id) };
}

/**
 * The contract's caret rule: the same MAJOR and, while MAJOR is 0, the same
 * MINOR as the version this client was generated from.
 */
export function compatibleVersion(
  version: string,
  own: string = CONTRACT_VERSION,
): boolean {
  const parse = (value: string) =>
    /^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/.exec(value)?.slice(1, 3);
  const theirs = parse(version);
  const ours = parse(own);
  if (!theirs || !ours) return false;
  return theirs[0] === ours[0] && (ours[0] !== "0" || theirs[1] === ours[1]);
}

function contractVersion(body: unknown): string | null {
  if (!body || typeof body !== "object" || !("contract" in body)) return null;
  const { contract } = body;
  return contract &&
    typeof contract === "object" &&
    "version" in contract &&
    typeof contract.version === "string"
    ? contract.version
    : null;
}

/** The version is read before the shape: another range may shape it otherwise. */
export async function fetchCapabilities(
  id: string,
  signal: AbortSignal,
): Promise<AdapterOutcome> {
  const result = await request<unknown>(
    adapterPath(id, "/capabilities"),
    () => true,
    signal,
  );
  if (result.kind !== "ok") return result;
  const version = contractVersion(result.data);
  if (version !== null && !compatibleVersion(version))
    return { kind: "incompatible", version };
  return validateCapabilities(result.data)
    ? { kind: "connected", capabilities: result.data }
    : { kind: "protocol" };
}

type KnownKeys<T> = keyof {
  [K in keyof T as string extends K ? never : K]: T[K];
};
export type FeatureId = KnownKeys<Schema["RoomFeatures"]>;

/** What a room allows: its own value where it narrows the declaration, else the declaration's. */
export function roomFeature<K extends FeatureId>(
  features: Capabilities["features"],
  room: AdapterRoom | undefined,
  id: K,
): Exclude<Schema["RoomFeatures"][K], false> | undefined {
  const own = room?.features?.[id];
  if (own === false) return undefined;
  return (own ?? features[id]) as
    | Exclude<Schema["RoomFeatures"][K], false>
    | undefined;
}

/** Same-origin, so the proxy adds the token; the adapter's headers keep the bytes inert. */
export function mediaUrl(adapterId: string, mediaId: string): string {
  return adapterPath(
    adapterId,
    `/media?${new URLSearchParams({ id: mediaId })}`,
  );
}

/** Only a declared opaque icon version gives the client an image address. */
export function iconUrl(
  adapterId: string,
  version: string | undefined,
): string | undefined {
  return version === undefined
    ? undefined
    : adapterPath(adapterId, `/icon?${new URLSearchParams({ v: version })}`);
}

export function fetchRooms(id: string, signal: AbortSignal) {
  return request<RoomsAnswer>(
    adapterPath(id, "/rooms"),
    validateRoomsAnswer,
    signal,
  );
}

export function fetchMessages(
  id: string,
  query: { roomId: string; limit?: number; before?: string },
  signal: AbortSignal,
) {
  const params = new URLSearchParams({ roomId: query.roomId });
  if (query.limit !== undefined) params.set("limit", String(query.limit));
  if (query.before !== undefined) params.set("before", query.before);
  return request<MessagesAnswer>(
    adapterPath(id, `/messages?${params}`),
    validateMessagesAnswer,
    signal,
  );
}

/**
 * One attempt, never retried here: an uncertain write is the person's to
 * repeat. `replyTo` is sent only where `messages.reply` is declared.
 */
export function sendMessage(
  id: string,
  body: { roomId: string; text: string; replyTo?: string },
  signal: AbortSignal,
) {
  return request<SendAnswer>(
    adapterPath(id, "/send"),
    validateSendAnswer,
    signal,
    body,
  );
}

export function editMessage(
  id: string,
  body: { roomId: string; messageId: string; text: string },
  signal: AbortSignal,
) {
  return request<Schema["EditAnswer"]>(
    adapterPath(id, "/edit"),
    validateEditAnswer,
    signal,
    body,
  );
}

export function deleteMessage(
  id: string,
  body: { roomId: string; messageId: string },
  signal: AbortSignal,
) {
  return request<Schema["Done"]>(
    adapterPath(id, "/delete"),
    validateDone,
    signal,
    body,
  );
}

/** `emojis` becomes this account's whole set of reactions on the message. */
export function setReactions(
  id: string,
  body: { roomId: string; messageId: string; emojis: string[] },
  signal: AbortSignal,
) {
  return request<Schema["ReactAnswer"]>(
    adapterPath(id, "/react"),
    validateReactAnswer,
    signal,
    body,
  );
}

export function markRead(
  id: string,
  body: { roomId: string; messageId: string },
  signal: AbortSignal,
) {
  return request<Schema["Done"]>(
    adapterPath(id, "/read"),
    validateDone,
    signal,
    body,
  );
}

const FRAME_LIMIT = 256 * 1024;

export type AdapterStreamEvent =
  | { type: "ready"; data: Schema["StreamReady"] }
  | { type: "message"; data: Schema["StreamMessage"] }
  | { type: "cursor"; data: Schema["StreamCursor"] }
  | { type: "message.edited"; data: Schema["StreamMessage"] }
  | { type: "message.deleted"; data: Schema["StreamMessagesDeleted"] }
  | { type: "reactions.updated"; data: Schema["StreamReactionsUpdated"] };

export type AdapterStreamEnd =
  | { kind: "eof" }
  | { kind: "aborted" }
  /** The adapter sent its one `error` event and ended the stream. */
  | { kind: "error"; code: string }
  | AdapterProblem;

/**
 * SSE frames for the adapter contract. A frame larger than the limit, an
 * event payload outside the contract or an `error` event ends the parse; an
 * event name the contract does not have is skipped, as additive.
 */
export class AdapterSseParser {
  private readonly decoder = new TextDecoder("utf-8");
  private buffer = "";
  private end: AdapterStreamEnd | undefined;

  constructor(private readonly onEvent: (event: AdapterStreamEvent) => void) {}

  get outcome() {
    return this.end;
  }

  push(chunk: Uint8Array) {
    if (this.end) return;
    this.buffer += this.decoder
      .decode(chunk, { stream: true })
      .replace(/\r\n?/g, "\n");
    for (
      let blank = this.buffer.indexOf("\n\n");
      blank >= 0 && !this.end;
      blank = this.buffer.indexOf("\n\n")
    ) {
      const frame = this.buffer.slice(0, blank);
      this.buffer = this.buffer.slice(blank + 2);
      this.dispatch(frame);
    }
    if (!this.end && this.buffer.length > FRAME_LIMIT)
      this.end = { kind: "protocol" };
  }

  private dispatch(frame: string) {
    let event = "message";
    const data: string[] = [];
    for (const line of frame.split("\n")) {
      if (line.startsWith(":")) continue;
      const colon = line.indexOf(":");
      const field = colon < 0 ? line : line.slice(0, colon);
      const value = colon < 0 ? "" : line.slice(colon + 1).replace(/^ /, "");
      if (field === "event") event = value || "message";
      else if (field === "data") data.push(value);
    }
    if (!data.length || !Object.hasOwn(sseValidators, event)) return;
    const name = event as SseEventName;
    let payload: unknown;
    try {
      payload = JSON.parse(data.join("\n"));
    } catch {
      this.end = { kind: "protocol" };
      return;
    }
    if (!sseValidators[name](payload)) {
      this.end = { kind: "protocol" };
      return;
    }
    if (name === "error") {
      this.end = {
        kind: "error",
        code: (payload as Schema["ErrorEnvelope"]).error.code,
      };
      return;
    }
    if (name === "ping") return;
    this.onEvent({ type: name, data: payload } as AdapterStreamEvent);
  }
}

/** One connection; reconnecting with the last cursor is the caller's policy. */
export async function streamAdapter(
  id: string,
  options: {
    since: Record<string, string>;
    signal: AbortSignal;
    onEvent: (event: AdapterStreamEvent) => void;
  },
): Promise<AdapterStreamEnd> {
  const { signal } = options;
  const params = new URLSearchParams();
  for (const [roomId, messageId] of Object.entries(options.since))
    params.append("since", `${roomId}:${messageId}`);
  const query = params.toString();
  let response: Response;
  try {
    response = await fetch(
      adapterPath(id, `/stream${query ? `?${query}` : ""}`),
      {
        headers: { accept: "text/event-stream" },
        credentials: "same-origin",
        signal,
      },
    );
  } catch {
    return signal.aborted ? { kind: "aborted" } : { kind: "unreachable" };
  }
  const type = response.headers.get("content-type")?.split(";")[0]?.trim();
  if (!response.ok || type !== "text/event-stream" || !response.body) {
    let body: unknown;
    try {
      body = JSON.parse(await response.text());
    } catch {
      if (signal.aborted) return { kind: "aborted" };
      return response.status >= 500
        ? { kind: "unreachable" }
        : { kind: "protocol" };
    }
    if (validateErrorEnvelope(body))
      return {
        kind: "refused",
        status: response.status,
        code: body.error.code,
      };
    return { kind: "protocol" };
  }
  const reader = response.body.getReader();
  const parser = new AdapterSseParser((event) => {
    if (!signal.aborted) options.onEvent(event);
  });
  const cancel = () => {
    reader.cancel().catch(() => {
      // The reader is already closing; there is nothing left to release.
    });
  };
  signal.addEventListener("abort", cancel, { once: true });
  try {
    for (;;) {
      let chunk: Awaited<ReturnType<typeof reader.read>>;
      try {
        chunk = await reader.read();
      } catch {
        return signal.aborted ? { kind: "aborted" } : { kind: "unreachable" };
      }
      if (signal.aborted) return { kind: "aborted" };
      if (chunk.done) return { kind: "eof" };
      parser.push(chunk.value);
      if (parser.outcome) return parser.outcome;
    }
  } finally {
    signal.removeEventListener("abort", cancel);
    reader.releaseLock();
  }
}
