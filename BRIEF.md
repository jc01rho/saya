# BRIEF — 무엇을 만들 것인가

이 문서 하나로 작업을 시작할 수 있게 쓴 것입니다. 원본 코드는 `sanguneo/kanao-cli` PR #1
(`feat/remote-serve`, 작성자 `jc01rho`, +1595/8파일)에 있습니다.

## 1. 목표

`kanao`/`kamado` CLI를 subprocess로 부르고 그 JSON을 HTTP + SSE로 중계하는 단일 프로그램.

```
hinokami-kagura serve --host 127.0.0.1 --port 8765 --token <16자+> --cli "python -m kanao"
```

## 2. 지켜야 할 선

이건 논의로 정해진 것이라 재검토 없이 따르면 됩니다.

- **`kanao`/`kamado` 를 import 하지 않는다. spawn 만 한다.** 이게 이 저장소가 따로 있는 이유
  전부입니다. 소스에 `import kanao` / `from kamado` 류가 없음을 **테스트로 강제**하세요
  (소스 파일을 읽어 문자열 검사하는 테스트 하나면 충분합니다).
- **JSON을 해석하지 않는다. 중계한다.** 자식이 뱉은 봉투를 그대로 HTTP 본문에 싣습니다.
  그래야 `typeCode` 같은 한쪽에만 있는 키가 문제되지 않습니다.
- **의존성 0개.** 표준 라이브러리만. `http.server`, `subprocess`, `json`, `shlex` 로 충분합니다.
- **Python 3.9 이상.** kamado 하한이 3.9라 맞춥니다. 괄호로 묶은 `with (a as x, b as y):` 는
  3.10 문법이라 못 씁니다 — `ast.parse(src, feature_version=(3, 9))` 로 확인하세요.
- **원격 쓰기는 이 프로그램 하나뿐이고, 토큰은 계정 비밀번호와 같은 무게입니다.** README와
  `--help` 에 그렇게 적으세요. 기본 바인딩은 루프백, 와일드카드면 경고.

## 3. 원본 코드에서 — 살릴 것

