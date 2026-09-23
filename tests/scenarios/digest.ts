import { resolve } from "node:path";
import type { Page } from "playwright-core";
import type { components } from "../../src/contract/decoded";
import { digestOf, NOTE, sliceFor, syntheticRows } from "../digest/synthetic";
import { domBarrier, responseBarrier } from "../harness/browser-barriers";
import type { Scenario } from "../harness/runner";

type Room = components["schemas"]["Room"];
type Message = components["schemas"]["Message"];

/** DESIGN.md tokens as Chrome reports them. */
const FIELD_WALL = "rgb(203, 221, 233)";
const RULE = "rgb(78, 93, 105)";
/** The sheet's copy, as shipped. */
const OPEN = "발췌";
const JUMP = "대화에서 보기";
const UNLOADED = (shown: number) =>
  `지금 불러온 대화 창(최근 ${shown}개)에는 없는 메시지입니다`;
const EMPTY = "이 기기에 저장된 최근 창에서 골라낼 메시지가 없습니다";
const REFUSED = "브리지가 이 조건을 받지 않았습니다";
const RETRY = "다시 시도";
/** The fixture bridge's own note for its digests. */
const BRIDGE_NOTE = "Synthetic extractive fixture; no model or summary.";
/** Nothing the sheet says on its own may name a model or a summary. */
const FORBIDDEN = /\bAI\b|요약|summar|모델|생성/i;
const DEFAULTS = { span: "30m", limit: "400", highlights: "3" };
const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };
const CHUNK = /\/assets\/DigestSheet-[^/]+\.js$/;

const hrefFor = (roomId: string) => `#/room/${encodeURIComponent(roomId)}`;

function pngSize(png: Buffer) {
  return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
}

type Query = { span: string; limit: string; highlights: string };

/** Response for one room's digest with exactly these parameters, armed before the action that causes it. */
function digestResponse(
  page: Page,
  roomId: string,
  query: Query,
  status = 200,
) {
  return page.waitForResponse(
    (response) => {
      const url = new URL(response.url());
      return (
        url.pathname === "/api/digest" &&
        url.searchParams.get("roomId") === roomId &&
        url.searchParams.get("span") === query.span &&
        url.searchParams.get("limit") === query.limit &&
        url.searchParams.get("highlights") === query.highlights &&
        response.status() === status
      );
    },
    { timeout: 10_000 },
  );
}

function contextResponse(page: Page, roomId: string) {
  return page.waitForResponse(
    (response) => {
      const url = new URL(response.url());
      return (
        url.pathname === "/api/context" &&
        url.searchParams.get("roomId") === roomId &&
        response.status() === 200
      );
    },
    { timeout: 10_000 },
  );
}

interface HighlightAudit {
  id: string;
  loaded: string | null;
  /** The jump control's label, or null when none is offered. */
  jump: string | null;
  unloaded: string | null;
  bubble: boolean;
  side: string | null;
}

interface SliceAudit {
  range: string;
  count: string;
  speakers: { name: string; count: string }[];
  keywords: { word: string; count: string }[];
  highlights: HighlightAudit[];
}

interface SheetAudit {
  present: boolean;
  open: boolean;
  heading: string | null;
  room: string | null;
  lead: string | null;
  note: string | null;
  scope: string | null;
  ownText: string;
  status: string | null;
  problems: { field: string | null; text: string }[];
  notice: { code: string | null; text: string; retry: string | null } | null;
  empty: string | null;
  cat: boolean;
  slices: SliceAudit[];
  form: { span: string; limit: string; highlights: string } | null;
  style: {
    background: string;
    borderWidth: string;
    borderColor: string;
    shadow: string;
    radius: string;
  } | null;
  rect: { left: number; top: number; width: number; height: number } | null;
  bodyScroll: { scrollHeight: number; clientHeight: number } | null;
  controls: { label: string; height: number }[];
  dialogs: number;
  opener: { text: string; expanded: string | null; popup: string | null };
  documentScrollWidth: number;
  clientWidth: number;
  innerWidth: number;
  innerHeight: number;
  windowY: number;
}

