import { describe, expect, test } from "bun:test";
import { KAKAO } from "../../src/features/theme/builtin";
import type { ThemeDefinition } from "../../src/features/theme/schema";
import { themeVars } from "../../src/features/theme/schema";
import {
  applyTheme,
  CUSTOM_LIMIT,
  customChoice,
  deleteCustomTheme,
  loadChoice,
  loadCustomThemes,
  saveChoice,
  saveCustomTheme,
} from "../../src/features/theme/store";
import { DOT, fakeRoot, memoryStorage } from "./fakes";

const night: ThemeDefinition = {
  ...structuredClone(KAKAO),
  name: "밤바다",
  mode: "dark",
};

describe("theme choice storage", () => {
  test("nothing saved means follow the system", () => {
    expect(loadChoice(memoryStorage(), [])).toBe("system");
  });

  test("a saved built-in choice is restored", () => {
    const storage = memoryStorage();
    saveChoice(storage, "kakao", []);
    expect(loadChoice(storage, [])).toBe("kakao");
  });

  test("garbage or a deleted custom theme falls back to system", () => {
    const storage = memoryStorage();
    storage.setItem("saya.theme", "{not json");
    expect(loadChoice(storage, [])).toBe("system");
    storage.setItem("saya.theme", JSON.stringify({ choice: "neon" }));
    expect(loadChoice(storage, [])).toBe("system");
    storage.setItem("saya.theme", JSON.stringify({ choice: "custom:없음" }));
    expect(loadChoice(storage, [])).toBe("system");
  });

  test("a storage that throws never breaks reading or writing", () => {
    const broken = memoryStorage(true);
    expect(loadChoice(broken, [])).toBe("system");
    expect(loadCustomThemes(broken)).toEqual([]);
    expect(saveChoice(broken, "dark", [])).toEqual({ choice: "dark" });
    expect(saveCustomTheme(broken, [], night)).toEqual({
      ok: false,
      reason: "storage",
    });
  });
});

describe("custom themes", () => {
  test("saved themes and the choice of one survive a reload", () => {
    const storage = memoryStorage();
    const saved = saveCustomTheme(storage, [], night);
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    saveChoice(storage, customChoice(night), saved.customs);
    const customs = loadCustomThemes(storage);
    expect(customs).toEqual([night]);
    expect(loadChoice(storage, customs)).toBe("custom:밤바다");
    const stored = JSON.parse(storage.items.get("saya.theme") ?? "null");
    expect(stored).toEqual({
      choice: "custom:밤바다",
      mode: "dark",
      vars: themeVars(night),
    });
  });

  test("saving under an existing name replaces it; deleting removes it", () => {
    const storage = memoryStorage();
    const first = saveCustomTheme(storage, [], night);
    if (!first.ok) throw new Error("save failed");
    const changed = { ...night, tokens: { ...night.tokens, wall: "#102030" } };
    const second = saveCustomTheme(storage, first.customs, changed);
    expect(second.ok && second.customs).toEqual([changed]);
    expect(deleteCustomTheme(storage, [changed], night.name)).toEqual([]);
    expect(loadCustomThemes(storage)).toEqual([]);
  });

  test("the store holds a bounded number of themes", () => {
    const storage = memoryStorage();
    const many = Array.from({ length: CUSTOM_LIMIT }, (_, i) => ({
      ...night,
      name: `테마${i}`,
    }));
    expect(
      saveCustomTheme(storage, many, { ...night, name: "하나 더" }),
    ).toEqual({ ok: false, reason: "limit" });
    // Replacing an existing one is still allowed at the limit.
    expect(saveCustomTheme(storage, many, many[0] as ThemeDefinition).ok).toBe(
      true,
    );
  });

  test("a hand-edited entry that no longer parses is dropped on load", () => {
    const storage = memoryStorage();
    storage.setItem(
      "saya.themes",
      JSON.stringify([night, { name: "깨짐", mode: "light", tokens: {} }]),
    );
    expect(loadCustomThemes(storage)).toEqual([night]);
  });
});

describe("applying a theme to the document root", () => {
  test("system follows the device, both ways", () => {
    const root = fakeRoot();
    expect(applyTheme(root, { choice: "system" }, true)).toBe("dark");
    expect(root.dataset.theme).toBe("dark");
    expect(applyTheme(root, { choice: "system" }, false)).toBe("light");
    expect(root.dataset.theme).toBe("light");
  });

  test("a built-in choice ignores the device", () => {
    const root = fakeRoot();
    applyTheme(root, { choice: "kakao" }, true);
    expect(root.dataset.theme).toBe("kakao");
  });

  test("a custom theme sets its variables, and switching away clears them", () => {
    const root = fakeRoot();
    const stored = saveChoice(memoryStorage(), customChoice(night), [night]);
    applyTheme(root, stored, false);
    expect(root.dataset.theme).toBe("custom");
    expect(root.props.get("--field-wall")).toBe(night.tokens.wall as string);
    expect(root.props.get("color-scheme")).toBe("dark");
    applyTheme(root, { choice: "light" }, false);
    expect(root.props.size).toBe(0);
  });

  test("a theme's pictures are cached with it and cleared on switching away", () => {
    const pictured: ThemeDefinition = {
      ...night,
      images: {
        wall: { src: DOT, fit: "cover", opacity: 0.1 },
        mascot: { src: DOT },
      },
    };
    const storage = memoryStorage();
    const stored = saveChoice(storage, customChoice(pictured), [pictured]);
    expect(stored.images).toEqual(pictured.images);
    const root = fakeRoot();
    applyTheme(root, stored, false);
    expect(root.props.get("--theme-wall-wash")).toBe(
      "color-mix(in srgb, var(--field-wall) 90%, transparent)",
    );
    expect(root.dataset.themeMascot).toBe("");
    applyTheme(root, saveChoice(storage, customChoice(night), [night]), false);
    expect(root.props.has("--theme-wall-image")).toBe(false);
    expect(root.dataset.themeMascot).toBeUndefined();
    applyTheme(root, { choice: "light" }, false);
    expect(root.props.size).toBe(0);
  });
});
