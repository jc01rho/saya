import type { components } from "../contract/decoded";
import {
  type SseEventName,
  type SsePayloads,
  sseValidators,
} from "../contract/sse";
import { validateErrorEnvelope } from "../contract/validators.js";
import { type HttpFailure, HttpProtocolError } from "./http";

const FRAME_LIMIT = 256 * 1024;
const DISCARD_LIMIT = 1024 * 1024;

type ErrorDetail = components["schemas"]["ErrorEnvelope"]["error"];
export type SseEvent = {
  [Name in SseEventName]: { type: Name; data: SsePayloads[Name] };
}[SseEventName];
export type SseRecord = SseEvent | { type: "discarded-frame"; bytes: number };
/** Diagnostics deliberately contain neither wire names nor raw payloads. */
export type SseDiagnostic =
  | { type: "unknown-event" }
  | { type: "invalid-payload"; event: SseEventName };
export type SseEnd =
  | { kind: "eof" }
  | { kind: "resource-limited" }
  | { kind: "protocol-error" }
  | { kind: "error"; error: ErrorDetail };
export type SseOutcome = SseEnd | HttpFailure | { kind: "aborted" };
export type SseHandlers = {
  onEvent: (event: SseRecord) => void;
  onDiagnostic?: (diagnostic: SseDiagnostic) => void;
};

/**
 * Byte-counted framing bounds memory even when a single input chunk is huge.
 * TextDecoder retains partial UTF-8 sequences between pushes, never a whole
 * network chunk. CR dispatch waits for one byte of lookahead (or EOF), so CRLF
 * counts and discarded-frame markers are independent of input chunk boundaries.
 */
export class SseParser {
  private readonly decoder = new TextDecoder("utf-8", { ignoreBOM: true });
  private atStart = true;
  private pendingCR = false;
  private lineHasBytes = false;
  private line = "";
  private data: string[] = [];
  private event = "message";
  private frameBytes = 0;
  private discarding = false;
  private discardedBytes = 0;
  private sawCursor = false;
  private awaitingCursor = false;
  private end: SseEnd | undefined;

  constructor(private readonly handlers: SseHandlers) {}

  get outcome(): SseEnd | undefined {
    return this.end;
  }

  get bufferedBytes(): number {
    return this.discarding ? 0 : this.frameBytes;
  }

  /** A ready cursor is not a checkpoint after a discarded message. */
  get canResume(): boolean {
    return this.sawCursor && !this.awaitingCursor;
  }

  push(chunk: Uint8Array): void {
    if (this.end) return;
    let start = 0;
    for (let index = 0; index < chunk.length; index++) {
      const byte = chunk[index];
      if (this.pendingCR) {
        this.pendingCR = false;
        if (byte === 10) {
          this.countByte();
          if (this.end) return;
          this.endLine();
          if (this.end) return;
          start = index + 1;
          continue;
        }
        this.endLine();
        if (this.end) return;
      }
      if (byte === 10 || byte === 13) {
        this.appendBytes(chunk.subarray(start, index));
        this.countByte();
        if (this.end) return;
        if (byte === 13) this.pendingCR = true;
        else this.endLine();
        start = index + 1;
      } else {
        this.lineHasBytes = true;
        this.countByte();
      }
      if (this.end) return;
    }
    this.appendBytes(chunk.subarray(start));
  }

  finish(): SseEnd {
    if (!this.end && this.pendingCR) {
      this.pendingCR = false;
      this.endLine();
    }
    // No synthetic blank line: data at EOF, even a complete JSON value, is lost.
    if (!this.end)
      this.terminate({ kind: this.canResume ? "eof" : "resource-limited" });
    return this.end as SseEnd;
  }

  private countByte() {
    this.frameBytes++;
    if (this.discarding) this.discardedBytes++;
    else if (this.frameBytes > FRAME_LIMIT) {
      this.discarding = true;
      this.awaitingCursor = true;
      this.discardedBytes += this.frameBytes;
      this.line = "";
      this.data = [];
      this.event = "message";
      this.decoder.decode();
      this.atStart = false;
    }
    // Cumulative per connection, so many discarded frames cannot evade the cap.
    if (this.discardedBytes > DISCARD_LIMIT)
      this.terminate({ kind: "resource-limited" });
  }

  private appendBytes(bytes: Uint8Array) {
    if (!this.discarding && bytes.length)
      this.appendText(this.decoder.decode(bytes, { stream: true }));
  }

  private appendText(text: string) {
    if (this.atStart && text.length) {
      this.atStart = false;
      if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
    }
    this.line += text;
  }

  private endLine() {
    if (!this.discarding) this.appendText(this.decoder.decode());
    // A newline also consumes stream-start, even if no text preceded it.
    this.atStart = false;
    const blank = this.discarding ? !this.lineHasBytes : this.line === "";
    if (blank) {
      if (this.discarding) {
        this.handlers.onEvent({
          type: "discarded-frame",
          bytes: this.frameBytes,
        });
      } else if (this.data.length) this.dispatch();
      this.data = [];
      this.event = "message";
      this.frameBytes = 0;
      this.discarding = false;
    } else if (!this.discarding && !this.line.startsWith(":")) {
      const colon = this.line.indexOf(":");
      const field = colon < 0 ? this.line : this.line.slice(0, colon);
      let value = colon < 0 ? "" : this.line.slice(colon + 1);
      if (value.startsWith(" ")) value = value.slice(1);
      if (field === "data") this.data.push(value);
      else if (field === "event") this.event = value || "message";
      // id/retry are deliberately ignored: this contract resumes using cursor.
    }
    this.line = "";
    this.lineHasBytes = false;
  }

