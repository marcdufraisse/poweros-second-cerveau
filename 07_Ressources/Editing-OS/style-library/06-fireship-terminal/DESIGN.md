# Fireship Terminal — Design Spec

Fireship dev-explainer energy. A near-black stage where cream heavy-outlined
caption type STAMPS in word by word, code-editor panels type themselves out
in pastel syntax colors, and neon wireframe frames flicker on for title
moments. Everything lands fast and holds still — meme-speed pacing with
terminal credibility. Reference frames in `references/` (Google I/O code
report: cream outlined captions, stacked product lists, neon "CODE REPORT"
wireframe, editor panels).

## Feel

- A very good developer making jokes at 1.5x speed. Punchy, dry, precise.
- Two registers: CAPTION (huge cream Luckiest Guy slams over black) and
  TERMINAL (JetBrains Mono panels with window chrome and syntax colors).
- Motion is percussive: things stamp, snap, and type — nothing drifts.
- Flame orange is the energy color; brand blue is the hero syntax/neon color.

## Palette

| Token | Hex | Role |
| --- | --- | --- |
| `--canvas` | `#0B0B0F` | near-black stage |
| `--panel` | `#16161E` | code/terminal panels |
| `--cream` | `#F4EFE2` | caption type (with black stroke) |
| `--accent` | `#37BDF8` | brand blue — hero syntax, neon frames |
| `--flame` | `#FF6A2B` | flame orange — energy hits, underline bars |
| `--syn-pink` | `#F471B5` | syntax keywords |
| `--syn-green` | `#A3E635` | syntax strings / success |
| `--syn-purple` | `#A78BFA` | syntax functions |

Syntax colors appear ONLY inside code panels or as tiny chip accents —
never as headline colors. Captions are always cream.

## Typography

- **Luckiest Guy** — the caption voice. ALL CAPS, cream, with a fat black
  rim: `-webkit-text-stroke: var(--stroke-w) var(--outline)` +
  `paint-order: stroke fill` + `text-shadow: var(--caption-shadow)`.
  Never skip the stroke; bare Luckiest Guy reads as a kids' party.
- **JetBrains Mono** — all code, terminal output, window labels, kickers.
- **Inter** — quiet supporting copy only (rare).

## Layout

- Caption cards: dead-center, huge, 1–3 words per line, max 2 lines.
- Terminal panels: `--panel` with `--radius`, a `--chrome-h` title bar
  carrying three traffic dots (`--dot-red/yellow/green`) and a mono filename;
  code lines inside at `--size-code` with 1.7 line-height.
- Stacked lists (the "Gemini Spark / Omni / Flash" moment): rows of
  Luckiest Guy caps stamping in one per beat, center-aligned.
- Neon wireframe frames: a rectangle with `--neon-edge` + `--neon-glow`,
  drawn/flickered in, title inside.

## Motion

- The STAMP: `scale 1.6→1` + fade at `back.out(2.2)`, 0.25–0.3s, per word
  or row. Stagger rows ~0.3s. This is the signature move.
- Typewriter: code types on character by character (pre-split spans,
  stagger 0.02, linear). Cursor block blinks (finite repeats).
- Neon flicker-on: opacity 0→1 with 2–3 quick dips (finite keyframes), then
  a soft steady glow pulse (repeat: 2, yoyo).
- Panels snap in with `expo.out` at 0.3s — no float, no drift.
- A flame-gradient underline bar can wipe in under a caption (`scaleX 0→1`).
- Holds are dead still: after the stamp sequence, freeze ~2s. Stillness IS
  the punchline timing.

## Card kinds in this style

- tier1 takeovers: thesis (caption slam), stat (giant mono number + caption),
  section (neon wireframe title), quote (terminal echo), overview (stacked
  stamp list, code panel walkthrough)
- tier2: mono label chip, terminal lower-third, mini code panel
- innovations: fake terminal session card, versus card, error-message card

## What NOT to do

- No glassmorphism, no aurora blooms, no soft gradient washes (that's
  Kallaway). Light here is neon rim or nothing.
- No serif anywhere. No lowercase in Luckiest Guy captions.
- Never animate letter-spacing or font-size; stamp with scale only.
- No slow drifts or breathing ambience — dead stillness between hits.
- Syntax colors never exceed chip/code scale; captions stay cream.
- No real brand logos; abstract window chrome only.
