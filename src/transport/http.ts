import type { components, paths } from "../contract/decoded";
import {
  validateAttachments,
  validateContext,
  validateDigest,
  validateErrorEnvelope,
  validateHealthResponse,
  validateNoticeAnswer,
  validateRevisions,
  validateRoomsResponse,
  validateSendResult,
  validateUploadResult,
} from "../contract/validators.js";

type Schema = components["schemas"];

export type JsonRoute =
  | "/health"
  | "/rooms"
  | "/context"
  | "/digest"
  | "/send"
  | "/notice"
  | "/attachments"
  | "/revisions";

export type Health =
  paths["/health"]["get"]["responses"][200]["content"]["application/json"];
export type UploadResult = Schema["UploadResult"];

type RoutePayload = {
  "/health": Health;
  "/rooms": { ok: true; rooms: Schema["Room"][] };
  "/context": Schema["Context"];
  "/digest": Schema["Digest"];
  "/send": Schema["SendResult"];
  "/notice": Schema["NoticeAnswer"];
  "/attachments": Schema["Attachments"];
  "/revisions": Schema["Revisions"];
};

type EnvelopeValidator = (value: unknown) => boolean;

const validators: { [Path in JsonRoute]: EnvelopeValidator } = {
  "/health": validateHealthResponse,
  "/rooms": validateRoomsResponse,
  "/context": validateContext,
  "/digest": validateDigest,
  "/send": validateSendResult,
  "/notice": validateNoticeAnswer,
  "/attachments": validateAttachments,
  "/revisions": validateRevisions,
};

/** A file message's bytes, as `/file` streamed them. */
export type FileSuccess = {
  kind: "success";
  blob: Blob;
  /** From `Content-Disposition`; somebody else wrote it, so it is only ever a download name. */
  name: string | null;
  /** `local` for the desktop client's saved copy, `remote` for the address. */
  source: "local" | "remote" | null;
};
export type FileOutcome = FileSuccess | HttpFailure | HttpDiscarded;

/**
 * The name in a `Content-Disposition` header: `filename*` (RFC 5987, UTF-8,
 * percent-encoded) wins over the printable-ASCII `filename` fallback.
 */
