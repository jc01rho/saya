# AGENTS.md — working on hinokami-kagura

A web client for the HTTP + SSE surface that `kanao serve` (Windows) and
`kamado serve` (macOS) both answer. `BRIEF.md` is what to build and why; this
file is how to work here.

Nothing is implemented yet. The stack is not chosen — when it is, add its
commands to this file in the same breath.

## The line that cannot move

**This repository has no server and no core.** It draws screens over a contract
that already exists. It does not import, spawn, or reimplement `kanao` or
`kamado`; it does not open their databases, hold their keys, or need their
permissions. Everything else here follows from that.

- A machine with no KakaoTalk can develop and test the whole client.
- The only thing this repository knows about the two platforms is one JSON file.
- If a feature needs something the contract does not expose, it is an issue on
  the core repositories, not a local workaround.

## `openapi.json` is copied, never edited

It is byte-identical to the file in both core repositories. Updating means
copying it across and re-checking the hash; editing it here forks the contract
while leaving every hash looking plausible. Types are generated from it rather
than written by hand, so a contract that moves breaks the build instead of a
user's screen.

## Rules taken from the core repositories

They apply here for the same reasons they apply there.

- **No real data, ever.** Not in fixtures, tests, logs, screenshots, or
  committed output. Room titles and nicknames in a screenshot are real data.
- **No sleeps and no timing assumptions.** Subscribe to the event or the state
  change and await it with a bounded timeout. A test that passes by timing luck
  is a defect.
- **Stubs must fail the way production fails.** A stubbed route that cannot
  return `401`, `429`, `503 BUSY` or a malformed envelope is a test passing
  against an error path that cannot happen.
- **Ambiguity is refused with candidates attached**, never resolved by taking
  the first match. The cores already do this; do not paper over it in the UI.
- **The token is a password.** It opens remote write access to the user's own
  KakaoTalk account. It is never drawn, never logged, and never committed.

## What the screen must not claim

- `submitted` means the client's input box emptied, **not** that anything was
  delivered. Say "보냈습니다" only after reading the message back.
- An uncertain send is never retried automatically.
- A draft the send would clear is reported before it is cleared, not after.
- An empty result is not proof that a conversation never happened; the cores
  read only what the client cached locally.

## Verification

Scale it to the change. Diagnostics on every changed file; the relevant tests
for behaviour; and for anything the user sees, **look at it** — at desktop and
at mobile width — rather than concluding it from the diff.

A change to how the contract is consumed is checked against a live
`kanao serve` / `kamado serve` when the person making it has one, and the pull
request says plainly whether it was.

## Pull requests

- **The evidence is the review.** A pull request carries what it ran and what it
  measured — the suite's last line, the new test failing against the code before
  the fix, before-and-after numbers with the data they were taken on, and what
  was and was not done against a live server. A claim with nothing attached is
  not ready to open. `.github/pull_request_template.md` is that list.
- **Merge oldest first.** Later pull requests rebase onto earlier ones.

## Deliberately absent

A server of its own, a second contract, an in-process plugin API, and any path
that reaches KakaoTalk without going through a core. Login automation, protocol
reimplementation and history harvesting are absent here for the same reasons
they are absent there.
