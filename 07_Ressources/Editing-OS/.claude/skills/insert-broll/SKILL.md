---
name: insert-broll
description: Agent 4 of the video editing pipeline. Inserts b-roll and visual assets (stock clips, photos, tool/brand logos, live website screenshots) over a clean talking-head edit, as cutaways (full-frame, narration continues) or overlays (speaker stays visible). Pulls from a local asset database (asset-library/) and free web providers (Pexels, Pixabay, Unsplash, Openverse, Wikimedia, Clearbit/Simple Icons logos, local Playwright screenshots, Firecrawl), caching every fetch back into the library. Use after motion-graphics, when asked to add b-roll, cutaways, visuals, screenshots of a tool/site, stock footage, or logos. Review-gated: detects visual moments from the transcript, you confirm + pick/fetch assets, then it comps them in. Requires a word-level transcript + the clean video.
---

# Insert B-roll / Visual Assets (Pipeline Agent 4)

Fourth step of the automated edit, after **cut-silences → cut-mistakes → motion-graphics**. It lays visual assets over the talking head so the viewer sees what the narration is describing: stock clips/photos, real tool & brand **logos**, and **live screenshots** of websites/tools. Each asset is placed as a **cutaway** (fills the frame, narration audio keeps going) or an **overlay** (PiP / partial, the speaker stays visible) — chosen per moment.

Like the other agents, it is **review-gated**: a mechanical pass proposes visual moments, you (and the user) confirm them, set cutaway-vs-overlay, and pick or fetch the actual asset; only then is anything comped in.

Assets come from two places, both feeding `asset-library/registry.json`:
- the **local asset database** (`asset-library/` — see `asset-library/GUIDE.md`), the curated + cached pool, and
- **free web providers** that fetch on demand and cache the result back into the library, so it compounds.

## When to use

- "add b-roll", "add cutaways", "show some visuals", "drop in stock footage"
- "show the actual ChatGPT/Notion/<tool> site", "screenshot that website", "add the logo"
- As the fourth stage of the master edit workflow, on the motion-graphics output (or the clean cut if no cards were added).

## Prerequisites

- A re-timed word-level transcript on the clean timeline (Agent 2's `mistakes-transcript.json`, or Agent 1's silence transcript).
- The clean / card-comped video.
- For web sourcing: the relevant provider set up (see **Providers** below). The local DB + screenshots work with no keys.

## The flow

### 1. Detect visual moments (mechanical) — **built**

```bash
node .claude/skills/insert-broll/scripts/detect-broll.mjs \
  <mistakes-transcript.json> --out-dir video-projects/<slug>/assets
```

Writes `<stem>.broll-candidates.json` + `.md`. Each candidate has: `sourceType`
(`logo` | `screenshot` | `stock-video` | `stock-photo` | `diagram` | `map`),
a suggested `placement` (`cutaway` | `overlay`), `anchor` (trigger phrase),
`start`/`duration`, a `concept` + `query` seed, `confidence`, and `context`.

It flags: **named tools/brands** (logo/screenshot, overlay), **URLs / "dot com"**
(screenshot, cutaway), **proper-noun entities** (stock, cutaway), **visual-cue phrases**
("imagine…", "for example", "picture this" → illustrative stock, cutaway), and **pacing
gaps** (cutaway fill). It does NOT decide final content — the review gate does.

### 2. Review + build the plan (the gate — REQUIRED)

