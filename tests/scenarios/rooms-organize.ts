import { resolve } from "node:path";
import type { Page } from "playwright-core";
import { bounded } from "../harness/barriers";
import { domBarrier, responseBarrier } from "../harness/browser-barriers";
import type { Scenario } from "../harness/runner";

const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };
const PANE = 'nav[data-ui="rooms-pane"]';
const SHEET = 'dialog[data-ui="organize-sheet"]';
const FILTERS = `${PANE} fieldset:not([data-ui])`;
const FOLDERS = `${PANE} [data-ui="room-folders"]`;

const hrefFor = (roomId: string) => `#/room/${encodeURIComponent(roomId)}`;

/** The list as drawn: each row's room link, in order. */
function listed(page: Page) {
  return page.evaluate(
    (pane) =>
      [...document.querySelectorAll(`${pane} [data-ui="room-row"] > a`)].map(
        (link) => link.getAttribute("href"),
      ),
    PANE,
  );
}

function row(page: Page, roomId: string) {
  return page.locator(`${PANE} [data-ui="room-row"]`, {
    has: page.locator(`a[href="${hrefFor(roomId)}"]`),
  });
}

/** Resolves when an element matching the selector shows the text; MutationObserver, never polling. */
async function textBarrier(page: Page, selector: string, text: string) {
  const name = `qaText${crypto.randomUUID().replaceAll("-", "")}`;
  const reached = Promise.withResolvers<void>();
  await page.exposeFunction(name, () => reached.resolve());
  await page.evaluate(
    ({ selector, text, name }) => {
      const matches = () =>
        [...document.querySelectorAll(selector)].some(
          (element) => element.textContent === text,
        );
      const done = () => (Reflect.get(window, name) as () => void)();
      if (matches()) return done();
      const observer = new MutationObserver(() => {
        if (!matches()) return;
        observer.disconnect();
        done();
      });
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    },
    { selector, text, name },
  );
  return {
    wait: () => bounded(reached.promise, `text ${text} in ${selector}`),
  };
}

/**
 * Nothing in the visible layout spills: no document scroll sideways, no chip
 * or sheet past the viewport, and no chip text cut by its own box.
 */
function clipping(page: Page) {
  return page.evaluate(
    ({ folders, sheet }) => {
      const width = document.documentElement.clientWidth;
      const height = window.innerHeight;
      const problems: string[] = [];
      if (document.documentElement.scrollWidth > width)
        problems.push(
          `document scrolls sideways: ${document.documentElement.scrollWidth} > ${width}`,
        );
      for (const chip of document.querySelectorAll<HTMLElement>(
        `${folders} > :not(legend)`,
      )) {
        const text = chip.querySelector("span") ?? chip;
        if (text.scrollWidth > text.clientWidth + 1)
          problems.push(`folder chip text is cut: ${chip.textContent}`);
      }
      const dialog = document.querySelector<HTMLElement>(sheet);
      if (dialog) {
        const box = dialog.getBoundingClientRect();
        if (
          box.left < -0.5 ||
          box.top < -0.5 ||
          box.right > width + 0.5 ||
          box.bottom > height + 0.5
        )
          problems.push(`sheet leaves the viewport: ${JSON.stringify(box)}`);
        if (dialog.scrollWidth > dialog.clientWidth + 1)
          problems.push("sheet scrolls sideways");
      }
      return problems;
    },
    { folders: FOLDERS, sheet: SHEET },
  );
}

async function openMenuByRightClick(page: Page, roomId: string) {
  const open = await domBarrier(page, `${SHEET}[open]`);
  await row(page, roomId).locator("a").click({ button: "right" });
  await open.wait();
}

async function closeSheet(page: Page) {
  const closed = await domBarrier(page, `${PANE}:not(:has(${SHEET}))`);
  await page.keyboard.press("Escape");
  await closed.wait();
}

