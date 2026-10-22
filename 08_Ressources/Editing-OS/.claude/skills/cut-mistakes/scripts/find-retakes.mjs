#!/usr/bin/env node
// Retake discovery for the editorial read (cut-mistakes stage 4).
// The candidate detector's segment-level jaccard misses most real retakes —
// on a typical re-record-heavy raw take it caught 3 of ~60. This script
// prepares the editorial pass over a FRESH transcript of the rendered cut:
//   1. writes <stem>.sentences.txt — one timestamped sentence per line, for
//      the mandatory top-to-bottom read
//   2. prints SIM lines — sentence pairs within a lookahead window that share
//      an opening 4-gram (restarts almost always reuse their first words) or
//      exceed a token-set jaccard threshold
// The SIM list is an aid, not the deliverable: the agent must still READ the
// whole sentence dump — mid-sentence restarts don't pair as sentences.
//
// usage: node find-retakes.mjs <fresh-transcript.json> [--threshold 0.45] [--lookahead 8]

import fs from 'node:fs';

const args = process.argv.slice(2);
const path = args[0];
const opt = (name, dflt) => { const i = args.indexOf('--' + name); return i >= 0 ? parseFloat(args[i + 1]) : dflt; };
const THRESHOLD = opt('threshold', 0.45);
const LOOKAHEAD = opt('lookahead', 8);
if (!path) { console.error('usage: find-retakes.mjs <fresh-transcript.json> [--threshold 0.45] [--lookahead 8]'); process.exit(2); }

const words = JSON.parse(fs.readFileSync(path, 'utf8')).words.filter(w => !w.type || w.type === 'word');

const sents = [];
let cur = [];
for (const w of words) {
  cur.push(w);
  if (/[.!?]$/.test(w.text) || cur.length > 40) { sents.push(cur); cur = []; }
}
if (cur.length) sents.push(cur);

const fmt = t => Math.floor(t / 60) + ':' + (t % 60).toFixed(1).padStart(4, '0');
const outPath = path.replace(/\.json$/, '') + '.sentences.txt';
fs.writeFileSync(outPath, sents.map(s => fmt(s[0].start) + '  ' + s.map(w => w.text).join(' ')).join('\n'));
console.log(`${sents.length} sentences -> ${outPath}`);

const norm = s => s.map(w => w.text.toLowerCase().replace(/[^a-z0-9']/g, '')).filter(Boolean);
let hits = 0;
for (let i = 0; i < sents.length; i++) {
  for (let j = i + 1; j < Math.min(sents.length, i + 1 + LOOKAHEAD); j++) {
    const A = norm(sents[i]), B = norm(sents[j]);
    if (A.length < 4 || B.length < 4) continue;
    const sa = new Set(A), sb = new Set(B);
    const inter = [...sa].filter(x => sb.has(x)).length;
    const jac = inter / new Set([...A, ...B]).size;
    const sameOpen = A.slice(0, 4).join(' ') === B.slice(0, 4).join(' ');
    if (jac >= THRESHOLD || sameOpen) {
      hits++;
      console.log('SIM', jac.toFixed(2), sameOpen ? 'OPEN' : '    ', '|',
        fmt(sents[i][0].start), A.slice(0, 14).join(' '), '||',
        fmt(sents[j][0].start), B.slice(0, 14).join(' '));
    }
  }
}
console.log(`${hits} similar sentence pairs — now READ the sentence dump end to end`);
