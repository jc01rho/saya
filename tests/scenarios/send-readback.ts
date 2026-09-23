import { domBarrier } from "../harness/browser-barriers";
import type { Scenario } from "../harness/runner";
import {
  assert,
  close,
  mountSurface,
  preview,
  repeat,
  snapshot,
} from "./send/surface";

export const scenario: Scenario = {
  id: "send-readback",
  async run(context) {
    const { page, bridge, screenshot, log } = context;
    const { events, posts, room } = await mountSurface(context);
    const text = "  가상 별빛을 다시 확인합니다.\n공백도 그대로 남깁니다.  ";
    try {
      await preview(context, text);
      const release = bridge.pauseNext("/send");
      const request = bridge.events.expect(
        (event) => event.type === "request" && event.path === "/send",
        "paused real POST",
      );
      const submitted = events.expect(
        (event) => event.attempts?.[0]?.state === "submitted",
        "submitted without receipt",
      );
      const pending = await domBarrier(
        page,
        '[data-ui="pending-attempt"][data-send-state="submitted"]',
      );
      // Two native clicks in one task expose races hidden by waiting for a render.
      await page.locator('[data-ui="send-confirm"]').evaluate((button) => {
        (button as HTMLButtonElement).click();
        (button as HTMLButtonElement).click();
      });
      await request;
      assert(posts.length === 1, "Double click dispatched duplicate POSTs");
      release();
      await Promise.all([submitted, pending.wait()]);
      const state = (await snapshot(context))[0];
      assert(
        state &&
          state.linkedMessageId === null &&
          state.candidates.length === 0,
        "Queue acceptance fabricated readback",
      );
      await repeat(context);
      assert(posts.length === 1, "A recorded UUID was replayed");
      assert(
        (await page.locator('[data-ui="pending-attempt"]').count()) === 1,
        "Submitted attempt vanished without user link",
      );
      await screenshot("submitted-desktop");

      const rows = bridge.data.messages.get(room.id);
      const last = rows?.at(-1);
      assert(rows && last, "Missing observed baseline");
      const observed = {
        ...last,
        id: (BigInt(last.id) + 1n).toString(),
        text,
        fromMe: true,
      };
      rows.push(observed);
      const contextApplied = events.expect(
        (event) => event.type === "context",
        "readback applied",
      );
      const candidate = await domBarrier(page, '[data-ui="pending-link"]');
      const history = await domBarrier(
        page,
        `[data-message-id="${observed.id}"]`,
      );
      await page.locator('[data-ui="send-refresh"]').click();
      await Promise.all([contextApplied, candidate.wait(), history.wait()]);
      assert(
        (await snapshot(context))[0]?.linkedMessageId === null,
        "Text equality auto-linked the attempt",
      );
      await page.setViewportSize({ width: 390, height: 844 });
      await screenshot("candidate-mobile");
      const linked = events.expect(
        (event) => event.attempts?.[0]?.linkedMessageId === observed.id,
        "explicit user link",
      );
      const removed = await domBarrier(
        page,
        '[data-ui="send-ground"]:not(:has([data-ui="pending-attempt"]))',
      );
      await page.locator('[data-ui="pending-link"]').click();
      await Promise.all([linked, removed.wait()]);
      assert(
        (await snapshot(context))[0]?.state === "submitted",
        "User link invented a delivery state",
      );
      assert(
        (await page.locator(`[data-message-id="${observed.id}"]`).count()) ===
          1,
        "Link inserted synthetic history",
      );
      assert(posts.length === 1, "Readback caused an automatic retry");
      log("send-readback", {
        realPosts: posts.length,
        automaticRetries: 0,
        explicitLink: true,
        appComposition: "parent-owned; module surface",
      });
    } finally {
      await close(context);
    }
  },
};