/** Reads the sheet once: structure, copy, computed colour, geometry. */
function auditSheet(page: Page): Promise<SheetAudit> {
  return page.evaluate(() => {
    const opener = document.querySelector<HTMLElement>(
      '[data-ui="digest-open"]',
    );
    const base = {
      dialogs: document.querySelectorAll("dialog").length,
      opener: {
        text: opener?.textContent ?? "",
        expanded: opener?.getAttribute("aria-expanded") ?? null,
        popup: opener?.getAttribute("aria-haspopup") ?? null,
      },
      documentScrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      windowY: window.scrollY,
    };
    const dialog = document.querySelector<HTMLDialogElement>(
      'dialog[data-ui="digest"]',
    );
    if (!dialog)
      return {
        ...base,
        present: false,
        open: false,
        heading: null,
        room: null,
        lead: null,
        note: null,
        scope: null,
        ownText: "",
        status: null,
        problems: [],
        notice: null,
        empty: null,
        cat: false,
        slices: [],
        form: null,
        style: null,
        rect: null,
        bodyScroll: null,
        controls: [],
      };
    const text = (selector: string) =>
      dialog.querySelector(selector)?.textContent ?? null;
    const labelledBy = dialog.getAttribute("aria-labelledby");
    const note = dialog.querySelector('[data-ui="digest-note"]');
    const style = getComputedStyle(dialog);
    const rect = dialog.getBoundingClientRect();
    const body = dialog.querySelector<HTMLElement>('[data-ui="digest-body"]');
    const notice = dialog.querySelector<HTMLElement>(
      '[data-ui="digest-notice"]',
    );
    const value = (name: string) =>
      dialog.querySelector<HTMLInputElement>(`input[name="${name}"]`)?.value;
    const span = value("span");
    const limit = value("limit");
    const highlights = value("highlights");
    return {
      ...base,
      present: true,
      open: dialog.open,
      heading: labelledBy
        ? (document.getElementById(labelledBy)?.textContent ?? null)
        : null,
      room: dialog.querySelector("header p")?.textContent ?? null,
      lead:
        dialog.querySelector('[data-ui="digest-body"] > p')?.textContent ??
        null,
      note: note?.textContent ?? null,
      scope: text('[data-ui="digest-scope"]'),
      ownText: (dialog.textContent ?? "").replace(note?.textContent ?? "", ""),
      status: text('[data-ui="digest-status"]'),
      problems: [
        ...dialog.querySelectorAll<HTMLElement>(
          '[data-ui="digest-problems"] li',
        ),
      ].map((item) => ({
        field: item.dataset.field ?? null,
        text: item.textContent ?? "",
      })),
      notice: notice
        ? {
            code: notice.dataset.code ?? null,
            text: notice.textContent ?? "",
            retry: notice.querySelector("button")?.textContent ?? null,
          }
        : null,
      empty: text('[data-ui="digest-empty"] p'),
      cat: Boolean(dialog.querySelector('[data-ui="cat"]')),
      slices: [
        ...dialog.querySelectorAll<HTMLElement>('[data-ui="digest-slice"]'),
      ].map((slice) => ({
        range: slice.querySelector("h3")?.textContent ?? "",
        count:
          slice.querySelector('[data-ui="digest-count"]')?.textContent ?? "",
        speakers: [
          ...slice.querySelectorAll<HTMLElement>(
            '[data-ui="digest-speakers"] li',
          ),
        ].map((item) => ({
          name: item.children[0]?.textContent ?? "",
          count: item.children[1]?.textContent ?? "",
        })),
        keywords: [
          ...slice.querySelectorAll<HTMLElement>(
            '[data-ui="digest-keywords"] li',
          ),
        ].map((item) => ({
          word: item.children[0]?.textContent ?? "",
          count: item.children[1]?.textContent ?? "",
        })),
        highlights: [
          ...slice.querySelectorAll<HTMLElement>(
            '[data-ui="digest-highlight"]',
          ),
        ].map((item) => ({
          id: item.dataset.highlightId ?? "",
          loaded: item.dataset.loaded ?? null,
          jump:
            item.querySelector('[data-ui="digest-jump"]')?.textContent ?? null,
          unloaded:
            item.querySelector('[data-ui="digest-unloaded"]')?.textContent ??
            null,
          bubble: Boolean(item.querySelector('[data-ui="message"]')),
          side:
            item.querySelector<HTMLElement>('[data-ui="message"]')?.dataset
              .side ?? null,
        })),
      })),
      form:
        span !== undefined && limit !== undefined && highlights !== undefined
          ? { span, limit, highlights }
          : null,
      style: {
        background: style.backgroundColor,
        borderWidth: style.borderTopWidth,
        borderColor: style.borderTopColor,
        shadow: style.boxShadow,
        radius: style.borderTopLeftRadius,
      },
      rect: {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      },
      bodyScroll: body
        ? { scrollHeight: body.scrollHeight, clientHeight: body.clientHeight }
        : null,
      controls: [...dialog.querySelectorAll<HTMLElement>("button")].map(
        (button) => ({
          label: button.textContent ?? "",
          height: button.getBoundingClientRect().height,
        }),
      ),
    };
  });
}

