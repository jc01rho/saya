import assert from "node:assert/strict";
import { CONTRACT_VERSION } from "../../src/contract/tsuba/version";
import { bounded } from "../harness/barriers";
import type { Scenario } from "../harness/runner";

const SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#4869ac"/><path d="m8 16 6 6 10-12" fill="none" stroke="white" stroke-width="4"/></svg>';
const providers = [
  { id: "vector", name: "Vector", icon: "svg:a&b=#" },
  { id: "raster", name: "Raster", icon: "png-1" },
  { id: "broken", name: "Broken", icon: "missing-1" },
  { id: "discord-user", name: "Discord" },
  { id: "incompatible", name: "Outside", icon: "not-allowed" },
];

export const scenario: Scenario = {
  id: "provider-icons",
  async run({ context, url, evidence, log }) {
    for (const width of [1440, 390]) {
      const page = await context.newPage();
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      const png = Buffer.from(
        await page.evaluate(() => {
          const canvas = document.createElement("canvas");
          canvas.width = canvas.height = 32;
          const paint = canvas.getContext("2d");
          if (!paint) throw new Error("No synthetic canvas");
          paint.fillStyle = "#23876c";
          paint.fillRect(0, 0, 32, 32);
          paint.fillStyle = "white";
          paint.fillRect(6, 13, 20, 6);
          paint.fillRect(13, 6, 6, 20);
          return canvas.toDataURL("image/png").split(",")[1] ?? "";
        }),
        "base64",
      );
      const requests: string[] = [];
      await page.route("**/adapters{,/**}", async (route) => {
        const request = new URL(route.request().url());
        const path = request.pathname;
        if (path === "/adapters")
          return route.fulfill({
            json: { adapters: providers.map(({ id }) => ({ id })) },
          });
        const provider = providers.find(({ id }) =>
          path.startsWith(`/adapters/${id}/`),
        );
        assert.ok(provider, `Unexpected synthetic provider: ${path}`);
        if (path.endsWith("/capabilities"))
          return route.fulfill({
            json: {
              ok: true,
              contract: {
                version:
                  provider.id === "incompatible" ? "0.3.0" : CONTRACT_VERSION,
              },
              adapter: { name: "synthetic", version: "0.0.0" },
              provider: {
                id: provider.id,
                name: provider.name,
                ...(provider.icon ? { icon: provider.icon } : {}),
              },
              account: { kind: "user" },
              revision: "0123456789abcdef",
              features: { "rooms.list": {} },
            },
          });
        if (path.endsWith("/rooms"))
          return route.fulfill({
            json: {
              ok: true,
              complete: true,
              rooms: [
                {
                  id: "room",
                  title: `Synthetic ${provider.name} room`,
                  lastActivityAt: "2038-04-07T09:00:00Z",
                  kind: "group",
                  unread: 0,
                },
              ],
            },
          });
        if (path.endsWith("/stream"))
          return route.fulfill({
            status: 503,
            json: {
              ok: false,
              error: { code: "BUSY", message: "Synthetic stream unavailable" },
            },
          });
        if (path.endsWith("/icon")) {
          requests.push(provider.id);
          assert.equal(request.searchParams.get("v"), provider.icon);
          if (provider.id === "vector")
            return route.fulfill({ contentType: "image/svg+xml", body: SVG });
          if (provider.id === "raster")
            return route.fulfill({ contentType: "image/png", body: png });
          return route.fulfill({
            status: 404,
            json: {
              ok: false,
              error: { code: "NOT_FOUND", message: "Synthetic missing icon" },
            },
          });
        }
        throw new Error(`Unexpected synthetic route: ${path}`);
      });
      await page.goto(url, { waitUntil: "load" });
      const nav = page.locator(
        width === 390 ? '[data-ui="list-tabs"]' : '[data-ui="rail"]',
      );
      const inbox = page.locator('[data-ui="inbox"]');
      for (const provider of providers.filter(
        ({ id }) => id !== "incompatible",
      )) {
        await nav.locator(`a[href="#/list/${provider.id}"]`).waitFor();
        await inbox.locator(`[data-provider="${provider.id}"]`).waitFor();
      }
      // Await the exact image load/error signals; image fallback then commits as a DOM change.
      const imagesReady = async () =>
        bounded(
          page.evaluate(async () => {
            await Promise.all(
              [
                ...document.querySelectorAll<HTMLImageElement>(
                  'img[src*="/icon"], img[src="/kakao-talk.svg"]',
                ),
              ].map(
                (image) =>
                  new Promise<void>((resolve) => {
                    if (image.complete) return resolve();
                    image.addEventListener("load", () => resolve(), {
                      once: true,
                    });
                    image.addEventListener("error", () => resolve(), {
                      once: true,
                    });
                  }),
              ),
            );
          }),
          "provider artwork settled",
          10_000,
        );
      await imagesReady();
      for (const area of [nav, inbox]) {
        const vector = area.locator(
          area === nav ? 'a[href="#/list/vector"]' : '[data-provider="vector"]',
        );
        assert.equal(
          await vector
            .locator("img")
            .evaluate((img) => (img as HTMLImageElement).naturalWidth),
          32,
        );
        const raster = area.locator(
          area === nav ? 'a[href="#/list/raster"]' : '[data-provider="raster"]',
        );
        assert.equal(
          await raster
            .locator("img")
            .evaluate((img) => (img as HTMLImageElement).naturalWidth),
          32,
        );
        const broken = area.locator(
          area === nav ? 'a[href="#/list/broken"]' : '[data-provider="broken"]',
        );
        await broken.locator("img").waitFor({ state: "hidden" });
        assert.ok((await broken.textContent())?.includes("B"));
        const missing = area.locator(
          area === nav
            ? 'a[href="#/list/discord-user"]'
            : '[data-provider="discord-user"]',
        );
        assert.equal(await missing.locator("img").count(), 0);
        assert.ok((await missing.textContent())?.includes("D"));
        assert.ok(!(await missing.textContent())?.includes("Dp"));
      }
      assert.equal(
        await nav.locator('a[href="#/list/incompatible"]').count(),
        0,
      );
      assert.ok(
        !requests.includes("discord-user") &&
          !requests.includes("incompatible"),
      );
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
      );
      await page.screenshot({ path: `${evidence}/all-${width}.png` });
      await nav.locator('a[href="#/adapters"]').click();
      const cards = page.locator('[data-ui="adapter-card"]');
      for (const provider of providers.filter(
        ({ id }) => id !== "incompatible",
      )) {
        await cards
          .filter({
            has: page.getByRole("heading", {
              name: provider.name,
              exact: true,
            }),
          })
          .locator('[role="status"]')
          .waitFor();
      }
      await page
        .locator('[data-ui="adapter-card"][data-state="incompatible"]')
        .waitFor();
      await imagesReady();
      const brokenCard = cards.filter({
        has: page.getByRole("heading", { name: "Broken", exact: true }),
      });
      await brokenCard.locator("img").waitFor({ state: "hidden" });
      assert.equal(
        await cards
          .filter({
            has: page.getByRole("heading", { name: "Discord", exact: true }),
          })
          .locator("img")
          .count(),
        0,
      );
      assert.equal(await cards.locator('img[src*="/icon"]').count(), 2);
      assert.equal(await page.locator('[data-ui="kakao-card"] img').count(), 1);
      assert.ok(
        !requests.includes("discord-user") &&
          !requests.includes("incompatible"),
      );
      await page.screenshot({ path: `${evidence}/connections-${width}.png` });
      log("provider-icons-verified", { width, requests });
      await page.close();
    }
  },
};
