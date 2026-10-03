import { expect } from "bun:test";
import { readFile } from "node:fs/promises";
import { bounded, deferred } from "../harness/barriers";
import type { Scenario } from "../harness/runner";

export const scenario: Scenario = {
  id: "piratetalk-media",
  async run({ page, url, core, screenshot, log }) {
    if (core !== "rust")
      throw new Error("Media acceptance requires disposable Rust fixture");
    const mp4 = Buffer.from(
      await readFile(
        new URL("../fixtures/media/synthetic.mp4.base64", import.meta.url),
        "utf8",
      ),
      "base64",
    );
    for (const viewport of [
      { width: 1440, height: 900 },
      { width: 390, height: 844 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto("about:blank");
      await page.goto(`${url}/#/room/1003`);
      await page
        .getByRole("button", { name: "파일 첨부", exact: true })
        .click();
      const stagedForCancel = page.waitForResponse(
        (response) =>
          response.request().method() === "POST" &&
          new URL(response.url()).pathname.endsWith(
            "/extensions/piratetalk/v1/uploads",
          ),
      );
      await page.locator('[data-ui="piratetalk-file-input"]').setInputFiles({
        name: "cancel-me.txt",
        mimeType: "text/plain",
        buffer: Buffer.from("Synthetic cancelled upload"),
      });
      const stagedResponse = await stagedForCancel;
      expect(stagedResponse.ok()).toBe(true);
      const cancelledUpload = await stagedResponse.json();
      await page
        .locator('[data-ui="piratetalk-media-send"]:not([disabled])')
        .waitFor();
      const cancelled = page.waitForResponse((response) => {
        const request = response.request();
        return (
          request.method() === "DELETE" &&
          new URL(response.url()).pathname.endsWith(
            "/extensions/piratetalk/v1/uploads",
          ) &&
          request.postDataJSON().uploadId === cancelledUpload.uploadId
        );
      });
      await page
        .getByRole("button", { name: "첨부 취소", exact: true })
        .click();
      expect((await cancelled).status()).toBe(204);
      await page
        .locator('[data-ui="piratetalk-media-send"][disabled]')
        .waitFor();
      log("upload-cancelled", { roomId: "1003" });
      for (const fixture of [
        {
          name: `synthetic-${viewport.width}.png`,
          mimeType: "image/png",
          buffer: Buffer.from(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
            "base64",
          ),
        },
        {
          name: `synthetic-${viewport.width}.mp4`,
          mimeType: "video/mp4",
          buffer: mp4,
        },
        {
          name: `synthetic-${viewport.width}.txt`,
          mimeType: "text/plain",
          buffer: Buffer.from("Synthetic acceptance attachment"),
        },
      ]) {
        const storedId = deferred<string>();
        const cdn = "https://fixture.kakaocdn.net/*";
        await page.route(cdn, async (route) => {
          if (new URL(route.request().url()).pathname !== `/${fixture.name}`) {
            await route.fallback();
            return;
          }
          const id = await bounded(storedId.promise, "stored media ID");
          const response = await page.request.get(
            `${url}/api/__fixture/media/1003/${id}`,
          );
          expect(response.status()).toBe(200);
          const bytes = await response.body();
          expect(bytes).toEqual(fixture.buffer);
          log("stored-media-resource", {
            messageId: id,
            name: fixture.name,
            bytes: bytes.length,
          });
          await route.fulfill({ response });
        });
        const uploaded = page.waitForResponse(
          (response) =>
            response.request().method() === "POST" &&
            new URL(response.url()).pathname.endsWith("/uploads"),
        );
        await page
          .locator('[data-ui="piratetalk-file-input"]')
          .setInputFiles(fixture);
        const uploadResponse = await uploaded;
        expect(uploadResponse.ok()).toBe(true);
        const body = await uploadResponse.json();
        expect(body.roomId).toBe("1003");
        expect(body.uploadId).toMatch(/^[A-Za-z0-9_-]{16,128}$/u);
        const sent = page.waitForRequest(
          (request) =>
            request.method() === "POST" &&
            new URL(request.url()).pathname.endsWith(
              "/extensions/piratetalk/v1/send",
            ),
        );
        const completed = page.waitForResponse((response) => {
          const request = response.request();
          return (
            request.method() === "POST" &&
            new URL(response.url()).pathname.endsWith(
              "/extensions/piratetalk/v1/send",
            ) &&
            request.postDataJSON().uploadId === body.uploadId
          );
        });
        await page.locator('[data-ui="piratetalk-media-send"]').click();
        expect((await sent).postDataJSON()).toEqual({
          roomId: "1003",
          kind: "media",
          uploadId: body.uploadId,
        });
        const completion = await completed;
        expect(completion.ok()).toBe(true);
        const receipt = await completion.json();
        expect(receipt.outcome).toBe("confirmed");
        expect(typeof receipt.messageId).toBe("string");
        storedId.resolve(receipt.messageId);
        await page
          .locator('[data-ui="composer-pending"][data-state="confirmed"]')
          .waitFor();
        const message = page.locator(
          `[data-ui="thread-wall"] [data-message-id="${receipt.messageId}"]`,
        );
        await message.waitFor();
        await message.scrollIntoViewIfNeeded();
        const storedResponse = await page.request.get(
          `${url}/api/__fixture/stored/1003/${receipt.messageId}`,
        );
        expect(storedResponse.status()).toBe(200);
        expect(await storedResponse.json()).toMatchObject({
          type: body.kind === "photo" ? 2 : body.kind === "video" ? 3 : 18,
          attachment: { name: fixture.name, size: fixture.buffer.length },
        });
        if (body.kind === "photo") {
          const dimensions = await bounded(
            message
              .locator('[data-ui="photo"] img')
              .evaluate(async (element) => {
                if (!(element instanceof HTMLImageElement))
                  throw new Error("Missing stored PNG");
                await element.decode();
                return [element.naturalWidth, element.naturalHeight];
              }),
            "stored PNG decode",
          );
          expect(dimensions).toEqual([1, 1]);
          log("stored-png-decoded", {
            messageId: receipt.messageId,
            dimensions,
          });
        } else if (body.kind === "video") {
          await message.locator('[data-ui="video"]').click();
          const metadata = await page
            .locator('[data-ui="video-lightbox"] video')
            .evaluate(async (element) => {
              if (!(element instanceof HTMLVideoElement))
                throw new Error("Missing stored MP4");
              await new Promise<void>((resolve, reject) => {
                const timer = setTimeout(
                  () => finish(new Error("MP4 readiness timeout")),
                  10_000,
                );
                const ready = () => {
                  if (element.readyState >= 3) finish();
                };
                const failed = () =>
                  finish(new Error(`MP4 decode error ${element.error?.code}`));
                function finish(error?: Error) {
                  clearTimeout(timer);
                  element.removeEventListener("canplay", ready);
                  element.removeEventListener("error", failed);
                  if (error) reject(error);
                  else resolve();
                }
                element.addEventListener("canplay", ready);
                element.addEventListener("error", failed);
                if (element.error) failed();
                else ready();
              });
              element.pause();
              return {
                width: element.videoWidth,
                height: element.videoHeight,
                duration: element.duration,
                readyState: element.readyState,
              };
            });
          expect(metadata.width).toBe(32);
          expect(metadata.height).toBe(24);
          expect(metadata.duration).toBeCloseTo(1, 1);
          expect(metadata.readyState).toBeGreaterThanOrEqual(3);
          await screenshot(`stored-mp4-ready-${viewport.width}`);
          log("stored-mp4-ready", {
            messageId: receipt.messageId,
            ...metadata,
          });
          await page.keyboard.press("Escape");
        } else {
          const download = page.waitForEvent("download");
          const response = page.waitForResponse((response) => {
            const address = new URL(response.url());
            return (
              address.pathname === "/api/file" &&
              address.searchParams.get("messageId") === receipt.messageId
            );
          });
          await message.locator('[data-ui="file-download"] button').click();
          const fileResponse = await response;
          expect(fileResponse.status()).toBe(200);
          expect(fileResponse.headers()["x-kanao-source"]).toBe("local");
          const resourceResponse = await page.request.get(fileResponse.url());
          expect(resourceResponse.status()).toBe(200);
          expect(await resourceResponse.body()).toEqual(fixture.buffer);
          const saved = await download;
          expect(saved.suggestedFilename()).toBe(fixture.name);
          const path = await saved.path();
          if (!path) throw new Error("TXT download has no saved path");
          expect(await readFile(path)).toEqual(fixture.buffer);
          log("stored-txt-downloaded", {
            messageId: receipt.messageId,
            bytes: fixture.buffer.length,
          });
        }
        await screenshot(`stored-${body.kind}-${viewport.width}`);
        log("media", {
          roomId: "1003",
          kind: body.kind,
          messageId: receipt.messageId,
        });
      }
      const firstCatalog = page.waitForResponse((response) => {
        const address = new URL(response.url());
        return (
          address.pathname.endsWith("/extensions/piratetalk/v1/stickers") &&
          !address.searchParams.has("cursor")
        );
      });
      await page
        .getByRole("button", { name: "정품 이모티콘", exact: true })
        .click();
      const firstCatalogResponse = await firstCatalog;
      expect(firstCatalogResponse.status()).toBe(200);
      const firstPage = await firstCatalogResponse.json();
      expect(firstPage.items.length).toBe(50);
      expect(firstPage.nextCursor).toMatch(/^[A-Za-z0-9_-]+$/u);
      const nextCatalog = page.waitForResponse((response) => {
        const address = new URL(response.url());
        return (
          address.pathname.endsWith("/extensions/piratetalk/v1/stickers") &&
          address.searchParams.get("cursor") === firstPage.nextCursor
        );
      });
      await page
        .getByRole("button", { name: "이모티콘 더 보기", exact: true })
        .click();
      const nextCatalogResponse = await nextCatalog;
      expect(nextCatalogResponse.status()).toBe(200);
      const nextPage = await nextCatalogResponse.json();
      expect(nextPage.items.length).toBe(11);
      expect(nextPage.nextCursor).toBeNull();
      await page
        .locator('[data-ui="piratetalk-stickers"] li')
        .nth(60)
        .waitFor();
      const resourceUrls = await page
        .locator('[data-ui="piratetalk-stickers"] li img')
        .evaluateAll((images) =>
          images.map((image) => image.getAttribute("src")),
        );
      expect(resourceUrls.length).toBe(61);
      expect(new Set(resourceUrls).size).toBe(61);
      log("sticker-catalog-pages", {
        viewport,
        firstCount: 50,
        nextCount: 11,
        uniqueResources: 61,
      });
      const stickerItem = page
        .locator('[data-ui="piratetalk-stickers"] button')
        .filter({
          has: page.locator('img[src$="itemId=7%3A2"], img[src$="itemId=7:2"]'),
        });
      await stickerItem.click();
      const sticker = page.waitForRequest(
        (request) =>
          request.method() === "POST" &&
          new URL(request.url()).pathname.endsWith(
            "/extensions/piratetalk/v1/send",
          ),
      );
      const stickerCompleted = page.waitForResponse((response) => {
        const request = response.request();
        return (
          request.method() === "POST" &&
          new URL(response.url()).pathname.endsWith(
            "/extensions/piratetalk/v1/send",
          ) &&
          request.postDataJSON().kind === "sticker"
        );
      });
      await page.locator('[data-ui="piratetalk-sticker-send"]').click();
      expect((await sticker).postDataJSON()).toEqual({
        roomId: "1003",
        kind: "sticker",
        itemId: "7:2",
      });
      const stickerCompletion = await stickerCompleted;
      expect(stickerCompletion.ok()).toBe(true);
      const stickerReceipt = await stickerCompletion.json();
      expect(stickerReceipt.outcome).toBe("confirmed");
      expect(typeof stickerReceipt.messageId).toBe("string");
      const storedSticker = await page.request.get(
        `${url}/api/__fixture/stored/1003/${stickerReceipt.messageId}`,
      );
      expect(storedSticker.status()).toBe(200);
      expect(await storedSticker.json()).toMatchObject({
        type: 20,
        attachment: { path: "7.emot_002.webp" },
      });
      const resourcePath = `/api/extensions/piratetalk/v1/stored-sticker-resource?roomId=1003&messageId=${stickerReceipt.messageId}`;
      const resource = await page.request.get(`${url}${resourcePath}`);
      expect(resource.status()).toBe(200);
      expect(resource.headers()["content-type"]).toContain("image/webp");
      const storedResource = await page.request.get(
        `${url}/api/__fixture/media/1003/${stickerReceipt.messageId}`,
      );
      expect(storedResource.status()).toBe(200);
      expect(await resource.body()).toEqual(await storedResource.body());
      const storedMessage = page.locator(
        `[data-ui="thread-wall"] [data-message-id="${stickerReceipt.messageId}"]`,
      );
      await storedMessage.waitFor();
      await storedMessage.scrollIntoViewIfNeeded();
      const storedImage = storedMessage.locator(
        'img[data-ui="stored-sticker"]',
      );
      await storedImage.waitFor();
      expect(await storedImage.getAttribute("src")).toBe(resourcePath);
      const stickerDimensions = await bounded(
        storedImage.evaluate(async (element) => {
          if (!(element instanceof HTMLImageElement))
            throw new Error("Missing stored message sticker image");
          await element.decode();
          return [element.naturalWidth, element.naturalHeight];
        }),
        "stored sticker resource decode",
      );
      expect(stickerDimensions).toEqual([1, 1]);
      log("stored-type20-resource", {
        messageId: stickerReceipt.messageId,
        path: "7.emot_002.webp",
        dimensions: stickerDimensions,
        bytes: (await resource.body()).length,
      });
      for (const query of [
        `roomId=1001&messageId=${stickerReceipt.messageId}`,
        "roomId=1003&messageId=01",
        `roomId=1003&messageId=${stickerReceipt.messageId}&url=https://example.com/image.webp`,
      ]) {
        const refused = await page.request.get(
          `${url}/api/extensions/piratetalk/v1/stored-sticker-resource?${query}`,
        );
        expect([400, 404]).toContain(refused.status());
      }
      log("stored-type20-thread-decoded", {
        messageId: stickerReceipt.messageId,
        viewport,
        dimensions: stickerDimensions,
      });
      await page
        .locator('[data-ui="composer-pending"][data-state="confirmed"]')
        .waitFor();
      await screenshot(`media-and-native-sticker-${viewport.width}`);
      log("sticker", { roomId: "1003", sticker: "7:2", viewport });
    }
    await page.goto("about:blank");
    await page.unroute("https://fixture.kakaocdn.net/*");
  },
};
