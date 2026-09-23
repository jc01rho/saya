import { describe, expect, test } from "bun:test";
import {
  DIGEST_DEFAULTS,
  HIGHLIGHT_BOUNDS,
  LIMIT_BOUNDS,
  normalizeSpan,
  SPAN_PRESETS,
  validateDigestParams,
} from "../../src/features/digest/params";

describe("digest parameters", () => {
  test("the defaults and bounds are the contract's: 30m, 400 of 1..1000, 3 of 1..20", () => {
    expect(DIGEST_DEFAULTS).toEqual({ span: "30m", limit: 400, highlights: 3 });
    expect(LIMIT_BOUNDS).toEqual({ min: 1, max: 1000 });
    expect(HIGHLIGHT_BOUNDS).toEqual({ min: 1, max: 20 });
    expect(validateDigestParams({ ...DIGEST_DEFAULTS })).toEqual({
      ok: true,
      params: { span: "30m", limit: 400, highlights: 3 },
    });
    for (const preset of SPAN_PRESETS)
      expect(normalizeSpan(preset)).toEqual({ span: preset });
  });

  test("a span is <integer><m|h|d>: trimmed and lower-cased, never guessed at", () => {
    const accepted: [string, string][] = [
      ["30m", "30m"],
      [" 2H ", "2h"],
      ["1d", "1d"],
      ["0030m", "30m"],
      ["1440m", "1440m"],
    ];
    for (const [raw, span] of accepted)
      expect(normalizeSpan(raw)).toEqual({ span });
    for (const raw of [
      "",
      "   ",
      "30",
      "m",
      "1w",
      "30 m",
      "-5m",
      "1.5h",
      "30m 2h",
      "삼십분",
      "30m;",
    ])
      expect(normalizeSpan(raw)).toEqual({ reason: "shape" });
    for (const raw of ["0m", "00h", "0d"])
      expect(normalizeSpan(raw)).toEqual({ reason: "zero" });
  });

  test("a limit outside 1..1000 or a highlights count outside 1..20 is refused, and every problem is named at once", () => {
    expect(
      validateDigestParams({ span: "30", limit: 0, highlights: 21 }),
    ).toEqual({
      ok: false,
      problems: [
        { field: "span", reason: "shape" },
        { field: "limit", reason: "count" },
        { field: "highlights", reason: "count" },
      ],
    });
    for (const limit of [
      0,
      1001,
      400.5,
      -1,
      Number.NaN,
      Number.POSITIVE_INFINITY,
    ])
      expect(
        validateDigestParams({ span: "30m", limit, highlights: 3 }),
      ).toEqual({
        ok: false,
        problems: [{ field: "limit", reason: "count" }],
      });
    for (const highlights of [0, 21, 2.5, Number.NaN])
      expect(
        validateDigestParams({ span: "30m", limit: 400, highlights }),
      ).toEqual({
        ok: false,
        problems: [{ field: "highlights", reason: "count" }],
      });
    // The edges themselves are inside the contract.
    for (const [limit, highlights] of [
      [1, 1],
      [1000, 20],
    ] as const)
      expect(validateDigestParams({ span: "1d", limit, highlights })).toEqual({
        ok: true,
        params: { span: "1d", limit, highlights },
      });
  });
});
