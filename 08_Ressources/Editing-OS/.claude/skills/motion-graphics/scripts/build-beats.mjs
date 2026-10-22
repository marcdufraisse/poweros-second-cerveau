#!/usr/bin/env node
// Agent 3 · step 4 — assemble one render-ready index.html from a card-assigned plan.
//
// Uses the reliable INLINE pattern (NOT data-composition-src sub-comps, which
// 404 on ../tokens.css and render unstyled). For each beat it:
//   - inlines the style's tokens.css once,
//   - copies the card's <style> block, root DOM, and timeline <script>,
//   - renames the card's data-composition-id to a unique per-beat id (string
//     replace, so CSS selectors + the __timelines key move with it),
//   - strips {paused:true} from the child timeline (a paused child never scrubs
//     inside the master → all .from() content stuck invisible),
//   - fills data-slot text,
//   - re-homes the child timeline onto window.__beatTimelines,
// then nests every child timeline into ONE master timeline (the only thing on
// window.__timelines["<slug>"]) that fades each beat in/out. The clean video
// mounts as <video muted> (track 0) + sibling <audio> (track 1).
//
// Usage:
//   node build-beats.mjs <plan.cards.json> --out video-projects/<slug>/index.html
//     [--library style-library] [--duration <seconds>]

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join, resolve, relative, basename } from "node:path";
import { execFileSync } from "node:child_process";

const argv = process.argv.slice(2);
if (argv.length === 0 || argv[0].startsWith("--")) {
  console.error("usage: build-beats.mjs <plan.cards.json> --out index.html [--library DIR] [--duration SEC]");
  process.exit(1);
}
const planPath = argv[0];
const opt = (name, def) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : def;
};
const outPath = opt("--out", null);
if (!outPath) {
  console.error("--out <index.html> is required");
  process.exit(1);
}
const libraryDir = resolve(opt("--library", "style-library"));
const plan = JSON.parse(readFileSync(planPath, "utf8"));

const slug = basename(dirname(resolve(outPath))) || "composition";
const W = plan.width || 1920;
const H = plan.height || 1080;
const outDir = dirname(resolve(outPath));

// ---- resolve total duration (video length) -------------------------------
let TOTAL = plan.duration ? Number(opt("--duration", plan.duration)) : Number(opt("--duration", "0"));
const videoAbs = plan.video ? resolve(plan.video) : null;
if (!TOTAL && videoAbs && existsSync(videoAbs)) {
  try {
    const out = execFileSync(
      "ffprobe",
      ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", videoAbs],
      { encoding: "utf8" }
    );
    TOTAL = parseFloat(out.trim());
  } catch {
    /* ffprobe missing — fall through */
  }
}
const maxBeatEnd = Math.max(0, ...plan.beats.map((b) => b.start + b.duration));
if (!TOTAL) TOTAL = maxBeatEnd + 2;
TOTAL = Math.max(TOTAL, maxBeatEnd);

// video src relative to the output index.html
const videoSrc = videoAbs ? relative(outDir, videoAbs) : "assets/clean.mp4";

