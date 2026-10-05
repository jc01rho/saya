import { expect } from "bun:test";
import { bounded, deferred } from "../harness/barriers";
import { domBarrier } from "../harness/browser-barriers";
import type { Scenario } from "../harness/runner";

/** A confirmed write on its way cannot be cancelled into an idle composer that sends again. */
export const scenario: Scenario = {
  id: "composer-cancel-while-posting",
  async run({ page, bridge, url, screenshot, log }) {
    const [room] = bridge.data.rooms.filter((candidate) => candidate.readable);
    if (!room) throw new Error("Missing synthetic room");
    const input = page.locator('[data-ui="composer-input"]');
    const send = page.locator('[data-ui="composer-send"]');
    const confirm = page.locator('[data-ui="composer-confirm"]');
    const cancel = page.locator('[data-ui="composer-cancel"]');
    const errors: string[] = [];
    page.on("pageerror", (failure) => errors.push(failure.message));

    // Given: a send that would clear the desktop draft, confirmed and held by the core.
    const accepted = deferred<void>();
    const release = deferred<void>();
    const writes: string[] = [];
    await page.route("**/api/send", async (route) => {
      const body: { room: string; text: string; dryRun: boolean } = route
        .request()
        .postDataJSON();
      if (!body.dryRun) {
        writes.push(body.text);
        accepted.resolve();
        await bounded(release.promise, "release held write");
      }
      await route.fulfill({
        json: {
          ok: true,
          submitted: !body.dryRun,
          dryRun: body.dryRun,
          roomId: body.room,
          room: room.title,
          length: body.text.length,
          wouldClearDraft: true,
        },
      });
    });
    await page.goto(`${url}/#/room/${room.id}`);
    await input.fill("synthetic held");
    {
      const confirmation = await domBarrier(
        page,
        '[data-ui="composer-confirm"]',
      );
      await send.click();
      await confirmation.wait();
    }
    await confirm.click();
    await bounded(accepted.promise, "write accepted");

    // When: the write is still on its way.
    // Then: neither confirming nor cancelling is offered, and no second send can start.
    expect(await cancel.isDisabled()).toBe(true);
    expect(await confirm.isDisabled()).toBe(true);
    expect(await send.isDisabled()).toBe(true);
    await screenshot("posting");

    const submitted = await domBarrier(page, '[data-ui="composer-submitted"]');
    release.resolve();
    await submitted.wait();
    expect(writes).toEqual(["synthetic held"]);
    log("cancel-held-while-posting", { writes: [...writes] });
    await page.unroute("**/api/send");
    expect(errors).toEqual([]);
  },
};
