import { expect } from "bun:test";
import type { Scenario } from "../harness/runner";

export const scenario: Scenario = {
  id: "piratetalk-rust-people-unavailable",
  async run({ page, url, core, screenshot }) {
    const control = process.env.SAYA_QA_CONTROL_URL;
    const token = process.env.SAYA_QA_CORE_TOKEN;
    if (core !== "rust" || !control || !token)
      throw new Error("Disposable control endpoint and token required");
    await page.goto(`${url}/#/room/1001`);
    await page.getByRole("button", { name: "친구", exact: true }).waitFor();
    const changed = await fetch(`${control}/control`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ op: "people_absent" }),
    });
    expect(changed.ok).toBe(true);
    const received = page.waitForResponse((r) =>
      new URL(r.url()).pathname.endsWith("/friends"),
    );
    await page.getByRole("button", { name: "친구", exact: true }).click();
    expect((await received).status()).toBe(503);
    const friends = page.locator('[data-ui="piratetalk-friends"]');
    await friends.locator('[role="status"]').waitFor();
    expect(await friends.locator("[data-user-id]").count()).toBe(0);
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      await friends.scrollIntoViewIfNeeded();
      await screenshot(`rust-people-unavailable-${width}`);
    }
  },
};
