import { expect } from "bun:test";
import type { Scenario } from "../harness/runner";

export const scenario: Scenario = {
  id: "piratetalk-rust-state-failure",
  async run({ page, url, core, screenshot }) {
    const control = process.env.SAYA_QA_CONTROL_URL;
    const token = process.env.SAYA_QA_CORE_TOKEN;
    if (core !== "rust" || !control || !token)
      throw new Error("Disposable control endpoint and token required");
    const command = async (body: unknown) => {
      const response = await fetch(`${control}/control`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      expect(response.ok).toBe(true);
    };
    for (const width of [1440, 390]) {
      await command({ op: "reaction_reset" });
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      await page.goto("about:blank");
      await page.goto(`${url}/#/room/1001?messageId=200`);
      await page.getByLabel("공감할 메시지").selectOption("200");
      await command({
        op: "arm",
        action: "reaction",
        outcome: "ownership_absent",
      });
      const response = page.waitForResponse(
        (r) =>
          new URL(r.url()).pathname.endsWith("/reaction") &&
          r.request().method() === "POST",
      );
      const reaction = page.locator('[data-ui="piratetalk-reaction"]');
      await reaction.getByRole("button", { name: /^공감 \d+$/ }).click();
      expect((await response).status()).toBe(502);
      await page
        .locator('[data-ui="piratetalk-reaction"][data-outcome="unconfirmed"]')
        .waitFor();
      expect(
        await reaction.locator('button[aria-pressed="true"]').count(),
      ).toBe(0);
      await screenshot(`rust-reaction-unconfirmed-${width}`);
      await page
        .getByRole("button", { name: "여기까지 로컬 읽음", exact: true })
        .click();
      await page
        .locator('[data-ui="piratetalk-read"][data-state="confirmed"]')
        .waitFor();
      await command({
        op: "incoming",
        room_id: "1001",
        text: `Synthetic incoming ${width}`,
      });
      await page.reload();
      await page
        .locator('[data-ui="piratetalk-local-unread"]')
        .filter({ hasText: "안 읽음: 1" })
        .waitFor();
      await screenshot(`rust-read-reloaded-${width}`);
    }
    await command({ op: "reaction_reset" });
  },
};
