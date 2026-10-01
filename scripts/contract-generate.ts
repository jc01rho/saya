import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import standaloneCode from "ajv/dist/standalone/index.js";
import addFormats from "ajv-formats";
import openapiTS, { astToString } from "openapi-typescript";

export const contractDirectory = new URL("../src/contract/", import.meta.url);
const root = new URL("../", import.meta.url);
const canonicalHash =
  "5f6ce4e9994388449c0739fbf21a5ba952964b7c060ac565cb8ebc74b5709949";
const header =
  "// Generated from openapi.json by bun run contract:generate. Do not edit.\n";
type Schema = Record<string, unknown>;
type Document = typeof import("../openapi.json");

// Strip annotations, not constraints. In particular, Cursor.additionalProperties
// is a value schema, not a ban on additive object members, and must be retained.
function validationSchema(schema: Schema): Schema {
  const result: Schema = {};
  const annotations = new Set([
    "title",
    "description",
    "examples",
    "example",
    "default",
    "$comment",
    "deprecated",
    "readOnly",
    "writeOnly",
    "externalDocs",
    "xml",
  ]);
  for (const [key, value] of Object.entries(schema)) {
    if (annotations.has(key) || key.startsWith("x-")) continue;
    if (["properties", "patternProperties", "$defs"].includes(key)) {
      result[key] = Object.fromEntries(
        Object.entries(value as Record<string, Schema>).map(([name, child]) => [
          name,
          validationSchema(child),
        ]),
      );
    } else if (
      ["items", "additionalProperties", "not", "if", "then", "else"].includes(
        key,
      ) &&
      typeof value === "object" &&
      value !== null
    ) {
      result[key] = validationSchema(value as Schema);
    } else if (["allOf", "anyOf", "oneOf", "prefixItems"].includes(key)) {
      result[key] = (value as Schema[]).map(validationSchema);
    } else {
      result[key] = value;
    }
  }
  return result;
}

