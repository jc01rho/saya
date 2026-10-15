import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { Page } from "playwright-core";
import type { components } from "../../src/contract/decoded";
import { responseBarrier } from "../harness/browser-barriers";
import type { Scenario } from "../harness/runner";

type Message = components["schemas"]["Message"];

const VIEWS = [
  ["desktop", 1440, 900],
  ["mobile", 390, 844],
] as const;
const DAY = 86_400_000;
const SHEET = '[data-ui="recap-sheet"]';
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const hrefFor = (roomId: string) => `#/room/${encodeURIComponent(roomId)}`;

async function overflow(page: Page) {
  return page.evaluate((sheet) => {
    const root = document.documentElement;
    const clipped = [
      ...document.querySelectorAll<HTMLElement>(
        `${sheet}, ${sheet} [data-ui="recap-body"], [data-ui="recap-card"], [data-ui="recap-card"] > *, [data-ui="recap-card"] section, [data-ui="recap-heatmap"]`,
      ),
    ].filter(
      (el) => el.offsetParent !== null && el.scrollWidth > el.clientWidth + 1,
    ).length;
    return { page: root.scrollWidth > root.clientWidth, clipped };
  }, SHEET);
}

/**
 * 결산 in real Chrome over the synthetic bridge: the header control opens the
 * sheet, 올해 counts every row of the year and 최근 30일 leaves the older ones
 * out, the words, emoji, people and hour grid are drawn without clipping at
 * 1440 and 390, 이미지로 저장 hands a PNG to the browser's download, and no
 * request leaves the page's own origin while the sheet is open.
 */
