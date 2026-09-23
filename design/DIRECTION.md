# Visual direction

Working record for S2. Root `DESIGN.md` is the implementation contract; this is
the reasoning behind it.

## Decision context

- Revision/date: r1, 2026-09-21.
- Owner-approved brief revision: `design/BRIEF.md` r2, owner-confirmed 2026-09-21.
- Confirmed ADOPT/REJECT decisions: `design/REFERENCES.md`, distillation boundary
  section, owner-confirmed 2026-09-21.
- Authored by: Claude Fable 5.1 (max) via the `artistry` category, one call, no
  tools, 62,703 tokens, 11m05s. Owner-approved model choice.
- **Recorded limitation:** `artistry` is text-only on this host. The S0 image
  observations were relayed to it as text and labelled as such in its prompt.
  That relay is lossy; the author never saw the five references.
- Product design question this comparison tests: can the difference between
  *submitted* and *delivered* — the product's central honesty problem — be
  carried by layout rather than by a caption, without looking like an error?

## Recommendations and trade-offs

Five hypotheses. All five hold the owner's fixed decisions (one dominant field;
one yellow reserved for send; hairline keylines; at most one shadow; flat matte;
cat restricted to brand/empty/loading; no diagonals, grain, weathering or glass).
They differ in the **design law** that organises everything else.

| ID | Design law (one sentence) | Mechanism | Priority advanced | Trade-off / risk | Disposition |
| --- | --- | --- | --- | --- | --- |
| D1 Wall & Door | The conversation pane is one unbroken flat field and the send control is the only filled shape allowed on it; everything else is ink or hairline. | Fill becomes a monopoly, so contrast-by-fill can point at only one thing: the write. Hierarchy is carried by two ink tones and position. | 3 (calm, distinctive) | Pending vs proven differ by one small word, so the priority-1 fact has the *least* visual mass in the frame. Risk: the state word is invisible at thumbnail size. | **Runner-up** |
| D2 Ledger | Every message is a ruled ledger row (time, speaker, body, state) and the state column is always present, so a non-default state is a change in an existing column, never a new element. | Permanence makes the column ignorable at rest and detectable on change; the eye learns one tab stop. | 1 (truthfulness) | Four tab stops cannot survive 390px; long Hangul wraps ragged under fixed stops. Risk: reads as a log viewer. | **Rejected (R1)** |
| D3 The Ledge | One horizontal keyline, the ledge, crosses the whole frame; what the bridge has read back sits above it on the wall, what has only been submitted sits below it on the ground, and nothing crosses until it is read back. | Vertical position encodes epistemic state, so truth is a **place**, not a word. The only motion in the product is a message crossing the ledge upward, which is also the only moment 보냈습니다 may appear. | 1 (truthfulness), then 2 | The ground reserves 25–30% of height permanently: roughly 8–10 messages per 900px screen instead of 12–14. The list's ground is a nearly empty cream field. | **RECOMMENDED** |
| D4 Reading Room | The conversation is one book-measure column of prose, and everything that is not a message is marginalia at half size, so nothing ever interrupts a reading line. | A fixed measure of 34–38 Hangul per line with metadata pushed into margins; the pane reads like a printed page with a running head. | 2 (reading comfort) | Margins eat width; at 390px the marginalia collapse and the law bends. Rapid short group lines read oddly as prose. Risk: generators rarely render Korean serif. | Not selected |
| D5 Thumb Index | Room titles stand as vertical spines along the left edge like a dictionary thumb index, freeing the wall to nearly full width. | Vertical setting compresses the list to a strip, so the wall reaches ~90% of frame. | 3 | Cannot carry the required row content. | **Rejected (R2)** |

### How each candidate renders the honesty problem

| | Uncertain send | Unreadable room (공지) | Coverage limit |
| --- | --- | --- | --- |
| D1 | Self line sits in the column like any other; meta word reads 입력됨 in slate, becomes 보냈습니다 on read-back. No colour change. | Row stays, title in full ink, preview replaced by 읽을 수 없음 (키 없음). No dimming. | First line of the scroll in slate with a hairline beneath. |
| D3 | The message **rests on the ground** above the composer with 입력됨 and stays there, unchanged, until read back. The wall never holds an unproven line. Ambiguous-room candidates land here too, as a list, not a modal. | Row sits on the wall in full ink — the room's *existence* is proven — with 읽을 수 없음 (키 없음) as its preview. No dimming, no count. | First row of the message column, slate, hairline beneath, so the proven region is bracketed by two honest edges: coverage above, ledge below. |
| D4 | Marginal note 입력됨 in the right margin. | TOC entry stays with a marginal 읽을 수 없음. | The running head at the top of the page. |

