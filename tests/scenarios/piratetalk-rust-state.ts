import { expect } from "bun:test";
import type { Scenario } from "../harness/runner";

export const scenario: Scenario = {
  id: "piratetalk-rust-state",
  async run({ page, url, core, screenshot }) {
    if (core !== "rust") throw new Error("Requires disposable Rust fixture");
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      await page.goto("about:blank");
      await page.goto(`${url}/#/room/1001?messageId=200`);
      await page.locator('[data-ui="piratetalk-actions"]').waitFor();
      await screenshot(`rust-state-loaded-${width}`);
      await page.getByLabel("공감할 메시지").selectOption("200");
      const reaction = page.locator('[data-ui="piratetalk-reaction"]');
      for (const selected of [true, false]) {
        const changed = page.waitForResponse(
          (response) =>
            response.request().method() === "POST" &&
            new URL(response.url()).pathname.endsWith(
              "/extensions/piratetalk/v1/reaction",
            ),
        );
        await reaction.getByRole("button", { name: /^공감 \d+$/ }).click();
        const response = await changed;
        expect(response.ok()).toBe(true);
        expect((await response.json()).outcome).toBe("confirmed");
        await reaction.locator(`button[aria-pressed="${selected}"]`).waitFor();
      }
      await screenshot(`rust-reaction-${width}`);
      const marked = page.waitForResponse(
        (response) =>
          response.request().method() === "POST" &&
          new URL(response.url()).pathname.endsWith(
            "/extensions/piratetalk/v1/read",
          ),
      );
      await page
        .getByRole("button", { name: "여기까지 로컬 읽음", exact: true })
        .click();
      const response = await marked;
      expect(response.ok()).toBe(true);
      expect((await response.json()).scope).toBe("local");
      await page
        .locator('[data-ui="piratetalk-read"][data-state="confirmed"]')
        .waitFor();
      await screenshot(`rust-local-read-${width}`);
    }
  },
};
