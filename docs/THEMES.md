# 테마

saya에는 기본 테마 네 가지가 있습니다. 직접 만든 테마도 붙여 넣어 쓸 수 있습니다.
테마는 방 목록 머리의 테마 버튼(반원 아이콘)에서 고릅니다.

| 테마 | `data-theme` | 설명 |
| --- | --- | --- |
| 시스템 설정 따르기 (기본) | `light` / `dark` | 기기의 `prefers-color-scheme`을 따라가고, 기기 설정이 바뀌면 바로 따라 바뀝니다 |
| 라이트 | `light` | DESIGN.md의 기본 색 |
| 다크 | `dark` | 따뜻한 다크 |
| 카톡 클래식 | `kakao` | 푸른 회색 배경, 노란 내 말풍선, 흰 상대 말풍선 |
| 직접 만든 테마 | `custom` | 아래 JSON. 변수는 문서 루트에 직접 들어갑니다 |

- 선택은 브라우저 `localStorage`(`saya.theme`, 직접 만든 테마는 `saya.themes`)에만 저장합니다.
  서버나 코어로는 보내지 않습니다.
- `public/theme-boot.js`가 첫 페인트 전에 저장된 테마를 그립니다. 그래서 새로고침해도 기본 색이 번쩍이지 않습니다.
  배포 CSP가 `script-src 'self'`라서 인라인 스크립트가 아니라 별도 파일로 둡니다.
- 색은 `src/styles/tokens.css`의 변수로만 칠합니다. 기본 테마는 `src/features/theme/builtin.ts`에
  아래 JSON 모양으로도 적혀 있고, `tests/theme/builtin.test.ts`가 두 곳의 값이 같은지 확인합니다.

## 테마 JSON

```json
{
  "name": "테마 이름 (1~40자)",
  "mode": "light 또는 dark",
  "tokens": { "wall": "#RRGGBB", "...": "..." }
}
```

색은 `#RRGGBB`(또는 `#RGB`)만 받습니다. 필수 토큰이 빠지거나 색 형식이 틀리면 저장하지 않고, 무엇이 틀렸는지 모두 한 번에 알려 줍니다.
알 수 없는 토큰은 무시합니다. AI 답변이 ```` ```json ```` 블록에 싸여 있어도 안쪽만 읽습니다.

| 토큰 | | CSS 변수 | 칠하는 곳 |
| --- | --- | --- | --- |
| `wall` | 필수 | `--field-wall` | 대화방 배경 |
| `header` | 필수 | `--field-head` | 대화방 상단 헤더 배경 |
| `list` | 필수 | `--field-list` | 방 목록과 왼쪽 메뉴 배경 |
| `listSelected` | 필수 | `--active-list` | 목록에서 선택된 방, 선택된 필터 배경 |
| `listHover` | 선택 | `--hover-list` | 목록 마우스 올림 배경 (없으면 list 95% + text) |
| `listFill` | 선택 | `--fill-list` | 검색창·필터 칩 배경 (없으면 list 91% + text) |
| `text` | 필수 | `--ink` | 기본 글자 |
| `textMuted` | 필수 | `--ink-muted` | 시간, 읽음 숫자, 보조 글자 |
| `rule` | 필수 | `--rule` | 구분선 (경계선은 이 색의 22%, 다크 30%) |
| `bubbleSelf` | 필수 | `--bubble-self` | 내 말풍선 배경 |
| `bubbleSelfText` | 필수 | `--bubble-self-ink` | 내 말풍선 글자 |
| `bubbleOther` | 필수 | `--bubble-other` | 상대 말풍선 배경 |
| `bubbleOtherText` | 필수 | `--bubble-other-ink` | 상대 말풍선 글자 |
| `link` | 필수 | `--link` | 메시지 속 링크 |
| `input` | 필수 | `--field-input` | 입력창 배경 |
| `ground` | 선택 | `--field-ground` | 입력 영역 아래 바닥 (없으면 input) |
| `accent` | 필수 | `--accent-send` | 강조색(보내기 버튼) |
| `accentText` | 선택 | `--door-ink` | 강조색 위 글자 (없으면 #111111·#ffffff 중 대비가 큰 쪽) |

### 대비 경고

아래 글자/배경 쌍의 WCAG 2.1 명도 대비가 4.5:1보다 낮으면 경고를 띄웁니다.
경고가 있어도 저장은 할 수 있습니다. 쌍 목록은 `src/features/theme/schema.ts`의 `CONTRAST_PAIRS`이고, 아래 프롬프트에도 그대로 들어갑니다.
기본 테마 세 가지(라이트·다크·카톡 클래식)는 모든 쌍이 4.5:1 이상입니다(`tests/theme/builtin.test.ts`).

### 그림 (선택)

`images`를 더하면 대화방 벽지와 마스코트를 그릴 수 있습니다. 색만 쓰는 테마는 그대로 둡니다.

```json
{
  "name": "…",
  "mode": "light",
  "tokens": { "…": "…" },
  "images": {
    "wall": { "src": "data:image/webp;base64,…", "fit": "tile", "opacity": 0.15 },
    "mascot": { "src": "data:image/png;base64,…" }
  }
}
```

| 필드 | | 뜻 |
| --- | --- | --- |
| `wall.src` | 필수 | 대화방(카카오톡·어댑터 모두) 벽지 |
| `wall.fit` | 선택 | `cover`(한 장을 채움, 기본) 또는 `tile`(240px 칸으로 반복) |
| `wall.opacity` | 선택 | 0~0.4, 기본 0.15. 그림 위에 `wall` 색을 `1 - opacity`만큼 덮어 글자를 읽기 쉽게 둡니다 |
| `mascot.src` | 필수 | 방을 고르지 않은 빈 화면에서 고양이 대신 그리는 그림. 미리보기 머리에도 작게 나옵니다 |

- `src`는 `data:image/png|webp|jpeg|gif;base64,…`만 받습니다. `https://` 주소는 받지 않습니다.
  테마를 연 사람의 브라우저가 남의 서버에 요청을 보내지 않게 하고, 오프라인에서도 같게 그리기 위해서입니다.
  SVG도 받지 않습니다.
