import { resolve } from "node:path";
import type { CDPSession, Page } from "playwright-core";
import type { components } from "../../src/contract/decoded";
import type { SendAttempt } from "../../src/core/send";
import { Barriers } from "../harness/barriers";
import { domBarrier, responseBarrier } from "../harness/browser-barriers";
import type { Scenario } from "../harness/runner";
import type { LedgeEvent, LedgeSurfaceControl } from "../visual/ledge";
import { restoredBarrier } from "../visual/thread-anchor";

type Message = components["schemas"]["Message"];

/** DESIGN.md tokens as Chrome reports them. */
const RULE = "rgb(78, 93, 105)";
/** --dur-cross in milliseconds and --ease as the Web Animations API reports them. */
const CROSS_DURATION = 300;
const CROSS_EASE = "cubic-bezier(0.2, 0, 0.2, 1)";
/** DESIGN.md copy, verbatim. */
const PENDING_WORD = "입력됨 · 전달 미확인";
const SENT_WORD = "보냈습니다";
const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };
const TEXTS = {
  first: "  가상 별빛을 다시 확인합니다.\n공백도 그대로 남깁니다.  ",
  switching: "가상 등불 둘, 방을 바꾸는 동안 건너는 문장입니다.",
  reduced: "가상 등불 셋, 움직임 없이 건너는 문장입니다.",
  away: "가상 등불 넷, 위를 읽는 동안 도착한 문장입니다.",
  rejected: "가상 등불 여섯, 거절되는 문장입니다.",
} as const;

type Rect = { top: number; bottom: number; left: number; right: number };

interface LedgeAudit {
  innerHeight: number;
  innerWidth: number;
  documentHeight: number;
  scrollWidth: number;
  clientWidth: number;
  reducedMotion: boolean;
  list: Rect | null;
  wall:
    | (Rect & {
        scrollTop: number;
        scrollHeight: number;
        clientHeight: number;
        mode: string | undefined;
        generation: number;
      })
    | null;
  ledge: (Rect & { border: string; tag: string }) | null;
  ground: Rect | null;
  /** Elements inside the ground that draw a horizontal rule along their top edge; none may, the ledge is the one rule. */
  groundTopRules: number;
  pendingList: (Rect & { scrollHeight: number; clientHeight: number }) | null;
  pending: { id: string; state: string; top: number; bottom: number }[];
  /** Every message row inside the wall's scroll container, in DOM order. */
  history: { id: string; top: number; bottom: number; state: string | null }[];
  groundText: string;
  wallText: string;
  door: Rect | null;
  input: Rect | null;
  clones: number;
  overlay: {
    hidden: string | null;
    inert: boolean;
    pointer: string;
    position: string;
    children: number;
  } | null;
  indicator: string | null;
  announcements: string[];
  restoredDraft: string | null;
}

/** Reads the whole conversation pane once: structure, computed colour, geometry, copy. */
function auditLedge(page: Page): Promise<LedgeAudit> {
  return page.evaluate(() => {
    const box = (element: Element | null): Rect | null => {
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return {
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        right: rect.right,
      };
    };
    const query = <T extends Element>(selector: string) =>
      document.querySelector<T>(selector);
    const wall = query<HTMLElement>('[data-ui="thread-wall"]');
    const ledge = query<HTMLElement>('[data-ui="ledge"]');
    const ground = query<HTMLElement>('[data-ui="ground"]');
    const pendingList = query<HTMLElement>('[data-ui="pending-list"]');
    const overlay = query<HTMLElement>('[data-ui="crossing-overlay"]');
    const ledgeStyle = ledge ? getComputedStyle(ledge) : null;
    // A horizontal rule: a top border in the rule colour with no side borders. Outlined buttons are boxes, not rules.
    const groundTopRules = ground
      ? [...ground.querySelectorAll<HTMLElement>("*")].filter((element) => {
          const style = getComputedStyle(element);
          return (
            parseFloat(style.borderTopWidth) > 0 &&
            style.borderTopStyle !== "none" &&
            style.borderTopColor === "rgb(78, 93, 105)" &&
            parseFloat(style.borderLeftWidth) === 0 &&
            parseFloat(style.borderRightWidth) === 0
          );
        }).length
      : 0;
    return {
      innerHeight: window.innerHeight,
      innerWidth: window.innerWidth,
      documentHeight: document.documentElement.scrollHeight,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
      list: box(query('[data-ui="fixture-list"]')),
      wall: wall
        ? {
            ...(box(wall) as Rect),
            scrollTop: wall.scrollTop,
            scrollHeight: wall.scrollHeight,
            clientHeight: wall.clientHeight,
            mode: wall.dataset.scrollMode,
            generation: Number(wall.dataset.scrollGeneration ?? 0),
          }
        : null,
      ledge:
        ledge && ledgeStyle
          ? {
              ...(box(ledge) as Rect),
              border: `${ledgeStyle.borderTopWidth} ${ledgeStyle.borderTopStyle} ${ledgeStyle.borderTopColor}`,
              tag: ledge.tagName.toLowerCase(),
            }
          : null,
      ground: box(ground),
      groundTopRules,
      pendingList: pendingList
        ? {
            ...(box(pendingList) as Rect),
            scrollHeight: pendingList.scrollHeight,
            clientHeight: pendingList.clientHeight,
          }
        : null,
      pending: [
        ...document.querySelectorAll<HTMLElement>(
          '[data-ui="pending-attempt"]',
        ),
      ].map((item) => ({
        id: item.dataset.attemptId ?? "",
        state: item.dataset.sendState ?? "",
        top: item.getBoundingClientRect().top,
        bottom: item.getBoundingClientRect().bottom,
      })),
      history: wall
        ? [...wall.querySelectorAll<HTMLElement>("[data-message-id]")].map(
            (row) => ({
              id: row.dataset.messageId ?? "",
              top: row.getBoundingClientRect().top,
              bottom: row.getBoundingClientRect().bottom,
              state:
                row.querySelector<HTMLElement>('[data-ui="state-word"]')
                  ?.textContent ?? null,
            }),
          )
        : [],
      groundText: ground?.textContent ?? "",
      wallText: wall?.textContent ?? "",
      door: box(query('[data-ui="composer-send"]')),
      input: box(query('[data-ui="composer-input"]')),
      clones: document.querySelectorAll('[data-ui="crossing-clone"]').length,
      overlay: overlay
        ? {
            hidden: overlay.getAttribute("aria-hidden"),
            inert: overlay.hasAttribute("inert"),
            pointer: getComputedStyle(overlay).pointerEvents,
            position: getComputedStyle(overlay).position,
            children: overlay.childElementCount,
          }
        : null,
      indicator: query('[data-ui="crossing-indicator"]')?.textContent ?? null,
      announcements: [
        ...document.querySelectorAll<HTMLElement>(
          '[data-ui="crossing-announcement"]',
        ),
      ].map((element) => element.textContent ?? ""),
      restoredDraft:
        query('[data-ui="fixture-restored-draft"]')?.textContent ?? null,
    };
  });
}

