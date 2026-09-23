import { resolve } from "node:path";
import type { Page } from "playwright-core";
import { generateData } from "../fixtures/data";
import { domBarrier, responseBarrier } from "../harness/browser-barriers";
import type { Scenario } from "../harness/runner";
import { auditRoomsVirtual } from "../visual/rooms-virtual";

const MAX_MOUNTED_ROWS = 60;
const TARGET_INDEX = 501;
const FOCUS_INDEX = 600;

const hrefFor = (roomId: string) => `#/room/${encodeURIComponent(roomId)}`;

function rowLink(page: Page, roomId: string) {
  return page.locator(`nav[data-ui="rooms-pane"] a[href="${hrefFor(roomId)}"]`);
}

async function scrollToRoom(page: Page, index: number) {
  await page.evaluate((top) => {
    const scroller = document.querySelector<HTMLElement>(
      '[data-ui="room-scroller"]',
    );
    if (!scroller) throw new Error("Missing room scroller");
    scroller.scrollTop = top;
    scroller.dispatchEvent(new Event("scroll"));
  }, index * 68);
}

/**
 * The catalog stress path: room ids remain opaque strings while a 1000-room
 * catalog recycles semantic rows. Selection and keyboard focus must survive
 * recycling, filtering, and hash-history navigation.
 */
export const scenario: Scenario = {
  id: "rooms-virtual",
  async run({ page, bridge, url, evidence, log, screenshot }) {
    const failures: string[] = [];
    const fail = (message: string) => failures.push(message);
    const stress = generateData("stress");
    bridge.data.rooms.splice(0, bridge.data.rooms.length, ...stress.rooms);
    bridge.data.messages.clear();
    for (const [roomId, messages] of stress.messages)
      bridge.data.messages.set(roomId, messages);

    const selected = stress.rooms[TARGET_INDEX];
    const focused = stress.rooms[FOCUS_INDEX];
    if (!selected || !focused || selected.kind !== "direct")
      throw new Error("Stress fixture lacks the selected direct rooms");

    const roomsResponse = responseBarrier(page, "/api/rooms");
    await page.goto(`${url}/#/rooms`, { waitUntil: "load" });
    await roomsResponse;
    await (await domBarrier(page, '[data-ui="room-row"]')).wait();

    const mountedCounts: number[] = [];
    const initial = await auditRoomsVirtual(page);
    mountedCounts.push(initial.mounted);
    if (!initial.virtualized) fail("1000 rooms did not enter virtual mode");
    if (initial.mounted > MAX_MOUNTED_ROWS)
      fail(
        `1000 rooms mounted ${initial.mounted} semantic rows; maximum is ${MAX_MOUNTED_ROWS}`,
      );

    // Move to an offscreen direct room, then select it using its exact string id.
    const selectedBarrier = await domBarrier(
      page,
      `nav a[href="${hrefFor(selected.id)}"]`,
    );
    await scrollToRoom(page, TARGET_INDEX);
    await selectedBarrier.wait();
    const currentBarrier = await domBarrier(
      page,
      `nav a[aria-current="page"][href="${hrefFor(selected.id)}"]`,
    );
    await rowLink(page, selected.id).click();
    await currentBarrier.wait();
    const afterSelection = await auditRoomsVirtual(page);
    mountedCounts.push(afterSelection.mounted);
    if (afterSelection.activeId !== hrefFor(selected.id))
      fail("selection lost the opaque room id after recycling");
    if (
      afterSelection.activeHeight === null ||
      afterSelection.activeHeight < 24 ||
      afterSelection.activeDivider !== "rgba(0, 0, 0, 0)"
    )
      fail(
        `active doorway is not an actual >=24px divider break: ${JSON.stringify({ height: afterSelection.activeHeight, divider: afterSelection.activeDivider })}`,
      );

    // Focus a different offscreen row, recycle it out of view, and retain the same DOM focus target.
    const focusedBarrier = await domBarrier(
      page,
      `nav a[href="${hrefFor(focused.id)}"]`,
    );
    await scrollToRoom(page, FOCUS_INDEX);
    await focusedBarrier.wait();
    await rowLink(page, focused.id).focus();
    await scrollToRoom(page, 0);
    const afterRecycle = await auditRoomsVirtual(page);
    mountedCounts.push(afterRecycle.mounted);
    if (afterRecycle.focusedHref !== hrefFor(focused.id))
      fail("focus moved when its row recycled out of view");
    if (!afterRecycle.ids.includes(hrefFor(focused.id)))
      fail("the focused room was unmounted during recycling");
    if (afterRecycle.activeId !== hrefFor(selected.id))
      fail("selection moved while preserving a different focused row");

    // The selected direct room remains selected through filtering and hash back/forward.
    const peopleBarrier = await domBarrier(
      page,
      'nav[data-ui="rooms-pane"][data-filter="people"]',
    );
    await page
      .locator('nav[data-ui="rooms-pane"] label', { hasText: "사람" })
      .click();
    await peopleBarrier.wait();
    const people = await auditRoomsVirtual(page);
    mountedCounts.push(people.mounted);
    if (people.activeId !== hrefFor(selected.id))
      fail("selection was lost after filtering to people");

    const allBarrier = await domBarrier(
      page,
      'nav[data-ui="rooms-pane"][data-filter="all"]',
    );
    await page
      .locator('nav[data-ui="rooms-pane"] label', { hasText: "전체" })
      .click();
    await allBarrier.wait();
    const all = await auditRoomsVirtual(page);
    mountedCounts.push(all.mounted);
    if (all.activeId !== hrefFor(selected.id))
      fail("selection was lost after restoring the full catalog");

    const roomsBarrier = await domBarrier(
      page,
      '[data-ui="app"][data-route="rooms"]',
    );
    await page.goBack();
    await roomsBarrier.wait();
    const returnBarrier = await domBarrier(
      page,
      `nav a[aria-current="page"][href="${hrefFor(selected.id)}"]`,
    );
    await page.goForward();
    await returnBarrier.wait();
    const afterHistory = await auditRoomsVirtual(page);
    mountedCounts.push(afterHistory.mounted);
    if (afterHistory.activeId !== hrefFor(selected.id))
      fail("selection was lost after browser back and forward");

    const maximumMounted = Math.max(...mountedCounts);
    if (maximumMounted > MAX_MOUNTED_ROWS)
      fail(
        `recycling mounted ${maximumMounted} rows at once; maximum is ${MAX_MOUNTED_ROWS}`,
      );
    await screenshot("rooms-virtual-1000");
    await Bun.write(
      resolve(evidence, "rooms-virtual-report.json"),
      `${JSON.stringify(
        {
          failures,
          rooms: stress.rooms.length,
          mountedCounts,
          maximumMounted,
          selectedId: selected.id,
          focusedId: focused.id,
        },
        null,
        2,
      )}\n`,
    );
    log("rooms-virtual-audit", { failures: failures.length, maximumMounted });
    if (failures.length)
      throw new Error(
        [
          `${failures.length} room virtualization failure(s):`,
          ...failures,
        ].join("\n - "),
      );
  },
};
