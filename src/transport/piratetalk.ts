import { validateExtension } from "../contract/piratetalk/boundary";
import type { components } from "../contract/piratetalk/decoded";

type Schema = components["schemas"];
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
    if (!validateExtension("SendRequest", body) || signal.aborted)
      return {
        outcome: "rejected",
        error: { code: "invalid_request", detail: "Request was not sent." },
      };
    try {
      const response = await fetch(`${PREFIX}/send`, {
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
