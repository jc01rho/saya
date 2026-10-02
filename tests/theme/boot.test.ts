import { describe, expect, test } from "bun:test";
import { resolve } from "node:path";
import { readStoredTheme } from "../../src/features/theme/apply";
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
import { DOT, fakeRoot, memoryStorage } from "./fakes";

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
const pictured = {
  ...night,
  name: "그림",
  images: {
    wall: { src: DOT, fit: "tile" as const, opacity: 0.2 },
    mascot: { src: DOT },
  },
};

function saveAndChoose(
  s: ReturnType<typeof memoryStorage>,
  theme: typeof night | typeof pictured,
) {
  const saved = saveCustomTheme(s, [], theme);
  if (!saved.ok) throw new Error("save failed");
  saveChoice(s, customChoice(theme), saved.customs);
}

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
    ["a saved theme with pictures", (s) => saveAndChoose(s, pictured)],
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

describe("cached pictures", () => {
  /** What ThemeControl draws on mount: the cached selection as stored. */
  function runMounted(storage: ReturnType<typeof memoryStorage>) {
    const root = fakeRoot();
    applyTheme(root, readStoredTheme(storage), false);
    return root;
  }

  test("a theme with pictures draws them before and after mount", () => {
    const storage = memoryStorage();
    saveAndChoose(storage, pictured);
    for (const root of [runBoot(storage, false), runMounted(storage)]) {
      expect(root.props.get("--theme-wall-image")).toBe(`url("${DOT}")`);
      expect(root.props.get("--theme-wall-repeat")).toBe("repeat");
      expect(root.props.get("--theme-mascot")).toBe(`url("${DOT}")`);
      expect(root.dataset.themeMascot).toBe("");
    }
  });

  const tampered: [string, unknown][] = [
    ["an address", { mascot: { src: "https://example.test/a.png" } }],
    [
      "a source that leaves url()",
      { mascot: { src: `${DOT}"); background: url(https://example.test/x` } },
    ],
    [
      "an opacity past the bound",
      { wall: { src: DOT, fit: "cover", opacity: 1 } },
    ],
    ["a fit that is not known", { wall: { src: DOT, fit: "x", opacity: 0.1 } }],
  ];
  for (const [label, images] of tampered)
    test(`${label} is dropped whole, and the colours still draw`, () => {
      const storage = memoryStorage();
      saveAndChoose(storage, night);
      const cached = JSON.parse(storage.items.get("saya.theme") ?? "{}");
      storage.setItem("saya.theme", JSON.stringify({ ...cached, images }));
      const booted = runBoot(storage, false);
      const mounted = runMounted(storage);
      expect(booted.dataset).toEqual(mounted.dataset);
      expect([...booted.props]).toEqual([...mounted.props]);
      expect(booted.dataset.theme).toBe("custom");
      expect(booted.props.has("--field-wall")).toBe(true);
      expect(
        [...booted.props.keys()].some((name) => name.startsWith("--theme-")),
      ).toBe(false);
      expect(booted.dataset.themeMascot).toBeUndefined();
    });
});
