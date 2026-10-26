#!/usr/bin/env node
// Agent 3 · step 1 — mechanical beat-candidate detection.
//
// Reads a re-timed word-level transcript (Agent 2's mistakes-transcript.json or
// Agent 1's silence-transcript.json) and proposes motion-graphic beat candidates:
//   tier 1 (full-screen takeover): stat | section | overview
//   tier 2 (overlay):              lower-third | label  (pacing fills)
//
// This is a FIRST PASS only. It cannot tell a meaningful stat from a throwaway
// number, or a real section pivot from a filler "so". The review gate (the agent
// + user) decides which candidates become beats and writes the on-card copy.
//
// Usage:
//   node detect-beats.mjs <transcript.json> [--out-dir DIR] [--gap 30] [--lead 0.4]
//
// Writes <stem>.beat-candidates.json and <stem>.beat-candidates.md next to the
// transcript (or in --out-dir).

import { readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";

// ---- args ----------------------------------------------------------------
const argv = process.argv.slice(2);
if (argv.length === 0 || argv[0].startsWith("--")) {
  console.error("usage: detect-beats.mjs <transcript.json> [--out-dir DIR] [--gap 30] [--lead 0.4]");
  process.exit(1);
}
const inputPath = argv[0];
const opt = (name, def) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : def;
};
const outDir = opt("--out-dir", dirname(inputPath));
const GAP = parseFloat(opt("--gap", "30")); // seconds without a beat → pacing fill
const LEAD = parseFloat(opt("--lead", "0.4")); // start beat this far before anchor

// ---- load transcript -----------------------------------------------------
const tx = JSON.parse(readFileSync(inputPath, "utf8"));
const words = (tx.words || []).filter((w) => w.type !== "spacing" && (w.text || "").trim());
if (words.length === 0) {
  console.error("no words in transcript (expected { words: [{text,start,end,type}] })");
  process.exit(1);
}
const duration = tx.audio_duration_secs || words[words.length - 1].end;

// helper: text of words[i..j] inclusive
const phrase = (i, j) => words.slice(i, j + 1).map((w) => w.text).join(" ").replace(/\s+([.,!?;:])/g, "$1");
// context window around an index
const context = (i, before = 6, after = 10) => phrase(Math.max(0, i - before), Math.min(words.length - 1, i + after));

const candidates = [];
const push = (c) => candidates.push(c);

// ---- 1. STAT candidates (tier 1) ----------------------------------------
// A number that is likely a meaningful figure: %, $, "x times", "x percent",
// large/round integers, multipliers, years. Skip tiny counting numbers.
const NUM_WORD = /\b(million|billion|trillion|thousand|hundred|percent|times|x|hours?|days?|years?|minutes?|dollars?)\b/i;
const hasDigit = (s) => /\d/.test(s);
const cleanNum = (s) => s.replace(/[^0-9.]/g, "");
for (let i = 0; i < words.length; i++) {
  const t = words[i].text;
  const next = words[i + 1]?.text || "";
  const looksStat =
    /[%$]/.test(t) ||
    (hasDigit(t) && (NUM_WORD.test(t) || NUM_WORD.test(next))) ||
    (hasDigit(t) && parseFloat(cleanNum(t)) >= 10) || // 10+ is usually a figure, not "two ways"
    /^\d{4}$/.test(cleanNum(t)); // a year
  if (!looksStat) continue;
  // dedupe: don't fire twice within 4s
  if (candidates.some((c) => c.purpose === "stat" && Math.abs(c.anchorStart - words[i].start) < 4)) continue;
  push({
    tier: 1,
    purpose: "stat",
    anchor: phrase(Math.max(0, i - 1), Math.min(words.length - 1, i + 1)),
    anchorStart: words[i].start,
    start: round(Math.max(0, words[i].start - LEAD)),
    duration: 6,
    confidence: /[%$]/.test(t) || NUM_WORD.test(next) ? "high" : "medium",
    context: context(i),
    suggest: `value: "${t}"  label: <one short phrase: what the number measures>`,
  });
}

// ---- 2. SECTION candidates (tier 1) -------------------------------------
// Cue phrases that mark a pivot / new chapter. Matched at a sentence-ish start
// (after a word that ends in .?! or the very first word).
const SECTION_CUES = [
  "first", "the first", "second", "the second", "third", "the third",
  "next", "finally", "lastly", "the last", "another",
  "here's the thing", "here's the problem", "here's what", "the thing is",
  "the bottleneck", "the problem is", "the question is", "the truth is",
  "the question", "let's talk about", "let me explain", "the real",
  "step one", "step two", "the bottom line", "which brings", "the point is",
];
const isSentenceStart = (i) => i === 0 || /[.!?]$/.test(words[i - 1].text);
const lc = (s) => s.toLowerCase();
for (let i = 0; i < words.length; i++) {
  if (!isSentenceStart(i)) continue;
  // look in the first ~5 words of the sentence (handles "So the first one…")
  const ahead = lc(phrase(i, Math.min(words.length - 1, i + 4)));
  const hit = SECTION_CUES.find((c) => ahead.startsWith(c) || ahead.startsWith("so " + c) || ahead.includes(" " + c + " "));
  if (!hit) continue;
  if (candidates.some((c) => c.purpose === "section" && Math.abs(c.anchorStart - words[i].start) < 8)) continue;
  push({
    tier: 1,
    purpose: "section",
    anchor: phrase(i, Math.min(words.length - 1, i + 3)),
    anchorStart: words[i].start,
    start: round(Math.max(0, words[i].start - LEAD)),
    duration: 7,
    confidence: "medium",
    context: context(i),
    suggest: `kicker: "CHAPTER NN"  headline: <the section in 2-5 words>`,
  });
}

