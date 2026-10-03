import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { ROOT, runScenario, type Scenario } from "../tests/harness/runner";

export async function discoverScenarios() {
  const scenarios = new Map<string, Scenario>();
  const glob = new Bun.Glob("*.ts");
  for await (const file of glob.scan({
    cwd: resolve(ROOT, "tests/scenarios"),
    onlyFiles: true,
  })) {
    const stem = file.slice(0, -3);
    if (stem.endsWith("-fixture")) continue;
    const module = await import(
      pathToFileURL(resolve(ROOT, "tests/scenarios", file)).href
    );
    if (
      Object.keys(module).length !== 1 ||
      !module.scenario ||
      module.scenario.id !== stem ||
      typeof module.scenario.run !== "function"
    ) {
      throw new Error(
        `Scenario ${file} must export only scenario with id ${stem} and run()`,
      );
    }
    if (scenarios.has(stem)) throw new Error(`Duplicate scenario ${stem}`);
    scenarios.set(stem, module.scenario);
  }
  return scenarios;
}

async function main() {
  const args = process.argv.slice(2).filter((arg) => arg !== "--");
  let id: string | undefined;
  let evidence: string | undefined;
  let coreUrl: string | undefined;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--scenario") id = args[++i];
    else if (args[i] === "--evidence") evidence = args[++i];
    else if (args[i] === "--rust-core") coreUrl = args[++i];
    else throw new Error(`Unknown argument: ${args[i]}`);
  }
  if (!id || !evidence)
    throw new Error(
      "Usage: bun run qa -- --scenario <id|all> --evidence <dir>",
    );
  const scenarios = await discoverScenarios();
  const coreToken = process.env.SAYA_QA_CORE_TOKEN;
  if (coreUrl && !coreToken)
    throw new Error("SAYA_QA_CORE_TOKEN is required for --rust-core");
  if (coreUrl) {
    const target = new URL(coreUrl);
    if (
      target.protocol !== "http:" ||
      !["127.0.0.1", "localhost", "[::1]"].includes(target.hostname)
    )
      throw new Error("Rust QA core must be an isolated loopback fixture");
  }
  const selected =
    id === "all"
      ? [...scenarios.values()].sort((a, b) => a.id.localeCompare(b.id))
      : [scenarios.get(id)];
  if (selected.length === 0 || selected.some((scenario) => !scenario)) {
    try {
      throw new Error(`Unknown or empty scenario selection: ${id}`);
    } finally {
      await mkdir(evidence, { recursive: true });
      await Bun.write(
        resolve(evidence, "cleanup.json"),
        `${JSON.stringify(
          {
            scenario: id,
            executed: 0,
            previewPid: null,
            browserPids: [],
            survivingPids: [],
            ports: [],
            boundPorts: [],
            profile: null,
            profileRemoved: true,
            errors: [],
            clean: true,
          },
          null,
          2,
        )}\n`,
      );
    }
  }
  let executed = 0;
  for (const scenario of selected) {
    if (!scenario) throw new Error("Missing scenario");
    await runScenario(scenario, {
      evidence: id === "all" ? resolve(evidence, scenario.id) : evidence,
      // Two viewports each exercise the real 30-second media confirmation budget.
      ...(scenario.id === "piratetalk-rust-media-failure"
        ? { timeoutMs: 120_000 }
        : {}),
      ...(coreUrl && coreToken
        ? { core: { url: coreUrl, token: coreToken } }
        : {}),
    });
    executed++;
    console.log(`PASS ${scenario.id}`);
  }
  if (executed === 0) throw new Error("No scenario executed");
  console.log(`Executed ${executed} scenario(s); cleanup receipts written.`);
}

if (import.meta.main) {
  try {
    await main();
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
}
