import { resolve } from "node:path";
import type { Page } from "playwright-core";
import { domBarrier, responseBarrier } from "../harness/browser-barriers";
import type { Scenario } from "../harness/runner";

/** DESIGN.md tokens as Chrome reports them. */
const INK = "rgb(42, 39, 36)";
const BADGE = "rgb(187, 51, 34)";
const BADGE_INK = "rgb(255, 255, 255)";

const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };

/** The row link for a room. The id travels as the wire string; nothing here parses it. */
const hrefFor = (roomId: string) => `#/room/${encodeURIComponent(roomId)}`;

function pngSize(png: Buffer) {
  return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
}

interface RowAudit {
  href: string | null;
  current: boolean;
  readable: boolean;
  active: boolean;
  title: string;
  preview: string;
  text: string;
  badge: string | null;
  /** The visually hidden 데스크톱 기준 안 읽음 N개, the row's accessible count. */
  count: string | null;
  color: string;
  titleColor: string;
  previewColor: string;
  opacity: string;
  display: string;
  height: number;
}

/** Reads every rendered row once: structure, copy, computed colour, geometry. */
function auditRows(page: Page): Promise<RowAudit[]> {
  return page.evaluate(() =>
    [
      ...document.querySelectorAll<HTMLElement>(
        'nav[data-ui="rooms-pane"] [data-ui="room-row"]',
      ),
    ].map((row) => {
      const link = row.querySelector("a");
      const parts = link ? ([...link.children] as HTMLElement[]) : [];
      const title = parts[0];
      const preview = parts[2];
      const badge = row.querySelector('[data-ui="unread-badge"]');
      const style = link ? getComputedStyle(link) : null;
      return {
        href: link?.getAttribute("href") ?? null,
        current: link?.getAttribute("aria-current") === "page",
        readable: row.dataset.readable === "true",
        active: row.dataset.active === "true",
        title: title?.textContent ?? "",
        preview: preview?.textContent ?? "",
        text: link?.textContent ?? "",
        badge: badge?.textContent ?? null,
        count: row.querySelector(".sr-only")?.textContent ?? null,
        color: style?.color ?? "",
        titleColor: title ? getComputedStyle(title).color : "",
        previewColor: preview ? getComputedStyle(preview).color : "",
        opacity: style?.opacity ?? "",
        display: getComputedStyle(row).display,
        height: row.getBoundingClientRect().height,
      };
    }),
  );
}

function rowFor(page: Page, roomId: string) {
  return page.locator('nav[data-ui="rooms-pane"] [data-ui="room-row"]', {
    has: page.locator(`a[href="${hrefFor(roomId)}"]`),
  });
}

function filterChip(page: Page, label: string) {
  return page.locator('nav[data-ui="rooms-pane"] label', { hasText: label });
}

function layout(page: Page) {
  return page.evaluate(() => {
    const nav = document.querySelector<HTMLElement>(
      'nav[data-ui="rooms-pane"]',
    );
    const main = document.querySelector<HTMLElement>("main");
    const scroller = document.querySelector<HTMLElement>(
      '[data-ui="room-scroller"]',
    );
    return {
      route:
        document.querySelector('[data-ui="app"]')?.getAttribute("data-route") ??
        null,
      navDisplay: nav ? getComputedStyle(nav).display : null,
      mainDisplay: main ? getComputedStyle(main).display : null,
      heading: main?.querySelector("h1")?.textContent ?? null,
      backLink: Boolean(main?.querySelector('a[href="#/rooms"]')),
      windowY: window.scrollY,
      listTop: scroller?.scrollTop ?? -1,
      documentHeight: document.documentElement.scrollHeight,
      innerHeight: window.innerHeight,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      current: [...document.querySelectorAll('nav a[aria-current="page"]')].map(
        (link) => link.getAttribute("href"),
      ),
      activeRows: document.querySelectorAll(
        '[data-ui="room-row"][data-active="true"]',
      ).length,
      chipHeights: [
        ...document.querySelectorAll<HTMLElement>(
          'nav[data-ui="rooms-pane"] label',
        ),
      ].map((chip) => chip.getBoundingClientRect().height),
    };
  });
}

/**
 * Catalog, people filter and hash navigation against the synthetic bridge:
 * one /rooms and no /context on first paint, unreadable rooms at full ink with
 * their reason, exact-or-99+ badges with the real count in the accessible name,
 * and row clicks that carry the room id through the hash as an opaque string.
 */
