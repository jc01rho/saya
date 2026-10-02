import { contrastRatio, isHexColor, mix, normalizeHex } from "./color";

/**
 * A theme is a name, a light/dark mode and a set of colour tokens. The four
 * built-in themes are written in this same shape (`builtin.ts`), and a theme a
 * person pastes in — usually written by an AI from `buildThemePrompt()` — is
 * checked against it before anything is drawn with it.
 */
export type ThemeMode = "light" | "dark";

export type TokenKey =
  | "wall"
  | "header"
  | "list"
  | "listSelected"
  | "listHover"
  | "listFill"
  | "text"
  | "textMuted"
  | "rule"
  | "bubbleSelf"
  | "bubbleSelfText"
  | "bubbleOther"
  | "bubbleOtherText"
  | "link"
  | "input"
  | "ground"
  | "accent"
  | "accentText";

export interface TokenSpec {
  key: TokenKey;
  /** The CSS custom property in `src/styles/tokens.css` this token sets. */
  cssVar: `--${string}`;
  required: boolean;
  /** What the token paints, for people and for the prompt. */
  label: string;
  /**
   * The token whose value the stylesheet falls back to when a theme block does
   * not declare this property (`var(--link, var(--ink))`).
   */
  cssFallback?: TokenKey;
}

export const TOKEN_SPECS: readonly TokenSpec[] = [
  { key: "wall", cssVar: "--field-wall", required: true, label: "대화방 배경" },
  {
    key: "header",
    cssVar: "--field-head",
    required: true,
    label: "대화방 상단 헤더 배경",
    cssFallback: "wall",
  },
  {
    key: "list",
    cssVar: "--field-list",
    required: true,
    label: "방 목록과 왼쪽 메뉴 배경",
  },
  {
    key: "listSelected",
    cssVar: "--active-list",
    required: true,
    label: "목록에서 선택된 방, 선택된 필터 배경",
  },
  {
    key: "listHover",
    cssVar: "--hover-list",
    required: false,
    label: "목록에 마우스를 올렸을 때 배경",
  },
  {
    key: "listFill",
    cssVar: "--fill-list",
    required: false,
    label: "검색창과 필터 칩 배경",
  },
  { key: "text", cssVar: "--ink", required: true, label: "기본 글자" },
  {
    key: "textMuted",
    cssVar: "--ink-muted",
    required: true,
    label: "시간, 읽음 숫자, 보조 글자",
  },
  { key: "rule", cssVar: "--rule", required: true, label: "구분선" },
  {
    key: "bubbleSelf",
    cssVar: "--bubble-self",
    required: true,
    label: "내 말풍선 배경",
  },
  {
    key: "bubbleSelfText",
    cssVar: "--bubble-self-ink",
    required: true,
    label: "내 말풍선 글자",
    cssFallback: "text",
  },
  {
    key: "bubbleOther",
    cssVar: "--bubble-other",
    required: true,
    label: "상대 말풍선 배경",
  },
  {
    key: "bubbleOtherText",
    cssVar: "--bubble-other-ink",
    required: true,
    label: "상대 말풍선 글자",
    cssFallback: "text",
  },
  {
    key: "link",
    cssVar: "--link",
    required: true,
    label: "메시지 속 링크",
    cssFallback: "text",
  },
  {
    key: "input",
    cssVar: "--field-input",
    required: true,
    label: "입력창 배경",
  },
  {
    key: "ground",
    cssVar: "--field-ground",
    required: false,
    label: "입력 영역 아래 바닥",
  },
  {
    key: "accent",
    cssVar: "--accent-send",
    required: true,
    label: "강조색(보내기 버튼)",
  },
  {
    key: "accentText",
    cssVar: "--door-ink",
    required: false,
    label: "강조색 위 글자",
  },
];

export type ThemeTokens = Partial<Record<TokenKey, string>>;

export interface ThemeDefinition {
  name: string;
  mode: ThemeMode;
  tokens: ThemeTokens;
}

/** A text/background pair that must reach WCAG AA (4.5:1) to stay readable. */
export const CONTRAST_PAIRS: readonly {
  text: TokenKey;
  background: TokenKey;
}[] = [
  { text: "text", background: "wall" },
  { text: "textMuted", background: "wall" },
  { text: "link", background: "wall" },
  { text: "text", background: "header" },
  { text: "textMuted", background: "header" },
  { text: "text", background: "list" },
  { text: "textMuted", background: "list" },
  { text: "text", background: "listSelected" },
  { text: "textMuted", background: "listSelected" },
  { text: "bubbleSelfText", background: "bubbleSelf" },
  { text: "textMuted", background: "bubbleSelf" },
  { text: "link", background: "bubbleSelf" },
  { text: "bubbleOtherText", background: "bubbleOther" },
  { text: "textMuted", background: "bubbleOther" },
  { text: "link", background: "bubbleOther" },
  { text: "text", background: "input" },
  { text: "accentText", background: "accent" },
];

export const AA_RATIO = 4.5;
export const NAME_MAX = 40;

