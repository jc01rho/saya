# Design brief

Working record for S1. **r2 — owner-confirmed 2026-09-21.** The four blocking
decisions were put to the owner and answered; S2 is authorized.

## Status and sources

- Revision/date: r2, 2026-09-21.
- Owner and confirmation source: owner answered the four S1 gate questions in
  conversation on 2026-09-21, selecting the recommendation in every case:
  direct-rooms-as-people-list, REF-B yellow accent, REF-D warm dark, Fable 5 for S2.
- README reviewed: `README.md` (purpose, architecture diagram, route table, the
  four browser constraints). `BRIEF.md` (contract, limits, build order, open
  decisions). `AGENTS.md` (working rules). `openapi.json` 0.14.0 (the contract).
- Existing root `DESIGN.md` / `design/` records: none existed before this run.

| Statement | Source | Kind | Confirmation needed |
| --- | --- | --- | --- |
| Web client over `kanao serve` / `kamado serve`; no server of its own | `README.md`, `AGENTS.md` | repository fact | no |
| Screens needed: friend list, chat, "등등" | owner message 2026-09-21 | owner statement | yes — see the friend-list gap below |
| REF-B is the starting motif | owner message 2026-09-21 | owner statement | no |
| Identity to be set by combining ulw-design with StyleGallery | owner message 2026-09-21 | owner statement | no |
| Stack not yet chosen; TypeScript + Vite proposed | `BRIEF.md` §5 | repository fact (open) | yes |
| Token held by a proxy rather than the browser | `BRIEF.md` §2, §5 | repository fact (proposed, unsettled) | yes |
| Korean is the primary interface language | inferred from all repo docs being Korean | **inference** | yes |

## Owner intent

- **Product purpose and problem.** Read, follow and reply to KakaoTalk
  conversations from a browser, against a local bridge that already answers a
  fixed HTTP+SSE contract. The cores do the reading and the sending; this
  repository supplies the screens that were missing.
- **Audience and primary task.** *Inferred, needs confirmation:* a single
  technical owner running the bridge on their own machine, catching up on
  conversation they missed and occasionally replying. Not a team product, not a
  multi-tenant service.
- **Owner philosophy the interface should express.** Taken from the repository's
  own rules, which are unusually explicit: the interface must never claim more
  than the contract proved. `submitted` is not "delivered". An empty result is
  not "nothing happened". Ambiguity is refused with candidates attached, never
  resolved by guessing. These are honesty constraints, and the visual language
  has to make honesty look calm rather than alarming.
- **Observable success.** A user can tell, at a glance and without reading help
  text, the difference between: connected vs. not; a room that can be read vs.
  one whose key is not in memory; a message that was sent vs. one merely
  submitted; a draft that is about to be destroyed vs. one that is safe.
- **Ranked priorities** *(proposed ranking, needs owner confirmation)*:
  1. Truthfulness of state — the screen never overstates.
  2. Reading comfort for long Korean text at length.
  3. Calm and distinctiveness — it must not look like a KakaoTalk clone.
  4. Speed of reply.
  5. Feature breadth. Explicitly last.
- **Anti-goals.** Not a KakaoTalk skin. Not a dashboard of metrics. No automatic
  retry of an uncertain send. No token on screen, in a log, or in a screenshot.
  No real nicknames, room titles or message text in any committed artifact.
- **Constraints.** Browser cannot use `EventSource` (auth is a header). No CORS
  on either core, so same-origin serving or a dev proxy. Identifiers are strings
  above 2^53. Eight concurrent `/stream` connections exist for the whole machine,
  so the client opens exactly one and shares it across views.

## Early inspiration interpretation

See `design/REFERENCES.md`. All five images were inspected as images.

- Confirmed ADOPT attributes: **confirmed 2026-09-21.** See the distillation
  boundary in `REFERENCES.md`. Accent is REF-B's warm yellow, reserved solely for
  the send action. Dark theme is a separate warm palette in REF-D's key.
- Confirmed REJECT attributes: **confirmed 2026-09-21.** Grain over text,
  transplanted lettering, weathering/decay, diagonal layout geometry, plus the
  material exclusions (glass/neumorphism/stacked shadow/gradient on form).
- Missing visual evidence: no licence or creator metadata for any reference; they
  are inspiration only and nothing is redistributed.
