import { resolve } from "node:path";
import type { Message } from "../../src/core/stores";
import { generateData } from "../fixtures/data";
import { domBarrier, responseBarrier } from "../harness/browser-barriers";
import type { Scenario } from "../harness/runner";
import {
  auditThread,
  restoredBarrier,
  type ThreadFixtureControl,
} from "../visual/thread-anchor";

export const scenario: Scenario = {
  id: "thread-anchor",
  async run({ page, bridge, url, evidence, screenshot }) {
    const data = generateData("stress");
    const room = data.rooms[0];
    if (!room) throw new Error("Missing synthetic room");
    const all = data.messages.get(room.id) ?? [];
    bridge.data.messages.set(room.id, all);
    const response = responseBarrier(page, "/api/context");
    await page.goto(`${url}/#/room/${room.id}`, { waitUntil: "load" });
    await response;
    await (await domBarrier(page, '[data-ui="thread-turns"]')).wait();
    for (const limit of [200, 1000]) {
      const ready = await domBarrier(
        page,
        `[data-ui="thread-wall"][data-limit="${limit}"]:not([aria-busy="true"])`,
      );
      await page.locator('[data-ui="widen"]').click();
      await ready.wait();
    }
    await (await domBarrier(page, '[data-order-count="1000"]')).wait();
    // Read upward in the shipped application, then move the window: the real
    // wall must hold its reading position without any fixture control.
    const box = await page.locator('[data-ui="thread-wall"]').boundingBox();
    if (!box) throw new Error("The application wall has no box");
    const beforeWheel = await auditThread(page);
    // Fenced by the user-scroll generation, so a settle that predates the
    // wheel can never be mistaken for the answer to it.
    const reading = await restoredBarrier(page, {
      mode: "reading-anchor",
      minGeneration: beforeWheel.generation + 1,
    });
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    // Read away from wherever the widened window left the wall: upward when
    // there is room above, downward when the wall sits at its first row.
    await page.mouse.wheel(0, beforeWheel.scrollTop > 1200 ? -1200 : 1200);
    await reading();
    const production = { ...(await auditThread(page)), beforeWheel };
    const appAnchor = production.restoration?.anchor?.id;
    if (!production.virtualized || production.mounted > 80 || !appAnchor)
      throw new Error(
        `1000 messages mounted ${production.mounted} articles (maximum 80), virtualized=${production.virtualized}, anchor=${appAnchor}`,
      );
    const beforeResize = await auditThread(page, appAnchor);
    const resized = await restoredBarrier(page);
    await page.setViewportSize({ width: 1180, height: 820 });
    await resized();
    const afterResize = await auditThread(page, appAnchor);
    const application = {
      event: "application-window-resize",
      delta:
        beforeResize.offset === null || afterResize.offset === null
          ? Number.POSITIVE_INFINITY
          : Math.abs(afterResize.offset - beforeResize.offset),
      mounted: afterResize.mounted,
    };
    if (application.delta > 2 || application.mounted > 80)
      throw new Error(
        `application window resize: anchor delta ${application.delta}px, mounted ${application.mounted}`,
      );
    await screenshot("thread-anchor-application");
    const css = await page
      .locator('link[rel="stylesheet"]')
      .evaluateAll((links) =>
        links.map((link) => (link as HTMLLinkElement).href),
      );

    // Mutation controls are test-only, bundled separately, never shipped by Vite.
    const bundle = await Bun.build({
      entrypoints: [resolve("tests/visual/thread-anchor.ts")],
      target: "browser",
      format: "esm",
      minify: true,
      naming: "anchor.[ext]",
    });
    if (!bundle.success)
      throw new Error(`Fixture bundle failed: ${bundle.logs.join("\n")}`);
    for (const output of bundle.outputs) {
      const path = `/__qa/${output.path.split(/[\\/]/).at(-1)}`;
      const body = await output.text();
      await page.route(`**${path}`, (route) =>
        route.fulfill({ body, contentType: output.type }),
      );
    }
    await page.goto(`${url}/__qa/blank`, { waitUntil: "load" });
    for (const href of [...css, `${url}/__qa/anchor.css`])
      await page.addStyleTag({ url: href });
    await page.evaluate(
      async ({ url, rows }) => {
        const module = await import(`${url}/__qa/anchor.js`);
        module.mountThreadAnchorFixture(rows);
      },
      { url, rows: all.slice(200) },
    );
    await (await domBarrier(page, '[data-order-count="800"]')).wait();
    const initial = await restoredBarrier(page, { records: 800 });
    await page.evaluate(() => window.dispatchEvent(new Event("resize")));
    await initial();

    const results: { event: string; delta: number; mounted: number }[] = [];
    const replace = async (rows: Message[]) =>
      page.evaluate(
        (rows) =>
          (
            Reflect.get(window, "threadFixture") as ThreadFixtureControl
          ).replace(rows),
        rows,
      );
    const wheel = async (delta: number) => {
      const before = await auditThread(page);
      const settled = await restoredBarrier(page, {
        mode: delta < 0 ? "reading-anchor" : "follow-tail",
        minGeneration: before.generation + 1,
      });
      await page.mouse.move(200, 250);
      await page.mouse.wheel(0, delta);
      await settled();
    };
    await wheel(-1000);
    const scrolled = await auditThread(page);
    // The row the controller committed as the reading anchor. Every event below
    // is judged by that row's own box, measured from the DOM independently.
    let measured = scrolled.restoration?.anchor?.id;
    if (!measured || scrolled.mode !== "reading-anchor")
      throw new Error(
        `User scroll did not enter reading mode: ${JSON.stringify(scrolled)}`,
      );
    const check = async (
      event: string,
      action: () => Promise<unknown>,
      count?: number,
    ) => {
      const before = await auditThread(page, measured);
      const settled = await restoredBarrier(page, {
        records: count,
        fixtureChange: [
          "prepend-200",
          "hangul-100000",
          "ground-resize",
          "anchor-eviction",
        ].includes(event),
        fontLoad: event === "font-load",
      });
      await action();
      await settled();
      const after = await auditThread(page, measured);
      const delta =
        before.offset === null || after.offset === null
          ? Infinity
          : Math.abs(after.offset - before.offset);
      results.push({ event, delta, mounted: after.mounted });
      await Bun.write(
        resolve(evidence, "thread-anchor-report.json"),
        `${JSON.stringify({ production, application, results }, null, 2)}\n`,
      );
      if (delta > 2 || after.mounted > 80)
        throw new Error(
          `${event}: anchor delta ${delta}px, mounted ${after.mounted}; ${JSON.stringify({ before, after })}`,
        );
    };
    await check("prepend-200", () => replace(all), 1000);
    // A measured overscan predecessor grows to 100,000 Hangul characters, untruncated.
    const predecessor = await page.evaluate((id) => {
      const rows = [
        ...document.querySelectorAll<HTMLElement>("[data-message-id]"),
      ];
      const index = rows.findIndex((row) => row.dataset.messageId === id);
      return rows[index - 1]?.dataset.messageId;
    }, measured);
    if (!predecessor) throw new Error("Missing overscan predecessor");
    const huge = all.map((row) =>
      row.id === predecessor ? { ...row, text: "한".repeat(100_000) } : row,
    );
    await check("hangul-100000", () => replace(huge));
    await check("ground-resize", () =>
      page.evaluate(() =>
        (Reflect.get(window, "threadFixture") as ThreadFixtureControl).ground(
          250,
        ),
      ),
    );
    await check("window-resize", () =>
      page.setViewportSize({ width: 1000, height: 760 }),
    );
    await check("font-load", () =>
      page.evaluate(async () => {
        // sizeAdjust makes the swap change every line box; it is a real CSS
        // descriptor that the DOM typings do not carry yet.
        const font = new FontFace(
          "AnchorFixture",
          'url("/fonts/PretendardVariable.subset.87.woff2")',
          { sizeAdjust: "125%" } as FontFaceDescriptors,
        );
        document.fonts.add(font);
        const wall = document.querySelector<HTMLElement>(
          '[data-ui="thread-wall"]',
        );
        if (!wall) throw new Error("Missing wall");
        wall.style.fontFamily = '"AnchorFixture", serif';
        await font.load();
      }),
    );
    await check("mobile-resize", () =>
      page.setViewportSize({ width: 390, height: 844 }),
    );
    await screenshot("thread-anchor-mobile");

    // Evict the anchor, retaining its next visible neighbor at that neighbor's original offset.
    const neighbor = await page.evaluate((id) => {
      const row = document.querySelector(`[data-message-id="${id}"]`);
      return (row?.nextElementSibling as HTMLElement | null)?.dataset.messageId;
    }, measured);
    if (!neighbor) throw new Error("Missing surviving neighbor");
    const evictedId = measured;
    measured = neighbor;
    await check(
      "anchor-eviction",
      () => replace(huge.filter((row) => row.id !== evictedId)),
      999,
    );
    if ((await page.locator('[data-ui="thread-anchor-evicted"]').count()) !== 1)
      throw new Error("Anchor eviction was not disclosed");
    await screenshot("thread-anchor-desktop");
  },
};
