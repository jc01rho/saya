import { expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { galleryFiles } from "../../scripts/theme-gallery-plugin";
import {
  fetchGalleryTheme,
  type GalleryTheme,
  THEME_GALLERY,
} from "../../src/features/theme/gallery";
import {
  parseTheme,
  type ThemeDefinition,
} from "../../src/features/theme/schema";
import {
  CUSTOM_KEY,
  CUSTOM_LIMIT,
  customChoice,
  loadChoice,
  loadCustomThemes,
  saveChoice,
  saveCustomTheme,
} from "../../src/features/theme/store";
import { memoryStorage } from "./fakes";

const root = resolve(import.meta.dir, "../../docs/themes");
const files = Array.from(
  new Bun.Glob("**/*.json").scanSync({ cwd: root }),
).filter((file) => file !== "gallery.json");
const cards = THEME_GALLERY.flatMap((character) =>
  character.themes.map(
    (theme) => [`${character.id}-${theme.mode}`, theme] as const,
  ),
);

test("the theme gallery is not empty", () => {
  expect(files.length).toBeGreaterThan(0);
  expect(cards.length).toBeGreaterThan(0);
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

test.each(cards)(
  "the gallery card %s shows the theme its file holds",
  (_, card) => {
    const result = parseTheme(readFileSync(resolve(root, card.path), "utf8"));
    if (!result.ok) throw new Error(`${card.path}: ${result.issues}`);
    const { theme } = result;
    const shown: unknown = {
      name: card.name,
      mode: card.mode,
      colors: card.colors,
      pictured: card.path.endsWith("-img.json"),
    };
    expect(shown).toEqual({
      name: theme.name,
      mode: theme.mode,
      colors: [
        theme.tokens.wall,
        theme.tokens.bubbleSelf,
        theme.tokens.accent,
        theme.tokens.text,
      ],
      pictured: theme.images !== undefined,
    });
  },
);

test("gallery ids and theme names are unique, and the build copies exactly the listed files", () => {
  const ids = THEME_GALLERY.map((character) => character.id);
  const names = cards.map(([, card]) => card.name);
  expect(new Set(ids).size).toBe(ids.length);
  expect(new Set(names).size).toBe(names.length);
  expect(galleryFiles(root)).toEqual(cards.map(([, card]) => card.path));
});

function served(requests: string[] = []) {
  return async (url: string) => {
    requests.push(url);
    const file = url.replace(/^\/themes\//, "");
    if (!url.startsWith("/themes/") || !files.includes(file))
      return new Response("Not Found", { status: 404 });
    return new Response(readFileSync(resolve(root, file)), {
      headers: { "Content-Type": "application/json" },
    });
  };
}

function firstCard(): GalleryTheme {
  const card = cards[0]?.[1];
  if (!card) throw new Error("empty gallery");
  return card;
}

function pressAndSave(
  storage: ReturnType<typeof memoryStorage>,
  theme: ThemeDefinition,
) {
  const saved = saveCustomTheme(storage, loadCustomThemes(storage), theme);
  if (saved.ok) saveChoice(storage, customChoice(theme), saved.customs);
  return saved;
}

test("pressing a card fetches its file from /themes, saves it and chooses it; pressing again replaces it", async () => {
  const storage = memoryStorage();
  const card = firstCard();
  const requests: string[] = [];
  for (let press = 0; press < 2; press += 1) {
    const theme = await fetchGalleryTheme(card, served(requests));
    if (!theme) throw new Error("did not load");
    expect(pressAndSave(storage, theme).ok).toBe(true);
  }
  expect(requests).toEqual([`/themes/${card.path}`, `/themes/${card.path}`]);
  const customs = loadCustomThemes(storage);
  expect(customs.map((theme) => theme.name)).toEqual([card.name]);
  expect(customs[0]?.images).toBeDefined();
  expect(loadChoice(storage, customs)).toBe(`custom:${card.name}`);
});

test("at the custom theme limit a new gallery theme is refused, but one already saved is replaced", async () => {
  const card = firstCard();
  const theme = await fetchGalleryTheme(card, served());
  if (!theme) throw new Error("did not load");
  const others = Array.from({ length: CUSTOM_LIMIT }, (_, index) => ({
    ...theme,
    name: `other ${index}`,
    images: undefined,
  }));
  const full = memoryStorage();
  full.setItem(CUSTOM_KEY, JSON.stringify(others));
  expect(pressAndSave(full, theme)).toEqual({ ok: false, reason: "limit" });
  expect(loadCustomThemes(full).map((saved) => saved.name)).not.toContain(
    card.name,
  );

  const holding = memoryStorage();
  holding.setItem(CUSTOM_KEY, JSON.stringify([...others.slice(1), theme]));
  expect(pressAndSave(holding, theme).ok).toBe(true);
  expect(loadCustomThemes(holding)).toHaveLength(CUSTOM_LIMIT);
});

test("offline, a missing file or a file that is not a theme gives no theme instead of throwing", async () => {
  const card = firstCard();
  const offline = () => Promise.reject(new TypeError("Failed to fetch"));
  const missing = served();
  const notTheme = async () =>
    new Response(JSON.stringify({ name: "x" }), { status: 200 });
  const notJson = async () => new Response("<html>", { status: 200 });
  expect(await fetchGalleryTheme(card, offline)).toBeNull();
  expect(
    await fetchGalleryTheme({ ...card, path: "nope/nope.json" }, missing),
  ).toBeNull();
  expect(await fetchGalleryTheme(card, notTheme)).toBeNull();
  expect(await fetchGalleryTheme(card, notJson)).toBeNull();
});

test("the built entry carries no gallery data, and dist/themes holds every listed file byte for byte", () => {
  const dist = resolve(import.meta.dir, "../../dist");
  const entry = readdirSync(resolve(dist, "assets")).find(
    (file) => file.startsWith("index-") && file.endsWith(".js"),
  );
  if (!entry) throw new Error("no built entry: run bun run build first");
  const entryCode = readFileSync(resolve(dist, "assets", entry), "utf8");
  for (const [, card] of cards) {
    expect(entryCode).not.toContain(card.path);
    const copied = resolve(dist, "themes", card.path);
    expect(existsSync(copied)).toBe(true);
    expect(
      readFileSync(copied).equals(readFileSync(resolve(root, card.path))),
    ).toBe(true);
  }
});
