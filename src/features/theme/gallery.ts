import { parseTheme, type ThemeDefinition } from "./schema";

/**
 * Ready-made themes from `docs/themes/`. A card is drawn from the entry alone;
 * the pictured file (about 110 KB of data URIs) is its own chunk, fetched only
 * when the card is pressed. Adding a theme is one more entry below;
 * `tests/theme/gallery.test.ts` checks each entry against the file it loads.
 */
export type GalleryEntry = {
  id: string;
  /** The theme's own name: what is saved, and what pressing it again replaces. */
  name: string;
  /** wall, bubbleSelf, accent, text. */
  chips: readonly [string, string, string, string];
  load: () => Promise<{ default: unknown }>;
};

export const THEME_GALLERY: readonly GalleryEntry[] = [
  {
    id: "usagi-light",
    name: "우사기 크림 그림 🐰",
    chips: ["#fcefca", "#ffc2ca", "#ffc2ca", "#2b2118"],
    load: () => import("../../../docs/themes/usagi/usagi-light-img.json"),
  },
  {
    id: "usagi-dark",
    name: "우사기 밤산책 그림 🐰",
    chips: ["#2b2118", "#6e3f49", "#ffc2ca", "#fcefca"],
    load: () => import("../../../docs/themes/usagi/usagi-dark-img.json"),
  },
  {
    id: "hachiware-light",
    name: "하치와레 하늘 그림 🐱",
    chips: ["#e8f1f6", "#bcd6e3", "#ffc2ca", "#1b2b36"],
    load: () =>
      import("../../../docs/themes/hachiware/hachiware-light-img.json"),
  },
  {
    id: "hachiware-dark",
    name: "하치와레 밤하늘 그림 🐱",
    chips: ["#1b2b36", "#2f5468", "#77a6be", "#f4f8fb"],
    load: () =>
      import("../../../docs/themes/hachiware/hachiware-dark-img.json"),
  },
];

/** The entry's theme through the same check as a pasted one; null when its chunk or its JSON fails. */
export async function loadGalleryTheme(
  entry: GalleryEntry,
): Promise<ThemeDefinition | null> {
  try {
    const result = parseTheme((await entry.load()).default);
    return result.ok ? result.theme : null;
  } catch {
    return null;
  }
}
