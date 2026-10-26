import assert from "node:assert/strict";
import { CONTRACT_VERSION } from "../../src/contract/tsuba/version";
import { domBarrier } from "../harness/browser-barriers";
import type { Scenario } from "../harness/runner";

const TEXT = "가상 한글 메시지";

/** Synthetic PirateTalk data; no real account or conversation is used. */
export const scenario: Scenario = {
  id: "composer-ime-send",
  async run({ context, url, evidence, log }) {
    for (const width of [1440, 390]) {
      const page = await context.newPage();
      await page.setViewportSize({ width, height: 900 });
      const sent: string[] = [];
      // Record attempts synchronously, so proving no send needs no delay.
      // Delegate every request to the real fetch implementation and route fixture.
      await page.addInitScript(() => {
        const fetch = window.fetch.bind(window);
        const attempts: string[] = [];
        Reflect.set(window, "imeSendAttempts", attempts);
        window.fetch = Object.assign(
          (...args: Parameters<typeof window.fetch>) => {
            if (String(args[0]).endsWith("/adapters/piratetalk/send"))
              attempts.push(String(args[1]?.body));
            return fetch(...args);
          },
          window.fetch,
        );
      });
      await page.route("**/adapters{,/**}", (route) => {
        const pathname = new URL(route.request().url()).pathname;
        if (pathname === "/adapters")
          return route.fulfill({
            json: { adapters: [{ id: "piratetalk" }] },
          });
        if (pathname.endsWith("/capabilities"))
          return route.fulfill({
            json: {
              ok: true,
              contract: { version: CONTRACT_VERSION },
              adapter: { name: "synthetic-piratetalk", version: "0.0.0" },
              provider: { id: "piratetalk", name: "해적톡 (가상)" },
              account: { kind: "user" },
              revision: "0123456789abcdef",
              features: {
                "rooms.list": {},
                "messages.read": { paging: "none", maxLimit: 50 },
                "messages.send": { maxLength: 4096, receipt: "stored" },
              },
            },
          });
        if (pathname.endsWith("/rooms"))
          return route.fulfill({
            json: {
              ok: true,
              complete: true,
              rooms: [
                {
                  id: "room",
                  title: "가상 한글 입력 방",
                  kind: "group",
                  unread: 0,
                },
              ],
            },
          });
        if (pathname.endsWith("/messages"))
          return route.fulfill({
            json: { ok: true, messages: [], hasEarlier: false },
          });
        if (pathname.endsWith("/stream"))
          return route.fulfill({
            status: 503,
            json: {
              ok: false,
              error: { code: "BUSY", message: "Synthetic stream unavailable" },
            },
          });
        if (pathname.endsWith("/send")) {
          const body = route.request().postDataJSON() as { text: string };
          sent.push(body.text);
          return route.fulfill({
            json: {
              ok: true,
              message: {
                id: `sent-${sent.length}`,
                roomId: "room",
                senderId: "synthetic",
                sender: "가상 참여자",
                fromMe: true,
                sentAt: "2037-04-07T09:00:00Z",
                kind: "text",
                text: body.text,
              },
            },
          });
        }
        throw new Error(`Unexpected synthetic route ${pathname}`);
      });
      await page.goto(`${url}/#/adapters/piratetalk/room`);
      const input = page.locator('[data-ui="adapter-composer"] textarea');
      await input.fill("가상 한글 메시ㅈ");
      await input.dispatchEvent("compositionstart", { data: "ㅈ" });
      const enter = (isComposing: boolean, keyCode: number) =>
        input.evaluate(
          (element, key) => {
            element.dispatchEvent(
              new KeyboardEvent("keydown", {
                key: "Enter",
                code: "Enter",
                bubbles: true,
                cancelable: true,
                ...key,
              }),
            );
            return (Reflect.get(window, "imeSendAttempts") as string[]).length;
          },
          { isComposing, keyCode },
        );
      assert.equal(
        await enter(false, 13),
        0,
        "compositionstart must block Enter even when the key lacks IME flags",
      );
      // The final syllable arrives after the committing Enter, before a send.
      await input.fill(TEXT);
      await input.dispatchEvent("compositionend", { data: "지" });
      assert.equal(
        await enter(false, 229),
        0,
        "the IME's late keyCode 229 must not send after compositionend",
      );
      assert.equal(
        await enter(true, 13),
        0,
        "native isComposing must block Enter independently of keyCode",
      );
      assert.equal(await input.inputValue(), TEXT);
      await input.press("Shift+Enter");
      assert.equal(await input.inputValue(), `${TEXT}\n`);
      assert.deepEqual(sent, []);
      await input.fill(TEXT);
      const stored = await domBarrier(
        page,
        '[data-ui="adapter-turn"][data-message-id="sent-1"]',
      );
      await input.press("Enter");
      await stored.wait();
      assert.deepEqual(sent, [TEXT]);
      assert.equal(await input.inputValue(), "", "a sent draft must clear");
      await page.screenshot({ path: `${evidence}/ime-cleared-${width}.png` });

      // Explicit button sends still work after a new composition commits.
      await input.dispatchEvent("compositionstart", { data: "ㄷ" });
      await input.fill("가상 두 번째");
      await input.dispatchEvent("compositionend", { data: "째" });
      const second = await domBarrier(
        page,
        '[data-ui="adapter-turn"][data-message-id="sent-2"]',
      );
      await page.locator('[data-ui="adapter-send"]').click();
      await second.wait();
      assert.deepEqual(sent, [TEXT, "가상 두 번째"]);
      assert.equal(await input.inputValue(), "");
      log("ime-enter-does-not-send-and-committed-draft-clears", { width });
      await page.close();
    }
  },
};