## Recorded rejections

- **R1 — D2 Ledger.** The column law dies at 390px, so mobile would be a
  different design; fixed tab stops open ragged gaps under long Hangul, hurting
  priority 2; and a ruled grid with a permanent state word per row reads as a log
  viewer, which is the "metrics dashboard" anti-goal by another name.
- **R2 — D5 Thumb Index.** Cannot carry the fixed row content (preview, time,
  unread count) and therefore cannot say *why* 공지 is unreadable. Vertical Hangul
  is slow to scan in a list read many times a day, and the width it frees buys
  nothing because the message measure is capped for reading comfort anyway.
- **R3 — Postmarks.** Each message as a letter; read-back applies an inked stamp
  reading 보냈습니다, absence of a stamp being the pending state. Honest, but a
  stamp is ornament with a circular silhouette competing with the door for
  attention, the letter metaphor slows reading, and it drifts toward kitsch —
  which erodes the trust the tool exists to earn.
- **R4 — Spotlight.** Active region lit, rest dimmed. Dimming is a vignette over
  text surfaces (an excluded gradient), and it makes inactive rooms look
  *unavailable* — precisely the "uncertainty reads as error" failure.
- **R5 — Bubbles in the owner's palette.** Structurally a KakaoTalk clone
  whatever the colour; bubbles are fills that break the door's monopoly; and
  left/right alignment by author splits one reading column into two ragged ones.

## Approved distillation

- **Recommended direction: D3 The Ledge.** It is the only candidate in which
  priority 1 becomes geometry: the difference between "submitted" and "sent" is a
  position, legible at thumbnail size, in any language, before a word is read. It
  inherits D1's fill monopoly, and it gives every unresolved thing in the contract
  one home below the ledge — unverified sends, ambiguous candidates, the standing
  draft warning.
- Why the runner-up is weaker: D1's honesty lives in one word at meta size, so
  the frame's most important fact carries its least visual mass. It will not be
  seen in the image test and will not be noticed while skimming.
- Accepted trade-off: 25–30% of height is permanently the ground, so fewer
  messages are visible per screen, and the list's ground is a nearly empty cream
  field carrying only the brand-mark cat. A first-time viewer may read that
  emptiness as unfinished.
- Owner-selected direction: **pending** — see the open question at the foot.
- ADOPT translated into UI rules: one calm field = the wall; one accent = the
  send door only; accent-as-threshold = the door plus the doorway gap in the pane
  keyline at the active room row; tiny subject = the cat on the ledge; hard edges
  = flat fills and 1px seams; one shadow = the door's, onto the ground; keyline
  divider = #FAF6EE at 1px.
- REJECT translated into exclusions: enumerated inline in the `background` field
  so they reach the generator, not merely this document.
- **Invariants generation must not change:** the wall/ledge/ground split; yellow
  on the send door and nowhere else; oldest-first order; the coverage line as the
  first row of the column; 공지 listed in full ink rather than dimmed; the pending
  message below the ledge; Korean strings verbatim; no bubbles.
- **Variables this comparison may explore:** the design law itself (D3 vs D1).
  Content, viewport, palette and type stay fixed.
- Scope: `app`. Viewports 1440×900 and 390×844 on one canvas. Korean.
- Dark theme, recorded but **not rendered** in this concept: wall becomes deep
  rust, ground a darker terracotta-brown, the ledge a faint amber hairline, the
  door unchanged.

## Current six-field generation input

**Preservation review (performed by the session lead before recording):**

- `composition`, `lighting_color` and `background` were cross-read. All three
  describe the wall as the full-width field above the ledge and the ground as the
  full-width field below it, at the same extent. No region is double-claimed.
- Every named region is sized against something that bounds it — "left quarter of
  the width", "about 60% of the pane width", "about 72% of its height", door
  "about two text lines tall", cat "no taller than one line of text". No region is
  described by a word that fights its own bounds.
- The accent's job is singular and enforced by explicit negation: the block names
  unread numerals, the active row, the mention token, the quotation rule, the
  pending state and the mobile chevron as *not* yellow. This closes the observed
  failure where a second use broke the hierarchy the document had just defined.
- Shapes are named by silhouette, not category: the door is "an upright
  square-cornered rectangle taller than it is wide"; the cat is "side profile
  walking left to right, four legs and tail visible".