/** Where a wall row sits relative to the wall's viewport. */
function rowPlacement(page: Page, id: string) {
  return page.evaluate((id) => {
    const wall = document.querySelector<HTMLElement>('[data-ui="thread-wall"]');
    const row = wall?.querySelector<HTMLElement>(`[data-message-id="${id}"]`);
    if (!wall || !row) return null;
    const wallRect = wall.getBoundingClientRect();
    const rowRect = row.getBoundingClientRect();
    return {
      top: rowRect.top,
      bottom: rowRect.bottom,
      wallTop: wallRect.top,
      wallBottom: wallRect.bottom,
      scrollTop: wall.scrollTop,
    };
  }, id);
}

function rowLink(page: Page, roomId: string) {
  return page.locator(`nav[data-ui="rooms-pane"] a[href="${hrefFor(roomId)}"]`);
}

/**
 * The extractive digest against the synthetic bridge, in real Chrome: the sheet
 * and its chunk load only on the first press, the defaults go out as an explicit
 * query, the bridge's note is shown and the sheet's own words never name a model
 * or a summary, a highlight the wall holds jumps to its row, one the wall does not
 * hold is said to be outside the loaded window with no request invented for it,
 * an invalid span or more than 20 highlights is refused before anything is sent,
 * an empty digest is stated as such, and a bridge 400 keeps its code with one retry.
 */
