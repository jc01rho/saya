import { spawn } from "node:child_process";

const bunExe = process.execPath;

const steps = [
  ["contract:check", bunExe, ["run", "contract:check"]],
  ["typecheck", bunExe, ["run", "typecheck"]],
  ["lint", bunExe, ["run", "lint"]],
  // proxy-boundary.test.ts scans dist/, so build before test; size before
  // test because the QA harness test rebuilds dist/ under NODE_ENV=test.
  ["build", bunExe, ["run", "build"]],
  ["size:check", bunExe, ["run", "size:check"]],
  ["test", bunExe, ["test"]],
] as const;

async function runStep(
  name: string,
  cmd: string,
  args: readonly string[],
): Promise<void> {
  console.log(`\n=== [check-all] Step: ${name} ===`);
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: "inherit", shell: true });
    p.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Step ${name} failed with exit code ${code}`));
    });
  });
}

async function main() {
  for (const [name, cmd, args] of steps) {
    await runStep(name, cmd, args);
  }
  console.log("\n✓ All checks passed successfully!");
}

main().catch((err) => {
  console.error("\n✗ check-all failed:", err.message);
  process.exit(1);
});
