import { describe, expect, test } from "bun:test";
import { resolve } from "node:path";
import { KAKAO } from "../../src/features/theme/builtin";
import {
  applyTheme,
  customChoice,
  loadChoice,
  loadCustomThemes,
  saveChoice,
  saveCustomTheme,
  type ThemeChoice,
} from "../../src/features/theme/store";
import { fakeRoot, memoryStorage } from "./fakes";

const boot = await Bun.file(
  resolve(import.meta.dir, "../../public/theme-boot.js"),
).text();

/** Runs public/theme-boot.js against a fake page and returns the root it drew on. */
function runBoot(storage: ReturnType<typeof memoryStorage>, dark: boolean) {
  const root = fakeRoot();
  const window = {
    localStorage: storage,
    matchMedia: (query: string) => ({
      matches: query === "(prefers-color-scheme: dark)" && dark,
    }),
  };
  new Function("document", "window", boot)({ documentElement: root }, window);
  return root;
}

/** What the app draws once mounted, from the same storage. */
function runApp(storage: ReturnType<typeof memoryStorage>, dark: boolean) {
  const root = fakeRoot();
  const customs = loadCustomThemes(storage);
  const choice = loadChoice(storage, customs);
  applyTheme(root, saveChoice(memoryStorage(), choice, customs), dark);
  return root;
}

const night = { ...structuredClone(KAKAO), name: "밤", mode: "dark" as const };

describe("the first-paint script agrees with the app", () => {
  const cases: [string, (s: ReturnType<typeof memoryStorage>) => void][] = [
    ["nothing saved", () => {}],
    ["broken JSON", (s) => s.setItem("saya.theme", "{")],
    ["unknown choice", (s) => s.setItem("saya.theme", '{"choice":"neon"}')],
    ...(["system", "light", "dark", "kakao"] as ThemeChoice[]).map(
      (choice): [string, (s: ReturnType<typeof memoryStorage>) => void] => [
        choice,
        (s) => saveChoice(s, choice, []),
      ],
    ),
    [
      "a saved custom theme",
      (s) => {
        const saved = saveCustomTheme(s, [], night);
        if (!saved.ok) throw new Error("save failed");
        saveChoice(s, customChoice(night), saved.customs);
      },
    ],
    [
      "a cached variable that would load a resource",
      (s) =>
        s.setItem(
          "saya.theme",
          JSON.stringify({
            choice: "custom:x",
            vars: { "--field-wall": "url(https://example.test/a.png)" },
          }),
        ),
    ],
    [
      "a cached variable that is not a string",
      (s) =>
        s.setItem(
          "saya.theme",
          JSON.stringify({ choice: "custom:x", vars: { "--field-wall": 123 } }),
        ),
    ],
  ];
  for (const [label, prepare] of cases)
    for (const dark of [false, true])
      test(`${label}, device ${dark ? "dark" : "light"}`, () => {
        const storage = memoryStorage();
        prepare(storage);
        const booted = runBoot(storage, dark);
        const app = runApp(storage, dark);
        expect(booted.dataset).toEqual(app.dataset);
        expect([...booted.props]).toEqual([...app.props]);
      });

  test("a theme is not reported saved when there is no storage to keep it", () => {
    expect(saveCustomTheme(null, [], night)).toEqual({
      ok: false,
      reason: "storage",
    });
  });

  test("a storage that throws still draws the system theme", () => {
    expect(runBoot(memoryStorage(true), true).dataset.theme).toBe("dark");
  });
});
