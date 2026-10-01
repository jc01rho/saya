import type { ThemeDefinition } from "./schema";

/**
 * The built-in themes in the same JSON shape a pasted theme uses. The values
 * mirror `src/styles/tokens.css` (checked by tests/theme/builtin.test.ts);
 * the stylesheet stays the source the first paint reads. "시스템" is not a
 * theme of its own: it follows the device to light or dark.
 */
export const LIGHT: ThemeDefinition = {
  name: "라이트",
  mode: "light",
  tokens: {
    wall: "#cbdde9",
    header: "#cbdde9",
    list: "#ffffff",
    listSelected: "#e3d7c0",
    listHover: "#efe7d9",
    text: "#2a2724",
    textMuted: "#4e5d69",
    rule: "#4e5d69",
    bubbleSelf: "#f4ebda",
    bubbleSelfText: "#2a2724",
    bubbleOther: "#ffffff",
    bubbleOtherText: "#2a2724",
    link: "#2a2724",
    input: "#ffffff",
    ground: "#e3d7c0",
    accent: "#f3b41b",
    accentText: "#2a2724",
  },
};

export const DARK: ThemeDefinition = {
  name: "다크",
  mode: "dark",
  tokens: {
    wall: "#332622",
    header: "#332622",
    list: "#291f1c",
    listSelected: "#4a403c",
    text: "#f6eee4",
    textMuted: "#cdbdb0",
    rule: "#ad9380",
    bubbleSelf: "#57402f",
    bubbleSelfText: "#f6eee4",
    bubbleOther: "#493630",
    bubbleOtherText: "#f6eee4",
    link: "#f6eee4",
    input: "#493630",
    ground: "#241a17",
    accent: "#f3b41b",
    accentText: "#2a2724",
  },
};

export const KAKAO: ThemeDefinition = {
  name: "카톡 클래식",
  mode: "light",
  tokens: {
    wall: "#b2c7d9",
    header: "#a9bfd2",
    list: "#ffffff",
    listSelected: "#e6e6e6",
    listHover: "#f4f4f4",
    listFill: "#f0f0f0",
    text: "#191919",
    textMuted: "#3b4650",
    rule: "#6b7c8c",
    bubbleSelf: "#fee500",
    bubbleSelfText: "#191919",
    bubbleOther: "#ffffff",
    bubbleOtherText: "#191919",
    link: "#1a4fa0",
    input: "#ffffff",
    ground: "#ffffff",
    accent: "#fee500",
    accentText: "#191919",
  },
};

/** The `data-theme` value each built-in theme is drawn under. */
export const BUILTIN_THEMES = {
  light: LIGHT,
  dark: DARK,
  kakao: KAKAO,
} as const;

export type BuiltinThemeId = keyof typeof BUILTIN_THEMES;
