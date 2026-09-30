import { resolve } from "node:path";
import type { Page } from "playwright-core";
import type { components } from "../../src/contract/decoded";
import { validateContext } from "../../src/contract/validators.js";
import { domBarrier, responseBarrier } from "../harness/browser-barriers";
import type { Scenario } from "../harness/runner";

type Room = components["schemas"]["Room"];
type Message = components["schemas"]["Message"];
type Context = components["schemas"]["Context"];

/** DESIGN.md tokens as Chrome reports them. */
const RULE = "rgb(78, 93, 105)";
const BUBBLE_OTHER = "rgb(255, 255, 255)";
const BUBBLE_SELF = "rgb(244, 235, 218)";
/** DESIGN.md copy, verbatim. */
const COVERAGE = "이 기기에 저장된 범위만 표시합니다";
const EMPTY = "이 기기에 저장된 대화가 없습니다";
const CEILING =
  "여기서 볼 수 있는 가장 오래된 메시지입니다. 더 이전 기록은 데스크톱 앱에서 확인하세요";
const QUOTE_MISSING = "인용 정보 없음";
const WIDEN = "더 불러오기";
const UNREADABLE = "읽을 수 없음 (키 없음)";
const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };
const WIDE_STORED = 1200;
const EPOCH = Date.UTC(2037, 3, 7, 9);
const LIMIT_BY_QUERY: Record<string, number> = { 40: 40, 200: 200, 1000: 1000 };
const MALICIOUS = '<img src="x" onerror="alert(1)"><script>alert(2)</script>';

const hrefFor = (roomId: string) => `#/room/${encodeURIComponent(roomId)}`;
/** Ascending as decimal strings; BigInt keeps every digit past 2^53. */
const ascending = (ids: string[]) =>
  ids.every((id, index) => {
    const previous = ids[index - 1];
    return (
      index === 0 || (previous !== undefined && BigInt(previous) < BigInt(id))
    );
  });

function pngSize(png: Buffer) {
  return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
}

/**
 * A 1,200-message room the baseline fixture does not hold, so the reader can be
 * widened to its ceiling. Every value is invented and Hangul-dominant; the odd
 * shapes the contract allows all sit inside the newest 40.
 */
function wideRows(roomId: string): Message[] {
  const rows: Message[] = [];
  for (let index = 0; index < WIDE_STORED; index++) {
    const sender = index % 7 === 0 ? 0 : 1 + (index % 4);
    rows.push({
      id: (28200000000000000n + BigInt(index)).toString(),
      roomId,
      senderId: (38000000000000000n + BigInt(sender)).toString(),
      sender: `가상참여자-${sender}`,
      text: `가상 등불 ${index}번, 넓은 창의 ${index}번째 줄입니다.`,
      kind: "text",
      sentAt: new Date(EPOCH + index * 60_000).toISOString(),
      fromMe: sender === 0,
    });
  }
  const shape = (fromEnd: number, patch: Partial<Message>) => {
    const index = WIDE_STORED - fromEnd;
    const row = rows[index];
    if (!row) throw new Error("Synthetic row missing");
    rows[index] = { ...row, ...patch };
  };
  const quoted = rows[WIDE_STORED - 12];
  if (!quoted) throw new Error("Synthetic row missing");
  shape(11, {
    kind: "reply",
    text: "네, 새벽에 문제 없이 끝났습니다.",
    replyTo: {
      messageId: quoted.id,
      senderId: quoted.senderId,
      sender: quoted.sender,
      text: quoted.text,
      kind: quoted.kind,
    },
  });
  shape(10, {
    kind: "reply",
    text: "그 메시지는 삭제된 것 같아요.",
    replyTo: {
      messageId: null,
      senderId: null,
      sender: null,
      text: null,
      kind: null,
    },
  });
  shape(9, { kind: "sticker-3d", text: "" });
  shape(8, { kind: "photo", text: "" });
  shape(7, { kind: "video", text: "" });
  shape(6, { kind: "file", text: "" });
  shape(5, { kind: "feed", text: "" });
  shape(4, { sentAt: null, text: "시간 정보가 없는 메시지입니다." });
  shape(3, { text: MALICIOUS });
  shape(2, {
    text: "@가상참여자-0 확인 부탁드립니다.",
    mentions: [
      { userId: "38000000000000000", name: "가상참여자-0", at: [0], length: 8 },
    ],
    mentionsMe: true,
  });
  return rows;
}

