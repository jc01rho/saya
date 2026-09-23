![さや (saya)](assets/saya-og.png)

# さや (saya)

> *Conversations, within reach.*
> つながる、大切なものから。
> **A Kakao client for what matters.**

**saya** 는 `kanao serve`(Windows)와 `kamado serve`(macOS)가 여는 **HTTP + SSE 표면을
쓰는 웹 클라이언트**입니다. 브라우저에서 카카오톡 대화를 읽고, 추출 요약을 보고, 새 메시지를
따라가고, 명시적으로 허락한 텍스트만 보냅니다.

칼집(鞘)이 이름인 이유가 곧 이 저장소의 성격입니다. 날은 코어가 쥐고 있고, 여기 있는 것은
그것을 감싸 손에 쥐게 하는 화면뿐입니다. 이전 이름은 hinokami-kagura 였고, `design/` 아래의
작업 기록과 옛 커밋에는 그 이름이 그대로 남아 있습니다.

## 서버는 만들지 않습니다

```
브라우저 ──HTTP + SSE──> kanao serve / kamado serve ──> 카카오톡 로컬 DB
(이 저장소)                    (이미 있는 것)
```

읽기도 전송도 코어가 이미 합니다. 여기서 만드는 것은 **화면뿐**입니다. 복호화 키도,
카카오톡 데이터베이스도, 접근성·전체 디스크 접근 권한도 이 저장소의 코드가 만지지 않습니다.
그래서 이 저장소는 카카오톡이 깔리지 않은 기계에서도 개발하고 시험할 수 있습니다.

## 화면 하나를 가로지르는 선

**릿지(ledge)** — 대화 창을 가로지르는 1px 가로선 하나가 이 인터페이스의 법입니다.

- 선 **위**: 브리지가 **되읽어 준** 것. `보냈습니다`.
- 선 **아래**: **입력만 된** 것. `입력됨 · 전달 미확인`.
- 되읽히기 전에는 아무것도 선을 넘지 않습니다.

`POST /send` 의 응답에는 메시지 id도 nonce도 전달 확인도 없습니다. 그래서 전송의 결과는
`/context` 나 `/stream` 으로 **관찰될 때까지** 아래에 남아 있고, 사용자가 `이 기록으로 확인`
을 눌러 직접 연결합니다. 불확실한 전송을 자동으로 다시 보내는 경로는 이 저장소에 없습니다.

## 되는 것

| 영역 | 내용 |
| --- | --- |
| 방 목록 | 전체 / 사람 필터, 가상 스크롤(1,000방에서 마운트 행 48개 이하), 안 읽음 배지는 **데스크톱의** 숫자 |
| 대화 읽기 | 오래된 것부터, 인용·멘션·종류 라벨, `coverage` 줄, `더 불러오기` 는 40 → 200 → 1000 까지 |
| 스트림 | `fetch` + `ReadableStream` 로 SSE 직독, 커서 재개, 지수 백오프 재접속 |
| 탭 조정 | Web Locks 리더 선출로 **탭이 몇 개든 `/stream` 연결은 하나** |
| 보내기 | `dryRun` 확인 → 초안 경고 → 전송 → 되읽기, 릿지 아래 대기 항목 |
| 추출 요약 | `/digest` 시트를 지연 로드. AI 요약이 아니라는 `note` 를 그대로 전합니다 |
| 오류 화면 | `401` 프록시 인증 안내, `503` 호스트 미준비, `PERMISSION_REQUIRED` 전용 안내, 알 수 없는 코드는 기본 분기 |

## 시작하기

코어가 먼저 떠 있어야 합니다. 이 저장소는 코어를 띄우지 않습니다.

```sh
# 1) 코어 (다른 저장소, Windows 예시)
KANAO_TOKEN=<토큰> python -m kanao serve --host 127.0.0.1 --port 8765

# 2) 클라이언트
bun install --frozen-lockfile
cp .env.example .env     # SAYA_CORE_URL, SAYA_CORE_TOKEN 를 채웁니다
bun run dev              # http://127.0.0.1:5173
```

`.env` 의 두 이름에는 **`VITE_` 접두사를 붙이지 않습니다.** 개발 프록시가 `/api` 를 떼고
`Authorization` 헤더를 서버 쪽에서 주입하기 때문에, 토큰은 브라우저 번들에 들어가지 않습니다.
`.env` 는 커밋하지 마세요.

배포는 정적 `dist/` 하나이고, 같은 origin 리버스 프록시가 토큰을 쥡니다 —
[`docs/deployment.md`](docs/deployment.md) 와 [`deploy/Caddyfile.example`](deploy/Caddyfile.example).

## 계약은 `openapi.json` 하나입니다

두 코어가 **바이트 단위로 같은 파일**을 갖고 있고, 여기 있는 사본도 같은 파일입니다.

```
sha256  c741090c54ba0151a52a671ed0d8cb765a43d399ecb6e46c6662c37755606729
info.version  0.14.0
```

