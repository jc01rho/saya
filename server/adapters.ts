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
    const key = envKey(id);
    const url = env[`${key}_URL`];
    const token = env[`${key}_TOKEN`];
    if (!url || !token)
      throw new AdapterConfigError(
        `${key}_URL and ${key}_TOKEN are both required for adapter ${id}`,
      );
    return { id, url, token };
  });
}

function envKey(id: string) {
  return `SAYA_ADAPTER_${id.toUpperCase().replaceAll("-", "_")}`;
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
          proxy.on("proxyRes", (upstream, _request, response) => {
            Object.assign(upstream.headers, ADAPTER_RESPONSE_HEADERS);
            // An adapter that dies mid-answer (restarting under an open
            // stream) must end this answer too. Otherwise the browser keeps
            // a stream nothing will write to again and never reconnects.
            upstream.on("close", () => {
              if (!upstream.complete) response.destroy();
            });
          });
        },
      };
      return [`${prefix}/`, options];
    }),
  );
}

/**
 * Caddy's `reverse_proxy` takes scheme, host and port only, so a path in the
 * adapter's address (`tailscale serve --set-path /slack`) becomes a rewrite.
 */
function caddyUpstream(id: string, url: string) {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new AdapterConfigError(`Adapter ${id} URL is not a URL`);
  }
  if (
    (parsed.protocol !== "http:" && parsed.protocol !== "https:") ||
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash
  )
    throw new AdapterConfigError(
      `Adapter ${id} URL must be http(s)://host[:port][/path] with no credentials, query or fragment`,
    );
  return {
    origin: `${parsed.protocol}//${parsed.host}`,
    path: parsed.pathname.replace(/\/+$/, ""),
    https: parsed.protocol === "https:",
  };
}

/**
 * The production proxy's adapter routes, from the same environment the
 * development proxy reads, so adding an adapter is an env change rather than a
 * Caddyfile edit. The output holds no secret: each token stays a placeholder
 * Caddy expands from its own env file. Imported inside the site's `route`.
 */
export function adapterCaddyfile(upstreams: AdapterUpstream[]): string {
  const index = [
    `@adapters_index path ${ADAPTERS_PATH}`,
    "handle @adapters_index {",
    '    header Cache-Control "no-store"',
    '    header Content-Type "application/json; charset=utf-8"',
    `    respond \`${JSON.stringify(adapterIndex(upstreams))}\` 200`,
    "}",
  ];
  const blocks = upstreams.map(({ id, url }) => {
    const { origin, path, https } = caddyUpstream(id, url);
    const name = `@adapter_${id.replaceAll("-", "_")}`;
    const prefix = `${ADAPTERS_PATH}/${id}`;
    return [
      `${name} path ${prefix}/*`,
      `header ${name} {`,
      '    ?Cache-Control "no-store"',
      ...Object.entries(ADAPTER_RESPONSE_HEADERS).map(
        ([header, value]) => `    >${header} "${value}"`,
      ),
      "}",
      `handle ${name} {`,
      `    uri strip_prefix ${prefix}`,
      ...(path ? [`    rewrite * ${path}{uri}`] : []),
      `    reverse_proxy ${origin} {`,
      `        header_up Authorization "Bearer {env.${envKey(id)}_TOKEN}"`,
      // An HTTPS upstream (e.g. tailscale serve) routes on its own host name.
      ...(https ? ["        header_up Host {upstream_hostport}"] : []),
      "        flush_interval -1",
      "    }",
      "}",
    ];
  });
  return `# Generated by scripts/caddy-adapters.ts from SAYA_ADAPTERS. Do not edit.\n\n${[
    index,
    ...blocks,
  ]
    .map((lines) => lines.join("\n"))
    .join("\n\n")}\n`;
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
