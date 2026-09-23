/**
 * The card's data comes from `/unfurl`, a facility of the proxy that serves
 * this client. It is **not** in `openapi.json`, so nothing here is generated
 * and nothing here may be confused with the cores' contract: the shape is
 * declared locally, every field is treated as optional, and an endpoint that
 * is absent, slow or wrong simply yields no card.
 */
export type LinkCard = {
  url: string;
  title: string | null;
  description: string | null;
  siteName: string | null;
  image: string | null;
};

const text = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value : null;

/** The image path must be one this proxy serves; a third-party URL is refused. */
const localPath = (value: unknown): string | null => {
  const candidate = text(value);
  return candidate?.startsWith("/unfurl/image?") ? candidate : null;
};

function decode(value: unknown, url: string): LinkCard | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const card: LinkCard = {
    url,
    title: text(record.title),
    description: text(record.description),
    siteName: text(record.siteName),
    image: localPath(record.image),
  };
  return card.title || card.description || card.image ? card : null;
}

/** One request per address per tab, shared by every bubble that shows it. */
const inFlight = new Map<string, Promise<LinkCard | null>>();

export function fetchCard(url: string): Promise<LinkCard | null> {
  const existing = inFlight.get(url);
  if (existing) return existing;
  const request = fetch(`/unfurl?url=${encodeURIComponent(url)}`, {
    headers: { accept: "application/json" },
  })
    .then(async (response) => {
      // 204 is "no card for this address"; 404 is "this proxy has no unfurl
      // endpoint at all". Both mean the same thing on screen.
      if (!response.ok || response.status === 204) return null;
      return decode(await response.json(), url);
    })
    .catch(() => null);
  inFlight.set(url, request);
  return request;
}
