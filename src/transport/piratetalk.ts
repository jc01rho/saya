import { validateExtension } from "../contract/piratetalk/boundary";
import type { components } from "../contract/piratetalk/decoded";

type Schema = components["schemas"];
export type ExtensionResult<T> =
  | { readonly kind: "success"; readonly data: T }
  | { readonly kind: "failure"; readonly error: Schema["Error"] }
  | { readonly kind: "cancelled" };
export type Capabilities = Schema["CapabilitiesResponse"];
export type Mutation = Schema["MutationResponse"];
export type Send = Schema["SendRequest"];
export type Discovery =
  | { readonly kind: "checking" }
  | { readonly kind: "available"; readonly capabilities: Capabilities }
  | { readonly kind: "unsupported" }
  | { readonly kind: "unauthorized" }
  | { readonly kind: "incompatible" }
  | { readonly kind: "malformed" }
  | { readonly kind: "unreachable" };

const PREFIX = "/api/extensions/piratetalk/v1";
const uncertain = (): Mutation => ({
  outcome: "unconfirmed",
  error: {
    code: "delivery_unconfirmed",
    detail: "Delivery could not be confirmed.",
  },
});

/** Proxy owns credentials. Every mutation is exactly one HTTP attempt. */
export class PirateTalkTransport {
  private async request<Name extends keyof Schema>(
    path: string,
    schema: Name,
    signal: AbortSignal,
    init: RequestInit = {},
  ): Promise<ExtensionResult<Schema[Name]>> {
    try {
      const response = await fetch(`${PREFIX}/${path}`, {
        ...init,
        credentials: "same-origin",
        signal,
      });
      const value: unknown = await response.json();
      if (signal.aborted) return { kind: "cancelled" };
      if (response.ok && validateExtension(schema, value))
        return { kind: "success", data: value };
      if (!response.ok && validateExtension("ErrorResponse", value))
        return { kind: "failure", error: value.error };
      return {
        kind: "failure",
        error: {
          code: "malformed_response",
          detail: "Extension response does not match its contract.",
        },
      };
    } catch (error) {
      if (signal.aborted) return { kind: "cancelled" };
      return {
        kind: "failure",
        error: {
          code:
            error instanceof SyntaxError ? "malformed_response" : "unreachable",
          detail: "Extension request could not be completed.",
        },
      };
    }
  }

  private query<
    RequestName extends keyof Schema,
    ResponseName extends keyof Schema,
  >(
    path: string,
    requestName: RequestName,
    responseName: ResponseName,
    body: Schema[RequestName],
    signal: AbortSignal,
  ): Promise<ExtensionResult<Schema[ResponseName]>> {
    if (!validateExtension(requestName, body))
      return Promise.resolve({
        kind: "failure",
        error: { code: "invalid_request", detail: "Request was not sent." },
      });
    const query = new URLSearchParams();
    if (body !== null && typeof body === "object") {
      for (const [key, value] of Object.entries(body))
        if (value !== undefined) query.set(key, String(value));
    }
    return this.request(`${path}?${query}`, responseName, signal);
  }

  history(body: Schema["HistoryRequest"], signal: AbortSignal) {
    return this.query(
      "history",
      "HistoryRequest",
      "HistoryResponse",
      body,
      signal,
    );
  }
  search(body: Schema["SearchRequest"], signal: AbortSignal) {
    return this.query(
      "search",
      "SearchRequest",
      "SearchResponse",
      body,
      signal,
    );
  }
  thread(body: Schema["ThreadRequest"], signal: AbortSignal) {
    return this.query(
      "thread",
      "ThreadRequest",
      "ThreadResponse",
      body,
      signal,
    );
  }
  attachments(body: Schema["AttachmentsRequest"], signal: AbortSignal) {
    return this.query(
      "attachments",
      "AttachmentsRequest",
      "AttachmentsResponse",
      body,
      signal,
    );
  }
  members(body: Schema["MembersRequest"], signal: AbortSignal) {
    return this.query(
      "members",
      "MembersRequest",
      "MembersResponse",
      body,
      signal,
    );
  }
  friends(body: Schema["FriendsRequest"], signal: AbortSignal) {
    return this.query(
      "friends",
      "FriendsRequest",
      "FriendsResponse",
      body,
      signal,
    );
  }
  profile(body: Schema["ProfileRequest"], signal: AbortSignal) {
    return this.query(
      "profile",
      "ProfileRequest",
      "ProfileResponse",
      body,
      signal,
    );
  }
  stickers(body: Schema["StickersRequest"], signal: AbortSignal) {
    return this.query(
      "stickers",
      "StickersRequest",
      "StickersResponse",
      body,
      signal,
    );
  }

