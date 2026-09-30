import { resolve } from "node:path";
import type { Page } from "playwright-core";
import { bounded } from "../harness/barriers";
import type { Scenario } from "../harness/runner";
import {
  auditAccent,
  auditDoors,
  auditMotion,
  auditOverflow,
  auditStatic,
  DOOR_SHADOW,
  focusDoor,
  fontStatus,
  measureRows,
} from "../visual/primitives";

const READY_FLAG = "__sayaShowcaseReady";

/** Installed before navigation: a MutationObserver resolves when the showcase marks itself ready. */
function installReadyBarrier(page: Page) {
  return page.addInitScript((flag: string) => {
    const ready = new Promise<void>((done) => {
      const isReady = () =>
        document.documentElement?.dataset.showcase === "ready";
      if (isReady()) {
        done();
        return;
      }
      const observer = new MutationObserver(() => {
        if (!isReady()) return;
        observer.disconnect();
        done();
      });
      observer.observe(document, {
        attributes: true,
        subtree: true,
        attributeFilter: ["data-showcase"],
      });
    });
    Reflect.set(window, flag, ready);
  }, READY_FLAG);
}

/** page.evaluate has no default timeout, so the wait is bounded explicitly. */
function awaitReady(page: Page) {
  return bounded(
    page.evaluate(
      (flag) => Reflect.get(window, flag) as Promise<void>,
      READY_FLAG,
    ),
    "showcase ready",
    10_000,
  );
}

