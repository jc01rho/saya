import assert from "node:assert/strict";
import { CONTRACT_VERSION } from "../../src/contract/tsuba/version";
import { bounded } from "../harness/barriers";
import type { Scenario } from "../harness/runner";

/** Invented raster picture, no account, session or external image service. */
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a2ioAAAAASUVORK5CYII=",
  "base64",
);

export const scenario: Scenario = {
  id: "adapter-avatars",
  async run({ context, url, log, evidence }) {
    const cases = [
      { id: "desktop", width: 1440, avatars: true, files: true },
      { id: "mobile", width: 390, avatars: true, files: true },
      { id: "undeclared", width: 390, avatars: false, files: true },
      { id: "no-media", width: 390, avatars: true, files: false },
      {
        id: "room-no-avatars",
        width: 390,
        avatars: true,
        files: true,
        room: "avatars.read",
      },
      {
        id: "room-no-media",
        width: 390,
        avatars: true,
        files: true,
        room: "attachments.read",
      },
    ];
    for (const fixture of cases) {
      const page = await context.newPage();
      await page.setViewportSize({ width: fixture.width, height: 900 });
      const media: string[] = [];
      await page.route("**/adapters{,/**}", async (route) => {
        const request = new URL(route.request().url());
        const json = (body: unknown) => route.fulfill({ json: body });
        if (request.pathname === "/adapters")
          return json({ adapters: [{ id: "synthetic" }] });
        if (request.pathname.endsWith("/capabilities"))
          return json({
            ok: true,
            contract: { version: CONTRACT_VERSION },
            adapter: { name: "synthetic", version: "0.0.0" },
            provider: { id: "invented", name: "Synthetic messenger" },
            account: { kind: "user" },
            revision: "0123456789abcdef",
            features: {
              "rooms.list": {},
              "messages.read": { paging: "none", maxLimit: 50 },
              ...(fixture.avatars ? { "avatars.read": {} } : {}),
              ...(fixture.files ? { "attachments.read": {} } : {}),
            },
          });
        if (request.pathname.endsWith("/stream"))
          return route.fulfill({
            status: 503,
            json: {
              ok: false,
              error: { code: "BUSY", message: "Synthetic stream unavailable" },
            },
          });
        if (request.pathname.endsWith("/rooms"))
          return json({
            ok: true,
            complete: true,
            rooms: [
              {
                id: "room",
                title: "Synthetic avatar room",
                kind: "group",
                unread: 0,
                ...(fixture.room
                  ? { features: { [fixture.room]: false } }
                  : {}),
              },
            ],
          });
        if (request.pathname.endsWith("/messages"))
          return json({
            ok: true,
            hasEarlier: false,
            messages: ["good:a&b=c#d", "broken", undefined].map(
              (senderAvatar, index) => ({
                id: String(index),
                roomId: "room",
                senderId: `synthetic-${index}`,
                sender: `Synthetic sender ${index}`,
                senderAvatar,
                kind: "text",
                text: `Synthetic message ${index}`,
                sentAt: "2037-04-07T09:00:00Z",
                fromMe: false,
              }),
            ),
          });
        if (request.pathname.endsWith("/media")) {
          const id = request.searchParams.get("id") ?? "";
          media.push(id);
          return id === "good:a&b=c#d"
            ? route.fulfill({ contentType: "image/png", body: PNG })
            : route.fulfill({
                status: 404,
                json: {
                  ok: false,
                  error: {
                    code: "NOT_FOUND",
                    message: "Synthetic missing picture",
                  },
                },
              });
        }
        throw new Error(
          `Unexpected synthetic adapter route: ${request.pathname}`,
        );
      });
      // Subscribe before navigation; resolve on the exact rendered state, not elapsed time.
      await page.addInitScript(() => {
        Reflect.set(
          window,
          "avatarReady",
          new Promise<void>((resolve) => {
            const observer = new MutationObserver(() => {
              if (
                document.querySelectorAll('[data-ui="adapter-turn"]').length !==
                3
              )
                return;
              observer.disconnect();
              resolve();
            });
            observer.observe(document, { subtree: true, childList: true });
          }),
        );
      });
      await page.goto(`${url}/#/adapters/synthetic/room`, {
        waitUntil: "load",
      });
      await bounded(
        page.evaluate(
          () => Reflect.get(window, "avatarReady") as Promise<void>,
        ),
        "synthetic adapter messages",
        10_000,
      );
      const enabled = fixture.avatars && fixture.files && !fixture.room;
      if (enabled) {
        await bounded(
          page.evaluate(async () => {
            await Promise.all(
              [
                ...document.querySelectorAll<HTMLImageElement>(
                  '[data-ui="adapter-turn"] img',
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
          "synthetic avatar loads",
          10_000,
        );
        assert.equal(
          await page.locator('[data-message-id="0"] img').count(),
          1,
        );
        assert.equal(
          await page
            .locator('[data-message-id="0"] img')
            .evaluate((image) => (image as HTMLImageElement).naturalWidth),
          1,
        );
        assert.equal(
          await page
            .locator('[data-message-id="1"] [data-ui="avatar"]')
            .textContent(),
          "S",
        );
        assert.equal(
          await page.locator('[data-message-id="1"] img').count(),
          0,
        );
        assert.equal(
          await page
            .locator('[data-message-id="2"] [data-ui="avatar"]')
            .count(),
          0,
        );
        assert.deepEqual(media.sort(), ["broken", "good:a&b=c#d"]);
      } else {
        assert.equal(
          await page.locator('[data-ui="adapter-turn"] img').count(),
          0,
        );
        assert.deepEqual(media, []);
      }
      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth,
      );
      assert.equal(overflow, false);
      await page.screenshot({
        path: `${evidence}/${fixture.id}.png`,
        fullPage: true,
      });
      log("avatar-case", { fixture: fixture.id, enabled, media, overflow });
      await page.close();
    }
  },
};
