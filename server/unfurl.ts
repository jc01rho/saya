import { guard } from "./guard";

/**
 * The unfurl endpoint: given a URL that appeared in a message, return the few
 * Open Graph fields a card needs.
 *
 * This is **not** part of `openapi.json` and never will be. It is a facility of
 * the proxy that serves the client, it never touches a core, a token, or any
 * KakaoTalk data, and the client degrades to a plain link when it is absent.
 *
 * Read `guard.ts` before changing anything here. The URL is attacker-chosen.
 */

export type Unfurled = {
  url: string;
  title: string | null;
  description: string | null;
  siteName: string | null;
  /** Always a path on this proxy, never a third-party URL: see `imageProxyPath`. */
  image: string | null;
};

const BODY_LIMIT = 512 * 1024;
const IMAGE_LIMIT = 2 * 1024 * 1024;
const DEADLINE_MS = 6_000;
const MAX_REDIRECTS = 3;
const CACHE_LIMIT = 256;
const CACHE_TTL_MS = 30 * 60 * 1000;

const HTML_TYPES = ["text/html", "application/xhtml+xml"];

/** A browser-ish agent: many sites serve no card metadata to an unknown one. */
const HEADERS = {
  "user-agent":
    "Mozilla/5.0 (compatible; saya-unfurl/1.0; +https://github.com/sanguneo/saya)",
  accept: "text/html,application/xhtml+xml;q=0.9",
  "accept-language": "ko,en;q=0.8",
} as const;

type Entry = { value: Unfurled | null; at: number };
const cache = new Map<string, Entry>();

function cached(key: string): Entry | undefined {
  const hit = cache.get(key);
  if (!hit) return;
  if (Date.now() - hit.at > CACHE_TTL_MS) {
    cache.delete(key);
    return;
  }
  // Refresh recency: the map's insertion order is the eviction order.
  cache.delete(key);
  cache.set(key, hit);
  return hit;
}

function remember(key: string, value: Unfurled | null): void {
  cache.set(key, { value, at: Date.now() });
  while (cache.size > CACHE_LIMIT) {
    const oldest = cache.keys().next().value;
    if (oldest === undefined) break;
    cache.delete(oldest);
  }
}

/**
 * Follows redirects by hand so every hop is re-validated. `redirect: "manual"`
 * is the whole point: the platform's automatic following would take the first
 * `Location` straight past the address guard.
 */
async function hop(
  start: string,
  accept: readonly string[],
  signal: AbortSignal,
): Promise<{ response: Response; url: URL } | null> {
  let target = start;
  for (let step = 0; step <= MAX_REDIRECTS; step += 1) {
    const checked = await guard(target);
    if (!checked.ok) return null;
    const response = await fetch(checked.url, {
      redirect: "manual",
      signal,
      headers: { ...HEADERS, accept: accept.join(",") },
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      void response.body?.cancel();
      if (!location) return null;
      target = new URL(location, checked.url).toString();
      continue;
    }
    if (!response.ok) {
      void response.body?.cancel();
      return null;
    }
    return { response, url: checked.url };
  }
  return null;
}

/** Reads at most `limit` bytes, then drops the connection. */
async function readCapped(
  response: Response,
  limit: number,
): Promise<Uint8Array | null> {
  const reader = response.body?.getReader();
  if (!reader) return null;
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > limit) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}

const META = /<meta\b[^>]*>/gi;
const ATTR = /([a-z:-]+)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+))/gi;
const TITLE = /<title[^>]*>([\s\S]*?)<\/title>/i;

function decodeEntities(value: string): string {
  const named: Record<string, string> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: "\u00a0",
  };
  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (whole, body: string) => {
    if (body.startsWith("#")) {
      const code =
        body[1]?.toLowerCase() === "x"
          ? Number.parseInt(body.slice(2), 16)
          : Number.parseInt(body.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff
        ? String.fromCodePoint(code)
        : whole;
    }
    return named[body.toLowerCase()] ?? whole;
  });
}

