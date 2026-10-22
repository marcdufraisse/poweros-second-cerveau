#!/usr/bin/env node
// Agent 3 · step 3 — assign a library card to each beat in an approved plan.
//
// Reads the approved plan (style + beats with tier/purpose/slots), filters the
// registry by style+tier+purpose, and picks a card per beat with a SEEDED
// rotation that avoids back-to-back repeats within a purpose, so the same
// treatment never appears twice in a row. Writes the plan enriched with a
// `card` (file path) and `cardId` per beat.
//
// Usage:
//   node select-cards.mjs <approved-plan.json> \
//     [--registry style-library/registry.json] [--out plan.cards.json]
//
// Per-beat pinning: add "cardId": "<id>" to a beat and selection respects it.

import { readFileSync, writeFileSync } from "node:fs";

const argv = process.argv.slice(2);
if (argv.length === 0 || argv[0].startsWith("--")) {
  console.error("usage: select-cards.mjs <approved-plan.json> [--registry PATH] [--out PATH]");
  process.exit(1);
}
const planPath = argv[0];
const opt = (name, def) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : def;
};
const registryPath = opt("--registry", "style-library/registry.json");
const outPath = opt("--out", planPath.replace(/\.json$/, "") + ".cards.json");

const plan = JSON.parse(readFileSync(planPath, "utf8"));
const registry = JSON.parse(readFileSync(registryPath, "utf8"));

const styleId = plan.style;
const style = registry.styles.find((s) => s.id === styleId);
if (!style) {
  console.error(`style "${styleId}" not in registry. available: ${registry.styles.map((s) => s.id).join(", ")}`);
  process.exit(1);
}

// tier in the plan is numeric (1|2); registry uses "tier1"/"tier2"
const tierKey = (t) => `tier${t}`;

// deterministic PRNG (mulberry32) seeded from the plan seed string
function hashSeed(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}
function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(hashSeed(String(plan.seed || styleId)));

// seeded shuffle (Fisher-Yates) of a copy
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// build a rotating queue per (tier,purpose): pre-shuffled pool, cycled, never
// repeating the id used immediately before for that purpose.
const queues = {}; // key -> { pool: [...], i, last }
function pickFromPool(tier, purpose) {
  const key = `${tier}.${purpose}`;
  if (!queues[key]) {
    const pool = style.cards.filter((c) => c.tier === tierKey(tier) && c.purpose === purpose);
    queues[key] = { pool: shuffle(pool), i: 0, last: null };
  }
  const q = queues[key];
  if (q.pool.length === 0) return null;
  let pick = q.pool[q.i % q.pool.length];
  q.i++;
  // avoid immediate repeat if the pool has alternatives
  if (q.pool.length > 1 && pick.id === q.last) {
    pick = q.pool[q.i % q.pool.length];
    q.i++;
  }
  q.last = pick.id;
  return pick;
}

const warnings = [];
const beats = plan.beats.map((beat, idx) => {
  let card;
  if (beat.cardId) {
    card = style.cards.find((c) => c.id === beat.cardId);
    if (!card) {
      warnings.push(`beat ${idx} (${beat.start}s): pinned cardId "${beat.cardId}" not found — falling back to rotation`);
    }
  }
  if (!card) card = pickFromPool(beat.tier, beat.purpose);
  if (!card) {
    warnings.push(`beat ${idx} (${beat.start}s): NO card for tier ${beat.tier} / "${beat.purpose}" in style "${styleId}" — beat dropped`);
    return null;
  }
  // slot-compatibility check
  const want = Object.keys(beat.slots || {});
  const have = new Set(card.slots || []);
  const missing = want.filter((k) => !have.has(k) && (beat.slots[k] ?? "") !== "");
  if (missing.length) {
    warnings.push(
      `beat ${idx} (${beat.start}s) → ${card.id}: slot(s) [${missing.join(", ")}] not on this card (it has [${(card.slots || []).join(", ")}]). ` +
        `Those values won't render — rename them, drop them, or pin a card that has them.`
    );
  }
  return { ...beat, cardId: card.id, card: card.file, cardSlots: card.slots || [] };
}).filter(Boolean);

const out = { ...plan, beats };
writeFileSync(outPath, JSON.stringify(out, null, 2));

console.log(`assigned ${beats.length}/${plan.beats.length} beats from style "${styleId}"`);
for (const b of beats) console.log(`  ${String(b.start).padStart(7)}s  tier${b.tier} ${b.purpose.padEnd(12)} → ${b.cardId}`);
if (warnings.length) {
  console.log(`\n${warnings.length} warning(s):`);
  for (const w of warnings) console.log(`  ⚠ ${w}`);
}
console.log(`\nwrote ${outPath}`);
