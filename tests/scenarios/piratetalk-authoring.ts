import { expect } from "bun:test";
import type { Scenario } from "../harness/runner";

export const scenario: Scenario = {
  id: "piratetalk-authoring",
  async run({ page, url, core, screenshot, log }) {
    if (core !== "rust")
      throw new Error("Authoring acceptance requires disposable Rust fixture");
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
      const searched = page.waitForResponse((response) =>
        new URL(response.url()).pathname.endsWith(
          "/extensions/piratetalk/v1/search",
        ),
      );
      await page.locator('[data-ui="piratetalk-read-submit"]').click();
      expect((await searched).status()).toBe(200);
      const anchored = page.waitForResponse((response) => {
        const requestUrl = new URL(response.url());
        return (
          requestUrl.pathname.endsWith("/extensions/piratetalk/v1/history") &&
          requestUrl.searchParams.get("messageId") === "9007199254740993"
        );
      });
      await page
        .locator(
          '[data-ui="piratetalk-read-hit"][data-message-id="9007199254740993"]',
        )
        .click();
      expect((await anchored).status()).toBe(200);
      await page
        .getByRole("button", { name: "대화에서 열기", exact: true })
        .click();
      const source = page.locator(
        '[data-ui="thread-wall"] [data-message-id="9007199254740993"]',
      );
      await source.getByRole("button", { name: "답장", exact: true }).click();
      await page.locator('[data-ui="piratetalk-reply-preview"]').waitFor();
      const input = page.locator('[data-ui="composer-input"]');
      await input.fill("😀 ");
      await page
        .getByRole("button", { name: "멤버 멘션", exact: true })
        .click();
      await page
        .locator('[data-ui="piratetalk-mention-picker"]')
        .getByRole("button", { name: "가나", exact: true })
        .click();
      const sent = page.waitForRequest(
        (request) =>
          request.method() === "POST" &&
          new URL(request.url()).pathname.endsWith(
            "/extensions/piratetalk/v1/send",
          ),
      );
      await page.locator('[data-ui="composer-send"]').click();
      const request = (await sent).postDataJSON();
      expect(request).toMatchObject({
        roomId: "1003",
        kind: "text",
        replyTo: "9007199254740993",
        mentions: [{ userId: "9007199254740995", start: 3, length: 3 }],
      });
      await page
        .locator('[data-ui="composer-pending"][data-state="confirmed"]')
        .waitFor();
      const threadLoaded = page.waitForResponse((response) =>
        new URL(response.url()).pathname.endsWith(
          "/extensions/piratetalk/v1/thread",
        ),
      );
      await source
        .getByRole("button", { name: "스레드 보기", exact: true })
        .click();
      const threadResponse = await threadLoaded;
      expect(threadResponse.ok()).toBe(true);
      const threadBody = await threadResponse.json();
      expect(
        threadBody.items.some(
          (item: { id: string }) => item.id === request.replyTo,
        ),
      ).toBe(true);
      let replyFound = threadBody.items.some(
        (item: { replyTo?: string }) => item.replyTo === request.replyTo,
      );
      let cursor = threadBody.nextCursor;
      while (!replyFound && cursor) {
        const next = page.waitForResponse((response) =>
          new URL(response.url()).pathname.endsWith(
            "/extensions/piratetalk/v1/thread",
          ),
        );
        await page
          .getByRole("button", { name: "스레드 더 보기", exact: true })
          .click();
        const response = await next;
        expect(response.ok()).toBe(true);
        const body = await response.json();
        expect(body.nextCursor).not.toBe(cursor);
        cursor = body.nextCursor;
        replyFound = body.items.some(
          (item: { replyTo?: string }) => item.replyTo === request.replyTo,
        );
      }
      expect(replyFound).toBe(true);
      await page.locator('[data-ui="piratetalk-thread"]').waitFor();
      await screenshot(`authoring-${viewport.width}`);
      log("authoring", {
        viewport,
        exactReplyId: request.replyTo,
        mentions: request.mentions,
      });
    }
  },
};
