# Generated UI concepts

Working record for S3. Concept images are evidence, not shipping assets.

## Approved experiment

- Brief / direction revisions: `design/BRIEF.md` r2, `design/DIRECTION.md` r1,
  both owner-confirmed 2026-09-21.
- Owner-selected scope: `app` — the composed two-pane main screen.
- Comparison set approved by the owner 2026-09-21: **D3 + D1, two frames**, to
  test whether encoding state as *position* beats encoding it as a *word*.
- Content held fixed: the eight invented rooms and the 개발 잡담 thread from the
  brief's content inventory. Identical in both prompts.
- Viewport held fixed: desktop 1440×900 and mobile 390×844 on one canvas.
- Language: Korean. Representative state: one unreadable room (공지), one reply
  quotation, one mention of the signed-in user, one coverage line, one pending
  send, one standing draft warning.
- Invariants: wall/ground split (D3 only), yellow on the send door and nowhere
  else, oldest-first order, coverage line first, 공지 listed at full ink, no bubbles.
- Variable explored: **the design law only.**

### Resolved settings, requested vs observed

Read from `design/models.json` and checked against what this host actually does.

| Setting | Recorded / requested | Observed | Note |
| --- | --- | --- | --- |
| S3 model | `gpt-image-2.5-sunburst` | `gpt-image-2.5-sunburst` | as recorded |
| `s3_channel` | `image-tool` | `image-tool` | host tool called directly with the compiled prompt; provider config `opencodex` |
| Size | 2560×1280 | 2560×1280 | 2:1, both divisible by 16 |
| Quality | `high` (C1, C2), `xhigh` (C3) | as requested | |
| Background | `auto` (C1, C2), **`opaque` (C3)** | **`transparent` in all three** | **Tool limitation:** the response reports `transparentBackground: true` even when `background: "opaque"` is requested. The request was not honoured. Recorded rather than worked around. |
| Numeric seed | not offered | not returned | the tool exposes no seed parameter |
| Revised prompt | — | **not returned** (`revisedPrompts: []`) | no provider rewrite to preserve |
| Image attachments | none | none | the five originals were NOT attached; the skill's context boundary held |

Compiler check for the C1 prompt:

```
bun scripts/compile-prompt.ts <project>/design/DIRECTION.md --scope app
EXIT=0    9,968 chars    stderr empty    UNAPPROVED occurrences: 0
```

**Compiler wrapper reviewed.** `compile-prompt.ts` prepends one sentence this
skill owns: *"Design an application screen centered on a useful task, with
persistent navigation, clear information hierarchy, controls and meaningful
status feedback rather than a marketing hero."* It reassigns no region and no
accent. Noted tension: "persistent navigation" and "controls" pull gently toward
a toolbar, which the direction forbids. Inspected for in every candidate; no
toolbar appeared.

## Candidate inventory

| ID / parent | Direction, changed factor | Path / dimensions | Execution | Inspection | Disposition |
| --- | --- | --- | --- | --- | --- |
| C1 | D3 The Ledge, baseline | `design/seeds/C1-D3-ledge.png`, 2560×1280 | generated, session image tool | viewed by the session model | superseded by C3 |
| C2 | D1 Wall & Door, law swapped | `design/seeds/C2-D1-walldoor.png`, 2560×1280 | generated, session image tool | viewed by the session model | rejected — see critique |
| C3 / parent C1 | D3, one factor changed: background requested opaque + xhigh | `design/seeds/C3-D3-ledge-opaque.png`, 1672×941 actual | generated, session image tool | viewed by the session model | superseded by C4 |
| C4 / parent C3 | **Direction r3** — owner added four requirements mid-run: bubbles, a distinguished full-height room list, a red unread badge, and the corrected square-cornered door | `design/seeds/C4-D3-r3.png`, 1672×941 actual | generated, session image tool | viewed by the session model | **parent of the selected concept** |
| C5 / parent C4 | identical prompt, canvas size 2048×1024, to test whether the blob artifact was size-dependent | `design/seeds/C5-D3-r3-clean.png` | generated | viewed | rejected — artifact persisted, hypothesis disproved |
| C6 / parent C4 | prompt guarded with an explicit instruction that the empty wall contain no blob, smudge or dark mass | `design/seeds/C6-D3-final.png` | generated | viewed | rejected — **artifact grew larger**; naming the unwanted element reinforced it |
| **C4-flat** / parent C4 | no generation: C4 composited onto the wall colour #CBDDE9 to resolve the alpha holes | `design/seeds/C4-flat-wall.png`, 1672×941 | **post-processed with PIL, not generated** | viewed by the session model | **SELECTED** |

