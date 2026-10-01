import {
  CUSTOM_PREFIX,
  isThemeChoice,
  type StoredTheme,
  THEME_KEY,
  type ThemeChoice,
} from "./apply";
import { parseTheme, type ThemeDefinition, themeVars } from "./schema";

export {
  applyTheme,
  CUSTOM_PREFIX,
  resolvedTheme,
  type StoredTheme,
  THEME_KEY,
  type ThemeChoice,
  type ThemeRoot,
} from "./apply";

/** Saved custom themes. Only the lazily loaded sheet reads or writes them. */
export const CUSTOM_KEY = "saya.themes";
export const CUSTOM_LIMIT = 20;

type ReadStorage = Pick<Storage, "getItem">;
type WriteStorage = Pick<Storage, "getItem" | "setItem">;

/** Storage can throw (blocked cookies, private mode); a theme is never worth a crash. */
function readJson(storage: ReadStorage | null, key: string): unknown {
  try {
    const raw = storage?.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeJson(storage: WriteStorage | null, key: string, value: unknown) {
  try {
    storage?.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/** Saved custom themes, each re-checked: a hand-edited entry that no longer parses is dropped. */
export function loadCustomThemes(
  storage: ReadStorage | null,
): ThemeDefinition[] {
  const raw = readJson(storage, CUSTOM_KEY);
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((entry) => {
    const result = parseTheme(entry);
    return result.ok ? [result.theme] : [];
  });
}

export function loadChoice(
  storage: ReadStorage | null,
  customs: readonly ThemeDefinition[],
): ThemeChoice {
  const raw = readJson(storage, THEME_KEY);
  const choice =
    raw && typeof raw === "object" && "choice" in raw ? raw.choice : null;
  if (!isThemeChoice(choice)) return "system";
  if (choice.startsWith(CUSTOM_PREFIX) && !findCustom(customs, choice))
    return "system";
  return choice;
}

export function customChoice(theme: ThemeDefinition): ThemeChoice {
  return `${CUSTOM_PREFIX}${theme.name}`;
}

export function findCustom(
  customs: readonly ThemeDefinition[],
  choice: ThemeChoice,
): ThemeDefinition | undefined {
  return customs.find((theme) => customChoice(theme) === choice);
}

export function storedFor(
  choice: ThemeChoice,
  customs: readonly ThemeDefinition[],
): StoredTheme {
  if (!choice.startsWith(CUSTOM_PREFIX)) return { choice };
  const custom = findCustom(customs, choice);
  return custom
    ? { choice, mode: custom.mode, vars: themeVars(custom) }
    : { choice: "system" };
}

export function saveChoice(
  storage: WriteStorage | null,
  choice: ThemeChoice,
  customs: readonly ThemeDefinition[],
): StoredTheme {
  const stored = storedFor(choice, customs);
  writeJson(storage, THEME_KEY, stored);
  return stored;
}

export type SaveCustomResult =
  | { ok: true; customs: ThemeDefinition[] }
  | { ok: false; reason: "limit" | "storage" };

/** Adds a theme, replacing one with the same name. */
export function saveCustomTheme(
  storage: WriteStorage | null,
  customs: readonly ThemeDefinition[],
  theme: ThemeDefinition,
): SaveCustomResult {
  const rest = customs.filter((existing) => existing.name !== theme.name);
  if (rest.length >= CUSTOM_LIMIT) return { ok: false, reason: "limit" };
  const next = [...rest, theme];
  return writeJson(storage, CUSTOM_KEY, next)
    ? { ok: true, customs: next }
    : { ok: false, reason: "storage" };
}

export function deleteCustomTheme(
  storage: WriteStorage | null,
  customs: readonly ThemeDefinition[],
  name: string,
): ThemeDefinition[] {
  const next = customs.filter((theme) => theme.name !== name);
  writeJson(storage, CUSTOM_KEY, next);
  return next;
}