/** The newest `limit` of `all`, framed as the bridge frames a window, contract-checked. */
function windowOf(room: Room, all: Message[], limit: number): Context {
  const messages = all.slice(-limit);
  const newest = messages.at(-1) ?? null;
  const context: Context = {
    ok: true,
    room: {
      ...room,
      lastMessageId: newest?.id ?? null,
      lastActivityAt: newest?.sentAt ?? null,
    },
    messages,
    lastMessageFromMe: newest?.fromMe ?? null,
    attention: {
      mentionsMe: messages.filter((m) => m.mentionsMe).map((m) => m.id),
      repliesToMe: [],
      mentionsEveryone: [],
    },
    coverage: {
      localOnly: true,
      reachesLatestKnown: true,
      catalogLatestMessageId: newest?.id ?? null,
      newestReadMessageId: newest?.id ?? null,
      hasEarlier: all.length > messages.length,
      storedLocally: all.length,
    },
  };
  if (!validateContext(context))
    throw new Error(
      `Synthetic context breaks the contract: ${validateContext.errors?.[0]?.instancePath}`,
    );
  return context;
}

interface RowAudit {
  id: string;
  side: string | null;
  background: string;
  borders: string;
  shadow: string;
  before: string;
  after: string;
  radius: string;
  left: number;
  right: number;
  width: number;
  timeText: string | null;
  timeWidth: number;
  quoteEmpty: boolean | null;
  quoteBorder: string | null;
  quoteText: string | null;
  kindLabel: string | null;
  mentions: { weight: string; decoration: string; color: string }[];
  text: string;
}

interface WallAudit {
  present: boolean;
  role: string | null;
  live: string | null;
  busy: string | null;
  limit: string | null;
  firstChild: {
    ui: string | null;
    kind: string | null;
    text: string;
    border: string;
  } | null;
  ids: string[];
  rows: RowAudit[];
  contentLeft: number;
  contentRight: number;
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
  widen: { text: string; disabled: string | null; height: number } | null;
  ceiling: boolean;
  earlier: boolean;
  empty: string | null;
  cat: boolean;
  notice: { code: string | null; text: string; retry: boolean } | null;
  gaps: number;
  images: number;
  scripts: number;
  text: string;
  heading: string | null;
  backLink: boolean;
  documentHeight: number;
  innerHeight: number;
  scrollWidth: number;
  clientWidth: number;
  windowY: number;
}

