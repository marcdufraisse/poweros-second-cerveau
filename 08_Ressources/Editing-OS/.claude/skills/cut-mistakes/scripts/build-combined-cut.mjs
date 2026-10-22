#!/usr/bin/env node
// Combined silence + mistake cut in ONE ffmpeg pass (no double encode).
// Mistake cuts are given in EDITED-timeline seconds (post cut-silences);
// they are mapped back to source coords via the silence EDL keep ranges,
// unioned with the silence delete ranges, and rendered with a single
// trim/atrim + concat filtergraph.
//
// Emits <output-stem>.union-edl.json — the source-coord EDL of what was
// actually rendered. Downstream scripts (patch-residual-silences, retake-pass,
// verify-cuts' ledger sweep) all consume this file.
//
// MIN_KEEP: a keep sliver shorter than 0.3s between two deletes flashes for
// 2-4 frames — it is bridged into the surrounding delete instead of kept.
//
// usage: node build-combined-cut.mjs <silence-edl.json> <cuts.json> <source-video> <output> [--apply]

import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const [edlPath, cutsPath, srcVideo, outVideo] = process.argv.slice(2);
const apply = process.argv.includes('--apply');
if (!edlPath || !cutsPath || !srcVideo || !outVideo) {
  console.error('usage: build-combined-cut.mjs <silence-edl.json> <cuts.json> <source-video> <output> [--apply]');
  process.exit(2);
}

const edl = JSON.parse(fs.readFileSync(edlPath, 'utf8'));
const cuts = JSON.parse(fs.readFileSync(cutsPath, 'utf8')).cuts;

// build edited->source mapping from keep ranges
const keeps = edl.keep_ranges.map(r => ({ start: r.start, end: r.end }));
let acc = 0;
const segs = keeps.map(k => {
  const s = { srcStart: k.start, srcEnd: k.end, edStart: acc, edEnd: acc + (k.end - k.start) };
  acc = s.edEnd;
  return s;
});
function editedToSource(t) {
  for (const s of segs) {
    if (t <= s.edEnd + 1e-6 && t >= s.edStart - 1e-6) return s.srcStart + (t - s.edStart);
  }
  if (t >= acc) return segs[segs.length - 1].srcEnd;
  throw new Error('unmappable edited time ' + t);
}

// mistake cuts -> source delete ranges
const mistakeDeletes = cuts.map(c => ({ start: editedToSource(c.start), end: editedToSource(c.end), reason: c.reason }));

// union all deletes
const allDeletes = [...edl.delete_ranges.map(d => ({ start: d.start, end: d.end })), ...mistakeDeletes]
  .sort((a, b) => a.start - b.start);
const merged = [];
for (const d of allDeletes) {
  const last = merged[merged.length - 1];
  if (last && d.start <= last.end + 0.001) last.end = Math.max(last.end, d.end);
  else merged.push({ ...d });
}

// complement -> final keep ranges, bridging sub-MIN_KEEP slivers
const MIN_KEEP = 0.3;
const dur = edl.source_duration;
const finalKeeps = [];
let cursor = 0;
for (const d of merged) {
  if (d.start > cursor + MIN_KEEP) finalKeeps.push({ start: cursor, end: d.start });
  cursor = Math.max(cursor, d.end);
}
if (cursor < dur - 0.02) finalKeeps.push({ start: cursor, end: dur });

const outDur = finalKeeps.reduce((a, k) => a + (k.end - k.start), 0);
console.log(JSON.stringify({
  sourceDuration: dur,
  silenceEditedDuration: edl.edited_duration,
  mistakeCuts: cuts.length,
  finalKeepRanges: finalKeeps.length,
  finalDuration: +outDur.toFixed(2),
}, null, 2));

// union EDL (source coords) for downstream scripts + verify's ledger sweep
const stem = outVideo.replace(/\.[^.]+$/, '');
const unionDeletes = [];
let cur = 0;
for (const k of finalKeeps) { if (k.start > cur + 0.001) unionDeletes.push({ start: cur, end: k.start }); cur = k.end; }
if (cur < dur - 0.001) unionDeletes.push({ start: cur, end: dur });
fs.writeFileSync(stem + '.union-edl.json', JSON.stringify({
  source_duration: dur, edited_duration: +outDur.toFixed(3),
  keep_ranges: finalKeeps, delete_ranges: unionDeletes,
}, null, 2));

// filtergraph
const lines = [];
finalKeeps.forEach((k, i) => {
  lines.push(`[0:v]trim=start=${k.start.toFixed(4)}:end=${k.end.toFixed(4)},setpts=PTS-STARTPTS[v${i}];`);
  lines.push(`[0:a]atrim=start=${k.start.toFixed(4)}:end=${k.end.toFixed(4)},asetpts=PTS-STARTPTS[a${i}];`);
});
lines.push(finalKeeps.map((_, i) => `[v${i}][a${i}]`).join('') + `concat=n=${finalKeeps.length}:v=1:a=1[v][a]`);
const filterPath = stem + '.filter.txt';
fs.writeFileSync(filterPath, lines.join('\n'));

// per-cut source-coord log
const fmt = t => { const m = Math.floor(t / 60), s = (t % 60).toFixed(2).padStart(5, '0'); return `${m}:${s}`; };
const cutlist = mistakeDeletes.map((d, i) => `${String(i + 1).padStart(2)}. src ${fmt(d.start)} - ${fmt(d.end)} (${(d.end - d.start).toFixed(2)}s)  ${d.reason}`).join('\n');
fs.writeFileSync(stem + '.cutlist.md', `# Mistake cuts (source timecodes)\n\n${cutlist}\n`);

const args = ['-y', '-i', srcVideo, '-/filter_complex', filterPath, '-map', '[v]', '-map', '[a]',
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', outVideo];
console.log('ffmpeg ' + args.join(' '));
if (apply) execFileSync('ffmpeg', args, { stdio: 'inherit' });
