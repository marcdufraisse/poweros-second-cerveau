#!/usr/bin/env node
// Agent 4 · step 4 — assemble a render-ready index.html with b-roll comped over the video.
//
// Reads a sourced plan (moments with start/duration/placement/sourceType/assetId) +
// asset-library/registry.json + the input video, copies each used asset into the
// project's assets/broll/, and builds ONE index.html where each moment is a layer:
//   - cutaway: full-frame <video>/<img> on a track above the talking head for its span
//              (the bg <audio> keeps playing underneath, so narration continues)
//   - overlay: an inset framed image / corner logo chip that stays clear of the face
// A single master GSAP timeline fades each layer in/out (images get a slow Ken Burns).
//
// Usage:
//   node .../build-broll.mjs <sourced-plan.json> --out video-projects/<slug>/index.html
//     [--registry asset-library/registry.json] [--library asset-library] [--duration SEC]

import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from "node:fs";
import { dirname, join, resolve, relative, basename } from "node:path";
import { execFileSync } from "node:child_process";

const argv = process.argv.slice(2);
if (!argv.length || argv[0].startsWith("--")) {
  console.error("usage: build-broll.mjs <sourced-plan.json> --out index.html [--registry PATH] [--library DIR] [--duration SEC]");
  process.exit(1);
}
const planPath = argv[0];
const opt = (n, d) => {
  const i = argv.indexOf(n);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : d;
};
const outPath = opt("--out", null);
if (!outPath) {
  console.error("--out <index.html> is required");
  process.exit(1);
}
const registryPath = opt("--registry", "asset-library/registry.json");
const libraryDir = resolve(opt("--library", "asset-library"));
const plan = JSON.parse(readFileSync(planPath, "utf8"));
const registry = JSON.parse(readFileSync(registryPath, "utf8"));
const assetById = new Map(registry.assets.map((a) => [a.id, a]));

const outDir = dirname(resolve(outPath));
const slug = basename(outDir) || "composition";
const W = plan.width || 1920;
const H = plan.height || 1080;
const brollDir = join(outDir, "assets", "broll");
mkdirSync(brollDir, { recursive: true });

// ---- total duration (video length) --------------------------------------
const videoAbs = plan.video ? resolve(plan.video) : null;
let TOTAL = Number(opt("--duration", plan.duration || 0));
if (!TOTAL && videoAbs && existsSync(videoAbs)) {
  try {
    TOTAL = parseFloat(
      execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", videoAbs], { encoding: "utf8" }).trim()
    );
  } catch {}
}
const maxEnd = Math.max(0, ...plan.moments.map((m) => m.start + m.duration));
if (!TOTAL) TOTAL = maxEnd + 2;
TOTAL = Math.max(TOTAL, maxEnd);
const videoSrc = videoAbs ? relative(outDir, videoAbs) : "assets/clean.mp4";
const round = (n) => Math.round(n * 100) / 100;
const VIDEO_EXT = new Set([".mp4", ".mov", ".webm", ".m4v"]);

// ---- build a layer per moment -------------------------------------------
// Rule: only real <video> elements are TIMED media (data-start/duration/track + id,
// no clip class). Image/logo/card layers are a TIMED wrapper <div class="clip"> with a
// plain non-timed <img>. Overlay-video uses a NON-timed wrapper around a timed <video>.
// Never nest a data-start media inside a data-start element. Each timed element gets
// its own track index so nothing overlaps.
const layers = [];
const masterLines = [];
const issues = [];
let track = 2; // 0 = bg video, 1 = bg audio

