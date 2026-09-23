import type { Scenario } from "../harness/runner";

/**
 * LEAD-AUTHORED CROSS-CHECK. Not written by any dag node.
 * Every other scenario under tests/scenarios/ was authored by the node whose work it judges,
 * which is grade-your-own-homework. This one asserts success criterion 3 with independent
 * checks, and it measures computed values instead of trusting a screenshot's appearance.
 */
export const scenario: Scenario = {
  id: "lead-surface",
  async run({ page, url, log, screenshot }) {
    for (const [label, width, height] of [
      ["desktop", 1440, 900],
      ["mobile", 390, 844],
    ] as const) {
      await page.setViewportSize({ width, height });

      const contextCalls: string[] = [];
      const onRequest = (r: { url(): string }) => {
        if (/\/api\/context/.test(r.url())) contextCalls.push(r.url());
      };
      page.on("request", onRequest);

      await page.goto(`${url}/#/rooms`, { waitUntil: "load" });
      await page.waitForSelector("nav a", { timeout: 15_000 });
      await screenshot(`lead-${label}-rooms`);

      // 1. The unreadable room must be LISTED and stated, not hidden.
      const body = await page.evaluate(() => document.body.innerText);
      if (!/읽을 수 없음/.test(body))
        throw new Error(
          `${label}: no unreadable room reason in the rendered text`,
        );

      // 2. "full ink" as a MEASUREMENT, not an impression: walk the ancestor chain of the
      //    element carrying that reason and require the minimum computed opacity >= 0.95.
      const minOpacity = await page.evaluate(() => {
        const el = [...document.querySelectorAll<HTMLElement>("*")].find(
          (e) =>
            e.children.length === 0 && /읽을 수 없음/.test(e.textContent ?? ""),
        );
        if (!el) return null;
        let node: HTMLElement | null = el;
        let worst = 1;
        while (node && node !== document.body) {
          const o = Number.parseFloat(getComputedStyle(node).opacity || "1");
          if (o < worst) worst = o;
          node = node.parentElement;
        }
        return worst;
      });
      if (minOpacity === null)
        throw new Error(`${label}: unreadable row element not found`);
      if (minOpacity < 0.95)
        throw new Error(
          `${label}: unreadable row is dimmed, min computed opacity ${minOpacity}`,
        );
      log(`${label}: unreadable row min computed opacity ${minOpacity}`);

      // 3. No per-room preview fan-out on first paint.
      if (contextCalls.length > 1)
        throw new Error(
          `${label}: ${contextCalls.length} /api/context calls on first paint`,
        );
      log(
        `${label}: /api/context calls on first paint = ${contextCalls.length}`,
      );

      // 4. Accent monopoly: #F3B41B is rgb(243,180,27) and belongs to the send door alone.
      const yellow = await page.evaluate(() => {
        const hit = (c: string) => /rgb\(\s*243,\s*180,\s*27\s*\)/.test(c);
        return [...document.querySelectorAll<HTMLElement>("*")].filter((e) => {
          const s = getComputedStyle(e);
          return (
            hit(s.backgroundColor) || hit(s.borderTopColor) || hit(s.color)
          );
        }).length;
      });
      if (yellow > 2)
        throw new Error(
          `${label}: accent #F3B41B painted on ${yellow} elements; it is the send door's alone`,
        );
      log(`${label}: elements painted #F3B41B = ${yellow}`);

      page.off("request", onRequest);
    }
  },
};
