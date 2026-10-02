import { expect, test } from "bun:test";
import { resolve } from "node:path";
import {
  loadGalleryTheme,
  THEME_GALLERY,
} from "../../src/features/theme/gallery";
import { parseTheme } from "../../src/features/theme/schema";
import {
  customChoice,
  loadChoice,
  loadCustomThemes,
  saveChoice,
  saveCustomTheme,
} from "../../src/features/theme/store";
import { memoryStorage } from "./fakes";

const root = resolve(import.meta.dir, "../../docs/themes");
const files = Array.from(new Bun.Glob("**/*.json").scanSync({ cwd: root }));

test("the theme gallery is not empty", () => {
  expect(files.length).toBeGreaterThan(0);
});

test.each(files)("docs/themes/%s is a theme the app accepts", async (file) => {
  const result = parseTheme(await Bun.file(resolve(root, file)).text());
  expect(
    result.ok
      ? { warnings: result.warnings, ignored: result.ignored }
      : result.issues,
  ).toEqual({
    warnings: [],
    ignored: [],
  });
});

test.each(THEME_GALLERY.map((entry) => [entry.id, entry] as const))(
  "the in-app gallery card %s loads the theme its card shows",
  async (_, entry) => {
    const theme = await loadGalleryTheme(entry);
    if (!theme) throw new Error(`${entry.id} did not load`);
    const { tokens } = theme;
    expect([
      theme.name,
      tokens.wall,
      tokens.bubbleSelf,
      tokens.accent,
      tokens.text,
    ]).toEqual([entry.name, ...entry.chips]);
    expect(theme.images).toBeDefined();
  },
);

test("a gallery theme is saved and chosen, and pressing it again replaces it", async () => {
  const storage = memoryStorage();
  const [entry] = THEME_GALLERY;
  if (!entry) throw new Error("empty gallery");
  for (let press = 0; press < 2; press += 1) {
    const theme = await loadGalleryTheme(entry);
    if (!theme) throw new Error("did not load");
    const saved = saveCustomTheme(storage, loadCustomThemes(storage), theme);
    if (!saved.ok) throw new Error(saved.reason);
    const stored = saveChoice(storage, customChoice(theme), saved.customs);
    expect(stored.images).toEqual(theme.images);
  }
  const customs = loadCustomThemes(storage);
  expect(customs.map((theme) => theme.name)).toEqual([entry.name]);
  expect(loadChoice(storage, customs)).toBe(`custom:${entry.name}`);
});

test("a gallery file that fails to load gives no theme instead of throwing", async () => {
  const [entry] = THEME_GALLERY;
  if (!entry) throw new Error("empty gallery");
  const broken = { ...entry, load: () => Promise.reject(new Error("chunk")) };
  const invalid = { ...entry, load: async () => ({ default: { name: "x" } }) };
  expect(await loadGalleryTheme(broken)).toBeNull();
  expect(await loadGalleryTheme(invalid)).toBeNull();
});
