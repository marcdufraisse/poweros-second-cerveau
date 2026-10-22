// editing-os/lib/stages.mjs
// Pure stage-detection engine. Given a compact file/stat inventory of ONE project,
// returns the 9 StageStatus entries per SPEC. The only fs it touches is the bounded
// JSON "words" sniff (via the sniff helper), so the rest stays unit-testable.

import fs from 'node:fs';

export const STAGE_IDS = [
  'source',
  'transcript',
  'silences',
  'mistakes',
  'verify',
  'motion',
  'broll',
  'render',
  'delivered',
];

// The SPEC prescribes a cheap prefix sniff for the ElevenLabs `"words"` key without
// full-parsing. Real ElevenLabs transcripts place a long `text` field before `words`,
// so `"words"` lands ~7-12 KB in. We read a bounded prefix (SNIFF_BYTES) with a single
// fs.readSync and search for the substring. Never full-parses; never reads media.
const SNIFF_BYTES = 16 * 1024;
const MAX_SNIFF_FILES = 12;
const MAX_SNIFF_SIZE = 30 * 1024 * 1024;

// Read up to SNIFF_BYTES from a file and test for the `"words"` key substring.
// Returns false on any error (missing, unreadable, too large).
export function sniffWordsKey(absFile, size) {
  try {
    if (typeof size === 'number' && size > MAX_SNIFF_SIZE) return false;
    const fd = fs.openSync(absFile, 'r');
    try {
      const buf = Buffer.alloc(SNIFF_BYTES);
      const n = fs.readSync(fd, buf, 0, SNIFF_BYTES, 0);
      return buf.toString('utf8', 0, n).includes('"words"');
    } finally {
      fs.closeSync(fd);
    }
  } catch {
    return false;
  }
}

// inv (inventory) shape produced by scan.mjs:
// {
//   archetype: 'talking-head' | 'graphics-only' | 'unknown',
//   assetsFiles: [{ name, rel, abs, mtime, size, isDir }],   // one level in assets/
//   assetsHasBrollDir: boolean,
//   jsonCandidates: [{ name, rel, abs, mtime, size }],       // assets/*.json etc, capped
//   rootIndexHtml: { rel, mtime } | null,
//   cardsHtml: [{ rel, mtime }],                             // cards/*.html
//   renders: [{ file, mtime, kind, ... }],                   // mp4s in renders/
//   deliveryRenders: [{ file, mtime, ... }],                 // renders/final/*.mp4
// }

function ev(file, kind, mtime) {
  return { file, kind, mtime };
}

// Detect the ElevenLabs transcript file among the capped JSON candidates.
function findTranscript(jsonCandidates) {
  const capped = jsonCandidates.slice(0, MAX_SNIFF_FILES);
  for (const j of capped) {
    if (sniffWordsKey(j.abs, j.size)) return j;
  }
  return null;
}

// assets/ file lookups by suffix/exact name.
function assetByName(inv, name) {
  return inv.assetsFiles.find((f) => !f.isDir && f.name === name) || null;
}
function assetBySuffix(inv, suffix) {
  return inv.assetsFiles.find((f) => !f.isDir && f.name.endsWith(suffix)) || null;
}