OpenAPI 3.1 문서 하나에 여섯 개의 라우트, 파라미터와 기본값, 요청 본문, 응답 모양, 상한,
오류 코드가 전부 적혀 있습니다. 플랫폼이 갈리는 멤버는 `x-platform` 으로 표시돼 있고, 그 밖의
차이는 둘 중 한 빌드의 결함입니다.

| 메서드·경로 | 하는 일 |
| --- | --- |
| `GET /health` | 프로세스가 살아있는지 (토큰 불필요) |
| `GET /rooms` | 방 목록 |
| `GET /context` | 한 방의 최근 메시지와 `coverage`·`attention` |
| `GET /digest` | 같은 창을 추출 요약으로 |
| `GET /stream` | **SSE** — `ready` → `message` → `cursor` → `ping` |
| `POST /send` | 명시적으로 허락된 텍스트 전송 |

**타입은 손으로 쓰지 않습니다.** `bun run contract:generate` 가 이 문서에서 `src/contract/`
전체를 만드는 유일한 경로이고, `bun run contract:check` 가 해시와 생성물 동일성을 바이트로
확인합니다. 계약이 움직이면 사용자의 화면이 아니라 빌드가 깨집니다.

## 브라우저에서 부딪히는 것

전부 코어 코드에서 확인한 것입니다. 자세한 근거는 [`BRIEF.md`](BRIEF.md) 에 있습니다.

- **CORS가 없습니다.** 두 코어 모두 `Access-Control-*` 헤더를 내지 않고 `OPTIONS` 도 처리하지
  않습니다. 같은 origin으로 서빙하거나 개발 서버 프록시를 씁니다.
- **`EventSource` 를 쓸 수 없습니다.** 인증이 `Authorization` 헤더 전용이라 헤더를 붙이지 못하는
  `EventSource` 는 탈락입니다. `fetch` + `ReadableStream` 으로 SSE를 직접 읽고, 재접속과 백오프도
  직접 합니다.
- **커서로 재개합니다.** `Last-Event-ID` 가 아니라 `cursor` 이벤트의 `{방id: logId}` 를 들고
  `?since=방id:logId` 를 반복해 넘깁니다. 커서가 이름을 대지 않은 방의 공백은 화면에 표시하고
  `/context` 로 메웁니다.
- **동시 `/stream` 은 기계 전체에서 8개**, 아홉 번째는 `503 BUSY`. 그래서 연결은 하나만 열고
  탭끼리 나눠 씁니다.
- **식별자는 문자열이고 2^53을 넘습니다.** `Number()` 로 바꾸면 조용히 틀립니다.
- **토큰은 비밀번호입니다.** 남의 계정에 **쓰기**를 여는 값이고 서버는 평문 HTTP입니다.
  그리지 않고, 로그에 남기지 않고, 기본 배치에서는 브라우저가 아예 모릅니다.

## 화면이 약속하지 않는 것

계약에 없는 것은 화면도 지어내지 않습니다. 각 항목은 `DESIGN.md` 의 G1–G9 결정과 같습니다.

- **방 미리보기 본문이 없습니다.** 방 행에는 이 클라이언트가 이미 읽은 본문만 보이고, 없으면
  `미리보기 없음` 입니다. 미리보기를 채우려고 행마다 `/context` 를 부르지 않습니다.
- **읽음 처리 라우트가 없습니다.** 안 읽음 배지는 데스크톱의 숫자입니다. 웹에서 방을 열어도
  줄지 않습니다. 1..99 는 그대로, 그 위는 `99+`, 정확한 수는 접근성 이름에 들어갑니다.
- **과거 페이징이 없습니다.** `/context` 는 방 id 와 최신 N개(1..1000)만 받습니다. 최신 1000개가
  볼 수 있는 끝이고, 그 너머는 없는 것이 아니라 **닿지 않는 것**으로 표시합니다.
- **전송 응답에 메시지 id·nonce·전달 확인이 없습니다.** 같은 본문의 나중 `fromMe` 기록은 관찰된
  증거일 뿐 인과의 증명이 아닙니다.
- **대기열 깊이를 알 수 없습니다.** `429` 뒤의 회복은 사용자의 새 명시적 시도이고, 타이머가
  버튼을 다시 켜지 않습니다.
- **읽을 수 없는 방도 목록에 그대로 있습니다.** `readable: false` 는 키가 메모리에 없다는 뜻이라,
  흐리게 처리하거나 숨기지 않고 잉크를 그대로 두고 이유를 적습니다.
- **빈 결과는 대화가 없었다는 뜻이 아닙니다.** `storedLocally`·`hasEarlier`·`reachesLatestKnown`
  을 그대로 보여줍니다.
- **`/digest` 는 추출 요약입니다.** 모델이 무언가를 요약했다는 인상을 주지 않습니다.
- **모호한 방은 후보와 함께 거절합니다.** `409 AMBIGUOUS_CHAT` 의 첫 후보를 임의로 고르지 않습니다.

