import assert from "node:assert/strict";
import { CONTRACT_VERSION } from "../../src/contract/tsuba/version";
import type { Scenario } from "../harness/runner";

// Every name and id is invented. The adapter sorts by recent activity; the
// tree must draw Discord's sidebar order from x-discord.place instead.
const guild = { id: "100000000000000001", name: "Synthetic server" };
const talk = { id: "200000000000000002", name: "Talk", position: 2 };
const misc = { id: "200000000000000001", name: "Misc", position: 5 };
const general = { id: "300000000000000010", name: "general", position: 1 };
const random = { id: "300000000000000030", name: "random", position: 4 };
const rules = { id: "300000000000000005", name: "rules", position: 9 };
const later = { id: "300000000000000040", name: "later", position: 0 };
const room = (
  id: string,
  at: string,
  place: Record<string, unknown>,
  title: string,
) => ({
  id,
  title,
  kind: "group",
  unread: 0,
  lastActivityAt: `2037-04-07T09:00:0${at}Z`,
  "x-discord.place": { guild, ...place },
});
const rooms = [
  room(
    "300000000000000031",
    "9",
    {
      category: talk,
      channel: random,
      thread: { id: "300000000000000031", name: "newer thread" },
    },
    "Synthetic server · #random › newer thread",
  ),
  room(later.id, "8", { category: misc, channel: later }, "#later"),
  room(random.id, "7", { category: talk, channel: random }, "#random"),
  room(
    "300000000000000029",
    "6",
    {
      category: talk,
      channel: random,
      thread: { id: "300000000000000029", name: "older thread" },
    },
    "Synthetic server · #random › older thread",
  ),
  room(general.id, "5", { category: talk, channel: general }, "#general"),
  room(rules.id, "4", { channel: rules }, "#rules"),
];
const ORDER = [
  "rules",
  "general",
  "random",
  "older thread",
  "newer thread",
  "later",
];

export const scenario: Scenario = {
  id: "discord-tree",
  async run({ context, url, evidence, log }) {
    for (const width of [1440, 390]) {
      const page = await context.newPage();
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      await page.route("**/adapters{,/**}", (route) => {
        const path = new URL(route.request().url()).pathname;
        if (path === "/adapters")
          return route.fulfill({ json: { adapters: [{ id: "discord" }] } });
        if (path.endsWith("/capabilities"))
          return route.fulfill({
            json: {
              ok: true,
              contract: { version: CONTRACT_VERSION },
              adapter: { name: "synthetic", version: "0.0.0" },
              provider: { id: "discord", name: "Discord" },
              account: { kind: "bot" },
              revision: "0123456789abcdef",
              features: {
                "rooms.list": {},
                "messages.read": { paging: "cursor", maxLimit: 100 },
              },
            },
          });
        if (path.endsWith("/rooms"))
          return route.fulfill({ json: { ok: true, complete: true, rooms } });
        if (path.endsWith("/stream"))
          return route.fulfill({
            status: 503,
            json: {
              ok: false,
              error: { code: "BUSY", message: "Synthetic stream unavailable" },
            },
          });
        throw new Error(`Unexpected synthetic route ${path}`);
      });
      await page.goto(`${url}/#/list/discord`, { waitUntil: "load" });
      const tree = page.locator('[data-ui="discord-tree"]');
      await tree.waitFor({ state: "visible", timeout: 10_000 });
      const names = async () =>
        (
          await tree
            .locator('[data-ui="discord-channel"], [data-ui="discord-thread"]')
            .allTextContents()
        ).map((text) => text.replace(/^#/, ""));
      assert.deepEqual(await names(), ORDER);
      assert.equal(
        await page.locator('[data-ui="discord-guild"]').count(),
        1,
        "the server's name is drawn once",
      );
      // The tree replaces the flat rows for these rooms; nothing is drawn twice.
      assert.equal(await page.locator('[data-ui="inbox"] li a').count(), 6);
      assert.equal(
        await page.evaluate(
          () =>
            document.documentElement.scrollWidth >
            document.documentElement.clientWidth,
        ),
        false,
      );
      await page.screenshot({ path: `${evidence}/${width}-tree.png` });

      const fold = tree.getByRole("button", { name: "Talk 접기" });
      await fold.click();
      await tree
        .getByRole("button", { name: "Talk 펼치기" })
        .waitFor({ state: "visible" });
      assert.deepEqual(await names(), ["rules", "later"]);
      await page.reload({ waitUntil: "load" });
      await tree.waitFor({ state: "visible", timeout: 10_000 });
      assert.deepEqual(
        await names(),
        ["rules", "later"],
        "a folded category stays folded in this browser",
      );
      await page.screenshot({ path: `${evidence}/${width}-folded.png` });
      await tree.getByRole("button", { name: "Talk 펼치기" }).click();
      await tree
        .getByRole("button", { name: "Talk 접기" })
        .waitFor({ state: "visible" });
      assert.deepEqual(await names(), ORDER);
      log("discord-tree", { width, rows: ORDER.length, folded: 4 });
      await page.close();
    }
  },
};