/** Reads the whole wall once: structure, copy, computed colour, geometry. */
function auditWall(page: Page): Promise<WallAudit> {
  return page.evaluate(() => {
    const wall = document.querySelector<HTMLElement>('[data-ui="thread-wall"]');
    const main = document.querySelector<HTMLElement>("main");
    const base = {
      heading: main?.querySelector("h1")?.textContent ?? null,
      backLink: Boolean(main?.querySelector('a[href="#/rooms"]')),
      documentHeight: document.documentElement.scrollHeight,
      innerHeight: window.innerHeight,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      windowY: window.scrollY,
    };
    if (!wall)
      return {
        ...base,
        present: false,
        role: null,
        live: null,
        busy: null,
        limit: null,
        firstChild: null,
        ids: [],
        rows: [],
        contentLeft: 0,
        contentRight: 0,
        scrollTop: 0,
        scrollHeight: 0,
        clientHeight: 0,
        widen: null,
        ceiling: false,
        earlier: false,
        empty: null,
        cat: false,
        notice: null,
        gaps: 0,
        images: 0,
        scripts: 0,
        text: "",
      };
    const rect = wall.getBoundingClientRect();
    const first = wall.firstElementChild as HTMLElement | null;
    const firstStyle = first ? getComputedStyle(first) : null;
    const rows = [
      ...wall.querySelectorAll<HTMLElement>("[data-message-id]"),
    ].map((item) => {
      const article = item.querySelector<HTMLElement>('[data-ui="message"]');
      const bubble = article?.children[1] as HTMLElement | undefined;
      const style = bubble ? getComputedStyle(bubble) : null;
      const bubbleRect = bubble?.getBoundingClientRect();
      const time = article?.querySelector<HTMLElement>(
        'time, [data-ui="message"] > div:first-child > span:nth-child(2)',
      );
      const quote = article?.querySelector<HTMLElement>('[data-ui="quote"]');
      return {
        id: item.dataset.messageId ?? "",
        side: article?.dataset.side ?? null,
        background: style?.backgroundColor ?? "",
        borders: style
          ? [
              style.borderTopWidth,
              style.borderRightWidth,
              style.borderBottomWidth,
              style.borderLeftWidth,
            ].join(" ")
          : "",
        shadow: style?.boxShadow ?? "",
        before: bubble ? getComputedStyle(bubble, "::before").content : "",
        after: bubble ? getComputedStyle(bubble, "::after").content : "",
        radius: style?.borderTopLeftRadius ?? "",
        left: bubbleRect?.left ?? -1,
        right: bubbleRect?.right ?? -1,
        width: bubbleRect?.width ?? -1,
        timeText: time?.textContent ?? null,
        timeWidth: time?.getBoundingClientRect().width ?? 0,
        quoteEmpty: quote ? quote.dataset.empty === "true" : null,
        quoteBorder: quote ? getComputedStyle(quote).borderLeftWidth : null,
        quoteText: quote?.textContent ?? null,
        kindLabel:
          article?.querySelector('[data-ui="kind-label"]')?.textContent ?? null,
        mentions: [
          ...(article?.querySelectorAll<HTMLElement>('[data-ui="mention"]') ??
            []),
        ].map((mention) => {
          const mentionStyle = getComputedStyle(mention);
          return {
            weight: mentionStyle.fontWeight,
            decoration: mentionStyle.textDecorationLine,
            color: mentionStyle.color,
          };
        }),
        text: article?.textContent ?? "",
      };
    });
    const widen = wall.querySelector<HTMLElement>('[data-ui="widen"]');
    const notice = wall.querySelector<HTMLElement>('[data-ui="thread-notice"]');
    const text = wall.textContent ?? "";
    return {
      ...base,
      present: true,
      role: wall.getAttribute("role"),
      live: wall.getAttribute("aria-live"),
      busy: wall.getAttribute("aria-busy"),
      limit: wall.dataset.limit ?? null,
      firstChild: first
        ? {
            ui: first.dataset.ui ?? null,
            kind: first.dataset.kind ?? null,
            text: first.textContent ?? "",
            border: firstStyle
              ? `${firstStyle.borderBottomWidth} ${firstStyle.borderBottomStyle} ${firstStyle.borderBottomColor}`
              : "",
          }
        : null,
      ids: rows.map((row) => row.id),
      rows,
      // The first row spans the column, so its box is the content box.
      contentLeft: first?.getBoundingClientRect().left ?? rect.left,
      contentRight: first?.getBoundingClientRect().right ?? rect.right,
      scrollTop: wall.scrollTop,
      scrollHeight: wall.scrollHeight,
      clientHeight: wall.clientHeight,
      widen: widen
        ? {
            text: widen.textContent ?? "",
            disabled: widen.getAttribute("aria-disabled"),
            height: widen.getBoundingClientRect().height,
          }
        : null,
      ceiling: Boolean(
        wall.querySelector('[data-ui="coverage-line"][data-kind="ceiling"]'),
      ),
      earlier: text.includes("더 이전 기록이 이 기기에 있습니다"),
      empty:
        wall.querySelector('[data-ui="thread-empty"] p')?.textContent ?? null,
      cat: Boolean(wall.querySelector('[data-ui="cat"]')),
      notice: notice
        ? {
            code: notice.dataset.code ?? null,
            text: notice.textContent ?? "",
            retry: Boolean(notice.querySelector("button")),
          }
        : null,
      gaps: wall.querySelectorAll('[data-ui="thread-gap"]').length,
      images: wall.querySelectorAll("img").length,
      scripts: wall.querySelectorAll("script").length,
      text,
    };
  });
}

function rowTop(page: Page, id: string) {
  return page.evaluate(
    (id) =>
      document
        .querySelector<HTMLElement>(`[data-message-id="${id}"]`)
        ?.getBoundingClientRect().top ?? null,
    id,
  );
}

function rowLink(page: Page, roomId: string) {
  return page.locator(`nav[data-ui="rooms-pane"] a[href="${hrefFor(roomId)}"]`);
}

/** Response for one room's window, armed before the click that causes it. */
function contextResponse(
  page: Page,
  roomId: string,
  limit: string,
  status = 200,
) {
  return page.waitForResponse(
    (response) => {
      const url = new URL(response.url());
      return (
        url.pathname === "/api/context" &&
        url.searchParams.get("roomId") === roomId &&
        url.searchParams.get("limit") === limit &&
        response.status() === status
      );
    },
    { timeout: 10_000 },
  );
}