export const scenario: Scenario = {
  id: "room-recap",
  async run({ page, bridge, url, evidence, log, screenshot }) {
    const failures: string[] = [];
    const expect = (ok: boolean, message: string) => {
      if (!ok) failures.push(message);
    };
    const room = bridge.data.rooms[0];
    const rows = room ? bridge.data.messages.get(room.id) : undefined;
    const newest = rows?.at(-1);
    if (!room || !rows || !newest?.sentAt)
      throw new Error("Fixture lacks a room with dated rows");
    const base = Date.parse(newest.sentAt);
    const invent = (
      offsetMs: number,
      index: number,
      text: string,
      sender: number,
    ): Message => ({
      id: (BigInt(newest.id) + BigInt(1000 + index)).toString(),
      roomId: room.id,
      senderId: `3800000000000000${sender}`,
      sender: `가상참여자-${sender}`,
      text,
      kind: "text",
      sentAt: new Date(base + offsetMs).toISOString(),
      fromMe: sender === 0,
    });
    // Three rows with emoji at the end of the newest day, five rows forty
    // days earlier: inside 올해, outside 최근 30일.
    const fresh = [
      invent(1000, 1, "오늘 점심 뭐 먹지 😂😂 🙏", 1),
      invent(2000, 2, "등불 등불 😂 ㅋㅋㅋ", 2),
      invent(3000, 3, "별빛 모형 🙏 ㅋㅋ", 0),
    ];
    const old = Array.from({ length: 5 }, (_, index) =>
      invent(-40 * DAY + index * 1000, 10 + index, "옛날 등불 표본", 3),
    );
    rows.push(...fresh);
    rows.unshift(...old);
    const yearCount = rows.length;
    const monthCount = rows.length - old.length;
    const today = new Date(base + 2 * DAY);
    await page.clock.setFixedTime(today);
    log("clock", { today: today.toISOString(), yearCount, monthCount });

    const origin = new URL(url).origin;
    const foreign: string[] = [];
    page.on("request", (request) => {
      if (new URL(request.url()).origin !== origin) foreign.push(request.url());
    });

    const load = async () => {
      const target = `${url}/${hrefFor(room.id)}`;
      if (page.url() !== target) await page.goto(target, { waitUntil: "load" });
      const rooms = responseBarrier(page, "/api/rooms");
      await page.reload({ waitUntil: "load" });
      await rooms;
      await page
        .locator(`[data-ui="thread-wall"] [data-message-id="${newest.id}"]`)
        .waitFor();
    };
    const countOf = async () =>
      Number(
        (
          (await page.locator('[data-ui="recap-count"]').textContent()) ?? ""
        ).replace(/[^\d]/g, ""),
      );

    for (const [label, width, height] of VIEWS) {
      await page.setViewportSize({ width, height });
      await load();
      await page.locator('[data-ui="recap-open"]').click();
      await page.locator('[data-ui="recap-card"]').waitFor();
      const seen = await page.evaluate(() => ({
        period: document
          .querySelector('[data-ui="recap-card"]')
          ?.getAttribute("data-period"),
        words: document.querySelectorAll('[data-ui="recap-words"] li').length,
        emoji: [...document.querySelectorAll('[data-ui="recap-emoji"] li')].map(
          (item) => item.textContent?.replace(/\s+/g, " ").trim() ?? "",
        ),
        people: document.querySelectorAll('[data-ui="recap-people"] li').length,
        cells: document.querySelectorAll('[data-ui="recap-heatmap"] li').length,
        lit: document.querySelectorAll(
          '[data-ui="recap-heatmap"] li:not([data-count="0"])',
        ).length,
        first:
          document
            .querySelector('[data-ui="recap-dates"] time')
            ?.getAttribute("datetime") ?? null,
        busiest: document.querySelector('[data-ui="recap-busiest"]') !== null,
        beyond: document.querySelector('[data-ui="recap-beyond"]') !== null,
      }));
      log(`${label}-card`, { ...seen, count: await countOf() });
      expect(seen.period === "year", `${label}: opened on ${seen.period}`);
      expect((await countOf()) === yearCount, `${label}: 올해 count`);
      expect(seen.words > 0, `${label}: no words`);
      expect(
        seen.emoji[0]?.startsWith("😂") === true,
        `${label}: emoji ${JSON.stringify(seen.emoji)}`,
      );
      expect(seen.people > 1, `${label}: ${seen.people} people`);
      expect(seen.cells === 168, `${label}: ${seen.cells} heat cells`);
      expect(seen.lit > 0, `${label}: no lit heat cell`);
      expect(
        seen.first?.slice(0, 10) === old[0]?.sentAt?.slice(0, 10),
        `${label}: first ${seen.first}`,
      );
      expect(seen.busiest, `${label}: no busiest line`);
      expect(!seen.beyond, `${label}: beyond-window note on a complete window`);
      let o = await overflow(page);
      expect(
        !o.page && o.clipped === 0,
        `${label}: overflow ${JSON.stringify(o)}`,
      );
      await screenshot(`room-recap-${label}`);
      if (label === "desktop") {
        await page
          .locator('[data-ui="recap-heatmap"]')
          .evaluate((el) => el.scrollIntoView({ block: "center" }));
        await screenshot("room-recap-desktop-heatmap");
      }

      await page.locator('[data-ui="recap-period"][data-period="30d"]').click();
      await page.locator('[data-ui="recap-card"][data-period="30d"]').waitFor();
      expect((await countOf()) === monthCount, `${label}: 최근 30일 count`);
      o = await overflow(page);
      expect(
        !o.page && o.clipped === 0,
        `${label}: overflow 30d ${JSON.stringify(o)}`,
      );
      if (label === "mobile") await screenshot("room-recap-mobile-30d");

      if (label === "desktop") {
        const downloading = page.waitForEvent("download", { timeout: 10_000 });
        await page.locator('[data-ui="recap-save"]').click();
        const download = await downloading;
        const name = download.suggestedFilename();
        const saved = resolve(evidence, "room-recap-download.png");
        await download.saveAs(saved);
        const bytes = await readFile(saved);
        log("download", { name, bytes: bytes.byteLength });
        expect(name.endsWith(".png"), `download named ${name}`);
        expect(
          bytes.subarray(0, 8).equals(PNG) && bytes.byteLength > 10_000,
          `download is not a PNG of any size (${bytes.byteLength} bytes)`,
        );
      }

      await page.locator('[data-ui="recap-close"]').click();
      await page.locator(`${SHEET}[open]`).waitFor({ state: "detached" });
    }

    log("foreign-requests", { urls: foreign });
    expect(
      foreign.length === 0,
      `requests left the page's origin: ${foreign.join(", ")}`,
    );

    if (failures.length > 0)
      throw new Error(`room-recap failures:\n${failures.join("\n")}`);
  },
};
