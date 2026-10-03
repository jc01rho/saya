import { expect } from "bun:test";
import { bounded, deferred } from "../harness/barriers";
import { domBarrier } from "../harness/browser-barriers";
import type { Scenario } from "../harness/runner";

export const scenario: Scenario = {
  id: "composer-stale-operation",
  async run({ page, bridge, url, screenshot, log }) {
    const [a, b] = bridge.data.rooms.filter((room) => room.readable);
    if (!a || !b) throw new Error("Missing synthetic rooms");
    const input = page.locator('[data-ui="composer-input"]');
    const confirm = page.locator('[data-ui="composer-confirm"]');
    const send = page.locator('[data-ui="composer-send"]');
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));

    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      for (const mode of [
        "failure",
        "refusal",
        "success",
        "rejection",
        "discarded",
        "return-to-a",
        "replacement-preview",
      ] as const) {
        // Given: one accepted A operation, held while a newer composition starts.
        await page.goto("about:blank");
        const accepted = deferred<void>();
        const release = deferred<void>();
        const released = deferred<void>();
        const writes: { room: string; text: string }[] = [];
        let held = false;
        await page.route("**/api/send", async (route) => {
          const body: { room: string; text: string; dryRun: boolean } = route
            .request()
            .postDataJSON();
          if (!body.dryRun) writes.push({ room: body.room, text: body.text });
          const hold =
            !held &&
            body.room === a.id &&
            body.dryRun === (mode === "replacement-preview");
          if (hold) {
            held = true;
            accepted.resolve();
            await bounded(release.promise, "release originating operation");
            if (mode === "rejection") {
              await route.abort("connectionreset");
              released.resolve();
              return;
            }
            if (mode === "failure" || mode === "refusal") {
              await route.fulfill({
                status: mode === "failure" ? 500 : 409,
                json: {
                  ok: false,
                  error: { code: "SEND_FAILED", message: "Synthetic refusal" },
                },
              });
              released.resolve();
              return;
            }
          }
          await route.fulfill({
            json: {
              ok: true,
              submitted: !body.dryRun,
              dryRun: body.dryRun,
              roomId: body.room,
              room: body.room === a.id ? a.title : b.title,
              length: body.text.length,
              wouldClearDraft: true,
            },
          });
          if (hold) released.resolve();
        });
        await page.goto(`${url}/#/room/${a.id}`);
        await input.fill("synthetic original A");
        await send.click();
        if (mode !== "replacement-preview") await confirm.click();
        await bounded(accepted.promise, "A accepted");

        if (mode === "discarded") {
          const detached = page.waitForEvent("requestfailed", {
            predicate: (request) =>
              new URL(request.url()).pathname === "/api/send",
          });
          await page.evaluate(() => {
            location.hash = "#/all";
          });
          await detached;
        }
        await page.evaluate((id) => {
          location.hash = `#/room/${id}`;
        }, b.id);
        await page
          .getByRole("heading", { name: b.title, exact: true })
          .waitFor();
        const returnToA =
          mode === "return-to-a" || mode === "replacement-preview";
        if (returnToA) {
          await page.evaluate((id) => {
            location.hash = `#/room/${id}`;
          }, a.id);
          await page
            .getByRole("heading", { name: a.title, exact: true })
            .waitFor();
        }
        const target = returnToA ? a : b;
        // Identical fingerprint values still represent a replacement preview.
        const text = returnToA
          ? "synthetic original A"
          : `synthetic newer ${target.id}`;
        await input.fill(text);
        if (mode !== "return-to-a") {
          const confirmation = await domBarrier(
            page,
            '[data-ui="composer-confirm"]',
          );
          await send.click();
          await confirmation.wait();
        }
        await screenshot(`${width}-${mode}-before`);

        // When: settle exactly the held request, not another room's dry run.
        const originatingRequest = (
          request: import("playwright-core").Request,
        ) => {
          if (new URL(request.url()).pathname !== "/api/send") return false;
          const body = request.postDataJSON();
          return body.room === a.id && body.dryRun === false;
        };
        const settled =
          mode === "discarded" || mode === "replacement-preview"
            ? null
            : mode === "rejection"
              ? page.waitForEvent("requestfailed", {
                  predicate: originatingRequest,
                })
              : page.waitForEvent("requestfinished", {
                  predicate: originatingRequest,
                });
        release.resolve();
        await bounded(released.promise, "held route completed");
        if (settled) await settled;
        // Render events, not a time delay, flush the completed request's UI work.
        await page.evaluate(
          () =>
            new Promise<void>((resolve) => {
              requestAnimationFrame(() =>
                requestAnimationFrame(() => resolve()),
              );
            }),
        );

        // Then: no cross-room send, no stale status, and current consent still works.
        expect(await input.inputValue()).toBe(text);
        expect(await page.locator('[data-ui="composer-error"]').count()).toBe(
          0,
        );
        expect(
          await page.locator('[data-ui="composer-submitted"]').count(),
        ).toBe(0);
        expect(writes).toEqual(
          mode === "replacement-preview"
            ? []
            : [{ room: a.id, text: "synthetic original A" }],
        );
        if (mode === "return-to-a") {
          expect(
            await page
              .locator('[data-ui="composer-pending"]')
              .getAttribute("data-state"),
          ).toBe("uncertain");
        } else {
          expect(await confirm.count()).toBe(1);
          expect(await confirm.isEnabled()).toBe(true);
        }
        await screenshot(`${width}-${mode}-after`);
        log("stale-operation-preserved", {
          width,
          mode,
          draft: text,
          writes: [...writes],
        });
        if (mode !== "return-to-a") {
          const submitted = await domBarrier(
            page,
            '[data-ui="composer-submitted"]',
          );
          await confirm.click();
          await submitted.wait();
          expect(writes.at(-1)).toEqual({ room: target.id, text });
          expect(writes.length).toBe(mode === "replacement-preview" ? 1 : 2);
        }
        await page.unroute("**/api/send");
      }
    }
    expect(errors).toEqual([]);
    log("no-browser-errors", { errors });
  },
};
