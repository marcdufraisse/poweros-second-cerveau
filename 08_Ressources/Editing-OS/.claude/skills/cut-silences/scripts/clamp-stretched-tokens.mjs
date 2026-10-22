#!/usr/bin/env node
// Pre-pass for cut-silences: fix Scribe stretched tokens BEFORE planning cuts.
// Scribe stretches a word token across a silent screen-recording wait (one
// "So" has spanned 115s; sub-3s stretches are common and hide 1-4s pauses).
// cut-silences only trims BETWEEN words, so a stretched token makes the dead
// air invisible. This script runs silencedetect over the whole source once,
// then clamps any suspicious token (duration > --min) whose span overlaps a
// detected silence: end pulled back to silence start, or start pushed to
// silence end, whichever side the silence covers. Legit long words (spoken
// URLs) contain no detected silence and are left alone.
//
// usage: node clamp-stretched-tokens.mjs <transcript.json> <source-video>
//        [--min 1.2] [--noise -30] [--sil-min 0.6] [--dry]
//
// Writes the clamped transcript IN PLACE (backup at <file>.orig.json) and
// prints a table of every clamp. Run before cut-silences.mjs.

import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const args = process.argv.slice(2);
const [transcriptPath, videoPath] = args;
const opt = (name, dflt) => { const i = args.indexOf('--' + name); return i >= 0 ? parseFloat(args[i + 1]) : dflt; };
const MIN_TOKEN = opt('min', 1.2);
const NOISE = opt('noise', -30);
const SIL_MIN = opt('sil-min', 0.6);
const dry = args.includes('--dry');

if (!transcriptPath || !videoPath) { console.error('usage: clamp-stretched-tokens.mjs <transcript.json> <video> [--min 1.2] [--noise -30] [--sil-min 0.6] [--dry]'); process.exit(2); }

// one silencedetect pass over the whole source (ffmpeg reports on stderr)
const stderr = execFileSync('sh', ['-c',
  `ffmpeg -hide_banner -i "${videoPath.replace(/"/g, '\\"')}" -vn -af silencedetect=noise=${NOISE}dB:d=${SIL_MIN} -f null - 2>&1`],
  { maxBuffer: 64 * 1024 * 1024 }).toString();
const silences = [];
const starts = [...stderr.matchAll(/silence_start: ([\d.]+)/g)].map(m => +m[1]);
const ends = [...stderr.matchAll(/silence_end: ([\d.]+)/g)].map(m => +m[1]);
for (let i = 0; i < ends.length; i++) silences.push({ start: starts[i], end: ends[i] });
console.log(`silences >= ${SIL_MIN}s at ${NOISE}dB: ${silences.length}`);

const t = JSON.parse(fs.readFileSync(transcriptPath, 'utf8'));
let clamped = 0;
for (const w of t.words) {
  if (w.type && w.type !== 'word') continue;
  if (w.end - w.start <= MIN_TOKEN) continue;
  for (const s of silences) {
    const lo = Math.max(s.start, w.start), hi = Math.min(s.end, w.end);
    if (hi - lo < SIL_MIN * 0.8) continue;               // silence must really sit inside the token
    const before = `${w.start.toFixed(2)}-${w.end.toFixed(2)}`;
    if (s.start > w.start + 0.05 && s.end >= w.end - 0.05) w.end = +s.start.toFixed(3);        // silence covers the tail
    else if (s.start <= w.start + 0.05 && s.end < w.end - 0.05) w.start = +s.end.toFixed(3);   // silence covers the head
    else if (s.start > w.start + 0.05 && s.end < w.end - 0.05) w.end = +s.start.toFixed(3);    // silence in the middle: keep leading speech
    else continue;
    clamped++;
    console.log(`CLAMP "${w.text}" ${before} -> ${w.start.toFixed(2)}-${w.end.toFixed(2)}`);
    break;
  }
}
console.log(clamped ? `${clamped} tokens clamped` : 'no stretched tokens found');
if (!dry && clamped) {
  const backup = transcriptPath.replace(/\.json$/, '.orig.json');
  if (!fs.existsSync(backup)) fs.copyFileSync(transcriptPath, backup);
  fs.writeFileSync(transcriptPath, JSON.stringify(t));
  console.log('written in place, backup at', backup);
}
