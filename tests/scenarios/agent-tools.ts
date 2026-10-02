import type { BrowserContext, Page } from "playwright-core";
import { domBarrier, responseBarrier } from "../harness/browser-barriers";
import type { Scenario } from "../harness/runner";

type Probe = {
  names(): string[];
  annotations(name: string): Record<string, boolean> | null;
  schema(name: string): { properties: Record<string, unknown> } | null;
  execute(name: string, input: unknown): Promise<string>;
  when(count: number): Promise<number>;
};

/**
 * A stand-in for Chrome 150's `document.modelContext`, with the parts this
 * client depends on and the one that matters for withdrawal: registration is
 * bound to the caller's AbortSignal, so aborting it takes the tool away again.
 */
function installModelContext(target: BrowserContext) {
  return target.addInitScript(() => {
    const tools = new Map<string, Record<string, unknown>>();
    const waiters = new Set<{
      want: number;
      resolve: (size: number) => void;
    }>();
    const notify = () => {
      for (const waiter of [...waiters]) {
        if (waiter.want !== tools.size) continue;
        waiters.delete(waiter);
        waiter.resolve(tools.size);
      }
    };
    Object.defineProperty(document, "modelContext", {
      configurable: true,
      value: {
        registerTool(
          tool: { name: string },
          options?: { signal?: AbortSignal },
        ) {
          if (options?.signal?.aborted) return Promise.resolve();
          tools.set(tool.name, tool as Record<string, unknown>);
          options?.signal?.addEventListener("abort", () => {
            tools.delete(tool.name);
            notify();
          });
          notify();
          return Promise.resolve();
        },
      },
    });
    Reflect.set(window, "agentProbe", {
      names: () => [...tools.keys()].sort(),
      annotations: (name: string) => tools.get(name)?.annotations ?? null,
      schema: (name: string) => tools.get(name)?.inputSchema ?? null,
      execute: (name: string, input: unknown) => {
        const tool = tools.get(name);
        if (!tool) throw new Error(`No tool ${name}`);
        return (tool.execute as (value: unknown) => Promise<string>)(input);
      },
      when: (count: number) =>
        new Promise((resolve) => {
          waiters.add({ want: count, resolve });
          notify();
        }),
    });
  });
}

function registered(page: Page) {
  return page.evaluate(() =>
    (Reflect.get(window, "agentProbe") as Probe).names(),
  );
}

function awaitTools(page: Page, count: number) {
  return page.evaluate(
    (want) => (Reflect.get(window, "agentProbe") as Probe).when(want),
    count,
  );
}

function callTool(page: Page, name: string, input: unknown) {
  return page.evaluate(
    ([tool, value]) =>
      (Reflect.get(window, "agentProbe") as Probe).execute(
        tool as string,
        value,
      ),
    [name, input] as const,
  );
}

/**
 * The experimental agent tools against the synthetic bridge, in real Chrome
 * with a stand-in model context. Off until somebody reads the warning and
 * says yes; four read-only tools after that; a mark on the screen and a line
 * in the log for every call; the consent survives a reload and withdrawing it
 * takes every tool away. A browser without the API is left alone entirely.
 */