- The ornament says what it *is*: the door inset is "one thin line in darker
  yellow tracing a smaller upright rectangle inside it, set in by about a fifth of
  the door width".
- Differences from a previously approved direction: none; this is r1.
- **Held fixed and named in a field:** the two-frame canvas arrangement, the
  ledge's full-width continuity, the keyline's interruption at the active row, the
  cat's single placement, the absence of icons, and the light theme. Each is
  stated in a field rather than left to chance.
- Known inherited inconsistency: 개발 잡담 carries an unread count of 4 while also
  being the open room. This came from the brief's representative data, not from
  the author. Harmless in a concept; the contract will resolve it.

```json
{
  "subject": "UI concept for hinokami-kagura, a browser client for reading and replying to KakaoTalk conversations through a local bridge running on the owner's own machine. Audience: one technical owner catching up on missed conversation and occasionally replying. Scope app: the composed two-pane main screen, room list beside the open conversation, light theme. All UI text is Korean rendered as real, legible Hangul using exactly these strings. Room list, eight rows in this order, each with a title, a one-line last-message preview, a relative time, and a red unread badge with a white numeral inside it when nonzero: 개발 잡담 (preview 확인했습니다. 오후에 정리해서 공유하겠습니다., time 5분 전, unread 4, this is the open room, and its preview shows the last read-back message, not the pending one), 가족 (주말에 시간 되면 알려 줘, 1시간 전), 북클럽 (다음 모임 책은 투표로 정할게요, 어제), 점심 모임 (12시 반에 1층에서 만나요, 12분 전, unread 12), 스터디 (이번 주 자료 올렸습니다, 3일 전), 공지 (unreadable: title in full ink, not dimmed, its preview line reads 읽을 수 없음 (키 없음), time 어제, no count), 나와의 채팅 (장보기 목록: 우유, 달걀, 2시간 전), 알림 (정기 점검 안내, 지난주). Open conversation titled 개발 잡담, messages oldest-first, each as a small speaker-and-time line above a flat tail-less speech bubble holding the body text: 참여자 A 09:12 어제 배포 잘 끝났나요?; 참여자 B 09:15 quoting the previous line 어제 배포 잘 끝났나요? as an indented block with a one-pixel line on its left, then 네, 새벽에 문제 없이 끝났습니다.; 참여자 B 09:18 테스트 환경에서 로그인 후 첫 화면이 늦게 뜨는 현상이 있어서 원인을 확인하고 있습니다. 확인되면 다시 공유하겠습니다.; 참여자 A 09:20 @사용자 회의 자료 오늘 중으로 확인 부탁드립니다. with the token @사용자 in the heavier weight with a hairline underline; 나 09:31 확인했습니다. 오후에 정리해서 공유하겠습니다. with the meta word 보냈습니다. Above the oldest message, the coverage line 이 기기에 저장된 범위만 표시합니다. Below the ledge, on the conversation pane's ground: one pending message in the same bubble form 나 09:33 추가로 확인할 항목이 있으면 알려 주세요. with the meta word 입력됨; then the standing note 보내면 데스크톱 앱에 쓰고 있던 초안이 지워질 수 있습니다; then the composer, a single-line input with the placeholder 메시지 입력, and at its right end the send door labelled 보내기. The principal action is sending a reply: the only write in the contract, the only irreversible act, and the only element in warm yellow.",
  "medium": "A generated UI concept image, not implementation code: a flat, front-on screen presentation of a web app at native pixel scale with crisp vector-like edges, real legible Hangul set as actual interface type, flat colour fills and one-pixel lines throughout, no photographic treatment, no device bezel, no browser chrome, no perspective mockup, no texture.",
  "composition": "Canvas: two viewports side by side at the same pixel scale, top edges aligned, on a flat warm-white backdrop, each frame outlined by a one-pixel slate line: the desktop frame 1440x900 at left, the mobile frame 390x844 at right. Desktop: the room list occupies the left quarter of the width as its own flat cream field running the FULL height of the frame, from the top edge all the way down to the bottom edge, with no horizontal line crossing it and nothing below it; the open conversation occupies the remaining three quarters. A single vertical one-pixel warm-white keyline separates the list from the conversation and runs the full height of the frame, top edge to bottom edge; it is interrupted for the exact height of the active room row 개발 잡담, leaving a clearly visible gap at least one text line tall, so the list opens into the conversation like a doorway. Within the conversation pane only, one horizontal one-pixel warm-white line, the ledge, runs across that pane at about 72% of the frame height, from the vertical keyline to the right edge; it does not cross the list. Above the ledge is the blue wall; below it is the conversation pane's sand ground. The list has no title and no search field; rows begin after a top margin of one row height; each row is the title in ink at the left with the relative time in the second tone at the right end of the same line, then the preview in the second tone on a second line, and at the right end of that preview line, when the room has unread messages, a small solid vermilion-red badge: a rounded rectangle just wide enough for its digits with the count inside it in white; rows are separated by generous space rather than lines; the active row title is set in the heavier weight. Conversation: the room title 개발 잡담 in ink at the top of the wall; the coverage line in the second tone with a one-pixel line beneath it; then the messages in one left-aligned stack anchored to the ledge so the newest proven message sits just above it, at a measure of at most 60% of the pane width and never wider. Each turn is a small speaker-and-time line in the second tone, and beneath it the body text inside a flat speech bubble: a rectangle with gently rounded corners of a small even radius, no tail, no pointer, no outline, filled with one flat colour, its width hugging its text rather than spanning the measure. Bubbles from other people are aligned to the left edge of the measure; the signed-in user's bubbles (나) are the same shape in a different flat fill and are indented by one gutter, still left-aligned, never right-aligned and never mirrored. No avatars, no profile circles, no read ticks. Conversation ground, below the ledge, within the same measure: the pending message in the same bubble form with its 입력됨 meta word; then the standing draft note in the second tone as plain text with no bubble; then the composer, a single-line input drawn as a hairline underline spanning the measure with its placeholder text; at the right end of that line the send door. The send door is a rectangle with PERFECTLY SQUARE corners and no rounding whatsoever, standing upright and taller than a normal button: its height is about two and a half text lines, its width just wide enough for the three characters 보내기 with one character of padding each side, and its bottom edge aligned to the composer underline. The brand-mark cat is a tiny black cat in side profile walking left to right, four legs and tail visible, no taller than one line of text, standing on the ledge line where the ledge meets the vertical keyline. Mobile 390x844: the list is replaced by one header row with a small left-pointing chevron and the title 개발 잡담; the conversation fills the width, coverage line first, the same bubbles in the same order, anchored to a ledge at about 70% of the height that spans the full width of that frame; the ground below holds the pending bubble, the standing note, the input underline and the same square-cornered upright door at the right end; no cat on mobile. Density is low: no dashboard grid, no cards, no boxes around groups, no toolbars. This frame excludes the digest screen, the stream-reconnection UI and the connection or authorization screen.",
  "lighting_color": "Palette roles, all flat and matte: the conversation wall above the ledge is pale sky-blue plaster, #CBDDE9; the room list is its own field of warm limestone cream, #EFE7D9, filling that column top edge to bottom edge; the conversation pane's ground below the ledge is a deeper warm sand, #E3D7C0, clearly distinguishable from the list's lighter cream where the two meet at the bottom left, so the list and the ground read as two different materials separated by the vertical keyline. The ledge and the vertical keyline are one-pixel warm white, #FAF6EE, a seam between flat colours with no shadow on either side. Body ink is warm near-black, #2A2724; the second tone for speaker lines, times, previews, the coverage line, the state words and the standing note is slate, #4E5D69. Speech bubbles carry only these two flat fills and no others: other people's bubbles are warm white, #FAF6EE; the signed-in user's bubbles are pale sand, #F4EBDA, which stays lighter than the ground beneath it so a pending bubble is clearly visible sitting on the ground. Bubbles have no outline, no border, no shadow and no gradient. The send door is saturated warm yellow, #F3B41B, with one thin line in darker yellow, #C98E0E, tracing a smaller square-cornered upright rectangle inside it set in by about a fifth of the door width, and the label 보내기 in body ink inside that inset. The unread badge is solid vermilion red, #D8452F, a warm brick red taken from the reference handrail rather than a bright alert red, with its numeral in pure white, #FFFFFF; it appears only on room rows that have unread messages and on nothing else. The yellow has one job, the send door, and the red has one job, the unread count: bubbles, the active row, the mention token, the quotation rule, the pending state and the mobile chevron are rendered in ink tones, the two bubble fills and position only. Nothing else anywhere on the canvas is yellow, and nothing else anywhere is red: no red text, no red rules, no red error states, no red on the unreadable room. Contrast intent: body ink on both bubble fills is high contrast for long Hangul reading; the second tone is quieter but fully legible at small sizes; state words never change colour, only their wording and which side of the ledge they sit on. Lighting: a single unseen light from above left, evidenced only by one shadow in the whole image, a soft short shadow the door casts onto the sand ground toward its lower right; every other element including every bubble is evenly lit and shadowless; no gradient, no gloss, no reflection, no glow, no texture. Light theme only.",
  "mood": "Calm, honest, unhurried: a quiet tool that states exactly what it knows and gives what it does not yet know a place to wait rather than a warning. Type character: a quiet humanist Korean sans such as Pretendard, one weight for all bodies at a comfortable reading size with generous line height, the heavier weight used only for the active room title and the mention token @사용자, tabular figures for times; small Hangul stays crisp and fully legible. Detail level is low: one door inset line, one shadow, one tiny cat, and otherwise only text and one-pixel lines; no icons except the mobile back chevron, no badges, no avatars, no emoji, no stickers, no checkmarks or read ticks. Bubbles are quiet containers, not decoration: flat, tail-less, unoutlined, hugging their text. Emotional priorities in order: truthfulness of state, comfort reading long Korean text, calm and distinctiveness, speed of reply, feature breadth last. Uncertainty is an ordinary resting state below the ledge, not an alert: nothing red, nothing green, no exclamation marks, no warning triangles, no spinners; the unreadable room and the pending message look as settled as everything else. Not a KakaoTalk skin, not a dashboard.",
  "background": "The canvas backdrop behind the two frames is flat warm white with nothing drawn on it. Inside the desktop frame the environment is three flat fields: the cream room list running the full height at the left, and to the right of the vertical keyline the pale blue wall above the ledge with the sand ground below it. No wallpaper, no photograph, no scene. The only imagery anywhere is the brand-mark cat standing on the conversation ledge where it meets the vertical keyline; it appears nowhere else. Exclude: palm-frond shadows, drawn lamps, signage, wordmarks or lettering taken from any reference, device bezels, browser chrome, desk scenes, hands, illustrations, film grain, noise, paper or plaster texture, weathering, paint loss, rust streaks, gradients, vignettes, blur, glassmorphism, neumorphism, stacked or multiple drop shadows, diagonal panel edges, rounded pill shapes, bubble tails, bubble pointers, bubble outlines, right-aligned or mirrored message bubbles, KakaoTalk-style tailed bubbles, avatars, profile circles, stickers, emoji, search fields, filter chips, toolbars, sidebars beyond the room list, dashboards, charts, KakaoTalk yellow-brown bubble styling, any second yellow element, any rounding on the send door, any horizontal line crossing the room list, any token or key string, any real name or real message, and the digest, stream-reconnection and connection or authorization screens."
}
```

