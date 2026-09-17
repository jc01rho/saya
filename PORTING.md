# PORTING — `kanao-cli` PR #1 을 여기로 옮기기

원본: `sanguneo/kanao-cli` PR #1 (`feat/remote-serve`, +1595/8파일).
읽는 법: `gh pr checkout 1 --repo sanguneo/kanao-cli`, 또는 그 브랜치의 `kanao/serve.py`.

바뀌는 것은 **백엔드 한 겹**입니다. HTTP 계층은 거의 그대로 옵니다.

## 0. 한눈에

| 원본 (`kanao/serve.py` 659줄) | 여기서 | 작업량 |
| --- | --- | --- |
| 상수, `validate_*`, `_RateLimiter`, `_status_for` (46–139) | `handler.py` 로 복사 | 그대로 |
| `build_handler(...)` (140–516) | `handler.py` 로 복사 | **세 군데만** (§2) |
| `make_live_*` 팩토리 (516–625) | **`backend.py` 로 새로 씀** (§3) | 여기가 전부 |
| `run()` (626–659) | `handler.py` 또는 `__main__.py` | 문구 한 줄 |
| `kanao/cli.py` 의 `serve` 훅 (+65) | `__main__.py` (§4) | 새로 |
| `tests/test_serve.py` 32개 | `tests/test_handler.py` | 스텁이라 거의 그대로 (§5) |
| `tests/test_serve_cli.py` 4개 | `tests/test_cli.py` | 인자 파싱만 |

## 1. 파일 배치

```
hinokami_kagura/__init__.py     __version__
hinokami_kagura/__main__.py     argparse + serve 진입점
hinokami_kagura/handler.py      ← build_handler 와 그 동반 상수들
hinokami_kagura/backend.py      ← subprocess 백엔드 (새로 쓰는 유일한 덩어리)
tests/test_handler.py           ← 원본 test_serve.py
tests/test_backend.py           가짜 CLI로 자식 호출 검증 (새로)
tests/test_conformance.py       tests/fixtures/envelopes/ 로 양쪽 봉투 중계 검증 (새로)
tests/test_no_core_imports.py   import 금지 강제 (새로, 10줄)
```

`errors.py` 는 만들지 마세요. 원본은 `KanaoError`/`ErrorCode`/`as_envelope` 를 kanao에서
import 하는데, 여기서는 그럴 수 없습니다. **가장 작은 답**: 에러 봉투를 dict로 직접
만드는 작은 헬퍼 하나를 `handler.py` 안에 두세요.

```python
def envelope(code: str, message: str, **extra) -> dict:
    """The cores' failure shape, built here because we cannot import theirs."""
    return {"ok": False, "error": {"code": code, "message": message, **extra}}
```

자식이 실패하면 **자식이 준 봉투를 그대로 중계**하면 되므로, 이 헬퍼는 래퍼 자신의 실패
(토큰 불일치, 자식 실행 불가, JSON 아님)에만 씁니다.

## 2. `handler.py` — 세 군데만

1. **`rooms=` 파라미터 제거.** docstring이 스스로 *"(tests)"* 라고 적은 테스트용 정적
   목록입니다. `_handle_rooms` 에서 `if rooms is not None:` 가지를 지우고 `rooms_provider`
   하나만 남기세요. 테스트는 provider 스텁을 주면 됩니다.
2. **`/digest` 추가.** `_handle_context` 를 그대로 베껴 쿼리에서 `span`·`limit`·`highlights`
   를 읽고 `digest_provider` 를 부르면 됩니다. `do_GET` 라우팅에 한 줄.
3. **`from .errors import ...` → §1의 로컬 헬퍼.** `_status_for` 의 코드→상태 표는
   **두 코어의 합집합**으로 넓히고(`PERMISSION_REQUIRED` → 403), **모르는 코드는 default
   분기**로 500을 주세요. 자식이 준 코드 문자열을 그대로 쓰면 됩니다.

나머지 — 인증, body framing, `_RateLimiter`, 405, `/health`, SSE 포장 — 는 손대지 마세요.

