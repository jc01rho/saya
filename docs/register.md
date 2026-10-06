# Registering with saya

saya's own contract, and its only one (owner, 2026-10-06). KakaoTalk cores
(`kanao serve`, `kamado serve`) and tsuba adapters announce themselves to
saya's server instead of saya listing them: saya holds one token, and each
core or adapter holds saya's address, that token, and the address saya should
reach it at. What saya then reads from them is unchanged: KakaoTalk's
`openapi.json` from `nichirin` and the adapter contract from `tsuba`.

Version 1. Implementations: `server/registry.ts` (saya), tsuba `serve-kit`,
nichirin `kakaocommon/register.py`, chatplus-core `register.py`.

## The request

```http
POST /register
Authorization: Bearer <SAYA_REGISTER_TOKEN>
Content-Type: application/json

{"kind": "adapter", "id": "telegram", "url": "http://127.0.0.1:8790", "token": "<the token saya presents to it>"}
```

| field   | rule |
|---------|------|
| `kind`  | `"kakao"` for a KakaoTalk core, `"adapter"` for a tsuba-contract adapter |
| `id`    | `^[a-z][a-z0-9-]{0,62}$`. For an adapter, the id saya draws it under (`/adapters/<id>/*`); for a core, its name (`kanao`, `kamado`) |
| `url`   | `http(s)://host[:port][/path]`, no credentials, query or fragment. The host must be loopback (`127.0.0.0/8`, `::1`, `localhost`), Tailscale (`100.64.0.0/10`, `fd7a:115c:a1e0::/48`) or a MagicDNS name (`*.ts.net`) |
| `token` | the bearer token saya sends on every request to `url`; non-empty, no line breaks, at most 4096 characters |

Answers, all JSON:

- `200 {"interval": 30, "ttl": 90}`: registered. Send the same request again
  every `interval` seconds; saya forgets a registration `ttl` seconds after the
  last one.
- `400 INVALID_REQUEST`, `401 UNAUTHORIZED`, `403 FORBIDDEN` (address outside
  loopback and the tailnet), `404`, `405`: `{"error": {"code", "message"}}`.
  Nothing was registered.

`DELETE /register` with `{"kind", "id"}` removes a registration at once; send
it on a clean shutdown so the lists stop drawing it immediately.

## Behaviour a registrant must keep

- **Opt-in.** Register only when `SAYA_REGISTER_URL` and
  `SAYA_REGISTER_TOKEN` are both set. `SAYA_ADVERTISE_URL` overrides `url`;
  without it, `url` is `http://127.0.0.1:<the port it listens on>`, which is
  right only when saya runs on the same machine.
- **Serving never depends on saya.** A failed or refused registration is
  logged (never with either token) and tried again on the next interval; the
  core or adapter keeps answering its own contract either way.
- **Last writer wins.** Registering an id that is already registered replaces
  it. A changed `url` or `token` takes effect at once.

## What saya does with it

- `/adapters` lists live adapter ids, sorted by id. `/adapters/<id>/*` is
  forwarded to that adapter's `url` with the prefix stripped and its `token`
  added; every answer is sandboxed and never sniffed.
- `/api/*` is forwarded to the live KakaoTalk core that registered most
  recently (one account is served by one core at a time); with none, `503`.
- The browser's own `Authorization` and `Cookie` never travel upstream, and
  the browser never learns an address or a token.

## Where it listens

saya's server answers `/register` on its own listener (`SAYA_REGISTER_PORT`,
default `8798`, loopback), never on the site's origin. Registrants on the same
machine use `http://127.0.0.1:8798`; others reach it over the tailnet only
(`tailscale serve --bg --https=8798 http://127.0.0.1:8798`).
