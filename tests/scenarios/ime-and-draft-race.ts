import type { Page } from "playwright-core";
import { FIRST_ROOM_ID } from "../fixtures/data";
import { domBarrier } from "../harness/browser-barriers";
import type { Scenario } from "../harness/runner";

const FIRST_ROOM = FIRST_ROOM_ID;
const SECOND_ROOM = "18491246151592762";
const FIRST_DRAFT = "첫 방의 한글 초안\n공백도 남깁니다 ";
const SECOND_DRAFT = "둘째 방의 다른 초안";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function contextResponse(page: Page, roomId: string) {
  return page.waitForResponse(
    (response) => {
      const url = new URL(response.url());
      return (
        url.pathname === "/api/context" &&
        url.searchParams.get("roomId") === roomId
      );
    },
    { timeout: 10_000 },
  );
}

async function navigateRoom(page: Page, url: string, roomId: string) {
  const response = contextResponse(page, roomId);
  const input = await domBarrier(page, '[data-ui="composer-input"]');
  await page.goto(`${url}/#/room/${roomId}`);
  await Promise.all([response, input.wait()]);
}

/** Chrome's IME protocol drives a real Hangul composition, then room changes race local drafts. */
export const scenario: Scenario = {
  id: "ime-and-draft-race",
  async run({ bridge, page, url, log }) {
    const rooms = page.waitForResponse(
      (response) => new URL(response.url()).pathname === "/api/rooms",
      { timeout: 10_000 },
    );
    await page.goto(`${url}/#/rooms`);
    await rooms;
    const firstContext = contextResponse(page, FIRST_ROOM);
    const inputReady = await domBarrier(page, '[data-ui="composer-input"]');
    await page.evaluate((roomId) => {
      window.location.hash = `#/room/${roomId}`;
    }, FIRST_ROOM);
    await Promise.all([firstContext, inputReady.wait()]);

    const input = page.locator('[data-ui="composer-input"]');
    await input.focus();
    const session = await page.context().newCDPSession(page);
    await session.send("Input.imeSetComposition", {
      text: "한글",
      selectionStart: 2,
      selectionEnd: 2,
      replacementStart: 0,
      replacementEnd: 0,
    });
    // Enter commits the active Korean IME composition. It must not ask /send.
    await page.keyboard.press("Enter");
    await session.send("Input.imeSetComposition", {
      text: "",
      selectionStart: 0,
      selectionEnd: 0,
      replacementStart: 0,
      replacementEnd: 0,
    });
    // A committing key can also be reported after compositionend. It carries
    // the IME's own keyCode wherever it lands, and is not a send either. A
    // plain Enter here would be the person's, and the fill below proves that
    // one still reaches /send.
    await session.send("Input.dispatchKeyEvent", {
      type: "keyDown",
      key: "Enter",
      code: "Enter",
      windowsVirtualKeyCode: 229,
      nativeVirtualKeyCode: 229,
    });
    await session.detach();
    assert(
      bridge.requests.filter((request) => request.path === "/send").length ===
        0,
      "a real Hangul composition Enter reached /send",
    );

    await input.fill(FIRST_DRAFT);
    const preview = page.waitForResponse(
      (response) => new URL(response.url()).pathname === "/api/send",
      { timeout: 10_000 },
    );
    const confirmation = await domBarrier(
      page,
      '[data-ui="composer-confirmation"]',
    );
    await input.press("Enter");
    await Promise.all([preview, confirmation.wait()]);

    await navigateRoom(page, url, SECOND_ROOM);
    const secondInput = page.locator('[data-ui="composer-input"]');
    assert(
      (await secondInput.inputValue()) === "",
      "room switch copied another room draft",
    );
    assert(
      (await page.locator('[data-ui="composer-confirmation"]').count()) === 0,
      "room switch retained consent",
    );
    await secondInput.fill(SECOND_DRAFT);

    await navigateRoom(page, url, FIRST_ROOM);
    assert(
      (await page.locator('[data-ui="composer-input"]').inputValue()) ===
        FIRST_DRAFT,
      "room switch or incoming context cleared the first local draft",
    );
    assert(
      (await page.locator('[data-ui="composer-confirmation"]').count()) === 0,
      "returning to a room revived stale consent",
    );
    log("hangul-ime-zero-send-and-room-drafts-preserved", {
      firstRoom: FIRST_ROOM,
      secondRoom: SECOND_ROOM,
    });
  },
};
