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
   bun --env-file=.env scripts/caddy-adapters.ts deploy/adapters.caddy
   caddy run --envfile .env --config deploy/Caddyfile.example
   ```

   The first line writes the adapter routes the example imports (see
   [Messenger adapters](#messenger-adapters-tsuba)); with no `SAYA_ADAPTERS`
   it writes an empty index.

`deploy/Caddyfile.example` binds `http://127.0.0.1:8080` by default. It strips
`/api`, injects `Authorization: Bearer` at the upstream hop, and streams SSE
with `flush_interval -1`. It deliberately sets no stream or idle timeout: the
core contract does not promise any ping cadence, so a short timeout would
silently sever a healthy stream.

The proxy returns `403` for `POST`, `PUT`, `PATCH`, and `DELETE` unless all of
the following are true:

- `Origin` is this site's origin;
- `Sec-Fetch-Site` is `same-origin`;
- `Content-Type` is `application/json`, or `multipart/form-data` on one of the
  two upload routes, `/api/upload` and `/adapters/<id>/upload`.

Those two routes also carry `request_body max_size 60MiB`, above the largest
`maxBytes` a core or adapter declares (50 MB): the proxy passes on no more than
that, whatever the request claims. The core or adapter answers a file past its
own limit with `400`, from the declared length or while it reads; measured on
the tailnet deployment, a 61 MiB upload to a 10 MiB adapter was refused by the
adapter both with a declared length and chunked. Keep both parts when you copy
the example: without the multipart allowance a file send is refused with `403`,
and without the size bound a body is limited only by the core or adapter
behind it.

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

## Messenger adapters (tsuba)

Each tsuba adapter is its own upstream with its own bearer token, answering the
adapter contract (`contracts/tsuba.openapi.json`). The proxy serves two things
for them, and the browser learns nothing but their ids:

- `GET /adapters` — the index, `{"adapters":[{"id":"telegram"}]}`. It is a
  facility of the proxy, like `/unfurl`, not part of either contract.
- `/adapters/<id>/*` — stripped of that prefix and forwarded to the adapter,
  with `Authorization: Bearer <its token>` added by the proxy.

Both proxies read the same variables: `SAYA_ADAPTERS=telegram,slack` and, per
id, `SAYA_ADAPTER_<ID>_URL` and `SAYA_ADAPTER_<ID>_TOKEN` (upper case, `-` as
`_`; `server/adapters.ts`). A listed id missing either refuses to start.
Adding an adapter that answers the tsuba contract is three lines in the env
file and a restart; nothing in saya or the Caddyfile changes.

In production, `scripts/caddy-adapters.ts` turns those variables into the
index and one handle per adapter, and the Caddyfile imports the result
(`import adapters.caddy`). `deploy/saya-proxy.service` runs it as
`ExecStartPre`, so a restart regenerates it, and a bad entry stops the start
instead of silently dropping an adapter. The file holds addresses but no
token: each handle says `{env.SAYA_ADAPTER_<ID>_TOKEN}` and Caddy expands it
from its own env file. An `https` adapter (`tailscale serve`, tailnet only)
gets `header_up Host {upstream_hostport}`, because it routes on its own host
name. Never put an adapter on a public address to make it reachable; the
tailnet or an SSH forward is the path.

Several adapters on one machine can share one tailnet address, split by path
(`tailscale serve --https=443 --set-path /slack http://127.0.0.1:8793`), so an
adapter URL may carry a path, e.g. `https://oci.example.ts.net/slack`. The
development proxy keeps that path in front of every route. Caddy's
`reverse_proxy` takes only scheme, host and port, so the generator moves the
path into `rewrite * /slack{uri}` after `uri strip_prefix`.

`/adapters/<id>/media` answers the bytes of a file somebody else sent, opened
at this origin. The adapter already answers it sandboxed, but the proxy does
not rely on that: both the development proxy (`ADAPTER_RESPONSE_HEADERS`) and
the generated Caddy handles set `Content-Security-Policy: default-src 'none';
sandbox` and `X-Content-Type-Options: nosniff` on every adapter answer, after
the upstream's own headers (`>` defers them). Both are written from the same
`ADAPTER_RESPONSE_HEADERS`. Cache-Control is a default only (`?`), so `/media`
keeps its `private, max-age=86400` while everything else is `no-store`.