Exact submitted prompts, verbatim, are saved beside the images as
`design/seeds/prompt-C1-D3.txt` (also used for C3) and
`design/seeds/prompt-C2-D1.txt`. C2's prompt was composed manually from the same
six fields with only the law-bearing sentences rewritten; a mechanical check
confirmed zero occurrences of "ledge" in it and content parity elsewhere.

## Critique

Inspection route: the host `read` tool rendered each PNG to the session model,
which has image input. Full frames at saved resolution. Proportions below are
estimates from viewing, not measurements.

### C1 — D3 The Ledge (baseline)

| Region | Visible evidence | Proposed rule (not visible evidence) | Disposition |
| --- | --- | --- | --- |
| Wall / ground split | The ledge runs unbroken full width; blue wall above, cream ground below, at roughly the stated height | The ledge must be a layout boundary that rises as pending items accumulate | **Preserve** — the law survived generation, which Fable rated the likeliest failure |
| Pending vs proven | 나 09:31 보냈습니다 sits on the wall; 나 09:33 입력됨 sits on the cream ground with the draft note and composer | Crossing is the only animation in the product | **Preserve** — this is the whole point of the direction |
| Accent discipline | Yellow appears only on the two 보내기 doors. Unread 4 and 12 are ink; the active row is weight only | Accent stays reserved for send in every state | **Preserve** — the predicted accent leak did not occur |
| 공지 | Listed at full ink with 읽을 수 없음 (키 없음) as its preview, no count, not dimmed | Unreadable rooms never dim | **Preserve** |
| Coverage | 이 기기에 저장된 범위만 표시합니다 is the first row, hairline beneath | — | **Preserve** |
| Desktop pane centre | **Large black/grey smudge artifact** covering a substantial area | — | **Reject — generation artifact** |
| Canvas edges | Torn ragged black-and-white fringe; background came back transparent | Backdrop must be flat warm white | **Reject — tool defaulted against the spec** |
| Mobile left edge | Colour-fringed artifact strip | — | **Reject — artifact** |

### C2 — D1 Wall & Door (the rejected alternative)

| Region | Visible evidence | Disposition |
| --- | --- | --- |
| Law | Cream list column full height, one unbroken blue conversation, no horizontal band — D1 rendered faithfully | correctly executed |
| **Pending vs proven** | 나 09:31 보냈습니다 and 나 09:33 입력됨 sit in the same column, separated only by a small slate word at time-label size | **Reject.** At a glance the two are indistinguishable. This is the decisive finding: it confirms Fable's prediction that D1 gives priority 1 the least visual mass in the frame |
| Accent discipline | Yellow only on 보내기 | would have been fine |
| Artifacts | Same black smudge, larger; same torn edges | — |

### C3 — D3, refined (recommended)

| Region | Visible evidence | Disposition |
| --- | --- | --- |
| Artifact | **The black smudge is gone.** Frame is clean | **Preserve** |
| Law, accent, 공지, coverage, quotation, mention, cat | All invariants from C1 held: ledge full width, pending below it, yellow only on the door, 공지 at full ink, coverage first, reply quotation with its left hairline, @사용자 in heavier weight and underlined, cat on the ledge at lower left | **Preserve** |
| Blank wall | The region between the room title and the coverage line is empty, as the direction specified | **Preserve** — this is the adopted negative space, not an omission |
| Send door silhouette | Rendered as a **rounded-corner button wider than it is tall**, not the specified square-cornered upright rectangle taller than wide | **Revise in the contract.** Deliberate: the door metaphor needs the upright proportion. Accidental drift, not an approved change |
| Doorway gap | The interruption of the vertical keyline at the active room row is not legible | **Revise in the contract** — specify it explicitly rather than hope for it |
| Column measure | Conversation text runs wider than the stated ~60% of pane width | **Revise in the contract** — set an explicit max measure in `ch` |
| Generated Hangul | Typos in pseudo-copy: 화면어 (→ 화면이), 다서 (→ 다시), 어변 주 (→ 이번 주), 데스크톱 업에 (→ 앱에), 늦제 (→ 늦게) | **Reject as copy.** Generated text is never product copy; the contract carries the correct strings |

### No real data

Every room title, speaker label and message string in all three candidates comes
from the invented set in `design/BRIEF.md`. Speakers are 참여자 A / 참여자 B / 나.
No real nickname, room title or message appears in any frame, and no token or key
string is drawn anywhere. Verified by reading each frame.

## Owner choices and refinement history

