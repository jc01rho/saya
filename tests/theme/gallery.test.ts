import { expect, test } from "bun:test";
import { LIGHT } from "../../src/features/theme/builtin";
import {
  fetchGallery,
  fetchGalleryTheme,
  type GalleryTheme,
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
import { DOT, memoryStorage } from "./fakes";

// A made-up catalog in the saya-themes shape; nothing here is a real theme.
const CATALOG = "https://themes.example.test/saya-themes/gallery.json";
const PICTURED: ThemeDefinition = {
  ...LIGHT,
  name: "모음 시험 그림",
  images: { mascot: { src: DOT } },
};
const THEME_FILE = "themes/sample/sample-light-img.json";
const card = (overrides: Record<string, unknown> = {}) => ({
  mode: PICTURED.mode,
  name: PICTURED.name,
  colors: ["#ffffff", "#fee500", "#1e6fd9", "#191919"],
  path: THEME_FILE,
  ...overrides,
});

function serve(
  files: Record<string, string>,
  requests: string[] = [],
): (url: string) => Promise<Response> {
  return async (url) => {
    requests.push(url);
    const body = files[url];
    return body === undefined
      ? new Response("Not Found", { status: 404 })
      : new Response(body, {
          headers: { "Content-Type": "application/json" },
        });
  };
}

const catalogFiles = (list: unknown) => ({
  [CATALOG]: JSON.stringify(list),
  [new URL(THEME_FILE, CATALOG).href]: JSON.stringify(PICTURED),
});

async function onlyCard(): Promise<GalleryTheme> {
  const list = await fetchGallery(
    CATALOG,
    serve(catalogFiles([{ id: "sample", name: "견본", themes: [card()] }])),
  );
  const first = list?.[0]?.themes[0];
  if (!first) throw new Error("no card");
  return first;
}

test("the fixture theme is one the app accepts", () => {
  const result = parseTheme(JSON.stringify(PICTURED));
  expect(result.ok && result.warnings).toEqual([]);
});

test("the list is fetched from the catalog address and each card points at its file beside it", async () => {
  const requests: string[] = [];
  const list = await fetchGallery(
    CATALOG,
    serve(
      catalogFiles([
        {
          id: "sample",
          name: "견본",
          themes: [card(), card({ mode: "dark", name: "견본 밤" })],
        },
      ]),
      requests,
    ),
  );
  expect(requests).toEqual([CATALOG]);
  expect(list).toEqual([
    {
      id: "sample",
      name: "견본",
      themes: [
        {
          mode: "light",
          name: PICTURED.name,
          colors: card().colors,
          url: "https://themes.example.test/saya-themes/themes/sample/sample-light-img.json",
        },
        {
          mode: "dark",
          name: "견본 밤",
          colors: card().colors,
          url: "https://themes.example.test/saya-themes/themes/sample/sample-light-img.json",
        },
      ],
    },
  ]);
});

test("cards that are malformed or point at another site are left out", async () => {
  const list = await fetchGallery(
    CATALOG,
    serve(
      catalogFiles([
        {
          id: "sample",
          name: "견본",
          themes: [
            card({ path: "https://elsewhere.example.test/x.json" }),
            card({ path: "//elsewhere.example.test/x.json" }),
            card({ mode: "sepia" }),
            card({ colors: ["red", "#fee500", "#1e6fd9", "#191919"] }),
            card({ colors: ["#ffffff"] }),
            card({ name: "" }),
            card({ path: 7 }),
            card(),
          ],
        },
        { id: "empty", name: "빈 줄", themes: [card({ mode: "sepia" })] },
        { id: "broken", themes: [card()] },
        "not a character",
      ]),
    ),
  );
  expect(list?.map((character) => character.id)).toEqual(["sample"]);
  expect(list?.[0]?.themes.map((theme) => theme.url)).toEqual([
    new URL(THEME_FILE, CATALOG).href,
  ]);
});

test("offline, a missing list, a list that is not a list, or nothing usable gives no gallery instead of throwing", async () => {
  const offline = () => Promise.reject(new TypeError("Failed to fetch"));
  const html = async () => new Response("<html>", { status: 200 });
  expect(await fetchGallery(CATALOG, offline)).toBeNull();
  expect(await fetchGallery(CATALOG, serve({}))).toBeNull();
  expect(await fetchGallery(CATALOG, html)).toBeNull();
  expect(
    await fetchGallery(CATALOG, serve({ [CATALOG]: '{"themes":[]}' })),
  ).toBeNull();
  expect(
    await fetchGallery(
      CATALOG,
      serve(
        catalogFiles([
          {
            id: "x",
            name: "x",
            themes: [card({ path: "https://elsewhere.example.test/x.json" })],
          },
        ]),
      ),
    ),
  ).toBeNull();
});

function pressAndSave(
  storage: ReturnType<typeof memoryStorage>,
  theme: ThemeDefinition,
) {
  const saved = saveCustomTheme(storage, loadCustomThemes(storage), theme);
  if (saved.ok) saveChoice(storage, customChoice(theme), saved.customs);
  return saved;
}

test("pressing a card fetches its file, saves it and chooses it; pressing again replaces it", async () => {
  const storage = memoryStorage();
  const entry = await onlyCard();
  const requests: string[] = [];
  for (let press = 0; press < 2; press += 1) {
    const theme = await fetchGalleryTheme(
      entry,
      serve(catalogFiles([]), requests),
    );
    if (!theme) throw new Error("did not load");
    expect(pressAndSave(storage, theme).ok).toBe(true);
  }
  expect(requests).toEqual([entry.url, entry.url]);
  const customs = loadCustomThemes(storage);
  expect(customs.map((theme) => theme.name)).toEqual([PICTURED.name]);
  expect(customs[0]?.images).toBeDefined();
  expect(loadChoice(storage, customs)).toBe(`custom:${PICTURED.name}`);
});

test("at the custom theme limit a new gallery theme is refused, but one already saved is replaced", async () => {
  const theme = await fetchGalleryTheme(
    await onlyCard(),
    serve(catalogFiles([])),
  );
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
    PICTURED.name,
  );

  const holding = memoryStorage();
  holding.setItem(CUSTOM_KEY, JSON.stringify([...others.slice(1), theme]));
  expect(pressAndSave(holding, theme).ok).toBe(true);
  expect(loadCustomThemes(holding)).toHaveLength(CUSTOM_LIMIT);
});

test("offline, a missing file, a file that is not a theme, or one parseTheme rejects gives no theme", async () => {
  const entry = await onlyCard();
  const offline = () => Promise.reject(new TypeError("Failed to fetch"));
  const answer = (body: string) => async () =>
    new Response(body, { status: 200 });
  const rejected = {
    ...PICTURED,
    images: { mascot: { src: "https://elsewhere.example.test/a.png" } },
  };
  expect(parseTheme(JSON.stringify(rejected)).ok).toBe(false);
  expect(await fetchGalleryTheme(entry, offline)).toBeNull();
  expect(await fetchGalleryTheme(entry, serve({}))).toBeNull();
  expect(await fetchGalleryTheme(entry, answer('{"name":"x"}'))).toBeNull();
  expect(await fetchGalleryTheme(entry, answer("<html>"))).toBeNull();
  expect(
    await fetchGalleryTheme(entry, answer(JSON.stringify(rejected))),
  ).toBeNull();
});
