// editing-os/lib/agents.mjs
// Workstream C: /api/agents endpoint logic.
// Derives per-agent activity from the cached snapshot; re-stats only the winning
// evidence files + the sessions dir per call (never triggers a full rescan).

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import { ROOT } from './scan.mjs';

// --- Status tier constants (single source of truth per STUDIO_CONTRACT.md) ---
export const WORK_WINDOW_MS = 900_000;   // 15 minutes
export const WIND_DOWN_MS   = 7_200_000; // 2 hours
export const SESSION_WINDOW_MS = 180_000; // 3 minutes

const PROJECTS_DIR = path.join(ROOT, 'video-projects');

// Claude Code stores per-project session logs under a slug built from the workspace's
// absolute path with every non-alphanumeric run collapsed to a dash. Derive it from ROOT
// so the office lights work on any machine, from any checkout location.
const SESSIONS_DIR = path.join(
  os.homedir(),
  '.claude',
  'projects',
  ROOT.replace(/[^A-Za-z0-9]+/g, '-')
);

// Roster metadata (frozen per STUDIO_CONTRACT.md / STUDIO_SPEC.md).
const ROSTER = [
  { id: 'silences', name: 'Snip',  role: 'Silence Editor'  },
  { id: 'mistakes', name: 'Redo',  role: 'Mistake Editor'  },
  { id: 'verify',   name: 'Vera',  role: 'Verifier'        },
  { id: 'motion',   name: 'Mo',    role: 'Motion Designer' },
  { id: 'broll',    name: 'Scout', role: 'B-roll Scout'    },
];

// Valid status tokens for the force override.
const VALID_STATUSES = new Set(['working', 'winding-down', 'idle']);

// Safe stat wrapper; returns null on any error.
function statSafe(p) {
  try {
    return fs.statSync(p);
  } catch {
    return null;
  }
}

// Derive per-agent evidence candidates from a single project summary as returned
// by the cached snapshot (state.projects[]).  Returns an object keyed by agent id,
// each holding { file, project, mtime } | null.
//
// Attribution rules (from STUDIO_SPEC.md):
//
//   silences — stages[silences].evidence (direct .silence-edl.json OR proxy clean.mp4)
//   mistakes — stages[mistakes].evidence (approved-cuts, cut-candidates, OR proxy clean.mp4)
//   verify   — stages[verify].evidence EXCLUDING proxies whose file is "assets/clean.mp4"
//               (only *.verify.json / *.checks.json count for verify)
//   motion   — stages[motion].evidence across ALL archetypes (index.html, cards/*.html,
//               beat-candidates)
//   broll    — stages[broll].evidence (broll-candidates, assets/broll)
//
// Returns the best (newest) evidence item per agent, or null.
function extractEvidence(project) {
  const slug = project.slug;
  // Map stage-id to agent-id (1:1 for all five).
  // stages array: [{ id, status, evidence: [{ file, kind, mtime }] }]
  const stageMap = {};
  for (const s of project.stages) {
    stageMap[s.id] = s;
  }

  function bestEvidence(stageId, excludeProxy = false) {
    const stage = stageMap[stageId];
    if (!stage || stage.status === 'n-a' || !stage.evidence.length) return null;
    let candidates = stage.evidence;
    if (excludeProxy) {
      // For verify: skip any evidence whose file is (or matches) the clean.mp4 proxy.
      candidates = candidates.filter((e) => {
        const name = path.basename(e.file);
        return name !== 'clean.mp4' && name !== 'edited-clean.mp4';
      });
    }
    if (!candidates.length) return null;
    const best = candidates.reduce((a, b) => (b.mtime > a.mtime ? b : a));
    return { file: best.file, project: slug, mtime: best.mtime };
  }

  return {
    silences: bestEvidence('silences'),          // clean.mp4 allowed
    mistakes: bestEvidence('mistakes'),           // clean.mp4 allowed
    verify:   bestEvidence('verify', true),       // clean.mp4 EXCLUDED
    motion:   bestEvidence('motion'),             // all archetypes included
    broll:    bestEvidence('broll'),
  };
}

// Compute status tier from an age-in-ms value.
function statusFromAgo(ago) {
  if (ago === null || ago === undefined) return 'idle';
  if (ago <= WORK_WINDOW_MS) return 'working';
  if (ago <= WIND_DOWN_MS)   return 'winding-down';
  return 'idle';
}