Read candidates in context. Drop weak ones (don't add b-roll just to fill a gap), set the
final `sourceType` + `placement`, tighten timing (start ~0.2-0.4s before the anchor; cutaways
usually 3-6s, overlays can run a topic span), and rewrite the `query`/`concept` into something
that will return a good asset. Write the approved plan:

```json
{
  "video": "video-projects/<slug>/assets/edited-graphics.mp4",
  "width": 1920, "height": 1080, "fps": 30,
  "moments": [
    { "start": 12.4, "duration": 4, "placement": "cutaway", "sourceType": "screenshot",
      "anchor": "go to chatgpt.com", "query": "https://chatgpt.com",
      "assetId": null },
    { "start": 31.0, "duration": 5, "placement": "overlay", "sourceType": "logo",
      "anchor": "inside Notion", "query": "Notion logo", "assetId": null }
  ]
}
```

Set `assetId` to an existing `asset-library/registry.json` id to reuse a cached asset, or
leave `null` to fetch one in step 3.

### 3. Source / fetch assets — **built**

For each moment with `assetId: null`, fetch the best match into `asset-library/` (writing a
sidecar + caching for reuse), then set `assetId` to the printed id. Reuse a cached asset by
matching the moment's query against `registry.json` first; otherwise fetch:

```bash
node scripts/asset-library/fetch-asset.mjs "<query>" --type <logo|icon|screenshot|stock-photo|image|stock-video> [opts]
#   --provider <name>   force one provider (else the type's preference order)
#   --list              search only, print candidates, download nothing (good for review)
#   --orientation landscape|portrait|square   ·   --width N --height N (screenshots)
# examples:
node scripts/asset-library/fetch-asset.mjs "Notion" --type logo
node scripts/asset-library/fetch-asset.mjs "https://en.wikipedia.org/wiki/OpenAI" --type screenshot
node scripts/asset-library/fetch-asset.mjs "robot factory arm" --type stock-video
```

Routing by type tries keyed stock first (Pexels/Pixabay/Unsplash — they no-op silently if the key
is absent), then keyless CC sources (Openverse/Wikimedia); logos use Simple Icons (Clearbit fallback);
screenshots use local Playwright (system-Chrome fallback). Each fetch writes a sidecar with `license`
+ `attribution` and rebuilds the registry. Adapters live in `scripts/asset-library/providers/`, one
interface: `meta` + `search(query,opts) → results`. Add a provider by dropping in a new adapter +
a line in `fetch-asset.mjs`'s `ROUTES`.

Screenshot tip: pick a public, content-rich URL. Auth-gated JS SPAs (e.g. chatgpt.com) capture only
their loading screen — screenshot the marketing site or a Wikipedia/docs page about the tool instead.

### 4. Assemble — **built**

```bash
node .claude/skills/insert-broll/scripts/build-broll.mjs \
  sourced-plan.json --out video-projects/<slug>/index.html
```

Copies each used asset into `<project>/assets/broll/` and builds ONE `index.html`: the clean video
mounts as `<video muted>` (track 0) + sibling `<audio>` (track 1, narration keeps playing), then a
layer per moment driven by one master GSAP timeline. A **cutaway** is a full-frame `<video>`/`<img>`
over the talking head (stills get a slow deterministic Ken Burns); an **overlay** is a framed inset
card on the right or a corner logo chip, kept clear of a centered/left face. Then lint + render
(cached 0.4.32 CLI binary — see CLAUDE.md / the `agent3-render-pipeline` memory).

Assembler rules (lint-enforced): only real `<video>` elements are timed media (`data-start/duration/
track-index` + id, muted, no `clip` class); image/logo/card layers are a timed `<div class="clip">`
wrapping a plain `<img>`; overlay-video uses a NON-timed wrapper around a timed `<video>` (never nest
two `data-start` elements). Each timed element gets its own track so nothing overlaps. Layers start
`opacity:0` and the master fades them in/out.

## Providers (the free sourcing layer)

Set keys in the workspace `.env`; keyless providers work out of the box.

| Provider | Gives | Key? | License |
| --- | --- | --- | --- |
| Local **Playwright** | URL screenshots | none (install Playwright) | n/a (your capture) |
| **Pexels** | stock photo + video | free `PEXELS_API_KEY` | commercial OK |
| **Pixabay** | photo + video + illustration | free `PIXABAY_API_KEY` | commercial OK |
| **Unsplash** | photos | free `UNSPLASH_ACCESS_KEY` | commercial OK |
| **Openverse** | CC media (aggregator) | none | CC (varies, filterable) |
| **Wikimedia Commons** | PD/CC images, diagrams | none | PD / CC |
| **Clearbit Logo** / **Simple Icons** | brand & tool logos | none | nominative/editorial |
| **Firecrawl** (MCP, connected) | arbitrary web images/scrape | none | **unknown — comp only** |
| **NASA / Smithsonian / Met / LoC** | public-domain imagery | none | public domain |
| **OpenStreetMap static** | maps | none | ODbL (attribution) |

**Licensing discipline:** anything in a final published frame should be CC0/PD/Pexels/Pixabay/
Unsplash. Firecrawl-scraped images + arbitrary screenshots are `unknown` license — reference/comp
only unless cleared. `build-registry.mjs` flags every `unknown`-license asset for audit.

## The asset database

`asset-library/` is the local pool (see `asset-library/GUIDE.md`). Rebuild its index after adding
or fetching assets:

```bash
node scripts/asset-library/build-registry.mjs
```

Curated drop-ins get a `<file>.json` sidecar (`tags`, `description`, `license`); fetched assets get
one written automatically. The agent matches a moment's `query`/concept to assets by tag.

## Notes

- A clean explainer may want very little b-roll — quality over coverage. Logos/screenshots that show
  the *actual* thing being discussed are higher value than generic stock.
- Cutaways must not orphan the speaker's audio — narration always continues underneath.
- Overlays must never cover the face; keep them to a corner / lower region.
- **Status:** all four steps are built and validated — detection, asset database, provider sourcing
  (all providers tested live), and the cutaway/overlay assembler (lint-clean; cutaway image/video +
  overlay logo/screenshot all verified rendering on a real video). Next: validate the full agent on a
  fresh end-to-end video, then the master `/goal edit this video` workflow chaining all four agents.
