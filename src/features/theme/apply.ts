/**
 * The part of theming the entry bundle carries: read the stored selection and
 * draw it. Everything that parses or saves themes lives in the lazily loaded
 * sheet (store.ts, schema.ts). `public/theme-boot.js` mirrors `applyTheme`
 * before the first paint; tests/theme/boot.test.ts keeps the two equal.
 */
export const THEME_KEY = "saya.theme";
export const CUSTOM_PREFIX = "custom:";

export type BuiltinThemeId = "light" | "dark" | "kakao";
export type ThemeChoice = "system" | BuiltinThemeId | `custom:${string}`;

export type WallFit = "cover" | "tile";

/** Pictures a custom theme may carry: a wallpaper under the conversation and a mascot. */
export interface ThemeImages {
  wall?: { src: string; fit: WallFit; opacity: number };
  mascot?: { src: string };
}

/**
 * A picture is an inline base64 raster and nothing else: it loads no address,
 * so a theme can never make the browser fetch from anywhere, and its characters
 * cannot leave a CSS `url("…")`. `public/theme-boot.js` applies the same test.
 */
export const IMAGE_SRC =
  /^data:image\/(?:png|webp|jpeg|gif);base64,[a-z0-9+/]+={0,2}$/i;
/** Characters per picture (about 73 KB of image), so twenty themes fit in localStorage. */
export const IMAGE_MAX_CHARS = 100_000;
/** The most a wallpaper may show through the wall colour laid over it. */
export const WALL_OPACITY_MAX = 0.4;

export function isImageSrc(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length <= IMAGE_MAX_CHARS &&
    IMAGE_SRC.test(value)
  );
}

/** The stored selection. A custom theme carries its resolved variables so drawing it needs no parser. */
export interface StoredTheme {
  choice: ThemeChoice;
  mode?: "light" | "dark";
  vars?: Record<string, string>;
  images?: ThemeImages;
}

const BUILTIN = new Set<string>(["light", "dark", "kakao"]);

export function isThemeChoice(value: unknown): value is ThemeChoice {
  return (
    value === "system" ||
    (typeof value === "string" &&
      (BUILTIN.has(value) ||
        (value.startsWith(CUSTOM_PREFIX) &&
          value.length > CUSTOM_PREFIX.length)))
  );
}

/**
 * What a saved theme may set: custom properties holding colours as themeVars()
 * writes them (hex and color-mix), nothing that could load a resource.
 * `public/theme-boot.js` applies the same test.
 */
const VAR_NAME = /^--[a-z0-9-]+$/;
const VAR_VALUE = /^[#a-z0-9\s(),.%-]+$/i;

function isVars(value: unknown): value is Record<string, string> {
  return (
    typeof value === "object" &&
    value !== null &&
    Object.entries(value).every(
      ([name, v]) =>
        VAR_NAME.test(name) &&
        typeof v === "string" &&
        VAR_VALUE.test(v) &&
        !/url\s*\(/i.test(v),
    )
  );
}

/** Stored pictures that pass every rule `parseTheme` applies; anything else is dropped whole. */
function readImages(value: unknown): ThemeImages | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  const { wall, mascot } = value as Record<string, unknown>;
  const images: ThemeImages = {};
  if (wall !== undefined) {
    const w = wall as Record<string, unknown> | null;
    if (
      !w ||
      !isImageSrc(w.src) ||
      (w.fit !== "cover" && w.fit !== "tile") ||
      typeof w.opacity !== "number" ||
      !(w.opacity >= 0 && w.opacity <= WALL_OPACITY_MAX)
    )
      return undefined;
    images.wall = { src: w.src, fit: w.fit, opacity: w.opacity };
  }
  if (mascot !== undefined) {
    const m = mascot as Record<string, unknown> | null;
    if (!m || !isImageSrc(m.src)) return undefined;
    images.mascot = { src: m.src };
  }
  return images.wall || images.mascot ? images : undefined;
}

/**
 * The custom properties that draw a theme's pictures. The wallpaper sits under
 * the wall colour at `1 - opacity`, so text on the wall keeps the contrast
 * `contrastWarnings` measured against the picture's darkest and lightest pixel.
 */
export function imageVars(images: ThemeImages | undefined) {
  const vars: Record<string, string> = {};
  if (images?.wall) {
    const { src, fit, opacity } = images.wall;
    vars["--theme-wall-image"] = `url("${src}")`;
    vars["--theme-wall-size"] = fit === "tile" ? "240px" : "cover";
    vars["--theme-wall-repeat"] = fit === "tile" ? "repeat" : "no-repeat";
    vars["--theme-wall-wash"] =
      `color-mix(in srgb, var(--field-wall) ${Math.round((1 - opacity) * 100)}%, transparent)`;
  }
  if (images?.mascot) vars["--theme-mascot"] = `url("${images.mascot.src}")`;
  return vars;
}

/** The stored selection, or "system" when nothing usable is stored. Storage may throw. */
export function readStoredTheme(
  storage: Pick<Storage, "getItem"> | null,
): StoredTheme {
  let raw: unknown = null;
  try {
    const text = storage?.getItem(THEME_KEY);
    raw = text ? JSON.parse(text) : null;
  } catch {
    raw = null;
  }
  if (!raw || typeof raw !== "object") return { choice: "system" };
  const { choice, mode, vars, images } = raw as Record<string, unknown>;
  if (!isThemeChoice(choice)) return { choice: "system" };
  if (!choice.startsWith(CUSTOM_PREFIX)) return { choice };
  if (!isVars(vars)) return { choice: "system" };
  const stored: StoredTheme = {
    choice,
    mode: mode === "dark" ? "dark" : "light",
    vars,
  };
  const pictures = readImages(images);
  if (pictures) stored.images = pictures;
  return stored;
}

/** The `data-theme` a stored selection draws under on this device. */
export function resolvedTheme(
  stored: StoredTheme,
  prefersDark: boolean,
): BuiltinThemeId | "custom" {
  if (stored.choice === "system") return prefersDark ? "dark" : "light";
  if (stored.choice.startsWith(CUSTOM_PREFIX))
    return stored.vars ? "custom" : prefersDark ? "dark" : "light";
  return stored.choice as BuiltinThemeId;
}

export interface ThemeRoot {
  dataset: DOMStringMap;
  style: Pick<CSSStyleDeclaration, "setProperty" | "removeProperty">;
}

/** Properties a custom theme set on each root, so switching away clears exactly those. */
const applied = new WeakMap<ThemeRoot, string[]>();

/** Draws a stored selection on the document root. */
export function applyTheme(
  root: ThemeRoot,
  stored: StoredTheme,
  prefersDark: boolean,
): BuiltinThemeId | "custom" {
  const theme = resolvedTheme(stored, prefersDark);
  for (const name of applied.get(root) ?? []) root.style.removeProperty(name);
  applied.delete(root);
  delete root.dataset.themeMascot;
  if (theme === "custom" && stored.vars) {
    const names = ["color-scheme"];
    root.style.setProperty(
      "color-scheme",
      stored.mode === "dark" ? "dark" : "light",
    );
    for (const [name, value] of Object.entries(stored.vars))
      if (name.startsWith("--")) {
        root.style.setProperty(name, value);
        names.push(name);
      }
    const pictures = readImages(stored.images);
    for (const [name, value] of Object.entries(imageVars(pictures))) {
      root.style.setProperty(name, value);
      names.push(name);
    }
    if (pictures?.mascot) root.dataset.themeMascot = "";
    applied.set(root, names);
  }
  root.dataset.theme = theme;
  return theme;
}
