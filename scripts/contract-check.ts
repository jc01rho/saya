import { readdir, readFile } from "node:fs/promises";
import { contractDirectory, generateContract } from "./contract-generate";

const expected = await generateContract();
const actualNames = await readdir(contractDirectory);
const unexpected = actualNames.filter((name) => !expected.has(name));
if (unexpected.length)
  throw new Error(`Unexpected contract artifacts: ${unexpected.join(", ")}`);
for (const [name, content] of expected) {
  const actual = await readFile(new URL(name, contractDirectory), "utf8");
  if (actual !== content)
    throw new Error(
      `Generated contract drift: ${name}; run bun run contract:generate`,
    );
}
console.log(
  `Canonical OpenAPI hash and ${expected.size} generated artifacts match; no drift`,
);
