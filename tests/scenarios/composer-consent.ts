import { FIRST_ROOM_ID } from "../fixtures/data";
import { domBarrier } from "../harness/browser-barriers";
import type { Scenario } from "../harness/runner";

const ROOM_ID = FIRST_ROOM_ID;
const FIRST = "  첫 초안은 공백과\n줄바꿈을 그대로 둡니다.  ";
const SECOND = "  바꾼 초안도\n그대로 보냅니다.  ";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function sendRequest(
  page: Parameters<Scenario["run"]>[0]["page"],
  dryRun: boolean,
) {
  return page.waitForRequest(
    (request) => {
      if (new URL(request.url()).pathname !== "/api/send") return false;
      if (request.method() !== "POST") return false;
      const body = request.postDataJSON() as { dryRun?: unknown } | null;
      return body?.dryRun === dryRun;
    },
    { timeout: 10_000 },
  );
}

function sendResponse(page: Parameters<Scenario["run"]>[0]["page"]) {
  return page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/api/send" &&
      response.status() === 200,
    { timeout: 10_000 },
  );
}

/** A dry run exposes the resolved room and destruction warning before a real POST. */
export const scenario: Scenario = {
  id: "composer-consent",
  async run({ page, url, log }) {
    const rooms = page.waitForResponse(
      (response) => new URL(response.url()).pathname === "/api/rooms",
      { timeout: 10_000 },
    );
    await page.goto(`${url}/#/rooms`);
    await rooms;
    const context = page.waitForResponse(
      (response) => {
        const requestUrl = new URL(response.url());
        return (
          requestUrl.pathname === "/api/context" &&
          requestUrl.searchParams.get("roomId") === ROOM_ID
        );
      },
      { timeout: 10_000 },
    );
    // This is a hash-only transition, so the MutationObserver is subscribed before the route changes.
    const composer = await domBarrier(page, '[data-ui="composer-input"]');
    await page.evaluate((roomId) => {
      window.location.hash = `#/room/${roomId}`;
    }, ROOM_ID);
    await Promise.all([context, composer.wait()]);

    const input = page.locator('[data-ui="composer-input"]');
    await input.fill(FIRST);
    const firstRequest = sendRequest(page, true);
    const firstResponse = sendResponse(page);
    const firstConfirmation = await domBarrier(
      page,
      '[data-ui="composer-confirmation"]',
    );
    await input.press("Enter");
    const first = await firstRequest;
    assert(
      JSON.stringify(first.postDataJSON()) ===
        JSON.stringify({
          room: ROOM_ID,
          text: FIRST,
          dryRun: true,
          openRoom: true,
        }),
      "dryRun changed Hangul, spaces, or newlines",
    );
    await firstResponse;
    await firstConfirmation.wait();

    const confirmation = page.locator('[data-ui="composer-confirmation"]');
    const confirmationText = await confirmation.textContent();
    assert(
      confirmationText?.includes("가상 관측소 1") &&
        confirmationText.includes("초안이 지워질 수 있습니다"),
      "confirmation did not expose resolved room and wouldClearDraft warning",
    );
    assert(
      (await page.locator('[data-ui="composer-confirm"]').count()) === 1,
      "real send was not explicitly gated behind consent",
    );

    await input.fill(SECOND);
    assert(
      (await page.locator('[data-ui="composer-confirmation"]').count()) === 0,
      "changing text reused a consent",
    );

    const secondRequest = sendRequest(page, true);
    const secondResponse = sendResponse(page);
    const secondConfirmation = await domBarrier(
      page,
      '[data-ui="composer-confirmation"]',
    );
    await input.press("Enter");
    const second = await secondRequest;
    assert(
      JSON.stringify(second.postDataJSON()) ===
        JSON.stringify({
          room: ROOM_ID,
          text: SECOND,
          dryRun: true,
          openRoom: true,
        }),
      "replacement dryRun did not preserve the changed text",
    );
    await secondResponse;
    await secondConfirmation.wait();

    const postRequest = sendRequest(page, false);
    const postResponse = sendResponse(page);
    await page.locator('[data-ui="composer-confirm"]').click();
    const post = await postRequest;
    assert(
      JSON.stringify(post.postDataJSON()) ===
        JSON.stringify({
          room: ROOM_ID,
          text: SECOND,
          dryRun: false,
          openRoom: true,
        }),
      "real send did not use the consent-bound text",
    );
    await postResponse;
    const submitted = await domBarrier(page, '[data-ui="composer-submitted"]');
    await submitted.wait();
    assert(
      (await input.inputValue()) === "",
      "successful send did not clear only its draft",
    );
    log("consent-voided-and-reconfirmed", { roomId: ROOM_ID });
  },
};
