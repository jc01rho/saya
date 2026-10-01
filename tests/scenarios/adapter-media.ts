import assert from "node:assert/strict";
import { CONTRACT_VERSION } from "../../src/contract/tsuba/version";
import type { AdapterMessage } from "../../src/transport/adapters";
import { bounded } from "../harness/barriers";
import type { Scenario } from "../harness/runner";

// All bytes and names are invented. The video is a one-second ffmpeg color source.
const image = (id: string) => ({
  id,
  kind: "image",
  mimeType: "image/png",
  width: 640,
  height: 480,
});
const base = (id: string): AdapterMessage => ({
  id,
  roomId: "room",
  senderId: "synthetic",
  sender: "Synthetic sender",
  fromMe: false,
  sentAt: "2037-04-07T09:00:00Z",
  kind: "media",
  text: "",
});
const messages: AdapterMessage[] = [
  {
    ...base("single"),
    text: "Synthetic single image",
    attachments: [image("single")],
  },
  {
    ...base("three"),
    text: "Synthetic three images",
    attachments: [image("a"), image("b"), image("c")],
  },
  ...Array.from({ length: 5 }, (_, i) => ({
    ...base(`album-${i}`),
    groupId: "synthetic-album",
    text: i === 2 ? "Synthetic five-image album" : "",
    attachments: [image(`album-${i}`)],
    reactions: [{ emoji: "A", count: 1, mine: false }],
  })),
  {
    ...base("video"),
    attachments: [
      {
        id: "video",
        kind: "video",
        mimeType: "video/webm",
        width: 320,
        height: 180,
        durationSeconds: 1,
      },
    ],
  },
  {
    ...base("animation"),
    attachments: [
      {
        id: "animation",
        kind: "animation",
        mimeType: "video/webm",
        width: 320,
        height: 180,
      },
    ],
  },
  {
    ...base("link"),
    kind: "text",
    text: "Synthetic preview https://example.com/first https://example.com/second",
  },
];

