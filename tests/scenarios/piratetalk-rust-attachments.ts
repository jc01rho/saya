import { expect } from "bun:test";
import type { Scenario } from "../harness/runner";

export const scenario: Scenario = {
  id: "piratetalk-rust-attachments",
  async run({ page, url, core, screenshot, log }) {
    if (core !== "rust") {
      throw new Error(
        "Attachment integration requires the disposable Rust fixture",
      );
    }
    const photoId = "9007199254740994";
    for (const viewport of [
      { width: 1440, height: 900 },
      { width: 390, height: 844 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto("about:blank");
      await page.goto(`${url}/#/room/1003`);
      await page
        .getByRole("button", { name: "기록 · 검색", exact: true })
        .click();
      await page.locator('[data-ui="piratetalk-history-search"]').waitFor();
      await page
        .getByLabel("검색 방식", { exact: true })
        .selectOption("attachments");
      const cursors: (string | null)[] = [];
      let found = false;
      for (let index = 0; index < 10; index++) {
        const received = page.waitForResponse((response) => {
          const requestUrl = new URL(response.url());
          return (
            requestUrl.pathname.endsWith(
              "/extensions/piratetalk/v1/attachments",
            ) && requestUrl.searchParams.get("roomId") === "1003"
          );
        });
        await page
          .locator(
            index === 0
              ? '[data-ui="piratetalk-read-submit"]'
              : '[data-ui="piratetalk-read-next"]',
          )
          .click();
        const response = await received;
        expect(response.status()).toBe(200);
        cursors.push(new URL(response.url()).searchParams.get("cursor"));
        // A rendered enabled submit button signals completion of this page load.
        await page
          .locator('[data-ui="piratetalk-read-submit"]:not([disabled])')
          .waitFor();
        const hit = page.locator(
          `[data-ui="piratetalk-read-hit"][data-message-id="${photoId}"]`,
        );
        if (await hit.count()) {
          found = true;
          break;
        }
        expect(
          await page.locator('[data-ui="piratetalk-read-empty"]').count(),
        ).toBe(1);
        expect(
          await page.locator('[data-ui="piratetalk-read-next"]').count(),
        ).toBe(1);
      }
      expect(found).toBe(true);
      expect(cursors.length).toBeGreaterThan(5);
      expect(cursors[0]).toBeNull();
      expect(new Set(cursors).size).toBe(cursors.length);
      await screenshot(`rust-attachment-scan-${viewport.width}`);
      log("rust-attachment-scan", {
        viewport,
        roomId: "1003",
        photoId,
        cursors,
      });
      const attachmentRoute = "**/api/extensions/piratetalk/v1/attachments?*";
      await page.route(attachmentRoute, async (route) => {
        await route.fulfill({
          status: 503,
          json: {
            ok: false,
            error: {
              code: "source_unavailable",
              detail: "Synthetic attachment source unavailable",
            },
          },
        });
      });
      try {
        log("attachment-failure-interception-armed", {
          viewport,
          evidenceSource: "browser-response-interception",
          actualRustFailure: false,
          status: 503,
          code: "source_unavailable",
        });
        const failed = page.waitForResponse((response) => {
          const target = new URL(response.url());
          return (
            target.pathname.endsWith("/extensions/piratetalk/v1/attachments") &&
            target.searchParams.get("roomId") === "1003"
          );
        });
        await page.locator('[data-ui="piratetalk-read-submit"]').click();
        expect((await failed).status()).toBe(503);
        const error = page.locator('[data-ui="piratetalk-read-error"]');
        await error.waitFor({ state: "visible" });
        await error.scrollIntoViewIfNeeded();
        expect(await error.getAttribute("role")).toBe("alert");
        expect(await error.isVisible()).toBe(true);
        expect((await error.innerText()).trim().length).toBeGreaterThan(0);
        expect(
          await page.locator('[data-ui="piratetalk-read-empty"]').count(),
        ).toBe(0);
        await screenshot(
          `attachment-intercepted-unavailable-${viewport.width}`,
        );
        log("attachment-unavailable-visible", {
          viewport,
          evidenceSource: "browser-response-interception",
          actualRustFailure: false,
          alertVisible: true,
          emptyStateVisible: false,
        });
      } finally {
        await page.unroute(attachmentRoute);
      }
    }
  },
};
