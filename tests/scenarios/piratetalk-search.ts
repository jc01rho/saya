import { expect } from "bun:test";
import type { Scenario } from "../harness/runner";
import { enableHistorySearch } from "./piratetalk-history-search-fixture";

export const scenario: Scenario = {
  id: "piratetalk-search",
  async run({ page, bridge, url, screenshot, log }) {
    await enableHistorySearch(page);
    const room = bridge.data.rooms.find((room) => room.readable);
    if (!room) throw new Error("Missing synthetic readable room");
    const id = "9007199254740993";
    const coverage = { source: "archive", complete: false, stale: true };
    let anchors = 0;
    let searches = 0;
    await page.route(
      "**/api/extensions/piratetalk/v1/search?*",
      async (route) => {
        searches++;
        const query = new URL(route.request().url()).searchParams;
        if (query.get("q") === "unavailable") {
          await route.fulfill({
            status: 503,
            json: {
              ok: false,
              error: {
                code: "source_unavailable",
                detail: "Synthetic archive unavailable",
              },
            },
          });
          return;
        }
        await route.fulfill({
          json: {
            items:
              query.get("q") === "empty"
                ? []
                : [
                    {
                      roomId: room.id,
                      messageId: id,
                      userId: "1",
                      text: "Synthetic old hit",
                      at: 1700000000,
                      scope: "messages",
                    },
                  ],
            hasMore: false,
            nextCursor: null,
            coverage,
          },
        });
      },
    );
    await page.route(
      "**/api/extensions/piratetalk/v1/history?*",
      async (route) => {
        const query = new URL(route.request().url()).searchParams;
        expect(query.get("messageId")).toBe(id);
        expect(query.get("roomId")).toBe(room.id);
        anchors++;
        await route.fulfill({
          json: {
            items: [
              {
                roomId: room.id,
                id,
                userId: "1",
                text: "Synthetic old hit",
                kind: "text",
                at: 1700000000,
              },
            ],
            hasMore: false,
            nextCursor: null,
            coverage,
          },
        });
      },
    );
    try {
      for (const viewport of [
        { width: 1440, height: 900 },
        { width: 390, height: 844 },
      ]) {
        await page.setViewportSize(viewport);
        await page.goto("about:blank");
        await page.goto(`${url}/#/room/${room.id}`);
        await page
          .getByRole("button", { name: "기록 · 검색", exact: true })
          .click();
        await page.locator('[data-ui="piratetalk-history-search"]').waitFor();
        await page
          .getByLabel("검색 방식", { exact: true })
          .selectOption("archive");
        await page.getByLabel("기록 검색어", { exact: true }).fill("needle");
        const hit = page.locator(
          `[data-ui="piratetalk-read-hit"][data-message-id="${id}"]`,
        );
        await page.locator('[data-ui="piratetalk-read-submit"]').click();
        await hit.waitFor();
        const anchored = page.waitForResponse((response) =>
          new URL(response.url()).pathname.endsWith("/history"),
        );
        await hit.click();
        await anchored;
        await page
          .locator(
            `[data-ui="piratetalk-read-anchor"][data-message-id="${id}"]`,
          )
          .waitFor();
        for (const query of ["empty", "unavailable"]) {
          await page
            .getByLabel("검색 방식", { exact: true })
            .selectOption("archive");
          await page.getByLabel("기록 검색어", { exact: true }).fill(query);
          await page.locator('[data-ui="piratetalk-read-submit"]').click();
          await page
            .locator(
              query === "empty"
                ? '[data-ui="piratetalk-read-empty"]'
                : '[data-ui="piratetalk-read-error"]',
            )
            .waitFor();
          await screenshot(`${viewport.width}-${query}`);
        }
      }
      expect(anchors).toBe(2);
      expect(searches).toBe(6);
      log("history-search-exact-anchor", { anchors, searches, messageId: id });
    } finally {
      await page.unroute("**/api/extensions/piratetalk/v1/search?*");
      await page.unroute("**/api/extensions/piratetalk/v1/history?*");
      await page.unroute("**/api/extensions/piratetalk/v1/capabilities");
    }
  },
};
