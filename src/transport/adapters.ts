import type { components } from "../contract/tsuba/decoded";
import {
  validateCapabilities,
  validateErrorEnvelope,
} from "../contract/tsuba/validators.js";

export type Capabilities = components["schemas"]["Capabilities"];

export type AdapterIndexOutcome =
  | { kind: "listed"; ids: string[] }
  /** The proxy has no `/adapters` facility, or answered something that is not one. */
  | { kind: "unconfigured" }
  | { kind: "unreachable" };

export type AdapterOutcome =
  | { kind: "connected"; capabilities: Capabilities }
  /** The adapter answered with an error envelope; `code` is machine-readable. */
  | { kind: "refused"; status: number; code: string }
  /** Nothing behind the proxy answered: the adapter or the path to it is down. */
  | { kind: "unreachable" }
  /** Something answered, but not the adapter contract. */
  | { kind: "protocol" };

const ADAPTERS = "/adapters";
const ID = /^[a-z][a-z0-9-]*$/;

type Reply = { status: number; ok: boolean; body: unknown } | "not-json";

/** Same-origin only: the proxy owns every adapter token, never browser code. */
async function getJson(path: string, signal: AbortSignal): Promise<Reply> {
  const response = await fetch(path, { credentials: "same-origin", signal });
  const text = await response.text();
  try {
    return { status: response.status, ok: response.ok, body: JSON.parse(text) };
  } catch {
    return response.status >= 500
      ? { status: response.status, ok: false, body: undefined }
      : "not-json";
  }
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
    reply = await getJson(ADAPTERS, signal);
  } catch (error) {
    if (signal.aborted) throw error;
    return { kind: "unreachable" };
  }
  if (reply === "not-json") return { kind: "unconfigured" };
  if (reply.status >= 500) return { kind: "unreachable" };
  if (!reply.ok || !isIndex(reply.body)) return { kind: "unconfigured" };
  return { kind: "listed", ids: reply.body.adapters.map(({ id }) => id) };
}

/** Throws only when `signal` aborts; every other failure is an outcome. */
export async function fetchCapabilities(
  id: string,
  signal: AbortSignal,
): Promise<AdapterOutcome> {
  let reply: Reply;
  try {
    reply = await getJson(
      `${ADAPTERS}/${encodeURIComponent(id)}/capabilities`,
      signal,
    );
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
  if (reply.ok && validateCapabilities(reply.body))
    return { kind: "connected", capabilities: reply.body };
  return { kind: "protocol" };
}
