import assert from "node:assert/strict";
import { CONTRACT_VERSION } from "../../src/contract/tsuba/version";
import { bounded } from "../harness/barriers";
import type { Scenario } from "../harness/runner";

/**
 * An adapter room reads like a KakaoTalk wall: a day pill when the day
 * changes, one speaker in one minute is one run (picture and name once, the
 * time only on the run's last bubble). Invented people and words only.
 */
const MESSAGES = [
  ["a", "가상참여자-1", "2037-04-06T12:00:10Z", "첫 번째"],
  ["a", "가상참여자-1", "2037-04-06T12:00:40Z", "같은 분에 이어서"],
  ["a", "가상참여자-1", "2037-04-06T12:05:00Z", "다른 분"],
  ["b", "가상참여자-2", "2037-04-06T12:05:30Z", "다른 사람"],
  ["a", "가상참여자-1", "2037-04-07T12:00:00Z", "다음 날"],
  ["me", "나", "2037-04-07T12:01:00Z", "내 답장"],
] as const;

export const scenario: Scenario = {
  id: "adapter-turns",
  async run({ context, url, log, evidence }) {
    for (const width of [1440, 390]) {
      const page = await context.newPage();
      await page.setViewportSize({ width, height: 900 });
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
                title: "Synthetic run room",
                kind: "group",
                unread: 0,
              },
            ],
          });
        if (request.pathname.endsWith("/messages"))
          return json({
            ok: true,
            hasEarlier: false,
            messages: MESSAGES.map(([who, sender, sentAt, text], index) => ({
              id: String(index),
              roomId: "room",
              senderId: who,
              sender,
              kind: "text",
              text,
              sentAt,
              fromMe: who === "me",
            })),
          });
        throw new Error(
          `Unexpected synthetic adapter route: ${request.pathname}`,
        );
      });
      // Subscribe before navigation; resolve on the rendered state, not elapsed time.
      await page.addInitScript((count) => {
        Reflect.set(
          window,
          "turnsReady",
          new Promise<void>((resolve) => {
            const observer = new MutationObserver(() => {
              if (
                document.querySelectorAll('[data-ui="adapter-turn"]').length !==
                count
              )
                return;
              observer.disconnect();
              resolve();
            });
            observer.observe(document, { subtree: true, childList: true });
          }),
        );
      }, MESSAGES.length);
      await page.goto(`${url}/#/adapters/synthetic/room`, {
        waitUntil: "load",
      });
      await bounded(
        page.evaluate(() => Reflect.get(window, "turnsReady") as Promise<void>),
        "synthetic adapter turns",
        10_000,
      );
      const turn = (id: number) => page.locator(`[data-message-id="${id}"]`);
      const visibleTime = (id: number) =>
        turn(id).locator("time:not(.sr-only)").count();

      assert.equal(
        await page.locator('[data-ui="adapter-day"]').count(),
        2,
        "one day pill per day",
      );
      // 0 and 1: one run. The picture and name once, the time only on the last.
      assert.equal(await turn(0).locator('[data-ui="avatar"]').count(), 1);
      assert.equal(await turn(1).locator('[data-ui="avatar"]').count(), 0);
      assert.equal(await turn(1).getByText("가상참여자-1").count(), 0);
      assert.equal(await visibleTime(0), 0);
      assert.equal(await visibleTime(1), 1);
      assert.match(
        (await turn(1).locator("time:not(.sr-only)").textContent()) ?? "",
        /^\d{2}:\d{2}$/,
        "the stamp is the clock; the day pill carries the date",
      );
      // 2: the same speaker in another minute opens a new run.
      assert.equal(await turn(2).getByText("가상참여자-1").count(), 1);
      assert.equal(await visibleTime(2), 1);
      // 4: a new day starts a new run even for the same speaker.
      assert.equal(await turn(4).locator('[data-ui="avatar"]').count(), 1);
      // 5: mine has no picture.
      assert.equal(await turn(5).locator('[data-ui="avatar"]').count(), 0);

      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth,
      );
      assert.equal(overflow, false);
      await page.screenshot({
        path: `${evidence}/adapter-turns-${width}.png`,
        fullPage: true,
      });
      log("turns-case", { width, overflow });
      await page.close();
    }
  },
};