### 결정 하나: SSE `message` 이벤트의 모양

원본 `_handle_stream` 은 이렇게 냅니다.

```python
self._sse_emit("message", {"ok": True, "message": payload})   # 한 겹 감쌈
```

그런데 CLI의 `follow` NDJSON 한 줄은 **평평**합니다.

```json
{"ok": true, "event": "message", "id": "5003", "roomId": "1001", …}
```

**추천: 자식이 준 줄을 그대로 실으세요.**

```python
self._sse_emit("message", line)   # line 은 자식이 뱉은 dict 그대로
```

이 저장소의 규칙이 "해석하지 않고 중계한다"이고, SSE는 이미 `event:` 줄에 종류를 싣고
있어서 한 겹 더 감쌀 이유가 없습니다. 감싸는 쪽을 고르셔도 되지만, 그러면 **`PROTOCOL.md`
와 다른 모양**이 되니 README에 적어야 합니다.

`ready`·`ping`·`error` 이벤트는 래퍼 자신의 것이라 그대로 두면 됩니다.

## 3. `backend.py` — 새로 쓰는 유일한 덩어리

공통 토대부터. **§6의 함정 두 개가 여기 들어갑니다.**

```python
def split_cli(configured: str) -> list[str]:
    """Split a command line the way this platform spells paths.

    posix=True reads a backslash as an escape, so C:\\tools\\kanao.exe comes
    back C:toolskanao.exe and the failure claims the program is missing rather
    than that its name was eaten.
    """
    parts = shlex.split(configured, posix=False)
    out = []
    for p in parts:
        if len(p) >= 2 and p[0] == p[-1] and p[0] in "'\"":
            p = p[1:-1]
        if p:
            out.append(p)
    return out


def _decode(raw: bytes) -> str:
    """UTF-8 first, this machine's code page after.

    A child writing through a pipe on Windows gets the locale encoding unless
    told otherwise, so Hangul arrives as cp949. locale.getpreferredencoding is
    no help: under UTF-8 mode it answers "utf-8" whatever the machine is set to.
    """
    try:
        return raw.decode("utf-8")
    except UnicodeDecodeError:
        return raw.decode("mbcs" if os.name == "nt" else "utf-8", errors="replace")


CHILD_ENV = {**os.environ, "PYTHONIOENCODING": "utf-8"}
```

### 3.1 한 번 부르고 끝나는 것 — rooms / context / digest / send

원본 네 팩토리가 모두 이 하나로 수렴합니다.

```python
def run_cli(argv: list[str], *, timeout: float = 60.0) -> dict:
    """Run one command and return the envelope it printed.

    stdout is the answer and stderr is only for explaining a failure; merged,
    a child that narrates its own work puts that narration into the answer.
    """
    done = subprocess.run(
        [*base_argv, *argv],
        stdin=subprocess.DEVNULL,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        env=CHILD_ENV,
        timeout=timeout,
    )
    printed = _decode(done.stdout).strip()
    if not printed:
        # exit 2 writes usage to stderr and leaves stdout empty
        last = [l.strip() for l in _decode(done.stderr).splitlines() if l.strip()]
        raise BackendError("READ_FAILED", last[-1][:160] if last else "no output")
    try:
        return json.loads(printed)
    except ValueError:
        raise BackendError("READ_FAILED", "the CLI did not answer with JSON")
```

**자식이 `ok: false` 를 주면 그것은 실패가 아니라 답입니다** — 그대로 중계하세요.
핸들러가 `_status_for(code)` 로 상태를 정하면 됩니다.

원본 대비:

| 원본 | 여기서 |
| --- | --- |
| `reader.rooms()` → `[r.as_json() …]` | `run_cli(["rooms", "--readable-only"])["rooms"]` |
| `read_context(reader, id, limit)` 에서 `ok` 제거 | `run_cli(["context", "--room-id", str(id), "--limit", str(n)])` 에서 `ok` 제거 |
| (없음) | `run_cli(["digest", "--room-id", …, "--span", …])` 에서 `ok` 제거 |
| `_selected_room` + 중복 제목 census + `make_sender().send(...)` | `run_cli(["send", "--room-id", str(id), text, *flags])` — **방 해석·중복 거절·창 찾기는 CLI가 이미 합니다. 여기서 다시 하지 마세요.** |

