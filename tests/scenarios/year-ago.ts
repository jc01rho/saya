import type { Page } from "playwright-core";
import { syntheticPicture } from "../fixtures/data";
import { responseBarrier } from "../harness/browser-barriers";
import type { Scenario } from "../harness/runner";

const VIEWS = [
  ["desktop", 1440, 900],
  ["mobile", 390, 844],
] as const;
const DAY = 86_400_000;
const CARD = '[data-ui="year-ago"]';
const hrefFor = (roomId: string) => `#/room/${encodeURIComponent(roomId)}`;

async function overflow(page: Page) {
  return page.evaluate((card) => {
    const root = document.documentElement;
    const clipped = [
      ...document.querySelectorAll<HTMLElement>(
        // Containers only: a quoted line ellipsises by design, so its own scrollWidth is not clipping.
        `[data-ui="thread-outlet"], ${card}, ${card} > *, ${card} ul`,
      ),
    ].filter(
      (el) => el.offsetParent !== null && el.scrollWidth > el.clientWidth + 1,
    ).length;
    return { page: root.scrollWidth > root.clientWidth, clipped };
  }, CARD);
}

/**
 * 작년 오늘 in real Chrome over the synthetic bridge, with the browser's clock
 * set one year after the fixture's newest day: the room that spoke that day
 * shows the card with its lines and thumbnails at 1440 and 390 without
 * clipping, the room that did not shows nothing, the card folds and unfolds,
 * and a close is remembered across a reload.
 */
export const scenario: Scenario = {
  id: "year-ago",
  async run({ page, bridge, url, log, screenshot }) {
    const failures: string[] = [];
    const expect = (ok: boolean, message: string) => {
      if (!ok) failures.push(message);
    };
    const [spoke, silent] = bridge.data.rooms;
    const rows = spoke ? bridge.data.messages.get(spoke.id) : undefined;
    const newest = rows?.at(-1);
    const silentRows = silent ? bridge.data.messages.get(silent.id) : undefined;
    const silentNewest = silentRows?.at(-1);
    if (!spoke || !silent || !rows || !newest?.sentAt || !silentNewest)
      throw new Error("Fixture lacks two rooms with dated rows");
    // Two invented photo rows at the end of that day, so the card has thumbnails to show.
    const base = Date.parse(newest.sentAt);
    for (let index = 0; index < 2; index++)
      rows.push({
        id: (BigInt(newest.id) + BigInt(1000 + index)).toString(),
        roomId: spoke.id,
        senderId: "38000000000000003",
        sender: "가상참여자-3",
        text: "",
        kind: "photo",
        sentAt: new Date(base + (index + 1) * 1000).toISOString(),
        fromMe: false,
        photo: {
          url: syntheticPicture(index),
          width: 96,
          height: 96,
          count: 1,
          images: [{ url: syntheticPicture(index), width: 96, height: 96 }],
        },
      });
    const today = new Date(base + 365 * DAY);
    await page.clock.setFixedTime(today);
    log("clock", { today: today.toISOString() });
    const expectedDay = new Date(base);

    const load = async (roomId: string, newestId: string) => {
      const target = `${url}/${hrefFor(roomId)}`;
      if (page.url() !== target) await page.goto(target, { waitUntil: "load" });
      const rooms = responseBarrier(page, "/api/rooms");
      await page.reload({ waitUntil: "load" });
      await rooms;
      await page
        .locator(`[data-ui="thread-wall"] [data-message-id="${newestId}"]`)
        .waitFor();
    };
    const localDay = (date: Date) =>
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

    for (const [label, width, height] of VIEWS) {
      await page.setViewportSize({ width, height });
      await load(spoke.id, newest.id);
      await page.locator(CARD).waitFor();
      const seen = await page.evaluate((card) => {
        const root = document.querySelector(card);
        const images = [
          ...(root?.querySelectorAll<HTMLImageElement>("img") ?? []),
        ];
        return {
          day: root?.querySelector("time")?.getAttribute("datetime") ?? null,
          lines: root?.querySelectorAll('[data-ui="year-ago-lines"] li').length,
          pictures: root?.querySelectorAll('[data-ui="year-ago-picture"]')
            .length,
          drawn: images.filter((img) => img.complete && img.naturalWidth > 0)
            .length,
          cards: document.querySelectorAll(card).length,
        };
      }, CARD);
      log(`${label}-card`, seen);
      expect(seen.cards === 1, `${label}: ${seen.cards} cards`);
      expect(
        seen.day === localDay(expectedDay),
        `${label}: card day ${seen.day}, expected ${localDay(expectedDay)}`,
      );
      expect(
        (seen.lines ?? 0) > 0 && (seen.lines ?? 0) <= 3,
        `${label}: ${seen.lines} lines`,
      );
      expect(seen.pictures === 2, `${label}: ${seen.pictures} pictures`);
      expect(seen.drawn === 2, `${label}: ${seen.drawn} thumbnails drawn`);
      const o = await overflow(page);
      expect(
        !o.page && o.clipped === 0,
        `${label}: overflow ${JSON.stringify(o)}`,
      );
      await screenshot(`year-ago-${label}`);

      const toggle = page.locator('[data-ui="year-ago-toggle"]');
      await toggle.click();
      expect(
        (await page.locator('[data-ui="year-ago-lines"]').count()) === 0,
        `${label}: the body is still drawn after folding`,
      );
      expect(
        (await toggle.getAttribute("aria-expanded")) === "false",
        `${label}: aria-expanded after folding`,
      );
      if (label === "mobile") await screenshot("year-ago-mobile-folded");
      await toggle.click();
      expect(
        (await page.locator('[data-ui="year-ago-lines"]').count()) === 1,
        `${label}: the body did not come back`,
      );

      // The room that said nothing that day has no card.
      await load(silent.id, silentNewest.id);
      await page.locator('[data-ui="notice"]').waitFor();
      expect(
        (await page.locator(CARD).count()) === 0,
        `${label}: a card in the room with nothing from that day`,
      );
    }

    // Closing is remembered: not on this navigation, not after a reload.
    await load(spoke.id, newest.id);
    await page.locator(CARD).waitFor();
    await page.locator('[data-ui="year-ago-close"]').click();
    expect(
      (await page.locator(CARD).count()) === 0,
      "the card stayed after closing",
    );
    await load(spoke.id, newest.id);
    expect(
      (await page.locator(CARD).count()) === 0,
      "the card came back after a reload",
    );
    await screenshot("year-ago-closed");

    if (failures.length > 0)
      throw new Error(`year-ago failures:\n${failures.join("\n")}`);
  },
};
