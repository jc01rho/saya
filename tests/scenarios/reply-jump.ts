import type { Page } from "playwright-core";
import type { components } from "../../src/contract/decoded";
import { domBarrier, responseBarrier } from "../harness/browser-barriers";
import type { Scenario } from "../harness/runner";

type Message = components["schemas"]["Message"];

const hrefFor = (roomId: string) => `#/room/${encodeURIComponent(roomId)}`;

/**
 * Resolves when the wall, on one of its own scroll or anchor events, shows
 * `id` inside its viewport (or, for "end", sits at its end). Bounded; never polled.
 */
function wallShows(page: Page, target: { id: string } | "end") {
  return page.evaluate(
    ({ target }) =>
      new Promise<void>((done, fail) => {
        const wall = document.querySelector<HTMLElement>(
          '[data-ui="thread-wall"]',
        );
        if (!wall) {
          fail(new Error("no wall"));
          return;
        }
        // The end is reached when the glide has finished, not on a scroll
        // frame passing through it: resizing mid-glide lets the glide win.
        const events =
          target === "end"
            ? ["scrollend", "thread-anchor-restored"]
            : ["scroll", "scrollend", "thread-anchor-restored"];
        const check = () => {
          if (target === "end") {
            const left = wall.scrollHeight - wall.clientHeight - wall.scrollTop;
            if (left > 2) return;
          } else {
            const row = wall.querySelector(
              `[data-message-id="${CSS.escape(target.id)}"]`,
            );
            if (!row) return;
            const box = row.getBoundingClientRect();
            const frame = wall.getBoundingClientRect();
            if (box.top < frame.top || box.top > frame.bottom - 40) return;
          }
          stop();
          done();
        };
        const timer = setTimeout(() => {
          stop();
          fail(new Error(`wall never showed ${JSON.stringify(target)}`));
        }, 10_000);
        const stop = () => {
          clearTimeout(timer);
          for (const name of events) {
            wall.removeEventListener(name, check);
          }
        };
        for (const name of events) {
          wall.addEventListener(name, check);
        }
        check();
      }),
    { target },
  );
}

/** What the wall says about itself: where it sits, how it is held, what the dock shows. */
function wallGeometry(page: Page) {
  return page.evaluate(() => {
    const wall = document.querySelector<HTMLElement>('[data-ui="thread-wall"]');
    const button = document.querySelector<HTMLElement>('[data-ui="to-end"]');
    if (!wall) throw new Error("no wall");
    return {
      scrollTop: Math.round(wall.scrollTop),
      scrollHeight: wall.scrollHeight,
      clientHeight: wall.clientHeight,
      mode: wall.dataset.scrollMode ?? null,
      rows: wall.querySelectorAll("[data-message-id]").length,
      visible: button?.dataset.visible ?? null,
    };
  });
}

/** The dock's controls against the wall and the composer: inside one, clear of the other. */
async function dockFits(page: Page) {
  return page.evaluate(() => {
    const rect = (selector: string) => {
      const element = document.querySelector(selector);
      if (!element) return null;
      const { top, right, bottom, left } = element.getBoundingClientRect();
      return { top, right, bottom, left };
    };
    const wall = rect('[data-ui="thread-wall"]');
    const composer = rect('[data-ui="composer"]');
    const send = rect('[data-ui="composer-send"]');
    const controls = [
      rect('[data-ui="to-end"][data-visible="true"]'),
      rect('[data-ui="jump-back"]'),
    ].filter((item) => item !== null);
    const problems: string[] = [];
    if (!wall || !composer) problems.push("wall or composer missing");
    if (controls.length === 0) problems.push("no visible dock control");
    for (const control of controls) {
      if (!wall || !composer) break;
      if (
        control.left < wall.left ||
        control.right > wall.right ||
        control.top < wall.top ||
        control.bottom > wall.bottom
      ) {
        problems.push(`clipped ${JSON.stringify(control)}`);
      }
      if (control.bottom > composer.top) {
        problems.push(`over the composer ${JSON.stringify(control)}`);
      }
    }
    return {
      problems,
      controls,
      send,
      overflow:
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    };
  });
}