export async function generateContract(): Promise<Map<string, string>> {
  const bytes = await readFile(new URL("openapi.json", root));
  const hash = createHash("sha256").update(bytes).digest("hex");
  if (hash !== canonicalHash)
    throw new Error(`OpenAPI byte identity failed: ${hash}`);
  const document: Document = JSON.parse(bytes.toString("utf8"));
  const decoded = structuredClone(document);
  // The published enum documents known codes; its own prose requires an open
  // consumer type. Only this in-memory decoding projection widens that enum.
  Reflect.deleteProperty(decoded.components.schemas.ErrorCode, "enum");
  // Upstream cores emit additional room kinds (e.g. open-group, open-direct, channel).
  // A forward-compatible consumer accepts unknown room kinds rather than rejecting the catalog.
  Reflect.deleteProperty(
    decoded.components.schemas.Room.properties.kind,
    "enum",
  );
  // Also delete enum from the validation schema of Room so AJV doesn't validate it against closed enum in Context
  Reflect.deleteProperty(
    document.components.schemas.Room.properties.kind,
    "enum",
  );
  const files = new Map<string, string>([
    [
      "schema.d.ts",
      header + astToString(await openapiTS(JSON.stringify(document))),
    ],
    [
      "decoded.d.ts",
      header + astToString(await openapiTS(JSON.stringify(decoded))),
    ],
  ]);

  const schemas = Object.fromEntries(
    Object.entries(decoded.components.schemas).map(([name, schema]) => [
      name,
      validationSchema(schema),
    ]),
  );
  const declarations = Object.keys(schemas).map(
    (name) =>
      `export const validate${name}: ValidateFunction<components["schemas"][${JSON.stringify(name)}]>;`,
  );
  // Health and rooms are inline response schemas, so derive their validators
  // from paths too rather than maintaining a second hand-written envelope.
  for (const [path, item] of Object.entries(document.paths)) {
    if (!("get" in item)) continue;
    const content = item.get.responses["200"].content;
    if (!("application/json" in content)) continue;
    const schema = content["application/json"].schema;
    if ("$ref" in schema) continue;
    const name = `${path.slice(1, 2).toUpperCase()}${path.slice(2)}Response`;
    schemas[name] = validationSchema(schema);
    declarations.push(
      `export const validate${name}: ValidateFunction<paths[${JSON.stringify(path)}]["get"]["responses"][200]["content"]["application/json"]>;`,
    );
  }

  const ajv = new Ajv2020({
    strict: true,
    code: { source: true, esm: true },
    inlineRefs: false,
  });
  // `uri` arrives with Photo: a picture's address carries format: uri.
  addFormats(ajv, { formats: ["date-time", "uri"], mode: "full" });
  // Register each schema separately so refs still point at the canonical names,
  // without admitting arbitrary OpenAPI keywords into Ajv's JSON Schema dialect.
  for (const [name, schema] of Object.entries(schemas)) {
    ajv.addSchema(schema, `#/components/schemas/${name}`);
  }
  const exports = Object.fromEntries(
    Object.keys(schemas).map((name) => [
      `validate${name}`,
      `#/components/schemas/${name}`,
    ]),
  );
  const standalone = standaloneCode(ajv, exports);
  // Ajv emits ESM exports but its tiny format/Unicode helpers use require().
  // Bundle that standalone artifact (never the compiler) into browser-native ESM.
  const result = await Bun.build({
    entrypoints: ["saya:validators"],
    target: "browser",
    format: "esm",
    minify: false,
    plugins: [
      {
        name: "standalone-contract",
        setup(build) {
          build.onResolve({ filter: /^saya:validators$/ }, () => ({
            path: "validators",
            namespace: "contract",
          }));
          build.onLoad({ filter: /.*/, namespace: "contract" }, () => ({
            contents: standalone,
            loader: "js",
            resolveDir: fileURLToPath(root),
          }));
        },
      },
    ],
  });
  if (!result.success)
    throw new AggregateError(
      result.logs,
      "Standalone validator bundling failed",
    );
  if (result.outputs.length !== 1 || !result.outputs[0])
    throw new Error("Expected one validator artifact");
  files.set("validators.js", header + (await result.outputs[0].text()));
  files.set(
    "validators.d.ts",
    `${header}import type { ValidateFunction } from "ajv";\nimport type { components, paths } from "./decoded";\n\n${declarations.join("\n")}\n`,
  );

  const eventSchemas = Object.fromEntries(
    Object.entries(document.paths["/stream"].get["x-sse-events"]).map(
      ([name, event]) => {
        const schema = event.schema.$ref.replace("#/components/schemas/", "");
        if (!(schema in schemas))
          throw new Error(`Unknown SSE schema: ${schema}`);
        return [name, schema];
      },
    ),
  );
  const eventImports = [...new Set(Object.values(eventSchemas))].map(
    (name) => `validate${name}`,
  );
  files.set(
    "sse.ts",
    `${header}import type { components } from "./decoded";\nimport { ${eventImports.join(", ")} } from "./validators.js";\n\nexport const sseEventSchemas = ${JSON.stringify(eventSchemas, null, 2)} as const;\n\nexport type SseEventName = keyof typeof sseEventSchemas;\nexport type SsePayloads = { [Name in SseEventName]: components["schemas"][(typeof sseEventSchemas)[Name]] };\n\nexport const sseValidators = {\n${Object.entries(
      eventSchemas,
    )
      .map(([name, schema]) => `  ${JSON.stringify(name)}: validate${schema},`)
      .join("\n")}\n} as const;\n`,
  );
  return files;
}

if (import.meta.main) {
  const files = await generateContract();
  await mkdir(contractDirectory, { recursive: true });
  for (const [name, content] of files)
    await writeFile(new URL(name, contractDirectory), content);
  console.log(
    `Generated ${files.size} contract artifacts from canonical openapi.json`,
  );
}