  private dispatch() {
    if (!Object.hasOwn(sseValidators, this.event)) {
      this.handlers.onDiagnostic?.({ type: "unknown-event" });
      return;
    }
    const event = this.event as SseEventName;
    let payload: unknown;
    try {
      payload = JSON.parse(this.data.join("\n"));
    } catch {
      this.invalidPayload(event);
      return;
    }
    if (!sseValidators[event](payload)) {
      this.invalidPayload(event);
      return;
    }
    if (event === "cursor") {
      this.sawCursor = true;
      this.awaitingCursor = false;
    } else if (event === "error") {
      this.terminate({
        kind: "error",
        error: (payload as SsePayloads["error"]).error,
      });
    }
    this.handlers.onEvent({ type: event, data: payload } as SseEvent);
  }

  private invalidPayload(event: SseEventName) {
    this.handlers.onDiagnostic?.({ type: "invalid-payload", event });
    if (event !== "message") {
      this.terminate({ kind: "protocol-error" });
      return;
    }
    this.awaitingCursor = true;
    this.discardedBytes += this.frameBytes;
    if (this.discardedBytes > DISCARD_LIMIT) {
      this.terminate({ kind: "resource-limited" });
      return;
    }
    this.handlers.onEvent({ type: "discarded-frame", bytes: this.frameBytes });
  }

  private terminate(outcome: SseEnd) {
    this.end = outcome;
    this.line = "";
    this.data = [];
    this.frameBytes = 0;
    this.decoder.decode();
  }
}

export type StreamRequest = SseHandlers & {
  signal: AbortSignal;
  query?: URLSearchParams;
  /** Defaults to the same-origin proxy; override for a transport integration. */
  url?: string;
};

/**
 * One fetch and one reader, with no automatic reconnect. The proxy injects
 * Authorization; unlike EventSource this transport uses ordinary fetch headers.
 * Callers must treat every outcome except eof as non-resumable unless their
 * connection policy explicitly handles the HTTP failure. Reader cleanup completes
 * before this promise settles (and before a coordinator releases its lock).
 */
export async function streamEvents(
  request: StreamRequest,
): Promise<SseOutcome> {
  if (request.signal.aborted) return { kind: "aborted" };
  const query = request.query?.toString();
  const url = request.url ?? "/api/stream";
  let response: Response;
  try {
    response = await fetch(`${url}${query ? `?${query}` : ""}`, {
      headers: { accept: "text/event-stream" },
      credentials: "same-origin",
      signal: request.signal,
    });
  } catch (error) {
    if (request.signal.aborted) return { kind: "aborted" };
    throw error;
  }
  const contentType = response.headers
    .get("content-type")
    ?.split(";")[0]
    ?.trim()
    .toLowerCase();
  if (!response.ok || contentType !== "text/event-stream") {
    let envelope: unknown;
    try {
      envelope = JSON.parse(await response.text());
    } catch {
      if (request.signal.aborted) return { kind: "aborted" };
      throw new HttpProtocolError();
    }
    if (request.signal.aborted) return { kind: "aborted" };
    if (!validateErrorEnvelope(envelope)) throw new HttpProtocolError();
    return { kind: "failure", status: response.status, error: envelope.error };
  }
  if (!response.body) throw new HttpProtocolError();
  const reader = response.body.getReader();
  const parser = new SseParser({
    onEvent: (event) => {
      if (!request.signal.aborted) request.onEvent(event);
    },
    onDiagnostic: (diagnostic) => {
      if (!request.signal.aborted) request.onDiagnostic?.(diagnostic);
    },
  });
  let finished = false;
  let cancellation: Promise<void> | undefined;
  const cancel = () => {
    cancellation ??= reader.cancel();
  };
  request.signal.addEventListener("abort", cancel, { once: true });
  try {
    if (request.signal.aborted) cancel();
    while (!request.signal.aborted) {
      let chunk: Awaited<ReturnType<typeof reader.read>>;
      try {
        chunk = await reader.read();
      } catch (error) {
        finished = true;
        if (request.signal.aborted) return { kind: "aborted" };
        if (!parser.canResume) return { kind: "resource-limited" };
        throw error;
      }
      if (request.signal.aborted) return { kind: "aborted" };
      if (chunk.done) {
        finished = true;
        return parser.finish();
      }
      parser.push(chunk.value);
      if (parser.outcome) return parser.outcome;
    }
    return { kind: "aborted" };
  } finally {
    request.signal.removeEventListener("abort", cancel);
    try {
      if (!finished) cancel();
      await cancellation;
    } finally {
      reader.releaseLock();
    }
  }
}