// Re-stat a single winning evidence file to refresh its mtime.
// Returns the fresh mtime (ms) or the snapshot mtime on failure.
function refreshMtime(winnerFile, winnerProject, snapshotMtime) {
  if (!winnerFile || !winnerProject) return snapshotMtime;
  const abs = path.join(PROJECTS_DIR, winnerProject, winnerFile);
  const st = statSafe(abs);
  if (!st) return snapshotMtime;
  return Math.round(st.mtimeMs);
}

// Compute session lights by stat-ing *.jsonl files directly in SESSIONS_DIR.
// Never reads file contents. Returns { lightsOn, sessionActiveAgo }.
function computeSessionLights(now) {
  let newestMtime = null;
  let entries;
  try {
    entries = fs.readdirSync(SESSIONS_DIR, { withFileTypes: true });
  } catch {
    // Directory missing or unreadable.
    return { lightsOn: false, sessionActiveAgo: null };
  }

  for (const e of entries) {
    if (!e.isFile() || !e.name.endsWith('.jsonl')) continue;
    const abs = path.join(SESSIONS_DIR, e.name);
    const st = statSafe(abs);
    if (!st) continue;
    const m = Math.round(st.mtimeMs);
    if (newestMtime === null || m > newestMtime) newestMtime = m;
  }

  if (newestMtime === null) {
    return { lightsOn: false, sessionActiveAgo: null };
  }

  const sessionActiveAgo = now - newestMtime;
  const lightsOn = sessionActiveAgo <= SESSION_WINDOW_MS;
  return { lightsOn, sessionActiveAgo };
}

// Parse the ?force= query param string.
// Returns a Map<agentId, status> for valid tokens only; invalid tokens silently ignored.
function parseForce(forceParam) {
  const overrides = new Map();
  if (!forceParam || typeof forceParam !== 'string') return overrides;
  for (const token of forceParam.split(',')) {
    const colonIdx = token.indexOf(':');
    if (colonIdx < 0) continue;
    const id = token.slice(0, colonIdx).trim();
    const status = token.slice(colonIdx + 1).trim();
    const validId = ROSTER.some((r) => r.id === id);
    if (!validId || !VALID_STATUSES.has(status)) continue;
    overrides.set(id, status);
  }
  return overrides;
}

// Main export: build the AgentsState object.
// snapshot: the cached scan snapshot (has .state.projects[]).
// forceParam: raw ?force= query string value (may be null/undefined).
export function buildAgentsState(snapshot, forceParam) {
  const now = Date.now();
  const projects = (snapshot && snapshot.state && snapshot.state.projects) || [];

  // 1. Collect best evidence per agent across all projects.
  // winner[agentId] = { file, project, mtime } | null
  const winner = { silences: null, mistakes: null, verify: null, motion: null, broll: null };

  for (const project of projects) {
    const ev = extractEvidence(project);
    for (const id of Object.keys(winner)) {
      const cand = ev[id];
      if (!cand) continue;
      if (!winner[id] || cand.mtime > winner[id].mtime) {
        winner[id] = cand;
      }
    }
  }

  // 2. Re-stat the winning evidence files to get fresh mtimes (<=5 stats).
  for (const id of Object.keys(winner)) {
    const w = winner[id];
    if (!w) continue;
    const freshMtime = refreshMtime(w.file, w.project, w.mtime);
    if (freshMtime !== w.mtime) {
      winner[id] = { ...w, mtime: freshMtime };
    }
  }

  // 3. Session lights (up to ~n stats over the sessions dir entries, 1 stat each).
  const { lightsOn, sessionActiveAgo } = computeSessionLights(now);

  // 4. Parse force overrides.
  const overrides = parseForce(forceParam);

  // 5. Build the agents array in canonical id order.
  const agents = ROSTER.map(({ id, name, role }) => {
    const w = winner[id];
    const ago = w ? now - w.mtime : null;
    let status = statusFromAgo(ago);

    // Apply dev-only force override (mutates status only).
    if (overrides.has(id)) {
      status = overrides.get(id);
    }

    return {
      id,
      name,
      role,
      status,
      project: w ? w.project : null,
      lastArtifact: w ? { file: w.file, project: w.project, mtime: w.mtime } : null,
      ago,
    };
  });

  return { lightsOn, sessionActiveAgo, agents };
}
