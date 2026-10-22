#!/usr/bin/env node
// Editorial retake pass (cut-mistakes stage 4): piece together the best take
// of every repeated / restarted sentence found by the editorial read.
//
// Cuts are specified as normalized token phrases located in the FRESH
// transcript of the current render, each with a `before` keep-anchor — the
// words that must immediately follow the cut — so duplicated phrases (which is
// what retakes ARE) resolve to the correct occurrence. Fresh words are aligned
// token-by-token to the RAW source transcript (two-pointer with bigram-confirm
// resync) to obtain SOURCE coordinates; never cut via the rendered timeline
// (concat frame-padding drift shifts it by ~1s over ~160 joins).
//
// Where raw/fresh tokenization diverges (raw Scribe merging a doubled word
// into one stretched token), place the cut by hand in `manual` using raw word
// timestamps, or delta-map from a nearby anchor word inside the same keep
// segment (the timeline is continuous within one keep range).
//
// ALWAYS dry-run first and read the printed raw-text line for EVERY cut —
// that table is the review gate. Then re-run with --apply.
//
// usage: node retake-pass.mjs <fresh-transcript.json> <raw-transcript.json>
//        <union-edl.json> <source-video> <output> --specs <specs.json> [--apply]
//
// specs.json: {
//   "specs":  [{ "t": <approx fresh s>, "cut": "<words to remove>", "before": "<words that follow>" }, ...],
//   "manual": [{ "start": <src s>, "end": <src s>, "label": "..." }, ...]
// }

import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const args = process.argv.slice(2);
const [freshPath, rawPath, edlPath, srcVideo, outVideo] = args;
const specsIdx = args.indexOf('--specs');
const apply = args.includes('--apply');
if (!freshPath || !rawPath || !edlPath || !srcVideo || !outVideo || specsIdx < 0) {
  console.error('usage: retake-pass.mjs <fresh.json> <raw.json> <union-edl.json> <source> <output> --specs <specs.json> [--apply]');
  process.exit(2);
}
const { specs = [], manual = [] } = JSON.parse(fs.readFileSync(args[specsIdx + 1], 'utf8'));

const norm = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const toks = words => words.map(w => ({ ...w, n: norm(w.text) })).filter(w => w.n);
const fresh = toks(JSON.parse(fs.readFileSync(freshPath, 'utf8')).words.filter(w => !w.type || w.type === 'word'));
const raw = toks(JSON.parse(fs.readFileSync(rawPath, 'utf8')).words.filter(w => !w.type || w.type === 'word'));

// align fresh -> raw
const map = new Array(fresh.length).fill(null);
let r = 0, unmatched = 0;
for (let f = 0; f < fresh.length; f++) {
  if (r < raw.length && raw[r].n === fresh[f].n) { map[f] = r++; continue; }
  let found = -1;
  for (let j = r; j < Math.min(raw.length, r + 80); j++) {
    if (raw[j].n === fresh[f].n &&
        (f + 1 >= fresh.length || j + 1 >= raw.length ||
         raw[j + 1].n === fresh[f + 1].n ||
         (j + 2 < raw.length && raw[j + 2].n === fresh[f + 1].n))) { found = j; break; }
  }
  if (found >= 0) { map[f] = found; r = found + 1; }
  else unmatched++;
}
console.log(`aligned ${fresh.length - unmatched}/${fresh.length} fresh words (${unmatched} unmatched)`);

function locate(spec) {
  const cut = spec.cut.split(/\s+/).map(norm).filter(Boolean);
  const before = spec.before.split(/\s+/).map(norm).filter(Boolean).slice(0, 5);
  for (let i = 0; i < fresh.length; i++) {
    if (Math.abs(fresh[i].start - spec.t) > 25) continue;
    let ok = true;
    for (let k = 0; k < cut.length; k++) if (!fresh[i + k] || fresh[i + k].n !== cut[k]) { ok = false; break; }
    if (!ok) continue;
    for (let k = 0; k < before.length; k++) if (!fresh[i + cut.length + k] || fresh[i + cut.length + k].n !== before[k]) { ok = false; break; }
    if (ok) return { p: i, q: i + cut.length };
  }
  return null;
}