// ---- 3. OVERVIEW candidates (tier 1) ------------------------------------
// "in this video", "three things", "a few", enumerations.
const OVERVIEW_CUES = [
  "in this video", "in this lesson", "in this module", "by the end",
  "three things", "two things", "four things", "a few things",
  "three points", "two points", "couple things", "couple points",
  "here's the plan", "here's what we'll cover", "what we'll cover",
  "there are three", "there are two", "there are four",
  "three ways", "two ways", "a few ways", "points i want", "things i want",
];
for (let i = 0; i < words.length; i++) {
  if (!isSentenceStart(i)) continue;
  // wider window — overview framing often lands a few words in
  const ahead = lc(phrase(i, Math.min(words.length - 1, i + 8)));
  const hit = OVERVIEW_CUES.find((c) => ahead.includes(c));
  if (!hit) continue;
  if (candidates.some((c) => c.purpose === "overview" && Math.abs(c.anchorStart - words[i].start) < 10)) continue;
  push({
    tier: 1,
    purpose: "overview",
    anchor: phrase(i, Math.min(words.length - 1, i + 3)),
    anchorStart: words[i].start,
    start: round(Math.max(0, words[i].start - LEAD)),
    duration: 9,
    confidence: "medium",
    context: context(i, 4, 24),
    suggest: `headline: "In this video"  items: <3-4 short arrow points from what follows>`,
  });
}

// ---- 4. PACING-GAP candidates (tier 2) ----------------------------------
// Any stretch longer than GAP seconds with no tier-1 candidate gets a tier-2
// lower-third fill candidate, anchored to the word nearest the midpoint.
const t1 = candidates.filter((c) => c.tier === 1).map((c) => c.anchorStart).sort((a, b) => a - b);
let cursor = 0;
const marks = [...t1, duration];
for (const m of marks) {
  if (m - cursor > GAP) {
    const mid = cursor + (m - cursor) / 2;
    let wi = words.findIndex((w) => w.start >= mid);
    if (wi < 0) wi = words.length - 1;
    push({
      tier: 2,
      purpose: "lower-third",
      anchor: phrase(wi, Math.min(words.length - 1, wi + 2)),
      anchorStart: words[wi].start,
      start: round(Math.max(0, words[wi].start - LEAD)),
      duration: Math.min(20, round((m - words[wi].start) * 0.5)),
      confidence: "low",
      context: context(wi),
      suggest: `title: <topic label>  subtitle: <the "what this means" in one line>  — PACING FILL, drop if not needed`,
    });
  }
  cursor = m;
}

// ---- sort + write --------------------------------------------------------
candidates.sort((a, b) => a.start - b.start);

const stem = basename(inputPath).replace(/\.json$/, "").replace(/\.(mistakes|silence)-transcript$/, "");
const jsonPath = join(outDir, `${stem}.beat-candidates.json`);
const mdPath = join(outDir, `${stem}.beat-candidates.md`);

writeFileSync(
  jsonPath,
  JSON.stringify(
    { source: inputPath, duration: round(duration), gap: GAP, lead: LEAD, count: candidates.length, candidates },
    null,
    2
  )
);

const byTier = (t) => candidates.filter((c) => c.tier === t);
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
let md = `# Beat candidates — ${stem}\n\n`;
md += `Video ${fmt(duration)} · ${candidates.length} candidates `;
md += `(tier-1: ${byTier(1).length}, tier-2: ${byTier(2).length}). `;
md += `**First pass only** — review in context, drop weak ones, write the copy, then build the plan.\n\n`;
for (const c of candidates) {
  md += `## ${fmt(c.start)} · tier ${c.tier} · ${c.purpose}  _(${c.confidence})_\n`;
  md += `- **anchor:** "${c.anchor}"  → start ${c.start}s, hold ${c.duration}s\n`;
  md += `- **context:** …${c.context}…\n`;
  md += `- **suggest:** ${c.suggest}\n\n`;
}
writeFileSync(mdPath, md);

console.log(`detected ${candidates.length} candidates (${byTier(1).length} tier-1, ${byTier(2).length} tier-2)`);
console.log(`  ${jsonPath}`);
console.log(`  ${mdPath}`);

function round(n) {
  return Math.round(n * 100) / 100;
}