export function dispositionName(header: string | null): string | null {
  if (!header) return null;
  const extended = /filename\*\s*=\s*([^']*)'[^']*'([^;]+)/i.exec(header);
  if (extended?.[2]) {
    try {
      const name = decodeURIComponent(extended[2].trim());
      if (name) return name;
    } catch {
      // A broken escape falls through to the plain name.
    }
  }
  const plain = /filename\s*=\s*("([^"]*)"|[^;]+)/i.exec(header);
  const name = (plain?.[2] ?? plain?.[1])?.trim();
  return name || null;
}

/** The code a proxy's own `413` stands for: it answers without the core's envelope. */
export const PROXY_TOO_LARGE = "PAYLOAD_TOO_LARGE";

export type HttpSuccess<T> = { kind: "success"; data: T };
export type HttpFailure = {
  kind: "failure";
  status: number;
  error: Schema["ErrorEnvelope"]["error"];
};
export type HttpDiscarded = { kind: "discarded" };
export type HttpOutcome<T> = HttpSuccess<T> | HttpFailure | HttpDiscarded;

export class HttpProtocolError extends Error {
  constructor() {
    super("The bridge returned an invalid HTTP envelope.");
    this.name = "HttpProtocolError";
  }
}

export type JsonRequest<Path extends JsonRoute> = {
  path: Path;
  signal: AbortSignal;
  /** Requests with the same key supersede earlier responses. */
  generationKey?: string;
  query?: URLSearchParams;
  body?: unknown;
};

/**
 * The sole JSON HTTP boundary. It deliberately has no authorization option:
 * the same-origin proxy owns the bearer token, never browser code.
 */
export class HttpClient {
  private readonly generations = new Map<string, number>();

  constructor(
    readonly showCovered: components["parameters"]["ShowCovered"] = false,
  ) {}

  async request<Path extends JsonRoute>(
    request: JsonRequest<Path>,
  ): Promise<HttpOutcome<RoutePayload[Path]>> {
    const generationKey = request.generationKey ?? request.path;
    const generation = (this.generations.get(generationKey) ?? 0) + 1;
    this.generations.set(generationKey, generation);

    if (request.signal.aborted) return { kind: "discarded" };

    let response: Response;
    try {
      response = await fetch(this.urlFor(request), {
        method: request.body === undefined ? "GET" : "POST",
        ...(request.body === undefined
          ? {}
          : {
              headers: { "content-type": "application/json" },
              body: JSON.stringify(request.body),
            }),
        credentials: "same-origin",
        signal: request.signal,
      });
    } catch (error) {
      if (!this.isCurrent(generationKey, generation, request.signal))
        return { kind: "discarded" };
      throw error;
    }

    let envelope: unknown;
    try {
      envelope = JSON.parse(await response.text());
    } catch {
      throw new HttpProtocolError();
    }

    if (!this.isCurrent(generationKey, generation, request.signal))
      return { kind: "discarded" };

    if (validateErrorEnvelope(envelope)) {
      return {
        kind: "failure",
        status: response.status,
        error: envelope.error,
      };
    }

    if (!response.ok || !validators[request.path](envelope))
      throw new HttpProtocolError();

    return {
      kind: "success",
      data: envelope as RoutePayload[Path],
    };
  }

  /**
   * `/file`, the one route that answers with bytes. A 2xx is the file whatever
   * its type — a file may itself be JSON — and anything else must be an error
   * envelope, such as `410 FILE_EXPIRED`, or it is a protocol failure.
   */
  async file(request: {
    roomId: string;
    messageId: string;
    signal: AbortSignal;
  }): Promise<FileOutcome> {
    if (request.signal.aborted) return { kind: "discarded" };
    const query = new URLSearchParams({
      roomId: request.roomId,
      messageId: request.messageId,
      // The same owner decision as `/context` (DESIGN.md G2): a room the user
      // chose to read is opened rather than refused with KEY_UNAVAILABLE.
      open: "true",
    });
    let response: Response;
    try {
      response = await fetch(`/api/file?${query}`, {
        credentials: "same-origin",
        signal: request.signal,
      });
    } catch (error) {
      if (request.signal.aborted) return { kind: "discarded" };
      throw error;
    }
    if (response.ok) {
      const blob = await response.blob();
      if (request.signal.aborted) return { kind: "discarded" };
      const source = response.headers.get("x-kanao-source");
      return {
        kind: "success",
        blob,
        name: dispositionName(response.headers.get("content-disposition")),
        source: source === "local" || source === "remote" ? source : null,
      };
    }
    let envelope: unknown;
    try {
      envelope = JSON.parse(await response.text());
    } catch {
      throw new HttpProtocolError();
    }
    if (request.signal.aborted) return { kind: "discarded" };
    if (!validateErrorEnvelope(envelope)) throw new HttpProtocolError();
    return { kind: "failure", status: response.status, error: envelope.error };
  }

  /**
   * `POST /upload`: one file, sent through the desktop client's own file
   * button. One attempt, like `/send`: a refusal changed nothing, and anything
   * else leaves the outcome to be read back. The proxy's own size refusal
   * (`413`, no envelope) is a refusal too: nothing reached the core.
   */
  async upload(request: {
    room: string;
    file: File;
    signal: AbortSignal;
  }): Promise<HttpOutcome<UploadResult>> {
    if (request.signal.aborted) return { kind: "discarded" };
    const form = new FormData();
    form.set("room", request.room);
    form.set("file", request.file, request.file.name);
    form.set("openRoom", "true");
    let response: Response;
    try {
      response = await fetch("/api/upload", {
        method: "POST",
        body: form,
        credentials: "same-origin",
        signal: request.signal,
      });
    } catch (error) {
      if (request.signal.aborted) return { kind: "discarded" };
      throw error;
    }
    const text = await response.text();
    if (request.signal.aborted) return { kind: "discarded" };
    let envelope: unknown;
    try {
      envelope = JSON.parse(text);
    } catch {
      if (response.status === 413)
        return {
          kind: "failure",
          status: 413,
          error: {
            code: PROXY_TOO_LARGE,
            message: "The proxy refused the body",
          },
        };
      throw new HttpProtocolError();
    }
    if (validateErrorEnvelope(envelope))
      return {
        kind: "failure",
        status: response.status,
        error: envelope.error,
      };
    if (!response.ok || !validateUploadResult(envelope))
      throw new HttpProtocolError();
    return { kind: "success", data: envelope };
  }

  private isCurrent(key: string, generation: number, signal: AbortSignal) {
    return !signal.aborted && this.generations.get(key) === generation;
  }

  private urlFor<Path extends JsonRoute>(request: JsonRequest<Path>) {
    const params = new URLSearchParams(request.query);
    // These are the only routes declaring ShowCovered in the pinned contract.
    if (request.path === "/context" || request.path === "/digest") {
      if (this.showCovered) params.set("showCovered", "true");
      else params.delete("showCovered");
    }
    const query = params.toString();
    return `/api${request.path}${query ? `?${query}` : ""}`;
  }
}
