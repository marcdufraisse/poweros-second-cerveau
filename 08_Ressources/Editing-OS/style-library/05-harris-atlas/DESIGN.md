# Harris Atlas — Design Spec

Johnny-Harris cinematic map journalism. Aged parchment maps with sage oceans,
slate country fills carrying white boxed labels, ONE highlighted region per
beat, typewriter metadata, film grain and warm burn transitions, slow
documentary push-ins. Every card should feel like a page of an atlas someone
is investigating under a projector. Reference frames in `references/`
("How the USA Colonized the USA, Mapped").

## Feel

- An investigation, not a presentation. Weighty, deliberate, archival.
- Cartography is the metaphor even when there's no literal map: boxed labels,
  route lines, coordinates, stamps, dossier headers.
- Two grounds: PAPER (parchment/sage, ink text) for maps and documents, and
  FILM (near-black, cream text, heavy grain) for archival "projector" beats.
- One highlighted region/word per card, in brand blue. Red is punctuation for
  conflict/borders, never the hero.

## Palette

| Token | Hex | Role |
| --- | --- | --- |
| `--parchment` | `#E7DDC4` | aged paper, land, card grounds |
| `--parchment-hi` | `#F2EAD6` | lit paper, label plates |
| `--sage` | `#C2CDB4` | map ocean, secondary ground |
| `--slate` | `#57646A` | country fill (dark cartographic gray) |
| `--ink` | `#2A241C` | warm ink text on paper |
| `--film` | `#14110C` | projector black ground |
| `--accent` | `#37BDF8` | brand blue — highlighted region / key word |
| `--red` | `#BE3B2B` | editorial red — conflict, borders, strikes |

## Typography

- **Oswald** (500–700, uppercase, `--track-caps`) — the cartographic voice:
  map labels, headlines, giant dates. The signature is white Oswald caps in
  a slate box (`--label-bg` + `--label-pad`).
- **Source Serif 4** (400–600, italics allowed) — the narrative voice:
  definitions, quotes, body copy.
- **Courier Prime** — archival metadata: file numbers, coordinates, dates,
  footnotes ("FILE 042 · 38.9072° N").

## Layout

- Map-page composition: a `--frame` border inset ~40px like a printed plate,
  content inside it. Corner coordinates/plate numbers in Courier.
- Landmasses are abstract SVG coastline blobs (hand-authored paths, organic
  and irregular) — never real geography, never clip-art.
- Boxed labels pin to regions; route lines are dashed SVG paths that draw.
- Film-ground cards: content floats on black with heavy grain + vignette.

## Motion

- Documentary weight: slow push-in on the ground layer (`scale 1→1.06`,
  `power2.inOut`, 5–6s) runs under everything — camera rides the BACKGROUND
  only, text stays pin-sharp.
- Labels STAMP in: `scale 1.12→1` + fade, `expo.out`, ~0.45s, with a soft
  paper-hit feel. Regions fill with a quick pop then settle.
- Route lines draw via `stroke-dashoffset`, `power1.inOut`.
- Typewriter text types on character by character for Courier metadata
  (deterministic: pre-split spans, stagger 0.03).
- Film flicker: tiny opacity jitter (0.97↔1.0) on film-ground cards, finite
  repeats only.
- Transitions: a `--burn` wash sweeping across the frame; never hard cuts.

## Card kinds in this style

- tier1 takeovers: thesis (dossier headline), stat (giant date/number stamp),
  section (atlas plate chapter), quote (definition card / testimony), overview
  (legend list, route itinerary)
- tier2: boxed-label lower-third, coordinate chip, legend list
- innovations: map-region highlight card, route-line journey card, archival
  dossier plate

## What NOT to do

- No real-world country shapes (abstract coastlines only) and no clip-art
  globes/pins/compasses.
- No neon, no glow, no glassmorphism — light here is warm and physical.
- Red never highlights the hero fact (that's blue's job).
- No bouncy/springy easings; nothing choppy-stop-motion (that's Vox).
- Don't stack both grounds in one card — a card is PAPER or FILM, not both.
- No hand-drawn arrows or scribble circles (standing library rule).
