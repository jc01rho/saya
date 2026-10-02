import list from "../../../docs/themes/gallery.json";
import { parseTheme, type ThemeDefinition } from "./schema";

/**
 * Ready-made themes from `docs/themes/`. Only this list is bundled, with the
 * lazily loaded sheet; each theme file (about 110 KB of pictures) is copied to
 * `dist/themes/` and fetched when its card is pressed.
 */
export type GalleryTheme = {
  mode: "light" | "dark";
  /** The theme's own name: what is saved, and what pressing it again replaces. */
  name: string;
  /** wall, bubbleSelf, accent, text. */
  colors: readonly string[];
  /** Under `docs/themes/`, served from `/themes/`. */
  path: string;
};

export type GalleryCharacter = {
  id: string;
  name: string;
  themes: readonly GalleryTheme[];
};

export const THEME_GALLERY = list as readonly GalleryCharacter[];

/** The theme file through the same check as a pasted theme; null when it cannot be fetched or is not a theme. */
export async function fetchGalleryTheme(
  theme: GalleryTheme,
  fetcher: (url: string) => Promise<Response> = fetch,
): Promise<ThemeDefinition | null> {
  try {
    const response = await fetcher(`/themes/${theme.path}`);
    if (!response.ok) return null;
    const result = parseTheme(await response.json());
    return result.ok ? result.theme : null;
  } catch {
    return null;
  }
}
