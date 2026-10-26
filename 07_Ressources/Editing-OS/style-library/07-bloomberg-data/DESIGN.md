# Bloomberg Data — Design Spec

Bloomberg-Originals brutalist data journalism. A stark black canvas where
white condensed caps sit in labeled boxes, thin rules divide the frame like
a broadsheet, every numeral is terminal-amber mono, and charts are precise
geometry with square corners. Serious money energy: everything measured,
nothing decorative. Reference frames in `references/` (trading-empire doc:
white label boxes with accent underlines, ticker walls, terminal numerals).

## Feel

- A newsroom terminal, not a keynote stage. Dense is fine; sloppy is not.
- The grid is visible: rules, columns, axis ticks. Content snaps to it.
- Numbers are the protagonists — mono, amber, rolled up on entry.
- Editorial confidence: headlines state facts, labels cite sources.

## Palette

| Token | Hex | Role |
| --- | --- | --- |
| `--canvas` | `#0A0A0A` | stark black |
| `--panel` | `#141518` | chart/table panels |
| `--rule` | `#33363B` | thin editorial rules |
| `--white` | `#FFFFFF` | headlines + label boxes |
| `--accent` | `#37BDF8` | brand blue — underline bars, chart keys |
| `--amber` | `#FFB020` | terminal amber — all hero numerals |
| `--up` | `#4AF6C3` | market green — positive delta |
| `--down` | `#FF433D` | market red — negative delta |

Green/red appear ONLY as deltas/direction, never decorative. Amber is
numerals only. Blue carries the editorial accents (underline bars, the
highlighted bar in a chart, key words).

## Typography

- **Archivo** (600–800, `--track-tight`) — headlines and claims.
- **Archivo Narrow** (600–700, UPPERCASE, `--track-caps`) — the label voice:
  white boxes with black text, kickers, axis labels, sources.
- **IBM Plex Mono** — EVERY numeral, ticker, delta, timestamp. A digit in
  Archivo is a bug.
- Signature component: the white label box (`--white` bg, `--black` Narrow
  caps, `--label-pad`) with a `--bar-h` accent underline bar.

## Layout

- Square corners everywhere (`--radius: 0`). No rounding, no pills.
- Broadsheet structure: thin `--hairline` rules divide the frame; columns
  align; headlines sit on the grid, not floating.
- Charts: bars/lines on `--panel` with `--grid-line` gridlines, mono axis
  values, Narrow-caps axis labels, square data markers.
- Sources cited bottom-left in Narrow caps `--text-faint` ("SOURCE: ACME
  MEMBER SURVEY 2026").

## Motion

- Mechanical precision. Rules DRAW (`scaleX 0→1`, `power3.inOut`); label
  boxes CLIP-REVEAL (a wipe from left, no fade-scale); numbers ROLL up
  (`power2.out` count); bars GROW from the axis (`scaleY`/`scaleX`,
  `power3.inOut`, staggered).
- Snap timing: entrances 0.4–0.6s, staggers 0.1–0.15s. No blur-ins, no
  springs, no drifting ambience. A ticker strip may translate linearly
  (finite distance).
- Delta values tick in last, colored `--up`/`--down`, with a small ▲/▼
  built from a CSS triangle (border trick), not an emoji.
- Hold the resolved frame ≥2s; end dead still.

## Card kinds in this style

- tier1 takeovers: thesis (broadsheet headline), stat (amber mega numeral),
  section (ruled chapter), quote (attributed statement), overview (data
  table, bar/line chart, ranked list)
- tier2: white-box lower-third, ticker strip, delta chip, source label
- innovations: mini bar-chart card, line-chart card, ranked leaderboard,
  ticker-wall moment

## What NOT to do

- No rounded corners, no gradients (flat fills only), no glow/neon/glass.
- No blur entrances, no springs, no bounces — mechanical eases only.
- Numerals never in Archivo, never white — mono amber (or delta green/red).
- Green/red never used decoratively; only for direction.
- No fake Bloomberg branding/logos — the grammar, not the trademark.
- Don't center everything — broadsheet grids are left-aligned by default.
