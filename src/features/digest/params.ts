/**
 * GET /digest parameters and the client-side check that runs before a request
 * leaves. The bridge answers 400 to a `limit` outside 1..1000, a `highlights`
 * outside 1..20, or a span the slicer cannot take (DESIGN.md truth 13), so a
 * value the contract already rules out is refused here and never sent.
 */
export type DigestParams = {
  /** A duration the contract spells as `<integer><m|h|d>`, e.g. `30m`, `2h`, `1d`. */
  span: string;
  /** How many of the newest messages the slicer considers. */
  limit: number;
  /** Representative lines per slice. */
  highlights: number;
};

/** What a form hands over: the span as typed, the counts as the inputs report them (NaN when blank). */
export type DigestInput = DigestParams;

export const DIGEST_DEFAULTS: Readonly<DigestParams> = Object.freeze({
  span: "30m",
  limit: 400,
  highlights: 3,
});

export const LIMIT_BOUNDS = Object.freeze({ min: 1, max: 1000 });
export const HIGHLIGHT_BOUNDS = Object.freeze({ min: 1, max: 20 });

/** Quick picks for the span field; anything of the same shape is also accepted. */
export const SPAN_PRESETS: readonly string[] = Object.freeze([
  "10m",
  "30m",
  "1h",
  "2h",
  "6h",
  "1d",
]);

export type DigestField = keyof DigestParams;

export type ParamProblem =
  /** Not `<integer><m|h|d>`, or a zero-length span. */
  | { field: "span"; reason: "shape" | "zero" }
  /** Not an integer inside the contract's bounds. */
  | { field: "limit" | "highlights"; reason: "count" };

export type ParamValidation =
  | { ok: true; params: DigestParams }
  | { ok: false; problems: readonly ParamProblem[] };

/** The only shapes the contract names. The unit is normalised to lower case; nothing else is guessed at. */
const SPAN = /^(\d+)([mhd])$/i;

export function normalizeSpan(
  raw: string,
): { span: string } | { reason: "shape" | "zero" } {
  const match = SPAN.exec(raw.trim());
  const digits = match?.[1];
  const unit = match?.[2];
  if (digits === undefined || unit === undefined) return { reason: "shape" };
  const significant = digits.replace(/^0+/, "");
  if (significant === "") return { reason: "zero" };
  return { span: `${significant}${unit.toLowerCase()}` };
}

function withinBounds(
  value: number,
  bounds: { readonly min: number; readonly max: number },
): boolean {
  return Number.isInteger(value) && value >= bounds.min && value <= bounds.max;
}

/** Every problem is reported at once, so one submit can name every field that needs a change. */
export function validateDigestParams(input: DigestInput): ParamValidation {
  const problems: ParamProblem[] = [];
  const span = normalizeSpan(input.span);
  if ("reason" in span) problems.push({ field: "span", reason: span.reason });
  if (!withinBounds(input.limit, LIMIT_BOUNDS))
    problems.push({ field: "limit", reason: "count" });
  if (!withinBounds(input.highlights, HIGHLIGHT_BOUNDS))
    problems.push({ field: "highlights", reason: "count" });
  if ("reason" in span || problems.length > 0) return { ok: false, problems };
  return {
    ok: true,
    params: {
      span: span.span,
      limit: input.limit,
      highlights: input.highlights,
    },
  };
}
