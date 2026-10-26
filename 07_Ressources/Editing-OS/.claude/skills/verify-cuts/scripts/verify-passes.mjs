#!/usr/bin/env node
// verify-passes.mjs — the mechanical half of the passing agent (Agent 2.5).
// Runs THREE verification passes over the re-transcribed rendered video:
//   PASS 1  SILENCE SWEEP  — residual gaps / head / tail dead air
//   PASS 2  CUTS SWEEP     — approved-cut phrases gone, residual stutters
//   PASS 3  LEDGER SWEEP   — EDL math, EDL chain continuity, rendered duration,
//                            optional script coverage
//
// Usage:
//   node verify-passes.mjs <fresh-transcript.json> \
//     [--video clean.mp4] [--edl silence-edl.json --edl mistakes-edl.json] \
//     [--candidates cut-candidates.json --cuts approved-cuts.json] \
//     [--phrases checks.json] [--script script.txt] \
//     [--gap 0.75] [--head-max 0.6] [--tail-max 0.9] [--report report.md]
//
// <fresh-transcript.json> MUST be a re-transcription of the RENDERED clean
// video (not a re-timed transcript) — the whole point is checking what was
// actually rendered. Exit code 0 = all passes clean (warnings allowed),
// 1 = at least one FAIL.

import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

// ---------- args ------------------------------------------------------------
const args = process.argv.slice(2);
if (!args.length) {
  console.error("usage: verify-passes.mjs <fresh-transcript.json> [options]");
  process.exit(2);
}
const opts = {
  transcript: null, video: null, edls: [], candidates: null, cuts: null,
  phrases: null, script: null, gap: 0.75, headMax: 0.6, tailMax: 0.9, report: null,
};
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--video") opts.video = args[++i];
  else if (a === "--edl") opts.edls.push(args[++i]);
  else if (a === "--candidates") opts.candidates = args[++i];
  else if (a === "--cuts") opts.cuts = args[++i];
  else if (a === "--phrases") opts.phrases = args[++i];
  else if (a === "--script") opts.script = args[++i];
  else if (a === "--gap") opts.gap = parseFloat(args[++i]);
  else if (a === "--head-max") opts.headMax = parseFloat(args[++i]);
  else if (a === "--tail-max") opts.tailMax = parseFloat(args[++i]);
  else if (a === "--report") opts.report = args[++i];
  else if (!opts.transcript) opts.transcript = a;
  else { console.error("unknown arg: " + a); process.exit(2); }
}

const readJSON = (p) => JSON.parse(readFileSync(resolve(p), "utf8"));
const transcript = readJSON(opts.transcript);
const words = (transcript.words || []).filter((w) => !w.type || w.type === "word");
if (!words.length) { console.error("transcript has no words"); process.exit(2); }
const audioDuration = transcript.audio_duration_secs ?? words[words.length - 1].end;

// findings accumulate as { pass, level: "FAIL"|"WARN", msg }
const findings = [];
const add = (pass, level, msg) => findings.push({ pass, level, msg });
const fmt = (t) => {
  const m = Math.floor(t / 60), s = (t % 60).toFixed(2).padStart(5, "0");
  return `${m}:${s}`;
};

