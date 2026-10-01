import assert from "node:assert/strict";
import { CONTRACT_VERSION } from "../../src/contract/tsuba/version";
import { bounded, deferred } from "./barriers";
import type { ScenarioContext } from "./runner";

export async function checkNoMessenger(
  { context, bridge, url, log, evidence }: ScenarioContext,
  adapter: boolean,
) {
  for (const width of [1440, 390]) {
    const page = await context.newPage();
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    const capabilitiesAsked = deferred<void>();
    const capabilityGate = deferred<void>();
    let recovered = false;
    let allUp = false;
    let checks = 0;
    await page.route("**/adapters{,/**}", async (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path === "/adapters")
        return route.fulfill({
          json: {
            adapters: adapter ? [{ id: "synthetic" }, { id: "down" }] : [],
          },
        });
      if (path.endsWith("/capabilities")) {
        checks++;
        capabilitiesAsked.resolve();
        await bounded(capabilityGate.promise, "release first capability check");
        return recovered && (allUp || path.includes("/synthetic/"))
          ? route.fulfill({
              json: {
                ok: true,
                contract: { version: CONTRACT_VERSION },
                adapter: { name: "synthetic", version: "0.0.0" },
                provider: { id: "synthetic", name: "Synthetic messenger" },
                account: { kind: "user" },
                revision: "0123456789abcdef",
                features: { "rooms.list": {} },
              },
            })
          : route.fulfill({
              status: 503,
              body: "Synthetic upstream unavailable",
            });
      }
      if (path.endsWith("/rooms"))
        return route.fulfill({
          json: {
            ok: true,
            complete: true,
            rooms: [
              { id: "room", title: "Synthetic room", kind: "group", unread: 0 },
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
      throw new Error(`Unexpected synthetic path: ${path}`);
    });
    const coreRequested = bridge.events.expect(
      (event) => event.type === "request" && event.path === "/rooms",
      "first catalog request",
    );
    bridge.failNext("/rooms", 503);
    const releaseCore = bridge.pauseNext("/rooms");
    await page.goto(url, { waitUntil: "load" });
    await coreRequested;
    await page.getByText("카카오 대화 목록을 불러오는 중입니다.").waitFor();
    assert.equal(await page.locator('[data-route="no-messenger"]').count(), 0);
    releaseCore();
    if (adapter) {
      await bounded(capabilitiesAsked.promise, "first adapter check requested");
      await page
        .locator(
          width === 390
            ? '[data-ui="list-tabs"] a[href="#/rooms"]'
            : '[data-ui="rail-kakao"]',
        )
        .waitFor({ state: "hidden" });
      assert.equal(
        await page.locator('[data-route="no-messenger"]').count(),
        0,
      );
    }
    capabilityGate.resolve();
    const notice = page.locator('[data-route="no-messenger"]');
    await notice.waitFor();
    assert.equal(await notice.locator('[data-ui="inbox-row"]').count(), 0);
    assert.equal(await notice.locator('[data-ui="thread-outlet"]').count(), 0);
    await page
      .getByRole("heading", { name: "연결된 메신저가 없습니다" })
      .waitFor();
    assert.equal(await notice.locator('[data-source="kakao"]').count(), 1);
    assert.equal(
      await notice.locator('[data-source="synthetic"]').count(),
      adapter ? 1 : 0,
    );
    assert.equal(
      await notice.locator('[data-source="adapter-index"]').count(),
      adapter ? 0 : 1,
    );
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    const navigation = page.locator(
      width === 390 ? '[data-ui="list-tabs"]' : '[data-ui="rail"]',
    );
    const allTab = navigation.getByRole("link", { name: "전체", exact: true });
    assert.equal(await allTab.getAttribute("aria-current"), "true");
    const tabBox = await allTab.boundingBox();
    assert.ok(
      tabBox && tabBox.height >= 44 && tabBox.y >= 0,
      "navigation remains visible with a full touch target",
    );
    await page.screenshot({
      path: `${evidence}/no-messenger-${adapter ? "adapter" : "empty"}-${width}.png`,
    });
    assert.equal(await navigation.locator('a[href="#/rooms"]').count(), 0);
    assert.equal(
      await navigation.locator('a[href="#/list/synthetic"]').count(),
      0,
    );
    assert.equal(await navigation.locator('a[href="#/list/down"]').count(), 0);
    // Explicit Kakao navigation retains the existing whole-screen notice.
    await page.evaluate(() => {
      window.location.hash = "#/rooms";
    });
    await page.locator('[data-ui="app-notice"]').waitFor();
    await page.evaluate(() => {
      window.location.hash = "";
    });
    await notice.waitFor();
    const before = checks;
    recovered = true;
    if (adapter) bridge.failNext("/rooms", 503);
    const retried = bridge.events.expect(
      (event) => event.type === "response" && event.path === "/rooms",
      "retry catalog response",
    );
    await page.getByRole("button", { name: "다시 확인", exact: true }).click();
    await retried;
    await page.locator('[data-ui="inbox"]').waitFor();
    if (adapter) {
      await page
        .getByRole("link", { name: "Synthetic messenger", exact: true })
        .first()
        .waitFor();
      assert.ok(
        checks >= before + 2,
        "retry must ask every adapter immediately",
      );
      assert.equal(
        await navigation.locator('a[href="#/list/down"]').count(),
        0,
      );
      assert.equal(await navigation.locator('a[href="#/rooms"]').count(), 0);
      assert.doesNotMatch(
        await page.locator('[data-ui="inbox"]').innerText(),
        /불러오지 못|응답하지|호환되지/,
      );
      await page
        .locator('[data-ui="inbox-row"][data-provider="synthetic"]')
        .waitFor();
      await page.screenshot({ path: `${evidence}/quiet-partial-${width}.png` });
      allUp = true;
      await page.reload();
      await page
        .locator(
          '[data-list="all"] [data-ui="inbox-row"][data-provider="kakao"]',
        )
        .first()
        .waitFor();
      await navigation.locator('a[href="#/list/down"]').waitFor();
      await page.screenshot({
        path: `${evidence}/default-all-up-${width}.png`,
      });
    } else {
      await page.locator('[data-ui="inbox-row"]').first().waitFor();
      // A fresh, empty hash with a ready core also lands on all.
      await page.reload();
      await page
        .locator('[data-list="all"] [data-ui="inbox-row"]')
        .first()
        .waitFor();
    }
    assert.equal(await notice.count(), 0);
    log("no-messenger-verified", {
      width,
      adapter,
      retryChecks: checks - before,
    });
    await page.close();
  }
}
