import { expect } from "bun:test";
import { bounded, deferred } from "../harness/barriers";
import { domBarrier } from "../harness/browser-barriers";
import type { Scenario } from "../harness/runner";

/** Typing while a write is on its way neither hides its outcome nor lets a second send start. */
export const scenario: Scenario = {
  id: "composer-write-after-edit",
  async run({ page, bridge, url, screenshot, log }) {
    const [room] = bridge.data.rooms.filter((candidate) => candidate.readable);
    if (!room) throw new Error("Missing synthetic room");
    const input = page.locator('[data-ui="composer-input"]');
    const send = page.locator('[data-ui="composer-send"]');
    const error = page.locator('[data-ui="composer-error"]');
    const errors: string[] = [];
    page.on("pageerror", (failure) => errors.push(failure.message));

    for (const mode of ["refusal", "rejection"] as const) {
      // Given: an ordinary send whose real write is held by the core.
      await page.goto("about:blank");
      const accepted = deferred<void>();
      const release = deferred<void>();
      const writes: string[] = [];
      await page.route("**/api/send", async (route) => {
        const body: { room: string; text: string; dryRun: boolean } = route
          .request()
          .postDataJSON();
        if (body.dryRun) {
          await route.fulfill({
            json: {
              ok: true,
              submitted: false,
              dryRun: true,
              roomId: body.room,
              room: room.title,
              length: body.text.length,
              wouldClearDraft: false,
            },
          });
          return;
        }
        writes.push(body.text);
        accepted.resolve();
        await bounded(release.promise, "release held write");
        if (mode === "rejection") {
          await route.abort("connectionreset");
          return;
        }
        await route.fulfill({
          status: 409,
          json: {
            ok: false,
            error: { code: "SEND_FAILED", message: "Synthetic refusal" },
          },
        });
      });
      await page.goto(`${url}/#/room/${room.id}`);
      await input.fill("synthetic first");
      await send.click();
      await bounded(accepted.promise, "write accepted");

      // When: the person types before the write's answer arrives.
      await input.fill("synthetic edited");
      expect(await send.isDisabled()).toBe(true);
      const shown = await domBarrier(page, '[data-ui="composer-error"]');
      release.resolve();
      await shown.wait();

      // Then: the outcome is drawn, the newer text is kept, nothing was resent.
      expect(await error.count()).toBe(1);
      expect(await input.inputValue()).toBe("synthetic edited");
      expect(writes).toEqual(["synthetic first"]);
      await screenshot(`${mode}-after`);
      log("write-outcome-after-edit", { mode, writes: [...writes] });
      await page.unroute("**/api/send");
    }
    expect(errors).toEqual([]);
  },
};
