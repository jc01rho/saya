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
      // The all list (inbox) or the KakaoTalk list, whichever the route draws.
      await page
        .locator('nav[data-ui="rooms-pane"] a, nav[data-ui="inbox"] a')
        .first()
        .waitFor();
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

    // A theme with pictures: a made-up dot pattern drawn here, never a real picture.
    const dots = await page.evaluate(() => {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 96;
      const g = canvas.getContext("2d");
      if (!g) throw new Error("No 2d context");
      g.fillStyle = "#7fe0c9";
      for (const [x, y] of [
        [24, 24],
        [72, 72],
      ]) {
        g.beginPath();
        g.arc(x ?? 0, y ?? 0, 18, 0, Math.PI * 2);
        g.fill();
      }
      return canvas.toDataURL("image/png");
    });
    const fenced = /```json\n([\s\S]*)\n```/.exec(PASTED)?.[1] ?? "{}";
    const pictured = {
      ...JSON.parse(fenced),
      name: "점무늬",
      images: {
        wall: { src: dots, fit: "tile", opacity: 0.3 },
        list: { src: dots, fit: "tile", opacity: 0.1 },
        mascot: { src: dots },
        badge: { src: dots },
        loader: { src: dots },
      },
    };
    // The list's pattern, the badge and the mascot below the last row, once places.css has
    // loaded, in whichever list is drawn: the merged inbox or the KakaoTalk list.
    const SCROLLER = '[data-ui="inbox-scroller"], [data-ui="room-scroller"]';
    const END = '[data-ui="inbox-end"], [data-ui="room-filler"]';
    const ROW = '[data-ui="inbox-row"], [data-ui="room-row"]';
    const places = async () => {
      await page
        .waitForFunction(
          (selector) => {
            const scroller = document.querySelector(selector);
            return Boolean(
              scroller &&
                getComputedStyle(scroller).backgroundImage.includes(
                  "data:image/png",
                ),
            );
          },
          SCROLLER,
          { timeout: 5_000 },
        )
        .catch(() => undefined);
      return page.evaluate(
        ([scroller, end, line]) => {
          const at = (selector: string) => document.querySelector(selector);
          const drawn = (selector: string) => {
            const element = at(selector);
            return element
              ? getComputedStyle(element).backgroundImage.includes(
                  "data:image/png",
                )
              : false;
          };
          const badge = at('[data-ui="theme-badge"]')?.getBoundingClientRect();
          const open = at('[data-ui="theme-open"]')?.getBoundingClientRect();
          const filler = at(end)?.getBoundingClientRect();
          const row = at(line);
          return {
            list: drawn(scroller),
            row: row ? getComputedStyle(row).backgroundColor : null,
            badge: drawn('[data-ui="theme-badge"]') ? badge?.width : null,
            overlap:
              badge && open
                ? badge.right > open.left &&
                  open.right > badge.left &&
                  badge.bottom > open.top &&
                  open.bottom > badge.top
                : null,
            filler: drawn(end) ? filler?.height : null,
          };
        },
        [SCROLLER, END, ROW] as const,
      );
    };
    const placesOk = (found: Awaited<ReturnType<typeof places>>) =>
      found.list &&
      found.row === "rgba(0, 0, 0, 0)" &&
      found.badge === 28 &&
      found.overlap === false &&
      (found.filler ?? 0) >= 136;
    const wallImage = () =>
      page.evaluate(
        () =>
          getComputedStyle(
            document.querySelector('[data-ui="thread-wall"]') as Element,
          ).backgroundImage,
      );
    const mascotShown = () =>
      page.evaluate(() => {
        const mascot = document.querySelector('[data-ui="theme-mascot"]');
        const cat = mascot?.parentElement?.querySelector('[data-ui="cat"]');
        return {
          mascot: mascot ? getComputedStyle(mascot).display : null,
          cat: cat ? getComputedStyle(cat).display : null,
        };
      });
    await page.setViewportSize({ width: 1440, height: 900 });
    await loadRooms(`#/room/${encodeURIComponent(room.id)}`);
    await openSheet();
    await paste.fill(JSON.stringify(pictured));
    await page.locator('[data-ui="theme-check"]').click();
    await page.locator('[data-ui="theme-preview-mascot"]').waitFor();
    await page.locator('[data-ui="theme-preview"]').scrollIntoViewIfNeeded();
    await screenshot("theme-desktop-pictured-preview");
    await page.locator('[data-ui="theme-save"]').click();
    await closeSheet();
    await loadRooms(`#/room/${encodeURIComponent(room.id)}`);
    await page.locator('[data-ui="thread-wall"]').waitFor();
    const drawn = await wallImage();
    expect(
      drawn.includes("data:image/png"),
      `pictured wall after reload: ${drawn.slice(0, 80)}`,
    );
    const wide = await places();
    expect(placesOk(wide), `places beside the room: ${JSON.stringify(wide)}`);
    await screenshot("theme-desktop-pictured-room");
    await loadRooms("#/rooms");
    const shown = await mascotShown();
    expect(
      shown.mascot === "block" && shown.cat === "none",
      `mascot on the empty outlet: ${JSON.stringify(shown)}`,
    );
    await screenshot("theme-desktop-pictured-empty");
    // The loader beside a loading line: the rooms answer is held, so the list stays loading.
    let release = () => {};
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route("**/api/rooms**", async (route) => {
      await held;
      // A reload in between abandons the held request; only a live one goes on.
      await route.continue().catch((error: Error) => {
        if (!/already handled/.test(error.message)) throw error;
      });
    });
    const loading = async () => {
      await page.reload({ waitUntil: "load" });
      await page.locator('[data-ui="theme-loader"]').first().waitFor();
      return page.evaluate(() => {
        const loader = document.querySelector<HTMLElement>(
          '[data-ui="theme-loader"]',
        );
        const style = loader ? getComputedStyle(loader) : null;
        const walking = document.querySelector(
          '[data-ui="rooms-pane"] [data-ui="cat"][data-motion="walk"]',
        );
        return {
          shown: style?.display ?? null,
          picture: style?.backgroundImage.includes("data:image/png") ?? false,
          height: loader?.getBoundingClientRect().height ?? 0,
          animation: style?.animationName ?? null,
          busy: document.querySelector('[aria-busy="true"]') !== null,
          hidden: loader?.getAttribute("aria-hidden"),
          cat: walking ? getComputedStyle(walking).display : null,
        };
      });
    };
    const dancing = await loading();
    expect(
      dancing.shown !== "none" &&
        dancing.picture &&
        dancing.height > 0 &&
        dancing.animation === "theme-loader-dance" &&
        dancing.busy &&
        dancing.hidden === "true" &&
        dancing.cat !== "inline-block",
      `loader beside the loading list: ${JSON.stringify(dancing)}`,
    );
    await screenshot("theme-desktop-pictured-loading");
    await page.emulateMedia({ reducedMotion: "reduce" });
    const still = await loading();
    expect(
      still.shown !== "none" && still.animation === "none",
      `loader under reduced motion: ${JSON.stringify(still)}`,
    );
    await page.emulateMedia({ reducedMotion: "no-preference" });
    release();
    await page.unroute("**/api/rooms**");
    log(
      "loader dances beside the loading list and stands still under reduced motion",
    );
    // Narrow, the room replaces the list, so the wall is what to wait for.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${url}/#/room/${encodeURIComponent(room.id)}`, {
      waitUntil: "load",
    });
    await page.reload({ waitUntil: "load" });
    await page.locator('[data-ui="thread-wall"]').waitFor();
    const narrow = await overflow(page);
    expect(
      !narrow.page && narrow.clipped === 0,
      `pictured overflow ${JSON.stringify(narrow)}`,
    );
    await screenshot("theme-mobile-pictured-room");
    await loadRooms("#/rooms");
    const phone = await places();
    expect(
      placesOk(phone),
      `places on the phone list: ${JSON.stringify(phone)}`,
    );
    await screenshot("theme-mobile-pictured-list");
    await openSheet();
    await page.getByRole("button", { name: "점무늬 테마 삭제" }).click();
    await closeSheet();
    const cleared = await page.evaluate(() => ({
      wall: document.documentElement.style.getPropertyValue(
        "--theme-wall-image",
      ),
      mascot: "themeMascot" in document.documentElement.dataset,
      list: "themeList" in document.documentElement.dataset,
      badge: "themeBadge" in document.documentElement.dataset,
      loader: "themeLoader" in document.documentElement.dataset,
    }));
    expect(
      cleared.wall === "" &&
        !cleared.mascot &&
        !cleared.list &&
        !cleared.badge &&
        !cleared.loader,
      `pictures after deleting the theme: ${JSON.stringify(cleared).slice(0, 80)}`,
    );
    log("pictured theme drawn on the wall and the empty outlet, then deleted");

    if (failures.length > 0) throw new Error(failures.join("\n"));
  },
};
