import { readdir, readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { validateExtension } from "../src/contract/piratetalk/boundary";
import type { components } from "../src/contract/piratetalk/decoded";
import {
  corpusHash,
  corpusSource,
  extensionDirectory,
  extensionHash,
  extensionSource,
  generateExtension,
  pinnedBytes,
} from "./extension-generate";

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

const document: unknown = JSON.parse(
  await pinnedBytes(extensionSource, extensionHash),
);
if (
  !record(document) ||
  !record(document.components) ||
  !record(document.components.schemas) ||
  !record(document.paths)
)
  throw new Error("Malformed extension document");
const schemas = document.components.schemas;
function schemaName(value: unknown): value is keyof components["schemas"] {
  return typeof value === "string" && Object.hasOwn(schemas, value);
}
function fixture(value: unknown): {
  readonly schema: keyof components["schemas"];
  readonly data: unknown;
} {
  if (
    !record(value) ||
    !schemaName(value.schema) ||
    !Object.hasOwn(value, "data")
  )
    throw new Error("Malformed fixture envelope or unknown schema");
  return { schema: value.schema, data: value.data };
}

const args = process.argv.slice(2).filter((arg) => arg !== "--");
let external: string | undefined;
let core: string | undefined;
for (let i = 0; i < args.length; i += 2) {
  const flag = args[i];
  const value = args[i + 1];
  if (!value || value.startsWith("--")) throw new Error("Missing option value");
  switch (flag) {
    case "--fixture":
      if (external) throw new Error("Duplicate fixture option");
      external = value;
      break;
    case "--core-contract":
      if (core) throw new Error("Duplicate core option");
      core = value;
      break;
    default:
      throw new Error(`Unknown option ${flag}`);
  }
}
if (core) {
  await pinnedBytes(pathToFileURL(core), extensionHash);
  await pinnedBytes(
    new URL("piratetalk-extension.fixtures.json", pathToFileURL(core)),
    corpusHash,
  );
}
const expected = await generateExtension();
const entries = await readdir(extensionDirectory, { withFileTypes: true });
if (entries.some((entry) => !entry.isFile() || !expected.has(entry.name)))
  throw new Error("Unexpected extension artifact");
for (const [name, bytes] of expected)
  if ((await readFile(new URL(name, extensionDirectory), "utf8")) !== bytes)
    throw new Error(`Extension generated drift: ${name}`);

const corpus: unknown = JSON.parse(await pinnedBytes(corpusSource, corpusHash));
if (
  !record(corpus) ||
  !Array.isArray(corpus.valid) ||
  !Array.isArray(corpus.invalid) ||
  !corpus.valid.length ||
  !corpus.invalid.length
)
  throw new Error("Malformed or empty corpus");
const covered = new Set<string>();
for (const [cases, accepted] of [
  [corpus.valid, true],
  [corpus.invalid, false],
] as const) {
  for (const value of cases) {
    const item = fixture(value);
    if (validateExtension(item.schema, item.data) !== accepted)
      throw new Error(`Corpus mismatch: ${JSON.stringify(value)}`);
    covered.add(`${accepted}:${item.schema}`);
  }
}
for (const item of Object.values(document.paths)) {
  if (!record(item)) throw new Error("Malformed path");
  for (const operation of Object.values(item)) {
    if (
      !record(operation) ||
      !record(operation["x-request-schema"]) ||
      !record(operation.responses)
    )
      throw new Error("Malformed operation");
    const refs: unknown[] = [operation["x-request-schema"].$ref];
    const successes = Object.entries(operation.responses).filter(([status]) =>
      /^2[0-9]{2}$/u.test(status),
    );
    if (!successes.length) throw new Error("Missing success response");
    for (const [status, success] of successes) {
      if (!record(success)) throw new Error("Malformed success response");
      if (status === "204") {
        if (success.content !== undefined)
          throw new Error("No-content response declares a body");
        continue;
      }
      if (!record(success.content)) throw new Error("Missing response schema");
      for (const media of Object.values(success.content)) {
        if (!record(media) || !record(media.schema))
          throw new Error("Malformed media schema");
        refs.push(media.schema.$ref);
      }
    }
    for (const ref of refs) {
      if (typeof ref !== "string") throw new Error("Expected named schema");
      const name = ref.split("/").at(-1);
      if (!covered.has(`true:${name}`) || !covered.has(`false:${name}`))
        throw new Error(`Missing corpus coverage: ${name}`);
    }
  }
}
if (external) {
  const item = fixture(JSON.parse(await readFile(external, "utf8")));
  if (!validateExtension(item.schema, item.data))
    throw new Error(`Rejected malformed fixture: ${item.schema}`);
}
console.log(
  `Extension check passed: ${corpus.valid.length} valid accepted, ${corpus.invalid.length} invalid rejected; ${expected.size} artifacts match; no files changed`,
);
