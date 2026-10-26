---
name: cut-mistakes
description: Agent 2 of the video editing pipeline. Finds and removes spoken mistakes — stutters, repeated words, false starts, and retakes (re-recorded lines) — from a talking-head recording. Use after cut-silences, when asked to cut mistakes, remove stutters / repeats / filler restarts, clean up flubs, or keep the best take. Works review-gated: it proposes every cut with context and a reason for approval, then renders only the approved cuts via ffmpeg. Requires a word-level transcript.
---

# Cut Mistakes & Repeats (Pipeline Agent 2)

Second step of the automated edit, run after **cut-silences**. It removes the things a human editor cuts on a second pass: stutters ("the the", "I- I-"), immediately repeated words, false starts (an abandoned phrase that restarts), and retakes (a line re-recorded — keep the clean take, drop the botched one).

Deciding what counts as a mistake is **judgment, not a formula** — emphatic repetition ("never, never") and rhetorical doubling ("the first piece is, is this…") look identical to a stutter mechanically. So this agent is **review-gated by default**: it surfaces candidates with full context; the agent (and the user) decide; only approved cuts are rendered.

## When to use

- "cut the mistakes", "remove stutters / repeats", "clean up the flubs", "keep the best take", "cut false starts"
- As the second stage of the master edit workflow, on cut-silences' output.

## The four-part flow

### 1. Find candidates (mechanical)

```bash
node .claude/skills/cut-mistakes/scripts/find-cut-candidates.mjs \
  <silence-transcript.json> --out-dir video-projects/<slug>/assets
```

Input is normally Agent 1's `<stem>.silence-transcript.json`, so cuts land on the already-silenced timeline. Writes:

- `<stem>.cut-candidates.json` — structured candidates (type, confidence, proposed `cut` range, `removes`/`keeps` text, context, recommendation)
- `<stem>.cut-candidates.md` — readable proposal

Candidate types: `stutter` (immediate word repeat), `retake` (duplicate/near-duplicate segment via Jaccard similarity), `false_start` (short abandoned phrase that restarts).

### 2. Review (the gate — REQUIRED)

Read each candidate **in context** and decide keep-or-cut. The mechanical detector cannot tell intentional emphasis/rhetoric from a real flub, so do not trust `recommend` blindly — read `removes` + `context`. Common false positives: emphatic repetition ("it's never, never hands-off"), copula-then-question ("the piece is, is this…"), listing.

Present the candidates to the user with a recommendation per item; collect approvals. Write the approved cuts to a file:

```json
{ "cuts": [ { "start": 100.93, "end": 101.06, "reason": "I- false start" }, ... ] }
```

(`start`/`end` in seconds on the input transcript/video timeline. You can widen a candidate's range — e.g. for a retake, cut from the botched take's start to the clean restart.)

### 3. Apply approved cuts

**Preferred: single-pass combined cut** (silences + mistakes in ONE encode from
the original source — no generational quality loss, and it emits the union EDL
every later stage needs):

```bash
node .claude/skills/cut-mistakes/scripts/build-combined-cut.mjs \
  <stem>.silence-edl.json approved-cuts.json <source-video> \
  video-projects/<slug>/assets/clean.mp4 --apply
```

Maps the edited-timeline cuts back to source coords via the silence EDL keep
ranges, unions with the silence deletes, bridges sub-0.3s keep slivers
(MIN_KEEP — they flash 2-4 frames otherwise), and writes
`clean.union-edl.json` + `clean.cutlist.md` + the filtergraph. Still run
`apply-cuts.mjs` WITHOUT `--apply` first — its dry run produces the
`mistakes-transcript.json` that downstream agents and the beat validator need:

```bash
node .claude/skills/cut-mistakes/scripts/apply-cuts.mjs \
  <silence-transcript.json> --cuts approved-cuts.json --out-dir <assets>
```

(The two-render path — `apply-cuts.mjs --apply` on an already-rendered
`edited-silenced.mp4` — still works but double-encodes; use it only when the
silenced render already exists and re-rendering from source is impractical.)

### 4. The retake read (MANDATORY — after the first verified render)

The mechanical detector's segment-level similarity catches only a fraction of
real retakes — **on a re-record-heavy raw take it found 3 of ~60**. Speakers
who re-record sentences mid-paragraph (small-gap restarts, corrected facts,
whole re-done walkthroughs) defeat it. After the first render passes (or while
verifying it), do an editorial pass:

1. Re-transcribe the rendered cut (fresh transcript = what a viewer hears).
2. `node .claude/skills/cut-mistakes/scripts/find-retakes.mjs <fresh.json>` —
   writes a timestamped sentence dump and prints similar-sentence pairs
   (same-opening 4-gram OR jaccard >= 0.45 within an 8-sentence window;
   restarts almost always reuse their opening words).
3. **READ the entire sentence dump top to bottom.** The SIM list is an aid;
   mid-sentence restarts don't pair as sentences and only the read catches
   them. For each repeat pick the best take — usually the last, and prefer
   corrected facts (numbers, UI paths, product names). Honor spoken editing
   instructions ("delete that part"). Keep rhetorical repetition.
4. Write a specs file — each cut is the exact words to remove plus a `before`
   keep-anchor (the words that must immediately follow), which disambiguates
   duplicated phrases (which is what retakes are):
   ```json
   { "specs":  [{ "t": 620, "cut": "so lets jump so lets jump into the actual video",
                  "before": "so lets jump into blender" }],
     "manual": [{ "start": 1179.89, "end": 1180.48, "label": "doubled word raw Scribe merged" }] }
   ```
5. Dry-run and **read the printed raw-text line for every cut** — that table is
   the review gate:
   ```bash
   node .claude/skills/cut-mistakes/scripts/retake-pass.mjs \
     <fresh.json> <raw-transcript.json> <union-edl.json> <source-video> \
     video-projects/<slug>/assets/clean.mp4 --specs retake-specs.json [--apply]
   ```
   It aligns fresh words to the raw source transcript for source coords (never
   cut via the rendered timeline — concat frame-padding drift), subtracts from
   the union EDL, and re-renders from source in one encode. A spec that fails
   to locate exits non-zero and nothing is written without `--apply`.
6. Where raw/fresh tokenization diverges (raw Scribe merged a doubled word into
   one stretched token), place the cut in `manual` — delta-map from a nearby
   anchor word inside the same keep segment (timeline is continuous there),
   leaving >= 60ms before the kept word's onset.
7. Re-transcribe and run verify-cuts again from pass 1, with phrase checks:
   every cut phrase expect 0, every kept take expect 1.

## Reviewing the result

Use the shared review tool to eyeball the cuts and spot-check boundaries:

```bash
node scripts/build-edl-review.mjs <stem>.mistakes-edl.json \
  --original video-projects/<slug>/assets/edited-silenced.mp4 \
  --edited   video-projects/<slug>/assets/edited-clean.mp4 \
  --output   video-projects/<slug>/assets/mistakes-review.html
npx serve . -p 8080 -n
```

## Notes

- A very clean delivery may yield few or zero real cuts — that's a valid outcome; don't cut natural speech to hit a quota.
- Cuts between two spoken words are hard joins. They're usually clean for stutters/false starts; for tighter audio a 20-30ms fade can be added later.
- After rendering, run the **verify-cuts** passing agent (Agent 2.5): it re-transcribes the clean video and makes at least three verification passes (silence sweep, cuts sweep, ledger sweep) before anything moves downstream. Only on its PASS hand the `mistakes-transcript.json` + the clean video to **Agent 3 (motion graphics / tiered cards)**.
