# Deployment: static client behind a same-origin proxy

The production artifact is **only** `dist/`. This repository does not ship a
server or run a core process. Serve `dist/` through an existing Caddy or nginx
instance that owns the bearer token and proxies the browser's same-origin
`/api/*` requests to `kanao serve` or `kamado serve`.

The browser must never receive `SAYA_CORE_TOKEN`. Do not add a `VITE_` prefix,
put the token in HTML, or use a build-time replacement. `SAYA_CORE_URL` and
`SAYA_CORE_TOKEN` are process environment variables for the development proxy
or external reverse proxy only; production `dist/` does not read them.

## Caddy

1. Build the static artifact with `bun run build`.
2. Copy `.env.example` to a private `.env` file, set the core URL and a real
   token, and keep that file out of source control.
3. Run Caddy from the repository root so `root * dist` resolves to the built
   artifact:

   ```sh
   caddy run --envfile .env --config deploy/Caddyfile.example
   ```

`deploy/Caddyfile.example` binds `http://127.0.0.1:8080` by default. It strips
`/api`, injects `Authorization: Bearer` at the upstream hop, and streams SSE
with `flush_interval -1`. It deliberately sets no stream or idle timeout: the
core contract does not promise any ping cadence, so a short timeout would
silently sever a healthy stream.

The proxy returns `403` for `POST`, `PUT`, `PATCH`, and `DELETE` unless all of
the following are true:

- `Origin` is this site's origin;
- `Sec-Fetch-Site` is `same-origin`;
- `Content-Type` is `application/json`.

This is a fail-closed browser-write boundary, not a substitute for user access
control. The core bearer credential remains hidden from JavaScript, but anyone
who can use the proxy's origin can otherwise act with it.

## Remote exposure

The loopback configuration is the safe default. Do **not** change it to a
remote binding unless both conditions are in place:

1. TLS terminates at the public proxy; and
2. a separate user-authentication and authorization layer protects the site.

For a remote Caddy deployment, replace the site address and the `Origin`
matcher in the example with the same HTTPS public origin, and add the
organization's authentication handler before the `/api` handler. Keep the core
itself bound to a private or loopback interface. If either TLS or separate user
authentication is unavailable, leave the proxy loopback-only.

nginx deployments must implement the same contract: `proxy_pass` after
removing `/api`, an upstream-only `Authorization: Bearer` header sourced from
its environment or secret store, `proxy_buffering off` for SSE, no short
read/idle timeout, and the same fail-closed Origin, Fetch-Metadata, and JSON
write checks before proxying.

## Response and log policy

The proxy contract is:

- `/api/*`: `Cache-Control: no-store`.
- Vite hashed files under `/assets/`: `Cache-Control: public, max-age=31536000, immutable`.
- `index.html` and SPA fallbacks: `Cache-Control: no-cache`.
- CSP: `default-src 'self'; worker-src 'self'; object-src 'none'; frame-ancestors 'none'`.
  The example also restricts scripts and styles to `'self'`; it permits neither
  inline code nor eval.
- Do not enable access or error logging that records credential headers,
  request bodies, or message text. The example discards Caddy logs by default.
  If operational logs are required, use a reviewed redaction policy that omits
  those fields rather than logging raw requests or upstream errors.

## Development is not production

`bun run dev` uses Vite's loopback development proxy. It can read
`SAYA_CORE_URL` and `SAYA_CORE_TOKEN` from the process environment, strips
`/api`, and injects the header server-side. It is not part of `dist/` and is not
a production BFF. Production uses the external proxy above; the static client
continues to call relative `/api` paths only.

A successful unauthenticated `GET /health` shows only that the core is alive.
It does not prove the bearer configuration is valid or that authenticated routes
will succeed.