plan.moments
  .slice()
  .sort((a, b) => a.start - b.start)
  .forEach((m, n) => {
    const asset = m.assetId && assetById.get(m.assetId);
    if (!asset) {
      issues.push(`moment ${n} (${m.start}s): assetId "${m.assetId || "(none)"}" not in registry — skipped`);
      return;
    }
    const srcAbs = join(libraryDir, asset.file);
    if (!existsSync(srcAbs)) {
      issues.push(`moment ${n}: asset file missing on disk: ${asset.file} — skipped`);
      return;
    }
    const fileName = basename(asset.file);
    copyFileSync(srcAbs, join(brollDir, fileName));
    const src = `assets/broll/${fileName}`;
    const isVideo = VIDEO_EXT.has("." + fileName.split(".").pop().toLowerCase());

    const id = `broll${String(n + 1).padStart(3, "0")}`;
    const start = round(m.start);
    const dur = round(m.duration);
    const end = round(m.start + m.duration);
    const fadeOut = Math.max(start, end - 0.4);
    const placement = m.placement === "overlay" ? "overlay" : "cutaway";
    const kind = `${placement}:${asset.type || (isVideo ? "clip" : "image")}`;
    const timed = (extra) => `data-start="${start}" data-duration="${dur}" data-track-index="${track++}"${extra || ""}`;
    const tag = `    <!-- ${kind} @ ${start}s · ${asset.id} (${asset.license}) -->`;
    let dom;

    if (placement === "cutaway" && isVideo) {
      dom = `<video id="${id}" class="broll-cutaway" muted ${timed()} src="${src}" style="opacity:0"></video>`;
      masterLines.push(fade(id, start, fadeOut));
    } else if (placement === "cutaway") {
      dom = `<div id="${id}" class="broll-cutaway clip" ${timed(' style="opacity:0"')}><img src="${src}" class="fill" /></div>`;
      const from = n % 2 ? 1.08 : 1.0, to = n % 2 ? 1.0 : 1.08; // deterministic Ken Burns
      masterLines.push(`  MT.fromTo("#${id} img", { scale: ${from} }, { scale: ${to}, duration: ${dur}, ease: "none" }, ${start});`);
      masterLines.push(fade(id, start, fadeOut));
    } else if (asset.type === "logo") {
      dom = `<div id="${id}" class="broll-overlay-logo clip" ${timed(' style="opacity:0"')}><div class="logo-chip"><img src="${src}" /></div></div>`;
      masterLines.push(slideFade(id, start, fadeOut));
    } else if (isVideo) {
      // overlay video: NON-timed framed wrapper + timed inner <video>
      dom = `<div id="${id}" class="broll-overlay-card" style="opacity:0"><video id="${id}-m" muted ${timed()} src="${src}" class="fill" style="display:block"></video></div>`;
      masterLines.push(slideFade(id, start, fadeOut));
    } else {
      dom = `<div id="${id}" class="broll-overlay-card clip" ${timed(' style="opacity:0"')}><img src="${src}" class="fill" style="display:block" /></div>`;
      masterLines.push(slideFade(id, start, fadeOut));
    }

    layers.push(`${tag}\n    ${dom}`);
  });

function fade(id, start, fadeOut) {
  return (
    `  MT.fromTo("#${id}", { opacity: 0 }, { opacity: 1, duration: 0.4, ease: "power2.out" }, ${start});\n` +
    `  MT.to("#${id}", { opacity: 0, duration: 0.4, ease: "power2.in" }, ${fadeOut});`
  );
}
function slideFade(id, start, fadeOut) {
  return (
    `  MT.fromTo("#${id}", { opacity: 0, x: 48 }, { opacity: 1, x: 0, duration: 0.5, ease: "power3.out" }, ${start});\n` +
    `  MT.to("#${id}", { opacity: 0, duration: 0.4, ease: "power2.in" }, ${fadeOut});`
  );
}

// ---- emit index.html -----------------------------------------------------
const page = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    html, body { margin: 0; background: #000; }
    #${slug} { position: absolute; inset: 0; width: ${W}px; height: ${H}px; overflow: hidden; }
    #video-stage { position: absolute; inset: 0; }
    #video-stage video { width: 100%; height: 100%; object-fit: cover; display: block; }
    .fill { width: 100%; height: 100%; object-fit: cover; }

    /* full-frame cutaway over the talking head (bg audio keeps playing) */
    .broll-cutaway { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
    /* inset framed overlay on the right, clear of a centered/left face */
    .broll-overlay-card {
      position: absolute; right: 64px; top: 50%; transform: translateY(-50%);
      width: 720px; height: 405px; border-radius: 18px; overflow: hidden;
      box-shadow: 0 30px 80px rgba(0,0,0,0.55); border: 3px solid rgba(255,255,255,0.9);
      background: #000;
    }
    /* corner logo chip */
    .broll-overlay-logo { position: absolute; right: 72px; top: 72px; }
    .broll-overlay-logo .logo-chip {
      background: rgba(255,255,255,0.94); border-radius: 18px; padding: 22px 30px;
      box-shadow: 0 16px 44px rgba(0,0,0,0.4); display: flex; align-items: center;
    }
    .broll-overlay-logo .logo-chip img { height: 88px; width: auto; display: block; }
  </style>
</head>
<body>
  <div id="${slug}" data-composition-id="${slug}" data-start="0" data-width="${W}" data-height="${H}">
    <div id="video-stage">
      <video id="bg-video" muted data-start="0" data-duration="${round(TOTAL)}" data-track-index="0" src="${videoSrc}"></video>
      <audio id="bg-audio" data-start="0" data-duration="${round(TOTAL)}" data-track-index="1" src="${videoSrc}"></audio>
    </div>

${layers.join("\n\n")}
  </div>

  <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
  <script>
    window.__timelines = window.__timelines || {};
    const MT = gsap.timeline({ paused: true });
${masterLines.join("\n")}
    MT.set({}, {}, ${round(TOTAL)});
    window.__timelines["${slug}"] = MT;
  </script>
</body>
</html>
`;

writeFileSync(outPath, page);

console.log(`assembled ${layers.length}/${plan.moments.length} b-roll layers → ${outPath}`);
console.log(`  duration ${round(TOTAL)}s · video ${videoSrc} · assets copied to ${relative(outDir, brollDir)}/`);
if (issues.length) {
  console.log(`\n${issues.length} issue(s):`);
  for (const i of issues) console.log(`  ⚠ ${i}`);
}
console.log(`\nnext: cd ${dirname(outPath)} && lint + render (see SKILL.md / CLAUDE.md Render Contract)`);