export const scenario: Scenario = {
  id: "adapter-media",
  async run({ context, url, evidence, log }) {
    const png = Buffer.from(
      await Bun.file(
        new URL("../fixtures/synthetic-media.png", import.meta.url),
      ).arrayBuffer(),
    );
    const video = await Bun.file(
      new URL("../fixtures/synthetic-media.webm", import.meta.url),
    ).arrayBuffer();
    for (const width of [1440, 390]) {
      const page = await context.newPage();
      await page.setViewportSize({ width, height: width === 1440 ? 900 : 844 });
      await page.route("**/unfurl?**", (route) =>
        route.fulfill({
          json: {
            title: "Synthetic link card",
            description: "Invented preview only",
            siteName: "Synthetic site",
          },
        }),
      );
      await page.route("**/adapters{,/**}", (route) => {
        const request = new URL(route.request().url());
        if (request.pathname === "/adapters")
          return route.fulfill({ json: { adapters: [{ id: "synthetic" }] } });
        if (request.pathname.endsWith("/capabilities"))
          return route.fulfill({
            json: {
              ok: true,
              contract: { version: CONTRACT_VERSION },
              adapter: { name: "synthetic", version: "0.0.0" },
              provider: { id: "invented", name: "Synthetic messenger" },
              account: { kind: "user" },
              revision: "0123456789abcdef",
              features: {
                "rooms.list": {},
                "messages.read": { paging: "none", maxLimit: 50 },
                "attachments.read": {},
                "messages.send": { maxLength: 4096, receipt: "stored" },
                "messages.reply": {},
                "reactions.read": {},
                "reactions.send": {},
              },
            },
          });
        if (request.pathname.endsWith("/rooms"))
          return route.fulfill({
            json: {
              ok: true,
              complete: true,
              rooms: [
                {
                  id: "room",
                  title: "Synthetic media room",
                  kind: "group",
                  unread: 0,
                },
              ],
            },
          });
        if (request.pathname.endsWith("/messages"))
          return route.fulfill({
            json: { ok: true, messages, hasEarlier: false },
          });
        if (request.pathname.endsWith("/stream"))
          return route.fulfill({
            status: 503,
            json: {
              ok: false,
              error: { code: "BUSY", message: "Synthetic unavailable stream" },
            },
          });
        if (request.pathname.endsWith("/media")) {
          const playable = ["video", "animation"].includes(
            request.searchParams.get("id") ?? "",
          );
          return route.fulfill({
            contentType: playable ? "video/webm" : "image/png",
            body: playable ? Buffer.from(video) : png,
          });
        }
        throw new Error(`Unexpected synthetic route ${request.pathname}`);
      });
      await page.addInitScript(() => {
        Reflect.set(
          window,
          "mediaReady",
          new Promise<void>((resolve) => {
            const observer = new MutationObserver(() => {
              if (
                document.querySelectorAll('[data-ui="adapter-turn"]').length ===
                  6 &&
                document.querySelector('[data-ui="link-card"]')
              ) {
                observer.disconnect();
                resolve();
              }
            });
            observer.observe(document, { subtree: true, childList: true });
          }),
        );
      });
      await page.goto(`${url}/#/adapters/synthetic/room`, {
        waitUntil: "load",
      });
      await bounded(
        page.evaluate(() => Reflect.get(window, "mediaReady") as Promise<void>),
        "synthetic media render",
        10_000,
      );
      const album = page.locator(
        '[data-ui="adapter-turn"][data-message-id="album-2"]',
      );
      assert.equal(await album.locator('[data-ui="photo"]').count(), 4);
      assert.match((await album.textContent()) ?? "", /\+1/);
      assert.equal(await page.locator('[data-ui="link-card"]').count(), 1);
      // A closed album reads as one post: its members' doors wait for the menu.
      assert.equal(
        await page.locator('[data-ui="adapter-member-more"]').count(),
        0,
      );
      await album.locator('[data-ui="adapter-more"]').first().click();
      assert.equal(
        await page.locator('[data-ui="adapter-member-more"]').count(),
        4,
      );
      await album.locator('[data-ui="adapter-more"]').first().click();
      await album.locator('[data-ui="photo"]').first().click();
      await page
        .locator('[data-ui="photo-lightbox"]')
        .waitFor({ state: "visible" });
      await page.keyboard.press("ArrowLeft");
      assert.equal(
        await page
          .locator('[data-ui="photo-lightbox"] img')
          .getAttribute("src"),
        "/adapters/synthetic/media?id=album-4",
      );
      await bounded(
        page
          .locator('[data-ui="photo-lightbox"] img')
          .evaluate((image) => (image as HTMLImageElement).decode()),
        "album image decoded",
        10_000,
      );
      await page.screenshot({
        path: `${evidence}/${width}-album-lightbox.png`,
      });
      await page.keyboard.press("Escape");
      const member = album.locator('[data-message-id="album-0"]');
      await album.locator('[data-ui="adapter-more"]').first().click();
      await member.locator('[data-ui="adapter-member-more"]').click();
      await member.locator('[data-ui="adapter-reply"]').click();
      assert.equal(
        await page
          .locator('[data-ui="adapter-composer"]')
          .getAttribute("data-mode"),
        "reply",
      );
      assert.match(
        (await page
          .locator('[data-ui="adapter-composer-mode"]')
          .textContent()) ?? "",
        /사진/,
      );
      await page.locator('[data-ui="adapter-composer-cancel"]').click();
      await page.locator('[data-ui="video"]').click();
      await page
        .locator('[data-ui="video-lightbox"]')
        .waitFor({ state: "visible" });
      await bounded(
        page.locator('[data-ui="video-lightbox"] video').evaluate(
          (element) =>
            new Promise<void>((resolve) => {
              const player = element as HTMLVideoElement;
              if (player.readyState >= 2) return resolve();
              player.addEventListener("loadeddata", () => resolve(), {
                once: true,
              });
            }),
        ),
        "synthetic video loaded",
        10_000,
      );
      await page.screenshot({
        path: `${evidence}/${width}-video-lightbox.png`,
      });
      await page.keyboard.press("Escape");
      for (const id of [
        "single",
        "three",
        "album-2",
        "video",
        "animation",
        "link",
      ]) {
        const turn = page.locator(
          `[data-ui="adapter-turn"][data-message-id="${id}"]`,
        );
        await turn.scrollIntoViewIfNeeded();
        await bounded(
          turn
            .locator("img")
            .evaluateAll((images) =>
              Promise.all(
                images.map((image) => (image as HTMLImageElement).decode()),
              ),
            ),
          "visible images decoded",
          10_000,
        );
        await page.screenshot({ path: `${evidence}/${width}-${id}.png` });
      }
      assert.equal(
        await page.evaluate(
          () =>
            document.documentElement.scrollWidth >
            document.documentElement.clientWidth,
        ),
        false,
      );
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page
        .locator('[data-ui="adapter-animation"]')
        .waitFor({ state: "detached" });
      log("adapter-media", {
        width,
        turns: 6,
        albumMembers: 5,
        reducedMotion: true,
      });
      await page.close();
    }
  },
};
