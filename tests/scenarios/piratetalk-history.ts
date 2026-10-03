import { expect } from "bun:test";
import type { Scenario } from "../harness/runner";
import { enableHistorySearch } from "./piratetalk-history-search-fixture";

export const scenario: Scenario = {
  id: "piratetalk-history",
  async run({ page, bridge, url, screenshot, log }) {
    await enableHistorySearch(page);
    const room = bridge.data.rooms.find((room) => room.readable);
    if (!room) throw new Error("Missing synthetic readable room");
    const id = "9007199254740993";
    const cursors: (string | null)[] = [];
    await page.route(
      "**/api/extensions/piratetalk/v1/attachments?*",
      async (route) => {
        const query = new URL(route.request().url()).searchParams;
        const cursor = query.get("cursor");
        cursors.push(cursor);
        const pageIndex =
          cursor === null ? 0 : Number(cursor.replace("scan_", ""));
        const end = pageIndex === 5;
        await route.fulfill({
          json: {
            items: end
              ? [
                  {
                    id: "synthetic-photo",
                    roomId: room.id,
                    messageId: id,
                    kind: "photo",
                    name: "Synthetic photo",
                  },
                ]
              : [],
            hasMore: !end,
            nextCursor: end ? null : `scan_${pageIndex + 1}`,
            coverage: { source: "archive", complete: false, stale: true },
          },
        });
      },
    );
    try {
      await page.goto(`${url}/#/room/${room.id}`);
      await page
        .getByRole("button", { name: "기록 · 검색", exact: true })
        .click();
      await page.locator('[data-ui="piratetalk-history-search"]').waitFor();
      await page
        .getByLabel("검색 방식", { exact: true })
        .selectOption("attachments");
      const first = page.waitForResponse((response) =>
        new URL(response.url()).pathname.endsWith(
          "/extensions/piratetalk/v1/attachments",
        ),
      );
      await page.locator('[data-ui="piratetalk-read-submit"]').click();
      await first;
      for (let index = 0; index < 5; index++) {
        const next = page.locator('[data-ui="piratetalk-read-next"]');
        await next.waitFor();
        const response = page.waitForResponse(
          (response) =>
            new URL(response.url()).searchParams.get("cursor") ===
            `scan_${index + 1}`,
        );
        await next.click();
        await response;
      }
      await page
        .locator(`[data-ui="piratetalk-read-hit"][data-message-id="${id}"]`)
        .waitFor();
      expect(cursors).toEqual([
        null,
        "scan_1",
        "scan_2",
        "scan_3",
        "scan_4",
        "scan_5",
      ]);
      expect(
        await page.locator('[data-ui="piratetalk-read-next"]').count(),
      ).toBe(0);
      await screenshot("attachment-after-1001-plain");
      const galleryResponse = page.waitForResponse(
        (response) => new URL(response.url()).pathname === "/api/attachments",
      );
      await page.locator('[data-ui="attachments-open"]').click();
      await galleryResponse;
      await page.locator('aside[data-ui="attachments"]').waitFor();
      await screenshot("canonical-gallery-still-opens");
      log("attachment-scan-cursors", { cursors, messageId: id });
    } finally {
      await page.unroute("**/api/extensions/piratetalk/v1/attachments?*");
      await page.unroute("**/api/extensions/piratetalk/v1/capabilities");
    }
  },
};
