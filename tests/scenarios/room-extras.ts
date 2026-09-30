import { resolve } from "node:path";
import type { Page } from "playwright-core";
import { domBarrier, responseBarrier } from "../harness/browser-barriers";
import type { Scenario } from "../harness/runner";

const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };
const hrefFor = (roomId: string) => `#/room/${encodeURIComponent(roomId)}`;

function answered(page: Page, path: string, status = 200) {
  return page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === `/api${path}` &&
      response.status() === status,
    { timeout: 10_000 },
  );
}

/**
 * The openapi.json 0.15.0 reads against the synthetic bridge, in real Chrome:
 * the pinned notice under the header, reactions, 수정됨 opening
 * `/revisions`, a SafeBot-covered body, 파일 받기 through `/file`, and 모아보기
 * with its kind filter. A 503 on `/notice` is said with a retry; nothing
 * overflows at 390px.
 */
export const scenario: Scenario = {
  id: "room-extras",
  async run({ page, bridge, url, evidence, log }) {
    const failures: string[] = [];
    const fail = (message: string) => failures.push(message);
    const room = bridge.data.rooms[1];
    const rows = room ? bridge.data.messages.get(room.id) : undefined;
    const newest = rows?.at(-1);
    if (!room || !rows || !newest || !bridge.data.notices.has(room.id))
      throw new Error("Fixture lacks the room with the 0.15.0 extras");
    const shot = async (name: string) => {
      await page.screenshot({
        path: resolve(evidence, `${name}.png`),
        fullPage: true,
        timeout: 10_000,
      });
      log("screenshot", { file: `${name}.png` });
    };

    const rooms = responseBarrier(page, "/api/rooms");
    await page.goto(`${url}/#/rooms`, { waitUntil: "load" });
    await rooms;
    const notice = answered(page, "/notice");
    const bar = await domBarrier(page, '[data-ui="notice"]');
    const wall = await domBarrier(
      page,
      `[data-ui="thread-wall"] [data-message-id="${newest.id}"]`,
    );
    await page
      .locator(`nav[data-ui="rooms-pane"] a[href="${hrefFor(room.id)}"]`)
      .click();
    await notice;
    await bar.wait();
    await wall.wait();

    const seen = await page.evaluate(() => ({
      notice: document.querySelector('[data-ui="notice"]')?.textContent ?? "",
      reactions: [...document.querySelectorAll('[data-ui="reactions"] li')].map(
        (item) => item.textContent ?? "",
      ),
      edited: document.querySelectorAll('button[data-ui="edited"]').length,
      covered: document.querySelector('[data-ui="covered"]')?.textContent ?? "",
      files: document.querySelectorAll('[data-ui="file-download"]').length,
    }));
    log("seen", seen);
    if (!seen.notice.includes("가상 공지")) fail("the notice bar is missing");
    if (seen.reactions.length !== 3) fail(`reactions: ${seen.reactions}`);
    if (seen.edited !== 1) fail(`edited controls: ${seen.edited}`);
    if (seen.covered !== "세이프봇이 가린 메시지입니다")
      fail(`covered reads ${seen.covered}`);
    if (seen.files !== 1) fail(`file controls: ${seen.files}`);
    await shot("room-extras-1440x900");

    // 수정됨 → the versions, oldest first.
    const revisions = answered(page, "/revisions");
    const list = await domBarrier(page, '[data-ui="revisions-list"] li');
    await page.locator('button[data-ui="edited"]').click();
    await revisions;
    await list.wait();
    const versions = await page
      .locator('[data-ui="revisions-list"] li')
      .count();
    if (versions !== 2) fail(`revisions listed ${versions}`);
    await shot("room-extras-revisions");
    await page.keyboard.press("Escape");

    // 파일 받기: the bytes arrive as a download and the row says so.
    const file = answered(page, "/file");
    const download = page.waitForEvent("download", { timeout: 10_000 });
    const saved = await domBarrier(
      page,
      '[data-ui="thread-wall"] [data-ui="file-download"][data-phase="saved"]',
    );
    await page
      .locator('[data-ui="thread-wall"] [data-ui="file-download"] button')
      .click();
    await file;
    const got = await download;
    await saved.wait();
    if (got.suggestedFilename() !== "가상 관측 보고서.txt")
      fail(`downloaded as ${got.suggestedFilename()}`);

    // 모아보기, then only files.
    const first = answered(page, "/attachments");
    const sheet = await domBarrier(
      page,
      'dialog[data-ui="attachments"][open] [data-ui="attachments-scope"]',
    );
    await page.locator('[data-ui="attachments-open"]').click();
    await first;
    await sheet.wait();
    const kinds = await page
      .locator('[data-ui="attachments-rows"] [data-ui="attachment"]')
      .evaluateAll((items) =>
        items.map((item) => item.getAttribute("data-kind")),
      );
    if (kinds.join() !== "file,link") fail(`attachments: ${kinds}`);
    await shot("room-extras-attachments");
    const filtered = answered(page, "/attachments");
    const onlyFiles = await domBarrier(
      page,
      '[data-ui="attachments-kind"][data-kind="file"][aria-pressed="true"]',
    );
    await page
      .locator('[data-ui="attachments-kind"][data-kind="file"]')
      .click();
    const filteredUrl = new URL((await filtered).url());
    await onlyFiles.wait();
    if (filteredUrl.searchParams.get("kind") !== "file")
      fail(`filter sent ${filteredUrl.search}`);

    await page.setViewportSize(MOBILE);
    await shot("room-extras-attachments-390x844");
    await page.keyboard.press("Escape");
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    );
    if (overflow) fail("horizontal overflow at 390px");
    await shot("room-extras-390x844");

    // A refused notice is said, with one retry, and the retry is answered.
    await page.setViewportSize(DESKTOP);
    bridge.failNext("/notice", 503);
    const back = await domBarrier(page, 'nav[data-ui="rooms-pane"]');
    await page.goto(`${url}/#/rooms`, { waitUntil: "load" });
    await back.wait();
    const refused = await domBarrier(page, '[data-ui="notice-failed"]');
    await page
      .locator(`nav[data-ui="rooms-pane"] a[href="${hrefFor(room.id)}"]`)
      .click();
    await refused.wait();
    const retried = answered(page, "/notice");
    const recovered = await domBarrier(page, '[data-ui="notice"]');
    await page.locator('[data-ui="notice-failed"] button').click();
    await retried;
    await recovered.wait();

    await Bun.write(
      resolve(evidence, "room-extras-report.json"),
      `${JSON.stringify({ failures, seen }, null, 2)}\n`,
    );
    if (failures.length)
      throw new Error(
        [`${failures.length} room-extras failure(s):`, ...failures].join(
          "\n - ",
        ),
      );
  },
};
