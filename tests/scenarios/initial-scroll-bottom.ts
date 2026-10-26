import assert from "node:assert/strict";
import { bounded, deferred } from "../harness/barriers";
import { domBarrier } from "../harness/browser-barriers";
import type { Scenario } from "../harness/runner";
import { auditThread, restoredBarrier } from "../visual/thread-anchor";

/** Synthetic stream rows arrive while the first newest-window request is held. */
export const scenario: Scenario = {
  id: "initial-scroll-bottom",
  async run({ page, bridge, url, screenshot, log }) {
    const room = bridge.data.rooms[0];
    assert.ok(room);
    const messages = bridge.data.messages.get(room.id);
    assert.ok(messages);
    const context = deferred<void>();
    const requested = deferred<void>();
    await page.route("**/api/context?**", async (route) => {
      requested.resolve();
      await context.promise;
      await route.continue();
    });
    const streaming = bridge.events.expect(
      (event) => event.type === "stream-open",
      "stream connected",
    );
    await page.goto(`${url}/#/room/${room.id}`, { waitUntil: "load" });
    await Promise.all([
      bounded(requested.promise, "initial context held"),
      streaming,
    ]);
    await (await domBarrier(page, '[data-ui="thread-wall"]')).wait();
    try {
      // Separate committed layouts, not network timing, establish each partial
      // order before the initial context supplies the rest of the window.
      for (const [index, message] of messages.slice(0, 2).entries()) {
        const restored = await restoredBarrier(page, { records: index + 1 });
        bridge.emit("message", { ok: true, message });
        await restored();
      }
      const before = await auditThread(page);
      const restored = await restoredBarrier(page, {
        records: messages.length,
      });
      context.resolve();
      await restored();
      const after = await auditThread(page);
      await screenshot("initial-scroll-bottom-loaded");
      log("initial-context-after-stream", { before, after });
      assert.ok(
        after.remaining <= 1,
        `Initial context must land at newest: ${JSON.stringify(after)}`,
      );
    } finally {
      context.resolve();
    }
  },
};