// ---------- normalization (token-level, avoids substring false alarms) ------
const normToken = (t) => t.toLowerCase().replace(/[^\p{L}\p{N}']/gu, "");
const tokens = words.map((w) => normToken(w.text)).filter(Boolean);
function phraseTokens(s) {
  return s.split(/\s+/).map(normToken).filter(Boolean);
}
function countOccurrences(phrase) {
  const p = phraseTokens(phrase);
  if (!p.length) return 0;
  let count = 0;
  for (let i = 0; i + p.length <= tokens.length; i++) {
    let hit = true;
    for (let j = 0; j < p.length; j++) if (tokens[i + j] !== p[j]) { hit = false; break; }
    if (hit) count++;
  }
  return count;
}

// ============================================================================
// PASS 1 — SILENCE SWEEP
// ============================================================================
{
  const P = "PASS 1 · silence sweep";
  if (words[0].start > opts.headMax)
    add(P, "FAIL", `head dead air: first word at ${fmt(words[0].start)} (max ${opts.headMax}s)`);
  const tailGap = audioDuration - words[words.length - 1].end;
  if (tailGap > opts.tailMax)
    add(P, "FAIL", `tail dead air: ${tailGap.toFixed(2)}s after last word (max ${opts.tailMax}s)`);
  let residual = 0;
  for (let i = 1; i < words.length; i++) {
    const gap = words[i].start - words[i - 1].end;
    if (gap > opts.gap) {
      residual++;
      add(P, "FAIL",
        `residual pause ${gap.toFixed(2)}s at ${fmt(words[i - 1].end)} between "${words[i - 1].text}" and "${words[i].text}"`);
    }
  }
  if (!residual) add(P, "OK", `no inter-word pause exceeds ${opts.gap}s across ${words.length} words`);
}

// ============================================================================
// PASS 2 — CUTS SWEEP
// ============================================================================
{
  const P = "PASS 2 · cuts sweep";
  // 2a. phrase checks — explicit file takes priority, then derived from
  //     approved cuts x candidates (each approved cut's `removes` text must
  //     be gone from the rendered video).
  const checks = [];
  if (opts.phrases) for (const c of readJSON(opts.phrases)) checks.push(c);
  if (opts.candidates && opts.cuts) {
    const cands = readJSON(opts.candidates).candidates ?? readJSON(opts.candidates);
    const cuts = readJSON(opts.cuts).cuts ?? [];
    for (const cut of cuts) {
      const match = cands.find((c) =>
        c.cut && Math.min(c.cut.end, cut.end) - Math.max(c.cut.start, cut.start) > 0);
      if (match && match.removes && phraseTokens(match.removes).length >= 2)
        checks.push({ phrase: match.removes, expect: 0, from: `approved cut ${fmt(cut.start)}` });
    }
  }
  let phraseFails = 0;
  for (const c of checks) {
    const n = countOccurrences(c.phrase);
    const expect = c.expect ?? 0;
    if (n !== expect) {
      phraseFails++;
      add(P, "FAIL", `phrase count: "${c.phrase}" found ${n}x, expected ${expect}x${c.from ? ` (${c.from})` : ""}`);
    }
  }
  if (checks.length && !phraseFails) add(P, "OK", `all ${checks.length} phrase checks pass`);
  if (!checks.length) add(P, "WARN", "no phrase checks supplied (pass --candidates + --cuts, or --phrases) — cut removal verified by ledger only");

  // 2b. residual stutter scan (immediate word repeats). Judgment territory —
  //     emphasis and rhetoric look identical — so these are WARNs to re-read,
  //     never auto-FAILs.
  let stutters = 0;
  for (let i = 1; i < words.length; i++) {
    const a = normToken(words[i - 1].text), b = normToken(words[i].text);
    if (a && a === b && a.length > 1) {
      stutters++;
      add(P, "WARN", `possible residual stutter "${words[i - 1].text} ${words[i].text}" at ${fmt(words[i - 1].start)} — re-read in context`);
    }
  }
  if (!stutters) add(P, "OK", "no immediate word repeats remain");
}

// ============================================================================
// PASS 3 — LEDGER SWEEP
// ============================================================================
{
  const P = "PASS 3 · ledger sweep";
  const edls = opts.edls.map((p) => ({ path: p, ...readJSON(p) }));

  for (const e of edls) {
    const removed = (e.delete_ranges || []).reduce((s, r) => s + (r.end - r.start), 0);
    if (Math.abs(removed - e.removed) > 0.05)
      add(P, "FAIL", `${e.path}: delete_ranges sum ${removed.toFixed(2)}s != removed ${e.removed}s`);
    if (Math.abs(e.source_duration - e.removed - e.edited_duration) > 0.05)
      add(P, "FAIL", `${e.path}: source - removed != edited (${e.source_duration} - ${e.removed} != ${e.edited_duration})`);
    let prevEnd = -1;
    for (const r of e.delete_ranges || []) {
      if (r.start < prevEnd) { add(P, "FAIL", `${e.path}: overlapping/unsorted delete ranges near ${fmt(r.start)}`); break; }
      prevEnd = r.end;
    }
  }
  for (let i = 1; i < edls.length; i++) {
    if (Math.abs(edls[i - 1].edited_duration - edls[i].source_duration) > 0.1)
      add(P, "FAIL", `EDL chain break: ${edls[i - 1].path} edited ${edls[i - 1].edited_duration}s but ${edls[i].path} source ${edls[i].source_duration}s`);
  }

  const expected = edls.length ? edls[edls.length - 1].edited_duration : null;
  let rendered = audioDuration;
  if (opts.video) {
    try {
      rendered = parseFloat(execFileSync("ffprobe",
        ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", resolve(opts.video)],
        { encoding: "utf8" }).trim());
    } catch (e) { add(P, "WARN", "ffprobe failed on --video; using transcript duration"); }
  }
  if (expected != null) {
    const drift = Math.abs(rendered - expected);
    if (drift > 0.5)
      add(P, "FAIL", `rendered duration ${rendered.toFixed(2)}s vs EDL expectation ${expected.toFixed(2)}s (drift ${drift.toFixed(2)}s)`);
    else
      add(P, "OK", `rendered ${rendered.toFixed(2)}s matches EDL expectation ${expected.toFixed(2)}s (drift ${drift.toFixed(2)}s)`);
  } else add(P, "WARN", "no --edl supplied — duration ledger not checked");

  // optional script coverage: every script sentence (>=4 words) should still
  // be present in the rendered speech. Deliveries deviate from scripts, so
  // misses are WARNs to re-read, not FAILs.
  if (opts.script) {
    const raw = readFileSync(resolve(opts.script), "utf8");
    const sentences = raw.split(/(?<=[.!?])\s+|\n+/).map((s) => s.trim()).filter(Boolean);
    let missed = 0, checked = 0;
    for (const s of sentences) {
      const p = phraseTokens(s);
      if (p.length < 4) continue;
      checked++;
      if (countOccurrences(s) === 0) {
        missed++;
        add(P, "WARN", `script line not found verbatim: "${s.slice(0, 90)}${s.length > 90 ? "…" : ""}"`);
      }
    }
    add(P, missed ? "WARN" : "OK", `script coverage: ${checked - missed}/${checked} sentences found verbatim`);
  }
}

// ---------- report ----------------------------------------------------------
const fails = findings.filter((f) => f.level === "FAIL");
const warns = findings.filter((f) => f.level === "WARN");
const lines = [
  `# Verification passes — ${opts.transcript}`,
  "",
  `Result: ${fails.length ? "FAIL" : "PASS"} · ${fails.length} fail(s), ${warns.length} warning(s)`,
  "",
];
for (const pass of ["PASS 1 · silence sweep", "PASS 2 · cuts sweep", "PASS 3 · ledger sweep"]) {
  lines.push(`## ${pass}`);
  for (const f of findings.filter((x) => x.pass === pass))
    lines.push(`- **${f.level}** ${f.msg}`);
  lines.push("");
}
const report = lines.join("\n");
if (opts.report) writeFileSync(resolve(opts.report), report);
console.log(report);
console.log(JSON.stringify({
  result: fails.length ? "FAIL" : "PASS",
  fails: fails.length, warnings: warns.length,
  report: opts.report || null,
}));
process.exit(fails.length ? 1 : 0);
