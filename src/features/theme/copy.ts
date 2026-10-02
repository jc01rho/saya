import { IMAGE_MAX_CHARS, IMAGES_MAX_CHARS, WALL_OPACITY_MAX } from "./apply";
import { BUILTIN_THEMES } from "./builtin";
import {
  type ContrastWarning,
  type ThemeIssue,
  TOKEN_SPECS,
  type TokenKey,
} from "./schema";
import { CUSTOM_LIMIT } from "./store";

export const tokenLabel = (key: TokenKey) =>
  TOKEN_SPECS.find((spec) => spec.key === key)?.label ?? key;

export const THEME_COPY = {
  title: "테마",
  close: "닫기",
  choices: "테마 선택",
  system: "시스템 설정 따르기",
  builtin: {
    light: BUILTIN_THEMES.light.name,
    dark: BUILTIN_THEMES.dark.name,
    kakao: BUILTIN_THEMES.kakao.name,
  },
  remove: (name: string) => `${name} 테마 삭제`,
  removeShort: "삭제",
  gallery: "테마 모음",
  galleryHelp: "누르면 그림까지 들어간 테마를 저장하고 바로 적용합니다.",
  galleryFan: "팬 메이드·비공식",
  galleryMode: { light: "밝은 모드", dark: "어두운 모드" },
  galleryApply: (name: string) => `${name} 테마 저장하고 적용`,
  galleryLoading: (name: string) => `"${name}" 테마를 불러오는 중입니다.`,
  galleryFailed: (name: string) =>
    `"${name}" 테마를 불러오지 못했습니다. 연결을 확인하고 다시 눌러 주세요.`,
  make: "테마 만들기",
  makeHelp:
    "① 프롬프트를 복사해 ChatGPT·Claude 같은 AI에 붙여 넣고, {여기에 원하는 느낌}을 원하는 분위기로 바꿔 보내세요. ② AI가 답한 JSON을 아래에 붙여 넣고 확인을 누르면 미리 보고 저장할 수 있습니다.",
  copy: "프롬프트 복사",
  copied: "프롬프트를 복사했습니다.",
  copyFailed:
    "자동 복사가 막혀 있습니다. 아래 프롬프트를 직접 선택해 복사하세요.",
  promptLabel: "테마 프롬프트",
  paste: "테마 붙여넣기",
  check: "확인",
  save: "저장하고 적용",
  saved: (name: string) => `"${name}" 테마를 저장하고 적용했습니다.`,
  issues: "테마를 읽지 못했습니다",
  warnings: "대비가 부족한 조합이 있습니다. 그래도 저장할 수는 있습니다.",
  warning: ({ text, background, ratio, image }: ContrastWarning) =>
    `${tokenLabel(text)} / ${tokenLabel(background)}${image ? " + 배경 그림" : ""}: ${ratio.toFixed(2)}:1 (4.5:1 이상 권장)`,
  imageWarnings:
    "배경 그림이 있는 쌍은 그림의 가장 어둡거나 밝은 점을 기준으로 쟀습니다. 대화방은 images.wall, 목록은 images.list의 opacity를 낮추면 올라갑니다.",
  ignored: (keys: string[]) =>
    `알 수 없는 토큰은 무시했습니다: ${keys.join(", ")}`,
  preview: "미리보기",
  previewRoom: "미리보기 대화방",
  previewMembers: "멤버 3명",
  previewOther: "안녕하세요! 새 테마예요.",
  previewSelf: "링크도 이렇게 보여요",
  previewLink: "example.com",
  previewTime: "오후 3:14",
  previewRead: "1",
  previewInput: "메시지 입력",
  previewSend: "보내기",
  limit: `테마는 최대 ${CUSTOM_LIMIT}개까지 저장할 수 있습니다. 하나를 지운 뒤 다시 저장하세요.`,
  storage: "브라우저 저장소에 쓸 수 없어 저장하지 못했습니다.",
  issue(issue: ThemeIssue): string {
    switch (issue.kind) {
      case "json":
        return `JSON 형식이 아닙니다. AI 답변에서 { 로 시작해 } 로 끝나는 부분만 붙여 넣어 보세요. (${issue.detail})`;
      case "shape":
        return {
          root: "전체가 { ... } 모양의 JSON 객체여야 합니다.",
          name: '"name"은 1~40자 글자여야 합니다.',
          mode: '"mode"는 "light" 또는 "dark"여야 합니다.',
          tokens: '"tokens" 객체가 없습니다.',
        }[issue.field];
      case "missing":
        return `필수 토큰 "${issue.token}"(${tokenLabel(issue.token)})이 없습니다.`;
      case "colour":
        return `"${issue.token}"의 값 "${issue.value}"는 #RRGGBB 형식의 색이 아닙니다.`;
      case "image": {
        if (issue.slot === "images" && issue.problem === "size")
          return `"images"의 그림을 모두 합쳐 ${IMAGES_MAX_CHARS.toLocaleString("ko-KR")}자 이하여야 합니다. 그림 크기를 줄이세요.`;
        const where =
          issue.slot === "images" ? '"images"' : `"images.${issue.slot}"`;
        return {
          shape: `${where}는 { ... } 모양의 객체여야 합니다.`,
          src: `${where}.src는 data:image/png·webp·jpeg·gif;base64,... 형식이어야 합니다. 인터넷 주소(https://)는 받지 않습니다.`,
          size: `${where}.src가 너무 큽니다. 그림 하나는 ${IMAGE_MAX_CHARS.toLocaleString("ko-KR")}자(약 73KB) 이하여야 합니다.`,
          fit: `${where}.fit은 "cover" 또는 "tile"이어야 합니다.`,
          opacity: `${where}.opacity는 0~${WALL_OPACITY_MAX} 사이 숫자여야 합니다.`,
          motion: `${where}.motion은 "dance" 또는 "none"이어야 합니다.`,
        }[issue.problem];
      }
    }
  },
} as const;