export const scenario: Scenario = {
  id: "rooms-navigation",
  async run({ page, bridge, url, log, evidence }) {
    const failures: string[] = [];
    const fail = (message: string) => failures.push(message);
    const report: Record<string, unknown> = {};
    const shot = async (
      name: string,
      expected: { width: number; height: number },
    ) => {
      const png = await page.screenshot({
        path: resolve(evidence, `${name}.png`),
        fullPage: true,
        timeout: 10_000,
      });
      const size = pngSize(png);
      log("screenshot", { file: `${name}.png`, ...size });
      if (size.width !== expected.width || size.height !== expected.height)
        fail(
          `${name}.png is ${size.width}x${size.height}, expected ${expected.width}x${expected.height}; the shell must not scroll`,
        );
    };

    // The browser-side request ledger is armed before the first navigation.
    const requests: { path: string; roomId: string | null }[] = [];
    page.on("request", (request) => {
      const target = new URL(request.url());
      if (target.pathname.startsWith("/api/"))
        requests.push({
          path: target.pathname,
          roomId: target.searchParams.get("roomId"),
        });
    });
    const count = (path: string) =>
      requests.filter((request) => request.path === path).length;

    const rooms = bridge.data.rooms;
    const readable = rooms.filter((room) => room.readable);
    const unreadable = rooms.filter((room) => !room.readable);
    const direct = rooms.filter((room) => room.kind === "direct");
    const unreadCounts = new Map<number, number>();
    for (const room of rooms)
      unreadCounts.set(room.unread, (unreadCounts.get(room.unread) ?? 0) + 1);
    const over99 = readable.find(
      (room) => room.unread > 99 && unreadCounts.get(room.unread) === 1,
    );
    const within = readable.find(
      (room) => room.unread >= 1 && room.unread <= 99,
    );
    const zero = readable.find((room) => room.unread === 0);
    const target = rooms[0];
    if (!over99 || !within || !target || unreadable.length === 0)
      throw new Error("Fixture lacks the rooms this scenario needs");

    // First paint: the catalog request is the only one.
    const roomsServed = bridge.events.expect(
      (event) => event.type === "response" && event.path === "/rooms",
      "fixture rooms response",
    );
    const roomsResponse = responseBarrier(page, "/api/rooms");
    await page.goto(`${url}/#/rooms`, { waitUntil: "load" });
    await Promise.all([roomsServed, roomsResponse]);
    await (
      await domBarrier(page, 'nav[data-ui="rooms-pane"] [data-ui="room-row"]')
    ).wait();
    report.firstPaint = {
      browserRooms: count("/api/rooms"),
      browserContext: count("/api/context"),
      bridgeRooms: bridge.requests.filter((r) => r.path === "/rooms").length,
      bridgeContext: bridge.requests.filter((r) => r.path === "/context")
        .length,
    };
    log("first-paint-requests", report.firstPaint as Record<string, unknown>);
    if (count("/api/rooms") !== 1)
      fail(`first paint issued ${count("/api/rooms")} /rooms requests, not 1`);
    if (count("/api/context") !== 0)
      fail(
        `first paint issued ${count("/api/context")} /context requests; previews may not be fetched per room`,
      );

    const rows = await auditRows(page);
    report.rows = rows.length;
    if (rows.length !== rooms.length)
      fail(`rendered ${rows.length} rows for a catalog of ${rooms.length}`);
    for (const room of rooms)
      if (!rows.some((row) => row.href === hrefFor(room.id)))
        fail(`no row links to ${hrefFor(room.id)}`);
    if (rows.some((row) => row.current))
      fail("a row is aria-current on the index route");
    if (rows.some((row) => row.display === "none"))
      fail("a row is hidden; unreadable rooms are listed, never hidden");
    const previews = rows.filter((row) => row.readable);
    if (previews.length !== readable.length)
      fail(`${previews.length} readable rows for ${readable.length} rooms`);
    // An unobserved room shows no preview line at all; the absence is the state.
    for (const row of previews)
      if (row.preview.trim() !== "")
        fail(`readable row ${row.title} previews "${row.preview}"`);
    // Must match the CURRENT generated body marker in tests/fixtures/data.ts ("가상 등불 N번, ...").
    // If the fixture wording changes, update this too: a guard that can no longer match is a
    // dead assertion that silently stops catching the preview fan-out it exists to catch.
    if (rows.some((row) => /가상 등불/.test(row.text)))
      fail("a row shows a message body that was never observed");

    // Unreadable rooms: listed at full ink. The core opens a room on demand for
    // its key, so the row states no reason and is an ordinary row.
    const unreadableRows = rows.filter((row) => !row.readable);
    if (unreadableRows.length !== unreadable.length)
      fail(
        `${unreadableRows.length} unreadable rows for ${unreadable.length} rooms`,
      );
    for (const row of unreadableRows) {
      if (row.preview.trim() !== "")
        fail(`unreadable row ${row.title} reads "${row.preview}"`);
      if (
        row.color !== INK ||
        row.titleColor !== INK ||
        row.previewColor !== INK
      )
        fail(
          `unreadable row ${row.title} is not full ink: ${row.color} / ${row.titleColor} / ${row.previewColor}`,
        );
      if (row.opacity !== "1")
        fail(`unreadable row ${row.title} is dimmed to opacity ${row.opacity}`);
    }

    // Badges: exact 1..99, 99+ above, the real count in the accessible name.
    const over = rows.find((row) => row.href === hrefFor(over99.id));
    if (over?.badge !== "99+")
      fail(`room with ${over99.unread} unread shows badge ${over?.badge}`);
    const named = page.getByRole("link", {
      name: `데스크톱 기준 안 읽음 ${over99.unread}개`,
    });
    if ((await named.count()) !== 1)
      fail(`accessible name with the real count ${over99.unread} not found`);
    else if ((await named.getAttribute("href")) !== hrefFor(over99.id))
      fail("the accessible count belongs to the wrong row");
    const exact = rows.find((row) => row.href === hrefFor(within.id));
    if (exact?.badge !== String(within.unread))
      fail(`room with ${within.unread} unread shows badge ${exact?.badge}`);
    if (zero) {
      const none = rows.find((row) => row.href === hrefFor(zero.id));
      if (none?.badge !== null) fail("a room with 0 unread shows a badge");
    } else report.zeroUnreadRoom = "fixture has none; check skipped";
    const badge = await page
      .locator('nav[data-ui="rooms-pane"] [data-ui="unread-badge"]')
      .first()
      .evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          background: style.backgroundColor,
          color: style.color,
          hidden: element.getAttribute("aria-hidden"),
        };
      });
    report.badge = badge;
    if (badge.background !== BADGE || badge.color !== BADGE_INK)
      fail(`badge paints ${badge.color} on ${badge.background}`);
    await shot("rooms-navigation-1440x900", DESKTOP);

    // The list scrolls on its own; the shell never does.
    const firstUnreadable = unreadable[0];
    if (!firstUnreadable) throw new Error("unreachable");
    await rowFor(page, firstUnreadable.id).scrollIntoViewIfNeeded();
    const scrolled = await layout(page);
    report.scroll = scrolled;
    if (scrolled.windowY !== 0)
      fail("the document scrolled; the list column must own its scroll");
    if (scrolled.listTop <= 0)
      fail("the list did not scroll to reveal the unreadable row");
    if (scrolled.documentHeight > scrolled.innerHeight)
      fail("the shell is taller than the viewport");
    await shot("rooms-navigation-1440x900-unreadable", DESKTOP);

    // People: the direct rooms and nothing else, with no request of any kind.
    const peopleBarrier = await domBarrier(
      page,
      'nav[data-ui="rooms-pane"][data-filter="people"]',
    );
    await filterChip(page, "사람").click();
    await peopleBarrier.wait();
    const people = await auditRows(page);
    report.people = people.length;
    if (people.length !== direct.length)
      fail(
        `people filter lists ${people.length} rows for ${direct.length} direct rooms`,
      );
    for (const row of people)
      if (!direct.some((room) => hrefFor(room.id) === row.href))
        fail(`people filter lists a non-direct room: ${row.title}`);
    if (!(await page.getByRole("radio", { name: "사람" }).isChecked()))
      fail("the people radio is not checked after selection");
    if (requests.length !== 1)
      fail(`filtering issued ${requests.length - 1} extra API requests`);
    await shot("rooms-navigation-1440x900-people", DESKTOP);
    const allBarrier = await domBarrier(
      page,
      'nav[data-ui="rooms-pane"][data-filter="all"]',
    );
    await filterChip(page, "전체").click();
    await allBarrier.wait();

    // A click carries the exact id string into the hash and marks the row current.
    const before = (await auditRows(page)).find(
      (row) => row.href === hrefFor(target.id),
    );
    const currentBarrier = await domBarrier(
      page,
      `nav a[aria-current="page"][href="${hrefFor(target.id)}"]`,
    );
    await rowFor(page, target.id).locator("a").click();
    await currentBarrier.wait();
    const hash = new URL(page.url()).hash;
    report.hash = hash;
    if (hash !== `#/room/${target.id}`)
      fail(`hash is ${hash}, expected #/room/${target.id}`);
    const opened = await layout(page);
    report.opened = opened;
    if (opened.current.length !== 1 || opened.current[0] !== hrefFor(target.id))
      fail(`aria-current rows: ${JSON.stringify(opened.current)}`);
    if (opened.activeRows !== 1)
      fail(`${opened.activeRows} rows are marked active`);
    if (opened.route !== "room") fail(`shell route is ${opened.route}`);
    if (opened.heading !== target.title)
      fail(`main heading is "${opened.heading}", expected the room title`);
    const after = (await auditRows(page)).find(
      (row) => row.href === hrefFor(target.id),
    );
    // The preview may fill in from the bodies /context just observed (G1); the desktop's count may not move (G2).
    if (before?.badge !== after?.badge || before?.count !== after?.count)
      fail("opening a room changed its badge or accessible count");
    const context = requests.filter((r) => r.path === "/api/context");
    report.contextAfterClick = context;
    if (context.some((r) => r.roomId !== target.id))
      fail("a /context request was issued for a room that was not opened");
    if (context.length > 1)
      fail(`${context.length} /context requests for one room open`);
    await shot("rooms-navigation-1440x900-active", DESKTOP);

    // History moves the route without a reload.
    const indexBarrier = await domBarrier(
      page,
      '[data-ui="app"][data-route="rooms"]',
    );
    await page.evaluate(() => history.back());
    await indexBarrier.wait();
    if (new URL(page.url()).hash !== "#/rooms")
      fail(`back landed on ${new URL(page.url()).hash}`);
    if ((await page.locator('nav a[aria-current="page"]').count()) !== 0)
      fail("a row stays aria-current after going back");
    const forwardBarrier = await domBarrier(
      page,
      `nav a[aria-current="page"][href="${hrefFor(target.id)}"]`,
    );
    await page.evaluate(() => history.forward());
    await forwardBarrier.wait();
    if (count("/api/rooms") !== 1)
      fail("history navigation re-requested the catalog");

    // Mobile: one pane at a time, the thread with a way back, the list to the bottom edge.
    await page.setViewportSize(MOBILE);
    const mobileRoom = await layout(page);
    report.mobileRoom = mobileRoom;
    if (mobileRoom.navDisplay !== "none")
      fail("mobile room view still shows the list");
    if (!mobileRoom.backLink)
      fail("mobile room view has no link back to the list");
    await shot("rooms-navigation-390x844-room", MOBILE);
    const backBarrier = await domBarrier(
      page,
      '[data-ui="app"][data-route="rooms"]',
    );
    await page.locator('main a[href="#/rooms"]').click();
    await backBarrier.wait();
    const mobileList = await layout(page);
    const mobileRows = await auditRows(page);
    report.mobileList = {
      ...mobileList,
      minRowHeight: Math.min(...mobileRows.map((row) => row.height)),
    };
    if (mobileList.navDisplay === "none")
      fail("mobile list view hides the list");
    if (mobileList.mainDisplay !== "none")
      fail("mobile list view still shows the thread pane");
    if (mobileList.scrollWidth > mobileList.clientWidth)
      fail(
        `horizontal overflow at 390: ${mobileList.scrollWidth} > ${mobileList.clientWidth}`,
      );
    if (mobileRows.some((row) => row.height < 44))
      fail("a row is below the 44px touch target on mobile");
    if (mobileList.chipHeights.some((height) => height < 44))
      fail("a filter chip is below the 44px touch target on mobile");
    await shot("rooms-navigation-390x844", MOBILE);

    await Bun.write(
      resolve(evidence, "rooms-navigation-report.json"),
      `${JSON.stringify({ failures, ...report }, null, 2)}\n`,
    );
    log("rooms-navigation-audit", { failures: failures.length });
    if (failures.length)
      throw new Error(
        [`${failures.length} rooms contract failure(s):`, ...failures].join(
          "\n - ",
        ),
      );
  },
};
