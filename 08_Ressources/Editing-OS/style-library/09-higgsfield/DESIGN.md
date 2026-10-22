# Higgsfield — Design Spec

> Source of truth: the reference frames in `references/`, pulled from three Higgsfield
> creator-tutorial videos (3rDs6FhFoUQ "Ultra-Realistic AI Ads", wU_bmWb6bhg "Faceless
> Channel", CHHH8tNioSc "Viral AI Short Film"). Everything below is derived from them.

## Feel

Modern AI-tool creator energy. One neon-lime accent carries the whole identity across
three different set moods (pale steel-blue studio, dark moody den, warm workshop).
Graphics feel like the product UI escaped into the room: frosted glass panels floating
in perspective beside the speaker, LED dot-matrix "boot" cards, staged text reveals
where words enter grey and flip to lime. Fast but never frantic — text SNAPS, panels
DRIFT. Confident, techy, a little playful.

## Palette

| Token | Hex | Role |
| --- | --- | --- |
| `--lime` | `#D6FD03` | THE accent. Emphasis words, active states, kinetic type, tags. Sampled from refs. |
| `--lime-soft` | `#D6FF60` | Lime on frosted glass (full lime vibrates on light panels). |
| `--navy` | `#02060F` | tier1 canvas: step / thesis / stat cards. Near-black blue, never pure black. |
| `--olive` | `#0A1400` | tier1 canvas: stage/boot cards. Very dark green + bokeh blobs. |
| `--cream` | `#F7F5C9` | tier1 canvas: money/kinetic typography cards. Pale butter. |
| `--charcoal` | `#17191C` | Text on cream. |
| `--grey-pre` | `rgba(255,255,255,0.38)` | The "pre-reveal" text state before the flip. |
| `--money-deep` → `--money-lite` | `#3F6212` → `#A3CC1A` | Vertical gradient for stat numbers on cream. |
| `--den` | `#19232A` | tier2 pill/PIP chrome tone. |
| `--warm-glow` | `#3A1E08` | Warm creep in a bottom corner of navy cards (the practical-light spill). |

Rules: lime is the only saturated color anywhere. Backgrounds are one of exactly three
canvases (navy / olive / cream) — no other takeover background exists. White text on
dark, charcoal text on cream, lime for the one emphasized thing.

## Typography

- **Display:** Inter Tight 800/900, ALL CAPS, tight tracking (`--track-caps`). Step
  titles run mega (220px single word). Kinetic floats run 54–84px.
- **Eyebrow:** small caps, wide-tracked (`--track-eyebrow`, 0.34em) — "STEP 1:",
  "STAGE 2" — always above the big word, always subordinate.
- **Body:** Inter 400–600, sentence case, only inside documents/panels.
- **Mono:** JetBrains Mono for pills, tags, and anything UI-flavored ("CREATING THE
  ASSETS", location tags, prompt pills).
- Kinetic float text gets a dark rim (`--kinetic-shadow`) and a slight 3D perspective
  tilt (`--kinetic-tilt`) so it sits "in the room", not on the screen.

## Layout

- **tier1** — three canvases, all full-bleed opaque:
  - *Navy*: subtle diagonal streaks (`--streaks`) + warm glow creeping into the
    bottom-right corner (`--warm-creep`) + vignette. Content centered.
  - *Olive*: bokeh blobs (`--olive-bokeh`) + LED dot grid (`--dot-grid`). Content centered.
  - *Cream*: flat pale butter, charcoal type, content centered with generous air.
- **tier2** — transparent; graphics anchor beside the speaker's head (right side
  default, `--kinetic-tilt-l` variants for left). Never cover the center face zone
  (roughly x 620–1300, y 80–900). Lower-frame tags stay under y 930.
- Glass panels are tilted in perspective (`--glass-tilt`) with big soft shadows and
  rounded corners (`--radius`).
- Speaker PIP (screen-recording sections): rounded rect (`--radius-pip`), bottom-right,
  ~300px wide, with a lime prompt pill beside it.

## Motion

Two speeds, always:

1. **SNAP** — text and panels enter fast (`expo.out`, ~0.45s): slide 30–60px + fade.
   Icon props and pills POP (`back.out(1.9)`).
2. **DRIFT** — while a glass panel is alive it floats slowly (`sine.inOut`, ~6s cycle,
   ±10px translate + ±1.5deg rotate). Text never drifts.

Signature moves:

- **The flip** — text enters at `--grey-pre`, snaps to white/lime (`--dur-flip`,
  `power2.inOut`) as the next element arrives. Sequential items (lists, steps) each
  enter grey and flip when their successor appears. Never flip two things at once.
- **Dot-matrix resolve** — stage titles materialize from a sparse LED-dot shimmer to
  solid white with a faint lime glow (opacity ramp + blur 8→0 + letter stagger).
- **Word-stagger montage** (cream cards): per-word tracking reveals, one mid-sentence
  word scale-emphasized, lime confetti shards flying, motion-blur ghost trails.
- **Typed pill** — mono sublabels type on character by character after the title lands.
- Graphics **persist across camera cuts** and re-anchor — plan beats to outlive a cut.

Exits mirror entrances but faster (`--dur-out`) — slide + fade, no bounce out.

## Card kinds in this style

- tier1: step marker (navy mega-word), stage boot (olive dot-matrix), money kinetic
  (cream montage), thesis (navy multi-line), stat (navy lime countup), quote (cream),
  overview steps (navy sequential list).
- tier2: kinetic float caps, numbered list, glass step panel, glass media panel, paper
  script card, location tags, icon pop, lower-third pill, caption slam, idea→money arrow.
- custom: speaker-PIP frame, lime UI-highlight ring.

## Transitions

> Derived from filmstrip analysis of 36 sampled cuts across the three refs
> (`raw-media/higgsfield-style-refs/transitions-analysis/`). The refs cut FAST
> (113-244 cuts per video) and almost never crossfade. The grammar:

- **The base cut is a hard cut, placed mid-action.** The refs hide cuts inside
  motion (cannon fires -> ball already flying; hand reaches -> object lands).
  When assembling: cut on the motion, not after it settles. This is the match
  cut — continuity of object/direction across an instant cut.
- **Punch-in jump cuts** on the talking head: instant scale steps (~1.07 per
  step), no easing, no blur. Energy without softness.
- **Graphics bridge cuts.** Props, pills, and panels persist across camera cuts
  and re-anchor; a moving graphic can carry the eye THROUGH a cut (match carry).
- **Panels move, the world doesn't.** For context swaps, a lime-rimmed media
  panel slides in over the speaker instead of cutting away (panel slide), or
  the camera dives into the panel until it becomes the next scene (zoom through).
- **Section boundaries get the gate.** The olive dot-matrix boot card doubles
  as a chapter-turn shutter (dot boot gate).
- Motion spec: whips/slides are power3/expo, 0.4-0.9s; the swap always happens
  at the fully-covered or fastest moment; nothing "eases gently in".

Transition cards (`cards/transitions/`), 16 total, grouped by energy:

- **Whips (fast, blurred, camera-driven):** `tr-whip-pan` (one-world pan, blur
  peak, overshoot settle), `tr-spin-whip` (rotation carries through the cut),
  `tr-zoom-punch` (crash zoom + 1.5deg rotation kiss), `tr-flash-cut` (3-frame
  lime pop, fastest move).
- **Cut-hiders (motion covers the swap):** `tr-match-carry` (prop bridge),
  `tr-punch-cut` (instant scale steps), `tr-glass-wipe` (frosted pane whip),
  `tr-type-wiper` (mega word as the wiper).
- **Reveals (masked, staggered — the AE hand):** `tr-venetian-slats` (staggered
  mask drop), `tr-circle-reveal` (iris from the click point),
  `tr-letterbox-crush` (the blink; heaviest, 1-2 per video).
- **Panel moves (the world is a window):** `tr-panel-slide` (b-roll comes to
  you), `tr-zoom-through` (dive into the panel), `tr-pip-expand` (window becomes
  the world), `tr-push-parallax` (depth push with shade + overshoot).

The AE tells baked into every card: motion blur on whips, overshoot-and-settle
landings, staggered masks, parallax depth, micro-rotations on zooms. Demo scene
planes inside each card stand in for real footage at assembly time.

## What NOT to do

- No second accent color. Ever. The brand blue does not enter this style.
- No pure-black backgrounds — navy `#02060F` or olive `#0A1400` only.
- No soft crossfades between elements; things snap or they drift, nothing "eases gently in".
- No static tier2 glass panel — if a panel lives longer than 2s it drifts.
- No lime body text on cream (charcoal only; lime is highlight pills/underlines there).
- No simultaneous flips; reveals are always staged left→right / top→bottom.
- No covering the speaker's face zone with tier2 content.
- No em dashes in on-card copy.
