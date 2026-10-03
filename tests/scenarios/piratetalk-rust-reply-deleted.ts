import { expect } from "bun:test";
import type { Scenario } from "../harness/runner";

export const scenario: Scenario = {
  id: "piratetalk-rust-reply-deleted",
  async run({ page, url, core, screenshot }) {
    const control = process.env.SAYA_QA_CONTROL_URL;
    const token = process.env.SAYA_QA_CORE_TOKEN;
    if (core !== "rust" || !control || !token)
      throw new Error("Disposable control endpoint and token required");
    await page.goto(`${url}/#/room/1003?messageId=9007199254740993`);
    const source = page.locator(
      '[data-ui="thread-wall"] [data-message-id="9007199254740993"]',
    );
    await source.getByRole("button", { name: "답장", exact: true }).click();
    const input = page.locator('[data-ui="composer-input"]');
    await input.fill("Synthetic deleted-target reply");
    const changed = await fetch(`${control}/control`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ op: "source_deleted" }),
    });
    expect(changed.ok).toBe(true);
    const sent = page.waitForResponse(
      (response) =>
        response.request().method() === "POST" &&
        new URL(response.url()).pathname.endsWith("/v1/send"),
    );
    await page.locator('[data-ui="composer-send"]').click();
    const response = await sent;
    expect(response.status()).toBe(404);
    expect((await response.json()).outcome).toBe("rejected");
    await page
      .getByRole("alert")
      .filter({ hasText: "reply_target_unavailable" })
      .waitFor();
    expect(await input.inputValue()).toBe("Synthetic deleted-target reply");
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      await screenshot(`rust-deleted-reply-${width}`);
    }
  },
};
