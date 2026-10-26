#!/usr/bin/env node
// Transcribe a video/audio file with local whisper.cpp -> word-level JSON.
// Offline drop-in replacement for transcribe-elevenlabs.mjs: same output schema,
// same CLI shape, no API key and no upload. See CLAUDE.md "Transcription".
//
// Usage:
//   node scripts/transcribe-whisper.mjs <input> [options]
//
// Defaults:
//   --output  <input-without-ext>.json next to the source
//   --model   large-v3-turbo (downloaded to models/ on first use)
//   --language en
//   --vad     ON by default (use --no-vad to disable) — see below
//   audio extraction: mono 16 kHz WAV via ffmpeg (whisper's native rate;
//     deleted after transcription unless --keep-audio)
//
// Word-level timing comes from `--max-len 1 --split-on-word`, which makes
// whisper.cpp emit one segment per word.
//
// VAD IS NOT OPTIONAL IN PRACTICE. Without it whisper.cpp smears word
// timestamps across leading silence: on a test clip whose speech provably
// starts at 2.10s (ffmpeg silencedetect), the first word was stamped 0.00s —
// a 2.1s error that would misplace every downstream cut. With silero VAD the
// same word lands at 2.13s. Only pass --no-vad if you are debugging.
//
// Timings are still estimates, so the clamp-stretched-tokens pre-pass in
// cut-silences remains mandatory.

import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync, statSync } from "node:fs";
import { dirname, join, resolve, basename, extname } from "node:path";
import { spawnSync } from "node:child_process";
import { argv, exit, env, stderr } from "node:process";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const WORKSPACE_ROOT = resolve(SCRIPT_DIR, "..");
const MODEL_DIR = join(WORKSPACE_ROOT, "models");
const MODEL_BASE_URL = "https://huggingface.co/ggerganov/whisper.cpp/resolve/main";
const VAD_MODEL_NAME = "ggml-silero-v5.1.2.bin";
const VAD_MODEL_URL = `https://huggingface.co/ggml-org/whisper-vad/resolve/main/${VAD_MODEL_NAME}`;
const AUDIO_EXTS = new Set([".mp3", ".wav", ".flac", ".m4a", ".aac", ".ogg", ".opus", ".webm"]);

// Known ggml model aliases. Anything else is treated as a path to a .bin.
const MODEL_ALIASES = new Set([
  "tiny", "tiny.en", "base", "base.en", "small", "small.en", "medium", "medium.en",
  "large-v1", "large-v2", "large-v3", "large-v3-turbo",
]);

// whisper.cpp emits these as segment text for non-speech audio. They are not words.
const NON_SPEECH = /^[\[(](blank_audio|silence|music|applause|laughter|inaudible|no speech|sound)[\])]$/i;

function die(msg, code = 1) {
  console.error(msg);
  exit(code);
}

// --- parse args ---
const args = argv.slice(2);
if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
  console.log(
    `Usage: node scripts/transcribe-whisper.mjs <input> [--output path] ` +
      `[--model large-v3-turbo|base.en|<path-to.bin>] [--language en] ` +
      `[--threads N] [--prompt "..."] [--no-vad] [--no-align] ` +
      `[--silence-db -30] [--silence-min 0.2] [--keep-audio] [--verbose]`,
  );
  exit(args.length === 0 ? 1 : 0);
}

const opts = {
  input: null,
  output: null,
  model: "large-v3-turbo",
  language: "en",
  threads: null,
  prompt: null,
  vad: true,
  align: true,
  silenceDb: -30,
  silenceMin: 0.2,
  keepAudio: false,
  verbose: false,
};
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--output" || a === "-o") opts.output = args[++i];
  else if (a === "--model" || a === "-m") opts.model = args[++i];
  else if (a === "--language" || a === "--lang" || a === "-l") opts.language = args[++i];
  else if (a === "--threads" || a === "-t") opts.threads = args[++i];
  else if (a === "--prompt") opts.prompt = args[++i];
  else if (a === "--vad") opts.vad = true;
  else if (a === "--no-vad") opts.vad = false;
  else if (a === "--no-align") opts.align = false;
  else if (a === "--silence-db") opts.silenceDb = Number(args[++i]);
  else if (a === "--silence-min") opts.silenceMin = Number(args[++i]);
  else if (a === "--keep-audio") opts.keepAudio = true;
  else if (a === "--verbose" || a === "-v") opts.verbose = true;
  else if (a.startsWith("-")) die(`unknown option: ${a}`);
  else if (!opts.input) opts.input = a;
  else die(`unexpected argument: ${a}`);
}
if (!opts.input) die("no input file given");