- 그림 하나는 100,000자(약 73KB) 이하입니다. 테마 20개를 `localStorage`에 담을 수 있게 정한 한도입니다.
  저장소가 가득 차면 저장하지 않고 그렇게 알려 줍니다. 512px 안쪽 WebP면 대개 20~40KB입니다.
- 벽지가 있으면 `wall` 위 글자 쌍(`text`·`textMuted`·`link` / `wall`)의 대비는 **그림의 가장 어두운 점과 가장 밝은 점**을
  `opacity`만큼 섞은 색 기준으로 잽니다. 그림이 무엇이든 그 아래로는 내려가지 않는 값입니다.
  경고가 뜨면 `opacity`를 낮추면 됩니다.
- 저장된 테마에서 다시 읽을 때도 같은 규칙으로 검사하고, 어긋난 그림은 통째로 버리고 색만 적용합니다(`public/theme-boot.js`도 같음).
- 아래 프롬프트는 그림을 다루지 않습니다. AI가 만든 색 테마에 직접 `images`를 더해 붙여 넣으세요.

## AI로 테마 만들기

1. 테마 버튼 → **테마 만들기** → **프롬프트 복사**를 누릅니다.
   클립보드가 막혀 있으면 프롬프트가 입력칸에 펼쳐지니 직접 복사하면 됩니다.
2. ChatGPT, Claude 같은 AI에 붙여 넣고, `{여기에 원하는 느낌}`을 원하는 분위기로 바꿔 보냅니다.
   예: "새벽 바다처럼 차분한 남색, 말풍선은 연한 민트".
3. AI가 답한 JSON을 **테마 붙여넣기** 칸에 넣고 **확인**을 누릅니다.
   틀린 곳이 있으면 고칠 내용을 알려 주고, 대비가 부족한 조합이 있으면 그 조합을 경고로 보여 줍니다.
4. 미리보기를 보고 **저장하고 적용**을 누릅니다.
   같은 이름으로 다시 저장하면 그 테마를 덮어씁니다. 최대 20개까지 저장하고, 목록의 **삭제**로 지웁니다.

아래 프롬프트는 앱의 '프롬프트 복사'와 같은 글입니다(`buildThemePrompt()`, `tests/theme/docs.test.ts`가 같은지 확인합니다).

<!-- theme-prompt:start -->
````text
당신은 웹 메신저 "saya"의 색 테마를 만드는 디자이너입니다.
아래 규칙에 맞는 테마 JSON 하나를 만들어 주세요.

원하는 느낌: {여기에 원하는 느낌}

