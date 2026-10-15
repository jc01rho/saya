import { existsSync } from "node:fs";
import { resolve } from "node:path";
import type { Page } from "playwright-core";
import { domBarrier, responseBarrier } from "../harness/browser-barriers";
import type { Scenario } from "../harness/runner";

/**
 * The catalog served here is a checkout of saya-themes with generated card
 * previews; the harness builds the app itself, so the catalog address goes
 * on the qa command:
 * VITE_THEME_GALLERY_URL=http://127.0.0.1:47941/gallery.json SAYA_QA_THEMES=<checkout> bun run qa -- --scenario theme-gallery-grid --evidence <dir>
 */
const PORT = Number(process.env.SAYA_QA_THEMES_PORT ?? 47941);
const CATALOG_DIR = process.env.SAYA_QA_THEMES;
const VIEWS = [
  ["1440", 1440, 900, 4],
  ["390", 390, 844, 2],
] as const;
const TYPES: Record<string, string> = {
  json: "application/json",
  svg: "image/svg+xml",
};

type Card = {
  mode: string;
  name: string;
  colors: string[];
  path: string;
  preview?: string;
};
type Character = {
  id: string;
  name: string;
  themes: Card[];
  from?: string;
  until?: string;
};

/** Characters the app shows today: inside their inclusive KST period, independently computed here. */
function visibleToday(catalog: Character[]): Character[] {
  const today = new Date(Date.now() + 9 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  return catalog.filter(
    (character) =>
      (character.from === undefined || character.from <= today) &&
      (character.until === undefined || today <= character.until),
  );
}

/** Cards per row: how many share the top of the first card. */
const perRow = (page: Page) =>
  page.evaluate(() => {
    const tops = [
      ...document.querySelectorAll<HTMLElement>(
        '[data-ui="theme-gallery-card"]',
      ),
    ].map((card) => Math.round(card.getBoundingClientRect().top));
    return tops.filter((top) => top === tops[0]).length;
  });

const overflow = (page: Page) =>
  page.evaluate(() => {
    const pane = document.querySelector('[data-ui="settings-pane"]');
    const wide = pane
      ? [pane, ...pane.querySelectorAll("*")]
          .filter(
            (element) =>
              element.scrollWidth > element.clientWidth + 1 &&
              // Screen-reader-only boxes are 1px wide; a single line cut with an ellipsis overflows by design.
              element.clientWidth > 1 &&
              getComputedStyle(element).textOverflow !== "ellipsis",
          )
          .map(
            (element) =>
              `${element.tagName.toLowerCase()}.${element.className}[${element.getAttribute("data-ui") ?? ""}] ${element.scrollWidth}>${element.clientWidth}`,
          )
      : ["no settings pane"];
    return {
      page:
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
      wide,
    };
  });

const pictures = (page: Page) =>
  page.evaluate(() =>
    [
      ...document.querySelectorAll<HTMLElement>(
        '[data-ui="theme-gallery-card"]',
      ),
    ].map((card) => {
      const image = card.querySelector("img");
      return {
        id: card.getAttribute("data-id"),
        image: image ? image.naturalWidth > 0 : null,
        chips: card.querySelector('[data-ui="theme-gallery-chips"]') !== null,
        badge: card.querySelector('[data-ui="theme-gallery-applied"]') !== null,
        pressed: card.getAttribute("aria-pressed"),
      };
    }),
  );

/**
 * The theme gallery as a grid of picture cards, fed by a local copy of the
 * catalog: one group per character, four cards per row at 1440 and two at
 * 390, every preview loaded, the applied badge following the pressed card,
 * nothing wider than the settings pane; and the four-colour chips for a card
 * without a preview or whose preview does not load.
 */
export const scenario: Scenario = {
  id: "theme-gallery-grid",
  async run({ page, url, log, screenshot }) {
    if (!CATALOG_DIR || !existsSync(resolve(CATALOG_DIR, "gallery.json")))
      throw new Error("SAYA_QA_THEMES must point at a saya-themes checkout");
    const catalog = visibleToday(
      (await Bun.file(
        resolve(CATALOG_DIR, "gallery.json"),
      ).json()) as Character[],
    );
    const first = catalog[0]?.themes[0];
    if (!first) throw new Error("The catalog has no card");
    // The fallback catalog: one card without a preview, one whose preview is missing.
    const { preview: _unused, ...plain } = first;
    const fallback: Character[] = [
      {
        id: "plain",
        name: "칩",
        themes: [{ ...plain, name: "칩 시험" }],
      },
      {
        id: "broken",
        name: "깨진 그림",
        themes: [
          { ...first, name: "깨진 시험", preview: "previews/cards/none.svg" },
        ],
      },
    ];
    let serveFallback = false;
    const server = Bun.serve({
      hostname: "127.0.0.1",
      port: PORT,
      async fetch(request) {
        const path = new URL(request.url).pathname;
        const headers: Record<string, string> = {
          "Access-Control-Allow-Origin": "*",
        };
        if (path === "/gallery.json" && serveFallback)
          return Response.json(fallback, { headers });
        if (path.includes("..")) return new Response(null, { status: 400 });
        const file = Bun.file(resolve(CATALOG_DIR, `.${path}`));
        if (!(await file.exists()))
          return new Response("Not Found", { status: 404, headers });
        headers["Content-Type"] =
          TYPES[path.slice(path.lastIndexOf(".") + 1)] ??
          "application/octet-stream";
        return new Response(file, { headers });
      },
    });
    const failures: string[] = [];
    const expect = (ok: boolean, message: string) => {
      if (!ok) failures.push(message);
    };
    const openSettings = async () => {
      const list = responseBarrier(page, "/gallery.json");
      // A hash-only change is a same-document navigation; the second visit must reload.
      const target = `${url}/#/settings`;
      if (page.url() === target) await page.reload({ waitUntil: "load" });
      else await page.goto(target, { waitUntil: "load" });
      await list;
      await page.locator('[data-ui="theme-gallery-group"]').first().waitFor();
      await page.locator('[data-ui="theme-gallery"]').scrollIntoViewIfNeeded();
    };
    const pick = async (id: string, path: string) => {
      const applied = await domBarrier(
        page,
        `[data-ui="theme-gallery-card"][data-id="${id}"][aria-pressed="true"]:not([disabled])`,
      );
      const response = responseBarrier(page, path);
      await page.locator(`[data-id="${id}"]`).click();
      await response;
      await applied.wait();
    };
    try {
      for (const [label, width, height, columns] of VIEWS) {
        await page.setViewportSize({ width, height });
        await openSettings();
        const groups = await page
          .locator('[data-ui="theme-gallery-group"]')
          .count();
        expect(
          groups === catalog.length,
          `${label}: ${groups} groups for ${catalog.length} characters`,
        );
        // Pictures load lazily: bring every group into view once.
        const groupList = page.locator('[data-ui="theme-gallery-group"]');
        for (let index = 0; index < groups; index += 1)
          await groupList.nth(index).scrollIntoViewIfNeeded();
        await page.waitForFunction(
          () =>
            [
              ...document.querySelectorAll<HTMLImageElement>(
                '[data-ui="theme-gallery-picture"]',
              ),
            ].every((image) => image.complete),
          undefined,
          { timeout: 15_000 },
        );
        const loaded = await pictures(page);
        expect(
          loaded.length === catalog.flatMap((c) => c.themes).length &&
            loaded.every((card) => card.image === true && !card.chips),
          `${label}: previews ${JSON.stringify(loaded.filter((c) => c.image !== true || c.chips))}`,
        );
        const columnsSeen = await perRow(page);
        expect(
          columnsSeen === columns,
          `${label}: ${columnsSeen} cards per row, wanted ${columns}`,
        );
        const character = catalog[0];
        const [light, dark] = character?.themes ?? [];
        if (!character || !light || !dark)
          throw new Error("The first character needs two themes");
        await pick(`${character.id}-${light.mode}`, `/${light.path}`);
        let state = await pictures(page);
        expect(
          state
            .filter((card) => card.badge)
            .map((card) => card.id)
            .join() === `${character.id}-${light.mode}` &&
            state.every((card) => card.pressed === String(card.badge)),
          `${label}: badge after the first press ${JSON.stringify(state.filter((c) => c.badge || c.pressed === "true"))}`,
        );
        await pick(`${character.id}-${dark.mode}`, `/${dark.path}`);
        state = await pictures(page);
        expect(
          state
            .filter((card) => card.badge)
            .map((card) => card.id)
            .join() === `${character.id}-${dark.mode}`,
          `${label}: badge after the second press ${JSON.stringify(state.filter((c) => c.badge))}`,
        );
        const o = await overflow(page);
        expect(
          !o.page && o.wide.length === 0,
          `${label}: overflow ${JSON.stringify(o)}`,
        );
        await page
          .locator(`[data-id="${character.id}-${dark.mode}"]`)
          .scrollIntoViewIfNeeded();
        await screenshot(`theme-gallery-grid-${label}`);
        log(`${label}`, { groups, columns: columnsSeen, overflow: o });
      }

      // Without a preview, or with one that does not load, the card shows its colours.
      serveFallback = true;
      await page.setViewportSize({ width: 1440, height: 900 });
      const missing = responseBarrier(page, "/previews/cards/none.svg", 404);
      await openSettings();
      await missing;
      await page
        .locator('[data-id="broken-light"] [data-ui="theme-gallery-chips"]')
        .waitFor();
      const fell = await pictures(page);
      expect(
        fell.length === 2 &&
          fell.every((card) => card.chips && card.image === null),
        `fallback: ${JSON.stringify(fell)}`,
      );
      await screenshot("theme-gallery-grid-fallback");
      log("fallback", { cards: fell });
    } finally {
      server.stop(true);
      log("catalog cleanup", { port: PORT, stopped: true });
    }
    if (failures.length > 0) throw new Error(failures.join("\n"));
  },
};
