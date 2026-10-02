import { describe, expect, test } from "bun:test";
import { KAKAO } from "../../src/features/theme/builtin";
import { contrastRatio, mix, parseHex } from "../../src/features/theme/color";
import {
  contrastWarnings,
  parseTheme,
  resolveTokens,
  themeVars,
} from "../../src/features/theme/schema";
import { DOT } from "./fakes";

const valid = () => structuredClone(KAKAO);

describe("contrast", () => {
  test("black on white is 21:1 and a colour on itself is 1:1", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#ffffff", "#000")).toBeCloseTo(21, 5);
    expect(contrastRatio("#b2c7d9", "#b2c7d9")).toBe(1);
  });

  test("the AA edge: #767676 passes on white and #777777 does not", () => {
    expect(contrastRatio("#767676", "#ffffff")).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio("#777777", "#ffffff")).toBeLessThan(4.5);
  });

  test("short and long hex parse alike; mixing is per channel", () => {
    expect(parseHex("#abc")).toEqual(parseHex("#aabbcc"));
    expect(mix("#000000", "#ffffff", 0.5)).toBe("#808080");
    expect(mix("#ff0000", "#0000ff", 1)).toBe("#ff0000");
  });
});

describe("parseTheme", () => {
  test("a complete theme parses, normalised, with no warnings", () => {
    const input = valid();
    input.tokens.wall = "#B2C7D9";
    const result = parseTheme(JSON.stringify(input));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.theme.tokens.wall).toBe("#b2c7d9");
    expect(result.warnings).toEqual([]);
    expect(result.ignored).toEqual([]);
  });

  test("an answer wrapped in a json fence still parses", () => {
    const result = parseTheme(
      `여기 테마입니다:\n\`\`\`json\n${JSON.stringify(valid())}\n\`\`\``,
    );
    expect(result.ok).toBe(true);
  });

  test("every missing required token and bad colour is reported together", () => {
    const input = valid();
    delete input.tokens.wall;
    delete input.tokens.link;
    input.tokens.text = "black";
    input.tokens.accent = "#12345";
    const result = parseTheme(JSON.stringify(input));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues).toEqual([
      { kind: "missing", token: "wall" },
      { kind: "colour", token: "text", value: "black" },
      { kind: "missing", token: "link" },
      { kind: "colour", token: "accent", value: "#12345" },
    ]);
  });

  test("optional tokens may be left out and are derived", () => {
    const input = valid();
    delete input.tokens.listHover;
    delete input.tokens.listFill;
    delete input.tokens.ground;
    delete input.tokens.accentText;
    const result = parseTheme(input);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const tokens = resolveTokens(result.theme);
    expect(tokens.ground).toBe(tokens.input);
    expect(tokens.listHover).toBe(mix(tokens.list, tokens.text, 0.95));
    // Dark ink on the yellow door reads better than white.
    expect(tokens.accentText).toBe("#111111");
  });

  test("not JSON, not an object, bad name and mode are refused", () => {
    const notJson = parseTheme("{ name: 테마 ");
    expect(notJson.ok || notJson.issues[0]?.kind).toBe("json");
    expect(parseTheme("[1,2]")).toEqual({
      ok: false,
      issues: [{ kind: "shape", field: "root" }],
    });
    const result = parseTheme({ name: " ", mode: "sepia", tokens: {} });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues.slice(0, 2)).toEqual([
      { kind: "shape", field: "name" },
      { kind: "shape", field: "mode" },
    ]);
    expect(
      parseTheme({
        name: "x".repeat(41),
        mode: "light",
        tokens: valid().tokens,
      }).ok,
    ).toBe(false);
  });

  test("unknown tokens are listed and never applied", () => {
    const input = {
      ...valid(),
      tokens: { ...valid().tokens, glow: "#ff00ff" },
    };
    const result = parseTheme(input);
    expect(result.ok && result.ignored).toEqual(["glow"]);
    if (!result.ok) return;
    expect(Object.values(themeVars(result.theme))).not.toContain("#ff00ff");
  });

  test("a low-contrast pair becomes a warning with its measured ratio", () => {
    const input = valid();
    input.tokens.textMuted = "#9aa7b3";
    const result = parseTheme(input);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const wall = result.warnings.find(
      (w) => w.text === "textMuted" && w.background === "wall",
    );
    expect(wall?.ratio).toBeCloseTo(contrastRatio("#9aa7b3", "#b2c7d9"), 5);
    expect(contrastWarnings(result.theme)).toEqual(result.warnings);
  });
});

describe("pictures", () => {
  const withImages = (images: unknown) => ({ ...valid(), images });

  test("a colour-only theme carries no pictures", () => {
    const result = parseTheme(valid());
    expect(result.ok && result.theme.images).toBeUndefined();
  });

  test("a wallpaper and a mascot parse, with fit and opacity defaulted", () => {
    const result = parseTheme(
      withImages({ wall: { src: DOT }, mascot: { src: DOT } }),
    );
    expect(result.ok && result.theme.images).toEqual({
      wall: { src: DOT, fit: "cover", opacity: 0.15 },
      mascot: { src: DOT },
    });
  });

  test("only inline rasters within the size bound are accepted", () => {
    const refused = (src: string) => {
      const result = parseTheme(withImages({ mascot: { src } }));
      return result.ok ? null : result.issues;
    };
    expect(refused("https://example.test/a.png")).toEqual([
      { kind: "image", slot: "mascot", problem: "src" },
    ]);
    expect(refused("data:image/svg+xml;base64,PHN2Zz4=")).not.toBeNull();
    expect(
      refused(`${DOT}"); background: url(https://example.test/x`),
    ).not.toBeNull();
    expect(refused(`data:image/png;base64,${"A".repeat(100_000)}`)).toEqual([
      { kind: "image", slot: "mascot", problem: "size" },
    ]);
  });

  test("every bad picture field is reported together; unknown ones are ignored", () => {
    const result = parseTheme(
      withImages({
        wall: { src: DOT, fit: "stretch", opacity: 0.9 },
        mascot: 3,
      }),
    );
    expect(result.ok ? [] : result.issues).toEqual([
      { kind: "image", slot: "wall", problem: "fit" },
      { kind: "image", slot: "wall", problem: "opacity" },
      { kind: "image", slot: "mascot", problem: "shape" },
    ]);
    const extra = parseTheme(withImages({ mascot: { src: DOT }, header: {} }));
    expect(extra.ok && extra.ignored).toEqual(["images.header"]);
  });

  test("text on the wall is measured over the wallpaper's worst pixel", () => {
    // Passes on the bare wall; with the picture showing through it may not.
    const plain = parseTheme(valid());
    expect(plain.ok && plain.warnings).toEqual([]);
    const opacity = 0.4;
    const result = parseTheme(withImages({ wall: { src: DOT, opacity } }));
    if (!result.ok) throw new Error("parse failed");
    const muted = result.warnings.find(
      (w) => w.text === "textMuted" && w.background === "wall",
    );
    const wall = KAKAO.tokens.wall as string;
    const ink = KAKAO.tokens.textMuted as string;
    expect(muted?.image).toBe(true);
    expect(muted?.ratio).toBeCloseTo(
      Math.min(
        contrastRatio(ink, mix(wall, "#000000", 1 - opacity)),
        contrastRatio(ink, mix(wall, "#ffffff", 1 - opacity)),
      ),
      5,
    );
    // Pairs off the wall are unchanged by a wallpaper.
    expect(result.warnings.every((w) => w.background === "wall")).toBe(true);
  });
});