## Author's critique pass

Recorded verbatim from the S2 author, as the skill's separate critique step.

**What distinguishes this from the default messenger template.** A generic chat
UI does five things this direction refuses: it wraps every message in a filled
bubble and right-aligns the author's own (here: one left-aligned column,
play-script turns, no fills but the door); it marks delivery with coloured ticks
or a "읽음 1" caption (here: state is which side of a line you are on, and the wall
physically cannot contain an unproven message); it sprays the brand colour across
unread badges, mentions, links and the active row (here: yellow touches one
rectangle in the whole frame); it hides or greys out what it cannot read (here:
공지 stays at full ink with its reason stated); and it says nothing about the edge
of its own knowledge (here: the coverage line is the first row of the column). The
doorway gap in the pane keyline is the one flourish, and it costs zero fill and
zero colour.

**Where it is most likely to fail in generation.** Three places, in order of
likelihood. First, the pending zone: generators know "composer at the bottom" and
will collapse the ground into an ordinary input bar, drawing the pending message
inside the wall with a checkmark, which silently destroys the law. Second, accent
leak: unread counts and the active row are the two elements most often painted in
the accent colour by default, and either one breaks the door's monopoly. Third,
fine detail at small scale: the 1px doorway gap, the cat at one line height, and
the long Hangul body strings are all at the resolution where generators garble;
the mobile frame on a shared canvas compounds this.

## Compile and submission review

```sh
bun C:/Users/USER/.omo/skills/ulw-design/scripts/compile-prompt.ts \
  C:/Users/USER/WebstormProjects/hinokami-kagura/design/DIRECTION.md --scope app --json
```

- All drafting values replaced: yes. No `UNAPPROVED` strings remain.
- Compiled output reviewed against the approved direction and scope: see the
  execution record in `design/SEEDS.md`.
- Pending: owner selection of D3, and whether D1 is worth one comparison render.
