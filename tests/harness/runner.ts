import { existsSync } from "node:fs";
import { mkdir, rm } from "node:fs/promises";
import { createServer } from "node:net";
import { resolve } from "node:path";
import {
  type Browser,
  type BrowserContext,
  chromium,
  type Page,
} from "playwright-core";
import { type FixtureBridge, startBridge } from "../fixtures/bridge";
import type { Dataset } from "../fixtures/data";
import { bounded, deferred } from "./barriers";

export const ROOT = resolve(import.meta.dir, "../..");
export interface ScenarioContext {
  core: "synthetic" | "rust";
  browser: Browser;
  context: BrowserContext;
  page: Page;
  bridge: FixtureBridge;
  url: string;
  evidence: string;
  signal: AbortSignal;
  log: (action: string, details?: Record<string, unknown>) => void;
  screenshot: (name: string) => Promise<void>;
}
export interface Scenario {
  id: string;
  run: (context: ScenarioContext) => Promise<void>;
}
export interface RunOptions {
  core?: Readonly<{ url: string; token: string }>;
  evidence: string;
  port?: number;
  dataset?: Dataset;
  profile?: "desktop" | "mobile";
  timeoutMs?: number;
}
export interface CleanupReceipt {
  scenario: string;
  previewPid: number | null;
  browserPids: number[];
  survivingPids: number[];
  ports: number[];
  boundPorts: number[];
  profile: string | null;
  profileRemoved: boolean;
  errors: string[];
  clean: boolean;
}

export function processAlive(pid: number) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ESRCH") return false;
    throw error;
  }
}

/** One bind attempt is a definitive OS check, not a readiness polling loop. */
export async function assertPortFree(port: number) {
  await bounded(
    new Promise<void>((yes, no) => {
      const probe = createServer();
      probe.once("error", no);
      probe.listen({ host: "127.0.0.1", port, exclusive: true }, () =>
        probe.close((error) => (error ? no(error) : yes())),
      );
    }),
    `release port ${port}`,
  );
}