/** The flight as its animation declares it: the clone's start box, the final keyframe's vector, the timing. */
interface CloneAudit {
  start: Rect;
  vector: { dx: number; dy: number; sx: number; sy: number } | null;
  duration: number | string | null;
  easing: string | null;
  fill: string | null;
  keyframeProperties: string[];
  dataCarriers: number;
  focusable: number;
  destination: Rect | null;
}

function auditClone(page: Page, destinationId: string): Promise<CloneAudit> {
  return page.evaluate((destinationId) => {
    const clone = document.querySelector<HTMLElement>(
      '[data-ui="crossing-clone"]',
    );
    if (!clone) throw new Error("No clone in flight");
    const animation = document
      .getAnimations()
      .find((item) => (item.effect as KeyframeEffect).target === clone);
    const effect = animation ? (animation.effect as KeyframeEffect) : null;
    const keyframes = effect ? effect.getKeyframes() : [];
    const timing = effect ? effect.getTiming() : null;
    const final = keyframes.at(-1);
    const transform =
      typeof final?.transform === "string" ? final.transform : "";
    const number = "(-?[\\d.]+(?:e-?\\d+)?)";
    const match = new RegExp(
      `translate\\(${number}px,\\s*${number}px\\)\\s*scale\\(${number},\\s*${number}\\)`,
    ).exec(transform);
    const article = document.querySelector<HTMLElement>(
      `[data-message-id="${destinationId}"] [data-ui="message"]`,
    );
    const bubble = article?.children[1] ?? article ?? null;
    const rect = bubble?.getBoundingClientRect();
    const top = parseFloat(clone.style.top);
    const left = parseFloat(clone.style.left);
    return {
      start: {
        top,
        left,
        right: left + parseFloat(clone.style.width),
        bottom: top + parseFloat(clone.style.height),
      },
      vector: match
        ? {
            dx: Number(match[1]),
            dy: Number(match[2]),
            sx: Number(match[3]),
            sy: Number(match[4]),
          }
        : null,
      duration:
        typeof timing?.duration === "number"
          ? timing.duration
          : timing?.duration === undefined
            ? null
            : String(timing.duration),
      easing: timing?.easing ?? null,
      fill: timing?.fill ?? null,
      keyframeProperties: [
        ...new Set(
          keyframes.flatMap((frame) =>
            Object.keys(frame).filter(
              (key) =>
                !["offset", "computedOffset", "easing", "composite"].includes(
                  key,
                ),
            ),
          ),
        ),
      ],
      dataCarriers: [clone, ...clone.querySelectorAll<HTMLElement>("*")].filter(
        (element) => Object.keys(element.dataset).length > 0,
      ).length,
      focusable: clone.querySelectorAll(
        "button, a, input, textarea, select, [tabindex]",
      ).length,
      destination: rect
        ? {
            top: rect.top,
            bottom: rect.bottom,
            left: rect.left,
            right: rect.right,
          }
        : null,
    };
  }, destinationId);
}

/** Hold the flight at a chosen moment so the frame can be inspected and photographed. */
function holdFlight(page: Page, at: number) {
  return page.evaluate((at) => {
    const clone = document.querySelector('[data-ui="crossing-clone"]');
    const animation = document
      .getAnimations()
      .find((item) => (item.effect as KeyframeEffect).target === clone);
    if (!animation) throw new Error("The clone has no animation to hold");
    animation.pause();
    animation.currentTime = at;
    return animation.playState;
  }, at);
}

function releaseFlight(page: Page) {
  return page.evaluate(() => {
    const clone = document.querySelector('[data-ui="crossing-clone"]');
    const animation = document
      .getAnimations()
      .find((item) => (item.effect as KeyframeEffect).target === clone);
    if (!animation) throw new Error("The clone has no animation to release");
    animation.play();
  });
}

/** A MutationObserver armed before the action; it records every clone that enters the document, and where. */
async function armCloneDetector(page: Page) {
  await page.evaluate(() => {
    const seen: string[] = [];
    Reflect.set(window, "clonesSeen", seen);
    const observer = new MutationObserver((records) => {
      for (const record of records)
        for (const node of record.addedNodes)
          if (
            node instanceof Element &&
            (node.matches('[data-ui="crossing-clone"]') ||
              node.querySelector('[data-ui="crossing-clone"]'))
          )
            seen.push(
              `${performance.now().toFixed(0)}ms into <${(record.target as Element).tagName.toLowerCase()} data-ui="${(record.target as HTMLElement).dataset?.ui}">: ${node.outerHTML.slice(0, 160)}`,
            );
    });
    observer.observe(document.body, { childList: true, subtree: true });
    Reflect.set(window, "cloneDetector", observer);
  });
  return () =>
    page.evaluate(() => {
      (Reflect.get(window, "cloneDetector") as MutationObserver).disconnect();
      return Reflect.get(window, "clonesSeen") as string[];
    });
}

