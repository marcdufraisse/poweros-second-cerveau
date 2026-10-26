---
name: cut-silences
description: Agent 1 of the video editing pipeline. Removes silences and dead air from a talking-head recording. Use when asked to cut silences, trim pauses, remove dead air / gaps, or tighten the pacing of a raw video, given a word-level transcript. Produces an edit list (EDL), a re-timed transcript for downstream agents, and optionally the cut video via ffmpeg. Does NOT cut mistakes, repeats, or false starts — that is the cut-mistakes agent.
---

# Cut Silences (Pipeline Agent 1)

First step of the automated edit. Takes a raw recording + its word-level transcript and removes **only silence**: dead air before the first word and after the last word, plus inter-word pauses longer than a threshold (trimmed down to a natural breath, never a hard zero-gap). It leaves the speaker's words untouched — false starts, retakes, and stutters are the **cut-mistakes** agent's job (Agent 2).

This agent is deterministic and transcript-driven, so its output (`*.silence-transcript.json`) feeds cleanly into the next agents and the beat-sync validator.

## When to use

- "cut the silences", "trim the pauses", "remove dead air", "tighten the pacing"
- As the first stage of the master edit workflow, right after transcription.

## Prerequisites

A word-level transcript JSON. Either the whisper.cpp / ElevenLabs Scribe shape
(`{ words: [{ text, start, end, type }], audio_duration_secs }`) or a generic
`{ words: [{ text, start, end }] }`. Generate one with the workspace transcriber:

```bash
node scripts/transcribe-whisper.mjs path/to/raw.mp4       # -> path/to/raw.json
```

**MANDATORY pre-pass — clamp stretched tokens.** Scribe stretches word tokens
across silent screen-recording waits (observed from 1.4s up to 115s), and since
this agent only trims *between* words, every stretched token hides real dead
air that then survives the render (a 39-min raw take had 14 of them). Always
run the clamp before planning:

```bash
node .claude/skills/cut-silences/scripts/clamp-stretched-tokens.mjs \
  <transcript.json> <source-video>        # add --dry to preview
```

It silencedetects the whole source once (-30dB, d=0.6), clamps any token
> 1.2s whose span overlaps a detected silence (end pulled to silence start /
start pushed to silence end), leaves legit long words (spoken URLs) alone, and
writes in place with an `.orig.json` backup. Tune `--min` / `--noise` /
`--sil-min` for high-noise-floor recordings.

## Usage

```bash
# 1) Plan only — compute the cut, write EDL + re-timed transcript (no video touched)
node .claude/skills/cut-silences/scripts/cut-silences.mjs <transcript.json> \
  --out-dir video-projects/<slug>/assets

# 2) With a video — also write the ffmpeg command (still does not render yet)
node .claude/skills/cut-silences/scripts/cut-silences.mjs <transcript.json> \
  --video video-projects/<slug>/assets/raw.mp4 --out-dir video-projects/<slug>/assets

# 3) Render the cut video (local ffmpeg, re-encode, A/V kept in sync)
#    add --apply to actually run ffmpeg
node .claude/skills/cut-silences/scripts/cut-silences.mjs <transcript.json> \
  --video video-projects/<slug>/assets/raw.mp4 --apply \
  --output video-projects/<slug>/assets/edited-silenced.mp4
```

### Options

| Flag | Default | Meaning |
| --- | --- | --- |
| `--video <path>` | — | Source video; enables the ffmpeg command / render |
| `--out-dir <dir>` | next to transcript | Where outputs are written |
| `--output <path>` | `<video-stem>.silenced.mp4` | Cut-video path |
| `--gap <s>` | `0.55` | Minimum pause treated as trimmable silence |
| `--head-pad <s>` | `0.22` | Silence kept before the first word |
| `--tail-pad <s>` | `0.34` | Silence kept after the last word |
| `--apply` | off | Actually run ffmpeg to render the cut |

## How it decides (the silence rules)

- Pauses below `--gap` (0.55s) are left alone — natural speech rhythm.
- For a trimmed pause, a **natural breath is kept**, scaled by context: `0.24s` for long pauses (≥2s), `0.20s` after a sentence ender (`. ! ?`), `0.14s` otherwise. The kept breath is biased slightly toward the end of the previous phrase.
- Head/tail dead air is trimmed to `--head-pad` / `--tail-pad`.
- Delete ranges are merged; keep ranges are the complement. The cut is rendered with an ffmpeg `trim`/`atrim` + `concat` filtergraph (written to a `*.silence-filter.txt` script and passed via `-/filter_complex`), so video and audio stay in sync.

## Outputs (written to `--out-dir`)

| File | Purpose |
| --- | --- |
| `<stem>.silence-edl.json` | Keep/delete ranges, durations, params — the edit list |
| `<stem>.silence-transcript.json` | Words re-timed onto the edited timeline (feeds Agent 2 + beats) |
| `<stem>.silence-decisions.md` | Human-readable summary + largest pauses trimmed |
| `<stem>.silence-filter.txt` | The ffmpeg filtergraph (only with `--video`) |
| `<video-stem>.silenced.mp4` | The cut video (only with `--apply`) |

The JSON summary printed to stdout includes `removed`, `removedPct`, range counts, and output paths — useful for the master workflow to log and chain.

## Tuning notes

- Talking-head YouTube default (`--gap 0.55`) removes roughly 15-20% of a typical raw take as pure silence. Lower `--gap` for a punchier, faster cut; raise it to preserve more natural breathing room.
- If a cut feels too aggressive at sentence boundaries, raise the sentence-break breath, or raise `--gap`.

## If verify finds residual dead air (post-render patch)

When the verify-cuts silence sweep FAILs on a rendered cut (stretched tokens
the clamp's threshold missed, or transcript jitter), do NOT fix from the
rendered timeline — concat accrues ~5.4ms/join frame padding (≈0.9s over 160
joins) that would shift cuts into speech. Patch from source-audio ground truth:

```bash
node .claude/skills/cut-silences/scripts/patch-residual-silences.mjs \
  <union-edl.json> <source-video> <output.mp4> [--flubs flubs.json] [--apply]
```

It silencedetects the SOURCE, trims any keep range still holding >= 0.6s of
continuous silence down to a ~0.22s breath (0.30s tail pad on the last range),
optionally folds in word-anchored flub cuts (`[{start, end, reason}]` in source
seconds), updates the union EDL in place, and re-renders from the original in
one encode. Dry-run first (no `--apply` = nothing written). The union EDL comes
from cut-mistakes' `build-combined-cut.mjs`. After the patch: re-transcribe and
restart verify-cuts from pass 1 (the three-pass count resets).

## Hand-off to the next agent

Pass `<stem>.silence-transcript.json` (and the `silenced.mp4` if rendered) to the **cut-mistakes** agent. Because timestamps are already on the edited timeline, downstream beat timing and `scripts/validate-beat-sync.mjs` work without further adjustment. Keep the `<stem>.silence-edl.json` around — the **verify-cuts** passing agent needs it for its ledger sweep after the final render.