[출력 규칙]
- JSON 객체 하나만 출력합니다. 설명 문장, 마크다운, 코드 블록 표시(```)를 붙이지 않습니다.
- 최상위 키는 "name", "mode", "tokens" 세 개입니다.
- "name": 테마 이름, 1~40자.
- "mode": 밝은 테마면 "light", 어두운 테마면 "dark".
- "tokens": 아래 토큰 이름을 키로, #RRGGBB 형식의 16진수 색을 값으로 둡니다. 다른 색 표기(rgb(), 색 이름, 투명도)는 쓰지 않습니다.
- 필수 토큰은 모두 넣습니다. 선택 토큰은 빼면 자동으로 계산됩니다.

[토큰]
- wall (필수): 대화방 배경
- header (필수): 대화방 상단 헤더 배경
- list (필수): 방 목록과 왼쪽 메뉴 배경
- listSelected (필수): 목록에서 선택된 방, 선택된 필터 배경
- listHover (선택): 목록에 마우스를 올렸을 때 배경
- listFill (선택): 검색창과 필터 칩 배경
- text (필수): 기본 글자
- textMuted (필수): 시간, 읽음 숫자, 보조 글자
- rule (필수): 구분선
- bubbleSelf (필수): 내 말풍선 배경
- bubbleSelfText (필수): 내 말풍선 글자
- bubbleOther (필수): 상대 말풍선 배경
- bubbleOtherText (필수): 상대 말풍선 글자
- link (필수): 메시지 속 링크
- input (필수): 입력창 배경
- ground (선택): 입력 영역 아래 바닥
- accent (필수): 강조색(보내기 버튼)
- accentText (선택): 강조색 위 글자

[대비 조건 - WCAG 2.1 AA]
아래 글자/배경 쌍은 명도 대비가 4.5:1 이상이어야 합니다.
- text(기본 글자) / wall(대화방 배경)
- textMuted(시간, 읽음 숫자, 보조 글자) / wall(대화방 배경)
- link(메시지 속 링크) / wall(대화방 배경)
- text(기본 글자) / header(대화방 상단 헤더 배경)
- textMuted(시간, 읽음 숫자, 보조 글자) / header(대화방 상단 헤더 배경)
- text(기본 글자) / list(방 목록과 왼쪽 메뉴 배경)
- textMuted(시간, 읽음 숫자, 보조 글자) / list(방 목록과 왼쪽 메뉴 배경)
- text(기본 글자) / listSelected(목록에서 선택된 방, 선택된 필터 배경)
- textMuted(시간, 읽음 숫자, 보조 글자) / listSelected(목록에서 선택된 방, 선택된 필터 배경)
- bubbleSelfText(내 말풍선 글자) / bubbleSelf(내 말풍선 배경)
- textMuted(시간, 읽음 숫자, 보조 글자) / bubbleSelf(내 말풍선 배경)
- link(메시지 속 링크) / bubbleSelf(내 말풍선 배경)
- bubbleOtherText(상대 말풍선 글자) / bubbleOther(상대 말풍선 배경)
- textMuted(시간, 읽음 숫자, 보조 글자) / bubbleOther(상대 말풍선 배경)
- link(메시지 속 링크) / bubbleOther(상대 말풍선 배경)
- text(기본 글자) / input(입력창 배경)
- accentText(강조색 위 글자) / accent(강조색(보내기 버튼))
- 내 말풍선, 상대 말풍선, 대화방 배경은 서로 한눈에 구분되어야 합니다.
- 목록에서 선택된 방 배경은 목록 배경과 구분되어야 합니다.

[예시 - 카톡 클래식]
{
  "name": "카톡 클래식",
  "mode": "light",
  "tokens": {
    "wall": "#b2c7d9",
    "header": "#a9bfd2",
    "list": "#ffffff",
    "listSelected": "#e6e6e6",
    "listHover": "#f4f4f4",
    "listFill": "#f0f0f0",
    "text": "#191919",
    "textMuted": "#3b4650",
    "rule": "#6b7c8c",
    "bubbleSelf": "#fee500",
    "bubbleSelfText": "#191919",
    "bubbleOther": "#ffffff",
    "bubbleOtherText": "#191919",
    "link": "#1a4fa0",
    "input": "#ffffff",
    "ground": "#ffffff",
    "accent": "#fee500",
    "accentText": "#191919"
  }
}
````
<!-- theme-prompt:end -->
