import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import type { Dataset } from "../tests/fixtures/data";
import { ROOT, runScenario } from "../tests/harness/runner";

type Profile = "mobile" | "desktop";

async function main() {
  const args = process.argv.slice(2).filter((arg) => arg !== "--");
  let profile: Profile = "mobile";
  let dataset: Dataset = "stress";
  let runs = 5;
  for (let i = 0; i < args.length; i++) {
    const key = args[i];
    const value = args[++i];
    if (key === "--profile" && (value === "mobile" || value === "desktop"))
      profile = value;
    else if (
      key === "--dataset" &&
      (value === "baseline" || value === "stress")
    )
      dataset = value;
    else if (key === "--runs" && value && /^\d+$/.test(value))
      runs = Number(value);
    else throw new Error(`Invalid argument ${key} ${value}`);
  }
  if (!Number.isSafeInteger(runs) || runs < 1)
    throw new Error("--runs must be a positive integer");
  const evidence = resolve(
    ROOT,
    `.omo/evidence/client/perf-${profile}-${dataset}`,
  );
  await mkdir(evidence, { recursive: true });
  const raw: Record<string, unknown>[] = [];
  for (let run = 1; run <= runs; run++) {
    await runScenario(
      {
        id: `perf-run-${run}`,
        async run({ page, context, url, screenshot }) {
          const cdp = await context.newCDPSession(page);
          await cdp.send("Performance.enable");
          await cdp.send("Network.enable");
          await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
          if (profile === "mobile") {
            await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
            await cdp.send("Network.emulateNetworkConditions", {
              offline: false,
              latency: 150,
              downloadThroughput: 1_600_000 / 8,
              uploadThroughput: 750_000 / 8,
            });
          }
          await page.addInitScript(() => {
            const metrics = {
              lcpMs: null as number | null,
              cls: 0,
              eventDurationsMs: [] as number[],
              longTasksMs: [] as number[],
            };
            Reflect.set(window, "syntheticPerformance", metrics);
            const observers: PerformanceObserver[] = [];
            const observe = (
              type: string,
              callback: (entry: PerformanceEntry) => void,
            ) => {
              if (!PerformanceObserver.supportedEntryTypes.includes(type))
                return;
              const observer = new PerformanceObserver((list) =>
                list.getEntries().forEach(callback),
              );
              observer.observe({
                type,
                buffered: true,
                ...(type === "event" ? { durationThreshold: 16 } : {}),
              });
              observers.push(observer);
            };
            observe("largest-contentful-paint", (entry) => {
              metrics.lcpMs = entry.startTime;
            });
            observe("layout-shift", (entry) => {
              const shift = entry as PerformanceEntry & {
                hadRecentInput: boolean;
                value: number;
              };
              if (!shift.hadRecentInput) metrics.cls += shift.value;
            });
            observe("event", (entry) =>
              metrics.eventDurationsMs.push(entry.duration),
            );
            observe("longtask", (entry) =>
              metrics.longTasksMs.push(entry.duration),
            );
          });
          await page.goto(`${url}/#/rooms`, { waitUntil: "load" });
          await screenshot(`cold-${profile}-${run}`);
          const measurements = await page.evaluate(() => ({
            observed: Reflect.get(window, "syntheticPerformance"),
            navigation: performance
              .getEntriesByType("navigation")
              .map((entry) => entry.toJSON()),
            paints: performance
              .getEntriesByType("paint")
              .map((entry) => entry.toJSON()),
            resourceTransferBytes: performance
              .getEntriesByType("resource")
              .reduce(
                (sum, entry) =>
                  sum + (entry as PerformanceResourceTiming).transferSize,
                0,
              ),
            domNodes: document.querySelectorAll("*").length,
            supportedEntryTypes: PerformanceObserver.supportedEntryTypes,
          }));
          const runtime = await cdp.send("Performance.getMetrics");
          const sample = {
            run,
            profile,
            dataset,
            seed: 7,
            ...measurements,
            cdp: Object.fromEntries(
              runtime.metrics.map(({ name, value }) => [name, value]),
            ),
            scope:
              "Cold navigation through screenshot capture; no interaction or final acceptance gate claimed.",
            eventTimingCensoring:
              "Durations below 16ms are not reported; recorded durations are quantized by Chrome.",
          };
          raw.push(sample);
          await Bun.write(
            resolve(evidence, `run-${run}.json`),
            `${JSON.stringify(sample, null, 2)}\n`,
          );
          console.log(JSON.stringify(sample));
          await cdp.detach();
        },
      },
      { evidence: resolve(evidence, `run-${run}`), profile, dataset },
    );
  }
  if (raw.length !== runs) throw new Error("Missing performance runs");
  await Bun.write(
    resolve(evidence, "raw.json"),
    `${JSON.stringify(raw, null, 2)}\n`,
  );
}

if (import.meta.main) {
  try {
    await main();
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
}
