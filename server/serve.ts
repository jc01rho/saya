import { handleUnfurl } from "./handler";

/**
 * The unfurl service for production, to be reached only through the site's own
 * reverse proxy. It binds loopback by default and must stay that way: it has no
 * authentication of its own, and the proxy in front of it is what enforces
 * origin. It holds no token, opens no database and never contacts a core.
 *
 *   SAYA_UNFURL_PORT=8791 bun server/serve.ts
 */
const port = Number.parseInt(process.env.SAYA_UNFURL_PORT ?? "8791", 10);
const hostname = process.env.SAYA_UNFURL_HOST ?? "127.0.0.1";

Bun.serve({
  port,
  hostname,
  idleTimeout: 30,
  async fetch(request) {
    return (await handleUnfurl(request)) ?? new Response(null, { status: 404 });
  },
});

console.log(`saya unfurl listening on ${hostname}:${port}`);
