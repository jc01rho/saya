/**
 * The tool inputs, as the JSON Schema handed to the browser and as the only
 * gate the handlers trust. One object describes both, so what an agent is told
 * it may send and what is accepted here cannot drift apart. No schema compiler
 * ships in the bundle: these shapes are small and checked by hand.
 */
export type StringProperty = {
  type: "string";
  description: string;
  maxLength: number;
};
export type IntegerProperty = {
  type: "integer";
  description: string;
  minimum: number;
  maximum: number;
  default: number;
};
export type Property = StringProperty | IntegerProperty;
export type ToolSchema = {
  type: "object";
  properties: Readonly<Record<string, Property>>;
  required: readonly string[];
  additionalProperties: false;
};

export type ProblemReason =
  | "not-an-object"
  | "unknown-member"
  | "required"
  | "wrong-type"
  | "empty"
  | "too-long"
  | "out-of-range";
export type Problem = { field: string; reason: ProblemReason };
export type Input = Readonly<Record<string, string | number>>;

export type Validation =
  | { ok: true; value: Input }
  | { ok: false; problems: readonly Problem[] };

/** Every problem is named at once; a bound is refused, never clamped into something nobody asked for. */
export function validateInput(schema: ToolSchema, input: unknown): Validation {
  if (typeof input !== "object" || input === null || Array.isArray(input))
    return { ok: false, problems: [{ field: ".", reason: "not-an-object" }] };
  const given = input as Record<string, unknown>;
  const problems: Problem[] = [];
  const value: Record<string, string | number> = {};
  for (const field of Object.keys(given)) {
    if (!Object.hasOwn(schema.properties, field))
      problems.push({ field, reason: "unknown-member" });
  }
  for (const [field, property] of Object.entries(schema.properties)) {
    const raw = given[field];
    if (raw === undefined || raw === null) {
      if (schema.required.includes(field))
        problems.push({ field, reason: "required" });
      else if (property.type === "integer") value[field] = property.default;
      continue;
    }
    if (property.type === "string") {
      if (typeof raw !== "string") {
        problems.push({ field, reason: "wrong-type" });
        continue;
      }
      const trimmed = raw.trim();
      if (!trimmed) problems.push({ field, reason: "empty" });
      else if (trimmed.length > property.maxLength)
        problems.push({ field, reason: "too-long" });
      else value[field] = trimmed;
      continue;
    }
    if (typeof raw !== "number" || !Number.isInteger(raw)) {
      problems.push({ field, reason: "wrong-type" });
      continue;
    }
    if (raw < property.minimum || raw > property.maximum)
      problems.push({ field, reason: "out-of-range" });
    else value[field] = raw;
  }
  return problems.length > 0 ? { ok: false, problems } : { ok: true, value };
}
