import { runPosition } from "../../src/features/thread/grouping";
import { responseBarrier } from "../harness/browser-barriers";
import type { Scenario } from "../harness/runner";

/**
 * KakaoTalk runs on the real wall. The baseline fixture rotates speakers every
 * second, so the scenario streams in two runs of its own (three from one
 * person, two of mine, in the newest row's minute). For every drawn turn the
 * DOM's first/last (picture and tail, time) must equal what the run rule
 * computes from the rows, and turns inside a run sit within 6px of each other.
 */
export const scenario: Scenario = {
  id: "message-grouping",
  async run({ page, bridge, url, log, screenshot }) {
    const room = bridge.data.rooms[1];
    const rows = room ? bridge.data.messages.get(room.id) : undefined;
    if (!room || !rows) throw new Error("Fixture lacks the second room");
    const failures: string[] = [];
    const newest = rows.at(-1);
    const speaker = rows.find((row) => !row.fromMe);
    if (!newest?.sentAt || !speaker) throw new Error("Fixture lacks rows");
    // Same minute as the newest row: it is at :39, so :50-:54 stay inside it.
    const base = new Date(newest.sentAt);
    base.setSeconds(50);
    const runs: typeof rows = [0, 1, 2, 3, 4].map((i) => ({
      ...newest,
      id: (BigInt(newest.id) + BigInt(i + 1)).toString(),
      fromMe: i >= 3,
      senderId: i >= 3 ? newest.senderId : speaker.senderId,
      sender: i >= 3 ? newest.sender : speaker.sender,
      text: `가상 연속 메시지 ${i + 1}`,
      kind: "text",
      sentAt: new Date(base.getTime() + i * 1000).toISOString(),
    }));
    let streamed = false;
    for (const [label, width, height] of [
      ["desktop", 1440, 900],
      ["mobile", 390, 844],
    ] as const) {
      await page.setViewportSize({ width, height });
      const rooms = responseBarrier(page, "/api/rooms");
      await page.goto(`${url}/#/rooms`, { waitUntil: "load" });
      const opened = bridge.events.expect(
        (event) => event.type === "stream-open",
        "stream open",
      );
      await page.reload({ waitUntil: "load" });
      await rooms;
      await opened;
      await page
        .locator(
          `nav[data-ui="rooms-pane"] a[href="#/room/${encodeURIComponent(room.id)}"]`,
        )
        .click();
      await page
        .locator('[data-ui="thread-wall"] [data-ui="message"]')
        .first()
        .waitFor();
      if (!streamed) {
        for (const message of runs)
          bridge.emit("message", { ok: true, message });
        streamed = true;
        rows.push(...runs);
      }
      const tail = page.locator(`[data-message-id="${runs.at(-1)?.id}"]`);
      await tail.waitFor();
      await tail.scrollIntoViewIfNeeded();
      const drawn = await page.evaluate(() =>
        [
          ...document.querySelectorAll<HTMLElement>(
            '[data-ui="thread-wall"] [data-message-id]',
          ),
        ].map((row) => {
          const turn = row.querySelector<HTMLElement>('[data-ui="message"]');
          const time = turn?.querySelector("time");
          const bubble = turn?.querySelector<HTMLElement>("[class*='bubble']");
          const top = turn?.getBoundingClientRect().top ?? 0;
          return {
            id: row.dataset.messageId ?? "",
            continued: turn?.dataset.continued === "true",
            last: turn?.dataset.runLast === "true",
            timeShown: time
              ? time.className !== "sr-only" &&
                time.getBoundingClientRect().width > 1
              : null,
            avatar: Boolean(turn?.querySelector("[class*='avatar'], img")),
            radius: bubble ? getComputedStyle(bubble).borderRadius : "",
            top,
            bottom: turn?.getBoundingClientRect().bottom ?? 0,
          };
        }),
      );
      const byId = new Map(rows.map((row, i) => [row.id, i]));
      let continuedCount = 0;
      drawn.forEach((turn, i) => {
        const index = byId.get(turn.id);
        if (index === undefined) return;
        const expected = runPosition(
          rows[index - 1],
          rows[index] as never,
          rows[index + 1],
        );
        if (turn.continued === expected.first)
          failures.push(
            `${label} ${turn.id}: continued=${turn.continued} expected first=${expected.first}`,
          );
        if (turn.last !== expected.last)
          failures.push(
            `${label} ${turn.id}: last=${turn.last} expected ${expected.last}`,
          );
        if (turn.timeShown !== null && turn.timeShown !== expected.last)
          failures.push(`${label} ${turn.id}: time shown=${turn.timeShown}`);
        if (turn.continued) {
          continuedCount++;
          const above = drawn[i - 1];
          if (above && turn.top - above.bottom > 6)
            failures.push(
              `${label} ${turn.id}: ${turn.top - above.bottom}px under the turn above`,
            );
          if (new Set(turn.radius.split(" ")).size !== 1)
            failures.push(
              `${label} ${turn.id}: continued bubble keeps a tail (${turn.radius})`,
            );
        }
      });
      if (continuedCount < 3)
        failures.push(`${label}: no run of two or more is drawn`);
      const wide = await page.evaluate(
        () =>
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth,
      );
      if (wide) failures.push(`${label}: page scrolls sideways`);
      log(`${label}`, { drawn: drawn.length, continued: continuedCount });
      await screenshot(`grouping-${label}`);
    }
    if (failures.length > 0) throw new Error(failures.slice(0, 20).join("\n"));
  },
};