- S2 distillation requirement: only the approved attribute list crosses into the
  direction. Originals never reach the generator.

## Content inventory

Derived from `openapi.json` 0.14.0. Copy shown is **representative and invented** —
placeholder names are fictional, per the no-real-data rule.

| ID | Screen / purpose | Priority | Real data available | Primary action | Status |
| --- | --- | --- | --- | --- | --- |
| SCR-CONNECT | Connection and authorization. Must distinguish *host not ready* (`503`, e.g. `KAKAO_NOT_RUNNING`) from *wrong token* (`401 UNAUTHORIZED`) — `BRIEF.md` §4 makes this a design requirement, not an error toast. | 2 | `GET /health` (no token), then `GET /rooms` | retry / supply token | contract-backed |
| SCR-ROOMS | Room list: title, `kind`, `memberCount`, `unread`, `lastActivityAt`, and `readable`. Rooms that cannot be decrypted are **listed, not hidden**. | 1 | `GET /rooms` → `Room[]` | open a room | contract-backed |
| SCR-THREAD | Conversation reader: messages oldest-first, `replyTo` quotation, `mentions`, `mentionsMe`, plus a `coverage` statement so an empty window is never read as an empty conversation. | 1 | `GET /context` (limit 1–1000, default 40) | read / reply | contract-backed |
| SCR-LIVE | Live arrival on the open thread; one shared `/stream`, cursor resume by repeated `since=roomId:logId`, reconnect with backoff, gap disclosure for rooms the cursor did not name. | 3 | `GET /stream` SSE: `ready`/`message`/`cursor`/`ping`/`error` | none (ambient) | contract-backed |
| SCR-DIGEST | Extractive digest of the same window: slices, speakers, keywords, real highlight messages. Explicitly not model-generated. | 4 | `GET /digest` (span default `30m`, highlights 1–20) | jump to a highlight | contract-backed |
| SCR-SEND | Composer, `dryRun` confirmation, `wouldClearDraft` / `clearedDraft` warning **before** the draft is destroyed, and read-back before saying 보냈습니다. | 5 (build last) | `POST /send` → `SendResult` | send | contract-backed |
| STATE-ERR | The shared error surface. Must have a **default branch** on `error.code`; the two builds' code sets differ and both grow. `PERMISSION_REQUIRED` is macOS-only and is a 30-second human fix, so it gets its own screen. | 2 | `ErrorEnvelope`, 14 known codes | recover | contract-backed |
| STATE-AMBIG | Ambiguous room: several matched, `candidates` attached. The UI must present the choice, never pick the first. | 4 | `409 AMBIGUOUS_CHAT` + `candidates: Room[]` | choose | contract-backed |
| **SCR-FRIENDS** | **A friend list. NOT IN THE CONTRACT — see gap below.** | ? | none | ? | **blocked** |

### The friend-list gap

You asked for 친구목록. `openapi.json` 0.14.0 exposes six routes and **none of them
returns a friend or contact list** — only `/rooms`, which returns conversations.
`AGENTS.md` is explicit that a feature needing something the contract does not
expose "is an issue on the core repositories, not a local workaround."

Three honest options, and this changes the layout:

1. **Rooms of `kind: "direct"` are presented as the people list.** Costs nothing,
   ships now, but it only ever shows people you already have a conversation with.
2. **Drop the friend list** from this design and keep `/rooms` as the single
   navigation surface.
3. **Raise an issue on `kanao-cli` / `kamado-cli`** for a contacts route and design
   the surface now as a known-empty placeholder.

My recommendation is (1) for this design pass, with (3) opened in parallel — it
is the only option that gives you a usable people list without inventing a
contract this repository is forbidden to invent.

**OWNER DECISION 2026-09-21: option (1).** Rooms with `kind: "direct"` are
presented as the people list. SCR-FRIENDS is therefore not a separate screen but
a filtered view of SCR-ROOMS, and it is honest about only ever showing people you
already have a conversation with. A contacts-route issue on `kanao-cli` /
`kamado-cli` remains a recommended follow-up and is **not** done by this run.

## Scope decision

- **Recommendation: `app`.** The real design question is how the room list, the
  thread and the send confirmation sit together and how honest state is rendered
  inside them — a hero or a landing page would test none of that. Named screens
  for the concept: SCR-ROOMS + SCR-THREAD as one composed two-pane frame, which
  is the frame that decides everything else.