export function computeStages(inv) {
  const graphicsOnly = inv.archetype === 'graphics-only' || inv.archetype === 'unknown';
  const clean = assetByName(inv, 'clean.mp4');
  const transcript = findTranscript(inv.jsonCandidates);

  const stages = {};

  // --- source ---
  if (inv.archetype === 'graphics-only' || inv.archetype === 'unknown') {
    stages.source = { status: 'n-a', evidence: [] };
  } else {
    const SRC_EXT = ['.mp4', '.mov', '.m4a', '.mkv', '.wav'];
    const EXCLUDE = new Set(['clean.mp4', 'edited-clean.mp4']);
    const realSource = inv.assetsFiles.find((f) => {
      if (f.isDir) return false;
      const lower = f.name.toLowerCase();
      const ext = lower.slice(lower.lastIndexOf('.'));
      if (!SRC_EXT.includes(ext)) return false;
      if (EXCLUDE.has(f.name)) return false;
      if (f.name.endsWith('.silenced.mp4')) return false;
      return true;
    });
    if (realSource) {
      stages.source = { status: 'done', evidence: [ev(realSource.rel, 'direct', realSource.mtime)] };
    } else if (clean) {
      stages.source = { status: 'done', evidence: [ev(clean.rel, 'proxy', clean.mtime)] };
    } else {
      stages.source = { status: 'unknown', evidence: [] };
    }
  }

  // --- transcript ---
  if (graphicsOnly) {
    stages.transcript = { status: 'n-a', evidence: [] };
  } else if (transcript) {
    stages.transcript = { status: 'done', evidence: [ev(transcript.rel, 'direct', transcript.mtime)] };
  } else {
    stages.transcript = { status: 'unknown', evidence: [] };
  }

  // --- silences ---
  if (graphicsOnly) {
    stages.silences = { status: 'n-a', evidence: [] };
  } else {
    const edl = assetBySuffix(inv, '.silence-edl.json');
    if (edl) {
      stages.silences = { status: 'done', evidence: [ev(edl.rel, 'direct', edl.mtime)] };
    } else if (clean) {
      stages.silences = { status: 'done', evidence: [ev(clean.rel, 'proxy', clean.mtime)] };
    } else {
      stages.silences = { status: 'unknown', evidence: [] };
    }
  }

  // --- mistakes ---
  if (graphicsOnly) {
    stages.mistakes = { status: 'n-a', evidence: [] };
  } else {
    const approved = assetByName(inv, 'approved-cuts.json') || assetBySuffix(inv, '.approved-cuts.json');
    const candidates = assetBySuffix(inv, '.cut-candidates.json');
    if (approved) {
      stages.mistakes = { status: 'done', evidence: [ev(approved.rel, 'direct', approved.mtime)] };
    } else if (candidates) {
      stages.mistakes = { status: 'partial', evidence: [ev(candidates.rel, 'direct', candidates.mtime)] };
    } else if (clean) {
      stages.mistakes = { status: 'done', evidence: [ev(clean.rel, 'proxy', clean.mtime)] };
    } else {
      stages.mistakes = { status: 'unknown', evidence: [] };
    }
  }

  // --- verify ---
  if (graphicsOnly) {
    stages.verify = { status: 'n-a', evidence: [] };
  } else {
    const verify = assetBySuffix(inv, '.verify.json') || assetBySuffix(inv, '.checks.json');
    if (verify) {
      stages.verify = { status: 'done', evidence: [ev(verify.rel, 'proxy', verify.mtime)] };
    } else if (clean) {
      stages.verify = { status: 'done', evidence: [ev(clean.rel, 'proxy', clean.mtime)] };
    } else {
      stages.verify = { status: 'unknown', evidence: [] };
    }
  }

  // --- motion ---
  if (graphicsOnly) {
    if (inv.rootIndexHtml) {
      stages.motion = { status: 'done', evidence: [ev(inv.rootIndexHtml.rel, 'direct', inv.rootIndexHtml.mtime)] };
    } else if (inv.cardsHtml.length) {
      const c = inv.cardsHtml[0];
      stages.motion = { status: 'done', evidence: [ev(c.rel, 'direct', c.mtime)] };
    } else {
      stages.motion = { status: 'unknown', evidence: [] };
    }
  } else {
    const beatCand = assetBySuffix(inv, '.beat-candidates.json');
    if (inv.rootIndexHtml) {
      stages.motion = { status: 'done', evidence: [ev(inv.rootIndexHtml.rel, 'direct', inv.rootIndexHtml.mtime)] };
    } else if (beatCand) {
      stages.motion = { status: 'partial', evidence: [ev(beatCand.rel, 'direct', beatCand.mtime)] };
    } else {
      stages.motion = { status: 'unknown', evidence: [] };
    }
  }

  // --- broll ---
  if (graphicsOnly) {
    stages.broll = { status: 'n-a', evidence: [] };
  } else if (inv.assetsHasBrollDir) {
    const dir = inv.assetsFiles.find((f) => f.isDir && f.name === 'broll');
    stages.broll = { status: 'done', evidence: [ev(dir ? dir.rel : 'assets/broll', 'direct', dir ? dir.mtime : 0)] };
  } else {
    const brollCand = assetBySuffix(inv, '.broll-candidates.json');
    if (brollCand) {
      stages.broll = { status: 'partial', evidence: [ev(brollCand.rel, 'direct', brollCand.mtime)] };
    } else {
      stages.broll = { status: 'unknown', evidence: [] };
    }
  }

  // --- render ---
  if (inv.renders.length) {
    stages.render = {
      status: 'done',
      evidence: inv.renders.map((r) => ev(r.file, 'direct', r.mtime)),
    };
  } else {
    stages.render = { status: 'unknown', evidence: [] };
  }

  // --- delivered ---
  if (inv.deliveryRenders.length) {
    stages.delivered = {
      status: 'done',
      evidence: inv.deliveryRenders.map((r) => ev(r.file, 'direct', r.mtime)),
    };
  } else {
    stages.delivered = { status: 'unknown', evidence: [] };
  }

  // Emit in canonical order.
  return STAGE_IDS.map((id) => ({ id, status: stages[id].status, evidence: stages[id].evidence }));
}