`send` 의 인자 순서에 주의: 텍스트는 **위치 인자**입니다.
`send (--room ROOM | --room-id ROOM_ID) [--dry-run] [--open] text`

### 3.2 끝나지 않는 것 — `/stream`

**여기가 이 이식에서 유일하게 머리를 쓰는 곳입니다.**

핸들러는 `prime()` / `poll()` / `close()` 세 메서드를 오리 타이핑으로 부릅니다.
`poll()` 은 **블록하지 않고** 그동안 쌓인 것을 돌려줘야 합니다. 그런데 자식 `follow` 는
끝나지 않고 한 줄씩 흘립니다. 이어주는 것은 읽기 스레드 + 큐입니다.

```python
class FollowChild:
    """A `follow` child, its stdout drained into a queue by one thread.

    The handler polls; the child streams. A thread between them is what makes
    `poll()` return at once with whatever has arrived, which is the shape the
    handler already expects — so the handler does not change.
    """

    def __init__(self, base_argv, room_ids, interval):
        argv = [*base_argv, "follow", "--interval", str(interval)]
        for room_id in room_ids:
            argv += ["--room-id", str(room_id)]
        self._queue: "queue.Queue[dict]" = queue.Queue()
        self._process = subprocess.Popen(
            argv, stdin=subprocess.DEVNULL,
            stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, env=CHILD_ENV,
        )
        self._thread = threading.Thread(target=self._drain, daemon=True)
        self._thread.start()

    def _drain(self) -> None:
        for raw in self._process.stdout:          # NDJSON: one object a line
            line = _decode(raw).strip()
            if not line:
                continue
            try:
                self._queue.put(json.loads(line))
            except ValueError:
                continue                           # not our business to fix

    def prime(self) -> None:
        """The child primes itself; its first line says what it is watching."""

    def poll(self) -> list[dict]:
        found = []
        while True:
            try:
                found.append(self._queue.get_nowait())
            except queue.Empty:
                return found

    def close(self) -> None:
        self._process.kill()
        self._process.wait()
```

세 가지만 지키면 됩니다.

- **연결당 자식 하나.** `watcher_factory()` 가 호출될 때마다 새로 띄우고, `close()` 에서
  반드시 죽이세요. 핸들러의 `finally` 가 불러줍니다.
- **첫 줄(`event: "watching"`)을 메시지로 흘리지 마세요.** `event` 키로 걸러
  `"message"` 만 내보내거나, 그대로 보내되 소비자가 알아보게 두세요 — 전자를 권합니다.
- **`stdout` 를 줄 단위로 읽으세요.** `for raw in process.stdout` 이면 충분합니다.
  자식이 줄마다 flush 합니다.

핸들러 루프의 `time.sleep(period)` 는 **그대로 두세요.** 그건 SSE 페이싱이지 테스트
타이밍이 아닙니다. 이 저장소가 금지하는 sleep은 "무언가 끝나기를 기다리는" sleep입니다.

## 4. `__main__.py`

원본 `cli.py` 훅(+65줄)이 여기로 옵니다. 그대로 가져올 것:

- `--host`(기본 `127.0.0.1`) · `--port`(기본 8765) · `--token`(없으면 환경변수) ·
  `--min-interval`(기본 2.0, 0이면 해제) · `--poll-interval`(기본 1.0)
- 와일드카드(`0.0.0.0`, `::`, 빈 문자열) 바인딩이면 **stderr로 경고**
- `validate_token` — 16자 이상, ASCII 제한

여기서 더할 것:

