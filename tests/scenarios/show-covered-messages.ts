import { resolve } from "node:path";
import type { Page } from "playwright-core";
import type { components } from "../../src/contract/decoded";
import { COVERED_SETTING_KEY } from "../../src/features/covered/state";
import { deferred } from "../harness/barriers";
import { domBarrier } from "../harness/browser-barriers";
import type { Scenario } from "../harness/runner";

type Message = components["schemas"]["Message"];

function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}

function readResponse(page: Page, path: string, enabled: boolean) {
  return page.waitForResponse(
    (response) => {
      const url = new URL(response.url());
      return (
        url.pathname === `/api/${path}` &&
        url.searchParams.get("showCovered") === (enabled ? "true" : null) &&
        response.status() === 200
      );
    },
    { timeout: 10_000 },
  );
}

const row = (id: string) => `[data-ui="thread-wall"] [data-message-id="${id}"]`;
const shown = (id: string) => `${row(id)} [data-ui="covered"] + p`;
const hidden = (id: string) => `${row(id)} [data-ui="covered"]:only-child`;

export const scenario: Scenario = {
  id: "show-covered-messages",
  async run({ page, context, bridge, url, evidence, screenshot, log }) {
    const room = bridge.data.rooms[0];
    const source = room && bridge.data.messages.get(room.id)?.at(-1);
    assert(room && source, "Missing synthetic room");
    room.title = "해적톡 · 합성 테스트";
    const covered: Message = {
      id: source.id,
      roomId: room.id,
      senderId: source.senderId,
      sender: "합성 참여자",
      sentAt: source.sentAt,
      kind: "text",
      fromMe: false,
      covered: "safebot",
      text: "Synthetic PirateTalk covered body",
    };
    const messages = [covered];
    bridge.data.messages.set(room.id, messages);
    const requests: URL[] = [];
    context.on("request", (request) => {
      const address = new URL(request.url());
      if (address.pathname.startsWith("/api/")) requests.push(address);
    });

    const initialStream = bridge.events.expect(
      (event) => event.type === "stream-open",
      "default stream opened",
    );
    const defaultContext = readResponse(page, "context", false);
    await page.goto(`${url}/#/room/${room.id}`);
    await Promise.all([initialStream, defaultContext]);
    await page.locator(hidden(covered.id)).waitFor();
    assert(
      !(await page.locator("body").textContent())?.includes(covered.text),
      "Default OFF revealed covered text",
    );
    await screenshot("covered-off-desktop");

    async function checkDigest(enabled: boolean) {
      const response = readResponse(page, "digest", enabled);
      const ready = await domBarrier(
        page,
        '[data-ui="digest"] [data-ui="covered"]',
      );
      await page.locator('[data-ui="digest-open"]').click();
      await Promise.all([response, ready.wait()]);
      const body = await page.locator('[data-ui="digest"]').textContent();
      assert(
        body?.includes(covered.text) === enabled,
        "Digest did not follow preference",
      );
      await page.keyboard.press("Escape");
      await page.locator('[data-ui="digest"]').waitFor({ state: "detached" });
    }
    await checkDigest(false);

    // Another tab changes the setting while this room stays open.
    const settings = await context.newPage();
    await settings.goto(`${url}/#/settings/messages`);
    const toggle = settings.locator('[data-ui="covered-toggle"]');
    await toggle.waitFor();
    assert(!(await toggle.isChecked()), "New settings were not OFF");
    await settings.screenshot({
      path: resolve(evidence, "covered-settings-off-desktop.png"),
    });
    const enabledContext = readResponse(page, "context", true);
    const enabledStream = bridge.events.expect(
      (event) => event.type === "stream-open",
      "ON session stream opened",
    );
    const visible = await domBarrier(page, shown(covered.id));
    await toggle.check();
    await Promise.all([enabledContext, enabledStream, visible.wait()]);
    assert(
      (await page.locator(shown(covered.id)).textContent()) === covered.text,
      "Already-open context did not reveal text",
    );
    assert(
      (await page.locator(`${row(covered.id)} [data-ui="covered"]`).count()) ===
        1,
      "Revealed message lost the SafeBot marker",
    );
    await screenshot("covered-on-desktop");
    await settings.screenshot({
      path: resolve(evidence, "covered-settings-on-desktop.png"),
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await settings.setViewportSize({ width: 390, height: 844 });
    await screenshot("covered-on-mobile");
    await settings.screenshot({
      path: resolve(evidence, "covered-settings-on-mobile.png"),
    });
    await checkDigest(true);

    // Retain another room, then leave it. Background stream traffic must not
    // issue open=true and mark that room read in the desktop client.
    const background = bridge.data.rooms.find(
      (candidate) => candidate.id !== room.id && candidate.readable,
    );
    assert(background, "Missing readable background room");
    const backgroundRead = readResponse(page, "context", true);
    await page.evaluate((id) => {
      location.hash = `#/room/${id}`;
    }, background.id);
    await backgroundRead;
    const foregroundRead = readResponse(page, "context", true);
    const foregroundShown = await domBarrier(page, shown(covered.id));
    await page.evaluate((id) => {
      location.hash = `#/room/${id}`;
    }, room.id);
    await Promise.all([foregroundRead, foregroundShown.wait()]);
    const backgroundReads = requests.filter(
      (url) =>
        url.pathname === "/api/context" &&
        url.searchParams.get("roomId") === background.id,
    ).length;

    // No text travels over the stream. The existing room window refills it.
    const live: Message = {
      ...covered,
      id: (BigInt(covered.id) + 1n).toString(),
      text: "Synthetic PirateTalk live covered body",
    };
    messages.push(live);
    const liveContext = readResponse(page, "context", true);
    const liveShown = await domBarrier(page, shown(live.id));
    bridge.emit("message", {
      ok: true,
      message: { ...live, roomId: background.id, text: "" },
    });
    bridge.emit("message", { ok: true, message: { ...live, text: "" } });
    await Promise.all([liveContext, liveShown.wait()]);
    assert(
      requests.filter(
        (url) =>
          url.pathname === "/api/context" &&
          url.searchParams.get("roomId") === background.id,
      ).length === backgroundReads,
      "A retained background room was opened by live refill",
    );
    assert(
      (await page.locator(shown(live.id)).textContent()) === live.text,
      "Live covered message was not refilled",
    );
    await screenshot("covered-live-mobile");
    log("live-refill", {
      request: "/context",
      limit: 40,
      streamTextEmpty: true,
    });

    const digestOpen = await domBarrier(
      page,
      '[data-ui="digest"] [data-ui="covered"] + p',
    );
    await page.locator('[data-ui="digest-open"]').click();
    await digestOpen.wait();
    // Hold every replacement context: withdrawing consent must hide cached
    // bodies before any new response, including the old digest's cache.
    const release = deferred<void>();
    const reads = /\/api\/(?:context|digest)\?/;
    await page.route(reads, async (route) => {
      await release.promise;
      await route.continue();
    });
    const disabledContext = readResponse(page, "context", false);
    const disabledDigest = readResponse(page, "digest", false);
    const disabledStream = bridge.events.expect(
      (event) => event.type === "stream-open",
      "OFF session stream opened",
    );
    const removed = await domBarrier(
      page,
      'body:not(:has([data-ui="message"] p))',
    );
    await toggle.uncheck();
    await removed.wait();
    const withdrawn = await page.locator("body").textContent();
    assert(
      !withdrawn?.includes(covered.text) && !withdrawn?.includes(live.text),
      "OFF kept previously revealed text while requests were pending",
    );
    release.resolve();
    await Promise.all([disabledContext, disabledDigest, disabledStream]);
    await page.unroute(reads);
    await page.locator(hidden(live.id)).waitFor();
    await page
      .locator('[data-ui="digest"] [data-ui="covered"]:only-child')
      .first()
      .waitFor();
    assert(
      !(await page.locator('[data-ui="digest"]').textContent())?.includes(
        covered.text,
      ),
      "An already-open digest kept revealed text after OFF",
    );
    await page.keyboard.press("Escape");
    await page.locator('[data-ui="digest"]').waitFor({ state: "detached" });
    await screenshot("covered-off-mobile");
    await settings.screenshot({
      path: resolve(evidence, "covered-settings-off-mobile.png"),
    });

    const whileOff: Message = {
      ...live,
      id: (BigInt(live.id) + 1n).toString(),
      text: "Synthetic PirateTalk OFF live body",
    };
    messages.push(whileOff);
    const readsBefore = requests.filter(
      (url) => url.pathname === "/api/context",
    ).length;
    const liveHidden = await domBarrier(page, hidden(whileOff.id));
    bridge.emit("message", { ok: true, message: { ...whileOff, text: "" } });
    await liveHidden.wait();
    assert(
      requests.filter((url) => url.pathname === "/api/context").length ===
        readsBefore,
      "OFF triggered a covered-message refill",
    );
    assert(
      !(await page.locator("body").textContent())?.includes(whileOff.text),
      "OFF revealed a live message",
    );
    assert(
      (await settings.evaluate(
        (key) => localStorage.getItem(key),
        COVERED_SETTING_KEY,
      )) === "off",
      "OFF preference was not persisted",
    );

    const streams = requests.filter((url) => url.pathname === "/api/stream");
    assert(
      streams.length > 0 &&
        streams.every((url) => !url.searchParams.has("showCovered")),
      "Undeclared showCovered parameter reached /stream",
    );
    assert(
      requests.every((url) => !url.searchParams.has("messageId")),
      "Undeclared messageId anchor reached the context route",
    );
    assert(
      requests.every((url) => url.pathname !== "/api/send"),
      "Scenario sent a message",
    );
    for (const target of [page, settings]) {
      assert(
        await target.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        "Mobile surface overflows horizontally",
      );
    }
    log("on-off-proof", {
      defaultOff: true,
      openRoomUpdated: true,
      cacheHiddenBeforeResponse: true,
      offLiveRefills: 0,
      backgroundLiveRefills: 0,
      streams: streams.length,
      streamShowCovered: false,
      syntheticOnly: true,
    });
    await settings.close();
  },
};
