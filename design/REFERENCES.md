# References

Working record for S0 of the `ulw-design` run. Not the implementation contract;
root `DESIGN.md` is. Originals under `design/references/` are provenance only and
are **not** attached to S3 generation.

## Record status

- Revision/date: r1, 2026-09-21.
- Reference choice: five owner-supplied images. Owner statement: "art_reference_image
  디렉토리에 이미지들을 넣어놨어. b 를 모티브로 시작해보자."
- Brief revision used: BRIEF.md r1 (drafted in parallel, pending owner confirmation).
- Interpretation status: all five inspected as images by the session model (Opus 5).
  ADOPT/REJECT below are **proposed**, pending owner confirmation.

## Source inventory

| ID | Kind | Origin / creator | Local original | Capture/context | Rights/status |
| --- | --- | --- | --- | --- | --- |
| REF-A | architecture photo | owner-supplied, received via KakaoTalk 2026-09-21; creator unknown | `design/references/REF-A.jpg` (= `art_reference_image/a.jpg`) | full frame, uncropped | unknown; inspiration only, never redistributed or shipped |
| REF-B | architecture photo | owner-supplied, same batch; creator unknown | `design/references/REF-B.jpg` (= `art_reference_image/b.jpg`) | full frame, uncropped | unknown; inspiration only |
| REF-C | architecture photo | owner-supplied, same batch; creator unknown | `design/references/REF-C.jpg` (= `art_reference_image/c.jpg`) | full frame, uncropped | unknown; inspiration only |
| REF-D | art / staged photo | owner-supplied, same batch; creator unknown | `design/references/REF-D.jpg` (= root `KakaoTalk_20260921_091845735.jpg`) | full frame, 1024x2048 | unknown; inspiration only |
| REF-E | architecture photo / render | owner-supplied, same batch; creator unknown | `design/references/REF-E.jpg` (= root `KakaoTalk_20260921_091903869.jpg`) | full frame, uncropped | unknown; inspiration only |

Provenance note: the five root-level `KakaoTalk_*.jpg` files are the original
downloads. SHA-256 comparison confirms `a/b/c.jpg` are byte-identical copies of
three of them; REF-D and REF-E exist **only** at the repository root and were not
copied into `art_reference_image/`. None of the five contains KakaoTalk
conversation content — they are artwork received through the messenger, so the
`AGENTS.md` no-real-data rule is not engaged. The root copies are untracked and
should be deleted or ignored rather than committed.

## Inspection evidence

Input route: the host `read` tool rendered each JPEG to the session model, which
has image input. Full frames, no crops. No EXIF, creator or licence metadata was
recovered; colour names below are visual estimates, not sampled hex values.

| ID | Inspection evidence | Visible observations | Unseen / uncertain |
| --- | --- | --- | --- |
| REF-A | viewed full frame | Two flat planes split by a hard diagonal running low-left to high-right: warm off-white above, dusty periwinkle blue below. A thin red-vermilion handrail traces the diagonal, stepping down in two straight runs joined by tight radii. A black cat's head and ears peek over the blue edge, eyes visible, body hidden. Soft diagonal shadow across the upper white. Subject occupies well under 2% of frame. | exact hues; whether the red is paint or powder-coat; original aspect |
| REF-B | viewed full frame | **The motif.** A single pale sky-blue plaster wall fills roughly the top 70% of a tall portrait frame. One saturated warm yellow door sits low, slightly right of centre, its panel inset picked out by a thin recessed line. A small white gooseneck lamp is mounted directly above the door and throws a soft hard-edged shadow up and right. A black cat walks left-to-right on a pale limestone ledge at the door's base, in full profile, tiny. A blurred palm-frond shadow falls across the lower-left wall. Ground is a wide horizontal band of pale stone with a stepped lip. Matte throughout: no gloss, no gradient, no reflection. | exact hues; wall texture at 1:1; time of day |
| REF-C | viewed full frame | Clear sky-blue occupies the upper ~60%. Below, two flat planes meet along a hard diagonal: warm sand-beige left, saturated apricot/terracotta right. A thin cream-white keyline runs along both the diagonal and the top edge of the apricot plane, separating planes without shadow. A black cat sits upright in silhouette on the ridge, facing away, tiny and centred. No visible texture or grain. | exact hues; whether the sky is real or replaced |
| REF-D | viewed full frame (1024x2048) | One continuous rust/terracotta field with heavy, even film grain and soft tonal undulation, like a dune lit from the side. A white curved sweep of light cuts across the lower-middle third, narrowing to a point at the left edge and terminating in a rounded hook at the right. One small dark human figure stands in profile on that light band, near its right end. No hard geometry. The only high-contrast element is the light sweep. | whether photographic or generated; grain is clearly an applied treatment |
| REF-E | viewed full frame | A weathered turquoise/teal stucco building occupies the right third, cut off by the frame. A coral/salmon-painted door with a four-pane glass top light is the focal object, warm light spilling from inside. Above it a warm-glowing illuminated sign reads CAFE in red serif capitals. A small lantern hangs under the awning. The left two-thirds is near-empty: a pale desaturated sky graduating to a misty horizon over a wet, reflective pale pavement that mirrors the coral chairs and the building. Visible weathering, rust streaks and paint loss. | whether photographic or generated; the CAFE lettering is literal copy and must not be transplanted |