export async function runScenario(scenario: Scenario, options: RunOptions) {
  const evidence = resolve(options.evidence);
  await mkdir(evidence, { recursive: true });
  const actions: Record<string, unknown>[] = [];
  const browserEvents = { console: 0, consoleErrors: 0, pageErrors: 0 };
  const log = (action: string, details: Record<string, unknown> = {}) => {
    actions.push({ sequence: actions.length + 1, action, ...details });
  };
  let bridge: FixtureBridge | undefined;
  let preview: ReturnType<typeof Bun.spawn> | undefined;
  let browser: Browser | undefined;
  let profile: string | null = null;
  const browserPids: number[] = [];
  const ports: number[] = [];
  const abort = new AbortController();
  let failure: unknown;
  let completed = false;
  const cleanupErrors: string[] = [];
  try {
    bridge = startBridge({ dataset: options.dataset ?? "baseline" });
    if (bridge.port === undefined) throw new Error("Bridge has no port");
    ports.push(bridge.port);
    log("bridge-ready", {
      port: bridge.port,
      seed: bridge.data.seed,
      dataset: bridge.data.dataset,
    });
    const ready = deferred<number>();
    preview = Bun.spawn(
      [
        process.execPath,
        "run",
        resolve(ROOT, "tests/harness/preview-worker.ts"),
      ],
      {
        cwd: ROOT,
        env: {
          ...process.env,
          SAYA_QA_ROOT: ROOT,
          SAYA_QA_BRIDGE: options.core?.url ?? bridge.url,
          SAYA_QA_CORE_TOKEN: options.core?.token ?? "",
          SAYA_QA_PORT: String(options.port ?? 4173),
        },
        stdout: "pipe",
        stderr: "pipe",
        ipc(message: unknown) {
          if (
            message &&
            typeof message === "object" &&
            "type" in message &&
            message.type === "ready" &&
            "port" in message &&
            typeof message.port === "number"
          )
            ready.resolve(message.port);
        },
      },
    );
    const previewPort = await bounded(
      Promise.race([
        ready.promise,
        preview.exited.then((code) => {
          throw new Error(`Preview exited before ready (${code})`);
        }),
      ]),
      "preview ready",
      60_000,
    );
    ports.push(previewPort);
    log("preview-ready", { port: previewPort, pid: preview.pid });
    // launch() itself creates a fresh temporary user-data-dir; never reuse a user's profile.
    browser = await chromium.launch({
      channel: "chrome",
      args: ["--enable-automation"],
      headless: true,
      timeout: 30_000,
    });
    const cdp = await browser.newBrowserCDPSession();
    const commandLine = await cdp.send("Browser.getBrowserCommandLine");
    profile =
      commandLine.arguments
        .find((arg) => arg.startsWith("--user-data-dir="))
        ?.slice("--user-data-dir=".length) ?? null;
    if (!profile)
      throw new Error("Chrome did not expose its throwaway profile");
    const processInfo = await cdp.send("SystemInfo.getProcessInfo");
    browserPids.push(...processInfo.processInfo.map((info) => info.id));
    await cdp.detach();
    log("browser-ready", { channel: "chrome" });
    const context = await browser.newContext({
      viewport:
        options.profile === "mobile"
          ? { width: 390, height: 844 }
          : { width: 1440, height: 900 },
    });
    // Record occurrence metadata only: messages, arguments, URLs and stacks can
    // contain credentials or user data, even when an exception looks routine.
    context.on("page", (observedPage) => {
      observedPage.on("console", (message) => {
        browserEvents.console++;
        if (message.type() === "error") browserEvents.consoleErrors++;
        const { lineNumber, columnNumber } = message.location();
        log("browser-console", {
          type: message.type(),
          lineNumber,
          columnNumber,
          contentOmitted: true,
        });
      });
      observedPage.on("pageerror", () => {
        browserEvents.pageErrors++;
        log("browser-pageerror", { contentOmitted: true });
      });
    });
    log("browser-error-capture-start", { policy: "metadata-only" });
    const page = await context.newPage();
    page.setDefaultTimeout(10_000);
    page.setDefaultNavigationTimeout(30_000);
    page.on("request", (request) =>
      log("request", {
        method: request.method(),
        path: new URL(request.url()).pathname,
      }),
    );
    page.on("response", (response) =>
      log("response", {
        status: response.status(),
        path: new URL(response.url()).pathname,
      }),
    );
    const screenshot = async (name: string) => {
      if (!/^[a-z0-9-]+$/i.test(name))
        throw new Error("Invalid screenshot name");
      await page.screenshot({
        path: resolve(evidence, `${name}.png`),
        fullPage: true,
        timeout: 10_000,
      });
      log("screenshot", { file: `${name}.png` });
    };
    log("scenario-start", { id: scenario.id });
    await bounded(
      scenario.run({
        core: options.core ? "rust" : "synthetic",
        browser,
        context,
        page,
        bridge,
        evidence,
        signal: abort.signal,
        url: `http://127.0.0.1:${previewPort}`,
        log,
        screenshot,
      }),
      `scenario ${scenario.id}`,
      options.timeoutMs ?? 60_000,
    );
    completed = true;
    await screenshot(scenario.id);
    log("scenario-complete", { id: scenario.id });
  } catch (error) {
    failure = error;
    log("scenario-failed", { error: String(error) });
  } finally {
    abort.abort();
    const cleanup = async (label: string, action: () => Promise<unknown>) => {
      try {
        await action();
        log(label);
      } catch (error) {
        cleanupErrors.push(`${label}: ${String(error)}`);
      }
    };
    if (browser) {
      const launchedBrowser = browser;
      await cleanup("browser-processes-captured", async () => {
        // Capture renderers created by the scenario as well as the original browser process.
        if (launchedBrowser.isConnected()) {
          const cdp = await launchedBrowser.newBrowserCDPSession();
          const info = await cdp.send("SystemInfo.getProcessInfo");
          for (const entry of info.processInfo)
            if (!browserPids.includes(entry.id)) browserPids.push(entry.id);
          await cdp.detach();
        }
      });
      await cleanup("browser-closed", () =>
        bounded(launchedBrowser.close(), "browser close", 15_000),
      );
    }
    if (bridge) {
      const fixture = bridge;
      await cleanup("bridge-closed", () =>
        bounded(fixture.stop(), "bridge stop"),
      );
    }
    if (preview) {
      const child = preview;
      await cleanup("preview-closed", async () => {
        if (child.exitCode === null) {
          try {
            child.send({ type: "stop" });
            await bounded(child.exited, "preview exit", 10_000);
          } catch (error) {
            child.kill();
            await bounded(child.exited, "forced preview exit");
            throw error;
          }
        }
        const stdout = child.stdout;
        const stderr = child.stderr;
        if (stdout && typeof stdout !== "number")
          await Bun.write(
            resolve(evidence, "preview-stdout.log"),
            await new Response(stdout).text(),
          );
        if (stderr && typeof stderr !== "number")
          await Bun.write(
            resolve(evidence, "preview-stderr.log"),
            await new Response(stderr).text(),
          );
      });
    }
    if (profile) {
      const directory = profile;
      await cleanup("profile-removed", () =>
        rm(directory, { recursive: true, force: true }),
      );
    }
    const survivingPids = [
      ...new Set([...browserPids, ...(preview ? [preview.pid] : [])]),
    ].filter(processAlive);
    const boundPorts: number[] = [];
    for (const port of ports) {
      try {
        await assertPortFree(port);
      } catch (error) {
        boundPorts.push(port);
        cleanupErrors.push(String(error));
      }
    }
    const profileRemoved = profile === null || !existsSync(profile);
    const receipt: CleanupReceipt = {
      scenario: scenario.id,
      previewPid: preview?.pid ?? null,
      browserPids,
      survivingPids,
      ports,
      boundPorts,
      profile,
      profileRemoved,
      errors: cleanupErrors,
      clean:
        survivingPids.length === 0 &&
        boundPorts.length === 0 &&
        profileRemoved &&
        cleanupErrors.length === 0,
    };
    log("browser-error-capture-summary", browserEvents);
    await Bun.write(
      resolve(evidence, "actions.json"),
      `${JSON.stringify(actions, null, 2)}\n`,
    );
    await Bun.write(
      resolve(evidence, "cleanup.json"),
      `${JSON.stringify(receipt, null, 2)}\n`,
    );
    if (!receipt.clean)
      failure = new AggregateError(
        [
          ...(failure ? [failure] : []),
          ...cleanupErrors,
          ...survivingPids.map((pid) => new Error(`Surviving process ${pid}`)),
        ],
        "QA cleanup failed",
      );
  }
  if (failure) throw failure;
  if (!completed) throw new Error("No scenario executed");
}
