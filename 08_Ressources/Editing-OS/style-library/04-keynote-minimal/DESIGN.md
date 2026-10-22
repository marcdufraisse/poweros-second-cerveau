# Keynote Minimal — Design Spec

Apple product-film restraint. A true-black stage, one idea per beat set in
enormous tight grotesk type, one soft source of light, and nothing else.
This is the library's most premium and least decorated style — when in doubt,
remove something. Reference frames in `references/` (iPhone 17 Pro film +
MacBook reveal: black stage, machined metal, copper unibody, single-object
lighting).

## Feel

- A dark theater, not a dashboard. Content sits in silence.
- Every card presents ONE claim, ONE number, or ONE list — never a collage.
- Confidence through scale: if the headline doesn't feel slightly too big,
  it's too small.
- Decoration budget per card: one glow + hairlines. That's all.

## Palette

| Token | Hex | Role |
| --- | --- | --- |
| `--canvas` | `#000000` | true-black stage (takeover bg) |
| `--canvas-lift` | `#0A0A0C` | lifted panels, spec rows |
| `--hairline` | `#2C2C2E` | 1px dividers — the only border |
| `--text` | `#F5F5F7` | Apple white |
| `--accent` | `#37BDF8` | brand blue — the single functional accent |
| `--copper` | `#E8804C` | warm metal, from the unibody films |
| `--violet` | `#7D5CFF` | gradient-blob partner, never solo |

Rules: black + white carry 90% of every frame. Accent goes on ONE element
(the number, the key word, the underline). Copper/violet exist only inside
gradients and glows, never as flat UI color.

## Typography

- **Inter Tight** (600–800, `--track-display`) — the voice. Headlines,
  numbers, claims. Tight tracking is non-negotiable; it's what reads "Apple".
- **Inter** (400–600) — supporting copy, quiet and small.
- **IBM Plex Mono** (400–500) — spec metadata only: chip names, units,
  footnote markers.
- Metallic text (`--metal-text`, `--blue-metal-text`, `--copper-text` via
  `background-clip: text`) is for hero numbers/words. NEVER add `will-change`
  to gradient-clipped text (render chops descenders — workspace gotcha), and
  give it horizontal padding so edges don't shave.

## Layout

- `--pad: 120px` safe area; most cards use even more. Emptiness is the look.
- Center-stage composition by default; left-aligned only for spec lists.
- Hairline rules (`--rule`) separate spec rows; no boxes, no cards-in-cards,
  no glass.
- tier2 overlays: a floating hairline-and-black plate, bottom-left or
  bottom-center, small footprint, generous internal padding.

## Motion

- Silk. `expo.out` / `power3.out` entrances at ~1.1s; slow `sine.inOut`
  drifts; NO bounce, NO overshoot, NO spring (that's Kallaway).
- Signature entrance: text rises 24–40px while a soft blur (8–12px) resolves
  to sharp. Numbers count up with silky deceleration.
- The glow breathes: scale 1.0→1.06 over 4–6s, sine.inOut, finite repeats.
- Transitions between internal states: cross-dissolve or a hairline that
  draws across; never wipes, never whips.
- Hold the resolved frame at least 1.5s before the timeline ends.

## Card kinds in this style

- tier1 takeovers: thesis (mega claim), stat (metallic count-up), section
  (one-word chapter), quote (sparse attribution), overview (spec rows / trio)
- tier2: lower-third plate, spec label, hairline list
- innovations: mega-word product reveal, spec-sheet takeover

## What NOT to do

- No grids, dot patterns, grain, scanlines, vignette stacks, or texture walls.
- No glassmorphism, no neon edges, no drop shadows on type.
- No more than one accent-colored element per card.
- No bouncy easings, no stepped/choppy motion, no whip transitions.
- No ALL-CAPS body copy; kickers may be caps at `--track-wide`.
- Never crowd the frame — if a layout needs 4+ text blocks, it's a different
  style's card.
