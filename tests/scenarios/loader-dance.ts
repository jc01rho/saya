import { LIGHT } from "../../src/features/theme/builtin";
import { customChoice, storedFor } from "../../src/features/theme/store";
import { responseBarrier } from "../harness/browser-barriers";
import type { Scenario } from "../harness/runner";

export const scenario: Scenario = {
  id: "loader-dance",
  async run({ page, url, log, screenshot }) {
    const assert = (ok: boolean, message: string) => {
      if (!ok) throw new Error(message);
    };
    await page.goto(`${url}/__qa/blank`);
    const picture = await page.evaluate(() => {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 32;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("No canvas");
      context.fillStyle = "#614332";
      context.fillRect(4, 4, 24, 24);
      return canvas.toDataURL("image/png");
    });
    const theme = {
      ...LIGHT,
      name: "Dance fixture",
      images: {
        badge: { src: picture },
        loader: { src: picture, motion: "dance" as const },
      },
    };
    const stored = storedFor(customChoice(theme), [theme]);
    await page.evaluate(
      (value) => localStorage.setItem("saya.theme", JSON.stringify(value)),
      stored,
    );
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      for (const hash of ["#/all", "#/rooms"]) {
        let release = () => {};
        const held = new Promise<void>((resolve) => {
          release = resolve;
        });
        const handler = async (route: import("playwright-core").Route) => {
          await held;
          await route.continue().catch((error: Error) => {
            if (!/already handled/.test(error.message)) throw error;
          });
        };
        await page.route("**/api/rooms**", handler);
        try {
          await page.goto(
            `${url}/?width=${width}&list=${hash.slice(2)}${hash}`,
          );
          const loader = page.locator('[data-ui="theme-loader"]').first();
          await loader.waitFor();
          const bounds = await loader.evaluate((element) => {
            const rect = element.getBoundingClientRect();
            const parent = element.parentElement;
            return {
              width: rect.width,
              em: Number.parseFloat(getComputedStyle(element).fontSize),
              fits: rect.left >= 0 && rect.right <= innerWidth,
              parentFits: !parent || parent.scrollWidth <= parent.clientWidth,
              pageFits: document.documentElement.scrollWidth <= innerWidth,
            };
          });
          assert(bounds.width > bounds.em * 4, "Loader remains tiny");
          assert(
            bounds.fits && bounds.parentFits && bounds.pageFits,
            "Loader overflow",
          );
          log("loader contained", { viewport: width, hash, ...bounds });
          await screenshot(`loading-${width}-${hash.slice(2)}`);
        } finally {
          release();
          await page.unroute("**/api/rooms**", handler);
        }
        await page
          .locator('[data-ui="inbox-row"], [data-ui="room-row"]')
          .first()
          .waitFor();
        const badge = page.getByRole("button", { name: "캐릭터 춤추기" });
        await badge.waitFor();
        for (const action of ["click", "Enter", "Space"]) {
          await page.evaluate(() => {
            const element = document.querySelector('[data-ui="theme-badge"]');
            if (!element) throw new Error("No badge");
            const state = window as Window & { danceEnded?: Promise<void> };
            state.danceEnded = new Promise<void>((resolve, reject) => {
              const timeout = setTimeout(
                () => reject(new Error("Dance never ended")),
                5000,
              );
              element.addEventListener(
                "animationend",
                () => {
                  clearTimeout(timeout);
                  resolve();
                },
                { once: true },
              );
            });
          });
          if (action === "click") await badge.click();
          else {
            await badge.focus();
            await page.keyboard.press(action);
          }
          const active = await badge.evaluate((element) => ({
            active: element.hasAttribute("data-dancing"),
            motion: getComputedStyle(element, "::before").animationName,
          }));
          assert(
            active.active && active.motion !== "none",
            "Activation did not dance",
          );
          await page.evaluate(
            () =>
              (window as Window & { danceEnded?: Promise<void> }).danceEnded,
          );
          assert(
            (await badge.getAttribute("data-dancing")) === null,
            "Dance flag stayed set",
          );
          log("dance returned idle", { width, hash, action });
        }
        await page.emulateMedia({ reducedMotion: "reduce" });
        await badge.click();
        const reduced = await badge.evaluate((element) => ({
          motion: getComputedStyle(element, "::before").animationName,
          active: element.hasAttribute("data-dancing"),
        }));
        assert(
          reduced.motion === "none" && !reduced.active,
          "Reduced motion danced",
        );
        await screenshot(`reduced-${width}-${hash.slice(2)}`);
        await page.emulateMedia({ reducedMotion: "no-preference" });
      }
    }
    await page.evaluate(() =>
      localStorage.setItem("saya.theme", '{"choice":"light"}'),
    );
    const rooms = responseBarrier(page, "/api/rooms");
    await page.reload();
    await rooms;
    assert(
      await page.locator('[data-ui="theme-badge"]').isHidden(),
      "Built-in theme has an empty button",
    );
    log("built-in badge hidden");
  },
};