// ---- helpers -------------------------------------------------------------
function readCard(file) {
  const abs = join(libraryDir, file);
  if (!existsSync(abs)) throw new Error(`card file not found: ${abs}`);
  return readFileSync(abs, "utf8");
}
const firstMatch = (s, re) => {
  const m = s.match(re);
  return m ? m[1] : null;
};
// extract the root DOM (body minus <script> blocks)
function extractDom(html) {
  const body = firstMatch(html, /<body[^>]*>([\s\S]*?)<\/body>/i);
  if (!body) throw new Error("no <body> in card");
  return body.replace(/<script[\s\S]*?<\/script>/gi, "").trim();
}
// the inline timeline script = the <script> whose body references __timelines
function extractTimelineJs(html) {
  const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)];
  const tl = scripts.find((m) => /__timelines/.test(m[1]));
  if (!tl) throw new Error("no inline timeline <script> with window.__timelines");
  return tl[1];
}
const escAttr = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
// fill leaf data-slot elements (value is treated as HTML so <em> works)
function fillSlots(dom, slots) {
  let out = dom;
  for (const [name, value] of Object.entries(slots || {})) {
    if (value == null) continue; // absent/null → leave placeholder (build warns)
    // "" is an INTENTIONAL blank → empty the element so the placeholder is hidden
    const re = new RegExp(`(<(\\w+)[^>]*\\bdata-slot="${name}"[^>]*>)([\\s\\S]*?)(<\\/\\2>)`, "i");
    if (!re.test(out)) continue;
    out = out.replace(re, `$1${value}$4`);
  }
  return out;
}
// apply raw [selector-ish id/class, text] overrides for cards that bake values
function applyRaw(dom, raw) {
  let out = dom;
  for (const [sel, value] of raw || []) {
    // sel is a bare class or id token, e.g. ".price-val" or "#cid-w1"
    const token = sel.replace(/^[.#]/, "");
    const attr = sel.startsWith("#") ? "id" : "class";
    const re = new RegExp(`(<(\\w+)[^>]*\\b${attr}="[^"]*\\b${token}\\b[^"]*"[^>]*>)([\\s\\S]*?)(<\\/\\2>)`, "i");
    out = out.replace(re, `$1${value}$4`);
  }
  return out;
}

// ---- per-style tokens (inlined once each) --------------------------------
const tokenCache = {};
function tokensFor(cardFile) {
  // cardFile like "01-vox-explainer/cards/tier1/t1-...html" → "01-vox-explainer/tokens.css"
  const styleFolder = cardFile.split("/")[0];
  if (tokenCache[styleFolder] !== undefined) return { styleFolder, css: tokenCache[styleFolder] };
  const p = join(libraryDir, styleFolder, "tokens.css");
  const css = existsSync(p) ? readFileSync(p, "utf8") : "";
  tokenCache[styleFolder] = css;
  return { styleFolder, css };
}

// ---- build beats ---------------------------------------------------------
const cardStyles = [];
const beatDoms = [];
const timelineScripts = [];
const masterLines = [];
const usedTokenFolders = new Set();
const issues = [];

plan.beats.forEach((beat, n) => {
  const beatId = `beat${String(n + 1).padStart(3, "0")}`;
  let html;
  try {
    html = readCard(beat.card);
  } catch (e) {
    issues.push(`beat ${n} (${beat.cardId}): ${e.message} — skipped`);
    return;
  }
  const compId = firstMatch(html, /data-composition-id="([^"]+)"/);
  if (!compId) {
    issues.push(`beat ${n} (${beat.cardId}): no data-composition-id — skipped`);
    return;
  }

  const { styleFolder } = tokensFor(beat.card);
  usedTokenFolders.add(styleFolder);

  // global rename compId -> beatId across style/dom/js (prefix-safe)
  const rename = (s) => s.split(compId).join(beatId);

  let style = firstMatch(html, /<style[^>]*>([\s\S]*?)<\/style>/i) || "";
  let dom = extractDom(html);
  let js = extractTimelineJs(html);

  style = rename(style);
  dom = rename(dom);
  js = rename(js);

  // slot + raw fills
  dom = fillSlots(dom, beat.slots);
  if (beat.raw) dom = applyRaw(dom, beat.raw);

  // warn about declared slots left unfilled — they keep the card's PLACEHOLDER
  // text, which will leak into the render. (Decorative image slots are exempt.)
  if (beat.cardSlots) {
    // a slot is "handled" if the plan provides the key at all ("" = intentional blank)
    const handled = new Set(Object.keys(beat.slots || {}));
    const unfilled = beat.cardSlots.filter((s) => !handled.has(s) && new RegExp(`data-slot="${s}"`).test(dom));
    if (unfilled.length) {
      issues.push(`beat ${n} (${beat.cardId}): unfilled slot(s) [${unfilled.join(", ")}] will show the card's PLACEHOLDER text — fill them, set to "" intentionally, or pick a card with fewer slots`);
    }
  }

  // turn the card root into a beat layer: strip its comp-id + own data-start,
  // add the beat class + timing attrs.
  dom = dom.replace(
    new RegExp(`(<div\\s+id="${beatId}"[^>]*?)>`),
    (m, open) => {
      let o = open
        .replace(/\s+data-composition-id="[^"]*"/, "")
        .replace(/\s+data-start="[^"]*"/, "");
      return `${o} class="beat-layer clip" data-start="${beat.start}" data-duration="${beat.duration}" data-track-index="${beat.track || 2}">`;
    }
  );

  // child timeline: never paused, re-home onto __beatTimelines
  js = js.replace(/gsap\.timeline\(\s*\{\s*paused\s*:\s*true\s*\}\s*\)/g, "gsap.timeline()");
  js = js.split("window.__timelines").join("window.__beatTimelines");

  cardStyles.push(`/* ${beat.cardId} → #${beatId} */\n${style}`);
  beatDoms.push(`    <!-- ${beat.cardId} @ ${beat.start}s -->\n    ${dom}`);
  timelineScripts.push(`/* ${beat.cardId} */\n${js}`);

  const end = beat.start + beat.duration;
  masterLines.push(
    `  MT.fromTo("#${beatId}", { opacity: 0 }, { opacity: 1, duration: 0.4, ease: "power2.out" }, ${beat.start});\n` +
      `  if (window.__beatTimelines["${beatId}"]) MT.add(window.__beatTimelines["${beatId}"], ${beat.start});\n` +
      `  MT.to("#${beatId}", { opacity: 0, duration: 0.4, ease: "power2.in" }, ${Math.max(beat.start, end - 0.4)});`
  );
});

// ---- inline tokens (once per used style) ---------------------------------
const tokensBlock = [...usedTokenFolders]
  .map((f) => `/* tokens: ${f} */\n${tokenCache[f] || ""}`)
  .join("\n");

// ---- emit index.html -----------------------------------------------------
const page = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
${tokensBlock}

    html, body { margin: 0; background: #000; }
    #${slug} { position: absolute; inset: 0; width: ${W}px; height: ${H}px; overflow: hidden; }
    #video-stage { position: absolute; inset: 0; }
    #video-stage video { width: 100%; height: 100%; object-fit: cover; display: block; }
    .beat-layer { position: absolute; inset: 0; opacity: 0; }

${cardStyles.join("\n\n")}
  </style>
</head>
<body>
  <div id="${slug}" data-composition-id="${slug}" data-start="0" data-width="${W}" data-height="${H}">
    <div id="video-stage">
      <video id="bg-video" muted data-start="0" data-duration="${round(TOTAL)}" data-track-index="0" src="${videoSrc}"></video>
      <audio id="bg-audio" data-start="0" data-duration="${round(TOTAL)}" data-track-index="1" src="${videoSrc}"></audio>
    </div>

${beatDoms.join("\n\n")}
  </div>

  <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
  <script>window.__beatTimelines = {};</script>

${timelineScripts.map((s) => `  <script>\n(function(){\n${s}\n})();\n  </script>`).join("\n")}

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

mkdirSync(outDir, { recursive: true });
writeFileSync(outPath, page);

console.log(`assembled ${beatDoms.length}/${plan.beats.length} beats → ${outPath}`);
console.log(`  duration ${round(TOTAL)}s · video ${videoSrc} · styles: ${[...usedTokenFolders].join(", ")}`);
if (issues.length) {
  console.log(`\n${issues.length} issue(s):`);
  for (const i of issues) console.log(`  ⚠ ${i}`);
}
console.log(`\nnext: cd ${dirname(outPath)} && lint + render (see SKILL.md / CLAUDE.md Render Contract)`);

function round(n) {
  return Math.round(n * 100) / 100;
}
