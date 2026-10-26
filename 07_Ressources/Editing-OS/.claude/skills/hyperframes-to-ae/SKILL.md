---
name: hyperframes-to-ae
description: Export a HyperFrames HTML composition into After Effects as layered footage with alpha. Use when asked to "turn this into an After Effects project", "export to AE", "give me layered footage", "render with alpha / transparency for compositing", "hand this off to an editor", or split a composition into separate background / graphics / overlay layers an editor can recomp. Produces per-layer isolation passes (ProRes 4444 alpha MOVs + opaque background MP4) plus source clips, audio stems, and an AE handoff README.
---

# HyperFrames → After Effects (layered footage)

There is **no native HyperFrames → `.aep` export**. HyperFrames is HTML/CSS/GSAP; AE is a different
format. The reliable handoff is **layered footage with alpha**: render the composition several times,
each pass showing only one layer over a transparent stage, so an editor can stack/retime/recomp the
layers (or key the graphics over their own footage) in After Effects.

Set expectations with the user up front: gradient-fill text, 3D grids, glow/grain, motion blur, and
count-up numbers come across as **flat pixels** (pixel-perfect, not text-editable). If they need
editable AE text/keyframes, that's a different job (an ExtendScript `.jsx` rebuild) — this skill is
the layered-footage path, which is what most AE editors actually want.

## The core technique: isolation passes

A HyperFrames comp is a stack of root-level element groups — typically a background, the content
scenes (inside a camera/wrapper), and overlays (a logo/mark bug, whip/streak flashes), plus any
root-level `<video>`/testimonial stages. Each becomes one AE layer.

For each layer, render the **whole composition** with:
1. every OTHER group hidden (`display:none !important`), and
2. the stage/body background made transparent (`background:transparent !important`) — EXCEPT the
   background layer itself, which stays opaque (it's the base plate).

HyperFrames captures the page with a real alpha channel when you render `--format mov` (ProRes 4444,
`yuva444p12le`) or `--format webm` (VP9 alpha) or `--format png-sequence` (RGBA).

### If the project is generator-driven (a `_gen*.mjs` that emits the HTML)
Add a `--layer=<name>` flag to the generator that injects the isolation CSS just before `</style>`
and writes a separate card file (don't clobber `index.html`). Pattern:

```js
const LAYER = (process.argv.find(a => a.startsWith("--layer=")) || "").split("=")[1] || "";
// never bake audio into a layer pass:
const SOUND = process.argv.includes("--sfx") && !LAYER;

const layerCSS = !LAYER ? "" : `
  /* ==== AE ISOLATION PASS: ${LAYER} ==== */
  ${LAYER !== "bg" ? "html,body{background:transparent!important;} #stage{background:transparent!important;}" : ""}
  ${LAYER === "bg"   ? "#camera,#markbug,#whip,#teststage{display:none!important;}" : ""}
  ${LAYER === "fg"   ? "#bg,#markbug,#whip{display:none!important;}" : ""}        /* keep #camera + root video stages */
  ${LAYER === "mark" ? "#bg,#camera,#whip,#teststage{display:none!important;}" : ""}
  ${LAYER === "whip" ? "#bg,#camera,#markbug,#teststage{display:none!important;}" : ""}`;
// ...inject ${layerCSS} right before </style>; write cards/layer-<LAYER>.html when LAYER is set.
```
Adjust the selector groups to the actual comp. Root-level `<video>`/testimonial stages belong to the
foreground (`fg`) pass — keep them there, hide them everywhere else.

### If the project is a hand-authored `index.html` (no generator)
Make one copy per layer (e.g. `cards/layer-fg.html`) and paste an isolation `<style>` block at the
end of `<head>` with the same `display:none` + transparent rules. Keep asset paths relative
(`assets/...`) so they resolve from the project root at render time.

## Render each pass

Run from the project folder (assets resolve relative to CWD). Use `-c <file>` to render a specific
layer card instead of `index.html`:

```bash
# background — OPAQUE base plate
hyperframes render -c cards/layer-bg.html   --format mp4 --quality standard --fps 30 -o renders/ae/background.mp4
# alpha overlays — ProRes 4444
hyperframes render -c cards/layer-fg.html   --format mov --fps 30 -o renders/ae/graphics-alpha.mov
hyperframes render -c cards/layer-mark.html --format mov --fps 30 -o renders/ae/mark-alpha.mov
hyperframes render -c cards/layer-whip.html --format mov --fps 30 -o renders/ae/whip-alpha.mov
```

Each full-length pass takes a few minutes; run them as one sequential background batch. Match `--fps`
to the comp. All passes are full duration and pre-synced, so the editor drops every layer at 00:00.

## Verify the alpha (do this — don't assume)

```bash
# 1) codec + pixel format: alpha overlays MUST show yuva* (the "a"); bg is yuv420p (opaque)
ffprobe -v error -select_streams v:0 -show_entries stream=codec_name,pix_fmt -of csv=p=0 renders/ae/graphics-alpha.mov
#   -> prores,yuva444p12le  = real alpha ✓

# 2) eyeball it: composite one frame over magenta so transparency is unmistakable
ffmpeg -y -f lavfi -i color=c=magenta:s=1920x1080 -ss 50 -i renders/ae/graphics-alpha.mov \
  -filter_complex "[0:v][1:v]overlay=shortest=1" -frames:v 1 _alpha_check.png
```
Then `Read` `_alpha_check.png` — only the graphics/glow should show, magenta everywhere else. Delete it after.

## Assemble the handoff package

```
renders/ae/
├── background.mp4          # opaque base plate
├── graphics-alpha.mov      # text/stats/content (+ any root <video>), alpha
├── mark-alpha.mov          # logo/mark bug, alpha
├── whip-alpha.mov          # streak/transition flashes, alpha (optional)
├── source-clips/           # copy any real <video> footage baked into the fg pass
├── audio-stems/            # copy audio (renders are SILENT; editor re-places or swaps for a licensed bed)
└── README-AE-HANDOFF.md    # stack order (bottom→top) + import steps + remaining placeholders
```
The README must state the **bottom→top stack order** (background → graphics → whip → mark), that all
layers start at 00:00 and need no retiming, and that hiding the background lets the editor key the
graphics over real footage. List any placeholders still in the cut.

## Gotchas (learned the hard way)
- **`snapshot -c` ignores the layer file** and snapshots `index.html` instead, and PNG snapshots
  flatten alpha — so a snapshot is NOT a valid alpha/isolation test. Verify with `ffprobe` + the
  magenta composite on the actual render.
- **Audio must NOT be baked into layer passes** — gate the SFX flag off whenever a layer is set;
  deliver audio as separate stems.
- **A raw `http://localhost:PORT/assets/...` probe 404s** even though playback works — assets
  resolve relative to the composition page, not the server root. Don't conclude assets are broken.
- **ProRes 4444 is huge** (a ~3.5 min 1080p alpha pass ≈ 5 GB; a mostly-empty overlay still ≈ 1.5 GB).
  If size matters, offer VP9 **WebM alpha** (`--format webm`, ~5–10× smaller, AE-importable) or a
  **PNG sequence** (`--format png-sequence`, RGBA) instead.
- **`renders/` is gitignored** — this is a local/Drive deliverable, never committed.
- Re-export reflects the CURRENT cut; if placeholders (e.g. a `$X` stat) aren't final, confirm the
  user wants to hand off now or lock content first.

## Delivery
Offer: leave it locally (`open` the folder in Finder), or upload `renders/ae/` to Drive (warn that
multi-GB ProRes syncs slowly — the WebM variant is far faster to move).