export const scenario: Scenario = {
  id: "agent-tools",
  async run({
    page,
    context,
    browser,
    bridge,
    url,
    evidence,
    screenshot,
    log,
  }) {
    const failures: string[] = [];
    const fail = (message: string) => failures.push(message);
    const room = bridge.data.rooms[0];
    const rows = room ? bridge.data.messages.get(room.id) : undefined;
    if (!room || !rows?.length) throw new Error("Fixture lacks a room");
    const asked: string[] = [];
    page.on("request", (request) => {
      const address = new URL(request.url());
      if (address.pathname.startsWith("/api")) asked.push(address.href);
    });

    await installModelContext(context);
    const rooms = responseBarrier(page, "/api/rooms");
    await page.goto(`${url}/#/rooms`, { waitUntil: "load" });
    await rooms;

    // 1. Nothing is registered before anybody says yes.
    const dialog = await domBarrier(
      page,
      'dialog[data-ui="agent-dialog"][open]',
    );
    await page.locator('[data-ui="agent-open"]').click();
    await dialog.wait();
    const atRest = await registered(page);
    log("default", { registered: atRest });
    if (atRest.length !== 0) fail(`registered while off: ${atRest}`);
    await screenshot("agent-settings-off-1440");

    // 2. The switch asks before it changes anything.
    const warning = await domBarrier(page, '[data-ui="agent-warning"]');
    await page.locator('[data-ui="agent-toggle"]').click();
    await warning.wait();
    const whileAsking = await registered(page);
    log("asking", { registered: whileAsking });
    if (whileAsking.length !== 0) {
      fail(`registered before consent: ${whileAsking}`);
    }
    await screenshot("agent-warning-1440");

    // 3. Consent registers the four read-only tools and is remembered.
    const armed = awaitTools(page, 4);
    await page.locator('[data-ui="agent-confirm"]').click();
    await armed;
    const names = await registered(page);
    log("registered", { names });
    if (
      names.join(",") !==
      "get_room_messages,list_rooms,search_messages,unread_summary"
    ) {
      fail(`tools: ${names}`);
    }
    const marks = await page.evaluate(() => {
      const found = Reflect.get(window, "agentProbe") as Probe;
      return found.names().map((name) => ({
        name,
        annotations: found.annotations(name),
        properties: Object.keys(found.schema(name)?.properties ?? {}),
      }));
    });
    log("annotations", { marks });
    for (const mark of marks) {
      if (mark.annotations?.readOnlyHint !== true) {
        fail(`${mark.name} is not marked read-only`);
      }
      if (mark.annotations?.untrustedContentHint !== true) {
        fail(`${mark.name} does not mark its output untrusted`);
      }
    }
    const stored = await page.evaluate(() =>
      localStorage.getItem("saya.agent-tools"),
    );
    if (stored !== "on") fail(`stored consent: ${stored}`);

    // 4. A call is marked on the screen while it runs and recorded afterwards.
    await page.locator('[data-ui="agent-close"]').click();
    await page
      .locator('dialog[data-ui="agent-dialog"]')
      .waitFor({ state: "detached" });
    const release = bridge.pauseNext("/context");
    const activity = await domBarrier(page, '[data-ui="agent-activity"]');
    const reading = callTool(page, "get_room_messages", {
      roomId: room.id,
      limit: 5,
    });
    await activity.wait();
    const mark = await page.locator('[data-ui="agent-activity"]').textContent();
    log("activity", { mark });
    await screenshot("agent-activity-1440");
    release();
    const answer = JSON.parse(await reading) as {
      ok: boolean;
      messages: { id: string }[];
    };
    log("answer", {
      ok: answer.ok,
      count: answer.messages?.length,
      matchesFixture: answer.messages?.at(-1)?.id === rows.at(-1)?.id,
    });
    if (!answer.ok || answer.messages.length !== 5) {
      fail(
        `get_room_messages answered ${JSON.stringify(answer).slice(0, 120)}`,
      );
    }
    if (answer.messages.at(-1)?.id !== rows.at(-1)?.id) {
      fail("the answer is not this room's newest rows");
    }

    // 5. The tool never opens a room, which would mark it read on the desktop.
    const opened = asked.filter((address) => address.includes("open=true"));
    log("requests", { api: asked.length, opened: opened.length });
    if (opened.length !== 0) fail(`a tool opened a room: ${opened}`);

    const openAgain = await domBarrier(
      page,
      'dialog[data-ui="agent-dialog"][open]',
    );
    await page.locator('[data-ui="agent-open"]').click();
    await openAgain.wait();
    const logged = await page.evaluate(() =>
      [...document.querySelectorAll('[data-ui="agent-log"] li')].map(
        (item) => item.getAttribute("data-tool") ?? "",
      ),
    );
    log("log", { logged });
    if (logged[0] !== "get_room_messages") fail(`log reads ${logged}`);
    await screenshot("agent-log-1440");

    // 6. The consent survives a reload; the tools come back without asking again.
    const reloaded = responseBarrier(page, "/api/rooms");
    await page.reload({ waitUntil: "load" });
    await reloaded;
    const back = await awaitTools(page, 4);
    log("after-reload", { registered: back });

    // 7. Withdrawing it takes every tool away.
    const reopened = await domBarrier(
      page,
      'dialog[data-ui="agent-dialog"][open]',
    );
    await page.locator('[data-ui="agent-open"]').click();
    await reopened.wait();
    const withdrawn = awaitTools(page, 0);
    await page.locator('[data-ui="agent-toggle"]').click();
    await withdrawn;
    const afterOff = await page.evaluate(() => ({
      names: (Reflect.get(window, "agentProbe") as Probe).names(),
      stored: localStorage.getItem("saya.agent-tools"),
    }));
    log("withdrawn", afterOff);
    if (afterOff.names.length !== 0) {
      fail(`still registered: ${afterOff.names}`);
    }
    if (afterOff.stored !== "off") fail(`stored: ${afterOff.stored}`);

    // 8. The sheet at 390, where the list is the whole screen.
    await page.setViewportSize({ width: 390, height: 844 });
    await screenshot("agent-settings-390");
    const fit = await page.evaluate(() => {
      const sheet = document.querySelector('dialog[data-ui="agent-dialog"]');
      const box = sheet?.getBoundingClientRect();
      return {
        inside:
          !!box &&
          box.left >= 0 &&
          box.right <= window.innerWidth &&
          box.top >= 0,
        overflow:
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth,
      };
    });
    log("sheet-390", fit);
    if (!fit.inside || fit.overflow) fail(`390: ${JSON.stringify(fit)}`);

    // 9. A browser that does not offer the API is left completely alone.
    const plain = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    try {
      const bare = await plain.newPage();
      bare.setDefaultTimeout(10_000);
      const bareRooms = responseBarrier(bare, "/api/rooms");
      await bare.goto(`${url}/#/rooms`, { waitUntil: "load" });
      await bareRooms;
      const bareDialog = await domBarrier(
        bare,
        'dialog[data-ui="agent-dialog"][open]',
      );
      await bare.locator('[data-ui="agent-open"]').click();
      await bareDialog.wait();
      const unsupported = await bare.evaluate(() => ({
        api: "modelContext" in document,
        disabled:
          document
            .querySelector('[data-ui="agent-toggle"]')
            ?.hasAttribute("disabled") ?? false,
      }));
      log("no-api", unsupported);
      if (unsupported.api) {
        fail("the plain context should have no model context");
      }
      if (!unsupported.disabled) {
        fail("the switch is offered without the API");
      }
      await bare.screenshot({
        path: `${evidence}/agent-unsupported-1440.png`,
        fullPage: true,
        timeout: 10_000,
      });
      log("screenshot", { file: "agent-unsupported-1440.png" });
    } finally {
      await plain.close();
      log("plain-context-closed", {});
    }

    if (failures.length) throw new Error(failures.join("\n"));
  },
};