const inputPath = resolve(opts.input);
if (!existsSync(inputPath)) die(`input not found: ${inputPath}`);

const inputExt = extname(inputPath).toLowerCase();
const inputDir = dirname(inputPath);
const inputStem = basename(inputPath, extname(inputPath));
const outputPath = resolve(opts.output ?? join(inputDir, `${inputStem}.json`));

// --- locate whisper-cli ---
const whisperBin = (() => {
  for (const candidate of ["whisper-cli", "whisper-cpp", "main"]) {
    const which = spawnSync("which", [candidate], { encoding: "utf8" });
    if (which.status === 0) return which.stdout.trim();
  }
  return null;
})();
if (!whisperBin) {
  die(
    "whisper-cli not found on PATH.\n" +
      "Install it with:  brew install whisper-cpp\n" +
      "(or use the hosted transcriber: node scripts/transcribe-elevenlabs.mjs)",
  );
}

// Fetch a ggml model into models/ on first use. Partial downloads are removed
// so a interrupted fetch can't leave a corrupt file that whisper then rejects.
function ensureModel(path, url, label) {
  if (existsSync(path)) return path;
  console.log(`${label} not found locally, downloading -> ${path}`);
  mkdirSync(MODEL_DIR, { recursive: true });
  const dl = spawnSync("curl", ["-L", "--fail", "--progress-bar", "-o", path, url], {
    stdio: ["ignore", "inherit", "inherit"],
  });
  if (dl.status !== 0) {
    if (existsSync(path)) unlinkSync(path);
    die(`download failed: ${url}`);
  }
  return path;
}

// --- resolve model: alias -> models/ggml-<alias>.bin, downloading on first use ---
let modelPath;
if (MODEL_ALIASES.has(opts.model)) {
  modelPath = ensureModel(
    join(MODEL_DIR, `ggml-${opts.model}.bin`),
    `${MODEL_BASE_URL}/ggml-${opts.model}.bin`,
    `model ${opts.model}`,
  );
} else {
  modelPath = resolve(opts.model);
  if (!existsSync(modelPath)) die(`model not found: ${modelPath}`);
}

// --- resolve the VAD model (silero) — required for usable word timings ---
const vadModelPath = opts.vad
  ? ensureModel(join(MODEL_DIR, VAD_MODEL_NAME), VAD_MODEL_URL, "VAD model silero-v5.1.2")
  : null;

// --- extract audio: 16 kHz mono WAV, whisper's native input format ---
const needsExtraction = !(inputExt === ".wav");
let audioPath = inputPath;
let tempAudioPath = null;

if (needsExtraction) {
  tempAudioPath = join(inputDir, `${inputStem}.whisper.wav`);
  console.log(`extracting audio -> ${basename(tempAudioPath)}`);
  const ff = spawnSync(
    "ffmpeg",
    ["-y", "-i", inputPath, "-vn", "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le", tempAudioPath],
    { stdio: ["ignore", "ignore", "pipe"] },
  );
  if (ff.status !== 0) die(`ffmpeg failed:\n${ff.stderr?.toString() ?? ""}`, ff.status ?? 1);
  audioPath = tempAudioPath;
}

function cleanupAudio() {
  if (tempAudioPath && !opts.keepAudio && existsSync(tempAudioPath)) unlinkSync(tempAudioPath);
}

// --- run whisper.cpp ---
// -ml 1 -sow  => one segment per word (the word-timestamp recipe)
// -oj -ojf    => full JSON with per-segment millisecond offsets
const jsonStem = join(tmpdir(), `whisper-${inputStem}-${statSync(audioPath).size}`);
const whisperArgs = [
  "-m", modelPath,
  "-f", audioPath,
  "-l", opts.language || "auto",
  "-ml", "1",
  "-sow",
  "-oj", "-ojf",
  "-of", jsonStem,
];
if (opts.threads) whisperArgs.push("-t", String(opts.threads));
if (opts.prompt) whisperArgs.push("--prompt", opts.prompt);
if (opts.vad) whisperArgs.push("--vad", "-vm", vadModelPath);
if (!opts.verbose) whisperArgs.push("-np");