## Running it as a service on a tailnet

One way that keeps every listener on loopback: the proxy and the unfurl service
run under systemd on a server, and Tailscale is both the TLS terminator and the
user boundary (only the owner's tailnet devices reach it).

1. On the machine running the KakaoTalk core, expose it to the tailnet only:
   `tailscale serve --bg --https=8765 http://127.0.0.1:8765`. The core keeps its
   loopback binding and still demands its bearer token.
2. On the server: clone this repository, `bun install --frozen-lockfile`,
   `bun run build`. Copy `deploy/Caddyfile.example` outside the repository and
   set: a loopback listener (`http://:8796` with `bind 127.0.0.1` accepts the
   host name tailscale forwards), `root` to the built `dist`, the Origin matcher
   to the tailnet origin (`https://<server>.<tailnet>.ts.net`), the core upstream
   to `https://<pc>.<tailnet>.ts.net:8765` written literally (a runtime
   placeholder cannot carry the `https` scheme), the /unfurl port, and
   `import /var/lib/saya-proxy/adapters.caddy` where the example imports
   `adapters.caddy`.
3. Write an env file readable only by the service user (`chmod 600`):
   `SAYA_CORE_TOKEN`, `SAYA_ADAPTERS`, and per adapter its `_URL` and
   `_TOKEN`. Adapters on the same server are reached on loopback
   (`http://127.0.0.1:8790`). Never print the tokens.
4. Install `deploy/saya-proxy.service` and `deploy/saya-unfurl.service` (adjust
   user and paths), then `systemctl enable --now saya-proxy saya-unfurl`.
5. `tailscale serve --bg --https=443 --set-path / http://127.0.0.1:8796`. Paths
   other services already hold on that address keep working.

Check, from a tailnet device: `/` is the client, `/adapters` is JSON, `/api/health`
answers, and a `POST` without this site's `Origin` is `403`. To update, pull
and `bun run build`; the proxy serves the new `dist/` without a restart. To
add or remove an adapter, edit the env file and
`sudo systemctl restart saya-proxy`. While
the core's machine is off, KakaoTalk is simply absent from the lists.

### Following whichever core is up

When one account is served by `kanao serve` on a PC some days and by
`kamado serve` on a Mac on others, and only one of them runs at a time, list
both as upstreams and let the proxy follow the live one instead of editing the
Caddyfile to switch:

```caddyfile
reverse_proxy https://<pc>.<tailnet>.ts.net:8765 https://<mac>.<tailnet>.ts.net:8765 {
    lb_policy first
    health_uri /health
    health_interval 5s
    health_timeout 3s
    lb_try_duration 3s
    header_up Authorization "Bearer {env.SAYA_CORE_TOKEN}"
    header_up Host {upstream_hostport}
    flush_interval -1
}
```

- Both cores answer `GET /health` without a token, so the active check needs
  no secret. A stopped core behind `tailscale serve` answers `502`, and a
  machine that is off does not answer; either way it is skipped.
- Give both the **same token**; the proxy injects one `SAYA_CORE_TOKEN`.
- The client sees one core either way. The two builds share the contract, so
  nothing in saya changes; keys one build adds (`typeCode`) are ignored by
  the other's readers.
- A switch takes up to one `health_interval`. Requests in that window may fail
  once. Caddy retries a `POST` only when the connection to a core never
  opened, so a send that reached a core is never sent again elsewhere. An open stream ends
  when its core stops, and the client reconnects with its cursor; log ids are
  the account's, so the cursor means the same thing on the other machine.
- If both run at once, `lb_policy first` uses the first listed. Keep one
  stopped.

## The link-preview endpoint

`/unfurl` is optional. It is **not** part of `openapi.json` and never reaches a
core: it fetches the page at a URL that appeared in a message and returns the
few Open Graph fields a card needs. Omit it and the client draws plain links.

```sh
SAYA_UNFURL_PORT=8791 bun server/serve.ts
```

It binds loopback and has no authentication of its own; the site's proxy is what
fronts it, which is why `deploy/Caddyfile.example` routes `/unfurl*` to it rather
than exposing it. Keep it on loopback.

Two properties are not optional if you run it:

- **The address is attacker-chosen.** Whoever wrote the message picked it, and
  the fetch runs from inside your network. `server/guard.ts` refuses non-HTTP
  schemes, credentials in the URL, ports other than 80/443, and every private,
  loopback, link-local, CGNAT, unique-local and v4-mapped address — re-checking
  on **each** redirect hop, because one public answer does not bind the next.
  `tests/server/guard.test.ts` is that boundary's test; read it before changing
  the guard.
- **The browser never contacts the linked site.** Card images are relayed
  through `/unfurl/image`, so the CSP below stays `default-src 'self'`, the
  reader's address is not disclosed to the site, and an `image/svg+xml` answer
  is refused rather than rendered.

Bodies are capped (512 KiB for a page, 2 MiB for an image), the deadline is six
seconds, redirects stop at three, and results are cached in memory for thirty
minutes. Nothing is written to disk.

## Response and log policy

The proxy contract is:

- `/api/*`: `Cache-Control: no-store`.
- Vite hashed files under `/assets/`: `Cache-Control: public, max-age=31536000, immutable`.
- `index.html` and SPA fallbacks: `Cache-Control: no-cache`.
- CSP: `default-src 'self'; connect-src 'self' https://heoooooon.github.io; worker-src 'self'; object-src 'none'; frame-ancestors 'none'`.
  `connect-src` names the theme gallery's origin; see [Theme gallery](#theme-gallery).
  The example also restricts scripts and styles to `'self'`; it permits neither
  inline code nor eval.
- Do not enable access or error logging that records credential headers,
  request bodies, or message text. The example discards Caddy logs by default.
  If operational logs are required, use a reviewed redaction policy that omits
  those fields rather than logging raw requests or upstream errors.

## Theme gallery

The theme sheet's 테마 모음 reads a catalog that lives outside this repository:
[saya-themes](https://github.com/Heoooooon/saya-themes), served from GitHub
Pages. When the sheet opens, the browser fetches
`https://heoooooon.github.io/saya-themes/gallery.json`; when a card is pressed,
it fetches that theme's JSON from the same origin (the client drops any list
entry that points at another origin) and runs it through `parseTheme` like a
pasted theme. GitHub Pages answers with `Access-Control-Allow-Origin: *`, and
no credentials or app data are sent.

- **CSP:** the origin must be in `connect-src`. With `default-src 'self'` and no
  `connect-src`, the browser blocks the fetch and the sheet shows its "could not
  load" line. The Caddyfile example allows `https://heoooooon.github.io`.
- **Another catalog:** build with `VITE_THEME_GALLERY_URL=<url of gallery.json>`
  and put that origin in `connect-src` instead. It is a public address, not a
  secret; never put a token in a `VITE_*` variable.
- **Seasonal entries:** a character in `gallery.json` may set `from` and/or
  `until` to a real `yyyy-MM-dd` date. Both dates are inclusive on the Korean
  calendar (UTC+09:00), regardless of the device's time zone. Missing bounds
  are open; outside-period entries, malformed dates and reversed ranges are
  hidden. This only hides catalog cards, not a theme already saved or applied.
- **No gallery:** leave the origin out of `connect-src`. Nothing else changes;
  pasted and built-in themes keep working.

## Development is not production

`bun run dev` uses Vite's loopback development proxy. It can read
`SAYA_CORE_URL` and `SAYA_CORE_TOKEN` from the process environment, strips
`/api`, and injects the header server-side. It is not part of `dist/` and is not
a production BFF. Production uses the external proxy above; the static client
continues to call relative `/api` paths only.

A successful unauthenticated `GET /health` shows only that the core is alive.
It does not prove the bearer configuration is valid or that authenticated routes
will succeed.
