---
name: verify-cuts
description: The passing agent (Agent 2.5) of the video editing pipeline. A verification-only step run after cut-silences and cut-mistakes have rendered — it re-transcribes the rendered video and makes AT LEAST THREE full passes through the script/transcript to verify every silence and every approved cut actually landed. Use when asked to verify an edit, run the passing agent, check the cuts, confirm silences are gone, or sign off a clean render. It never edits video itself; failures route back to cut-silences / cut-mistakes.
---

# Verify Cuts — the Passing Agent (Pipeline Agent 2.5)

Verification only. After Agents 1 and 2 render the clean video, this agent
proves the render matches the plan before anything moves downstream (motion
graphics, b-roll, delivery). It works from a **fresh re-transcription of the
rendered file** — never from the re-timed transcripts, which only say what
*should* have happened.

**The three-pass rule (minimum):** every sign-off requires at least three
complete passes through the script, each hunting something different. If any
pass finds a problem that leads to a fix and re-render, the count resets —
re-transcribe and run all three passes again from the top. Never sign off on
fewer than three passes over the current render.

## The three passes

| Pass | Hunts | Mechanical check |
| --- | --- | --- |
| 1 — Silence sweep | Residual dead air: any inter-word gap over threshold, head/tail padding | gap scan on the fresh transcript |
| 2 — Cuts sweep | Every approved cut's `removes` text gone (phrase counts), no residual stutters/false starts | token-level phrase counts + repeat scan |
| 3 — Ledger sweep | EDL math self-consistent, EDL chain continuous, rendered duration matches expectation, script coverage intact | EDL arithmetic + ffprobe + script match |

## Flow

### 1. Re-transcribe the rendered video (required)

```bash
node scripts/transcribe-whisper.mjs video-projects/<slug>/assets/edited-clean.mp4
# -> edited-clean.json  (word timestamps of what was ACTUALLY rendered)
```

### 2. Run the three mechanical passes

```bash
node .claude/skills/verify-cuts/scripts/verify-passes.mjs \
  video-projects/<slug>/assets/edited-clean.json \
  --video video-projects/<slug>/assets/edited-clean.mp4 \
  --edl   video-projects/<slug>/assets/<stem>.silence-edl.json \
  --edl   video-projects/<slug>/assets/<stem>.mistakes-edl.json \
  --candidates video-projects/<slug>/assets/<stem>.cut-candidates.json \
  --cuts       video-projects/<slug>/assets/approved-cuts.json \
  --script     video-projects/<slug>/assets/script.txt \
  --report     video-projects/<slug>/assets/verify-report.md
```

Order the `--edl` flags in pipeline order (silence first, then mistakes) —
the chain-continuity check depends on it. `--script` is optional; everything
else should be passed whenever the file exists. Exit 0 = PASS, 1 = FAIL.

### 3. Read the report — then read the transcript (judgment layer)

The script cannot judge context. After it runs, **read the fresh transcript
top to bottom yourself** during each sweep:

- Pass 1: at every reported gap, is it a real hole or an intentional beat?
- Pass 2: every WARN'd repeat — emphasis/rhetoric ("never, never") stays;
  flubs go back to cut-mistakes. Every phrase-check FAIL — confirm the botched
  take really survived before blaming the render (watch for takes that share
  words; token-level matching already kills the substring false alarm, e.g.
  "how will we pro" vs "prove").
- Pass 3: script-coverage WARNs are usually paraphrase, not missing content —
  confirm the *meaning* is present, and confirm no meta-speech survived
  ("let me do that again", "didn't click play", teleprompter chatter = expect
  0 occurrences; add them as `--phrases` checks).

### 4. Verdict

- **All three passes clean** → report PASS with the numbers (residual gaps: 0,
  phrase checks: n/n, duration drift: x.xx s) and hand off downstream.
- **Anything failed** → do NOT fix here. Route: residual silence →
  `cut-silences/scripts/patch-residual-silences.mjs` (source-side silencedetect
  patch; transcript-level fixes miss stretched-token dead air); surviving
  flub/retake → cut-mistakes stage 4 (`find-retakes.mjs` + `retake-pass.mjs`);
  duration/chain mismatch → investigate before re-rendering (see below). After
  the fix renders, **restart at step 1** — fresh transcription, all three
  passes again.

### Duration-drift FAILs: prove mechanical vs real

A rendered duration a bit over the EDL expectation is usually concat
frame-padding: ~5.4ms per join, so ≈0.9s over 160 keep ranges. Prove it before
accepting: match a handful of uniquely-occurring words between the fresh
transcript and the raw source transcript, map each source position to its
expected edited time via the union EDL, and plot the offset. **Linear growth
across the video (e.g. 0.2s → 0.5s → 0.9s) = benign padding; a single jump =
real stray content at that spot — go find it.** Never "fix" the EDL number to
match the render.

### After the first PASS: the retake read

A silence/flub-clean render is not a finished edit. Run cut-mistakes stage 4
(the editorial retake read) on the fresh transcript before final sign-off —
re-record-heavy speakers leave dozens of repeated sentences that the candidate
detector cannot see, and this agent's stutter WARNs only surface adjacent
repeats, not re-recorded lines.

## Options (verify-passes.mjs)

| Flag | Default | Meaning |
| --- | --- | --- |
| `--video <path>` | — | Rendered file; enables the ffprobe duration check |
| `--edl <path>` | — | Repeatable, in pipeline order; enables the ledger pass |
| `--candidates <path>` + `--cuts <path>` | — | Auto-derives "this text must be gone" phrase checks from the approved cuts |
| `--phrases <path>` | — | Manual checks: `[{ "phrase": "let me do that again", "expect": 0 }, { "phrase": "ask me how I know", "expect": 1 }]` |
| `--script <path>` | — | Script .txt for the coverage check (WARNs only) |
| `--gap <s>` | `0.75` | Max allowed residual inter-word pause (cut-silences `--gap` + slack) |
| `--head-max <s>` / `--tail-max <s>` | `0.6` / `0.9` | Max allowed head/tail dead air |
| `--report <path>` | — | Write the markdown report |

## Notes

- If cut-silences ran with a non-default `--gap`, set this agent's `--gap` to
  that value + 0.2 slack, or every kept pause flags.
- Retaken lines should appear **exactly once** — add them as `--phrases`
  entries with `expect: 1`.
- A combined single-pass edit (union EDL, like a union-EDL builder) verifies
  the same way: pass the one union EDL and skip chain continuity.
- This agent's PASS is the precondition for Agent 3 (motion-graphics) and for
  delivery. Log the report path when chaining in the master workflow.