## 측정값

`docs/performance.md` 에 조건과 원자료가 있습니다. Windows x64 / Intel i5-10400 / Chrome,
스트레스 데이터셋은 1,000방 × 1,000메시지입니다.

| 항목 | 예산 | 측정 |
| --- | --- | --- |
| 엔트리 JS (gzip) | ≤ 180 KiB | **99.61 KiB** |
| 엔트리 CSS (gzip) | ≤ 24 KiB | **18.42 KiB** |
| 지연 로드 `/digest` 청크 | 분리 | 4.76 KiB (gzip) |
| 마운트된 방 행 (1,000방) | ≤ 60 | 48 |
| 마운트된 메시지 (1,000개) | ≤ 80 | 64 |
| 읽던 위치 흔들림 | ≤ 2px | ≤ 1.5px |
| 동시 `/stream` (탭 3개) | 1 | 1 |
| 데스크톱 LCP (1440×900) | — | 288–312ms |
| 모바일 LCP (390×844, 4× CPU·1.6Mbps 스로틀) | ≤ 2.5s | **2.85–3.00s — 미달** |

마지막 줄은 목표를 못 맞춘 그대로 적어 둔 것입니다. 스로틀을 끈 모바일 콜드 LCP는 약 450ms이고,
스로틀 아래에서는 폰트와 청크가 직렬로 초기화되면서 ~2.9s가 됩니다. 목표를 내리지 않았습니다.

## 검증

```sh
bun run contract:check   # openapi.json 해시 + 생성물 바이트 동일성
bun run typecheck        # strict, skipLibCheck 없음
bun run lint             # biome check .
bun test
bun run build
bun run size:check       # 위 예산표를 CI에서 강제
bun run check:all        # 위 전부
```

`.github/workflows/ci.yml` 이 push와 PR에서 같은 순서로 돕니다. 계약을 쓰는 방식이 바뀐 변경은
**살아 있는 `kanao serve` / `kamado serve` 에 붙여 확인**하고, PR에 그렇게 했는지 아닌지를
그대로 적습니다 — [`.github/pull_request_template.md`](.github/pull_request_template.md).

테스트에서 `sleep` 과 타이밍 가정은 금지입니다. 정확한 이벤트나 상태 변화를 먼저 구독하고
제한 시간 안에서 기다립니다. 스텁은 `401`·`429`·`503 BUSY`·깨진 봉투를 낼 수 있어야 하고,
그럴 수 없는 스텁은 존재할 수 없는 오류 경로를 통과시키는 것과 같습니다.

**실제 데이터는 어디에도 남기지 않습니다.** 픽스처·테스트·로그·스크린샷·커밋된 산출물 전부.
스크린샷 속 방 제목과 닉네임도 실제 데이터입니다.

## 문서

| 파일 | 내용 |
| --- | --- |
| [`BRIEF.md`](BRIEF.md) | **무엇을 만들 것인가**: 계약, 브라우저 제약, 계약에 없는 것, 만드는 순서 |
| [`DESIGN.md`](DESIGN.md) | 화면 계약: 릿지 법칙, 색 토큰과 측정된 대비, 상태, G1–G9 결정 |
| [`AGENTS.md`](AGENTS.md) | 이 저장소에서 일하는 규칙 |
| [`CHANGELOG.md`](CHANGELOG.md) | 변경 기록 |
| [`docs/deployment.md`](docs/deployment.md) | 정적 `dist/` 와 같은 origin 프록시, 쓰기 경계, 캐시·로그 정책 |
| [`docs/performance.md`](docs/performance.md) | 위 측정값의 조건과 원자료 |
| [`openapi.json`](openapi.json) | 두 코어가 공유하는 HTTP + SSE 계약 |
| `design/` | 방향·시드·참조 등 승인 과정의 작업 기록 (역사, 계약 아님) |

## 전에 무엇이었나

`0.0.0` 까지 이 저장소는 두 CLI를 **spawn 하는 HTTP 래퍼**였습니다(`kanao-cli` PR #1의 이식
계획). 구현은 없었고 문서만 있었으며, 그 방향은 폐기했습니다 — 코어 안에 `serve` 가 들어간 뒤로
래퍼는 같은 표면을 한 겹 더 감싸는 일이 됐고, 정작 없는 것은 그 표면을 쓰는 **화면**이었기
때문입니다. 폐기한 문서들(`BRIEF`·`PORTING`·`PROTOCOL` 의 옛 내용)은 git 이력 `8a5d251` 에
그대로 남아 있습니다.

## 라이선스

MIT. [LICENSE](LICENSE) 참조. 본문 글꼴은 Pretendard(SIL Open Font License 1.1)이고,
사본과 라이선스 전문은 `public/fonts/`·`public/licenses/` 에 있습니다.
