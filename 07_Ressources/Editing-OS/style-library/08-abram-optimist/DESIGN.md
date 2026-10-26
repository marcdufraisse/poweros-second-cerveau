# Abram Optimist — Design Spec

Cleo-Abram bright tech optimism. A warm off-white stage, big friendly
Manrope 800 type, ONE prismatic gradient moment per card, springy pops,
light-leak flare sweeps at transitions, and Space-Mono "tape deck" tags
(REWIND <<, 2X SPEED). The only light, energetic style in the library —
the future is genuinely good here. Reference frames in `references/`
(Vision Pro episode: prism flares, mono REWIND overlays, bright saturated
footage).

## Feel

- Curious, delighted, precise. "Huge if true" energy: big claims delivered
  with a grin and a citation.
- LIGHT canvas — this style must never look like the dark styles. Air and
  bounce instead of shadow and glow.
- One prism moment per card: the gradient appears exactly once (a clipped
  word, a bar, a number). Everything else is ink on off-white.
- The mono tape voice comments from the margins (tags, timestamps).

## Palette

| Token | Hex | Role |
| --- | --- | --- |
| `--canvas` | `#FAFAF7` | warm off-white stage |
| `--ink` | `#16161A` | near-black text |
| `--accent` | `#37BDF8` | brand blue — functional accent |
| `--prism-pink` | `#FF4D9D` | prism stop |
| `--prism-orange` | `#FF9A3D` | prism stop |
| `--prism-violet` | `#8B5CF6` | prism stop |
| `--sun` | `#FFD449` | tiny marks only (ticks, dots) |

The prism colors NEVER appear as flat solo fills — only inside `--prism`,
`--prism-wash`, or `--flare`. Solo accents are brand blue.

## Typography

- **Manrope** (700–800, `--track-tight`) — headlines, numbers, claims.
  Big and friendly; sentence case, not shouty caps.
- **Inter** (400–600) — supporting copy.
- **Space Mono** (400/700, `--track-mono`, uppercase) — tape-deck tags in
  pill chips ("REWIND <<", "2X SPEED", timestamps), footnotes.
- Prism text via `background-clip: text` on `--prism` — NEVER with
  `will-change` (render gotcha), always with horizontal padding.

## Layout

- Centered or cheerfully asymmetric; generous air (`--pad: 96px`+).
- Floating white cards/chips with `--lift` shadow and `--radius` rounding.
- Mono tags live in pill chips (ink on white, or white on ink) pinned to
  corners.
- A soft `--prism-wash` may tint one edge/corner of the canvas — barely.

## Motion

- The POP: `scale 0.6→1` + fade with `back.out(1.7)`, 0.4–0.5s. Friendly
  spring, the signature entrance for chips, numbers, and cards.
- Headlines rise and settle (`y: 30→0`, expo.out); the prism word's gradient
  PANS once (animate background-position over ~1.2s, sweep feel).
- The FLARE: a skewed `--flare` band sweeps across the frame once
  (xPercent -120→120, power2.inOut, ~0.7s) at the card's peak moment.
- Count-ups are eager: fast start, soft landing (power3.out).
- Small idle life allowed: ONE element may bob gently (y ±6, sine.inOut,
  finite repeats). Everything else settles still.

## Card kinds in this style

- tier1 takeovers: thesis (prism-word claim), stat (giant friendly number),
  section (tape-deck chapter), quote (delighted pull quote), overview
  (pill-chip trio, step cards)
- tier2: pill-tag lower-third, mono tape chip, floating list card
- innovations: REWIND moment card, "huge if true" verdict card, prism
  divider sweep

## What NOT to do

- NEVER a dark canvas — no black backgrounds, no vignettes, no grain.
- No neon glow, no glassmorphism, no outlines/strokes on type.
- Prism colors never as flat solo fills; one prism moment per card, max.
- No ALL-CAPS Manrope headlines (mono tags may be caps).
- Springy ≠ sloppy: pops land and STOP; no continuous wobble.
- No emoji, no clip-art, no hand-drawn scribbles.
