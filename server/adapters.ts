import type { Plugin, ProxyOptions } from "vite";

/**
 * Messenger adapters (tsuba) the proxy fronts. Each is its own process with its
 * own address and bearer token; the browser only ever learns their ids. Like
 * `/unfurl`, the `/adapters` index is a facility of the proxy, not a contract a
 * core or an adapter answers.
 */
export type AdapterUpstream = { id: string; url: string; token: string };

export const ADAPTERS_PATH = "/adapters";

const ID = /^[a-z][a-z0-9-]*$/;

export class AdapterConfigError extends Error {}

/**
 * `SAYA_ADAPTERS=telegram,slack`, then per id `SAYA_ADAPTER_<ID>_URL` and
 * `SAYA_ADAPTER_<ID>_TOKEN` (upper case, `-` as `_`). A listed adapter missing
 * either is refused at startup rather than silently left out.
 */
export function adapterUpstreams(
  env: Record<string, string | undefined>,
): AdapterUpstream[] {
  const ids = (env.SAYA_ADAPTERS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  const seen = new Set<string>();
  return ids.map((id) => {
    if (!ID.test(id))
      throw new AdapterConfigError(`Adapter id must match ${ID}: ${id}`);
    if (seen.has(id))
      throw new AdapterConfigError(`Adapter listed twice: ${id}`);
    seen.add(id);
    const key = `SAYA_ADAPTER_${id.toUpperCase().replaceAll("-", "_")}`;
    const url = env[`${key}_URL`];
    const token = env[`${key}_TOKEN`];
    if (!url || !token)
      throw new AdapterConfigError(
        `${key}_URL and ${key}_TOKEN are both required for adapter ${id}`,
      );
    return { id, url, token };
  });
}

/** What the browser may know: ids only. Addresses and tokens stay in the proxy. */
export function adapterIndex(upstreams: AdapterUpstream[]) {
  return { adapters: upstreams.map(({ id }) => ({ id })) };
}

/**
 * Set on every adapter answer whatever the adapter says. `/media` answers with
 * bytes somebody else sent; opened at this origin, they must never run, even
 * from an adapter that forgot its own headers. JSON and SSE are unaffected.
 */
export const ADAPTER_RESPONSE_HEADERS: Readonly<Record<string, string>> = {
  "content-security-policy": "default-src 'none'; sandbox",
  "x-content-type-options": "nosniff",
};

export function adapterProxies(
  upstreams: AdapterUpstream[],
): Record<string, ProxyOptions> {
  return Object.fromEntries(
    upstreams.map(({ id, url, token }) => {
      const prefix = `${ADAPTERS_PATH}/${id}`;
      const options: ProxyOptions = {
        target: url,
        changeOrigin: true,
        rewrite: (path) => path.slice(prefix.length),
        headers: { Authorization: `Bearer ${token}` },
        configure(proxy) {
          proxy.on("proxyRes", (response) => {
            Object.assign(response.headers, ADAPTER_RESPONSE_HEADERS);
          });
        },
      };
      return [`${prefix}/`, options];
    }),
  );
}

/** Serves the index on Vite's development server; production answers it from the reverse proxy. */
export function adaptersPlugin(upstreams: AdapterUpstream[]): Plugin {
  const body = JSON.stringify(adapterIndex(upstreams));
  return {
    name: "saya-adapters",
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        if ((request.url ?? "").replace(/\?.*$/, "") !== ADAPTERS_PATH)
          return next();
        if (request.method !== "GET") {
          response.statusCode = 405;
          response.setHeader("allow", "GET");
          response.end();
          return;
        }
        response.setHeader("content-type", "application/json; charset=utf-8");
        response.setHeader("cache-control", "no-store");
        response.end(body);
      });
    },
  };
}
