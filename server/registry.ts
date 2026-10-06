import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Who saya draws, as they announced themselves. KakaoTalk cores and tsuba
 * adapters POST /register with saya's one token, naming the address saya
 * should reach them at and the token it should present there; they repeat it
 * every HEARTBEAT_SECONDS and are forgotten TTL_SECONDS after the last one.
 * This is saya's own registration contract (docs/register.md), not either
 * messenger contract.
 */
export type Kind = "kakao" | "adapter";

export type Registration = {
  kind: Kind;
  id: string;
  url: string;
  token: string;
  since: number;
  expires: number;
};

export const HEARTBEAT_SECONDS = 30;
export const TTL_SECONDS = 90;
export const MIN_REGISTER_TOKEN_LENGTH = 32;

const ID = /^[a-z][a-z0-9-]{0,62}$/;
const MAX_BODY = 8 * 1024;
const MAX_TOKEN = 4096;

/**
 * Only addresses inside the machine or the tailnet. A leaked register token
 * must not be able to point saya's proxy, and the user's browser, at an
 * arbitrary host: loopback, Tailscale's CGNAT and ULA ranges, and MagicDNS
 * names are the only places a core or adapter of this deployment lives.
 */
export function allowedUpstream(url: URL): boolean {
  const host = url.hostname.toLowerCase();
  if (host === "localhost" || host === "[::1]") return true;
  if (host.endsWith(".ts.net")) return true;
  if (host.startsWith("[fd7a:115c:a1e0:")) return true;
  const v4 = /^(\d+)\.(\d+)\.\d+\.\d+$/.exec(host);
  if (!v4) return false;
  const [a, b] = [Number(v4[1]), Number(v4[2])];
  return a === 127 || (a === 100 && b >= 64 && b <= 127);
}

export class Registry {
  readonly #entries = new Map<string, Registration>();
  readonly #now: () => number;

  constructor(now: () => number = Date.now) {
    this.#now = now;
  }

  register(entry: Omit<Registration, "since" | "expires">): void {
    const key = `${entry.kind}:${entry.id}`;
    const now = this.#now();
    const held = this.live().find((live) => `${live.kind}:${live.id}` === key);
    const same = held?.url === entry.url && held.token === entry.token;
    this.#entries.set(key, {
      ...entry,
      since: same && held ? held.since : now,
      expires: now + TTL_SECONDS * 1000,
    });
  }

  remove(kind: Kind, id: string): void {
    this.#entries.delete(`${kind}:${id}`);
  }

  live(): Registration[] {
    const now = this.#now();
    for (const [key, entry] of this.#entries)
      if (entry.expires <= now) this.#entries.delete(key);
    return [...this.#entries.values()];
  }

  /** Adapters by id, so the order a list draws them in survives restarts. */
  adapters(): Registration[] {
    return this.live()
      .filter((entry) => entry.kind === "adapter")
      .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  }

  adapter(id: string): Registration | undefined {
    return this.adapters().find((entry) => entry.id === id);
  }

  /**
   * One KakaoTalk account is served by one core at a time (kanao on a PC or
   * kamado on a Mac). If two are live, the one that came up last is the one
   * the account just moved to.
   */
  kakao(): Registration | undefined {
    return this.live()
      .filter((entry) => entry.kind === "kakao")
      .sort((a, b) => b.since - a.since)[0];
  }
}

const digest = (value: string) => createHash("sha256").update(value).digest();

function failure(status: number, code: string, message: string) {
  return Response.json(
    { error: { code, message } },
    { status, headers: { "cache-control": "no-store" } },
  );
}

type Fields = { kind: Kind; id: string; url?: unknown; token?: unknown };

function fields(body: unknown): Fields | string {
  if (typeof body !== "object" || body === null)
    return "Body must be an object";
  const { kind, id, url, token } = body as Record<string, unknown>;
  if (kind !== "kakao" && kind !== "adapter")
    return "kind must be kakao or adapter";
  if (typeof id !== "string" || !ID.test(id))
    return `id must match ${ID.source}`;
  return { kind, id, url, token };
}

/** The register listener's only route. It is never served on the site's origin. */
export function registerHandler(registry: Registry, token: string) {
  const expected = digest(token);
  return async (request: Request): Promise<Response> => {
    if (new URL(request.url).pathname !== "/register")
      return failure(404, "NOT_FOUND", "No such route");
    const presented = /^Bearer (.+)$/.exec(
      request.headers.get("authorization") ?? "",
    )?.[1];
    if (!presented || !timingSafeEqual(digest(presented), expected))
      return failure(401, "UNAUTHORIZED", "A valid bearer token is required");
    if (request.method !== "POST" && request.method !== "DELETE")
      return failure(405, "METHOD_NOT_ALLOWED", "Use POST or DELETE");

    const text = await request.text();
    if (text.length > MAX_BODY)
      return failure(400, "INVALID_REQUEST", "Body is too large");
    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      return failure(400, "INVALID_REQUEST", "Body must be JSON");
    }
    const parsed = fields(body);
    if (typeof parsed === "string")
      return failure(400, "INVALID_REQUEST", parsed);

    if (request.method === "DELETE") {
      registry.remove(parsed.kind, parsed.id);
      return Response.json({}, { headers: { "cache-control": "no-store" } });
    }

    const { url, token: upstreamToken } = parsed;
    if (
      typeof upstreamToken !== "string" ||
      !upstreamToken ||
      upstreamToken.length > MAX_TOKEN ||
      /[\r\n]/.test(upstreamToken)
    )
      return failure(400, "INVALID_REQUEST", "token must be a bearer token");
    let address: URL;
    try {
      address = new URL(String(url));
    } catch {
      return failure(400, "INVALID_REQUEST", "url must be an absolute URL");
    }
    if (
      (address.protocol !== "http:" && address.protocol !== "https:") ||
      address.username ||
      address.password ||
      address.search ||
      address.hash
    )
      return failure(
        400,
        "INVALID_REQUEST",
        "url must be http(s)://host[:port][/path]",
      );
    if (!allowedUpstream(address))
      return failure(
        403,
        "FORBIDDEN",
        "url must be on loopback or the tailnet",
      );
    registry.register({
      kind: parsed.kind,
      id: parsed.id,
      url: address.href.replace(/\/+$/, ""),
      token: upstreamToken,
    });
    return Response.json(
      { interval: HEARTBEAT_SECONDS, ttl: TTL_SECONDS },
      { headers: { "cache-control": "no-store" } },
    );
  };
}
