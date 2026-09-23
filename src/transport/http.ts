import type { components } from "../contract/decoded";
import {
  validateContext,
  validateDigest,
  validateErrorEnvelope,
  validateHealthResponse,
  validateRoomsResponse,
  validateSendResult,
} from "../contract/validators.js";

type Schema = components["schemas"];

export type JsonRoute = "/health" | "/rooms" | "/context" | "/digest" | "/send";

type RoutePayload = {
  "/health": { ok: true };
  "/rooms": { ok: true; rooms: Schema["Room"][] };
  "/context": Schema["Context"];
  "/digest": Schema["Digest"];
  "/send": Schema["SendResult"];
};

type EnvelopeValidator = (value: unknown) => boolean;

const validators: { [Path in JsonRoute]: EnvelopeValidator } = {
  "/health": validateHealthResponse,
  "/rooms": validateRoomsResponse,
  "/context": validateContext,
  "/digest": validateDigest,
  "/send": validateSendResult,
};

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

  private isCurrent(key: string, generation: number, signal: AbortSignal) {
    return !signal.aborted && this.generations.get(key) === generation;
  }

  private urlFor<Path extends JsonRoute>(request: JsonRequest<Path>) {
    const query = request.query?.toString();
    return `/api${request.path}${query ? `?${query}` : ""}`;
  }
}
