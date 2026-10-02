import type { Page } from "playwright-core";
import { domBarrier, responseBarrier } from "../harness/browser-barriers";
import type { Scenario } from "../harness/runner";

const VIEWS = [
  ["desktop", 1440, 900],
  ["mobile", 390, 844],
] as const;
const LABELS = {
  system: "시스템 설정 따르기",
  light: "라이트",
  dark: "다크",
  kakao: "카톡 클래식",
} as const;

/** A made-up theme, as an AI would answer it: fenced, with one unknown token. */
const PASTED = `\`\`\`json
${JSON.stringify({
  name: "새벽 바다",
  mode: "dark",
  tokens: {
    wall: "#13233a",
    header: "#182b45",
    list: "#0f1c2e",
    listSelected: "#24405f",
    text: "#eef4fb",
    textMuted: "#b5c4d6",
    rule: "#7d93ad",
    bubbleSelf: "#2f6f68",
    bubbleSelfText: "#f4fffd",
    bubbleOther: "#22354f",
    bubbleOtherText: "#eef4fb",
    link: "#9fd3ff",
    input: "#1b2d47",
    accent: "#7fe0c9",
    glow: "#ff00ff",
  },
})}
\`\`\``;

async function overflow(page: Page) {
  return page.evaluate(() => {
    const root = document.documentElement;
    const clipped = [
      ...document.querySelectorAll<HTMLElement>(
        '[data-ui="rooms-pane"], [data-ui="theme-dialog"], [data-ui="thread-outlet"]',
      ),
    ].filter(
      (el) => el.offsetParent !== null && el.scrollWidth > el.clientWidth + 1,
    ).length;
    return { page: root.scrollWidth > root.clientWidth, clipped };
  });
}

const theme = (page: Page) =>
  page.evaluate(() => document.documentElement.dataset.theme ?? null);

/**
 * The theme sheet in real Chrome over the synthetic bridge: each built-in
 * theme lands on the root, survives a reload, and clips nothing at 1440 and
 * 390; a pasted theme is refused when broken, previewed, saved, restored after
 * a reload and deleted. The sheet is keyboard-closable and returns focus.
 */
export const scenario: Scenario = {
  id: "theme-switcher",
  async run({ page, bridge, url, log, screenshot }) {
    const failures: string[] = [];
    const expect = (ok: boolean, message: string) => {
      if (!ok) failures.push(message);
    };
    const room = bridge.data.rooms[1];
    if (!room) throw new Error("Fixture has no second room");
    await page.emulateMedia({ colorScheme: "dark" });

    const openSheet = async () => {
      await page.locator('[data-ui="theme-open"]').click();
      await page.locator('[data-ui="theme-dialog"][open]').waitFor();
    };
    const closeSheet = async () => {
      await page.keyboard.press("Escape");
      await page
        .locator('[data-ui="theme-dialog"]')
        .waitFor({ state: "detached" });
    };
    const loadRooms = async (hash: string) => {
      const target = `${url}/${hash}`;
      // A hash-only change is a same-document navigation, so always reload:
      // the point is what a fresh document draws before and after mount.
      if (page.url() !== target) await page.goto(target, { waitUntil: "load" });
      const rooms = responseBarrier(page, "/api/rooms");
      await page.reload({ waitUntil: "load" });
      await rooms;
      await page.locator('nav[data-ui="rooms-pane"] a').first().waitFor();
    };

    for (const [label, width, height] of VIEWS) {
      await page.setViewportSize({ width, height });
      const hash =
        label === "desktop"
          ? `#/room/${encodeURIComponent(room.id)}`
          : "#/rooms";
      await loadRooms(hash);
      for (const [id, name] of Object.entries(LABELS)) {
        await openSheet();
        await page.getByRole("radio", { name, exact: true }).check();
        const expected = id === "system" ? "dark" : id;
        expect(
          (await theme(page)) === expected,
          `${label}/${id}: root ${await theme(page)}`,
        );
        if (id === "kakao") {
          const o = await overflow(page);
          expect(
            !o.page && o.clipped === 0,
            `${label}: sheet overflow ${JSON.stringify(o)}`,
          );
          await screenshot(`theme-${label}-sheet`);
        }
        await closeSheet();
        const focused = await page.evaluate(
          () => (document.activeElement as HTMLElement | null)?.dataset.ui,
        );
        expect(
          focused === "theme-open",
          `${label}/${id}: focus went to ${focused}`,
        );
        await loadRooms(hash);
        expect(
          (await theme(page)) === expected,
          `${label}/${id}: after reload ${await theme(page)}`,
        );
        const o = await overflow(page);
        expect(
          !o.page && o.clipped === 0,
          `${label}/${id}: overflow ${JSON.stringify(o)}`,
        );
        if (label === "desktop")
          await page.locator('[data-ui="thread-wall"]').waitFor();
        await screenshot(`theme-${label}-${id}`);
        log(`${label}/${id}`, { theme: expected, overflow: o });
      }
    }

    // Following the system: the device flips, the root follows without a reload.
    await openSheet();
    await page.getByRole("radio", { name: LABELS.system, exact: true }).check();
    await closeSheet();
    const followed = await domBarrier(page, 'html[data-theme="light"]');
    await page.emulateMedia({ colorScheme: "light" });
    await followed;
    log("system follows device: light");

    // A pasted theme: broken first, then a real one.
    await page.setViewportSize({ width: 390, height: 844 });
    await openSheet();
    const paste = page.locator('[data-ui="theme-paste"]');
    await paste.fill('{"name": "깨짐", ');
    await page.locator('[data-ui="theme-check"]').click();
    await page.locator('[data-ui="theme-issues"][role="alert"]').waitFor();
    await screenshot("theme-mobile-paste-error");
    await paste.fill(PASTED);
    await page.locator('[data-ui="theme-check"]').click();
    await page.locator('[data-ui="theme-preview"]').waitFor();
    await page.locator('[data-ui="theme-preview"]').scrollIntoViewIfNeeded();
    const o = await overflow(page);
    expect(
      !o.page && o.clipped === 0,
      `paste preview overflow ${JSON.stringify(o)}`,
    );
    await screenshot("theme-mobile-paste-preview");
    await page.locator('[data-ui="theme-save"]').click();
    expect(
      (await theme(page)) === "custom",
      `custom: root ${await theme(page)}`,
    );
    await closeSheet();
    await loadRooms("#/rooms");
    const wall = await page.evaluate(() =>
      document.documentElement.style.getPropertyValue("--field-wall"),
    );
    expect(
      (await theme(page)) === "custom" && wall === "#13233a",
      `custom after reload: ${await theme(page)} ${wall}`,
    );
    await screenshot("theme-mobile-custom");
    await openSheet();
    await page.getByRole("button", { name: "새벽 바다 테마 삭제" }).click();
    expect(
      (await theme(page)) === "light",
      `after delete: ${await theme(page)}`,
    );
    await closeSheet();
    log("custom theme saved, restored and deleted");

    if (failures.length > 0) throw new Error(failures.join("\n"));
  },
};