/** Real listener counts through the DOM debugger, not a bookkeeping estimate. */
async function listenerCounts(cdp: CDPSession) {
  const counts: Record<string, number> = {};
  for (const [label, expression] of [
    ["window", "window"],
    ["document", "document"],
    ["body", "document.body"],
    ["wall", `document.querySelector('[data-ui="thread-wall"]')`],
  ] as const) {
    const { result } = await cdp.send("Runtime.evaluate", {
      expression,
      objectGroup: "ledge-leak",
    });
    if (!result.objectId) throw new Error(`No object for ${label}`);
    const { listeners } = await cdp.send("DOMDebugger.getEventListeners", {
      objectId: result.objectId,
      depth: 0,
    });
    counts[label] = listeners.length;
  }
  await cdp.send("Runtime.releaseObjectGroup", { objectGroup: "ledge-leak" });
  return counts;
}

async function layoutCount(cdp: CDPSession) {
  const { metrics } = await cdp.send("Performance.getMetrics");
  return metrics.find((metric) => metric.name === "LayoutCount")?.value ?? -1;
}

function control<K extends keyof LedgeSurfaceControl>(
  page: Page,
  method: K,
  ...args: Parameters<LedgeSurfaceControl[K]>
): Promise<Awaited<ReturnType<LedgeSurfaceControl[K]>>> {
  return page.evaluate(
    ({ method, args }) =>
      (
        Reflect.get(window, "ledgeSurface")[method] as (
          ...args: unknown[]
        ) => unknown
      )(...args),
    { method, args },
  ) as Promise<Awaited<ReturnType<LedgeSurfaceControl[K]>>>;
}

function near(a: number, b: number, tolerance = 1) {
  return Math.abs(a - b) <= tolerance;
}

/**
 * The ledge law on a real surface: a pending request renders below the 1px rule
 * and only an actually read-back row stands above it; the user's explicit link
 * moves one visual clone across the rule in 300ms while the real DOM changed
 * exactly once, before the motion; a room switch mid-flight leaves no clone and
 * no listener; reduced motion changes the state without a clone; a destination
 * out of view gets an indicator and the reader is not yanked.
 */