const deletions = [...manual.map(m => ({ start: m.start, end: m.end }))];
manual.forEach(m => console.log(`CUT src ${m.start.toFixed(2)}-${m.end.toFixed(2)} (manual) | ${m.label ?? ''}`));
let failed = 0;
for (const spec of specs) {
  const loc = locate(spec);
  if (!loc) { console.log('NOT FOUND:', JSON.stringify(spec.cut.slice(0, 60)), '@' + spec.t); failed++; continue; }
  let pi = loc.p, qi = loc.q;
  while (pi < loc.q && map[pi] === null) pi++;
  while (qi < fresh.length && map[qi] === null) qi++;
  if (pi >= loc.q || qi >= fresh.length) { console.log('UNMAPPED:', spec.cut.slice(0, 60)); failed++; continue; }
  const s = raw[map[pi]].start - 0.02;
  const e = raw[map[qi]].start - 0.08;   // preserve the kept word's onset
  if (e <= s) { console.log('BAD RANGE:', spec.cut.slice(0, 60)); failed++; continue; }
  const rawText = raw.slice(map[pi], map[qi]).map(w => w.text).join(' ');
  deletions.push({ start: s, end: e });
  console.log(`CUT src ${s.toFixed(2)}-${e.toFixed(2)} (${(e - s).toFixed(2)}s) | raw: "${rawText.slice(0, 110)}"`);
}
console.log(failed ? `\n${failed} SPECS FAILED — fix before applying` : '\nall specs located');

const edl = JSON.parse(fs.readFileSync(edlPath, 'utf8'));
const MIN_KEEP = 0.3;
const dels = deletions.sort((a, b) => a.start - b.start);
let finalKeeps = [];
for (const k of edl.keep_ranges) {
  let cursor = k.start;
  for (const d of dels) {
    if (d.end <= k.start || d.start >= k.end) continue;
    if (d.start > cursor) finalKeeps.push({ start: cursor, end: Math.min(d.start, k.end) });
    cursor = Math.max(cursor, d.end);
  }
  if (cursor < k.end) finalKeeps.push({ start: cursor, end: k.end });
}
finalKeeps = finalKeeps.filter(k => k.end - k.start >= MIN_KEEP);
const outDur = finalKeeps.reduce((a, k) => a + (k.end - k.start), 0);
console.log(JSON.stringify({
  cuts: deletions.length,
  cutSeconds: +dels.reduce((a, d) => a + (d.end - d.start), 0).toFixed(1),
  finalKeepRanges: finalKeeps.length,
  finalDuration: +outDur.toFixed(2),
}, null, 2));
if (failed) process.exit(1);
if (!apply) { console.log('dry run — EDL untouched; re-run with --apply to write + render'); process.exit(0); }

const srcDur = edl.source_duration;
const unionDeletes = [];
let cur = 0;
for (const k of finalKeeps) { if (k.start > cur + 0.001) unionDeletes.push({ start: cur, end: k.start }); cur = k.end; }
if (cur < srcDur - 0.001) unionDeletes.push({ start: cur, end: srcDur });
fs.writeFileSync(edlPath, JSON.stringify({ source_duration: srcDur, edited_duration: +outDur.toFixed(3), keep_ranges: finalKeeps, delete_ranges: unionDeletes }, null, 2));

const lines = [];
finalKeeps.forEach((k, i) => {
  lines.push(`[0:v]trim=start=${k.start.toFixed(4)}:end=${k.end.toFixed(4)},setpts=PTS-STARTPTS[v${i}];`);
  lines.push(`[0:a]atrim=start=${k.start.toFixed(4)}:end=${k.end.toFixed(4)},asetpts=PTS-STARTPTS[a${i}];`);
});
lines.push(finalKeeps.map((_, i) => `[v${i}][a${i}]`).join('') + `concat=n=${finalKeeps.length}:v=1:a=1[v][a]`);
const filterPath = outVideo.replace(/\.[^.]+$/, '') + '.retake-filter.txt';
fs.writeFileSync(filterPath, lines.join('\n'));

const ff = ['-y', '-i', srcVideo, '-/filter_complex', filterPath, '-map', '[v]', '-map', '[a]',
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', outVideo];
console.log('ffmpeg ' + ff.join(' '));
execFileSync('ffmpeg', ff, { stdio: 'inherit' });
