import { isHexColor } from "./color";
import { parseTheme, type ThemeDefinition } from "./schema";

/**
 * Ready-made themes live outside saya, in the saya-themes repository, so their
 * pictures never ship with the app and a new theme needs no saya release. The
 * sheet fetches the list when it opens and a theme file when its card is
 * pressed. A deployment can point at another catalog with
 * `VITE_THEME_GALLERY_URL`; its CSP must allow that origin in `connect-src`.
 */
export const DEFAULT_GALLERY_URL =
  "https://heoooooon.github.io/saya-themes/gallery.json";

export const GALLERY_URL: string =
  import.meta.env.VITE_THEME_GALLERY_URL || DEFAULT_GALLERY_URL;

export type GalleryTheme = {
  mode: "light" | "dark";
  /** The theme's own name: what is saved, and what pressing it again replaces. */
  name: string;
  /** wall, bubbleSelf, accent, text. */
  colors: readonly string[];
  /** Absolute address of the theme file, on the catalog's own origin. */
  url: string;
  /** Absolute address of the card's picture, on the catalog's own origin; absent when the list has none there. */
  preview?: string;
};

export type GalleryCharacter = {
  id: string;
  name: string;
  themes: readonly GalleryTheme[];
};

type Fetcher = (url: string) => Promise<Response>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function readTheme(value: unknown, catalog: URL): GalleryTheme | null {
  if (!isRecord(value)) return null;
  const { mode, name, colors, path, preview } = value;
  if (mode !== "light" && mode !== "dark") return null;
  if (typeof name !== "string" || name === "") return null;
  if (
    !Array.isArray(colors) ||
    colors.length !== 4 ||
    !colors.every((color) => typeof color === "string" && isHexColor(color))
  )
    return null;
  if (typeof path !== "string") return null;
  let url: URL;
  try {
    url = new URL(path, catalog);
  } catch {
    return null;
  }
  // A list may only point at files beside it: never another site.
  if (url.origin !== catalog.origin) return null;
  const picture = readPreview(preview, catalog);
  return picture
    ? { mode, name, colors, url: url.href, preview: picture }
    : { mode, name, colors, url: url.href };
}

/** The picture is optional, and one on another origin is left out rather than failing the card. */
function readPreview(value: unknown, catalog: URL): string | undefined {
  if (typeof value !== "string" || value === "") return undefined;
  try {
    const url = new URL(value, catalog);
    return url.origin === catalog.origin ? url.href : undefined;
  } catch {
    return undefined;
  }
}

/** Missing means unbounded; anything but a real yyyy-MM-dd calendar date is invalid. */
function readDate(value: unknown): string | undefined | null {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
    ? value
    : null;
}

/** Valid cards outside their inclusive KST period are hidden; an empty seasonal catalog is not a fetch failure. */
export async function fetchGallery(
  catalogUrl: string = GALLERY_URL,
  fetcher: Fetcher = (url) => fetch(url),
  now: Date = new Date(),
): Promise<GalleryCharacter[] | null> {
  try {
    const catalog = new URL(catalogUrl, globalThis.location?.href);
    const response = await fetcher(catalog.href);
    if (!response.ok) return null;
    const list: unknown = await response.json();
    if (!Array.isArray(list)) return null;
    // UTC+09:00 has no daylight saving: never use the device's calendar date.
    const today = new Date(now.getTime() + 9 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    let hasCards = false;
    const characters = list.flatMap((value): GalleryCharacter[] => {
      if (!isRecord(value)) return [];
      const { id, name, themes } = value;
      if (typeof id !== "string" || typeof name !== "string") return [];
      if (!Array.isArray(themes)) return [];
      const cards = themes.flatMap((theme) => readTheme(theme, catalog) ?? []);
      if (cards.length === 0) return [];
      hasCards = true;
      const from = readDate(value.from);
      const until = readDate(value.until);
      if (from === null || until === null) return [];
      if (from && until && from > until) return [];
      if ((from && today < from) || (until && today > until)) return [];
      return [{ id, name, themes: cards }];
    });
    return hasCards ? characters : null;
  } catch {
    return null;
  }
}

/** The theme file through the same check as a pasted theme; null when it cannot be fetched or is not a theme. */
export async function fetchGalleryTheme(
  theme: GalleryTheme,
  fetcher: Fetcher = (url) => fetch(url),
): Promise<ThemeDefinition | null> {
  try {
    const response = await fetcher(theme.url);
    if (!response.ok) return null;
    const result = parseTheme(await response.json());
    return result.ok ? result.theme : null;
  } catch {
    return null;
  }
}
