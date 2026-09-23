import { validateHealthResponse } from "../../src/contract/validators.js";
import { responseBarrier } from "../harness/browser-barriers";
import type { Scenario } from "../harness/runner";

export const scenario: Scenario = {
  id: "harness-smoke",
  async run({ page, bridge, url, log, screenshot }) {
    const blank = responseBarrier(page, "/__qa/blank");
    await page.goto(`${url}/__qa/blank`, { waitUntil: "load" });
    await blank;
    const response = responseBarrier(page, "/api/health");
    const served = bridge.events.expect(
      (event) => event.type === "response" && event.path === "/health",
      "fixture health response",
    );
    const health = await page.evaluate(async () => {
      const result = await fetch("/api/health");
      if (!result.ok) throw new Error(`Health HTTP ${result.status}`);
      return result.json();
    });
    await Promise.all([response, served]);
    if (!validateHealthResponse(health))
      throw new Error("Invalid fixture health");
    if ((await page.locator("body").textContent()) !== "")
      throw new Error("Smoke page is not blank");
    log("health-validated", { ok: true });
    await screenshot("blank-desktop");
    await page.setViewportSize({ width: 390, height: 844 });
    await screenshot("blank-mobile");
  },
};