**`build_handler(...)` (PR #1 `kanao/serve.py` 140–516행) 는 거의 그대로 씁니다.**
`BaseHTTPRequestHandler` 서브클래스를 돌려주는 팩토리이고, 이미 `send` · `rooms_provider` ·
`context_provider` · `watcher_factory` 를 **주입**받게 짜여 있어서 백엔드만 갈아끼우면 됩니다.

안에 든 것 (손댈 이유 없음):

- bearer 인증 — `hmac.compare_digest`, 16자 이상, ASCII 제한
- body framing — `Content-Length` 필수, chunked 거부, 1 MB 상한, 짧은 본문 거부
- `_RateLimiter` + `threading.Lock` — send 직렬화와 최소 간격 강제
- SSE 포장, 메서드별 405, `/health` 는 토큰 없이
- `run()` — `ThreadingHTTPServer` + `daemon_threads`, 루프백 기본, 와일드카드 경고

PR #1의 스텁 기반 테스트(`tests/test_serve.py` 32개)도 핸들러가 그대로면 대부분 살아남습니다.

## 4. 원본 코드에서 — 바꿀 것

| 항목 | 지금 | 여기서 |
| --- | --- | --- |
| `make_live_*` 팩토리 (539–625행, ~90줄) | `Reader()` · `winauto` 직접 호출 | **subprocess 로 CLI 호출** (§5) |
| `build_handler(rooms=...)` | docstring이 *"(tests)"* 라고 적은 테스트용 정적 목록 | **제거.** 테스트는 `rooms_provider` 스텁으로 |
| `serve.py:557` `from . import cli as cli_module` | 위로 흐르는 순환 import | **제거.** 방 해석·중복 제목 거절은 CLI가 이미 합니다 |
| `test_serve.py:640` `time.sleep(0.05)` 폴링 | 워처 close 대기 | `threading.Event`. **이 저장소는 sleep 금지** |
| `cli.py` 훅 | kanao 안 | 이 저장소의 `__main__` |
| 엔드포인트 | rooms/context/send/stream/health | **`/digest` 추가** (0.9.0부터 양쪽 CLI에 있음) |

1,595줄 중 200줄 안팎입니다. HTTP 처리는 건드리지 않습니다.

## 5. 엔드포인트 → CLI 매핑

| 엔드포인트 | 실행 | 비고 |
| --- | --- | --- |
| `GET /health` | (없음) | 토큰 불필요 |
| `GET /rooms` | `<cli> rooms --readable-only` | 봉투 그대로 |
| `GET /context?roomId=&limit=` | `<cli> context --room-id … --limit …` | 그대로 |
| `GET /digest?roomId=&span=&limit=&highlights=` | `<cli> digest --room-id … --span …` | 새로 추가 |
| `POST /send` `{roomId, text, dryRun?, open?}` | `<cli> send --room-id … <text> [--dry-run] [--open]` | 락·간격은 래퍼가. 방 해석·중복 거절·창 찾기는 CLI가 |
| `GET /stream?roomId=…&interval=` | `<cli> follow --room-id … --interval …` | **연결당 자식 하나.** NDJSON 한 줄 → SSE 이벤트 하나. 연결 끊기면 자식 kill |

`send` 의 실제 플래그는 `python -m kanao send --help` 로 확인하세요. 현재:
`(--room ROOM | --room-id ROOM_ID) [--dry-run] [--open] text` — 텍스트는 **위치 인자**입니다.

**백엔드 선택:** `--cli "<명령줄>"` 이 1순위. 없으면 `--backend kanao|kamado|auto`(기본 auto:
`sys.platform == "win32"` → `kanao`, `"darwin"` → `kamado`)로 PATH에서 찾습니다. 못 찾으면
`--cli` 를 안내하는 명확한 에러로 죽으세요 — kanao는 `pip install` 없이 저장소 디렉터리에서
실행하는 게 기본이라 PATH에 없는 게 정상입니다.

**종료 코드:** 0 성공 · 1 처리된 실패(봉투가 stdout에) · 2 잘못된 명령(usage가 **stderr**로,
stdout은 빔). stdout이 비었거나 JSON이 아니면 `READ_FAILED` 로 감싸되 **자식의 원문을 그대로
노출하지 마세요.**

**에러 코드 → HTTP 상태**는 원본 `_STATUS_BY_CODE` 를 **두 코어의 합집합**으로 넓히세요.
`PERMISSION_REQUIRED`(kamado 전용)는 403 권장. 모르는 코드는 default 분기로 500.

## 6. 반드시 반영할 플랫폼 함정

전부 실제로 밟은 것들입니다. 추측 아닙니다.

1. **자식 stdout 인코딩.** 두 CLI는 `ensure_ascii=False` 로 한글을 그대로 냅니다. Windows에서
   파이프로 받으면 **cp949** 로 옵니다. 자식 env에 `PYTHONIOENCODING=utf-8` 을 넣으세요
   (파이썬 자식이니 확실합니다). 읽는 쪽도 UTF-8 → 실패 시 `mbcs` 폴백.
   **`locale.getpreferredencoding` 은 쓰지 마세요** — UTF-8 모드에서 기계 설정과 무관하게
   `"utf-8"` 을 답해서 폴백이 죽습니다. 이걸로 한 번 당했습니다.
2. **명령줄 분할.** `--cli "C:\tools\kanao.exe"` 를 `shlex.split(posix=True)` 하면
   `C:toolskanao.exe` 가 됩니다. **`posix=False`** 로 쪼개고 양끝 따옴표를 직접 제거하세요.
   (테스트에서 `shlex.quote` 로 만든 문자열은 안쪽 아포스트로피가 `'"'"'` 로 이스케이프돼
   non-POSIX 분할이 못 풉니다. 테스트용 명령줄은 바깥 홑따옴표·안쪽 쌍따옴표로 직접 쓰세요.)
3. **stdout과 stderr를 합치지 마세요.** 두 파일 또는 두 파이프로. 실패 이유를 인용할 때는
   stderr의 **마지막 줄**을 쓰세요 — 길이로 자르면 진단 로그 중간에서 잘립니다.
4. **프로세스 종료 대기에 sleep 금지.** `Popen.wait()` 또는 `threading.Event`.

## 7. macOS 없이 kamado 호환 검증하기

[`tests/fixtures/envelopes/`](tests/fixtures/envelopes/) 에 두 코어가 자기 **합성 픽스처**로 뽑은
실제 출력이 각각 8개씩 있습니다. 준수 테스트는 이 파일들을 읽어서, 핸들러가 둘 다 손대지 않고
중계하는지 확인하면 됩니다.

실제 대조 결과 (이미 측정됨):

```
context   kamado-only=['room.typeCode']     error_chat_not_found   same
digest    kamado-only=['room.typeCode']     error_invalid_request  same
messages  kamado-only=['room.typeCode']     follow_message         same
rooms     kamado-only=['rooms.typeCode']    follow_watching        same
```

8개 전부 키 집합 동일, 차이는 `typeCode` 하나. 에러 코드는 kamado에 `PERMISSION_REQUIRED` 하나 더.
**맥 실기 확인은 나중에 그 머신을 가진 쪽이 합니다.** 지금은 이 파일들로 충분합니다.

## 8. 완료 조건

- [ ] `hinokami-kagura serve --cli "<kanao>" --token …` 로 루프백에서 `/health` `/rooms`
      `/context` `/digest` `/stream` 이 실제 kanao 를 spawn 해 응답
- [ ] `/send` 는 **dry-run 까지만** 확인 (실제 전송은 사람이 대상을 확인한 뒤에)
- [ ] 소스에 `kanao`/`kamado` import 없음을 테스트가 보장
- [ ] 테스트에 `sleep` 없음
- [ ] 준수 테스트가 `tests/fixtures/envelopes/` 의 kanao·kamado 샘플을 모두 통과
- [ ] 전 파일 `ast.parse(feature_version=(3, 9))` 통과
- [ ] 의존성 0개 (`pyproject.toml` 의 `dependencies = []`)

## 9. 남은 것 / 다른 사람 몫

- **맥 실기 확인과 요청당 spawn 비용 측정.** Windows에서는 인터프리터 30 ms + import 90 ms +
  카탈로그 읽기 0.3–0.6 s 로 측정됐고, SSH 한 홉 건너 오는 요청엔 문제없습니다. macOS는
  **미측정**입니다. 1초를 크게 넘으면 kamado의 상주 데몬을 백엔드로 쓰는 분기를 논의해야
  하지만, **그 전까지는 spawn 단일 경로로 짜세요.** 분기를 미리 만들지 마세요.
- **kanao PR #1 은 이 저장소에 코드가 들어온 뒤 닫습니다.** kanao 에는 머지하지 않습니다.
