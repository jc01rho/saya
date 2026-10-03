import { expect } from "bun:test";
import { domBarrier } from "../harness/browser-barriers";
import type { Scenario } from "../harness/runner";

const features = Object.fromEntries(
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
  ].map((name) => [name, { available: false, reason: "not_implemented" }]),
);
const capabilities = {
  version: "1.0.0",
  features,
  models: [],
  uploadPolicy: { maxBytes: null, maxFiles: 1, kinds: [] },
};

export const scenario: Scenario = {
  id: "piratetalk-capabilities",
  async run({ page, bridge, url, screenshot, log }) {
    const room = bridge.data.rooms.find((room) => room.readable);
    if (!room) throw new Error("Missing readable fixture room");
    for (const viewport of [
      { width: 1440, height: 900 },
      { width: 390, height: 844 },
    ]) {
      await page.setViewportSize(viewport);
      for (const mode of [
        "available",
        "unsupported",
        "unauthorized",
        "incompatible",
        "malformed",
      ] as const) {
        await page.goto("about:blank");
        let probes = 0;
        let writes = 0;
        let streams = 0;
        const requests = (request: import("playwright-core").Request) => {
          if (new URL(request.url()).pathname === "/api/stream") streams++;
        };
        page.on("request", requests);
        await page.route(
          "**/api/extensions/piratetalk/v1/**",
          async (route) => {
            if (route.request().method() !== "GET") writes++;
            probes++;
            await route.fulfill({
              status:
                mode === "unsupported"
                  ? 404
                  : mode === "unauthorized"
                    ? 401
                    : 200,
              contentType: "application/json",
              body: JSON.stringify(
                mode === "incompatible"
                  ? { ...capabilities, version: "2.0.0" }
                  : mode === "malformed"
                    ? {}
                    : capabilities,
              ),
            });
          },
        );
        const streamOpened = page.waitForResponse(
          (response) => new URL(response.url()).pathname === "/api/stream",
        );
        await page.goto(`${url}/#/room/${room.id}`);
        await streamOpened;
        await page.locator('[data-ui="composer-input"]').waitFor();
        if (mode !== "unsupported")
          await page
            .locator(`[data-ui="piratetalk-status"][data-state="${mode}"]`)
            .waitFor();
        else {
          await page.waitForLoadState("load");
          expect(
            await page.locator('[data-ui="piratetalk-status"]').count(),
          ).toBe(0);
        }
        expect(probes).toBe(1);
        expect(streams).toBe(1);
        expect(writes).toBe(0);
        await screenshot(`${viewport.width}-${mode}`);
        log("capability-matrix", {
          mode,
          viewport,
          probes,
          streams,
          writes,
          roomId: room.id,
        });
        if (mode === "available") {
          let accepted = 0;
          await page.route("**/api/send", async (route) => {
            const body = route.request().postDataJSON();
            if (body.dryRun) await route.continue();
            else {
              accepted++;
              await route.abort("connectionreset");
            }
          });
          await page
            .locator('[data-ui="composer-input"]')
            .fill("Synthetic uncertain task2 message");
          const uncertain = await domBarrier(
            page,
            '[data-ui="composer-pending"][data-state="uncertain"]',
          );
          await page.locator('[data-ui="composer-send"]').click();
          await page.locator('[data-ui="composer-confirm"]').click();
          await uncertain.wait();
          expect(
            await page.locator('[data-ui="composer-input"]').inputValue(),
          ).toBe("Synthetic uncertain task2 message");
          const reconnected = await domBarrier(
            page,
            '[data-ui="piratetalk-status"][data-state="checking"]',
          );
          await page.locator('[data-ui="piratetalk-reconnect"]').click();
          await reconnected.wait();
          await page
            .locator('[data-ui="piratetalk-status"][data-state="available"]')
            .waitFor();
          expect(accepted).toBe(1);
          expect(probes).toBe(2);
          await page.evaluate(() => {
            location.hash = "#/all";
          });
          await page
            .locator('[data-ui="composer-input"]')
            .waitFor({ state: "detached" });
          await page.evaluate((id) => {
            location.hash = `#/room/${id}`;
          }, room.id);
          await page
            .locator('[data-ui="composer-pending"][data-state="uncertain"]')
            .waitFor();
          expect(accepted).toBe(1);
          expect(probes).toBe(2);
          expect(
            await page.locator('[data-ui="composer-send"]').isDisabled(),
          ).toBe(true);
          await screenshot(`${viewport.width}-uncertain-no-replay`);
          log("uncertain-no-replay", { accepted, probes, retainedInput: true });
          await page.unroute("**/api/send");
        }
        page.off("request", requests);
        await page.unroute("**/api/extensions/piratetalk/v1/**");
      }
    }
  },
};