export const scenario: Scenario = {
  id: "primitives",
  async run({ page, browser, url, log, evidence }) {
    const failures: string[] = [];
    const report: Record<string, unknown> = {};
    const shot = async (name: string) => {
      const png = await page.screenshot({
        path: resolve(evidence, `${name}.png`),
        fullPage: true,
        timeout: 10_000,
      });
      log("screenshot", { file: `${name}.png` });
      return png;
    };

    const statics = await auditStatic();
    log("static-audit", { failures: statics.failures, ...statics.report });
    Object.assign(report, statics.report);
    failures.push(...statics.failures);

    const fontRequests: { path: string; bytes: number }[] = [];
    page.on("response", async (response) => {
      const path = new URL(response.url()).pathname;
      if (!path.startsWith("/fonts/")) return;
      const length = Number(response.headers()["content-length"] ?? 0);
      fontRequests.push({ path, bytes: Number.isFinite(length) ? length : 0 });
    });
    await installReadyBarrier(page);
    await page.goto(`${url}/#/showcase`, { waitUntil: "load" });
    await awaitReady(page);
    const firstVisit = await fontStatus(page);
    report.fontsFirstVisit = {
      requests: fontRequests.length,
      bytes: fontRequests.reduce((sum, item) => sum + item.bytes, 0),
      ...firstVisit,
    };
    log("fonts-first-visit", report.fontsFirstVisit as Record<string, unknown>);
    // font-display: swap shows Pretendard once a subset arrives; the second visit reads it from the cache.
    await page.reload({ waitUntil: "load" });
    await awaitReady(page);
    report.fontsSecondVisit = await fontStatus(page);
    log(
      "fonts-second-visit",
      report.fontsSecondVisit as Record<string, unknown>,
    );

    // 1440: doors, the one elevation, accent monopoly, focus ring.
    const doors = await auditDoors(page);
    report.doors = doors;
    if (doors.doors === 0) failures.push("no send door rendered");
    for (const corners of doors.corners)
      if (corners !== "0px 0px 0px 0px")
        failures.push(
          `door corners are ${corners}; the door is square, always`,
        );
    for (const door of doors.shadows) {
      if (door.state === "idle" && door.shadow !== DOOR_SHADOW)
        failures.push(
          `idle door shadow is ${door.shadow}, expected ${DOOR_SHADOW}`,
        );
      if (door.state !== "idle" && door.shadow !== "none")
        failures.push(`${door.state} door carries a shadow: ${door.shadow}`);
      if (door.width < 44 || door.height < 44)
        failures.push(
          `door ${door.width}x${door.height} is below the 44px touch target`,
        );
    }
    if (doors.stray.length)
      failures.push(`elevation outside the door: ${doors.stray.join("; ")}`);
    const rowsWithFont = await measureRows(page);
    const wide = await shot("primitives-1440");
    const accentWide = await auditAccent(page, wide);
    report.accent1440 = accentWide;
    if (accentWide.inside === 0)
      failures.push("no accent pixels on the door at 1440");
    if (accentWide.outside > 0)
      failures.push(
        `${accentWide.outside} accent pixels outside the door at 1440, e.g. ${JSON.stringify(accentWide.samples)}`,
      );
    const focus = await focusDoor(page);
    report.focus = focus;
    if (focus.ui !== "send-door")
      failures.push(`Tab from the input reached ${focus.ui}, not the door`);
    if (!focus.focusVisible) failures.push("door focus is not :focus-visible");
    if (
      focus.outlineWidth !== "2px" ||
      focus.outlineStyle !== "solid" ||
      focus.outlineOffset !== "2px"
    )
      failures.push(
        `door focus ring is ${focus.outlineWidth} ${focus.outlineStyle} offset ${focus.outlineOffset}`,
      );
    await shot("primitives-1440-door-focus");
    await page.locator("body").click({ position: { x: 1, y: 1 } });

    // 768 and 390: no horizontal overflow, accent still only on the door.
    for (const viewport of [
      { width: 768, height: 1024 },
      { width: 390, height: 844 },
    ]) {
      await page.setViewportSize(viewport);
      const overflow = await auditOverflow(page);
      report[`overflow${viewport.width}`] = overflow;
      if (overflow.scrollWidth > overflow.clientWidth)
        failures.push(
          `horizontal overflow at ${viewport.width}: ${overflow.scrollWidth} > ${overflow.clientWidth}`,
        );
      const png = await shot(`primitives-${viewport.width}`);
      if (viewport.width === 390) {
        const accent = await auditAccent(page, png);
        report.accent390 = accent;
        if (accent.inside === 0)
          failures.push("no accent pixels on the door at 390");
        if (accent.outside > 0)
          failures.push(
            `${accent.outside} accent pixels outside the door at 390, e.g. ${JSON.stringify(accent.samples)}`,
          );
      }
    }

    // Reduced motion: the walking cat stops and sits; nothing else changes.
    const moving = await auditMotion(page);
    report.motion = moving;
    if (moving.cats === 0) failures.push("no walking cat rendered");
    if (moving.animatedLegs === 0 || moving.walkingCats === 0)
      failures.push("walking cat is not animated without a motion preference");
    if (moving.walkVisible !== moving.cats || moving.sitVisible !== 0)
      failures.push(
        "walking cat shows the wrong pose without a motion preference",
      );
    await page.emulateMedia({ reducedMotion: "reduce" });
    const still = await auditMotion(page);
    report.reducedMotion = still;
    if (still.animatedLegs !== 0 || still.walkingCats !== 0)
      failures.push("cat still animates under prefers-reduced-motion");
    if (still.sitVisible !== still.cats || still.walkVisible !== 0)
      failures.push("cat does not sit under prefers-reduced-motion");
    await shot("primitives-390-reduced-motion");
    await page.emulateMedia({ reducedMotion: "no-preference" });

    // 200% zoom at 1280 is a 640px layout viewport: text must reflow without a horizontal scrollbar.
    await page.setViewportSize({ width: 640, height: 450 });
    const zoomed = await auditOverflow(page);
    report.overflow640 = zoomed;
    if (zoomed.scrollWidth > zoomed.clientWidth)
      failures.push(
        `horizontal overflow at 640 (200% zoom): ${zoomed.scrollWidth} > ${zoomed.clientWidth}`,
      );
    await shot("primitives-640-zoom200");

    // Blocked webfont in a cold context: rows must not reflow to three lines.
    const blockedContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    try {
      await blockedContext.route("**/fonts/**", (route) => route.abort());
      const blockedPage = await blockedContext.newPage();
      blockedPage.setDefaultTimeout(10_000);
      await installReadyBarrier(blockedPage);
      await blockedPage.goto(`${url}/#/showcase`, { waitUntil: "load" });
      await awaitReady(blockedPage);
      const blockedFonts = await fontStatus(blockedPage);
      const rowsBlocked = await measureRows(blockedPage);
      report.blockedFont = { ...blockedFonts, rowsWithFont, rowsBlocked };
      if (blockedFonts.pretendard)
        failures.push("blocked font still reports Pretendard loaded");
      if (rowsBlocked.length !== rowsWithFont.length)
        failures.push("room rows differ between font states");
      rowsBlocked.forEach((height, index) => {
        const reference = rowsWithFont[index] ?? height;
        if (Math.abs(height - reference) > 12)
          failures.push(
            `room row ${index} reflowed from ${reference}px to ${height}px without the webfont`,
          );
      });
      await blockedPage.screenshot({
        path: resolve(evidence, "primitives-1440-blocked-font.png"),
        fullPage: true,
        timeout: 10_000,
      });
      log("screenshot", { file: "primitives-1440-blocked-font.png" });
    } finally {
      await blockedContext.close();
    }

    await page.setViewportSize({ width: 1440, height: 900 });
    await Bun.write(
      resolve(evidence, "primitives-report.json"),
      `${JSON.stringify({ failures, ...report }, null, 2)}\n`,
    );
    log("primitives-audit", { failures: failures.length });
    if (failures.length)
      throw new Error(
        [`${failures.length} primitive contract failure(s):`, ...failures].join(
          "\n - ",
        ),
      );
  },
};