const SPEC_BY_KEY = new Map(TOKEN_SPECS.map((spec) => [spec.key, spec]));

/** Every token, with the optional ones derived the way the stylesheet derives them. */
export function resolveTokens(
  theme: ThemeDefinition,
): Record<TokenKey, string> {
  const t = theme.tokens;
  const need = (key: TokenKey) => {
    const value = t[key];
    if (value === undefined) throw new Error(`Theme lacks token ${key}`);
    return value;
  };
  const list = need("list");
  const text = need("text");
  const accent = need("accent");
  const darkInk = "#111111";
  const lightInk = "#ffffff";
  return {
    wall: need("wall"),
    header: need("header"),
    list,
    listSelected: need("listSelected"),
    listHover: t.listHover ?? mix(list, text, 0.95),
    listFill: t.listFill ?? mix(list, text, 0.91),
    text,
    textMuted: need("textMuted"),
    rule: need("rule"),
    bubbleSelf: need("bubbleSelf"),
    bubbleSelfText: need("bubbleSelfText"),
    bubbleOther: need("bubbleOther"),
    bubbleOtherText: need("bubbleOtherText"),
    link: need("link"),
    input: need("input"),
    ground: t.ground ?? need("input"),
    accent,
    accentText:
      t.accentText ??
      (contrastRatio(darkInk, accent) >= contrastRatio(lightInk, accent)
        ? darkInk
        : lightInk),
  };
}

/** The custom properties a pasted theme sets on the document root. */
export function themeVars(theme: ThemeDefinition): Record<string, string> {
  const tokens = resolveTokens(theme);
  const vars: Record<string, string> = {};
  for (const spec of TOKEN_SPECS) vars[spec.cssVar] = tokens[spec.key];
  vars["--accent-send-inset"] = mix(tokens.accent, "#000000", 0.82);
  vars["--seam"] = `color-mix(in srgb, ${tokens.rule} ${
    theme.mode === "dark" ? 30 : 22
  }%, transparent)`;
  return vars;
}

export interface ContrastWarning {
  text: TokenKey;
  background: TokenKey;
  ratio: number;
}

export function contrastWarnings(theme: ThemeDefinition): ContrastWarning[] {
  const tokens = resolveTokens(theme);
  return CONTRAST_PAIRS.flatMap(({ text, background }) => {
    const ratio = contrastRatio(tokens[text], tokens[background]);
    return ratio < AA_RATIO ? [{ text, background, ratio }] : [];
  });
}

export type ThemeIssue =
  | { kind: "json"; detail: string }
  | { kind: "shape"; field: "root" | "name" | "mode" | "tokens" }
  | { kind: "missing"; token: TokenKey }
  | { kind: "colour"; token: TokenKey; value: string };

export type ParseResult =
  | {
      ok: true;
      theme: ThemeDefinition;
      warnings: ContrastWarning[];
      /** Token names the schema does not know; they are dropped, not applied. */
      ignored: string[];
    }
  | { ok: false; issues: ThemeIssue[] };

/** AI answers often arrive wrapped in a ```json fence; take what is inside. */
function unfence(input: string): string {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(input);
  return (fenced?.[1] ?? input).trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Checks a pasted theme. Every problem is reported at once, not the first only. */
export function parseTheme(input: string | unknown): ParseResult {
  let value: unknown = input;
  if (typeof input === "string") {
    try {
      value = JSON.parse(unfence(input));
    } catch (error) {
      return {
        ok: false,
        issues: [
          {
            kind: "json",
            detail: error instanceof Error ? error.message : String(error),
          },
        ],
      };
    }
  }
  if (!isRecord(value))
    return { ok: false, issues: [{ kind: "shape", field: "root" }] };
  const issues: ThemeIssue[] = [];
  const name = typeof value.name === "string" ? value.name.trim() : "";
  if (!name || [...name].length > NAME_MAX)
    issues.push({ kind: "shape", field: "name" });
  const mode = value.mode;
  if (mode !== "light" && mode !== "dark")
    issues.push({ kind: "shape", field: "mode" });
  const raw = value.tokens;
  if (!isRecord(raw)) {
    issues.push({ kind: "shape", field: "tokens" });
    return { ok: false, issues };
  }
  const tokens: ThemeTokens = {};
  for (const spec of TOKEN_SPECS) {
    const colour = raw[spec.key];
    if (colour === undefined || colour === null || colour === "") {
      if (spec.required) issues.push({ kind: "missing", token: spec.key });
    } else if (!isHexColor(colour)) {
      issues.push({ kind: "colour", token: spec.key, value: String(colour) });
    } else tokens[spec.key] = normalizeHex(colour);
  }
  if (issues.length > 0) return { ok: false, issues };
  const theme: ThemeDefinition = {
    name,
    mode: mode as ThemeMode,
    tokens,
  };
  return {
    ok: true,
    theme,
    warnings: contrastWarnings(theme),
    ignored: Object.keys(raw).filter(
      (key) => !SPEC_BY_KEY.has(key as TokenKey),
    ),
  };
}
