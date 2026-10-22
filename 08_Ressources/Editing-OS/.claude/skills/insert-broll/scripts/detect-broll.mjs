#!/usr/bin/env node
// Agent 4 · step 1 — mechanical b-roll / visual-moment detection.
//
// Reads a re-timed word-level transcript and proposes moments that want a visual
// asset laid over the talking head:
//   - named tools / brands / products  → logo or screenshot   (overlay)
//   - websites / URLs / "dot com"       → screenshot           (cutaway)
//   - visual-cue phrases ("imagine…", "picture this", "for example") → illustrative stock (cutaway)
//   - proper-noun entities (people/places/orgs) → stock photo/video (cutaway)
//   - long talking-head stretches       → cutaway pacing fill
//
// First pass only. The review gate (agent + user) confirms moments, sets the final
// sourceType + placement (cutaway vs overlay), and picks/fetches the actual asset.
//
// Usage:
//   node detect-broll.mjs <transcript.json> [--out-dir DIR] [--gap 22] [--lead 0.3]

import { readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";

const argv = process.argv.slice(2);
if (argv.length === 0 || argv[0].startsWith("--")) {
  console.error("usage: detect-broll.mjs <transcript.json> [--out-dir DIR] [--gap 22] [--lead 0.3]");
  process.exit(1);
}
const inputPath = argv[0];
const opt = (n, d) => {
  const i = argv.indexOf(n);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : d;
};
const outDir = opt("--out-dir", dirname(inputPath));
const GAP = parseFloat(opt("--gap", "22"));
const LEAD = parseFloat(opt("--lead", "0.3"));

const tx = JSON.parse(readFileSync(inputPath, "utf8"));
const words = (tx.words || []).filter((w) => w.type !== "spacing" && (w.text || "").trim());
if (!words.length) {
  console.error("no words in transcript (expected { words: [{text,start,end,type}] })");
  process.exit(1);
}
const duration = tx.audio_duration_secs || words[words.length - 1].end;

const phrase = (i, j) => words.slice(i, j + 1).map((w) => w.text).join(" ").replace(/\s+([.,!?;:])/g, "$1");
const context = (i, b = 6, a = 8) => phrase(Math.max(0, i - b), Math.min(words.length - 1, i + a));
const isSentenceStart = (i) => i === 0 || /[.!?]$/.test(words[i - 1].text);
const round = (n) => Math.round(n * 100) / 100;
const bare = (s) => s.replace(/[^A-Za-z0-9.]/g, "");

// known tools / brands → high-confidence logo/screenshot moments
const TOOLS = new Set(
  [
    "chatgpt", "openai", "gpt", "claude", "anthropic", "gemini", "bard", "copilot",
    "perplexity", "midjourney", "dalle", "sora", "runway", "elevenlabs", "notion",
    "slack", "zapier", "make", "airtable", "hubspot", "salesforce", "figma", "canva",
    "zoom", "microsoft", "google", "excel", "sheets", "powerpoint", "gmail", "outlook",
    "youtube", "linkedin", "twitter", "instagram", "tiktok", "facebook", "shopify",
    "stripe", "github", "vscode", "cursor", "replit", "vercel", "aws", "azure",
    "nvidia", "apple", "amazon", "meta", "tesla", "spotify", "netflix", "discord",
  ].map((s) => s)
);
// words that are capitalized but not entities
const STOP_CAPS = new Set([
  "I", "I'm", "I've", "I'll", "I'd", "The", "A", "An", "And", "But", "So", "Or",
  "Now", "Then", "This", "That", "These", "Those", "We", "You", "He", "She", "They",
  "It", "If", "When", "Why", "How", "What", "Who", "Where", "Yes", "No", "Okay", "Ok",
  "Hey", "Hi", "Well", "Look", "Listen", "Right", "Let's", "Here", "There", "My", "Our",
  "Your", "Their", "His", "Her", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday",
]);

const candidates = [];
const near = (purposeStart, sec = 4) => candidates.some((c) => Math.abs(c.anchorStart - purposeStart) < sec);

// ---- 1. URLs / "dot com" (screenshot) -----------------------------------
const URL_RE = /\b([a-z0-9-]+)\.(com|io|ai|org|net|co|app|dev|gg|xyz)\b/i;
for (let i = 0; i < words.length; i++) {
  const t = bare(words[i].text);
  const spokenDot = /^dot$/i.test(words[i].text) && /(com|io|ai|org|net|co)/i.test(words[i + 1]?.text || "");
  if (URL_RE.test(t) || spokenDot) {
    if (near(words[i].start, 3)) continue;
    const site = URL_RE.test(t) ? t : `${bare(words[i - 1]?.text || "")}.${bare(words[i + 1]?.text || "")}`;
    candidates.push({
      sourceType: "screenshot",
      placement: "cutaway",
      anchor: phrase(Math.max(0, i - 1), Math.min(words.length - 1, i + 1)),
      anchorStart: words[i].start,
      start: round(Math.max(0, words[i].start - LEAD)),
      duration: 4,
      concept: site,
      query: `https://${site.toLowerCase()}`,
      confidence: "high",
      context: context(i),
    });
  }
}

// ---- 2. Known tools / brands (logo or screenshot, overlay) --------------
for (let i = 0; i < words.length; i++) {
  const key = bare(words[i].text).toLowerCase();
  if (!TOOLS.has(key)) continue;
  if (near(words[i].start, 5)) continue;
  candidates.push({
    sourceType: "logo",
    placement: "overlay",
    anchor: phrase(Math.max(0, i - 1), Math.min(words.length - 1, i + 1)),
    anchorStart: words[i].start,
    start: round(Math.max(0, words[i].start - LEAD)),
    duration: 4,
    concept: words[i].text.replace(/[^A-Za-z0-9]/g, ""),
    query: `${words[i].text.replace(/[^A-Za-z0-9]/g, "")} logo`,
    confidence: "high",
    context: context(i),
  });
}

// ---- 3. Proper-noun entities (mid-sentence capitalized) → stock ----------
for (let i = 0; i < words.length; i++) {
  const raw = words[i].text;
  if (!/^[A-Z][a-z]+/.test(raw)) continue;
  if (isSentenceStart(i)) continue; // sentence-initial caps are usually not entities
  if (STOP_CAPS.has(raw.replace(/[.,!?;:]$/, ""))) continue;
  if (TOOLS.has(bare(raw).toLowerCase())) continue; // already caught
  // group consecutive caps into one entity (e.g. "New York")
  let j = i;
  while (j + 1 < words.length && /^[A-Z][a-z]+/.test(words[j + 1].text) && !STOP_CAPS.has(words[j + 1].text)) j++;
  if (near(words[i].start, 6)) {
    i = j;
    continue;
  }
  candidates.push({
    sourceType: "stock-photo",
    placement: "cutaway",
    anchor: phrase(i, j),
    anchorStart: words[i].start,
    start: round(Math.max(0, words[i].start - LEAD)),
    duration: 4,
    concept: phrase(i, j),
    query: phrase(i, j),
    confidence: "low",
    context: context(i),
  });
  i = j;
}

// ---- 4. Visual-cue phrases (illustrative stock) -------------------------
const CUES = [
  "imagine", "picture this", "picture a", "think about", "think of", "for example",
  "for instance", "like when", "it's like", "kind of like", "look at this", "check this out",
  "let me show you", "here's an example", "consider",
];
for (let i = 0; i < words.length; i++) {
  const ahead = phrase(i, Math.min(words.length - 1, i + 3)).toLowerCase();
  const hit = CUES.find((c) => ahead.startsWith(c));
  if (!hit) continue;
  if (near(words[i].start, 5)) continue;
  candidates.push({
    sourceType: "stock-video",
    placement: "cutaway",
    anchor: phrase(i, Math.min(words.length - 1, i + 4)),
    anchorStart: words[i].start,
    start: round(Math.max(0, words[i].start - LEAD)),
    duration: 5,
    concept: phrase(i + 1, Math.min(words.length - 1, i + 5)),
    query: phrase(i + 1, Math.min(words.length - 1, i + 4)),
    confidence: "medium",
    context: context(i, 2, 12),
  });
}

// ---- 5. Pacing-gap fills (cutaway) --------------------------------------
const marks = [...candidates.map((c) => c.anchorStart).sort((a, b) => a - b), duration];
let cursor = 0;
for (const m of marks) {
  if (m - cursor > GAP) {
    const mid = cursor + (m - cursor) / 2;
    let wi = words.findIndex((w) => w.start >= mid);
    if (wi < 0) wi = words.length - 1;
    candidates.push({
      sourceType: "stock-video",
      placement: "cutaway",
      anchor: phrase(wi, Math.min(words.length - 1, wi + 3)),
      anchorStart: words[wi].start,
      start: round(Math.max(0, words[wi].start - LEAD)),
      duration: 5,
      concept: "(pacing fill — pick a topical clip or drop)",
      query: phrase(wi, Math.min(words.length - 1, wi + 5)),
      confidence: "low",
      context: context(wi),
    });
  }
  cursor = m;
}

candidates.sort((a, b) => a.start - b.start);

const stem = basename(inputPath).replace(/\.json$/, "").replace(/\.(mistakes|silence|broll)-transcript$/, "");
const jsonPath = join(outDir, `${stem}.broll-candidates.json`);
const mdPath = join(outDir, `${stem}.broll-candidates.md`);

writeFileSync(
  jsonPath,
  JSON.stringify({ source: inputPath, duration: round(duration), gap: GAP, lead: LEAD, count: candidates.length, candidates }, null, 2)
);

const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const tally = {};
for (const c of candidates) tally[c.sourceType] = (tally[c.sourceType] || 0) + 1;
let md = `# B-roll candidates — ${stem}\n\n`;
md += `Video ${fmt(duration)} · ${candidates.length} candidates `;
md += `(${Object.entries(tally).map(([k, v]) => `${k}: ${v}`).join(", ")}). `;
md += `**First pass only** — confirm moments, set cutaway vs overlay, pick/fetch the asset.\n\n`;
for (const c of candidates) {
  md += `## ${fmt(c.start)} · ${c.sourceType} · ${c.placement}  _(${c.confidence})_\n`;
  md += `- **anchor:** "${c.anchor}"  → start ${c.start}s, hold ${c.duration}s\n`;
  md += `- **show:** ${c.concept}  ·  **query:** \`${c.query}\`\n`;
  md += `- **context:** …${c.context}…\n\n`;
}
writeFileSync(mdPath, md);

console.log(`detected ${candidates.length} b-roll candidates (${Object.entries(tally).map(([k, v]) => `${k}:${v}`).join(", ")})`);
console.log(`  ${jsonPath}`);
console.log(`  ${mdPath}`);
