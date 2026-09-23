import { resolve } from "node:path";
import { Barriers } from "../harness/barriers";
import { domBarrier } from "../harness/browser-barriers";
import type { Scenario } from "../harness/runner";

// Test-only composition of the real transport, reconciler and ThreadPane. The
// application composition root is owned separately; no QA entry ships in dist.
const entry = `
import { createElement, useSyncExternalStore } from "react";
import { createRoot } from "react-dom/client";
import { BoundedCache } from "./src/core/cache";
import { ContextWindows } from "./src/core/context";
import { Reconciler } from "./src/core/reconcile";
import { ReconnectController, resumeUrl } from "./src/coordination/reconnect";
import { HttpClient } from "./src/transport/http";
import { streamEvents } from "./src/transport/sse";
import { ThreadPane } from "./src/features/thread";
import "./src/styles/tokens.css";
window.startRace = (room) => {
  const cache = new BoundedCache();
  cache.setCatalog([room]);
  cache.selectRoom(room.id);
  const reconcile = new Reconciler(cache, { http: new HttpClient() });
  const windows = new ContextWindows(reconcile, cache);
  const report = (event) => window.raceEvent(event);
  windows.subscribe(room.id, () => {
    const state = windows.getSnapshot(room.id);
    if (state.settled && !state.loading) report({ type: "context-applied" });
  });
  const reconnect = new ReconnectController({
    random: () => 0,
    open: (signal) => {
      const url = resumeUrl(reconcile.resume().cursor);
      return streamEvents({ signal, url, onEvent(record) {
        reconcile.accept(record);
        if (record.type === "message") reconnect.received();
        report({ type: record.type, url, id: record.type === "message" ? record.data.message.id : null });
      }});
    }
  });
  function Gap() {
    const state = useSyncExternalStore((fn) => reconcile.subscribe(room.id, fn), () => reconcile.getSnapshot(room.id));
    return createElement("p", { "data-ui": "reconcile-gap", "data-gap-count": state.gaps.length, role: "status" }, state.gaps.length ? "동기화 범위 확인 필요 · 일부 기록은 이 창에 없을 수 있습니다" : "이 기기에 저장된 범위만 표시합니다");
  }
  const root = document.createElement("main");
  root.style.cssText = "height:100dvh;display:flex;flex-direction:column;max-width:880px;margin:auto;background:var(--field-wall);color:var(--ink);font-family:system-ui,sans-serif";
  document.body.style.cssText = "margin:0;background:var(--field-ground)";
  document.body.append(root);
  createRoot(root).render(createElement("div", { style: { minHeight: 0, display: "flex", flexDirection: "column", height: "100%" } },
    createElement("h1", null, room.title), createElement(Gap),
    createElement(ThreadPane, { stores: cache.stores, windows, roomId: room.id })));
  window.race = {
    inspect: () => ({ thread: cache.stores.getSnapshot("thread." + room.id), reconcile: { ...reconcile.getSnapshot(room.id), request: null }, resume: reconcile.resume() }),
    retain: (ids) => ids.forEach((id) => cache.putMessages(id, [])),
    stop: async () => { await reconnect.stop(); reconcile.dispose(); }
  };
  reconnect.start();
};
`;

type BrowserEvent = { type: string; url?: string; id?: string };
function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}