const sizeMb = (statSync(audioPath).size / (1024 * 1024)).toFixed(2);
console.log(`transcribing ${basename(audioPath)} (${sizeMb} MB) with ${basename(modelPath)} ...`);

const t0 = Date.now();
const run = spawnSync(whisperBin, whisperArgs, {
  stdio: ["ignore", opts.verbose ? "inherit" : "ignore", opts.verbose ? "inherit" : "pipe"],
});
const dt = ((Date.now() - t0) / 1000).toFixed(1);

if (run.status !== 0) {
  cleanupAudio();
  die(`whisper-cli failed (exit ${run.status}):\n${run.stderr?.toString() ?? ""}`, run.status ?? 1);
}

const rawJsonPath = `${jsonStem}.json`;
if (!existsSync(rawJsonPath)) {
  cleanupAudio();
  die(`whisper produced no JSON at ${rawJsonPath}`);
}

const raw = JSON.parse(readFileSync(rawJsonPath, "utf8"));
unlinkSync(rawJsonPath);

// --- normalize to the ElevenLabs Scribe schema the pipeline consumes ---
const segments = Array.isArray(raw.transcription) ? raw.transcription : [];
if (segments.length === 0) {
  cleanupAudio();
  die("whisper returned no segments (silent or unreadable audio?)");
}

const words = [];
let prevEnd = null;

for (const seg of segments) {
  const text = (seg.text ?? "").trim();
  if (!text) continue;
  if (NON_SPEECH.test(text)) continue;

  const start = Number(seg.offsets?.from) / 1000;
  const end = Number(seg.offsets?.to) / 1000;
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) continue;

  // Punctuation-only segment: fold it onto the previous word rather than
  // emitting a zero-content "word" that downstream cut logic would treat as speech.
  if (!/[\p{L}\p{N}]/u.test(text)) {
    const last = words.at(-1);
    if (last) {
      last.text += text;
      last.end = Math.max(last.end, end);
      prevEnd = last.end;
    }
    continue;
  }

  // -ml 1 -sow yields one word per segment, but guard against multi-word
  // segments by splitting the span proportionally across the tokens.
  const tokens = text.split(/\s+/).filter(Boolean);
  const span = (end - start) / tokens.length;

  tokens.forEach((token, i) => {
    const wStart = start + span * i;
    const wEnd = i === tokens.length - 1 ? end : start + span * (i + 1);

    // Scribe interleaves `spacing` entries between words; downstream filters
    // drop them, but emitting them keeps the schema faithful.
    if (prevEnd !== null && wStart > prevEnd) {
      words.push({ text: " ", start: prevEnd, end: wStart, type: "spacing", speaker_id: "speaker_0" });
    }
    words.push({ text: token, start: wStart, end: wEnd, type: "word", speaker_id: "speaker_0" });
    prevEnd = wEnd;
  });
}

if (words.filter((w) => w.type === "word").length === 0) {
  cleanupAudio();
  die("whisper returned segments but no usable words");
}

// --- alignment pass: snap word edges to real speech ------------------------
// whisper stretches words across pauses instead of leaving gaps. Measured on
// the test clip: three real pauses (0.93s / 0.65s / 0.71s) were entirely
// swallowed by words only 0.54-1.14s long, so cut-silences saw no inter-word
// silence at all and the existing clamp-stretched-tokens pre-pass (>1.2s
// threshold) never fired. Here we detect actual silence and pull word edges
// back to it, which is what re-creates the gaps Agent 1 cuts on.
function detectSilences(path, db, minDur) {
  const out = spawnSync(
    "ffmpeg",
    ["-i", path, "-af", `silencedetect=n=${db}dB:d=${minDur}`, "-f", "null", "-"],
    { encoding: "utf8" },
  );
  const log = `${out.stderr ?? ""}`;
  const ranges = [];
  let open = null;
  for (const line of log.split(/\r?\n/)) {
    const s = line.match(/silence_start:\s*(-?[\d.]+)/);
    if (s) open = Number(s[1]);
    const e = line.match(/silence_end:\s*(-?[\d.]+)/);
    if (e && open !== null) {
      const end = Number(e[1]);
      if (Number.isFinite(open) && Number.isFinite(end) && end > open) {
        ranges.push({ start: open, end });
      }
      open = null;
    }
  }
  return ranges;
}

