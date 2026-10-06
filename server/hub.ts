import { ADAPTER_RESPONSE_HEADERS, ADAPTERS_PATH } from "./adapters";
import type { Registration, Registry } from "./registry";

/**
 * The site's /api and /adapters, answered from the registry: /api goes to the
 * KakaoTalk core that registered last, /adapters/<id>/* to that adapter, each
 * with the token it registered. The browser sees ids only, as before.
 */

// Hop-by-hop headers, and the browser's own credentials, never travel upstream:
// the only credential an upstream sees is the token it registered.
const DROPPED_REQUEST = [
  "authorization",
  "connection",
  "cookie",
  "host",
  "keep-alive",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
];
const DROPPED_RESPONSE = [
  "connection",
  "keep-alive",
  "set-cookie",
  "trailer",
  "transfer-encoding",
  "upgrade",
];

async function forward(
  request: Request,
  upstream: Registration,
  path: string,
  adapter: boolean,
): Promise<Response> {
  const source = new URL(request.url);
  const headers = new Headers(request.headers);
  for (const name of DROPPED_REQUEST) headers.delete(name);
  headers.set("authorization", `Bearer ${upstream.token}`);
  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  let answer: Response;
  try {
    answer = await fetch(`${upstream.url}${path}${source.search}`, {
      method: request.method,
      headers,
      body: hasBody ? request.body : null,
      redirect: "manual",
      signal: request.signal,
      // Pass bytes through as the upstream encoded them; decoding here would
      // leave a content-encoding header describing bytes that are not there.
      decompress: false,
      ...(hasBody ? { duplex: "half" } : {}),
    } as RequestInit);
  } catch {
    return new Response(null, { status: 502 });
  }
  const out = new Headers(answer.headers);
  for (const name of DROPPED_RESPONSE) out.delete(name);
  if (adapter) {
    // Adapter answers include bytes somebody else sent: never run, never sniffed.
    for (const [name, value] of Object.entries(ADAPTER_RESPONSE_HEADERS))
      out.set(name, value);
    if (!out.has("cache-control")) out.set("cache-control", "no-store");
  } else out.set("cache-control", "no-store");
  return new Response(answer.body, {
    status: answer.status,
    statusText: answer.statusText,
    headers: out,
  });
}

export async function handleHub(
  request: Request,
  registry: Registry,
): Promise<Response | null> {
  const { pathname } = new URL(request.url);

  if (pathname === ADAPTERS_PATH) {
    if (request.method !== "GET")
      return new Response(null, { status: 405, headers: { allow: "GET" } });
    return Response.json(
      { adapters: registry.adapters().map(({ id }) => ({ id })) },
      { headers: { "cache-control": "no-store" } },
    );
  }

  const adapter = /^\/adapters\/([a-z][a-z0-9-]*)(\/.*)$/.exec(pathname);
  if (adapter) {
    const upstream = registry.adapter(adapter[1] ?? "");
    if (!upstream) return new Response(null, { status: 404 });
    return forward(request, upstream, adapter[2] ?? "/", true);
  }

  const api = /^\/api(\/.*)?$/.exec(pathname);
  if (api) {
    const core = registry.kakao();
    // As the proxy answered when no core was healthy: the client reads it as
    // KakaoTalk being away, and says so only in 연결.
    if (!core) return new Response(null, { status: 503 });
    return forward(request, core, api[1] ?? "/", false);
  }

  return null;
}