/**
 * Pin, hide, unhide, make a folder, fill it and switch tabs, all against the
 * synthetic bridge: the arrangement lives in this browser only, so not one API
 * request may follow the first /rooms, and it must survive a reload.
 */
export const scenario: Scenario = {
  id: "rooms-organize",
  async run({ page, bridge, url, log, evidence }) {
    const failures: string[] = [];
    const fail = (message: string) => failures.push(message);
    const report: Record<string, unknown> = {};
    const shot = async (name: string) => {
      await page.screenshot({
        path: resolve(evidence, `${name}.png`),
        timeout: 10_000,
      });
      log("screenshot", { file: `${name}.png` });
    };
    const checkClipping = async (where: string) => {
      for (const problem of await clipping(page)) fail(`${where}: ${problem}`);
    };

    const requests: string[] = [];
    page.on("request", (request) => {
      const target = new URL(request.url());
      if (target.pathname.startsWith("/api/")) requests.push(target.pathname);
    });

    const rooms = bridge.data.rooms;
    const direct = rooms.filter((room) => room.kind === "direct");
    const [first, hiddenRoom, , pinnedRoom, folderRoom] = rooms;
    const directInFolder = direct.find(
      (room) => room.id !== pinnedRoom?.id && room.id !== folderRoom?.id,
    );
    if (!first || !hiddenRoom || !pinnedRoom || !folderRoom || !directInFolder)
      throw new Error("Fixture lacks the rooms this scenario needs");

    await page.setViewportSize(DESKTOP);
    const roomsResponse = responseBarrier(page, "/api/rooms");
    await page.goto(`${url}/#/rooms`, { waitUntil: "load" });
    await roomsResponse;
    await (await domBarrier(page, `${PANE} [data-ui="room-row"]`)).wait();
    const baseline = await listed(page);
    if (baseline[0] !== hrefFor(first.id))
      fail("the list does not start in catalog order");
    if (await page.locator(FOLDERS).count())
      fail("the folder row is drawn before any folder or hidden room exists");
    const apiBefore = requests.length;

    // 1. Pin from the right-click menu: the room moves to the top and says so.
    const unpinnedName = await row(page, pinnedRoom.id)
      .locator("a")
      .textContent();
    await openMenuByRightClick(page, pinnedRoom.id);
    await checkClipping("desktop menu");
    await shot("rooms-organize-1440-menu");
    const pinned = await domBarrier(
      page,
      `${PANE} [data-ui="room-row"]:first-child a[href="${hrefFor(pinnedRoom.id)}"]`,
    );
    await page.locator(`${SHEET} [data-ui="menu-pin"]`).click();
    await pinned.wait();
    const afterPin = await listed(page);
    report.afterPin = afterPin.slice(0, 3);
    if (afterPin.length !== baseline.length)
      fail("pinning changed how many rooms are listed");
    if (
      JSON.stringify(afterPin.slice(1)) !==
      JSON.stringify(baseline.filter((href) => href !== hrefFor(pinnedRoom.id)))
    )
      fail("the unpinned rooms did not keep catalog order");
    const pinnedName = await row(page, pinnedRoom.id)
      .locator("a")
      .textContent();
    if (
      !pinnedName ||
      pinnedName === unpinnedName ||
      !pinnedName.includes(pinnedRoom.title)
    )
      fail("the pinned row does not carry its pinned state in its name");

    // 2. Hide through the row's own menu button, then bring it back from the hidden view.
    await row(page, hiddenRoom.id).hover();
    const menuButton = row(page, hiddenRoom.id).locator(
      '[data-ui="room-menu-button"]',
    );
    const buttonOpacity = await menuButton.evaluate(
      (element) => getComputedStyle(element).opacity,
    );
    if (buttonOpacity !== "1")
      fail(`the row menu button is not shown on hover (${buttonOpacity})`);
    const open = await domBarrier(page, `${SHEET}[open]`);
    await menuButton.click();
    await open.wait();
    const hiddenChip = await domBarrier(
      page,
      `${FOLDERS} [data-ui="hidden-rooms"]`,
    );
    await page.locator(`${SHEET} [data-ui="menu-hide"]`).click();
    await hiddenChip.wait();
    const afterHide = await listed(page);
    if (afterHide.includes(hrefFor(hiddenRoom.id)))
      fail("the hidden room is still listed");
    if (afterHide.length !== baseline.length - 1)
      fail(`hiding one room listed ${afterHide.length} of ${baseline.length}`);
    await shot("rooms-organize-1440-hidden-chip");

    const hiddenView = await domBarrier(page, `${PANE}[data-hidden-view]`);
    await page.locator(`${FOLDERS} [data-ui="hidden-rooms"]`).click();
    await hiddenView.wait();
    const onlyHidden = await listed(page);
    if (onlyHidden.length !== 1 || onlyHidden[0] !== hrefFor(hiddenRoom.id))
      fail(`the hidden view lists ${JSON.stringify(onlyHidden)}`);
    await shot("rooms-organize-1440-hidden-view");
    await openMenuByRightClick(page, hiddenRoom.id);
    const back = await domBarrier(
      page,
      `${PANE}:not([data-hidden-view]):not(:has([data-ui="room-folders"]))`,
    );
    await page.locator(`${SHEET} [data-ui="menu-hide"]`).click();
    await back.wait();
    if ((await listed(page)).length !== baseline.length)
      fail("unhiding did not bring the room back to the full list");

    // 3. Make a folder from a room's menu, and put two more rooms in it.
    await openMenuByRightClick(page, folderRoom.id);
    const tabs = await domBarrier(page, FOLDERS);
    await page.locator(`${SHEET} input[name="name"]`).fill("업무");
    await page.keyboard.press("Enter");
    await tabs.wait();
    if (!(await page.locator(`${SHEET} input[type="checkbox"]`).isChecked()))
      fail("the room is not in the folder its menu just made");
    await closeSheet(page);
    for (const roomId of [pinnedRoom.id, directInFolder.id]) {
      await openMenuByRightClick(page, roomId);
      await page.locator(`${SHEET} input[type="checkbox"]`).check();
      await closeSheet(page);
    }

    // 4. Switch to the folder tab: its rooms only, the pin still first.
    const folderTab = await domBarrier(page, `${PANE}[data-folder]`);
    await page.locator(`${FOLDERS} label`).nth(1).click();
    await folderTab.wait();
    const inFolder = await listed(page);
    const expected = [
      hrefFor(pinnedRoom.id),
      ...baseline.filter(
        (href) =>
          href === hrefFor(folderRoom.id) ||
          href === hrefFor(directInFolder.id),
      ),
    ];
    report.inFolder = inFolder;
    if (JSON.stringify(inFolder) !== JSON.stringify(expected))
      fail(
        `folder tab lists ${JSON.stringify(inFolder)}, expected ${JSON.stringify(expected)}`,
      );
    await checkClipping("desktop folder tab");
    await shot("rooms-organize-1440-folder");

    // 5. The folder and the people filter narrow together.
    const people = await domBarrier(page, `${PANE}[data-filter="people"]`);
    await page
      .locator(`${FILTERS} label`, {
        has: page.locator('input[value="people"]'),
      })
      .click();
    await people.wait();
    const both = await listed(page);
    const directIds = new Set<string | null>(
      direct.map((room) => hrefFor(room.id)),
    );
    const expectedBoth = expected.filter((href) => directIds.has(href));
    report.folderAndPeople = both;
    if (expectedBoth.length === 0 || expectedBoth.length === expected.length)
      throw new Error("Fixture cannot tell an intersection from either side");
    if (JSON.stringify(both) !== JSON.stringify(expectedBoth))
      fail(`folder and people list ${JSON.stringify(both)}`);
    const all = await domBarrier(page, `${PANE}[data-filter="all"]`);
    await page
      .locator(`${FILTERS} label`, {
        has: page.locator('input[value="all"]'),
      })
      .click();
    await all.wait();

    // 6. A reload keeps the arrangement; nothing above asked the server for anything.
    report.apiDuringOrganize = requests.slice(apiBefore);
    if (requests.length !== apiBefore)
      fail(
        `organizing issued API requests: ${JSON.stringify(requests.slice(apiBefore))}`,
      );
    const reloaded = responseBarrier(page, "/api/rooms");
    await page.reload({ waitUntil: "load" });
    await reloaded;
    await (await domBarrier(page, `${FOLDERS} label`)).wait();
    await (await domBarrier(page, `${PANE} [data-ui="room-row"]`)).wait();
    if ((await listed(page))[0] !== hrefFor(pinnedRoom.id))
      fail("the pin did not survive a reload");

    // 7. Phone width: the folder row, then a long press opens the bottom sheet.
    await page.setViewportSize(MOBILE);
    await checkClipping("mobile list");
    await shot("rooms-organize-390-list");
    const box = await row(page, folderRoom.id).boundingBox();
    if (!box) throw new Error("folder room row has no box");
    const sheet = await domBarrier(page, `${SHEET}[open]`);
    await row(page, folderRoom.id)
      .locator("a")
      .dispatchEvent("pointerdown", {
        pointerType: "touch",
        clientX: box.x + 40,
        clientY: box.y + box.height / 2,
      });
    await sheet.wait();
    const sheetBox = await page.locator(SHEET).boundingBox();
    report.mobileSheet = sheetBox;
    if (
      !sheetBox ||
      Math.abs(sheetBox.width - MOBILE.width) > 1 ||
      Math.abs(sheetBox.y + sheetBox.height - MOBILE.height) > 1
    )
      fail(`mobile menu is not a bottom sheet: ${JSON.stringify(sheetBox)}`);
    const small = await page.evaluate(
      (sheet) =>
        [
          ...document.querySelectorAll<HTMLElement>(
            `${sheet} button, ${sheet} input:not([type="checkbox"]), ${sheet} label`,
          ),
        ]
          .filter((element) => element.getBoundingClientRect().height < 44)
          .map((element) => element.textContent),
      SHEET,
    );
    if (small.length)
      fail(`mobile sheet targets under 44px: ${JSON.stringify(small)}`);
    await checkClipping("mobile sheet");
    await shot("rooms-organize-390-sheet");
    await closeSheet(page);

    // 8. Folder editor: rename, then delete; the tab row goes away with the last folder.
    await page.setViewportSize(DESKTOP);
    const editor = await domBarrier(page, `${SHEET}[open]`);
    await page.locator(`${FOLDERS} [data-ui="edit-folders"]`).click();
    await editor.wait();
    const renamed = await textBarrier(page, `${FOLDERS} label span`, "개인");
    const name = page.locator(`${SHEET} li input`);
    await name.fill("개인");
    await name.press("Enter");
    await renamed.wait();
    await shot("rooms-organize-1440-editor");
    const gone = await domBarrier(
      page,
      `${PANE}:not(:has([data-ui="room-folders"]))`,
    );
    await page.locator(`${SHEET} li button`).click();
    await gone.wait();
    await closeSheet(page);
    if ((await listed(page))[0] !== hrefFor(pinnedRoom.id))
      fail("deleting a folder touched the pin");

    await Bun.write(
      resolve(evidence, "rooms-organize-report.json"),
      `${JSON.stringify({ failures, ...report }, null, 2)}\n`,
    );
    log("rooms-organize-audit", { failures: failures.length });
    if (failures.length)
      throw new Error(
        [`${failures.length} room organize failure(s):`, ...failures].join(
          "\n - ",
        ),
      );
  },
};