/**
 * Answers to replies, against the synthetic bridge in real Chrome. A reply's
 * quote is a button to its original; an original older than the window is
 * found by widening it (shown, cancellable), marked for a moment, and the
 * reader can go back. A reader a screen above the end is offered the way down,
 * counting rows that arrive meanwhile, and the controls fit at 1440, 390 and
 * with the keyboard up. A quote whose original is nowhere says so.
 */
export const scenario: Scenario = {
  id: "reply-jump",
  async run({ page, bridge, url, screenshot, log }) {
    const failures: string[] = [];
    const fail = (message: string) => failures.push(message);
    const room = bridge.data.rooms[0];
    const other = bridge.data.rooms[1];
    const rows = room ? bridge.data.messages.get(room.id) : undefined;
    const otherRows = other ? bridge.data.messages.get(other.id) : undefined;
    const first = rows?.[0];
    if (!room || !other || !rows || !otherRows || !first) {
      throw new Error("Fixture lacks two rooms");
    }

    // Three hundred invented rows older than the window, so the original of
    // the newest reply is reachable only by widening 40 → 200 → 1000.
    const { replyTo: _r, mentions: _m, mentionsMe: _mm, ...plain } = first;
    const older: Message[] = Array.from({ length: 300 }, (_, index) => ({
      ...plain,
      id: (BigInt(first.id) - 1000n + BigInt(index)).toString(),
      text: `가상 옛 기록 ${index}번째 줄입니다.`,
      kind: "text",
      sentAt: new Date(
        Date.parse(first.sentAt ?? "") - 3_600_000 + index * 1000,
      ).toISOString(),
    }));
    const target = older[7];
    const reply = [...rows].reverse().find((row) => row.kind === "reply");
    if (!target || !reply) throw new Error("Fixture lacks a reply");
    reply.replyTo = {
      messageId: target.id,
      senderId: target.senderId,
      sender: target.sender,
      text: target.text,
      kind: target.kind,
    };
    bridge.data.messages.set(room.id, [...older, ...rows]);
    const lost = [...otherRows].reverse().find((row) => row.kind === "reply");
    if (!lost) throw new Error("Fixture lacks a second reply");
    lost.replyTo = {
      messageId: "1",
      senderId: lost.senderId,
      sender: lost.sender,
      text: "가상 원문, 어디에도 없는 줄",
      kind: "text",
    };

    const rooms = responseBarrier(page, "/api/rooms");
    await page.goto(`${url}/#/rooms`, { waitUntil: "load" });
    await rooms;
    const newest = rows.at(-1);
    if (!newest) throw new Error("empty room");
    const { replyTo: _nr, ...newestPlain } = newest;
    const opened = await domBarrier(
      page,
      `[data-ui="thread-wall"] [data-message-id="${newest.id}"]`,
    );
    await page.evaluate((href) => {
      location.hash = href;
    }, hrefFor(room.id));
    await opened.wait();

    // 1. The quote is a button with its own name.
    const quote = page.locator(
      `[data-message-id="${reply.id}"] [data-ui="quote"][role="button"]`,
    );
    const label = await quote.getAttribute("aria-label");
    log("quote", { label });
    if (label !== "원본 메시지로 이동") fail(`quote label ${label}`);

    // 2. Widening is shown while it runs; the first answer is held to see it.
    const release = bridge.pauseNext("/context");
    const progress = await domBarrier(page, '[data-ui="jump-progress"]');
    const found = await domBarrier(
      page,
      `[data-message-id="${target.id}"] [data-highlight]`,
      20_000,
    );
    await quote.click();
    await progress.wait();
    await screenshot("reply-jump-progress-1440");
    const progressText = await page
      .locator('[data-ui="jump-progress"]')
      .textContent();
    log("progress", { progressText });
    release();
    await found.wait();
    await wallShows(page, { id: target.id });
    const limit = await page
      .locator('[data-ui="thread-wall"]')
      .getAttribute("data-limit");
    log("found", { limit });
    if (limit !== "1000") fail(`window limit ${limit}`);
    await screenshot("reply-jump-found-1440");
    const fitBack = await dockFits(page);
    log("dock-1440-back", fitBack);
    if (fitBack.problems.length) fail(`1440 back: ${fitBack.problems}`);

    // 3. Back where the reader was.
    await page.locator('[data-ui="jump-back"]').click();
    await wallShows(page, { id: reply.id });
    log("back", { ok: true });

    // 4. Keyboard: the quote is reachable and Enter follows it.
    const again = await domBarrier(
      page,
      `[data-message-id="${target.id}"] [data-highlight]`,
    );
    await quote.focus();
    await page.keyboard.press("Enter");
    await again.wait();
    await wallShows(page, { id: target.id });
    log("keyboard", { ok: true });

    // 5. A screen above the end: the way down appears and counts arrivals.
    const shown = await domBarrier(
      page,
      '[data-ui="to-end"][data-visible="true"]',
    );
    await shown.wait();
    if (bridge.activeStreams === 0) {
      await bridge.events.expect(
        (event) => event.type === "stream-open",
        "stream open",
      );
    }
    const badge = await domBarrier(page, '[data-ui="to-end"] span');
    for (let index = 1; index <= 3; index++) {
      bridge.emit("message", {
        ok: true,
        message: {
          ...newestPlain,
          id: (BigInt(newest.id) + BigInt(index)).toString(),
          kind: "text",
          text: `가상 새 줄 ${index}`,
          sentAt: new Date(
            Date.parse(newest.sentAt ?? "") + index * 1000,
          ).toISOString(),
        },
      });
    }
    await badge.wait();
    const toEnd = page.locator('[data-ui="to-end"]');
    const toEndLabel = await toEnd.getAttribute("aria-label");
    log("to-end", { label: toEndLabel, badge: await toEnd.textContent() });
    await screenshot("to-end-badge-1440");
    const fit1440 = await dockFits(page);
    log("dock-1440", fit1440);
    if (fit1440.problems.length) fail(`1440: ${fit1440.problems}`);

    const hidden = await domBarrier(
      page,
      '[data-ui="to-end"][data-visible="false"]',
    );
    await toEnd.click();
    await wallShows(page, "end");
    await hidden.wait();
    log("to-end-arrived", { ok: true });

    // 6. 390 wide, then with the keyboard taking half the height.
    for (const [name, size] of [
      ["to-end-390", { width: 390, height: 844 }],
      ["to-end-390-keyboard", { width: 390, height: 460 }],
    ] as const) {
      await page.setViewportSize(size);
      const up = await domBarrier(
        page,
        '[data-ui="to-end"][data-visible="true"]',
      );
      const box = await page.locator('[data-ui="thread-wall"]').boundingBox();
      if (!box) throw new Error("the wall has no box");
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      for (let step = 0; step < 8; step++) await page.mouse.wheel(0, -700);
      log(`geometry-${name}`, await wallGeometry(page));
      await up.wait();
      await screenshot(name);
      const fit = await dockFits(page);
      log(`dock-${name}`, fit);
      if (fit.problems.length || fit.overflow) {
        fail(`${name}: ${fit.problems} overflow=${fit.overflow}`);
      }
    }

    // 7. An original that is nowhere is said, not guessed.
    await page.setViewportSize({ width: 390, height: 844 });
    const otherNewest = otherRows.at(-1);
    const otherOpen = await domBarrier(
      page,
      `[data-ui="thread-wall"] [data-message-id="${otherNewest?.id}"]`,
    );
    await page.evaluate((href) => {
      location.hash = href;
    }, hrefFor(other.id));
    await otherOpen.wait();
    const missing = await domBarrier(page, '[data-ui="jump-missing"]');
    await page
      .locator(
        `[data-message-id="${lost.id}"] [data-ui="quote"][role="button"]`,
      )
      .click();
    await missing.wait();
    await screenshot("jump-missing-390");
    log("missing", {
      text: await page.locator('[data-ui="jump-missing"]').textContent(),
    });

    if (failures.length) throw new Error(failures.join("\n"));
  },
};