  private model<
    RequestName extends "SummaryRequest" | "QuestionRequest",
    ResponseName extends "SummaryResponse" | "QuestionResponse",
  >(
    path: string,
    requestName: RequestName,
    responseName: ResponseName,
    body: Schema[RequestName],
    signal: AbortSignal,
  ): Promise<ExtensionResult<Schema[ResponseName]>> {
    if (!validateExtension(requestName, body))
      return Promise.resolve({
        kind: "failure",
        error: { code: "invalid_request", detail: "Request was not sent." },
      });
    return this.request(path, responseName, signal, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  }
  summary(body: Schema["SummaryRequest"], signal: AbortSignal) {
    return this.model(
      "summary",
      "SummaryRequest",
      "SummaryResponse",
      body,
      signal,
    );
  }
  question(body: Schema["QuestionRequest"], signal: AbortSignal) {
    return this.model(
      "question",
      "QuestionRequest",
      "QuestionResponse",
      body,
      signal,
    );
  }

  upload(roomId: string, file: File, signal: AbortSignal) {
    if (!validateExtension("RoomId", roomId))
      return Promise.resolve<ExtensionResult<Schema["UploadResponse"]>>({
        kind: "failure",
        error: { code: "invalid_request", detail: "Invalid upload room." },
      });
    const body = new FormData();
    body.set("roomId", roomId);
    body.set("file", file);
    return this.request("uploads", "UploadResponse", signal, {
      method: "POST",
      body,
    });
  }

  async cancelUpload(roomId: string, uploadId: string): Promise<void> {
    const body = { roomId, uploadId };
    if (!validateExtension("CancelUploadRequest", body))
      throw new TypeError("Invalid upload cancellation");
    const response = await fetch(`${PREFIX}/uploads`, {
      method: "DELETE",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (response.status === 204) return;
    const value: unknown = await response.json();
    if (validateExtension("ErrorResponse", value))
      throw new Error(value.error.detail);
    throw new Error("Upload cancellation could not be confirmed");
  }

  async discover(signal: AbortSignal): Promise<Discovery> {
    try {
      const response = await fetch(`${PREFIX}/capabilities`, {
        credentials: "same-origin",
        signal,
      });
      if (response.status === 404) return { kind: "unsupported" };
      if (response.status === 401) return { kind: "unauthorized" };
      if (!response.ok) return { kind: "unreachable" };
      const value: unknown = await response.json();
      if (
        value !== null &&
        typeof value === "object" &&
        "version" in value &&
        typeof value.version === "string" &&
        value.version !== "1.0.0"
      )
        return { kind: "incompatible" };
      return validateExtension("CapabilitiesResponse", value)
        ? { kind: "available", capabilities: value }
        : { kind: "malformed" };
    } catch (error) {
      if (signal.aborted) throw error;
      return {
        kind: error instanceof SyntaxError ? "malformed" : "unreachable",
      };
    }
  }

  async send(body: Send, signal: AbortSignal): Promise<Mutation> {
    return this.mutate("send", "SendRequest", body, signal);
  }

  reaction(
    body: Schema["ReactionRequest"],
    signal: AbortSignal,
  ): Promise<Mutation> {
    return this.mutate("reaction", "ReactionRequest", body, signal);
  }

  async read(
    body: Schema["ReadRequest"],
    signal: AbortSignal,
  ): Promise<Schema["ReadResponse"] | Mutation> {
    if (!validateExtension("ReadRequest", body) || signal.aborted)
      return {
        outcome: "rejected",
        error: { code: "invalid_request", detail: "Request was not sent." },
      };
    try {
      const response = await fetch(`${PREFIX}/read`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
        signal,
      });
      const value: unknown = await response.json();
      if (
        response.ok &&
        validateExtension("ReadResponse", value) &&
        value.roomId === body.roomId &&
        value.messageId === body.messageId
      )
        return value;
      if (
        validateExtension("MutationResponse", value) &&
        value.outcome !== "confirmed"
      )
        return value;
      if (
        [400, 401, 404, 413, 415, 429, 503].includes(response.status) &&
        validateExtension("ErrorResponse", value)
      )
        return { outcome: "rejected", error: value.error };
      return uncertain();
    } catch {
      return uncertain();
    }
  }

  async stickerResource(
    body: Schema["StickerResourceRequest"],
    signal: AbortSignal,
  ): Promise<ExtensionResult<Blob>> {
    if (!validateExtension("StickerResourceRequest", body))
      return {
        kind: "failure",
        error: { code: "invalid_request", detail: "Invalid sticker identity." },
      };
    try {
      const response = await fetch(
        `${PREFIX}/sticker-resource?${new URLSearchParams(body)}`,
        { credentials: "same-origin", signal },
      );
      if (signal.aborted) return { kind: "cancelled" };
      const mime = response.headers.get("content-type")?.split(";")[0]?.trim();
      if (
        response.ok &&
        mime &&
        ["image/png", "image/gif", "image/webp", "image/jpeg"].includes(mime)
      )
        return { kind: "success", data: await response.blob() };
      const value: unknown = await response.json();
      if (!response.ok && validateExtension("ErrorResponse", value))
        return { kind: "failure", error: value.error };
      return {
        kind: "failure",
        error: {
          code: "malformed_response",
          detail: "Invalid sticker resource.",
        },
      };
    } catch (error) {
      if (signal.aborted) return { kind: "cancelled" };
      return {
        kind: "failure",
        error: {
          code:
            error instanceof SyntaxError ? "malformed_response" : "unreachable",
          detail: "Sticker resource unavailable.",
        },
      };
    }
  }

  private async mutate<Name extends "SendRequest" | "ReactionRequest">(
    path: "send" | "reaction",
    schema: Name,
    body: Schema[Name],
    signal: AbortSignal,
  ): Promise<Mutation> {
    if (!validateExtension(schema, body) || signal.aborted)
      return {
        outcome: "rejected",
        error: { code: "invalid_request", detail: "Request was not sent." },
      };
    try {
      const response = await fetch(`${PREFIX}/${path}`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
        signal,
      });
      const value: unknown = await response.json();
      if (validateExtension("MutationResponse", value)) {
        if (value.outcome === "confirmed" && !response.ok) return uncertain();
        return value;
      }
      if (
        [400, 401, 404, 413, 415, 429, 503].includes(response.status) &&
        validateExtension("ErrorResponse", value)
      )
        return { outcome: "rejected", error: value.error };
      return uncertain();
    } catch {
      // Once fetch starts, transport failure or cancellation is not non-delivery.
      return uncertain();
    }
  }
}
