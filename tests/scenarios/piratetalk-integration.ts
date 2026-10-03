import { expect } from "bun:test";
import type { Scenario } from "../harness/runner";

export const scenario: Scenario = {
  id: "piratetalk-integration",
  async run({ core, page, url, screenshot, log }) {
    if (core !== "rust")
      throw new Error(
        "This scenario requires --rust-core and the disposable full application fixture",
      );
    for (const viewport of [
      { width: 1440, height: 900 },
      { width: 390, height: 844 },
    ]) {
      await page.goto("about:blank");
      await page.setViewportSize(viewport);
      const optional: string[] = [];
      let streams = 0;
      const observed = (request: import("playwright-core").Request) => {
        const path = new URL(request.url()).pathname;
        if (path.startsWith("/api/extensions/piratetalk/v1/"))
          optional.push(path);
        if (path === "/api/stream") streams++;
      };
      page.on("request", observed);
      const discovery = page.waitForResponse(
        (response) =>
          new URL(response.url()).pathname ===
          "/api/extensions/piratetalk/v1/capabilities",
      );
      const stream = page.waitForResponse(
        (response) => new URL(response.url()).pathname === "/api/stream",
      );
      await page.goto(`${url}/#/room/1003`);
      const response = await discovery;
      expect(response.status()).toBe(200);
      await stream;
      await page.locator('[data-ui="composer-input"]').waitFor();
      await page
        .locator('[data-ui="piratetalk-status"][data-state="available"]')
        .waitFor();
      expect(optional).toEqual(["/api/extensions/piratetalk/v1/capabilities"]);
      expect(streams).toBe(1);
      await screenshot(`${viewport.width}-rust-app`);
      log("rust-application-mounted", { viewport, optional, streams });
      page.off("request", observed);
    }
  },
};
