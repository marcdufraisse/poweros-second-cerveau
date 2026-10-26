---
name: motion-graphics
description: Agent 3 of the video editing pipeline. Adds tiered motion-graphic cards (tier-1 full-screen takeovers for theses/stats/overviews, tier-2 glass lower-thirds and labels) over a clean talking-head edit, pulling distinct templates from the style-library card pool. Use after cut-silences + cut-mistakes, when asked to add motion graphics, beats, callouts, lower-thirds, stat cards, section takeovers, or "make it look edited / Vox-style / premium". Review-gated: proposes a beat plan from the transcript, you approve + write the on-card text, then it selects cards from the library and assembles one render-ready index.html. Requires a word-level transcript + the clean video.
---

# Motion Graphics / Tiered Cards (Pipeline Agent 3)

Third step of the automated edit, run after **cut-silences** and **cut-mistakes**. It layers motion-graphic *beats* over the clean talking-head video so the result reads as hand-edited: full-screen takeovers for theses/stats/section markers (tier 1) and glass lower-thirds / margin labels that keep the speaker visible (tier 2).

Beats are pulled from the **style-library** card pool (`style-library/registry.json`), not hand-authored per video. Each purpose (section / stat / overview / lower-third / label) is a deep pool of genuinely distinct treatments, so the same kind of beat looks fresh from video to video. See `MOTION_PHILOSOPHY.md` for the aesthetic bar and the two finished styles (`vox-explainer`, `kallaway`).

Deciding **where** a beat goes and **what text** it carries is judgment, not a formula — the same as cut-mistakes. So this agent is **review-gated**: a mechanical pass proposes candidates, you (and the user) refine the plan and write the on-card copy, then selection + assembly run on the approved plan.

## When to use

- "add motion graphics / beats / callouts", "add lower-thirds", "add stat cards", "section takeovers"
- "make it look edited", "Vox-style graphics", "premium / Apple-style motion graphics"
- As the third stage of the master edit workflow, on cut-mistakes' clean output.

## Prerequisites

- A re-timed word-level transcript on the **clean** timeline — normally Agent 2's `<stem>.mistakes-transcript.json` (or Agent 1's `<stem>.silence-transcript.json` if no mistakes were cut).
- The clean video (Agent 2's `edited-clean.mp4`, or Agent 1's silenced cut).
- A target **style** id from the library (`vox-explainer` or `kallaway`). Ask the user which look they want; read that style's `DESIGN.md` before writing copy.
- Read `MOTION_PHILOSOPHY.md` once this session and the chosen style's `DESIGN.md`.

## The four-part flow

### 1. Detect beat candidates (mechanical)

```bash
node .claude/skills/motion-graphics/scripts/detect-beats.mjs \
  <mistakes-transcript.json> --out-dir video-projects/<slug>/assets
```

Writes:

- `<stem>.beat-candidates.json` — structured candidates: `tier` (1|2), `purpose` (section|stat|overview|lower-third|label), `anchor` (verbatim phrase the beat enters on), `start`/`duration` (seconds), `confidence`, `context` (surrounding transcript), and a `suggest` text seed.
- `<stem>.beat-candidates.md` — readable proposal grouped by time.

It flags: **stats** (numbers, %, $, "X times", "X percent", years), **section transitions** (cue phrases: "first/second/next", "here's the thing", "the bottleneck", "so the question is"), **overviews** (enumerations / "in this video" / list framing), and **pacing gaps** (stretches over ~30s with no beat → a tier-2 fill candidate). It does NOT decide final copy — that's the review gate.

### 2. Review + write the plan (the gate — REQUIRED)

Read the candidates in context. This is where the judgment lives — read `hyperframes-video-beats` for placement/pacing heuristics and the chosen style's `DESIGN.md` for voice. Decide:

- which candidates become real beats (drop low-value ones — don't add a graphic just to fill a gap),
- the final `tier` + `purpose`,
- the timing (start the beat ~0.2-0.6s **before** the anchor word; hold across the whole topic span),
- the **slot text** (glance-readable noun phrases; numbers only when meaningful; one idea per card; `<em>…</em>` allowed inside a slot value for accent emphasis).

Slot names are per-purpose and declared in the registry per card (e.g. section → `kicker`, `headline`, `source`; stat → `value`, `label`, …). Write the approved plan:

```json
{
  "style": "vox-explainer",
  "video": "video-projects/<slug>/assets/edited-clean.mp4",
  "width": 1920, "height": 1080, "fps": 30,
  "seed": "<slug>",
  "beats": [
    { "tier": 1, "purpose": "section", "start": 4.2, "duration": 7,
      "anchor": "the real bottleneck",
      "slots": { "kicker": "CHAPTER 01", "headline": "The real <em>bottleneck</em>", "source": "" } },
    { "tier": 2, "purpose": "lower-third", "start": 31.0, "duration": 18,
      "anchor": "skills plus workflows",
      "slots": { "title": "The bridge", "subtitle": "Skills + Workflows = 40 hrs saved" } }
  ]
}
```

`start`/`duration` are seconds on the clean-video timeline. Pad slots you don't want to show with `""`. Carry `anchor` through so Gate 0 (`validate-beat-sync.mjs`) can check sync.

### 3. Select cards from the library

```bash
node .claude/skills/motion-graphics/scripts/select-cards.mjs \
  approved-plan.json --registry style-library/registry.json \
  --out approved-plan.cards.json
```

For each beat it filters the registry by `style` + `tier` + `purpose`, then picks a card with a **seeded rotation** (keyed to `seed`) that avoids repeating the same card id back-to-back within a purpose, so a video never reuses the same treatment twice in a row. Writes the plan enriched with a `card` file + `cardId` per beat. Warns if a beat's slot keys aren't all present on the chosen card (so you can rename a slot or pick a card that fits). You can pin a card by adding `"cardId": "vox-explainer.t1.stat.bar"` to a beat — selection respects it.

### 4. Assemble the render-ready composition

```bash
node .claude/skills/motion-graphics/scripts/build-beats.mjs \
  approved-plan.cards.json --out video-projects/<slug>/index.html
```

Builds ONE `index.html` (the reliable **inline** pattern — NOT `data-composition-src` sub-comps, which 404 on `../tokens.css` and render unstyled). For each beat it: inlines the style's `tokens.css` `:root`, copies the card's `<style>` + root-DOM + timeline `<script>`, renames the card's `data-composition-id` to a unique per-beat id (string-replace, so CSS selectors + the `__timelines` key move with it), strips `paused:true` from the child timeline, fills `data-slot` text, and nests the child timeline into one master timeline that fades each beat in/out. The bg video mounts as `<video muted>` (track 0) with a sibling `<audio>` (track 1), both pointing at the clean mp4. The master is the only timeline on `window.__timelines["<slug>"]`; child timelines live on a private `window.__beatTimelines`.

Then lint + render from inside the project folder (see the Render Contract + CLI note in CLAUDE.md):

```bash
cd video-projects/<slug>
node ~/.npm/_npx/702923228c2ce1e6/node_modules/hyperframes/dist/cli.js lint
node ~/.npm/_npx/702923228c2ce1e6/node_modules/hyperframes/dist/cli.js render \
  --quality draft --output renders/draft.mp4
```

(The published CLI fails to install on Node 25 because `sharp` won't build; run the cached 0.4.32 binary directly — it lints/renders fine. See the `agent3-render-pipeline` memory.)

## Verifying

Follow the Authoring Loop gates in CLAUDE.md: **Gate 0** transcript-sync (`node scripts/validate-beat-sync.mjs`), **Gate 1** live Studio preview, draft render, **frame-by-frame visual verification** (extract one hero frame per beat, `Read` each PNG — text legible, face not covered by tier-2, transition lands on the anchor word), the `MOTION_PHILOSOPHY.md` pre-flight, **Gate 2** rendered MP4 preview on `localhost:8080`, then `--quality standard`.

Fast check without a 5-minute render: headless Chrome on a `_shot.html` copy that seeks the master timeline to each beat time and `--screenshot`s it (bg video may be black — fine for checking overlays). See the `agent3-render-pipeline` memory for the recipe.

## Gotchas (cost a render each in testing — see `agent3-render-pipeline`)

1. **Nested child timelines must NOT be `paused`.** The assembler strips `{paused:true}` from each card's timeline; a paused child never scrubs inside the master, leaving every `.from()` element stuck at `autoAlpha:0` (tier-1 background shows, all text invisible). The master itself stays paused — the framework drives it.
2. **Some cards bake numbers / per-word spans, ignoring slots.** A few stat cards hardcode count-up targets; `t1-section-kinetic` splits its headline into per-word ids that a whole-headline slot-fill destroys; `t2-lb-price` keeps the value in fixed spans, not a slot. For these, either pick a sibling treatment whose number/headline lives in a real `data-slot`, or use the per-beat `raw` override (`"raw": [["selector","text"], …]`) to set specific elements. Most section/label/overview cards animate `.headline` / leaf slots as wholes and fill cleanly.

## Notes

- A clean delivery may not need many beats — quality over coverage. Tier-1 takeovers are occasional punctuation; tier-2 cards carry the steady support.
- tier-2 cards are transparent overlays; never let one cover the speaker's face (they're authored for the lower third/half).
- The pool grows over time. Adding styles or treatments is library work (see the `style-library-architecture` memory), independent of this skill.
