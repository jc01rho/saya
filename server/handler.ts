import { relayImage, unfurl } from "./unfurl";

/**
 * One handler for both places the endpoint lives: Vite's development proxy and
 * the standalone service the production reverse proxy sits in front of. Having
 * one implementation is the point — two would drift, and the guard is the kind
 * of code that must not exist twice.
 */

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
} as const;

/** Only the client's own origin may ask; this is not a public unfurl service. */
function sameOrigin(request: Request): boolean {
  const site = request.headers.get("sec-fetch-site");
  // Older clients omit Fetch Metadata; `none`/`same-origin` are the two the
  // app itself produces, and a cross-site caller reports `cross-site`.
  return site === null || site === "same-origin" || site === "none";
}

export async function handleUnfurl(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  if (url.pathname !== "/unfurl" && url.pathname !== "/unfurl/image")
    return null;
  if (request.method !== "GET")
    return new Response(null, { status: 405, headers: { allow: "GET" } });
  if (!sameOrigin(request)) return new Response(null, { status: 403 });

  const target = url.searchParams.get("url");
  if (!target) return new Response(null, { status: 400 });

  if (url.pathname === "/unfurl/image") {
    const image = await relayImage(target);
    if (!image) return new Response(null, { status: 404 });
    return new Response(image.bytes.buffer as ArrayBuffer, {
      headers: {
        "content-type": image.type,
        "cache-control": "public, max-age=3600",
        "content-security-policy": "default-src 'none'; sandbox",
        "x-content-type-options": "nosniff",
      },
    });
  }

  const card = await unfurl(target);
  // 204 rather than an error: "this address has no card" is an ordinary answer,
  // and the client draws the plain link either way.
  if (!card) return new Response(null, { status: 204 });
  return new Response(JSON.stringify(card), { headers: JSON_HEADERS });
}
