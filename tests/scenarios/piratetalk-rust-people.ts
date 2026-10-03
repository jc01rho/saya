import { expect } from "bun:test";
import type { Scenario } from "../harness/runner";

export const scenario: Scenario = {
  id: "piratetalk-rust-people",
  async run({ page, url, core, screenshot }) {
    if (core !== "rust") throw new Error("Requires disposable Rust fixture");
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      await page.goto("about:blank");
      await page.goto(`${url}/#/room/1001`);
      await page.getByRole("button", { name: "친구", exact: true }).click();
      const friends = page.locator('[data-ui="piratetalk-friends"]');
      const peer = friends.locator('[data-user-id="9007199254740995"]');
      await peer.waitFor();
      await screenshot(`rust-friends-${width}`);
      await peer.click();
      const profile = page.locator('[data-ui="piratetalk-profile"]');
      await profile
        .getByRole("heading", { name: "가나", exact: true })
        .waitFor();
      await screenshot(`rust-profile-${width}`);
      await page.getByRole("button", { name: "친구", exact: true }).click();
      await friends
        .locator("li")
        .filter({ has: page.locator('[data-user-id="9007199254740995"]') })
        .getByRole("button", { name: "대화", exact: true })
        .click();
      await page.waitForURL(`${url}/#/room/1002`);
      expect(new URL(page.url()).hash).toBe("#/room/1002");
      await page.getByRole("button", { name: "참여자", exact: true }).click();
      await page
        .locator(
          '[data-ui="piratetalk-members"] [data-user-id="9007199254740995"]',
        )
        .waitFor();
      await screenshot(`rust-members-${width}`);
    }
  },
};
