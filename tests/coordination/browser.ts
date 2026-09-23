import { resolve } from "node:path";
import type { Page } from "playwright-core";
import type { CoordinatorStatus } from "../../src/coordination/coordinator";
import { Barriers, bounded } from "../harness/barriers";
import type { ScenarioContext } from "../harness/runner";

type Event = CoordinatorStatus & { nonce: string; applied: number };
function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
export async function exercise(context: ScenarioContext, replacements: number) {
  const { bridge, log, evidence, url } = context;
  const build = await Bun.build({
    entrypoints: [resolve(import.meta.dir, "browser-entry.ts")],
    target: "browser",
    format: "iife",
  });
  if (!build.success)
    throw new AggregateError(build.logs, "Coordinator bundle missing");
  const output = build.outputs[0];
  assert(output, "No coordinator bundle");
  const bundle = await output.text();
  const traffic: {
    channel: string;
    message: { kind: string; nonce?: string };
  }[] = [];
  const bridgeLog: unknown[] = [];
  let active = 0;
  let maximum = 0;
  // Tap the bridge's actual event emission, not a simulated stream counter.
  const emit = bridge.events.emit.bind(bridge.events);
  bridge.events.emit = (event) => {
    if (event.type === "stream-open") {
      active++;
      maximum = Math.max(maximum, active);
    }
    if (event.type === "stream-close") active--;
    bridgeLog.push({ ...event, active });
    emit(event);
  };
  async function tab(page: Page) {
    const events = new Barriers<Event>();
    let latest: Event | undefined;
    await page.exposeFunction("coordinationEvent", (event: Event) => {
      latest = event;
      events.emit(event);
    });
    await page.exposeFunction(
      "coordinationTraffic",
      (event: (typeof traffic)[number]) => traffic.push(event),
    );
    await page.goto(`${url}/__qa/blank`);
    await page.addScriptTag({ content: bundle });
    const ready = events.expect(
      (event) => event.mode === "live",
      "coordinator ready",
    );
    await page.evaluate(() =>
      (Reflect.get(window, "startCoordination") as () => void)(),
    );
    await ready;
    return {
      page,
      events,
      get latest() {
        assert(latest, "No coordinator status");
        return latest;
      },
    };
  }
  const room = bridge.data.rooms[0];
  assert(room, "Missing fixture room");
  const messages = bridge.data.messages.get(room.id);
  assert(messages, "Missing fixture messages");
  try {
    const opened = bridge.events.expect(
      (event) => event.type === "stream-open",
      "first stream",
    );
    let leader = await tab(await context.context.newPage());
    await opened;
    const follower = await tab(context.page);
    let other = await tab(await context.context.newPage());
    assert(bridge.activeStreams === 1, "Three tabs opened multiple streams");
    if (replacements) {
      // Chrome exempts Web-Lock holders from automatic lifecycle freezing. Deliver
      // that lifecycle signal, then pause the real JS target with the debugger.
      // The private BroadcastChannel remains open; its queued tasks cannot run.
      const cdp = await context.context.newCDPSession(follower.page);
      await follower.page.evaluate(() =>
        document.dispatchEvent(new Event("freeze")),
      );
      await cdp.send("Debugger.enable");
      const paused = new Promise<void>((resolve) =>
        cdp.once("Debugger.paused", () => resolve()),
      );
      const pauseEvaluation = cdp.send("Runtime.evaluate", {
        expression: "debugger;",
      });
      await bounded(paused, "follower debugger paused");
      const nonce = follower.latest.nonce;
      const before = traffic.filter(
        (entry) =>
          entry.channel === `saya:reply:${nonce}` &&
          entry.message.kind === "hint",
      ).length;
      for (let index = 0; index < replacements; index++) {
        const baseline = leader.latest.applied;
        const applied = leader.events.expect(
          (event) => event.applied > baseline,
          "leader applies stream event",
        );
        bridge.emit("message", { ok: true, message: messages[index] });
        await applied;
        const closed = bridge.events.expect(
          (event) => event.type === "stream-close",
          "old reader closes",
        );
        const next = bridge.events.expect(
          (event) => event.type === "stream-open",
          "new reader opens",
        );
        const promoted = other.events.expect(
          (event) => event.role === "leader",
          "follower promoted",
        );
        await leader.page.close();
        await Promise.all([closed, next, promoted]);
        leader = other;
        if (index < replacements - 1)
          other = await tab(await context.context.newPage());
      }
      const hints =
        traffic.filter(
          (entry) =>
            entry.channel === `saya:reply:${nonce}` &&
            entry.message.kind === "hint",
        ).length - before;
      assert(hints === 1, `Paused follower accumulated ${hints} hints`);
      log("paused-credit-bound", { replacements, outstandingHints: hints });
      const recovered = follower.events.expect(
        (event) => event.mode === "live" && event.epoch === leader.latest.epoch,
        "frozen follower re-registers",
      );
      await cdp.send("Debugger.resume");
      await pauseEvaluation;
      await follower.page.evaluate(() =>
        document.dispatchEvent(new Event("resume")),
      );
      await recovered;
      await cdp.detach();
    } else {
      const received = [leader, follower, other].map((item) => {
        const baseline = item.latest.applied;
        return item.events.expect(
          (event) => event.applied > baseline,
          "fan-out applied",
        );
      });
      bridge.emit("message", { ok: true, message: messages[0] });
      await Promise.all(received);
    }
    assert(maximum === 1, `Bridge observed ${maximum} concurrent readers`);
    assert(
      traffic
        .filter((entry) => entry.channel === "saya:requests:v1")
        .every((entry) => !JSON.stringify(entry.message).includes('message"')),
      "Shared channel contained message bodies",
    );
    assert(
      !bridge.requests.some((request) => request.path === "/send"),
      "Coordination retried a send",
    );
    log("single-stream", {
      maximum,
      streamsOpened: bridge.requests.filter(
        (request) => request.path === "/stream",
      ).length,
    });
  } finally {
    bridge.events.emit = emit;
    await Bun.write(
      resolve(evidence, "bridge-requests.json"),
      JSON.stringify(
        { requests: bridge.requests, events: bridgeLog, maximum },
        null,
        2,
      ),
    );
    await Bun.write(
      resolve(evidence, "coordination-traffic.json"),
      JSON.stringify(
        traffic.map(({ channel, message }) => ({
          channel,
          kind: message.kind,
        })),
        null,
        2,
      ),
    );
  }
}