if (opts.align) {
  const silences = detectSilences(audioPath, opts.silenceDb, opts.silenceMin);
  const spoken = words.filter((w) => w.type === "word");

  // A word lying ENTIRELY inside a long silence is a phantom: whisper parked a
  // stretched token across a pause (observed: "The" spanning 9.87s inside a
  // 12.5s gap at -63 dB). Leaving it alone hides the pause inside a "word", so
  // cut-silences never sees it and 10s of dead air survives to the render.
  // Nothing is audible in such a span, so collapsing the token cannot clip
  // speech; we park it against the speech that follows. Guarded by a minimum
  // silence length so a merely-quiet syllable is never collapsed.
  const PHANTOM_MIN_SILENCE = 0.8;
  const PHANTOM_DUR = 0.1;

  for (const w of spoken) {
    for (const { start: s, end: e } of silences) {
      if (w.end <= s || w.start >= e) continue; // no overlap
      if (w.start >= s && w.end <= e) {
        if (e - s >= PHANTOM_MIN_SILENCE) {
          w.start = Math.max(s, e - PHANTOM_DUR);
          w.end = e;
        }
        break; // handled (or deliberately left alone); later silences can't apply
      }
      if (w.start < s && w.end > e) w.end = s; // swallowed a whole pause -> end at its start
      else if (w.end > s && w.end <= e) w.end = s; // tail bleeds into silence
      else if (w.start >= s && w.start < e) w.start = e; // head starts inside silence
    }
  }

  // Pull each word's start back to the real speech onset when whisper starts it
  // late. Measured: "It's" was stamped 8.02s while audio resumed at 7.89s, so a
  // cut on that gap would clip 0.13s off the word. This only ever moves a start
  // earlier, so it can lengthen a kept word but never clip one.
  for (let i = 0; i < spoken.length; i++) {
    const w = spoken[i];
    const floor = i > 0 ? spoken[i - 1].end : 0;
    let onset = null;
    for (const { end: e } of silences) {
      if (e >= floor && e <= w.start && (onset === null || e > onset)) onset = e;
    }
    if (onset !== null && onset < w.start) w.start = Math.max(floor, onset);
  }

  // Enforce monotonic, non-overlapping, positive-duration words. whisper emits
  // overlapping spans (3 of 28 on the test clip) and clamping can add more.
  const MIN_DUR = 0.02;
  for (let i = 0; i < spoken.length; i++) {
    const w = spoken[i];
    if (i > 0 && w.start < spoken[i - 1].end) w.start = spoken[i - 1].end;
    if (w.end < w.start + MIN_DUR) w.end = w.start + MIN_DUR;
    const next = spoken[i + 1];
    if (next && w.end > next.start && next.start > w.start + MIN_DUR) w.end = next.start;
  }

  // Rebuild the interleaved `spacing` entries against the corrected timings.
  const rebuilt = [];
  spoken.forEach((w, i) => {
    const prev = spoken[i - 1];
    if (prev && w.start > prev.end) {
      rebuilt.push({ text: " ", start: prev.end, end: w.start, type: "spacing", speaker_id: w.speaker_id });
    }
    rebuilt.push(w);
  });
  words.length = 0;
  words.push(...rebuilt);
}

// Source duration from the original input, not the extracted audio, so
// cut-silences trims real tail dead air.
let audioDuration = (() => {
  const probe = spawnSync(
    "ffprobe",
    ["-v", "error", "-show_entries", "format=duration", "-of",
      "default=noprint_wrappers=1:nokey=1", inputPath],
    { encoding: "utf8" },
  );
  const d = Number(probe.stdout?.trim());
  return Number.isFinite(d) ? d : null;
})();
if (audioDuration === null) audioDuration = words.at(-1).end;

const out = {
  language_code: raw.result?.language ?? opts.language ?? "en",
  language_probability: 1,
  text: words.filter((w) => w.type === "word").map((w) => w.text).join(" "),
  words,
  audio_duration_secs: audioDuration,
  transcription_source: "whisper.cpp",
  model: basename(modelPath),
};

writeFileSync(outputPath, JSON.stringify(out, null, 2));
cleanupAudio();

const wordCount = words.filter((w) => w.type === "word").length;
const speed = (audioDuration / Number(dt)).toFixed(1);
console.log(
  `ok ${dt}s (${speed}x realtime) | ${wordCount} words | ` +
    `${audioDuration.toFixed(1)}s audio | ${outputPath}`,
);