function clean(value: string | undefined, limit: number): string | null {
  if (!value) return null;
  const text = decodeEntities(value).replace(/\s+/g, " ").trim();
  if (!text) return null;
  return text.length > limit ? `${text.slice(0, limit - 1)}…` : text;
}

/**
 * Tag soup, deliberately. A full HTML parser on attacker-controlled input is a
 * larger surface than the four strings a card needs, and the regex cannot be
 * tricked into executing anything: the values only ever become text.
 */
export function extractOpenGraph(html: string): Map<string, string> {
  const found = new Map<string, string>();
  for (const tag of html.matchAll(META)) {
    const attrs = new Map<string, string>();
    for (const attr of tag[0].matchAll(ATTR)) {
      const name = attr[1]?.toLowerCase();
      if (name) attrs.set(name, attr[3] ?? attr[4] ?? attr[5] ?? "");
    }
    const key = (attrs.get("property") ?? attrs.get("name"))?.toLowerCase();
    const content = attrs.get("content");
    if (key && content && !found.has(key)) found.set(key, content);
  }
  const title = TITLE.exec(html);
  if (title?.[1] && !found.has("__title")) found.set("__title", title[1]);
  return found;
}

/** The path the client asks for an image on; the third party is never contacted by the browser. */
export function imageProxyPath(raw: string): string {
  return `/unfurl/image?url=${encodeURIComponent(raw)}`;
}

export async function unfurl(raw: string): Promise<Unfurled | null> {
  const checked = await guard(raw);
  if (!checked.ok) return null;
  const key = checked.url.toString();
  const hit = cached(key);
  if (hit) return hit.value;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEADLINE_MS);
  try {
    const landed = await hop(key, HTML_TYPES, controller.signal);
    if (!landed) {
      remember(key, null);
      return null;
    }
    const type = landed.response.headers.get("content-type") ?? "";
    if (!HTML_TYPES.some((allowed) => type.includes(allowed))) {
      void landed.response.body?.cancel();
      remember(key, null);
      return null;
    }
    const bytes = await readCapped(landed.response, BODY_LIMIT);
    if (!bytes) {
      remember(key, null);
      return null;
    }
    const html = new TextDecoder("utf-8").decode(bytes);
    const meta = extractOpenGraph(html);
    const rawImage = meta.get("og:image") ?? meta.get("twitter:image");
    let image: string | null = null;
    if (rawImage) {
      try {
        const resolved = new URL(decodeEntities(rawImage), landed.url);
        // The image is checked now and again when it is actually served.
        if ((await guard(resolved.toString())).ok)
          image = imageProxyPath(resolved.toString());
      } catch {
        image = null;
      }
    }
    const value: Unfurled = {
      url: key,
      title:
        clean(meta.get("og:title"), 120) ??
        clean(meta.get("twitter:title"), 120) ??
        clean(meta.get("__title"), 120),
      description:
        clean(meta.get("og:description"), 200) ??
        clean(meta.get("twitter:description"), 200) ??
        clean(meta.get("description"), 200),
      siteName: clean(meta.get("og:site_name"), 60) ?? landed.url.hostname,
      image,
    };
    // A card with nothing on it is not a card.
    const empty = !value.title && !value.description && !value.image;
    remember(key, empty ? null : value);
    return empty ? null : value;
  } catch {
    remember(key, null);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export type RelayedImage = { bytes: Uint8Array; type: string };

/** Relays one image so the browser never contacts the third-party host itself. */
export async function relayImage(raw: string): Promise<RelayedImage | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEADLINE_MS);
  try {
    const landed = await hop(raw, ["image/*"], controller.signal);
    if (!landed) return null;
    const type = landed.response.headers.get("content-type") ?? "";
    if (!type.startsWith("image/") || type.includes("svg")) {
      void landed.response.body?.cancel();
      return null;
    }
    const bytes = await readCapped(landed.response, IMAGE_LIMIT);
    if (!bytes) return null;
    return { bytes, type: type.split(";")[0] ?? "image/jpeg" };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
