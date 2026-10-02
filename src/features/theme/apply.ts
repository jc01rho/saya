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

/** The stored selection. A custom theme carries its resolved variables so drawing it needs no parser. */
export interface StoredTheme {
  choice: ThemeChoice;
  mode?: "light" | "dark";
  vars?: Record<string, string>;
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

function isVars(value: unknown): value is Record<string, string> {
  return (
    typeof value === "object" &&
    value !== null &&
    Object.values(value).every((v) => typeof v === "string")
  );
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
  const { choice, mode, vars } = raw as Record<string, unknown>;
  if (!isThemeChoice(choice)) return { choice: "system" };
  if (!choice.startsWith(CUSTOM_PREFIX)) return { choice };
  return isVars(vars)
    ? { choice, mode: mode === "dark" ? "dark" : "light", vars }
    : { choice: "system" };
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
    applied.set(root, names);
  }
  root.dataset.theme = theme;
  return theme;
}
