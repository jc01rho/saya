import { readdir, readFile } from "node:fs/promises";
import { contracts, generateContract } from "./contract-generate";

let total = 0;
for (const spec of contracts) {
  const expected = await generateContract(spec);
  // Another contract's artifacts live in a subdirectory; only files here are this one's.
  const entries = await readdir(spec.directory, { withFileTypes: true });
  const unexpected = entries
    .filter((entry) => entry.isFile() && !expected.has(entry.name))
    .map((entry) => entry.name);
  if (unexpected.length)
    throw new Error(
      `Unexpected contract artifacts for ${spec.source}: ${unexpected.join(", ")}`,
    );
  for (const [name, content] of expected) {
    const actual = await readFile(new URL(name, spec.directory), "utf8");
    if (actual !== content)
      throw new Error(
        `Generated contract drift: ${spec.source} -> ${name}; run bun run contract:generate`,
      );
  }
  total += expected.size;
}
console.log(
  `Canonical OpenAPI hashes and ${total} generated artifacts match for ${contracts.length} contracts; no drift`,
);
