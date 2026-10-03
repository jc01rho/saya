import { expect } from "bun:test";
import type { Scenario } from "../harness/runner";

export const scenario: Scenario = {
  id: "piratetalk-rust-model",
  async run({ page, url, core, screenshot, log }) {
    if (core !== "rust") {
      throw new Error("Model integration requires the disposable Rust fixture");
    }
    const roomId = "9007199254740993";
    for (const viewport of [
      { width: 1440, height: 900 },
      { width: 390, height: 844 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto("about:blank");
      await page.goto(`${url}/#/room/${roomId}`);
      await page
        .getByRole("button", { name: "모델 기능", exact: true })
        .click();
      await page.locator('[data-ui="piratetalk-model-open"]').click();
      await page.locator('[data-ui="piratetalk-model-all"]').check();
      const summarized = page.waitForResponse(
        (response) =>
          response.request().method() === "POST" &&
          new URL(response.url()).pathname.endsWith(
            "/extensions/piratetalk/v1/summary",
          ),
      );
      await page.locator('[data-ui="piratetalk-model-summary"]').click();
      const summary = await summarized;
      expect(summary.ok()).toBe(true);
      const summaryBody = await summary.json();
      expect(summaryBody.roomId).toBe(roomId);
      expect(summaryBody.messageCount).toBeGreaterThanOrEqual(6001);
      expect(summaryBody.chunkCount).toBeGreaterThan(1);
      await page.locator('[data-ui="piratetalk-model-result"]').waitFor();
      expect(
        await page.locator('[data-ui="piratetalk-model-result"]').textContent(),
      ).toContain(summaryBody.summary);
      await page
        .locator('[data-ui="piratetalk-model-result"]')
        .scrollIntoViewIfNeeded();
      await screenshot(`rust-model-summary-${viewport.width}`);
      await page
        .locator('[data-ui="piratetalk-model-question"]')
        .fill("RECORD");
      const answered = page.waitForResponse(
        (response) =>
          response.request().method() === "POST" &&
          new URL(response.url()).pathname.endsWith(
            "/extensions/piratetalk/v1/question",
          ),
      );
      await page.locator('[data-ui="piratetalk-model-ask"]').click();
      const answer = await answered;
      expect(answer.ok()).toBe(true);
      const answerBody = await answer.json();
      expect(answerBody.roomId).toBe(roomId);
      expect(answerBody.windowCount).toBeGreaterThanOrEqual(6001);
      await page
        .locator('[data-ui="piratetalk-model-citation"]')
        .first()
        .waitFor();
      expect(
        await page.locator('[data-ui="piratetalk-model-result"]').textContent(),
      ).toContain(answerBody.answer);
      await page
        .locator('[data-ui="piratetalk-model-result"]')
        .scrollIntoViewIfNeeded();
      await screenshot(`rust-model-question-${viewport.width}`);
      log("rust-model-period", {
        viewport,
        roomId,
        messageCount: summaryBody.messageCount,
        chunkCount: summaryBody.chunkCount,
        windowCount: answerBody.windowCount,
      });
    }
  },
};
