import { expect } from "bun:test";
import type { Scenario } from "../harness/runner";

export const scenario: Scenario = {
  id: "piratetalk-rust-search",
  async run({ page, url, core, screenshot, log }) {
    if (core !== "rust") {
      throw new Error(
        "Search integration requires the disposable Rust fixture",
      );
    }
    const messageId = "9007199254740993";
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
        .selectOption("archive");
      await page.getByLabel("기록 검색어", { exact: true }).fill("needle");
      const searched = page.waitForResponse((response) => {
        const requestUrl = new URL(response.url());
        return (
          requestUrl.pathname.endsWith("/extensions/piratetalk/v1/search") &&
          requestUrl.searchParams.get("roomId") === "1003" &&
          requestUrl.searchParams.get("q") === "needle"
        );
      });
      await page.locator('[data-ui="piratetalk-read-submit"]').click();
      expect((await searched).status()).toBe(200);
      const hit = page.locator(
        `[data-ui="piratetalk-read-hit"][data-message-id="${messageId}"]`,
      );
      await hit.waitFor();
      const anchored = page.waitForResponse((response) => {
        const requestUrl = new URL(response.url());
        return (
          requestUrl.pathname.endsWith("/extensions/piratetalk/v1/history") &&
          requestUrl.searchParams.get("messageId") === messageId
        );
      });
      await hit.click();
      expect((await anchored).status()).toBe(200);
      await page
        .locator(
          `[data-ui="piratetalk-read-anchor"][data-message-id="${messageId}"]`,
        )
        .waitFor();
      await page
        .getByRole("button", { name: "대화에서 열기", exact: true })
        .click();
      await page
        .locator(
          `[data-ui="thread-wall"] [data-message-id="${messageId}"] [data-ui="message"]`,
        )
        .waitFor();
      await screenshot(`rust-search-anchor-${viewport.width}`);
      log("rust-search-anchor", { viewport, roomId: "1003", messageId });
    }
  },
};