/**
 * The conversation reader against the synthetic bridge: one newest-40 request
 * per opened room, rows oldest first in one left-aligned column of flat bubbles,
 * the coverage line as the first row, quotes that survive null members, mentions
 * by weight and underline, kind labels with a default branch, a spoken missing
 * time, 더 불러오기 widening 40 → 200 → 1000 and then the ceiling, an empty
 * window that says what the device holds, bridge refusals with their code, and a
 * room switch that abandons the request it no longer needs.
 */
export const scenario: Scenario = {
  id: "context-reader",
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

    const rooms = bridge.data.rooms;
    const readable = rooms.filter((room) => room.readable);
    const [target, wide, blank, first, second] = readable;
    const unreadable = rooms.find((room) => !room.readable);
    if (!target || !wide || !blank || !first || !second || !unreadable)
      throw new Error("Fixture lacks the rooms this scenario needs");
    const targetRows = bridge.data.messages.get(target.id) ?? [];
    const firstRows = bridge.data.messages.get(first.id) ?? [];
    const secondRows = bridge.data.messages.get(second.id) ?? [];
    if (targetRows.length !== 40 || !firstRows.length || !secondRows.length)
      throw new Error("Fixture rooms lack their 40-message windows");
    const wideAll = wideRows(wide.id);
    const synthetic = new Map<string, { room: Room; rows: Message[] }>([
      [wide.id, { room: wide, rows: wideAll }],
      [blank.id, { room: blank, rows: [] }],
    ]);

    // Browser-side ledger and the two synthetic windows, armed before the first navigation.
    const requests: {
      path: string;
      roomId: string | null;
      limit: string | null;
    }[] = [];
    page.on("request", (request) => {
      const address = new URL(request.url());
      if (address.pathname.startsWith("/api/"))
        requests.push({
          path: address.pathname,
          roomId: address.searchParams.get("roomId"),
          limit: address.searchParams.get("limit"),
        });
    });
    const contextRequests = (roomId?: string) =>
      requests.filter(
        (request) =>
          request.path === "/api/context" &&
          (roomId === undefined || request.roomId === roomId),
      );
    await page.route(
      (address) =>
        address.pathname === "/api/context" &&
        synthetic.has(address.searchParams.get("roomId") ?? ""),
      async (route, request) => {
        const address = new URL(request.url());
        const source = synthetic.get(address.searchParams.get("roomId") ?? "");
        const limit = LIMIT_BY_QUERY[address.searchParams.get("limit") ?? "40"];
        if (!source || limit === undefined) {
          await route.fulfill({
            status: 400,
            contentType: "application/json",
            body: JSON.stringify({
              ok: false,
              error: { code: "INVALID_REQUEST", message: "Synthetic limit" },
            }),
          });
          return;
        }
        log("synthetic-context", { roomId: source.room.title, limit });
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          headers: { "cache-control": "no-store" },
          body: JSON.stringify(windowOf(source.room, source.rows, limit)),
        });
      },
    );

    // Catalog first; the list makes no context request of its own.
    const roomsResponse = responseBarrier(page, "/api/rooms");
    await page.goto(`${url}/#/rooms`, { waitUntil: "load" });
    await roomsResponse;
    await (
      await domBarrier(page, 'nav[data-ui="rooms-pane"] [data-ui="room-row"]')
    ).wait();
    if (contextRequests().length !== 0)
      fail("the catalog view issued a /context request");

    // The fixture room: 40 real rows, oldest first, one left-aligned column.
    const newestTarget = targetRows.at(-1);
    if (!newestTarget) throw new Error("unreachable");
    const targetContext = contextResponse(page, target.id, "40");
    const targetRow = await domBarrier(
      page,
      `[data-ui="thread-wall"] [data-message-id="${newestTarget.id}"]`,
    );
    await rowLink(page, target.id).click();
    await targetContext;
    await targetRow.wait();
    const opened = await auditWall(page);
    report.target = {
      rows: opened.ids.length,
      firstChild: opened.firstChild,
      scrollTop: opened.scrollTop,
      scrollHeight: opened.scrollHeight,
      clientHeight: opened.clientHeight,
      widths: opened.rows.map((row) => Math.round(row.width)),
    };
    if (
      contextRequests().length !== 1 ||
      contextRequests(target.id)[0]?.limit !== "40"
    )
      fail(
        `opening a room issued ${JSON.stringify(contextRequests())}, expected one newest-40 request`,
      );
    if (opened.role !== "log" || opened.live !== "polite")
      fail(`the wall is role=${opened.role} aria-live=${opened.live}`);
    if (opened.heading !== target.title)
      fail(`main heading is "${opened.heading}", expected the room title`);
    if (
      opened.firstChild?.ui !== "coverage-line" ||
      opened.firstChild.kind !== "coverage" ||
      !opened.firstChild.text.startsWith(COVERAGE)
    )
      fail(
        `the first row is ${JSON.stringify(opened.firstChild)}, expected the coverage line`,
      );
    if (opened.firstChild?.border !== `1px solid ${RULE}`)
      fail(`the coverage line's hairline is ${opened.firstChild?.border}`);
    if (!opened.firstChild?.text.includes(`${targetRows.length}개 저장`))
      fail(
        `the coverage line does not state storedLocally: ${opened.firstChild?.text}`,
      );
    if (opened.ids.length !== targetRows.length)
      fail(
        `rendered ${opened.ids.length} rows for a window of ${targetRows.length}`,
      );
    if (!ascending(opened.ids)) fail("rows are not oldest first");
    if (opened.ids.join() !== targetRows.map((row) => row.id).join())
      fail("rows do not match the fixture window in order");
    for (const row of opened.rows) {
      const source = targetRows.find((message) => message.id === row.id);
      if (!source) continue;
      const side = source.fromMe ? "self" : "other";
      if (row.side !== side)
        fail(`row ${row.id} is data-side=${row.side}, expected ${side}`);
      const expected = source.fromMe ? BUBBLE_SELF : BUBBLE_OTHER;
      if (row.background !== expected)
        fail(`${side} bubble paints ${row.background}, expected ${expected}`);
      if (row.borders !== "0px 0px 0px 0px")
        fail(`bubble ${row.id} is outlined: ${row.borders}`);
      if (row.shadow !== "none") fail(`bubble ${row.id} carries a shadow`);
      if (row.before !== "none" || row.after !== "none")
        fail(`bubble ${row.id} draws a tail with a pseudo-element`);
      if (row.radius !== "8px")
        fail(`bubble ${row.id} radius is ${row.radius}`);
      const indent = source.fromMe ? 24 : 0;
      if (Math.abs(row.left - (opened.contentLeft + indent)) > 1)
        fail(
          `${side} bubble ${row.id} starts at ${row.left}, expected ${opened.contentLeft + indent}; both sides are left-aligned`,
        );
      if (row.right > opened.contentRight + 1)
        fail(`bubble ${row.id} overflows the wall`);
      if (
        source.replyTo &&
        (row.quoteEmpty !== false || row.quoteBorder !== "2px")
      )
        fail(`reply ${row.id} has no 2px quote rule: ${row.quoteBorder}`);
      if (
        source.replyTo &&
        !row.quoteText?.includes(source.replyTo.text?.slice(0, 12) ?? "")
      )
        fail(`quote ${row.id} does not show the quoted text`);
      if (!source.replyTo && row.quoteEmpty !== null)
        fail(`text row ${row.id} renders a quote block`);
      if (row.kindLabel !== null) fail(`text row ${row.id} shows a kind label`);
      if (!row.timeText || /Invalid/.test(row.timeText))
        fail(`row ${row.id} time reads ${row.timeText}`);
      if (source.mentions?.length) {
        if (row.mentions.length !== source.mentions.length)
          fail(`row ${row.id} renders ${row.mentions.length} mentions`);
        for (const mention of row.mentions)
          if (
            mention.weight !== "600" ||
            !mention.decoration.includes("underline")
          )
            fail(
              `mention on ${row.id} is weight ${mention.weight}, ${mention.decoration}; needs weight and underline`,
            );
      }
    }
    if (opened.text.includes("Invalid Date"))
      fail("the wall shows Invalid Date");
    if (opened.widen) fail("a 40-of-40 window offers 더 불러오기");
    if (opened.ceiling) fail("a 40-of-40 window states the ceiling");
    if (opened.empty) fail("a 40-row window shows the empty copy");
    if (opened.scrollHeight <= opened.clientHeight)
      fail(
        "forty rows do not overflow the wall; the wall must be the scroll owner",
      );
    if (opened.scrollTop + opened.clientHeight < opened.scrollHeight - 2)
      fail("an opened room does not start at its newest row");
    if (opened.windowY !== 0 || opened.documentHeight > opened.innerHeight)
      fail("the document scrolled; only the wall may scroll");
    if (Math.max(...opened.rows.map((row) => row.width)) > 62 * 16)
      fail("a bubble runs wider than the 62ch measure");
    await shot("context-reader-1440x900", DESKTOP);

    // The wide room: odd shapes, then widening to the ceiling with the reading position kept.
    const newestWide = wideAll.at(-1);
    if (!newestWide) throw new Error("unreachable");
    const wideContext = contextResponse(page, wide.id, "40");
    const wideRow = await domBarrier(
      page,
      `[data-ui="thread-wall"] [data-message-id="${newestWide.id}"]`,
    );
    await rowLink(page, wide.id).click();
    await wideContext;
    await wideRow.wait();
    const shapes = await auditWall(page);
    const byEnd = (fromEnd: number) => {
      const source = wideAll[WIDE_STORED - fromEnd];
      const row = shapes.rows.find((candidate) => candidate.id === source?.id);
      if (!source || !row)
        throw new Error(`Synthetic row ${fromEnd} not rendered`);
      return { source, row };
    };
    report.shapes = {
      rows: shapes.ids.length,
      nullQuote: byEnd(10).row.quoteText,
      unknownKind: byEnd(9).row.kindLabel,
      photo: byEnd(8).row.kindLabel,
      video: byEnd(7).row.kindLabel,
      file: byEnd(6).row.kindLabel,
      feed: byEnd(5).row.kindLabel,
      missingTime: byEnd(4).row.timeText,
      missingTimeWidth: byEnd(4).row.timeWidth,
      widen: shapes.widen,
    };
    if (shapes.ids.length !== 40)
      fail(`wide room rendered ${shapes.ids.length} rows`);
    if (!ascending(shapes.ids)) fail("wide rows are not oldest first");
    const nullQuote = byEnd(10).row;
    if (
      nullQuote.quoteEmpty !== true ||
      !nullQuote.quoteText?.includes(QUOTE_MISSING)
    )
      fail(
        `an all-null replyTo renders ${JSON.stringify(nullQuote.quoteText)}`,
      );
    if (nullQuote.quoteBorder !== "2px")
      fail("the empty quote lost its 2px rule");
    if (byEnd(11).row.quoteEmpty !== false)
      fail("a full quote is marked empty");
    if (byEnd(9).row.kindLabel !== "sticker-3d")
      fail(
        `unknown kind renders ${byEnd(9).row.kindLabel}, expected its own name`,
      );
    if (byEnd(8).row.kindLabel !== "사진")
      fail(`photo renders ${byEnd(8).row.kindLabel}`);
    if (byEnd(7).row.kindLabel !== "동영상")
      fail(`video renders ${byEnd(7).row.kindLabel}`);
    if (byEnd(6).row.kindLabel !== "파일")
      fail(`file renders ${byEnd(6).row.kindLabel}`);
    const feed = byEnd(5).row.kindLabel;
    if (!feed || feed === "feed")
      fail(`feed renders ${feed}, expected a Korean label`);
    const missing = byEnd(4).row;
    if (missing.timeText === null || /\d|Invalid/.test(missing.timeText))
      fail(`a null sentAt renders ${JSON.stringify(missing.timeText)}`);
    if (missing.timeWidth <= 0) fail("the missing-time cell reserves no width");
    if (shapes.images !== 0 || shapes.scripts !== 0)
      fail("message text became markup inside the wall");
    if (!byEnd(3).row.text.includes(MALICIOUS))
      fail("hostile text is not shown verbatim as text");
    const mention = byEnd(2).row.mentions[0];
    if (mention?.weight !== "600" || !mention.decoration.includes("underline"))
      fail(`metadata mention renders ${JSON.stringify(mention)}`);
    if (shapes.widen?.text !== WIDEN || shapes.widen.disabled !== null)
      fail(`a 40-of-1200 window offers ${JSON.stringify(shapes.widen)}`);
    if (shapes.ceiling) fail("a 40-of-1200 window states the ceiling");
    if (!shapes.earlier) fail("the coverage line does not state hasEarlier");

    // 더 불러오기 → 200: the previously oldest row keeps its place on screen.
    const anchor = shapes.ids[0];
    if (!anchor) throw new Error("unreachable");
    await page.locator('[data-ui="widen"]').scrollIntoViewIfNeeded();
    const anchorBefore = await rowTop(page, anchor);
    const oldest200 = wideAll.at(-200);
    if (!oldest200) throw new Error("unreachable");
    const twoHundred = contextResponse(page, wide.id, "200");
    const twoHundredRow = await domBarrier(
      page,
      `[data-ui="thread-wall"][data-limit="200"]:not([aria-busy]) [data-message-id="${oldest200.id}"]`,
    );
    await page.locator('[data-ui="widen"]').click();
    await twoHundred;
    await twoHundredRow.wait();
    const anchorAfter = await rowTop(page, anchor);
    const widened = await auditWall(page);
    report.widened = {
      rows: widened.ids.length,
      anchorBefore,
      anchorAfter,
      scrollTop: widened.scrollTop,
    };
    if (widened.ids.length !== 200)
      fail(`widening rendered ${widened.ids.length} rows`);
    if (!ascending(widened.ids)) fail("widened rows are not oldest first");
    if (
      anchorBefore === null ||
      anchorAfter === null ||
      Math.abs(anchorAfter - anchorBefore) > 2
    )
      fail(
        `widening moved the reading anchor from ${anchorBefore} to ${anchorAfter}`,
      );
    if (widened.widen?.text !== WIDEN)
      fail("200 of 1200 offers no 더 불러오기");

    // 더 불러오기 → 1000: the ceiling replaces the control; no fourth request exists.
    const oldest1000 = wideAll.at(-1000);
    if (!oldest1000) throw new Error("unreachable");
    const thousand = contextResponse(page, wide.id, "1000");
    const thousandRow = await domBarrier(
      page,
      `[data-ui="thread-wall"][data-limit="1000"]:not([aria-busy]) [data-message-id="${oldest1000.id}"]`,
    );
    await page.locator('[data-ui="widen"]').click();
    await thousand;
    await thousandRow.wait();
    const ceiling = await auditWall(page);
    // Past 200 turns the wall virtualizes, so the window holds 1000 records
    // while only a bounded number of them are mounted at once.
    const ceilingRecords = await page.evaluate(() =>
      Number(
        document.querySelector<HTMLElement>('[data-ui="thread-turns"]')?.dataset
          .orderCount ?? 0,
      ),
    );
    report.ceiling = {
      rows: ceiling.ids.length,
      records: ceilingRecords,
      limits: contextRequests(wide.id).map((request) => request.limit),
      firstChild: ceiling.firstChild?.text,
    };
    if (ceilingRecords !== 1000)
      fail(`the 1000 window holds ${ceilingRecords} records`);
    if (ceiling.ids.length > 80)
      fail(`the 1000 window mounted ${ceiling.ids.length} rows`);
    if (!ceiling.ceiling || !ceiling.text.includes(CEILING))
      fail("the 1000 window does not state the ceiling");
    if (ceiling.widen) fail("the 1000 window still offers 더 불러오기");
    if (!ceiling.earlier) fail("the ceiling hides hasEarlier");
    if (
      contextRequests(wide.id)
        .map((request) => request.limit)
        .join() !== "40,200,1000"
    )
      fail(
        `wide room requests were ${JSON.stringify(contextRequests(wide.id))}`,
      );
    await page.evaluate(() => {
      const wall = document.querySelector<HTMLElement>(
        '[data-ui="thread-wall"]',
      );
      if (wall) wall.scrollTop = 0;
    });
    await shot("context-reader-1440x900-ceiling", DESKTOP);

    // Mobile: the same column, a way back, no horizontal overflow.
    await page.setViewportSize(MOBILE);
    const mobile = await auditWall(page);
    report.mobile = {
      scrollWidth: mobile.scrollWidth,
      clientWidth: mobile.clientWidth,
      backLink: mobile.backLink,
      widths: Math.max(...mobile.rows.map((row) => row.width)),
    };
    if (mobile.scrollWidth > mobile.clientWidth)
      fail(
        `horizontal overflow at 390: ${mobile.scrollWidth} > ${mobile.clientWidth}`,
      );
    if (!mobile.backLink) fail("mobile thread has no way back to the list");
    if (mobile.rows.some((row) => Math.abs(row.left - mobile.contentLeft) > 25))
      fail("a bubble is not left-aligned at 390");
    await shot("context-reader-390x844", MOBILE);
    await page.setViewportSize(DESKTOP);
    if (contextRequests(wide.id).length !== 3)
      fail("the ceiling issued a further /context request");

    // Empty window: what the device holds, framed by the coverage line, never "no conversation".
    const blankContext = contextResponse(page, blank.id, "40");
    const blankEmpty = await domBarrier(page, '[data-ui="thread-empty"]');
    await rowLink(page, blank.id).click();
    await blankContext;
    await blankEmpty.wait();
    const empty = await auditWall(page);
    report.empty = {
      copy: empty.empty,
      firstChild: empty.firstChild?.text,
      cat: empty.cat,
    };
    if (empty.empty?.trim() !== EMPTY)
      fail(`empty window reads ${JSON.stringify(empty.empty)}`);
    if (!empty.cat) fail("the empty thread has no cat");
    if (
      empty.firstChild?.kind !== "coverage" ||
      !empty.firstChild.text.includes("0개 저장")
    )
      fail(
        `the empty window's first row is ${JSON.stringify(empty.firstChild)}`,
      );
    if (
      empty.text.replaceAll(EMPTY, "").includes("대화가 없습니다") ||
      empty.text.includes("존재하지 않")
    )
      fail("the empty window claims the conversation does not exist");
    if (empty.ids.length !== 0 || empty.widen || empty.ceiling)
      fail("the empty window renders rows or history controls");
    await shot("context-reader-1440x900-empty", DESKTOP);

    // A locked room: the bridge's code, the design's words, a retry; never the empty copy.
    const lockedResponse = contextResponse(page, unreadable.id, "40", 503);
    const lockedNotice = await domBarrier(page, '[data-ui="thread-notice"]');
    await rowLink(page, unreadable.id).click();
    await lockedResponse;
    await lockedNotice.wait();
    const locked = await auditWall(page);
    report.locked = locked.notice;
    if (
      locked.notice?.code !== "KEY_UNAVAILABLE" ||
      !locked.notice.text.includes(UNREADABLE)
    )
      fail(`unreadable room renders ${JSON.stringify(locked.notice)}`);
    if (!locked.notice?.retry) fail("the refused window offers no retry");
    if (locked.empty) fail("a refused window shows the empty copy");
    await shot("context-reader-1440x900-locked", DESKTOP);

    // Switching rooms abandons the request that no longer matters; the new room is never confused with it.
    const release = bridge.pauseNext("/context");
    const pausedRequest = bridge.events.expect(
      (event) => event.type === "request" && event.path === "/context",
      "paused context request",
    );
    const pausedWall = await domBarrier(
      page,
      '[data-ui="thread-wall"][aria-busy="true"]',
    );
    await rowLink(page, first.id).click();
    const paused = await pausedRequest;
    await pausedWall.wait();
    const waiting = await auditWall(page);
    report.waiting = {
      busy: waiting.busy,
      empty: waiting.empty,
      rows: waiting.ids.length,
    };
    if (waiting.empty) fail("a window still loading is called empty");
    if (waiting.heading !== first.title)
      fail("the heading did not follow the route");
    const abandoned = bridge.events.expect(
      (event) =>
        event.type === "response" &&
        event.id === paused.id &&
        event.status === 499,
      "abandoned context request",
    );
    const newestSecond = secondRows.at(-1);
    if (!newestSecond) throw new Error("unreachable");
    const secondContext = contextResponse(page, second.id, "40");
    const secondRow = await domBarrier(
      page,
      `[data-ui="thread-wall"] [data-message-id="${newestSecond.id}"]`,
    );
    await rowLink(page, second.id).click();
    await Promise.all([secondContext, secondRow.wait(), abandoned]);
    release();
    const switched = await auditWall(page);
    const firstIds = new Set(firstRows.map((row) => row.id));
    report.switched = {
      rows: switched.ids.length,
      leaked: switched.ids.filter((id) => firstIds.has(id)).length,
    };
    if (switched.heading !== second.title)
      fail("the heading is not the second room's title");
    if (switched.ids.join() !== secondRows.map((row) => row.id).join())
      fail("the second room does not show exactly its own window");
    if (switched.ids.some((id) => firstIds.has(id)))
      fail("rows of the abandoned room leaked into the current one");
    if (switched.busy !== null)
      fail("the wall stays busy after the second room answered");

    await Bun.write(
      resolve(evidence, "context-reader-report.json"),
      `${JSON.stringify({ failures, ...report }, null, 2)}\n`,
    );
    log("context-reader-audit", { failures: failures.length });
    if (failures.length)
      throw new Error(
        [`${failures.length} reader contract failure(s):`, ...failures].join(
          "\n - ",
        ),
      );
  },
};