export const scenario: Scenario = {
  id: "ledge-crossing",
  async run({ page, bridge, url, evidence, log, screenshot }) {
    const failures: string[] = [];
    const fail = (message: string) => failures.push(message);
    const report: Record<string, unknown> = {};
    const rooms = bridge.data.rooms.filter((room) => room.readable).slice(0, 2);
    const [room, other] = rooms;
    if (!room || !other) throw new Error("Fixture lacks two readable rooms");
    const rows = bridge.data.messages.get(room.id);
    if (!rows?.length) throw new Error("Fixture room has no window");
    const windowSize = rows.length;

    // Test-only composition, bundled separately and never shipped by Vite.
    const bundle = await Bun.build({
      entrypoints: [resolve("tests/visual/ledge.ts")],
      target: "browser",
      format: "esm",
      minify: true,
      naming: "ledge.[ext]",
    });
    if (!bundle.success)
      throw new Error(`Fixture bundle failed: ${bundle.logs.join("\n")}`);
    for (const output of bundle.outputs) {
      const path = `/__qa/${output.path.split(/[\\/]/).at(-1)}`;
      const body = await output.text();
      await page.route(`**${path}`, (route) =>
        route.fulfill({ body, contentType: output.type }),
      );
    }
    const events = new Barriers<LedgeEvent>();
    await page.exposeFunction("ledgeEvent", (event: LedgeEvent) =>
      events.emit(event),
    );
    // The application's own stylesheet carries the tokens, base and fonts.
    const catalog = responseBarrier(page, "/api/rooms");
    await page.goto(`${url}/#/rooms`, { waitUntil: "load" });
    await catalog;
    const css = await page
      .locator('link[rel="stylesheet"]')
      .evaluateAll((links) =>
        links.map((link) => (link as HTMLLinkElement).href),
      );
    await page.goto(`${url}/__qa/blank`, { waitUntil: "load" });
    for (const href of [...css, `${url}/__qa/ledge.css`])
      await page.addStyleTag({ url: href });
    const loaded = events.expect(
      (event) => event.type === "context" && event.roomId === room.id,
      "initial window applied",
    );
    await page.evaluate(
      async ({ url, rooms }) => {
        const module = await import(`${url}/__qa/ledge.js`);
        await module.mountLedgeFixture(rooms);
      },
      { url, rooms },
    );
    await loaded;
    await (await domBarrier(page, '[data-ui="composer-send"]')).wait();
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Performance.enable");
    await cdp.send("Animation.enable");
    /** Freezing the document timeline makes "mid-flight" a state, not a race against 300ms. */
    const freeze = (frozen: boolean) =>
      cdp.send("Animation.setPlaybackRate", { playbackRate: frozen ? 0 : 1 });
    const posts: string[] = [];
    page.on("request", (request) => {
      if (
        new URL(request.url()).pathname === "/api/send" &&
        request.postDataJSON()?.dryRun === false
      )
        posts.push(request.postData() ?? "");
    });

    const submitPending = async (text: string) => {
      const attempt = await control(page, "preview", text);
      if (attempt?.state !== "awaiting-consent")
        throw new Error(
          `Preview ended in ${attempt?.state}: ${attempt?.reason}`,
        );
      const shown = await domBarrier(
        page,
        `[data-attempt-id="${attempt.uuid}"][data-send-state="submitted"]`,
      );
      const state = await control(page, "confirm", attempt.uuid);
      if (state !== "submitted") throw new Error(`Confirm ended in ${state}`);
      await shown.wait();
      return attempt.uuid;
    };
    /**
     * A fromMe row with equal text is appended on the bridge and read back
     * through /context. The audit waits for the scroll owner to settle on the
     * grown window: the refreshing line above the list comes and goes during the
     * request, and the owner compensates for it one frame later.
     */
    let readBacks = 0;
    const readBack = async (text: string) => {
      const last = rows.at(-1);
      if (!last) throw new Error("unreachable");
      readBacks++;
      const settled = await restoredBarrier(page, {
        records: windowSize + readBacks,
      });
      const observed: Message = {
        ...last,
        id: (BigInt(last.id) + 1n).toString(),
        text,
        fromMe: true,
        kind: "text",
        sentAt: new Date(
          Date.parse(last.sentAt ?? "2037-04-07T09:00:00Z") + 1000,
        ).toISOString(),
      };
      delete observed.replyTo;
      delete observed.mentions;
      delete observed.mentionsMe;
      rows.push(observed);
      const applied = events.expect(
        (event) => event.type === "context" && event.roomId === room.id,
        "read-back applied",
      );
      const candidate = await domBarrier(page, '[data-ui="pending-link"]');
      const history = await domBarrier(
        page,
        `[data-ui="thread-wall"] [data-message-id="${observed.id}"]`,
      );
      await control(page, "readBack");
      await Promise.all([applied, candidate.wait(), history.wait(), settled()]);
      return observed;
    };
    const attempts = () =>
      control(page, "snapshot") as Promise<readonly SendAttempt[]>;
    const attemptOf = async (uuid: string) =>
      (await attempts()).find((item) => item.uuid === uuid);
    /** A user's own wheel scroll, settled by the scroll owner in the named mode. */
    const wheel = async (
      delta: number,
      mode: "reading-anchor" | "follow-tail",
    ) => {
      const before = await auditLedge(page);
      if (!before.wall) throw new Error("Missing wall");
      const settled = await restoredBarrier(page, {
        mode,
        minGeneration: before.wall.generation + 1,
      });
      await page.mouse.move(
        (before.wall.left + before.wall.right) / 2,
        (before.wall.top + before.wall.bottom) / 2,
      );
      await page.mouse.wheel(0, delta);
      await settled();
    };
    const linkOf = (uuid: string) =>
      page.locator(`[data-attempt-id="${uuid}"] [data-ui="pending-link"]`);
    const linkEvent = (uuid: string, messageId: string, label: string) =>
      events.expect(
        (event) =>
          event.type === "ledger" &&
          event.attempts.some(
            (item) => item.uuid === uuid && item.linkedMessageId === messageId,
          ),
        label,
      );
    const checkShell = (label: string, audit: LedgeAudit) => {
      if (audit.documentHeight > audit.innerHeight)
        fail(
          `${label}: the document scrolls (${audit.documentHeight} > ${audit.innerHeight}); only the wall and the pending stack may`,
        );
      if (audit.scrollWidth > audit.clientWidth)
        fail(
          `${label}: horizontal overflow ${audit.scrollWidth} > ${audit.clientWidth}`,
        );
      if (
        !audit.door ||
        audit.door.bottom > audit.innerHeight + 0.5 ||
        audit.door.top < 0
      )
        fail(
          `${label}: the send door is not reachable: ${JSON.stringify(audit.door)}`,
        );
      if (!audit.input || audit.input.bottom > audit.innerHeight + 0.5)
        fail(`${label}: the composer input is not reachable`);
      if (!audit.ledge || !audit.wall || !audit.ground) {
        fail(`${label}: the pane lacks wall, ledge or ground`);
        return;
      }
      if (audit.ledge.border !== `1px solid ${RULE}`)
        fail(
          `${label}: the ledge is ${audit.ledge.border}, expected 1px solid ${RULE}`,
        );
      if (!near(audit.ledge.bottom - audit.ledge.top, 1, 0.5))
        fail(
          `${label}: the ledge is ${audit.ledge.bottom - audit.ledge.top}px tall`,
        );
      if (
        !near(audit.ledge.top, audit.wall.bottom) ||
        !near(audit.ledge.bottom, audit.ground.top)
      )
        fail(
          `${label}: the ledge does not sit between wall (${audit.wall.bottom}) and ground (${audit.ground.top}): ${JSON.stringify(audit.ledge)}`,
        );
      if (
        !near(audit.ledge.left, audit.wall.left) ||
        !near(audit.ledge.right, audit.wall.right)
      )
        fail(`${label}: the ledge does not span exactly the conversation pane`);
      if (audit.list && audit.ledge.left < audit.list.right - 0.5)
        fail(
          `${label}: the ledge crosses into the room list (${audit.ledge.left} < ${audit.list.right})`,
        );
      if (audit.groundTopRules !== 0)
        fail(
          `${label}: ${audit.groundTopRules} element(s) inside the ground draw a second rule`,
        );
      if (!near(audit.ground.bottom, audit.innerHeight))
        fail(
          `${label}: the ground is not pinned to the bottom edge (${audit.ground.bottom} vs ${audit.innerHeight})`,
        );
      for (const item of audit.pending)
        if (item.top < audit.ledge.bottom - 0.5)
          fail(
            `${label}: pending ${item.id} (${item.state}) rises above the ledge (${item.top} < ${audit.ledge.bottom})`,
          );
      if (audit.groundText.includes(SENT_WORD))
        fail(`${label}: the ground says ${SENT_WORD} for a request`);
    };

    try {
      // A. Nothing pending: the ledge is the only rule between the wall and the composer.
      const idle = await auditLedge(page);
      checkShell("idle", idle);
      if (idle.pending.length !== 0 || idle.pendingList)
        fail("idle: a pending stack is rendered with nothing pending");
      if (idle.overlay) fail("idle: an overlay exists before any crossing");
      if (idle.ledge?.tag !== "hr")
        fail(`idle: the ledge is a <${idle.ledge?.tag}>, expected a separator`);
      report.idle = {
        ledge: idle.ledge,
        wall: idle.wall,
        ground: idle.ground,
        door: idle.door,
      };
      await screenshot("ledge-idle-1440x900");

      // B. One submitted request: below the ledge, no history row, the door does not move.
      const firstUuid = await submitPending(TEXTS.first);
      const below = await auditLedge(page);
      checkShell("pending", below);
      if (below.pending.length !== 1 || below.pending[0]?.state !== "submitted")
        fail(`pending: ${JSON.stringify(below.pending)}`);
      if (!below.groundText.includes(PENDING_WORD))
        fail(`pending: the ground does not say ${PENDING_WORD}`);
      if (below.wallText.includes(TEXTS.first.trim()))
        fail("pending: the wall shows the request's text as history");
      if (below.history.length !== windowSize)
        fail(
          `pending: the wall holds ${below.history.length} rows for a ${windowSize}-row window`,
        );
      if (
        !idle.door ||
        !below.door ||
        !near(idle.door.bottom, below.door.bottom)
      )
        fail(
          `pending: the door moved from ${idle.door?.bottom} to ${below.door?.bottom}`,
        );
      if (!idle.ledge || !below.ledge || below.ledge.top >= idle.ledge.top)
        fail("pending: the ledge did not rise to make room for the request");
      const firstAttempt = await attemptOf(firstUuid);
      if (
        firstAttempt?.linkedMessageId !== null ||
        firstAttempt.candidates.length !== 0
      )
        fail("pending: queue acceptance produced a candidate or a link");
      report.pending = {
        ledge: below.ledge,
        pending: below.pending,
        door: below.door,
      };
      await screenshot("pending-below-1440x900");
      await page.setViewportSize(MOBILE);
      const belowMobile = await auditLedge(page);
      checkShell("pending-mobile", belowMobile);
      if (belowMobile.list && belowMobile.list.right > 0)
        fail("pending-mobile: the list column is still shown at 390px");
      report.pendingMobile = {
        ledge: belowMobile.ledge,
        wall: belowMobile.wall,
        door: belowMobile.door,
      };
      await screenshot("pending-below-390x844");
      await page.setViewportSize(DESKTOP);

      // C. Pending overflow: only the pending sub-stack scrolls, inside the 40dvh cap; the door stays put.
      const extras: string[] = [];
      for (let index = 0; index < 11; index++)
        extras.push(
          await submitPending(
            `가상 등불 ${index + 1}번, 렛지 아래 대기 목록을 넘치게 하는 문장입니다.`,
          ),
        );
      const overflow = await auditLedge(page);
      checkShell("overflow", overflow);
      if (overflow.pending.length !== 12)
        fail(
          `overflow: ${overflow.pending.length} pending items rendered for 12 attempts`,
        );
      if (
        !overflow.pendingList ||
        overflow.pendingList.scrollHeight <= overflow.pendingList.clientHeight
      )
        fail(
          "overflow: twelve requests do not overflow the pending stack; it must scroll internally",
        );
      if (
        overflow.pendingList &&
        overflow.pendingList.clientHeight > 0.4 * overflow.innerHeight + 1
      )
        fail(
          `overflow: the pending stack is ${overflow.pendingList.clientHeight}px, above the 40dvh cap (${0.4 * overflow.innerHeight})`,
        );
      if (
        overflow.wall &&
        overflow.wall.clientHeight < 0.3 * overflow.innerHeight - 1
      )
        fail(
          `overflow: the wall shrank to ${overflow.wall.clientHeight}px, under 30dvh`,
        );
      if (
        !below.door ||
        !overflow.door ||
        !near(below.door.bottom, overflow.door.bottom)
      )
        fail(
          `overflow: the door moved from ${below.door?.bottom} to ${overflow.door?.bottom}`,
        );
      report.overflow = {
        pendingList: overflow.pendingList,
        wall: overflow.wall,
        ledge: overflow.ledge,
        door: overflow.door,
        cap: 0.4 * overflow.innerHeight,
      };
      await screenshot("pending-overflow-1440x900");
      await page.setViewportSize(MOBILE);
      const overflowMobile = await auditLedge(page);
      checkShell("overflow-mobile", overflowMobile);
      if (
        overflowMobile.pendingList &&
        overflowMobile.pendingList.clientHeight >
          0.4 * overflowMobile.innerHeight + 1
      )
        fail(
          `overflow-mobile: the pending stack is ${overflowMobile.pendingList.clientHeight}px, above 40dvh`,
        );
      report.overflowMobile = {
        pendingList: overflowMobile.pendingList,
        wall: overflowMobile.wall,
        door: overflowMobile.door,
        cap: 0.4 * overflowMobile.innerHeight,
      };
      await screenshot("pending-overflow-390x844");
      await page.setViewportSize(DESKTOP);
      const lastExtra = extras.at(-1);
      if (!lastExtra) throw new Error("unreachable");
      const trimmed = await domBarrier(
        page,
        `[data-ui="pending-list"]:not(:has([data-attempt-id="${lastExtra}"]))`,
      );
      for (const uuid of extras) await control(page, "dismiss", uuid);
      await trimmed.wait();

      // D. Read-back: the observed row stands above the ledge at once; the request stays below.
      // Following the tail is the reader's own choice, so the reader scrolls there first.
      await wheel(-400, "reading-anchor");
      await wheel(2000, "follow-tail");
      const observed = await readBack(TEXTS.first);
      const candidate = await auditLedge(page);
      checkShell("candidate", candidate);
      const observedRow = candidate.history.find(
        (row) => row.id === observed.id,
      );
      if (!observedRow || !candidate.ledge)
        fail("candidate: the read-back row is not in the wall");
      else {
        if (observedRow.bottom > candidate.ledge.top + 0.5)
          fail(
            `candidate: the read-back row (${observedRow.bottom}) is not above the ledge (${candidate.ledge.top})`,
          );
        if (observedRow.state !== SENT_WORD)
          fail(
            `candidate: the read-back fromMe row reads ${observedRow.state}, expected ${SENT_WORD}`,
          );
      }
      if (
        candidate.pending.length !== 1 ||
        candidate.pending[0]?.id !== firstUuid
      )
        fail(
          "candidate: the request left the ground before the user linked it",
        );
      if ((await attemptOf(firstUuid))?.linkedMessageId !== null)
        fail("candidate: text equality auto-linked the attempt");
      report.candidate = {
        observedRow,
        ledge: candidate.ledge,
        pending: candidate.pending,
      };
      await screenshot("candidate-1440x900");
      await page.setViewportSize(MOBILE);
      await screenshot("candidate-390x844");
      await page.setViewportSize(DESKTOP);

      // E. The user links: one clone flies over the rule; the real DOM changed once, before the motion.
      const settledBefore = await auditLedge(page);
      const sourceBefore = await page.evaluate((uuid) => {
        const article = document.querySelector<HTMLElement>(
          `[data-attempt-id="${uuid}"]`,
        );
        const bubble = article?.querySelector("p") ?? article;
        const rect = bubble?.getBoundingClientRect();
        return rect
          ? {
              top: rect.top,
              left: rect.left,
              right: rect.right,
              bottom: rect.bottom,
            }
          : null;
      }, firstUuid);
      await freeze(true);
      const layoutsBefore = await layoutCount(cdp);
      const flying = await domBarrier(page, '[data-ui="crossing-clone"]');
      const linked = linkEvent(firstUuid, observed.id, "explicit user link");
      await linkOf(firstUuid).click();
      await Promise.all([linked, flying.wait()]);
      const heldState = await holdFlight(page, 150);
      const layoutsAtClone = await layoutCount(cdp);
      const clone = await auditClone(page, observed.id);
      const midflight = await auditLedge(page);
      checkShell("midflight", midflight);
      if (midflight.clones !== 1)
        fail(`midflight: ${midflight.clones} clones, expected exactly one`);
      const overlay = midflight.overlay;
      if (overlay === null) fail("midflight: the clone has no root overlay");
      else {
        if (overlay.hidden !== "true" || !overlay.inert)
          fail(
            `midflight: the overlay is not aria-hidden and inert: ${JSON.stringify(overlay)}`,
          );
        if (overlay.pointer !== "none" || overlay.position !== "fixed")
          fail(
            `midflight: the overlay takes pointer events or is not a root overlay: ${JSON.stringify(overlay)}`,
          );
      }
      if (midflight.pending.length !== 0)
        fail(
          "midflight: the pending item is still in the ground while its clone flies; the meaning must change before the motion",
        );
      if (
        midflight.history.filter((row) => row.id === observed.id).length !== 1
      )
        fail("midflight: the link duplicated or removed the observed row");
      if (
        !sourceBefore ||
        !near(clone.start.top, sourceBefore.top) ||
        !near(clone.start.left, sourceBefore.left)
      )
        fail(
          `midflight: the clone starts at ${JSON.stringify(clone.start)}, the bubble was at ${JSON.stringify(sourceBefore)}`,
        );
      if (!clone.destination)
        fail("midflight: the destination bubble is not mounted");
      else if (!clone.vector)
        fail("midflight: the final keyframe carries no translate/scale vector");
      else {
        const landingTop = clone.start.top + clone.vector.dy;
        const landingLeft = clone.start.left + clone.vector.dx;
        const landingWidth =
          (clone.start.right - clone.start.left) * clone.vector.sx;
        if (
          !near(landingTop, clone.destination.top) ||
          !near(landingLeft, clone.destination.left)
        )
          fail(
            `midflight: the flight lands at (${landingLeft}, ${landingTop}), the observed bubble is at (${clone.destination.left}, ${clone.destination.top})`,
          );
        if (
          !near(landingWidth, clone.destination.right - clone.destination.left)
        )
          fail(
            `midflight: the clone scales to ${landingWidth}px, the observed bubble is ${clone.destination.right - clone.destination.left}px wide`,
          );
        // From below the rule as it stood, to above the rule as it stands now.
        if (
          !settledBefore.ledge ||
          !midflight.ledge ||
          !sourceBefore ||
          sourceBefore.top < settledBefore.ledge.bottom - 0.5 ||
          clone.destination.bottom > midflight.ledge.top + 0.5
        )
          fail(
            "midflight: the flight does not cross the ledge from the ground to the wall",
          );
      }
      if (
        clone.duration !== CROSS_DURATION ||
        clone.easing !== CROSS_EASE ||
        clone.fill !== "both"
      )
        fail(
          `midflight: the flight runs ${clone.duration}ms ${clone.easing} fill ${clone.fill}, expected ${CROSS_DURATION}ms ${CROSS_EASE} fill both`,
        );
      const extraProperties = clone.keyframeProperties.filter(
        (key) => key !== "transform" && key !== "opacity",
      );
      if (clone.keyframeProperties.length === 0 || extraProperties.length)
        fail(
          `midflight: keyframes animate ${JSON.stringify(clone.keyframeProperties)}; only transform and opacity are allowed`,
        );
      if (clone.dataCarriers !== 1 || clone.focusable !== 0)
        fail(
          `midflight: the clone keeps ${clone.dataCarriers} data-carrying and ${clone.focusable} focusable nodes`,
        );
      if (!midflight.announcements.some((text) => text.includes(SENT_WORD)))
        fail(
          `midflight: the link was not announced as ${SENT_WORD}: ${JSON.stringify(midflight.announcements)}`,
        );
      if (midflight.indicator !== null)
        fail(
          "midflight: an indicator is shown although the destination is visible",
        );
      if (heldState !== "paused")
        fail(`midflight: holding the flight reported ${heldState}`);
      report.crossing = {
        sourceBefore,
        clone,
        layouts: { before: layoutsBefore, atClone: layoutsAtClone },
      };
      await screenshot("crossing-midflight-1440x900");
      const landed = await domBarrier(
        page,
        'body:not(:has([data-ui="crossing-clone"]))',
      );
      await freeze(false);
      await releaseFlight(page);
      await landed.wait();
      const layoutsAfter = await layoutCount(cdp);
      const crossed = await auditLedge(page);
      checkShell("crossed", crossed);
      if (
        crossed.clones !== 0 ||
        (crossed.overlay && crossed.overlay.children !== 0)
      )
        fail(
          `crossed: ${crossed.clones} clone(s) and ${crossed.overlay?.children} overlay children remain after animationend`,
        );
      if (crossed.pending.length !== 0)
        fail("crossed: the request is still below the ledge");
      if (crossed.history.filter((row) => row.id === observed.id).length !== 1)
        fail("crossed: the observed row was duplicated or removed");
      const first = await attemptOf(firstUuid);
      if (first?.state !== "submitted" || first.linkedMessageId !== observed.id)
        fail(
          `crossed: the link changed the request's status: ${JSON.stringify(first)}`,
        );
      // A per-frame layout loop over 300ms would show about 18 layouts; a compositor flight shows a handful.
      const layoutsDuringFlight = layoutsAfter - layoutsAtClone;
      if (layoutsDuringFlight > 6)
        fail(
          `crossed: ${layoutsDuringFlight} layouts during the 300ms flight; the flight must not write layout per frame`,
        );
      if (posts.length !== 12)
        fail(
          `crossed: ${posts.length} real POSTs for 12 explicit attempts; the link must not retry`,
        );
      report.crossed = {
        layoutsDuringFlight,
        posts: posts.length,
        attempt: first,
      };
      await screenshot("crossed-1440x900");

      // F. A room switch mid-flight: the clone, the overlay and every listener go with the room.
      const secondUuid = await submitPending(TEXTS.switching);
      const secondObserved = await readBack(TEXTS.switching);
      const baseline = await listenerCounts(cdp);
      await freeze(true);
      const flyingAgain = await domBarrier(page, '[data-ui="crossing-clone"]');
      const secondLinked = linkEvent(
        secondUuid,
        secondObserved.id,
        "second link",
      );
      await linkOf(secondUuid).click();
      await Promise.all([secondLinked, flyingAgain.wait()]);
      await holdFlight(page, 120);
      if ((await auditLedge(page)).clones !== 1)
        fail("switch: no clone to interrupt");
      const cleared = await domBarrier(
        page,
        'body:not(:has([data-ui="crossing-overlay"]))',
      );
      const otherWindow = events.expect(
        (event) => event.type === "context" && event.roomId === other.id,
        "other room window",
      );
      await page
        .locator(`[data-ui="fixture-room"][data-room-id="${other.id}"]`)
        .click();
      await Promise.all([cleared.wait(), otherWindow]);
      await freeze(false);
      const switched = await auditLedge(page);
      const after = await listenerCounts(cdp);
      const animations = await page.evaluate(
        () =>
          document.getAnimations().filter((item) => {
            const target = (item.effect as KeyframeEffect).target;
            return (
              target instanceof Element &&
              target.matches('[data-ui="crossing-clone"]')
            );
          }).length,
      );
      if (switched.clones !== 0 || switched.overlay !== null)
        fail(
          `switch: ${switched.clones} clone(s) and overlay ${JSON.stringify(switched.overlay)} survived the room change`,
        );
      if (animations !== 0)
        fail(`switch: ${animations} clone animation(s) still registered`);
      if (switched.pending.length !== 0)
        fail("switch: another room's request is shown below this room's ledge");
      if (
        switched.indicator !== null ||
        switched.announcements.some((text) => text.length > 0)
      )
        fail(
          "switch: the previous room's indicator or announcement leaked into this room",
        );
      for (const key of Object.keys(baseline))
        if (after[key] !== baseline[key])
          fail(
            `switch: listeners on ${key} went ${baseline[key]} → ${after[key]}`,
          );
      checkShell("switched", switched);
      report.switched = { listeners: { baseline, after }, animations };
      await screenshot("switched-midflight-1440x900");
      const backWindow = events.expect(
        (event) => event.type === "context" && event.roomId === room.id,
        "first room window again",
      );
      await page
        .locator(`[data-ui="fixture-room"][data-room-id="${room.id}"]`)
        .click();
      await backWindow;
      const returned = await auditLedge(page);
      if (returned.pending.length !== 0)
        fail("returned: the linked request reappeared below the ledge");
      if (
        returned.history.filter((row) => row.id === secondObserved.id)
          .length !== 1
      )
        fail("returned: the second observed row is missing or duplicated");
      if ((await attemptOf(secondUuid))?.linkedMessageId !== secondObserved.id)
        fail(
          "returned: the interrupted flight undid the user's link; motion must not own meaning",
        );

      // G. Reduced motion: the state changes, nothing flies, the row is announced.
      await page.emulateMedia({ reducedMotion: "reduce" });
      await wheel(-400, "reading-anchor");
      await wheel(2000, "follow-tail");
      const thirdUuid = await submitPending(TEXTS.reduced);
      const thirdObserved = await readBack(TEXTS.reduced);
      const detected = await armCloneDetector(page);
      const gone = await domBarrier(
        page,
        `[data-ui="ground"]:not(:has([data-attempt-id="${thirdUuid}"]))`,
      );
      const thirdLinked = linkEvent(
        thirdUuid,
        thirdObserved.id,
        "reduced-motion link",
      );
      await linkOf(thirdUuid).click();
      await Promise.all([thirdLinked, gone.wait()]);
      const reduced = await auditLedge(page);
      const cloneSeen = await detected();
      checkShell("reduced", reduced);
      if (!reduced.reducedMotion)
        fail("reduced: the page does not report prefers-reduced-motion");
      if (cloneSeen.length || reduced.clones !== 0)
        fail(
          `reduced: a clone was created under prefers-reduced-motion: ${JSON.stringify(cloneSeen)}`,
        );
      if (reduced.pending.length !== 0)
        fail("reduced: the request is still below the ledge");
      const thirdRow = reduced.history.find(
        (row) => row.id === thirdObserved.id,
      );
      if (
        !thirdRow ||
        !reduced.ledge ||
        thirdRow.bottom > reduced.ledge.top + 0.5
      )
        fail("reduced: the observed row is not above the ledge");
      if (!reduced.announcements.some((text) => text.includes(SENT_WORD)))
        fail("reduced: the link was not announced without motion");
      report.reduced = { cloneSeen, announcements: reduced.announcements };
      await screenshot("reduced-motion-1440x900");
      await page.emulateMedia({ reducedMotion: "no-preference" });

      // H. The reader is up in the history: the destination is out of view, nothing flies, nothing yanks.
      const fourthUuid = await submitPending(TEXTS.away);
      await wheel(-1400, "reading-anchor");
      const fourthObserved = await readBack(TEXTS.away);
      const scrolledUp = await auditLedge(page);
      const anchorBefore = scrolledUp.history.find(
        (row) => row.bottom > (scrolledUp.wall?.top ?? 0),
      );
      const fourthRowBefore = scrolledUp.history.find(
        (row) => row.id === fourthObserved.id,
      );
      if (
        !scrolledUp.wall ||
        !fourthRowBefore ||
        fourthRowBefore.top < scrolledUp.wall.bottom
      )
        fail(
          `offscreen: the destination should be below the wall's view: ${JSON.stringify(fourthRowBefore)} vs ${JSON.stringify(scrolledUp.wall)}`,
        );
      const detectedAgain = await armCloneDetector(page);
      const indicated = await domBarrier(
        page,
        '[data-ui="crossing-indicator"]',
      );
      const fourthLinked = linkEvent(
        fourthUuid,
        fourthObserved.id,
        "offscreen link",
      );
      await linkOf(fourthUuid).click();
      await Promise.all([fourthLinked, indicated.wait()]);
      const offscreen = await auditLedge(page);
      const cloneSeenAgain = await detectedAgain();
      checkShell("offscreen", offscreen);
      const anchorAfter = offscreen.history.find(
        (row) => row.id === anchorBefore?.id,
      );
      if (cloneSeenAgain.length || offscreen.clones !== 0)
        fail(
          `offscreen: a clone flew toward a destination that is not on screen: ${JSON.stringify(cloneSeenAgain)}`,
        );
      if (!offscreen.indicator)
        fail("offscreen: no indicator for the out-of-view destination");
      if (
        !anchorBefore ||
        !anchorAfter ||
        Math.abs(anchorAfter.top - anchorBefore.top) > 2
      )
        fail(
          `offscreen: the reader was yanked: anchor ${anchorBefore?.id} moved from ${anchorBefore?.top} to ${anchorAfter?.top}`,
        );
      if (
        offscreen.wall &&
        scrolledUp.wall &&
        Math.abs(offscreen.wall.scrollTop - scrolledUp.wall.scrollTop) > 2
      )
        fail(
          `offscreen: the wall scrolled from ${scrolledUp.wall.scrollTop} to ${offscreen.wall.scrollTop} without the user`,
        );
      if (offscreen.pending.length !== 0)
        fail("offscreen: the request is still below the ledge");
      report.offscreen = {
        anchorBefore,
        anchorAfter,
        indicator: offscreen.indicator,
        scrollTop: [scrolledUp.wall?.scrollTop, offscreen.wall?.scrollTop],
      };
      await screenshot("offscreen-indicator-1440x900");
      const revealed = await domBarrier(
        page,
        'body:not(:has([data-ui="crossing-indicator"]))',
      );
      await page.locator('[data-ui="crossing-reveal"]').click();
      await revealed.wait();
      const shown = await auditLedge(page);
      const fourthRowAfter = shown.history.find(
        (row) => row.id === fourthObserved.id,
      );
      if (
        !shown.wall ||
        !fourthRowAfter ||
        fourthRowAfter.bottom > shown.wall.bottom + 0.5 ||
        fourthRowAfter.top < shown.wall.top - 0.5
      )
        fail(
          `revealed: the destination is still out of view: ${JSON.stringify(fourthRowAfter)}`,
        );
      if (shown.indicator !== null)
        fail("revealed: the indicator stays after the row is in view");
      report.revealed = { row: fourthRowAfter, wall: shown.wall };
      await screenshot("revealed-1440x900");

      // I. A rejected request stays below; 새 시도 준비 hands the draft back through the ledge without a POST.
      const sixth = await control(page, "preview", TEXTS.rejected);
      if (sixth?.state !== "awaiting-consent")
        throw new Error("The rejected-case preview did not reach consent");
      bridge.failNext("/send", 429);
      const rejected = await domBarrier(
        page,
        `[data-attempt-id="${sixth.uuid}"][data-send-state="rejected"]`,
      );
      const postsBefore = posts.length;
      const rejectedState = await control(page, "confirm", sixth.uuid);
      await rejected.wait();
      const restored = await domBarrier(
        page,
        '[data-ui="fixture-restored-draft"]',
      );
      await page
        .locator(
          `[data-attempt-id="${sixth.uuid}"] [data-ui="pending-new-attempt"]`,
        )
        .click();
      await restored.wait();
      const finale = await auditLedge(page);
      checkShell("finale", finale);
      if (rejectedState !== "rejected")
        fail(`finale: 429 ended in ${rejectedState}`);
      if (posts.length !== postsBefore + 1)
        fail(
          `finale: ${posts.length - postsBefore} POST(s) for one rejected attempt and one restored draft`,
        );
      if (finale.restoredDraft !== TEXTS.rejected)
        fail("finale: 새 시도 준비 did not hand the draft back");
      if (
        finale.pending.length !== 1 ||
        finale.pending[0]?.state !== "rejected"
      )
        fail(
          `finale: the rejected request must stay below the ledge: ${JSON.stringify(finale.pending)}`,
        );
      report.finale = { posts: posts.length, pending: finale.pending };
    } finally {
      await Bun.write(
        resolve(evidence, "ledge-crossing-report.json"),
        `${JSON.stringify({ failures, ...report }, null, 2)}\n`,
      );
      await control(page, "close").catch((error: unknown) =>
        fail(`close: ${String(error)}`),
      );
    }
    log("ledge-crossing-audit", {
      failures: failures.length,
      posts: posts.length,
    });
    if (failures.length)
      throw new Error(
        [`${failures.length} ledge contract failure(s):`, ...failures].join(
          "\n - ",
        ),
      );
  },
};
