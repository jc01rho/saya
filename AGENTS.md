# AGENTS.md — working on hinokami-kagura

An HTTP + SSE wrapper around `kanao-cli` (Windows) and `kamado-cli` (macOS), in
zero-dependency Python 3.9+. It **spawns** those CLIs and relays their JSON; it
never imports them. `BRIEF.md` is what to build and why; this file is how to
work here.

## Commands

```bash
python -m unittest discover -t . -s tests    # the whole suite
python -m hinokami_kagura serve --help
```

## The line that cannot move

**This package does not import `kanao` or `kamado`.** It starts them as
processes and reads their standard output. Everything else here is a
consequence:

- The decryption key never enters this process. It lives in a child that dies
  with the request.
- Both cores keep their promise that reading opens no socket, and that promise
  stays checkable with `grep`.
- One codebase serves both platforms, because the difference between them is a
  binary name and one extra key.

A test asserts the absence of those imports. If that test ever needs deleting,
this repository has stopped being what it is for.

## Rules taken from the core repositories

They apply here for the same reasons they apply there.

- **No real data, ever.** Not in fixtures, tests, logs, or committed output.
  The envelope samples under `tests/fixtures/envelopes/` were generated from the
  cores' synthetic fixtures, which is why they can be committed.
- **No sleeps and no timing assumptions.** Wait on the thing itself —
  `Popen.wait()`, a `threading.Event` — never on a clock. The original code had
  one `time.sleep(0.05)` polling loop and it is not to be carried over.
- **Stubs must fail the way production fails.** A stub CLI that returns
  garbage must produce the same error the real one would, or a test passes
  against an error path that cannot happen.
- **Ambiguity is refused with candidates attached**, never resolved by taking
  the first match. The cores already do this; do not paper over it here.
- **Nothing expensive in a constructor**, so `--help` and a bad token fail fast
  without spawning anything.

## Pull requests

- **The evidence is the review.** A pull request carries what it ran and what
  it measured — the suite's last line, the new test failing against the code
  before the fix, before-and-after numbers with the data they were taken on,
  and what was and was not done against a live client. A claim with nothing
  attached is not ready to open. `.github/pull_request_template.md` is that
  list.
- **Merge oldest first.** Later pull requests rebase onto earlier ones.

## Platform facts that are easy to get wrong

Each of these was hit for real while porting between the two cores. They are
not hypotheses.

- **A child's standard output is not UTF-8 on Windows.** Both CLIs print with
  `ensure_ascii=False`, so Hangul arrives as **cp949** through a pipe. Put
  `PYTHONIOENCODING=utf-8` in the child's environment, and decode UTF-8 first
  with an `mbcs` fallback. **Do not use `locale.getpreferredencoding`** — under
  UTF-8 mode it answers `"utf-8"` whatever the machine is set to, which turns
  the fallback back into the decoding that just failed. This cost a debugging
  round once already.
- **`shlex.split` in POSIX mode eats backslashes.** `C:\tools\kanao.exe` comes
  back `C:toolskanao.exe`, and the failure then claims the program is missing
  rather than that its name was eaten. Split with `posix=False` and strip the
  surrounding quotes yourself.
- **Keep stdout and stderr apart.** A child narrates its own work; merged, that
  narration lands at the top of the answer. Quote a failure by stderr's **last
  line**, not its last bytes — cutting by length lands in the middle of a
  diagnostic.
- **Exit 2 writes usage to stderr and leaves stdout empty.** Treat empty
  standard output as a malformed call, not as an empty result.

## Conventions

- The HTTP layer speaks the cores' envelope unchanged: `{"ok": true, ...}` or
  `{"ok": false, "error": {"code", "message"}}`. **The body is relayed, not
  reinterpreted** — that is what makes one key existing on only one platform a
  non-event.
- Unknown error codes get a default branch. The two cores' sets are not
  identical and both may grow.
- `submitted` means the client accepted the text, never confirmed delivery.
- Sends are serialized under one lock and spaced apart, because the client's
  input box is a single shared resource.
- Default binding is loopback. A wildcard address warns. There is no TLS of its
  own — reach it over SSH forwarding, a VPN, or a reverse proxy.
- **The token is a password.** It opens remote write access to the user's own
  KakaoTalk account. Say so in `--help` and in the README.

## Deliberately absent

A plugin loader, a manifest format, rendering hooks, and any in-process
extension point. The process boundary plus the JSON envelope *is* the extension
mechanism; giving out an in-process API would freeze the cores' internals as a
public contract, and those internals are where their hard-won invariants live.

Also absent: anything that makes the cores themselves reach the network. If a
feature needs to fetch, it is a separate process on this side of the boundary.