- **`--cli "<명령줄>"`** — 1순위. 없으면 `--backend kanao|kamado|auto`(기본 `auto`:
  `sys.platform == "win32"` → `kanao`, `"darwin"` → `kamado`)로 `shutil.which` 탐색.
  못 찾으면 **`--cli` 를 안내하는 메시지와 함께 죽으세요.** kanao는 `pip install` 없이
  저장소 디렉터리에서 돌리는 게 기본이라 PATH에 없는 게 정상입니다.
- 환경변수 이름은 `KANAO_TOKEN` 말고 **`HINOKAMI_TOKEN`** 으로. 이건 다른 프로그램입니다.
- `run()` 의 `print(f"kanao serve listening on …")` 문구를 이 프로그램 이름으로.

**시작할 때 자식을 한 번 불러 확인하는 것**을 권합니다 — `<cli> status` 를 띄워
`ok` 가 오는지 보고, 안 오면 그 자리에서 죽는 편이 낫습니다. 첫 HTTP 요청에서야
"그런 프로그램 없음"을 알게 되는 것보다 훨씬 낫습니다.

## 5. 테스트

- **`tests/test_handler.py`** — 원본 `test_serve.py` 32개가 거의 그대로 삽니다. 스텁을
  주입해 핸들러만 보기 때문입니다. **딱 하나 고칠 것: 640행의 `time.sleep(0.05)` 폴링.**
  `threading.Event` 로 바꾸세요(스텁 `close()` 가 `set()` 하고, 테스트가 `wait(5)`).
- **`tests/test_backend.py`** — 가짜 CLI로 검증하세요. 파이썬 한 줄짜리면 충분합니다.
  덮을 것: 정상 봉투 · `ok: false` 중계 · JSON이 아닌 출력 · 빈 stdout(종료 2) ·
  **cp949로 한글을 뱉는 자식** · 역슬래시 경로 분할 · `follow` 자식이 여러 줄을 흘릴 때
  `poll()` 이 모아 오는지 · `close()` 가 정말 죽이는지.
  명령줄 문자열은 **바깥 홑따옴표·안쪽 쌍따옴표**로 직접 쓰세요. `shlex.quote` 로 만들면
  안쪽 아포스트로피가 `'"'"'` 로 이스케이프돼 non-POSIX 분할이 못 풉니다.
- **`tests/test_conformance.py`** — `tests/fixtures/envelopes/{kanao,kamado}/*.json` 을
  읽어, 그 봉투를 뱉는 가짜 CLI를 백엔드에 물리고 **HTTP 본문이 파일과 같은지** 확인.
  양쪽 8개씩 전부 도세요. 이게 **맥 없이 kamado 호환을 보장하는 장치**입니다.
- **`tests/test_no_core_imports.py`** — `hinokami_kagura/*.py` 를 읽어 `import kanao`,
  `from kanao`, `import kamado`, `from kamado` 가 없음을 assert. 10줄이면 됩니다.

## 6. 검증 순서

```bash
python -m unittest discover -t . -s tests          # 전부 초록
python -c "import ast,glob;[ast.parse(open(f,encoding='utf-8').read(),feature_version=(3,9)) for f in glob.glob('hinokami_kagura/*.py')+glob.glob('tests/*.py')];print('3.9 ok')"
```

라이브(Windows, 카카오톡 실행 중):

```bash
python -m hinokami_kagura serve --cli "python -m kanao" --token <16자+> &
curl -s localhost:8765/health
curl -s -H "Authorization: Bearer <토큰>" localhost:8765/rooms
curl -s -H "Authorization: Bearer <토큰>" "localhost:8765/digest?roomId=<id>&span=2h"
curl -N -H "Authorization: Bearer <토큰>" localhost:8765/stream
```

**`/send` 는 `dryRun: true` 까지만 확인하세요.** 실제 전송은 사람이 대상과 내용을 직접
본 뒤에 합니다.

## 7. 끝나면

원본 PR #1에 이 저장소의 커밋을 가리키는 코멘트를 남기고 닫습니다.
**`kanao-cli` 에는 머지하지 않습니다** — HTTP가 코어 안에 들어가지 않는 것이 이 저장소가
따로 있는 이유 전부입니다.