export const scenario: Scenario = {
  id: "context-stream-race",
  async run({ page, bridge, url, evidence, log, screenshot }) {
    const room = bridge.data.rooms[0];
    const old = room && bridge.data.messages.get(room.id)?.at(-1);
    assert(room && old, "Missing synthetic room");
    const newer = {
      ...old,
      id: (BigInt(old.id) + 1n).toString(),
      text: "가상 등불: 창을 읽는 동안 도착한 새 소식입니다.",
    };
    const build = await Bun.build({
      entrypoints: ["race-entry"],
      target: "browser",
      format: "iife",
      plugins: [
        {
          name: "race-entry",
          setup(builder) {
            builder.onResolve({ filter: /^race-entry$/ }, () => ({
              path: "race-entry",
              namespace: "race",
            }));
            builder.onLoad({ filter: /.*/, namespace: "race" }, () => ({
              contents: entry,
              loader: "js",
              resolveDir: resolve(import.meta.dir, "../.."),
            }));
          },
        },
      ],
    });
    if (!build.success)
      throw new AggregateError(build.logs, "Race browser bundle failed");
    const events = new Barriers<BrowserEvent>();
    await page.exposeFunction("raceEvent", (event: BrowserEvent) =>
      events.emit(event),
    );
    await page.goto(`${url}/__qa/blank`);
    for (const output of build.outputs) {
      if (output.path.endsWith(".css"))
        await page.addStyleTag({ content: await output.text() });
      else if (output.path.endsWith(".js"))
        await page.addScriptTag({ content: await output.text() });
    }
    const release = bridge.pauseNext("/context");
    const requested = bridge.events.expect(
      (event) => event.type === "request" && event.path === "/context",
      "paused context requested",
    );
    const ready = events.expect(
      (event) => event.type === "ready",
      "stream ready",
    );
    await page.evaluate(
      (room) =>
        (Reflect.get(window, "startRace") as (room: unknown) => void)(room),
      room,
    );
    await Promise.all([requested, ready]);
    try {
      const observed = events.expect(
        (event) => event.type === "message" && event.id === newer.id,
        "new row applied during snapshot",
      );
      const shown = await domBarrier(page, `[data-message-id="${newer.id}"]`);
      bridge.emit("message", { ok: true, message: newer }, [1, 2, 7, 101]);
      await Promise.all([observed, shown.wait()]);
      const before = await page.evaluate(() =>
        (
          Reflect.get(window, "race") as {
            inspect(): {
              thread: { cursor: string | null };
              reconcile: { revision: number };
            };
          }
        ).inspect(),
      );
      assert(
        before.thread.cursor === null,
        "Cursor advanced before cursor event",
      );
      const settled = events.expect(
        (event) => event.type === "context-applied",
        "stale context merged",
      );
      release();
      await settled;
      log("context-stream-race", { requestHeld: true, newerId: newer.id });
      const duplicate = events.expect(
        (event) => event.type === "message" && event.id === newer.id,
        "duplicate parsed",
      );
      const revisionBefore = await page.evaluate(
        () =>
          (
            Reflect.get(window, "race") as {
              inspect(): { reconcile: { revision: number } };
            }
          ).inspect().reconcile.revision,
      );
      bridge.emit("message", { ok: true, message: newer });
      await duplicate;
      const current = await page.evaluate(() =>
        (
          Reflect.get(window, "race") as {
            inspect(): {
              thread: { order: string[] };
              reconcile: { revision: number };
            };
          }
        ).inspect(),
      );
      assert(
        current.thread.order.includes(newer.id),
        "Stale snapshot erased the new ID",
      );
      assert(
        current.thread.order.filter((id) => id === newer.id).length === 1,
        "Duplicate row was inserted",
      );
      assert(
        current.reconcile.revision === revisionBefore,
        "Duplicate changed the apply revision",
      );
      assert(
        current.thread.order.length === 41,
        "Snapshot and delta were not merged",
      );

      const cursor = Object.fromEntries(
        Array.from({ length: 1000 }, (_, index) => [
          (BigInt(room.id) + BigInt(index)).toString(),
          newer.id,
        ]),
      );
      const retained = Object.keys(cursor).slice(1, 5);
      await page.evaluate(
        (ids) =>
          (
            Reflect.get(window, "race") as { retain(ids: string[]): void }
          ).retain(ids),
        retained,
      );
      const checkpoint = events.expect(
        (event) => event.type === "cursor",
        "1000-room cursor applied",
      );
      bridge.emit("cursor", { ok: true, cursor });
      await checkpoint;
      const reopened = events.expect(
        (event) => event.type === "ready",
        "resumed stream ready",
      );
      const request = page.waitForRequest(
        (request) => new URL(request.url()).pathname === "/api/stream",
        { timeout: 10_000 },
      );
      bridge.endStreams();
      const [resumed, actual] = await Promise.all([reopened, request]);
      const captured = new URL(actual.url());
      const since = captured.searchParams.getAll("since");
      const bytes = new TextEncoder().encode(actual.url()).byteLength;
      assert(
        since.length === 5 && bytes <= 8192,
        "Resume URL exceeded the retained-room cap",
      );
      assert(
        resumed.url && new URL(resumed.url, url).href === actual.url(),
        "Captured URL was not the actual reconnect request",
      );
      await Bun.write(
        resolve(evidence, "resume-url.json"),
        JSON.stringify(
          {
            url: actual.url(),
            sinceCount: since.length,
            bytes,
            cursorRooms: 1000,
            liveGapForOtherRooms: true,
          },
          null,
          2,
        ),
      );
      log("captured-resume-url", {
        url: actual.url(),
        sinceCount: since.length,
        bytes,
      });
      const gap = await page
        .locator('[data-ui="reconcile-gap"]')
        .getAttribute("data-gap-count");
      assert(gap !== "0", "Live-start gap was not disclosed");
      await screenshot("context-stream-race-desktop");
      await page.setViewportSize({ width: 390, height: 844 });
      await screenshot("context-stream-race-mobile");
    } finally {
      release();
      await page.evaluate(() =>
        (Reflect.get(window, "race") as { stop(): Promise<void> }).stop(),
      );
    }
  },
};
