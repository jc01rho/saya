import { KAKAO } from "./builtin";
import { AA_RATIO, CONTRAST_PAIRS, NAME_MAX, TOKEN_SPECS } from "./schema";

/** The blank a person fills in before pasting the prompt into an AI. */
export const MOOD_PLACEHOLDER = "{여기에 원하는 느낌}";

const label = (key: string) =>
  TOKEN_SPECS.find((spec) => spec.key === key)?.label ?? key;

/**
 * A complete prompt that makes ChatGPT, Claude and the like answer with a theme
 * `parseTheme` accepts. It is generated from the schema, so a token added there
 * reaches the prompt and docs/THEMES.md (checked equal by a test) at once.
 */
export function buildThemePrompt(): string {
  const tokens = TOKEN_SPECS.map(
    (spec) =>
      `- ${spec.key} (${spec.required ? "필수" : "선택"}): ${spec.label}`,
  ).join("\n");
  const pairs = CONTRAST_PAIRS.map(
    ({ text, background }) =>
      `- ${text}(${label(text)}) / ${background}(${label(background)})`,
  ).join("\n");
  return `당신은 웹 메신저 "saya"의 색 테마를 만드는 디자이너입니다.
아래 규칙에 맞는 테마 JSON 하나를 만들어 주세요.

원하는 느낌: ${MOOD_PLACEHOLDER}

[출력 규칙]
- JSON 객체 하나만 출력합니다. 설명 문장, 마크다운, 코드 블록 표시(\`\`\`)를 붙이지 않습니다.
- 최상위 키는 "name", "mode", "tokens" 세 개입니다.
- "name": 테마 이름, 1~${NAME_MAX}자.
- "mode": 밝은 테마면 "light", 어두운 테마면 "dark".
- "tokens": 아래 토큰 이름을 키로, #RRGGBB 형식의 16진수 색을 값으로 둡니다. 다른 색 표기(rgb(), 색 이름, 투명도)는 쓰지 않습니다.
- 필수 토큰은 모두 넣습니다. 선택 토큰은 빼면 자동으로 계산됩니다.

[토큰]
${tokens}

[대비 조건 - WCAG 2.1 AA]
아래 글자/배경 쌍은 명도 대비가 ${AA_RATIO}:1 이상이어야 합니다.
${pairs}
- 내 말풍선, 상대 말풍선, 대화방 배경은 서로 한눈에 구분되어야 합니다.
- 목록에서 선택된 방 배경은 목록 배경과 구분되어야 합니다.

[예시 - 카톡 클래식]
${JSON.stringify(KAKAO, null, 2)}
`;
}