## Attribute decisions

One row per attribute. **Proposed** until the owner confirms.

| ID / attribute | Visible evidence | Proposed | Owner-priority rationale | UI implication / exclusion |
| --- | --- | --- | --- | --- |
| ALL / one calm field dominates | every frame gives 60–75% to a single uninterrupted plane | ADOPT | the product's job is reading conversation; a dominant quiet field is literally the message surface | the message reading area is the dominant plane; chrome stays thin |
| ALL / exactly one saturated accent | yellow door (B), red rail (A), apricot plane (C), light sweep (D), coral door + sign glow (E) — never two competing accents | ADOPT | `/send` is the only write in the whole contract and the only irreversible act; one accent can mark it and nothing else | one accent colour, reserved for the send action. Not for unread badges, not for links, not for emphasis |
| B, E / the accent is a door | both frames make a threshold the one warm object | ADOPT | entering a conversation is the product's core move; the metaphor is already in the motif | the active/entered room is rendered as the lit threshold; room entry is the accented transition |
| ALL / tiny solitary subject in vast space | cat or figure under ~2% of frame | ADOPT (as rhythm, not as illustration) | conveys calm attention rather than a busy inbox | generous whitespace; low information density; no dashboard grid |
| A, B, C / hard edges, no gradient on form | planes meet at hard lines; matte plaster | ADOPT | keeps a text-dense UI legible and cheap to render | flat fills, hairline dividers, no glassmorphism, no neumorphism, no drop-shadow stacks |
| B / soft single-source shadow from the lamp | one soft hard-edged shadow up-right of the door | ADOPT (sparingly) | gives the one accented element depth without material noise | at most one soft shadow, on the accented/active element only |
| C, A / thin light keyline separating planes | cream hairline along the diagonal | ADOPT | separates room list from thread without a heavy border or a dark rule | 1px light keyline as the primary divider |
| D / heavy film grain | pronounced even grain over the whole field | REJECT | grain over a Korean text UI degrades small-glyph legibility, which is the one thing this product cannot trade | no grain/noise overlay on text surfaces; at most a trace on a brand/empty-state panel |
| B, C / black cat as a recurring presence | present in three of five frames | ADOPT (as mascot, restricted) | a quiet signature that costs no screen space | cat appears only in empty states, the loading/connection state and the brand mark — never as an avatar or a decorative sticker in the thread |
| E / literal "CAFE" sign lettering | red serif capitals on a lit sign | REJECT | copying a sign's wordmark is borrowing an unrelated brand | no transplanted lettering or logo from any reference |
| E / weathering, rust, paint loss | visible decay on the stucco | REJECT | distressed texture reads as "broken" in a tool that must look trustworthy while it says "not delivered" | clean surfaces; state is communicated by copy and colour, not by damage |
| A, C / strong diagonal composition | hard diagonals dominate two frames | REJECT for layout | diagonal panel edges fight line-based text and responsive reflow | keep diagonals out of layout geometry; they may appear only inside the brand mark or an empty-state illustration |
| D / dark-figure-on-warm-field inversion | one warm field, dark subject | pending owner input | affects whether dark mode is a true inversion or a separate warm-dark palette | decides the dark theme strategy |

## Distillation boundary

- Confirmed ADOPT summary: **confirmed by the owner 2026-09-21.** One calm
  dominant field; exactly one saturated accent, reserved solely for the send
  action; accent-as-threshold; tiny-subject rhythm and generous whitespace; hard
  edges and matte fills; at most one soft shadow on the active element; hairline
  keyline dividers; the black cat as a restricted mascot (empty, loading and
  brand only).
- Confirmed REJECT summary: **confirmed by the owner 2026-09-21.** No grain or
  noise over text; no transplanted lettering or wordmarks; no weathering or
  distress; no diagonal layout geometry; no glassmorphism, neumorphism, stacked
  shadows or gradient fills on form.
- Resolved open question — accent: **REF-B's warm yellow**, owner-selected over
  REF-E's coral. One accent, one job: the send action.
- Resolved open question — dark theme: **a separate warm dark palette in REF-D's
  rust/terracotta key**, not a mechanical inversion of the light theme.
- Conflicts with brief: none identified.
- Generation boundary: S3 receives only the approved distilled direction plus real
  product content, scope and constraints. The five originals and this analysis
  transcript are **not** attached to the generation call.
- Originals: provenance only. Not shipping assets, not licensed for redistribution.

## Owner confirmation and history

- Owner statement on record: REF-B is the motif to start from; identity and art
  style are to be decided by combining this skill with the StyleGallery layer.
- Confirmed attributes: **approved by the owner on 2026-09-21**, in conversation,
  as part of the four-question S1 gate. The owner took the recommended option on
  every question.
- Corrections / superseded decisions: none. No proposed row was overturned.
- Open questions: all three resolved. Dark theme is a separate warm palette in
  REF-D's key; the cat is a restricted mascot (empty, loading and brand states
  only, never an avatar); the accent is REF-B's yellow.