export const scenario: Scenario = {
  id: "digest",
  async run({ page, bridge, url, log, evidence }) {
    const failures: string[] = [];
    const fail = (message: string) => failures.push(message);
    const report: Record<string, unknown> = {};
    const failurePaths: Record<string, unknown> = {};
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

    const readable = bridge.data.rooms.filter((room) => room.readable);
    const [first, second, third, fourth] = readable;
    if (!first || !second || !third || !fourth)
      throw new Error("Fixture lacks the rooms this scenario needs");
    const rowsOf = (room: Room): Message[] => {
      const rows = bridge.data.messages.get(room.id);
      if (!rows?.length) throw new Error("Fixture room lacks its window");
      return rows;
    };

    // Browser-side ledgers, armed before the first navigation.
    const api: { path: string; query: Record<string, string> }[] = [];
    const scripts: string[] = [];
    page.on("request", (request) => {
      const address = new URL(request.url());
      if (address.pathname.startsWith("/api/"))
        api.push({
          path: address.pathname,
          query: Object.fromEntries(address.searchParams.entries()),
        });
      if (address.pathname.endsWith(".js")) scripts.push(request.url());
    });
    const digestRequests = (roomId?: string) =>
      api.filter(
        (entry) =>
          entry.path === "/api/digest" &&
          (roomId === undefined || entry.query.roomId === roomId),
      );
    const contextRequests = (roomId: string) =>
      api.filter(
        (entry) =>
          entry.path === "/api/context" && entry.query.roomId === roomId,
      );
    const chunkLoads = () => scripts.filter((script) => CHUNK.test(script));

    // Synthetic digests for the rooms whose shapes the fixture does not hold.
    type Answer = { status: number; body: unknown };
    const synthetic = new Map<string, () => Answer>();
    await page.route(
      (address) =>
        address.pathname === "/api/digest" &&
        synthetic.has(address.searchParams.get("roomId") ?? ""),
      async (route, request) => {
        const address = new URL(request.url());
        const answer = synthetic.get(address.searchParams.get("roomId") ?? "");
        if (!answer) {
          await route.fallback();
          return;
        }
        const { status, body } = answer();
        log("synthetic-digest", { status });
        await route.fulfill({
          status,
          contentType: "application/json",
          headers: { "cache-control": "no-store" },
          body: JSON.stringify(body),
        });
      },
    );

    const openRoom = async (room: Room) => {
      const rows = rowsOf(room);
      const newest = rows.at(-1);
      if (!newest) throw new Error("unreachable");
      const answered = contextResponse(page, room.id);
      const shown = await domBarrier(
        page,
        `[data-ui="thread-wall"] [data-message-id="${newest.id}"]`,
      );
      await rowLink(page, room.id).click();
      await answered;
      await shown.wait();
      return rows;
    };
    const opener = page.locator('[data-ui="digest-open"]');
    const openSheet = async (
      room: Room,
      query: Query,
      selector: string,
      status = 200,
    ) => {
      const answered = digestResponse(page, room.id, query, status);
      const shown = await domBarrier(
        page,
        `dialog[data-ui="digest"][open] ${selector}`,
      );
      await opener.click();
      await answered;
      await shown.wait();
    };
    const closeSheet = async (how: "escape" | "button") => {
      const closed = await domBarrier(
        page,
        '[data-ui="digest-open"][aria-expanded="false"]',
      );
      if (how === "escape") await page.keyboard.press("Escape");
      else await page.locator('[data-ui="digest-close"]').click();
      await closed.wait();
    };

    // Catalog, then the first room. Nothing about the digest has loaded or been asked.
    const roomsResponse = responseBarrier(page, "/api/rooms");
    await page.goto(`${url}/#/rooms`, { waitUntil: "load" });
    await roomsResponse;
    await (
      await domBarrier(page, 'nav[data-ui="rooms-pane"] [data-ui="room-row"]')
    ).wait();
    const firstRows = await openRoom(first);
    if (digestRequests().length !== 0)
      fail("opening a room issued a /digest request before anyone asked");
    if (chunkLoads().length !== 0)
      fail("the digest chunk loaded before the sheet was opened");
    const idle = await auditSheet(page);
    report.idle = { opener: idle.opener, dialogs: idle.dialogs };
    if (idle.dialogs !== 0) fail("a dialog exists before the sheet is opened");
    if (idle.opener.text !== OPEN || idle.opener.popup !== "dialog")
      fail(`the header control is ${JSON.stringify(idle.opener)}`);

    // First press: the chunk arrives, the defaults go out explicitly, the sheet fills.
    await openSheet(first, DEFAULTS, '[data-ui="digest-slices"]');
    const loads = chunkLoads();
    report.chunk = loads;
    if (loads.length !== 1)
      fail(`the digest chunk loaded ${loads.length} times: ${loads.join()}`);
    const mainSrc = await page.evaluate(
      () =>
        document.querySelector<HTMLScriptElement>('script[type="module"][src]')
          ?.src ?? null,
    );
    if (!mainSrc) fail("no module script on the page");
    else {
      const main = await (await page.request.get(mainSrc)).text();
      const chunk = loads[0]
        ? await (await page.request.get(loads[0])).text()
        : "";
      report.bundle = {
        main: mainSrc,
        mainHasSheetCopy: main.includes("골라내는 중"),
        chunkHasSheetCopy: chunk.includes("골라내는 중"),
      };
      if (main.includes("골라내는 중"))
        fail("the sheet's copy is in the initial bundle");
      if (!chunk.includes("골라내는 중"))
        fail("the lazy chunk does not carry the sheet");
    }
    const opened = await auditSheet(page);
    report.opened = {
      heading: opened.heading,
      room: opened.room,
      note: opened.note,
      scope: opened.scope,
      form: opened.form,
      style: opened.style,
      rect: opened.rect,
      slices: opened.slices.map((slice) => ({
        range: slice.range,
        count: slice.count,
        speakers: slice.speakers,
        keywords: slice.keywords,
        highlights: slice.highlights.map((item) => ({
          id: item.id,
          loaded: item.loaded,
          jump: item.jump,
        })),
      })),
    };
    const sent = digestRequests(first.id);
    if (
      sent.length !== 1 ||
      sent[0]?.query.span !== "30m" ||
      sent[0]?.query.limit !== "400" ||
      sent[0]?.query.highlights !== "3"
    )
      fail(`the first digest request was ${JSON.stringify(sent)}`);
    if (!opened.open || opened.dialogs !== 1)
      fail("the sheet is not the one open dialog");
    if (opened.heading !== OPEN)
      fail(`the sheet is labelled ${JSON.stringify(opened.heading)}`);
    if (opened.room !== first.title)
      fail(`the sheet names ${JSON.stringify(opened.room)} as the room`);
    if (opened.opener.expanded !== "true")
      fail("the header control does not report the open sheet");
    if (opened.note !== BRIDGE_NOTE)
      fail(`the bridge's note reads ${JSON.stringify(opened.note)}`);
    if (FORBIDDEN.test(opened.ownText))
      fail(
        `the sheet's own words name a model or a summary: ${opened.ownText.match(FORBIDDEN)?.[0]}`,
      );
    if (
      !opened.scope?.includes(`최근 ${firstRows.length}개 메시지`) ||
      !opened.scope.includes("30m 간격") ||
      !opened.scope.includes("구간 1개")
    )
      fail(`the scope line reads ${JSON.stringify(opened.scope)}`);
    if (
      opened.form?.span !== "30m" ||
      opened.form.limit !== "400" ||
      opened.form.highlights !== "3"
    )
      fail(`the form shows ${JSON.stringify(opened.form)}`);
    if (opened.slices.length !== 1)
      fail(`rendered ${opened.slices.length} slices for a 40-second window`);
    const slice = opened.slices[0];
    const speakers = new Map<string, number>();
    for (const row of firstRows)
      speakers.set(row.sender, (speakers.get(row.sender) ?? 0) + 1);
    if (
      slice &&
      JSON.stringify(slice.speakers) !==
        JSON.stringify(
          [...speakers].map(([name, count]) => ({
            name,
            count: String(count),
          })),
        )
    )
      fail(`speakers render ${JSON.stringify(slice.speakers)}`);
    const keyword = slice?.keywords[0];
    if (
      slice?.keywords.length !== 1 ||
      keyword?.word !== "Synthetic" ||
      keyword.count !== "40"
    )
      fail(`keywords render ${JSON.stringify(slice?.keywords)}`);
    if (slice && !/\d+월 \d+일 \d{2}:\d{2}~\d{2}:\d{2}/.test(slice.range))
      fail(`the slice range reads ${JSON.stringify(slice.range)}`);
    if (slice?.count !== `메시지 ${firstRows.length}개`)
      fail(`the slice count reads ${JSON.stringify(slice?.count)}`);
    const expectedHighlights = firstRows.slice(0, 3).map((row) => row.id);
    if (
      slice &&
      slice.highlights.map((item) => item.id).join() !==
        expectedHighlights.join()
    )
      fail(
        `highlights are ${JSON.stringify(slice.highlights.map((i) => i.id))}, expected the slice's first three rows`,
      );
    for (const item of slice?.highlights ?? []) {
      if (!item.bubble) fail(`highlight ${item.id} is not a message bubble`);
      if (
        item.loaded !== "true" ||
        item.jump !== JUMP ||
        item.unloaded !== null
      )
        fail(
          `highlight ${item.id} of a fully loaded window offers ${JSON.stringify(item)}`,
        );
    }
    if (opened.ownText.includes("Invalid Date"))
      fail("the sheet shows Invalid Date");
    if (opened.style?.background !== FIELD_WALL)
      fail(`the sheet paints ${opened.style?.background}`);
    if (
      opened.style?.borderWidth !== "1px" ||
      opened.style.borderColor !== RULE
    )
      fail(
        `the sheet's rule is ${opened.style?.borderWidth} ${opened.style?.borderColor}`,
      );
    if (opened.style?.shadow !== "none") fail("the sheet carries a shadow");
    if (opened.style?.radius !== "0px")
      fail(`the sheet is rounded: ${opened.style?.radius}`);
    if (
      !opened.rect ||
      opened.rect.left < 0 ||
      opened.rect.top < 0 ||
      opened.rect.left + opened.rect.width > opened.innerWidth ||
      opened.rect.top + opened.rect.height > opened.innerHeight
    )
      fail(`the sheet leaves the viewport: ${JSON.stringify(opened.rect)}`);
    if (opened.rect && opened.rect.width > 62 * 16 + 48)
      fail(`the sheet is wider than the reading measure: ${opened.rect.width}`);
    if (opened.windowY !== 0) fail("the document scrolled");
    await shot("digest-1440x900", DESKTOP);

    // A highlight the wall holds: the sheet closes and the wall shows the row.
    const target = expectedHighlights[0];
    if (!target) throw new Error("unreachable");
    const before = await rowPlacement(page, target);
    const closedByJump = await domBarrier(
      page,
      '[data-ui="digest-open"][aria-expanded="false"]',
    );
    await page
      .locator(
        `[data-ui="digest-highlight"][data-highlight-id="${target}"] [data-ui="digest-jump"]`,
      )
      .click();
    await closedByJump.wait();
    const after = await rowPlacement(page, target);
    const jumped = await auditSheet(page);
    report.jump = { before, after, dialogs: jumped.dialogs };
    if (!before || !after) fail("the target row is not in the wall");
    else {
      if (before.bottom <= before.wallBottom && before.top >= before.wallTop)
        fail("the oldest row was already in view; the jump proved nothing");
      if (after.top < after.wallTop - 1 || after.bottom > after.wallBottom + 1)
        fail(
          `the jump left the row at ${after.top}..${after.bottom}, wall ${after.wallTop}..${after.wallBottom}`,
        );
    }
    if (jumped.dialogs !== 0) fail("the sheet stayed open after the jump");
    if (contextRequests(first.id).length !== 1)
      fail("the digest caused a further /context request");

    // Reopened: parameters are checked here, and a refused set sends nothing.
    await openSheet(first, DEFAULTS, '[data-ui="digest-slices"]');
    const sentBefore = digestRequests(first.id).length;
    const spanInput = page.locator(
      'dialog[data-ui="digest"] input[name="span"]',
    );
    const limitInput = page.locator(
      'dialog[data-ui="digest"] input[name="limit"]',
    );
    const highlightsInput = page.locator(
      'dialog[data-ui="digest"] input[name="highlights"]',
    );
    const submit = page.locator('[data-ui="digest-submit"]');
    const refuse = async (
      field: string,
      change: () => Promise<void>,
    ): Promise<string> => {
      const named = await domBarrier(
        page,
        `[data-ui="digest-problems"] li[data-field="${field}"]`,
      );
      await change();
      await submit.click();
      await named.wait();
      return (
        (await page
          .locator(`[data-ui="digest-problems"] li[data-field="${field}"]`)
          .textContent()) ?? ""
      );
    };
    const spanProblem = await refuse("span", () => spanInput.fill("0m"));
    const highlightsProblem = await refuse("highlights", async () => {
      await spanInput.fill("30m");
      await highlightsInput.fill("21");
    });
    const limitProblem = await refuse("limit", async () => {
      await highlightsInput.fill("3");
      await limitInput.fill("0");
    });
    failurePaths.refusedOnClient = {
      spanProblem,
      highlightsProblem,
      limitProblem,
      requestsWhileRefusing: digestRequests(first.id).length - sentBefore,
    };
    if (digestRequests(first.id).length !== sentBefore)
      fail("a refused parameter set was sent to the bridge");
    if (!spanProblem.includes("구간 길이") || !highlightsProblem.includes("20"))
      fail(
        `problems read ${JSON.stringify([spanProblem, highlightsProblem, limitProblem])}`,
      );
    const invalidMarked = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLInputElement>("dialog input")].map(
        (input) => [input.name, input.getAttribute("aria-invalid")],
      ),
    );
    if (
      JSON.stringify(invalidMarked) !==
      JSON.stringify([
        ["span", null],
        ["limit", "true"],
        ["highlights", null],
      ])
    )
      fail(`aria-invalid marks are ${JSON.stringify(invalidMarked)}`);

    // A set inside the contract goes out exactly as accepted.
    const accepted = { span: "1h", limit: "400", highlights: "5" };
    const acceptedAnswer = digestResponse(page, first.id, accepted);
    const fifth = await domBarrier(
      page,
      '[data-ui="digest-highlights"] > li:nth-child(5)',
    );
    await limitInput.fill("400");
    await highlightsInput.fill("5");
    await spanInput.fill(" 1H ");
    await submit.click();
    await acceptedAnswer;
    await fifth.wait();
    const widened = await auditSheet(page);
    report.accepted = {
      scope: widened.scope,
      highlights: widened.slices[0]?.highlights.length,
      problems: widened.problems,
      form: widened.form,
    };
    if (!widened.scope?.includes("1h 간격"))
      fail(`after 1h the scope reads ${JSON.stringify(widened.scope)}`);
    if (widened.slices[0]?.highlights.length !== 5)
      fail("five highlights were asked for and not shown");
    if (widened.problems.length !== 0)
      fail("problems stayed after an accepted set");
    await closeSheet("escape");
    if ((await auditSheet(page)).dialogs !== 0)
      fail("Escape did not close the sheet");

    // A highlight outside the loaded window: said plainly, no request invented.
    const secondRows = await openRoom(second);
    const away = syntheticRows(second.id, 1)[0];
    const near = secondRows[10];
    if (!away || !near) throw new Error("unreachable");
    synthetic.set(second.id, () => ({
      status: 200,
      body: digestOf(second, {
        span: "30m",
        considered: 440,
        slices: [sliceFor([away, near], 2)],
      }),
    }));
    const contextBefore = contextRequests(second.id).length;
    await openSheet(second, DEFAULTS, '[data-ui="digest-unloaded"]');
    const partial = await auditSheet(page);
    const items = partial.slices[0]?.highlights ?? [];
    failurePaths.unloadedHighlight = {
      note: partial.note,
      scope: partial.scope,
      highlights: items,
      contextRequestsAfter: contextRequests(second.id).length - contextBefore,
      digestQueries: digestRequests(second.id).map((entry) => entry.query),
    };
    const awayItem = items.find((item) => item.id === away.id);
    const nearItem = items.find((item) => item.id === near.id);
    if (
      awayItem?.loaded !== "false" ||
      awayItem.jump !== null ||
      awayItem.unloaded !== UNLOADED(secondRows.length)
    )
      fail(`the unloaded highlight renders ${JSON.stringify(awayItem)}`);
    if (
      nearItem?.loaded !== "true" ||
      nearItem.jump !== JUMP ||
      nearItem.unloaded !== null
    )
      fail(`the loaded highlight renders ${JSON.stringify(nearItem)}`);
    if (partial.note !== NOTE)
      fail(`the synthetic note reads ${JSON.stringify(partial.note)}`);
    if (!partial.scope?.includes("최근 440개 메시지"))
      fail(`the scope reads ${JSON.stringify(partial.scope)}`);
    if (contextRequests(second.id).length !== contextBefore)
      fail("an unloaded highlight caused a /context request");
    if (
      digestRequests(second.id).some((entry) =>
        Object.keys(entry.query).some(
          (key) => !["roomId", "span", "limit", "highlights"].includes(key),
        ),
      )
    )
      fail("a digest request carried a parameter the contract does not have");
    if (FORBIDDEN.test(partial.ownText))
      fail("the sheet's own words name a model or a summary");
    await shot("digest-1440x900-unloaded", DESKTOP);
    await closeSheet("escape");

    // An empty digest: nothing picked, the note still shown, never "no conversation".
    await openRoom(third);
    synthetic.set(third.id, () => ({
      status: 200,
      body: digestOf(third, { span: "30m", considered: 0, slices: [] }),
    }));
    await openSheet(third, DEFAULTS, '[data-ui="digest-empty"]');
    const empty = await auditSheet(page);
    failurePaths.emptyDigest = {
      copy: empty.empty,
      cat: empty.cat,
      note: empty.note,
      slices: empty.slices.length,
    };
    if (empty.empty?.trim() !== EMPTY)
      fail(`the empty digest reads ${JSON.stringify(empty.empty)}`);
    if (!empty.cat) fail("the empty digest has no cat");
    if (empty.note !== NOTE) fail("the empty digest hides the note");
    if (empty.slices.length !== 0) fail("an empty digest renders slices");
    if (
      empty.ownText.includes("대화가 없습니다") ||
      empty.ownText.includes("존재하지 않")
    )
      fail("the empty digest claims the conversation does not exist");
    await shot("digest-1440x900-empty", DESKTOP);
    await closeSheet("escape");

    // The bridge refuses: the code is shown with one retry, and the retry is answered.
    await openRoom(fourth);
    synthetic.set(fourth.id, () => ({
      status: 400,
      body: {
        ok: false,
        error: { code: "INVALID_REQUEST", message: "Synthetic refusal" },
      },
    }));
    await openSheet(
      fourth,
      DEFAULTS,
      '[data-ui="digest-notice"][data-code="INVALID_REQUEST"]',
      400,
    );
    const refused = await auditSheet(page);
    failurePaths.bridgeRefusal = {
      notice: refused.notice,
      slices: refused.slices.length,
      empty: refused.empty,
    };
    if (
      refused.notice?.code !== "INVALID_REQUEST" ||
      !refused.notice.text.includes(REFUSED) ||
      refused.notice.retry !== RETRY
    )
      fail(`the 400 renders ${JSON.stringify(refused.notice)}`);
    if (refused.slices.length !== 0 || refused.empty !== null)
      fail("a refused digest shows content or the empty copy");
    synthetic.delete(fourth.id);
    const retried = digestResponse(page, fourth.id, DEFAULTS);
    const recovered = await domBarrier(
      page,
      'dialog[data-ui="digest"][open] [data-ui="digest-slices"]',
    );
    await page.locator('[data-ui="digest-notice"] button').click();
    await retried;
    await recovered.wait();
    const afterRetry = await auditSheet(page);
    if (afterRetry.notice !== null || afterRetry.slices.length !== 1)
      fail("the retry did not replace the refusal with the bridge's answer");
    if (afterRetry.note !== BRIDGE_NOTE)
      fail("the retried digest lost its note");

    // Mobile: the sheet is the view, edge to edge, with touch-sized controls.
    await page.setViewportSize(MOBILE);
    const mobile = await auditSheet(page);
    report.mobile = {
      rect: mobile.rect,
      scrollWidth: mobile.documentScrollWidth,
      clientWidth: mobile.clientWidth,
      controls: mobile.controls,
      bodyScroll: mobile.bodyScroll,
    };
    if (mobile.documentScrollWidth > mobile.clientWidth)
      fail(
        `horizontal overflow at 390: ${mobile.documentScrollWidth} > ${mobile.clientWidth}`,
      );
    if (
      !mobile.rect ||
      Math.round(mobile.rect.width) !== MOBILE.width ||
      Math.round(mobile.rect.height) !== MOBILE.height
    )
      fail(`at 390 the sheet is ${JSON.stringify(mobile.rect)}, not the view`);
    for (const control of mobile.controls)
      if (control.height < 44)
        fail(`"${control.label}" is ${control.height}px tall on mobile`);
    if (FORBIDDEN.test(mobile.ownText))
      fail("the sheet's own words name a model or a summary");
    await shot("digest-390x844", MOBILE);
    await closeSheet("button");
    await page.setViewportSize(DESKTOP);
    if ((await auditSheet(page)).dialogs !== 0)
      fail("닫기 did not close the sheet");

    await Bun.write(
      resolve(evidence, "digest-report.json"),
      `${JSON.stringify({ failures, ...report }, null, 2)}\n`,
    );
    await Bun.write(
      resolve(evidence, "12-failure.json"),
      `${JSON.stringify({ failures, ...failurePaths }, null, 2)}\n`,
    );
    log("digest-audit", { failures: failures.length });
    if (failures.length)
      throw new Error(
        [`${failures.length} digest contract failure(s):`, ...failures].join(
          "\n - ",
        ),
      );
  },
};
