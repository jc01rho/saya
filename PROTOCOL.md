# PROTOCOL — 두 CLI가 내는 봉투

> **정본은 여기가 아닙니다.** 이 계약을 지키는 쪽은 생산자이므로, 원본 문서는
> `kanao-cli/PROTOCOL.md` 와 `kamado-cli/PROTOCOL.md` 에 있고 둘은 같은 내용입니다.
> 이 사본은 이 저장소만 보고 작업할 수 있게 둔 것입니다.
>
> 그리고 문서보다 **[`tests/fixtures/envelopes/`](tests/fixtures/envelopes/) 의 샘플이 진짜
> 계약**입니다. 글과 파일이 어긋나면 파일이 맞습니다.

두 CLI는 명령마다 JSON 문서 하나를 표준출력에 찍고 종료합니다. 그 문서가 인터페이스이고,
소비자는 `kanao`/`kamado` 를 import 하지 않습니다.

## 봉투

성공:

```json
{ "ok": true, "...": "명령별 키" }
```

실패:

```json
{ "ok": false, "error": { "code": "CHAT_NOT_FOUND", "message": "…" } }
```

`ok` 는 항상 있고 항상 불리언입니다. 실패는 `code` 와 `message` 를 갖고, 더 가질 수도
있습니다(모호한 방이면 `candidates`). **`message` 는 사람이 읽으라고 쓴 것이고 언제든 문구가
바뀝니다. `code` 로 분기하고 `message` 로는 절대 분기하지 마세요.**

## 종료 코드

| 코드 | 뜻 |
| --- | --- |
| 0 | 성공. 표준출력에 `ok: true` 봉투 |
| 1 | 처리된 실패. 표준출력에 `ok: false` 봉투 |
| 2 | 명령줄 자체가 틀림. argparse가 **표준에러**로 usage를 씀 |

종료 2는 표준출력이 **빕니다.** 빈 출력을 "결과 없음"이 아니라 "잘못 부름"으로 다루세요.

## 값

- **모든 식별자는 문자열.** 카카오톡 id는 2^53을 넘어서 일반 JSON 파싱이면 깨집니다.
  `id`, `roomId`, `senderId`, `lastMessageId`, `attention` 안의 id 전부.
- **모든 시각은 오프셋이 붙은 ISO-8601.** `sentAt`, `lastActivityAt`, 다이제스트 구간의
  `from`·`to`.
- **메시지는 항상 오래된 순.**
- **없는 키가 곧 부정입니다.** `replyTo`, `mentions`, `mentionsMe`, `mentionsAll`,
  `repliesToMe` 는 해당할 때만 나옵니다.
- `text` 가 비어 있고 `kind` 가 `text` 가 아니면 이름만 알고 내용은 못 읽는 첨부입니다.

## 스트림: `follow`

`follow` 는 **NDJSON** 입니다 — 한 줄에 완전한 객체 하나, 생기는 대로 flush, 중단될 때까지.
첫 줄이 무엇을 보고 있는지 말하고, 이후 각 줄이 메시지 하나입니다.

```json
{"ok": true, "event": "watching", "rooms": ["1001"], "intervalSeconds": 1.0}
{"ok": true, "event": "message", "id": "5003", "roomId": "1001", "...": "…"}
```

`message` 이벤트는 `messages`·`context` 가 리스트에 담는 것과 **같은 객체**에 `ok` 와 `event`
만 더한 것입니다. 스트림이 끝난다고 가정하지 마세요.

## 호환 규칙

- **키 추가는 파괴적 변경이 아닙니다.** 소비자는 모르는 키를 무시해야 합니다. 실제로 kamado가
  Windows 쪽에 없는 `room.typeCode` 를 갖고 있습니다.
- **키 제거·개명·의미 변경은 파괴적**이고, 부 버전과 `CHANGELOG.md` 의 이유와 함께 옵니다.
- **에러 코드 추가도 파괴적이지 않습니다.** 모르는 코드를 위한 default 분기를 반드시 두세요.
  두 갈래의 코드 집합은 같지 않고 둘 다 늘어날 수 있습니다.

## 에러 코드

| 코드 | 뜻 |
| --- | --- |
| `AMBIGUOUS_CHAT` | 여러 방이 맞음. `candidates` 가 붙음; `--room-id` 로 재시도 |
| `CHAT_NOT_FOUND` | 그 제목의 방이 없음 |
| `KEY_UNAVAILABLE` | 이번 세션에 카카오톡이 그 방을 연 적이 없어 키가 메모리에 없음 |
| `KAKAO_NOT_RUNNING` | 클라이언트가 안 떠 있거나 로그인 안 됨 |
| `NO_USER_DATA` | 로그인된 프로필 디렉터리를 못 찾음 |
| `READ_FAILED` | 데이터베이스를 읽거나 복호화하지 못함 |
| `BUSY` | 읽는 중 동시 쓰기; 한 번 재시도 |
| `INVALID_REQUEST` | 인자는 이해했으나 쓸 수 없음 (슬라이서가 못 받는 구간 등) |
| `WINDOW_NOT_FOUND` | 그 방의 대화창이 클라이언트에 열려 있지 않음 |
| `INPUT_NOT_FOUND` | 창은 찾았으나 입력 상자를 못 찾음 |
| `SEND_FAILED` | 클라이언트가 거절했거나 쓰기를 확인하지 못함 |
| `PERMISSION_REQUIRED` | **kamado 전용.** 전체 디스크 접근 또는 손쉬운 사용 권한이 없음 |

## 보내기

`send` 의 `submitted: true` 는 클라이언트가 텍스트를 **받아들였다**는 뜻이지 전달 확인이
아닙니다. 확인이 필요하면 방을 되읽어 새 `fromMe` 메시지를 찾으세요. `clearedDraft` 는
입력창에 쓰다 만 글이 있었고 지워졌다는 보고입니다 — 거절하지 않고 보고합니다.

**전송 사이에 최소 2초를 두세요.**

## 샘플

[`tests/fixtures/envelopes/kanao/`](tests/fixtures/envelopes/kanao/) 와
[`kamado/`](tests/fixtures/envelopes/kamado/) 에 각 8개. 두 코어가 자기 `tests/fixtures.py` 의
**합성 데이터**로 뽑은 실제 출력이고, 실제 계정은 한 번도 읽지 않았습니다.

각 코어 저장소에서 갱신하는 법:

```bash
python -m tests.test_protocol --write     # kanao (Windows)
python3 -m tests.test_protocol --write    # kamado (macOS/WSL)
```

한 가지 예외: `follow_watching.json` 은 캡처가 아니라 `cli._follow` 와 같은 방식으로 **재구성**한
것입니다. 끝나지 않는 루프를 돌려야 캡처되기 때문입니다. `follow_message.json` 은 실제
`Message.as_json()` 을 써서 진짜로 고정됩니다.