| Date / source | Candidates shown | Owner choice | Approved next change |
| --- | --- | --- | --- |
| 2026-09-21, conversation | direction set D1–D5 as text | D3 + D1 rendered as a comparison | generate both |
| 2026-09-21, conversation | C1, C2, C3 rendered inline | **C3 selected** as the base, plus one more render to verify the door | four new requirements added, below |
| 2026-09-21, conversation | — | Owner added, verbatim: "말풍선 필요해보임, 채팅목록 구분되게 해야함, 채팅목록 화면넓을때는 하단까지 꽉차게, 고양이는 움직이면 좋겠음" | direction revised to r2 |
| 2026-09-21, conversation | — | Owner added, verbatim: "안읽은 항목 빨간 뱃지에 하얀 숫자 표시로 변경" | direction revised to r3 |
| 2026-09-21, conversation | C4, C5, C6 rendered inline | "까만색 깨진 요소가 왜 배경에 있는지 모르겠다? 많이 좋아진거같은데" — improvement acknowledged, artifact queried | artifact diagnosed and fixed without regenerating |

### Superseded decisions, recorded rather than overwritten

Two owner additions reversed decisions confirmed earlier in this run. Both are
implemented as asked; the reversal is recorded here rather than silently absorbed.

1. **Speech bubbles.** REJECT R5 in `DIRECTION.md` rejected bubbles as
   structurally a KakaoTalk clone whose fills break the accent monopoly. The owner
   subsequently required them. Implemented in the form that preserves the rest of
   the direction: flat, tail-less, unoutlined, no right-alignment or mirroring,
   filled only with warm white (#FAF6EE) for others and pale sand (#F4EBDA) for
   the signed-in user. The door keeps its yellow monopoly. The lead noted the
   objection once; the owner's instruction stands.
2. **Red unread badge.** The confirmed accent discipline rendered unread counts in
   ink, with one saturated colour in the palette. The owner required a red badge
   with white numerals. Implemented using REF-A's vermilion handrail red
   (#D8452F) rather than a generic alert red, so it belongs to the reference
   palette, and confined strictly to the unread badge — no red text, no red rules,
   no red error states, and explicitly not on the unreadable room.

## Explicit later image-conditioned request

Not requested. The five originals stayed provenance-only; no image was attached
to any generation call.

## Selected concept and asset plan

- Owner-selected candidate: **`design/seeds/C4-flat-wall.png`** — C4 (direction
  r3, carrying all four owner additions) composited onto the wall colour. The
  owner selected C3's composition, then required the four changes C4 implements,
  and on seeing C4 responded "많이 좋아진거같은데". Final contract approval is still
  pending and is requested at the foot of root `DESIGN.md`.

### The black mass: diagnosed, not guessed

Three regeneration attempts failed to remove a large black shape from the empty
region of the wall. It was not a prompt defect and not a design problem.

Measured on `C4-D3-r3.png` with PIL: the dark mass is **63.7% fully transparent
and 0% fully opaque**, and 95.7% of the whole image carries partial alpha. Every
PNG returned by the tool is colour-type 6 (RGBA). The shape was never painted —
it is a hole in the alpha channel that a viewer composites to black, which also
explains the torn ragged fringe around every frame.

Two provider behaviours are the cause, both recorded as limitations:

- `background: "opaque"` is **silently ignored**. The tool reported
  `transparentBackground: true` on all six calls, including the ones that
  explicitly requested opaque.
- Returned dimensions differ from the request: 2560×1280 and 2048×1024 were both
  requested; every file came back **1672×941**.

Disproved hypothesis, recorded: C5 tested whether the artifact was canvas-size
dependent — it was not. C6 tested whether naming the unwanted element would
suppress it — **the artifact grew larger**, the standard negative-prompt backfire.
Neither attempt is presented as a success.

Resolution: composite the RGBA onto the direction's own wall colour. Zero extra
generation calls. `C4-flat-wall.png` is the clean result and is the selected
concept; `C4-flat-warm.png` is the same image on the warm-white backdrop.
- Intent to preserve: the ledge law, the accent monopoly, the full-ink unreadable
  room, the coverage line as first row, the blank wall, the cat's single placement.
- Drift to correct in the contract, not adopt: the send door's proportion and
  corner radius, the illegible doorway gap, the over-wide column measure, and all
  generated Hangul typos.
- Behavioural questions left for root `DESIGN.md`: scroll ownership per surface,
  what happens when several messages are pending at once, focus order, reduced
  motion, and the warm dark palette, which was recorded but never rendered.

| Needed asset | Path or missing | Origin / rights | Ready? |
| --- | --- | --- | --- |
| Concept evidence | `design/seeds/C3-D3-ledge-opaque.png` | generated this session | ready, evidence only |
| Cat brand mark (vector) | **missing** | must be drawn as a real SVG, not cropped from a concept | pending |
| Korean typeface | **not verified** | Pretendard named by the direction; licence, weights and Hangul coverage unverified | pending |
