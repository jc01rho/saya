import { expect } from "bun:test";
import type { Scenario } from "../harness/runner";

export const scenario: Scenario = {
  id: "piratetalk-model-cancel",
  async run({ page, bridge, url, log }) {
    const rooms = bridge.data.rooms.filter((room) => room.readable);
    const first = rooms[0];
    const second = rooms[1];
    if (!first || !second) throw new Error("Two synthetic rooms required");
    const released = Promise.withResolvers<void>();
    let calls = 0;
    await page.route("**/api/extensions/piratetalk/v1/**", async (route) => {
      if (new URL(route.request().url()).pathname.endsWith("/capabilities")) {
        await route.fulfill({
          json: {
            version: "1.0.0",
            features: Object.fromEntries(
              [
                "reply",
                "thread",
                "mentions",
                "media",
                "stickers",
                "reactions",
                "history",
                "search",
                "readLocal",
                "people",
                "summary",
                "question",
              ].map((name) => [
                name,
                { available: name === "summary" || name === "question" },
              ]),
            ),
            models: ["gpt-6-astra"],
            uploadPolicy: { maxBytes: null, maxFiles: 1, kinds: [] },
          },
        });
        return;
      }
      calls++;
      await released.promise;
      await route.abort("aborted");
    });
    try {
      await page.goto(`${url}/#/room/${first.id}`);
      await page
        .getByRole("button", { name: "모델 기능", exact: true })
        .click();
      await page.locator('[data-ui="piratetalk-model-open"]').click();
      const pending = page.waitForRequest((request) =>
        new URL(request.url()).pathname.endsWith("/summary"),
      );
      await page.locator('[data-ui="piratetalk-model-summary"]').click();
      await pending;
      await page.locator('[data-ui="piratetalk-model-cancel"]').click();
      await page.evaluate((id) => {
        location.hash = `#/room/${id}`;
      }, second.id);
      await page
        .getByRole("button", { name: "모델 기능", exact: true })
        .click();
      await page.locator('[data-ui="piratetalk-model-open"]').waitFor();
      released.resolve();
      expect(
        await page.locator('[data-ui="piratetalk-model-result"]').count(),
      ).toBe(0);
      expect(
        await page.locator('[data-ui="piratetalk-model-error"]').count(),
      ).toBe(0);
      expect(calls).toBe(1);
      log("model-cancel", { calls, first: first.id, second: second.id });
    } finally {
      released.resolve();
      await page.unroute("**/api/extensions/piratetalk/v1/**");
    }
  },
};
