#!/usr/bin/env node
// Generate the 09-higgsfield parametric variant pool: 100 cards per purpose
// (section, thesis, stat, overview, quote, label, list, media, lower-third,
// pip, highlight). Deterministic: axes -> cartesian combos -> seeded shuffle
// -> first 100. Emits card HTML under cards/variants/, merges the records
// into style.json (variants replace prior variants; the 20 curated cards are
// preserved), then you re-run build-registry.mjs.
// Usage: node scripts/style-library/gen-higgsfield-variants.mjs
import { mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { lcg, shuffle, combos } from "./higgsfield-variants/util.mjs";
import * as T1 from "./higgsfield-variants/families-t1.mjs";
import * as T2 from "./higgsfield-variants/families-t2.mjs";

const STYLE = resolve(dirname(fileURLToPath(import.meta.url)), "../../style-library/09-higgsfield");
const PER_SECTION = 100;

/* Weighted concat: build combos per base config, tag with base params. */
function pool(configs) {
  const out = [];
  for (const { base, axes } of configs) for (const c of combos(axes)) out.push({ ...c, ...base });
  return out;
}

const TIMING = [1, 1.3];
const TIMING3 = [1, 1.15, 1.3];
const ENTR = ["slide-side", "rise", "pop", "blur"];

const PLANS = [
  { purpose: "section", build: T1.buildSection, seed: 101, configs: [
    { base: {}, axes: { canvas: ["navy", "olive", "cream"], glass: [0, 1], align: ["center", "left"],
      entrance: ENTR, size: ["mega", "display"], timing: TIMING, order: ["kicker-first", "title-first"] } },
  ]},
  { purpose: "thesis", build: T1.buildThesis, seed: 202, configs: [
    { base: {}, axes: { canvas: ["navy", "olive", "cream"], glass: [0, 1], align: ["center", "left"],
      emStyle: ["lime", "highlight"], size: ["big", "med"], timing: TIMING3, entrance: ["word-stagger"] } },
  ]},
  { purpose: "stat", build: T1.buildStat, seed: 303, configs: [
    { base: {}, axes: { canvas: ["navy", "olive", "cream"], glass: [0, 1], numStyle: ["lime", "gradient"],
      countup: [true, false], size: ["mega", "display"], timing: TIMING, entrance: ["pop", "rise"] } },
  ]},
  { purpose: "overview", build: T1.buildOverview, seed: 404, configs: [
    { base: {}, axes: { canvas: ["navy", "olive", "cream"], glass: [0, 1], align: ["center", "left"],
      numbering: ["plain", "padded"], tilt: ["none", "left", "right"], flip: ["lime", "white"], timing: TIMING } },
  ]},
  { purpose: "quote", build: T1.buildQuote, seed: 505, configs: [
    { base: {}, axes: { canvas: ["navy", "olive", "cream"], glass: [0, 1], emStyle: ["lime", "highlight"],
      size: ["big", "med"], timing: TIMING3, entrance: ["word-stagger", "rise"] } },
  ]},
  { purpose: "label", build: T2.buildLabel, seed: 606, configs: [
    { base: { base: "kinetic" }, axes: { side: ["left", "right"], lines: [1, 2], flip: ["lime", "white"],
      entrance: ENTR, y: [180, 250, 320], timing: TIMING } },
    { base: { base: "glasschip" }, axes: { side: ["left", "right"], iconDot: [true, false],
      entrance: ["slide-side", "pop"], y: [160, 240, 320], timing: TIMING } },
    { base: { base: "slam" }, axes: { pos: ["low", "high"], size: ["big", "med"], timing: TIMING } },
    { base: { base: "tags" }, axes: { count: [2, 3], dimStyle: ["soft", "hard"], timing: TIMING } },
    { base: { base: "arrow" }, axes: { side: ["left", "right"], flip: ["lime"], entrance: ["rise", "pop"],
      y: [180, 260], timing: TIMING } },
  ]},
  { purpose: "list", build: T2.buildList, seed: 707, configs: [
    { base: {}, axes: { glass: [1, 0], side: ["left", "right"], items: [2, 3, 4],
      numbering: ["plain", "padded"], entrance: ["slide-side", "pop"], y: [170, 230, 300], timing: TIMING } },
  ]},
  { purpose: "media", build: T2.buildMedia, seed: 808, configs: [
    { base: { base: "glass" }, axes: { side: ["left", "right"], slots: [1, 2], orient: ["square", "land", "portrait"],
      lit: [true, false], labelPos: ["bottom", "top", "none"], entrance: ["slide-side", "pop"], y: [170, 240], timing: TIMING } },
    { base: { base: "paper" }, axes: { side: ["left", "right"], rot: [-2.5, 0, 2.5], timing: TIMING } },
  ]},
  { purpose: "lower-third", build: T2.buildLowerThird, seed: 909, configs: [
    { base: {}, axes: { skin: ["glass", "den"], shape: ["pill", "bar"], pos: ["left", "right", "center"],
      dot: [true, false], role: [true, false], timing: TIMING3 } },
  ]},
  { purpose: "pip", build: T2.buildPip, seed: 1010, configs: [
    { base: {}, axes: { corner: ["br", "bl", "tr", "tl"], size: ["big", "std"], skin: ["glass", "den"],
      pill: [true, false], timing: TIMING3, breathe: [true, false] } },
  ]},
  { purpose: "highlight", build: T2.buildHighlight, seed: 1111, configs: [
    { base: {}, axes: { chipPos: ["tl", "tr", "bl", "br"], scrim: ["soft", "heavy"], pulse: [true, false],
      ringW: [3, 4, 5], timing: TIMING3 } },
  ]},
];

// clean prior variants
const variantsDir = join(STYLE, "cards/variants");
if (existsSync(variantsDir)) rmSync(variantsDir, { recursive: true });

const records = [];
let written = 0;
for (const plan of PLANS) {
  const all = pool(plan.configs);
  const rnd = lcg(plan.seed);
  let picked = shuffle(all, rnd);
  // if the axes space is smaller than PER_SECTION, cycle with timing jitter
  while (picked.length < PER_SECTION) picked = picked.concat(shuffle(all, rnd));
  picked = picked.slice(0, PER_SECTION);
  picked.forEach((p, i) => {
    const rec = plan.build(p, i + 1);
    const outPath = join(STYLE, rec.file);
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, rec.html);
    const { html, ...meta } = rec;
    records.push({ ...meta, generated: true,
      preview: { mp4: `preview/${rec.id}.mp4`, poster: `preview/${rec.id}.png` } });
    written++;
  });
  console.log(`${plan.purpose}: ${PER_SECTION} variants (axes space ${all.length})`);
}

// merge into style.json: keep curated (non-generated) cards, replace variants
const manifestPath = join(STYLE, "style.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const curated = manifest.cards.filter((c) => !c.generated);
manifest.cards = [...curated, ...records];
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");

console.log(JSON.stringify({ written, curated: curated.length, total: manifest.cards.length }, null, 2));
