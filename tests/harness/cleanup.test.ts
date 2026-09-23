import { expect, test } from "bun:test";
import { access } from "node:fs/promises";
import { resolve } from "node:path";
import { bounded, deferred } from "./barriers";
import {
  assertPortFree,
  type CleanupReceipt,
  processAlive,
  ROOT,
  runScenario,
} from "./runner";

for (const mode of ["timeout", "throw"] as const) {
  test(`real Chrome and preview leave zero processes or ports after ${mode}`, async () => {
    const evidence = resolve(ROOT, `.omo/evidence/client/03-cleanup-${mode}`);
    let entered = false;
    await expect(
      runScenario(
        {
          id: `cleanup-${mode}`,
          async run({ page, url, bridge }) {
            await page.goto(`${url}/__qa/blank`, { waitUntil: "load" });
            entered = true;
            // Keep a real HTTP response paused when cleanup starts.
            bridge.pauseNext("/context");
            const request = bridge.events.expect(
              (event) => event.type === "request" && event.path === "/context",
              "paused request arrived",
            );
            await page.evaluate((roomId) => {
              // Abort is an expected consequence of browser cleanup; no response is claimed.
              Reflect.set(
                window,
                "pendingFixtureRequest",
                fetch(`/api/context?roomId=${roomId}`).then(
                  (response) => response.status,
                  (error: Error) => error.name,
                ),
              );
            }, bridge.data.rooms[0]?.id);
            await request;
            if (mode === "throw") throw new Error("Injected scenario error");
            // The deadline itself is the behavior under test, not a stabilization sleep.
            await bounded(
              deferred<void>().promise,
              "injected mid-scenario timeout",
              25,
            );
          },
        },
        { evidence, port: 0 },
      ),
    ).rejects.toThrow(
      mode === "throw"
        ? "Injected scenario error"
        : "Timeout: injected mid-scenario timeout",
    );
    expect(entered).toBe(true);
    const receipt = (await Bun.file(
      resolve(evidence, "cleanup.json"),
    ).json()) as CleanupReceipt;
    expect(receipt.clean).toBe(true);
    expect(receipt.previewPid).not.toBeNull();
    expect(receipt.browserPids.length).toBeGreaterThan(0);
    expect(receipt.ports).toHaveLength(2);
    expect(receipt.survivingPids).toEqual([]);
    expect(receipt.boundPorts).toEqual([]);
    expect(receipt.errors).toEqual([]);
    for (const pid of [...receipt.browserPids, receipt.previewPid as number])
      expect(processAlive(pid)).toBe(false);
    for (const port of receipt.ports) await assertPortFree(port);
    expect(receipt.profile).not.toBeNull();
    await expect(access(receipt.profile as string)).rejects.toThrow();
  }, 120_000);
}