- Owner-selected scope: **`app`, by agent recommendation used as the default.**
  The owner was shown the recommendation and did not substitute another scope;
  per the skill's rule, the recommendation ran and this row records that it was a
  default rather than an explicit choice. Reopen if the owner wants otherwise.
- Viewport: desktop 1440×900 and mobile 390×844. Both are required evidence.
- Language: Korean primary, with long-Hangul-line behaviour as a first-class case.
- Representative state to render: a room list of ~8 invented rooms including one
  `readable: false`, and a thread showing a reply quotation, a mention of the
  signed-in user, and a `coverage` note.
- Exclusions from the concept frame: SCR-DIGEST, SCR-LIVE reconnection UI,
  SCR-CONNECT. They are specified in root `DESIGN.md` without being generated.

## Capabilities and constraints

| Role | Tool / demonstrated capability | Route | Limitations |
| --- | --- | --- | --- |
| Image understanding (S0, S4) | session model, verified by inspecting all five originals | host `read` tool | no EXIF/licence recovery; colours are visual estimates |
| Reasoning (S2) | `artistry` → Fable 5 xhigh | one call, no tools | **text-only**: S0 observations must be relayed as text, which is lossy. Recorded in `models.json`. |
| Image generation (S3) | `generate_image`, gpt-image-2.5-sunburst | direct tool call | provider quota, not reasoning budget, is the limit |
| Artifact saving | host filesystem | `design/seeds/` | none |
| Implementation (S5) | `deep` → gpt-6-astra | plan-metered | not started by this run |

### Stage model plan

| Stage | Required capability | Recommended and why | Owner-selected | Source | Consequence |
| --- | --- | --- | --- | --- | --- |
| S0 | real image input + S2-grade transfer judgment | session model, high — it is the only party that saw the images | pending | — | none |
| S1 | owner in the conversation | session model, medium — delegation removes you | pending | — | none |
| S2 | nuanced reasoning, single shot, no tools | **Fable 5 via `artistry`, xhigh** — the skill's 2026-09-09 bench produced its two best images from Fable-authored directions | pending | — | one metered premium call, ~14k tokens, ≈$0.40 observed |
| S2 (economical) | same | session model Opus 5 with the economical protocol, or Sol xhigh | pending | — | no premium spend; bench says Sol xhigh was the closest runner-up |
| S3 | image output + saving | **gpt-image-2.5-sunburst** via `generate_image` | pending | — | quota-limited; settle direction before generating |
| S4 | image input + implementation knowledge | session model, high — holds the records, must view the concept | pending | — | none |
| S5 | target stack + real-surface QA | `deep` → gpt-6-astra, plan-metered | pending | — | not this run |

- Stage model plan presented to the owner: **yes, this revision.**
- `design/models.json` written: yes, from `presets/recommended.json` with two
  recorded substitutions (S3 model name and channel, for what this host exposes).

## Approval and open decisions

Brief status: **owner-confirmed 2026-09-21. S2 is authorized.**

All six S1 questions are resolved:

1. Friend-list gap — **`kind:"direct"` rooms become the people list**, with a
   contacts-route issue on the cores recommended as a separate follow-up.
2. Scope — **`app`**, recommendation used as the default (recorded above).
3. ADOPT/REJECT — **confirmed** as written in `REFERENCES.md`.
4. Accent — **REF-B's warm yellow**, reserved solely for the send action.
5. Dark theme — **separate warm dark palette in REF-D's rust key**, not an inversion.
6. S2 model — **Fable 5 via `artistry` at xhigh**, the metered premium call the
   owner approved (~$0.40, ~14k tokens, one call, no tools).

Remaining follow-ups that are NOT part of this design run:

- `openapi.json` hash check: `BRIEF.md` §1 tells the reader to verify with
  `shasum -a 256 openapi.json`. On a Windows checkout with `core.autocrlf=true`
  and no `.gitattributes`, the working-tree file is CRLF and hashes to
  `ab81f102…`, not the documented `c741090c…`. The committed blob is correct; the
  recipe reports a false divergence. A `.gitattributes` marking `openapi.json` as
  `-text` would fix it.
- Five untracked `KakaoTalk_*.jpg` at the repository root. They are artwork, not
  conversation data, so no rule is broken — but they are clutter and should be
  deleted or ignored. Copies live under `design/references/` with stable IDs.
