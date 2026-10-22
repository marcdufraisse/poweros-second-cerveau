#!/usr/bin/env node
// Post-verify fix for residual dead air that survived the first clean render
// (root cause is usually Scribe stretched tokens hiding pauses from the
// transcript-driven trim — see clamp-stretched-tokens.mjs, which reduces but
// does not eliminate this).
//
// Ground truth is ffmpeg silencedetect on the SOURCE audio, not any transcript
// and NOT the rendered timeline: concat accrues ~5.4ms/join frame padding
// (≈0.9s over 160 joins), so rendered-coord mapping would shift cuts into
// speech. Every keep range still containing >= --min-sil of continuous source
// silence is trimmed to a ~0.22s breath. Optional --flubs adds word-anchored
// source-coord cuts in the same pass. Updates the union EDL in place and
// re-renders from the original source in one encode.
//
// usage: node patch-residual-silences.mjs <union-edl.json> <source-video> <output>
//        [--noise -30] [--min-sil 0.6] [--flubs flubs.json] [--apply]
// flubs.json: [{ "start": <src s>, "end": <src s>, "reason": "..." }]

import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const args = process.argv.slice(2);
const [edlPath, srcVideo, outVideo] = args;
const opt = (name, dflt) => { const i = args.indexOf('--' + name); return i >= 0 ? args[i + 1] : dflt; };
const NOISE = parseFloat(opt('noise', -30));
const SIL_MIN = parseFloat(opt('min-sil', 0.6));
const flubsPath = opt('flubs', null);
const apply = args.includes('--apply');
if (!edlPath || !srcVideo || !outVideo) {
  console.error('usage: patch-residual-silences.mjs <union-edl.json> <source-video> <output> [--noise -30] [--min-sil 0.6] [--flubs flubs.json] [--apply]');
  process.exit(2);
}

const stderr = execFileSync('sh', ['-c',
  `ffmpeg -hide_banner -i "${srcVideo.replace(/"/g, '\\"')}" -vn -af silencedetect=noise=${NOISE}dB:d=${SIL_MIN} -f null - 2>&1`],
  { maxBuffer: 64 * 1024 * 1024 }).toString();
const sStarts = [...stderr.matchAll(/silence_start: ([\d.]+)/g)].map(m => +m[1]);
const sEnds = [...stderr.matchAll(/silence_end: ([\d.]+)/g)].map(m => +m[1]);
const silences = sStarts.map((s, i) => ({ start: s, end: sEnds[i] ?? s + SIL_MIN })).filter(s => s.end > s.start);
console.log(`source silences >= ${SIL_MIN}s at ${NOISE}dB: ${silences.length}`);

const edl = JSON.parse(fs.readFileSync(edlPath, 'utf8'));
const keeps = edl.keep_ranges;
const lastKeepEnd = keeps[keeps.length - 1].end;

const deletions = [];
if (flubsPath) {
  const flubs = JSON.parse(fs.readFileSync(flubsPath, 'utf8'));
  deletions.push(...flubs.map(f => ({ start: f.start, end: f.end })));
  console.log(`+ ${flubs.length} manual flub cuts`);
}
for (const k of keeps) {
  for (const s of silences) {
    const lo = Math.max(s.start, k.start), hi = Math.min(s.end, k.end);
    if (hi - lo < SIL_MIN) continue;                       // intentional breaths at joins stay
    const isTail = Math.abs(hi - lastKeepEnd) < 0.05;
    const ds = lo + (isTail ? 0.30 : 0.12);                // keep speech decay / tail pad
    const de = isTail ? hi : hi - 0.10;                    // keep next word's onset
    if (de - ds > 0.15) deletions.push({ start: ds, end: de });
  }
}
deletions.sort((a, b) => a.start - b.start);

const MIN_KEEP = 0.3;
let finalKeeps = [];
for (const k of keeps) {
  let cursor = k.start;
  for (const d of deletions) {
    if (d.end <= k.start || d.start >= k.end) continue;
    if (d.start > cursor) finalKeeps.push({ start: cursor, end: Math.min(d.start, k.end) });
    cursor = Math.max(cursor, d.end);
  }
  if (cursor < k.end) finalKeeps.push({ start: cursor, end: k.end });
}
finalKeeps = finalKeeps.filter(k => k.end - k.start >= MIN_KEEP);
const outDur = finalKeeps.reduce((a, k) => a + (k.end - k.start), 0);
console.log(JSON.stringify({ deletions: deletions.length, finalKeepRanges: finalKeeps.length, finalDuration: +outDur.toFixed(2) }, null, 2));
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
const filterPath = outVideo.replace(/\.[^.]+$/, '') + '.patch-filter.txt';
fs.writeFileSync(filterPath, lines.join('\n'));

const ff = ['-y', '-i', srcVideo, '-/filter_complex', filterPath, '-map', '[v]', '-map', '[a]',
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', outVideo];
console.log('ffmpeg ' + ff.join(' '));
execFileSync('ffmpeg', ff, { stdio: 'inherit' });
