// editing-os/lib/scan.mjs
// Workspace scanner. Stat-driven only: readdir + stat, plus bounded JSON sniffs,
// tiny meta.json / sidecar reads, NOTES.md (detail only), and the two registry.json.
// Never opens or reads media files.

import fs from 'node:fs';
import path from 'node:path';

import { computeStages, STAGE_IDS } from './stages.mjs';
import { readCached, orientationOf, ratioLabel } from './media-info.mjs';
import { planPrune } from './prune.mjs';
import { deliverableId } from './deliverables.mjs';
import { feedbackSummary, readFeedback } from './feedback.mjs';
import { groupRenders } from './deliverables.mjs';

export const ROOT = path.resolve(path.join(import.meta.dirname, '..', '..'));
const PROJECTS_DIR = path.join(ROOT, 'video-projects');
const STYLE_REGISTRY = path.join(ROOT, 'style-library', 'registry.json');
const ASSET_REGISTRY = path.join(ROOT, 'asset-library', 'registry.json');

const MEDIA_EXT = new Set(['.mp4', '.mov', '.m4a', '.mkv', '.wav']);
const RECENT_SKIP_DIRS = new Set([
  'renders',
  '.thumbnails',
  '.waveform-cache',
  '.hyperframes',
  'node_modules',
  'frames',
  'snapshots',
]);

function statSafe(p) {
  try {
    return fs.statSync(p);
  } catch {
    return null;
  }
}
function readdirSafe(p) {
  try {
    return fs.readdirSync(p, { withFileTypes: true });
  } catch {
    return [];
  }
}
function mtimeMs(st) {
  return st ? Math.round(st.mtimeMs) : 0;
}

// Render kind classification (SPEC).
const TS_RE = /^.+_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.mp4$/;
const FINAL_RE = /(-final(-v\d+)?\.mp4|^final\.mp4)$/;
function renderKind(name) {
  const lower = name.toLowerCase();
  if (name === 'draft.mp4' || lower.includes('draft')) return 'draft';
  if (TS_RE.test(name)) return 'timestamped';
  if (name === 'final.mp4' || FINAL_RE.test(name)) return 'final';
  return 'named';
}

function readSidecarDuration(dir, mp4Name) {
  const base = mp4Name.replace(/\.mp4$/i, '');
  const sidecar = path.join(dir, `${base}.meta.json`);
  const st = statSafe(sidecar);
  if (!st || !st.isFile() || st.size > 64 * 1024) return null;
  try {
    const obj = JSON.parse(fs.readFileSync(sidecar, 'utf8'));
    if (typeof obj.durationMs === 'number') return obj.durationMs;
  } catch {
    /* ignore */
  }
  return null;
}

// La convention de nommage est datée : AA-MM-JJ-sujet-en-kebab (CLAUDE.md).
// La date sert à retrouver un projet dans le Finder, pas à le nommer : on la
// sépare du titre plutôt que de la répéter dans chaque libellé.
const DATED_RE = /^(\d{2})-(\d{2})-(\d{2})-(.+)$/;

function splitSlug(slug) {
  const bare = String(slug).replace(/^_/, '');
  const m = DATED_RE.exec(bare);
  if (!m) return { date: null, rest: bare };
  return { date: `20${m[1]}-${m[2]}-${m[3]}`, rest: m[4] };
}

// Les sigles qu'un simple capitalize massacre ("Ia", "3d", "Os").
const ACRONYMS = {
  ia: 'IA', ai: 'AI', os: 'OS', ugc: 'UGC', b2b: 'B2B', b2c: 'B2C',
  seo: 'SEO', cta: 'CTA', vsl: 'VSL', faq: 'FAQ', '3d': '3D', '2d': '2D', tiktok: 'TikTok',
};

function prettify(slug) {
  return splitSlug(slug).rest
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((w, i) => {
      const low = w.toLowerCase();
      if (ACRONYMS[low]) return ACRONYMS[low];
      return i === 0 ? low.charAt(0).toUpperCase() + low.slice(1) : low;
    })
    .join(' ');
}

// Regroupement par premier mot du sujet — la date est ignorée, sinon tous les
// projets d'une même année tomberaient dans la famille « 26 », ce qui ne
// regroupe rien. "demo-3d-marc" et "demo-style-dankieft" -> famille "demo".
function familyOf(slug) {
  const head = splitSlug(slug).rest.split(/[-_\s]+/)[0].toLowerCase();
  return /^[a-z][a-z0-9]*$/.test(head) && head.length ? head : 'misc';
}

// Build the compact inventory used by the stage engine, plus the pieces the summary needs.
// Returns null if the project path is not a directory.
function buildInventory(slug) {
  const projDir = path.join(PROJECTS_DIR, slug);
  const projStat = statSafe(projDir);
  if (!projStat || !projStat.isDirectory()) return null;

  const assetsDir = path.join(projDir, 'assets');
  const rendersDir = path.join(projDir, 'renders');
  const cardsDir = path.join(projDir, 'cards');

  let newestMtime = mtimeMs(projStat);
  const bump = (m) => {
    if (m > newestMtime) newestMtime = m;
  };

  // --- root-level files ---
  const rootEntries = readdirSafe(projDir);
  let rootIndexHtml = null;
  const extraFiles = [];
  const rootFilesForStale = [];
  let rootFilesBytes = 0;
  let hasGenMjs = false;
  let hasNotes = false;

  for (const e of rootEntries) {
    if (e.isFile()) {
      const abs = path.join(projDir, e.name);
      const st = statSafe(abs);
      const m = mtimeMs(st);
      bump(m);
      rootFilesBytes += st ? st.size : 0;
      if (e.name === 'index.html') {
        rootIndexHtml = { rel: 'index.html', mtime: m };
        rootFilesForStale.push(m);
      }
      if (/^_gen.*\.mjs$/.test(e.name) || (e.name.endsWith('.mjs') && e.name.startsWith('_gen'))) {
        hasGenMjs = true;
        rootFilesForStale.push(m);
        extraFiles.push(e.name);
      } else if (e.name.endsWith('.mjs')) {
        extraFiles.push(e.name);
      }
      if (e.name === 'NOTES.md') {
        hasNotes = true;
        extraFiles.push('NOTES.md');
      }
    }
  }

  // --- assets/ (one level) ---
  const assetsFiles = [];
  const jsonCandidates = [];
  let assetsHasBrollDir = false;
  let assetsBytes = 0;
  const assetsMtimesForStale = [];
  const assetsEntries = readdirSafe(assetsDir);
  for (const e of assetsEntries) {
    const abs = path.join(assetsDir, e.name);
    const st = statSafe(abs);
    const m = mtimeMs(st);
    const rel = `assets/${e.name}`;
    const isDir = e.isDirectory();
    assetsFiles.push({ name: e.name, rel, abs, mtime: m, size: st ? st.size : 0, isDir });
    bump(m);
    assetsMtimesForStale.push(m);
    if (isDir) {
      if (e.name === 'broll') assetsHasBrollDir = true;
    } else {
      assetsBytes += st ? st.size : 0;
      if (e.name.toLowerCase().endsWith('.json')) {
        jsonCandidates.push({ name: e.name, rel, abs, mtime: m, size: st ? st.size : 0 });
      }
    }
  }
  // Also consider JSONs at project root and in transcripts/ per SPEC "assets JSONs".
  for (const e of rootEntries) {
    if (e.isFile() && e.name.toLowerCase().endsWith('.json')) {
      const abs = path.join(projDir, e.name);
      const st = statSafe(abs);
      jsonCandidates.push({ name: e.name, rel: e.name, abs, mtime: mtimeMs(st), size: st ? st.size : 0 });
    }
  }
  const transcriptsDir = path.join(projDir, 'transcripts');
  for (const e of readdirSafe(transcriptsDir)) {
    if (e.isFile() && e.name.toLowerCase().endsWith('.json')) {
      const abs = path.join(transcriptsDir, e.name);
      const st = statSafe(abs);
      const m = mtimeMs(st);
      bump(m);
      jsonCandidates.push({ name: e.name, rel: `transcripts/${e.name}`, abs, mtime: m, size: st ? st.size : 0 });
    }
  }

  // --- cards/*.html ---
  // Une composition = un livrable. Un projet en porte souvent plusieurs (quatre
  // publicités tirées d'un même rush, plusieurs verticaux tirés d'une vidéo
  // longue), et c'est ce qui décide du regroupement des rendus.
  const compositionNames = readdirSafe(path.join(projDir, 'compositions'))
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.html'))
    .map((e) => e.name.replace(/\.html$/i, ''));

  const cardsHtml = [];
  const cardsMtimesForStale = [];
  for (const e of readdirSafe(cardsDir)) {
    const abs = path.join(cardsDir, e.name);
    if (e.isDirectory()) {
      // one level deeper for cards/<sub>/*.html (tier folders)
      for (const s of readdirSafe(abs)) {
        if (s.isFile() && s.name.endsWith('.html')) {
          const sAbs = path.join(abs, s.name);
          const st = statSafe(sAbs);
          const m = mtimeMs(st);
          bump(m);
          cardsHtml.push({ rel: `cards/${e.name}/${s.name}`, mtime: m });
          cardsMtimesForStale.push(m);
        }
      }
    } else if (e.isFile() && e.name.endsWith('.html')) {
      const st = statSafe(abs);
      const m = mtimeMs(st);
      bump(m);
      cardsHtml.push({ rel: `cards/${e.name}`, mtime: m });
      cardsMtimesForStale.push(m);
    }
  }

  // --- renders/ (one level mp4s) + renders/final/ delivery ---
  const renders = [];
  const deliveryRenders = [];
  let rendersBytes = 0;
  const rendersEntries = readdirSafe(rendersDir);
  for (const e of rendersEntries) {
    const abs = path.join(rendersDir, e.name);
    const st = statSafe(abs);
    const m = mtimeMs(st);
    if (e.isFile()) {
      rendersBytes += st ? st.size : 0;
      bump(m);
      if (e.name.toLowerCase().endsWith('.mp4')) {
        renders.push({
          file: `renders/${e.name}`,
          bytes: st ? st.size : 0,
          mtime: m,
          kind: renderKind(e.name),
          durationMs: readSidecarDuration(rendersDir, e.name),
          stale: false, // filled after S is known
        });
      }
    } else if (e.isDirectory() && e.name === 'final') {
      for (const d of readdirSafe(abs)) {
        if (d.isFile() && d.name.toLowerCase().endsWith('.mp4')) {
          const dAbs = path.join(abs, d.name);
          const dst = statSafe(dAbs);
          const dm = mtimeMs(dst);
          bump(dm);
          rendersBytes += dst ? dst.size : 0;
          const rec = {
            file: `renders/final/${d.name}`,
            bytes: dst ? dst.size : 0,
            mtime: dm,
            kind: 'delivery',
            durationMs: readSidecarDuration(abs, d.name),
            stale: false,
          };
          renders.push(rec);
          deliveryRenders.push(rec);
        }
      }
    }
  }

  // --- archetype ---
  const cleanFile = assetsFiles.find((f) => !f.isDir && f.name === 'clean.mp4');
  const hasTranscript = false; // resolved later via stage engine; recompute cheaply below.
  const nonCleanSource = assetsFiles.find((f) => {
    if (f.isDir) return false;
    const lower = f.name.toLowerCase();
    const ext = lower.slice(lower.lastIndexOf('.'));
    if (!MEDIA_EXT.has(ext)) return false;
    if (f.name === 'clean.mp4' || f.name === 'edited-clean.mp4') return false;
    if (f.name.endsWith('.silenced.mp4')) return false;
    return true;
  });

  // transcript detection needs the sniff; do it once here so archetype can use it.
  // Reuse the same capped-sniff the stage engine uses via a lightweight recompute.
  const transcriptDetected = detectTranscript(jsonCandidates);

  let archetype;
  if (cleanFile || (transcriptDetected && nonCleanSource)) {
    archetype = 'talking-head';
  } else if (hasGenMjs || cardsHtml.length) {
    archetype = 'graphics-only';
  } else {
    archetype = 'unknown';
  }

  // --- stale rule ---
  // S = newest mtime among root index.html, _gen*.mjs, cards/*.html, and files directly
  // in assets/ (excluding renders/).
  const staleSourceMtimes = [
    ...rootFilesForStale,
    ...cardsMtimesForStale,
    ...assetsMtimesForStale,
  ];
  const S = staleSourceMtimes.length ? Math.max(...staleSourceMtimes) : 0;
  for (const r of renders) {
    r.stale = r.mtime < S;
  }
  const sortedRenders = renders.slice().sort((a, b) => b.mtime - a.mtime);
  const staleRender = sortedRenders.length > 0 ? sortedRenders[0].stale : false;

  const dirSizes = {
    renders: rendersBytes,
    assets: assetsBytes,
    total: rendersBytes + assetsBytes + rootFilesBytes,
  };

  // meta.json name
  let name = prettify(slug);
  const metaPath = path.join(projDir, 'meta.json');
  const metaStat = statSafe(metaPath);
  if (metaStat && metaStat.isFile() && metaStat.size < 64 * 1024) {
    try {
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      // Les meta.json du workspace écrivent « title » ; le contrat d'origine
      // disait « name ». On accepte les deux plutôt que de retomber
      // silencieusement sur le slug embelli, comme c'était le cas.
      const given = meta && (meta.title || meta.name);
      if (typeof given === 'string' && given.trim()) name = given.trim();
    } catch {
      /* ignore */
    }
  }

  return {
    slug,
    name,
    projDir,
    archetype,
    assetsFiles,
    assetsHasBrollDir,
    jsonCandidates,
    rootIndexHtml,
    cardsHtml,
    compositionNames,
    renders: sortedRenders,
    deliveryRenders,
    staleRender,
    lastTouched: newestMtime,
    hasNotes,
    dirSizes,
    extraFiles,
  };
}

// Minimal transcript detection mirroring stages.findTranscript (bounded sniff, cap 12).
import { sniffWordsKey } from './stages.mjs';
function detectTranscript(jsonCandidates) {
  const capped = jsonCandidates.slice(0, 12);
  for (const j of capped) {
    if (sniffWordsKey(j.abs, j.size)) return j;
  }
  return null;
}

/**
 * Le rendu qu'on montre quand on ne montre qu'un rendu : la vignette de la
 * grille, le lecteur en tête de la page projet, la review.
 *
 * On préfère un master (-master.mp4) quand il en existe un : c'est le fichier
 * qui porte le niveau audio de publication, donc celui qu'on regarde pour
 * valider. À défaut, le plus récent. Même règle que scanReviews(), pour que le
 * hub ne propose jamais deux fichiers différents pour le même projet.
 */
const MASTER_RE = /-master\.(mp4|webm|mov)$/i;

function choosePreview(renders, projDir) {
  if (!renders || !renders.length) return null;
  const sorted = renders.slice().sort((a, b) => b.mtime - a.mtime);
  const master = sorted.find((r) => MASTER_RE.test(r.file));
  const pick = master || sorted[0];
  // Format : lu dans le cache media-info, jamais sondé ici (le relevé ne doit
  // pas ouvrir de fichier média). Inconnu tant que ffprobe n'est pas passé.
  const info = projDir ? readCached(path.join(projDir, pick.file), pick.mtime) : null;
  return {
    file: pick.file,
    width: info ? info.w : null,
    height: info ? info.h : null,
    orientation: orientationOf(info),
    ratio: ratioLabel(info),
    mtime: pick.mtime,
    bytes: pick.bytes,
    kind: pick.kind,
    durationMs: pick.durationMs || (info && info.dur ? Math.round(info.dur * 1000) : null),
    master: MASTER_RE.test(pick.file),
    // vrai quand un rendu plus frais existe mais qu'on affiche le master :
    // sans ça on croirait regarder le dernier état du montage.
    newerExists: !!master && sorted[0].file !== pick.file,
    newerFile: !!master && sorted[0].file !== pick.file ? sorted[0].file : null,
  };
}

/**
 * Idem, mais depuis un slug et avec le chemin absolu — utilisé par les
 * vignettes, qui doivent ouvrir le fichier avec ffmpeg.
 */
export function pickLatestRender(slug, file) {
  const inv = buildInventory(slug);
  if (!inv) return null;
  // Un projet porte plusieurs livrables : on peut demander la vignette d'un
  // rendu précis. Le fichier doit appartenir au projet — on ne le prend pas
  // au mot, on le retrouve dans l'inventaire.
  if (file) {
    const hit = inv.renders.find((r) => r.file === file);
    if (!hit) return null;
    return { ...hit, slug, master: /-master\.(mp4|webm|mov)$/i.test(hit.file),
             abs: path.join(inv.projDir, hit.file) };
  }
  const pick = choosePreview(inv.renders, inv.projDir);
  if (!pick) return null;
  return { ...pick, slug, abs: path.join(inv.projDir, pick.file) };
}

function toSummary(inv) {
  const stages = computeStages({
    archetype: inv.archetype,
    assetsFiles: inv.assetsFiles,
    assetsHasBrollDir: inv.assetsHasBrollDir,
    jsonCandidates: inv.jsonCandidates,
    rootIndexHtml: inv.rootIndexHtml,
    cardsHtml: inv.cardsHtml,
    renders: inv.renders,
    deliveryRenders: inv.deliveryRenders,
  });
  return {
    slug: inv.slug,
    name: inv.name,
    date: splitSlug(inv.slug).date,
    family: familyOf(inv.slug),
    archetype: inv.archetype,
    utility: inv.slug.startsWith('_'),
    stages,
    renders: inv.renders.map((r) => ({
      file: r.file,
      bytes: r.bytes,
      mtime: r.mtime,
      kind: r.kind,
      durationMs: r.durationMs,
      stale: r.stale,
    })),
    preview: choosePreview(inv.renders, inv.projDir),
    // ce que « ne garder que les 3 derniers » libérerait sur ce projet
    // les retours de review encore ouverts, pour la pastille de la grille
    feedback: feedbackSummary(inv.projDir),
    deliverables: groupRenders(inv.renders, inv.compositionNames).map((d) => {
      // mêmes informations que le rendu principal : format et durée viennent
      // du cache media-info, jamais d'une lecture du fichier ici
      const info = readCached(path.join(inv.projDir, d.latest.file), d.latest.mtime);
      return {
        id: d.id,
        versions: d.versions,
        bytes: d.bytes,
        lastTouched: d.lastTouched,
        latest: {
          ...d.latest,
          width: info ? info.w : null,
          height: info ? info.h : null,
          orientation: orientationOf(info),
          ratio: ratioLabel(info),
          durationMs: d.latest.durationMs || (info && info.dur ? Math.round(info.dur * 1000) : null),
        },
      };
    }),
    compositions: inv.compositionNames,
    prunable: (function () {
      const plan = planPrune(inv.renders, 3, inv.compositionNames);
      return { count: plan.remove.length, bytes: plan.freeBytes };
    })(),
    staleRender: inv.staleRender,
    lastTouched: inv.lastTouched,
    hasNotes: inv.hasNotes,
    dirSizes: inv.dirSizes,
  };
}

// Full workspace scan. Returns { state: WorkspaceState, scannedAt, recentFiles }.
// recentFiles is passed to git.mjs so activity does not re-walk the tree.
export function scanWorkspace() {
  const t0 = Date.now();
  const slugs = readdirSafe(PROJECTS_DIR)
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();

  const summaries = [];
  const recentAcc = []; // { path (rel to video-projects), mtime }

  for (const slug of slugs) {
    const inv = buildInventory(slug);
    if (!inv) continue;
    summaries.push(toSummary(inv));
    collectRecentFiles(slug, inv.projDir, recentAcc);
  }

  summaries.sort((a, b) => b.lastTouched - a.lastTouched);

  const projectCount = summaries.filter((p) => !p.utility).length;
  const utilityCount = summaries.filter((p) => p.utility).length;
  const withRenders = summaries.filter((p) => p.renders.length > 0).length;
  const staleRenderCount = summaries.filter((p) => p.staleRender).length;
  const renderBytes = summaries.reduce((n, p) => n + p.dirSizes.renders, 0);
  const prunableCount = summaries.reduce((n, p) => n + p.prunable.count, 0);
  const prunableBytes = summaries.reduce((n, p) => n + p.prunable.bytes, 0);

  const scannedAt = Date.now();
  const scanMs = scannedAt - t0;

  const state = {
    summary: {
      projectCount,
      utilityCount,
      withRenders,
      staleRenderCount,
      renderBytes,
      prunableCount,
      prunableBytes,
      scannedAt,
      scanMs,
    },
    projects: summaries,
  };

  recentAcc.sort((a, b) => b.mtime - a.mtime);
  const recentFiles = recentAcc.slice(0, 30);

  return { state, scannedAt, scanMs, recentFiles };
}

// Recent-files collection: shallow walk of a project, skipping the excluded dirs and
// dotfiles. Files are stat'd (already cheap) and recorded as video-projects-relative.
function collectRecentFiles(slug, projDir, acc, depth = 0) {
  if (depth > 3) return;
  for (const e of readdirSafe(projDir)) {
    if (e.name.startsWith('.')) continue;
    const abs = path.join(projDir, e.name);
    if (e.isDirectory()) {
      if (RECENT_SKIP_DIRS.has(e.name)) continue;
      collectRecentFiles(slug, abs, acc, depth + 1);
    } else if (e.isFile()) {
      const st = statSafe(abs);
      if (!st) continue;
      const rel = path.relative(PROJECTS_DIR, abs).split(path.sep).join('/');
      acc.push({ path: rel, mtime: mtimeMs(st) });
    }
  }
}

// Detail endpoint: full summary + absPath, notes (fresh read), extraFiles.
export function buildProjectDetail(slug) {
  const inv = buildInventory(slug);
  if (!inv) return null;
  const summary = toSummary(inv);
  let notes = null;
  if (inv.hasNotes) {
    const notesPath = path.join(inv.projDir, 'NOTES.md');
    const st = statSafe(notesPath);
    if (st && st.isFile() && st.size < 1024 * 1024) {
      try {
        notes = fs.readFileSync(notesPath, 'utf8');
      } catch {
        notes = null;
      }
    }
  }
  return {
    ...summary,
    absPath: inv.projDir,
    notes,
    feedbackFiles: readFeedback(inv.projDir),
    extraFiles: inv.extraFiles,
  };
}

// --- Libraries ---

function pickString(v) {
  return typeof v === 'string' && v.trim() ? v.trim() : null;
}

export function scanLibraries() {
  const styles = [];
  let styleCount = 0;
  let cardCount = 0;
  let registryMtime = 0;
  let registryStale = false;

  const styleRegStat = statSafe(STYLE_REGISTRY);
  registryMtime = mtimeMs(styleRegStat);
  if (styleRegStat && styleRegStat.isFile()) {
    try {
      const reg = JSON.parse(fs.readFileSync(STYLE_REGISTRY, 'utf8'));
      const list = Array.isArray(reg.styles) ? reg.styles : [];
      styleCount = typeof reg.styleCount === 'number' ? reg.styleCount : list.length;
      cardCount = typeof reg.cardCount === 'number'
        ? reg.cardCount
        : list.reduce((n, s) => n + (Number(s.cardCount) || 0), 0);
      for (const s of list) {
        const pal = s.palette || {};
        styles.push({
          id: pickString(s.id) || '',
          number: Number(s.number) || 0,
          name: pickString(s.name) || pickString(s.id) || '',
          status: pickString(s.status) || 'unknown',
          cardCount: Number(s.cardCount) || 0,
          palette: {
            bg: pickString(pal.bg),
            fg: pickString(pal.fg),
            accent: pickString(pal.accent),
            // Registry uses accent2/alert; map to the contract's red/orange chips.
            red: pickString(pal.red) || pickString(pal.alert),
            orange: pickString(pal.orange) || pickString(pal.accent2),
          },
          fonts: {
            display: pickString((s.fonts || {}).display),
            body: pickString((s.fonts || {}).body),
            mono: pickString((s.fonts || {}).mono),
          },
        });
      }
    } catch {
      /* leave empty on parse failure */
    }
  }

  // registryStale: registry.json older than newest style-library/*/style.json.
  const styleLibDir = path.join(ROOT, 'style-library');
  let newestStyleJson = 0;
  for (const e of readdirSafe(styleLibDir)) {
    if (e.isDirectory()) {
      const sj = path.join(styleLibDir, e.name, 'style.json');
      const st = statSafe(sj);
      if (st && st.isFile()) newestStyleJson = Math.max(newestStyleJson, mtimeMs(st));
    }
  }
  registryStale = registryMtime > 0 && newestStyleJson > registryMtime;

  // Asset library
  let assetCount = 0;
  let byType = {};
  let assetRegistryMtime = 0;
  const assetRegStat = statSafe(ASSET_REGISTRY);
  assetRegistryMtime = mtimeMs(assetRegStat);
  if (assetRegStat && assetRegStat.isFile()) {
    try {
      const areg = JSON.parse(fs.readFileSync(ASSET_REGISTRY, 'utf8'));
      assetCount = typeof areg.assetCount === 'number'
        ? areg.assetCount
        : Array.isArray(areg.assets) ? areg.assets.length : 0;
      if (areg.byType && typeof areg.byType === 'object') byType = areg.byType;
    } catch {
      /* ignore */
    }
  }

  // Formats de reel : formats/0N-*.md + leur scaffold style-templates/reel-0N-*.
  const formats = [];
  const formatsDir = path.join(ROOT, 'formats');
  for (const e of readdirSafe(formatsDir)) {
    const m = /^(\d{2})-(.+)\.md$/.exec(e.name);
    if (!e.isFile() || !m) continue;
    let title = m[2];
    let hook = '';
    try {
      const txt = fs.readFileSync(path.join(formatsDir, e.name), 'utf8');
      const t = /^#\s+(.+)$/m.exec(txt);
      if (t) title = t[1].replace(/^Format\s+\d+\s+·\s+/, '');
      const q = /^>\s+«\s*([^»]+)»/m.exec(txt);
      if (q) hook = q[1].trim();
    } catch { /* ignore */ }
    // reel-NN-* pour les reels 9:16, yt-NN-* pour les vidéos longues YouTube (format 04, 2026-10-07)
    let scaffoldRel = `style-templates/reel-${m[1]}-${m[2]}`;
    if (!statSafe(path.join(ROOT, scaffoldRel))) scaffoldRel = `style-templates/yt-${m[1]}-${m[2]}`;
    const scaffoldStat = statSafe(path.join(ROOT, scaffoldRel));
    const refs = [];
    for (const r of readdirSafe(path.join(ROOT, 'formats', 'references'))) {
      if (r.isFile() && r.name.startsWith(m[1] + '-') && r.name.endsWith('.jpg'))
        refs.push(`formats/references/${r.name}`);
    }
    refs.sort();
    const exampleRel = `formats/exemples/${m[1]}-${m[2]}.mp4`;
    const exampleStat = statSafe(path.join(ROOT, exampleRel));
    formats.push({
      id: `${m[1]}-${m[2]}`,
      number: m[1],
      name: title,
      hook,
      md: `formats/${e.name}`,
      scaffold: scaffoldStat && scaffoldStat.isDirectory() ? scaffoldRel : null,
      example: exampleStat && exampleStat.isFile() ? exampleRel : null,
      refs,
      poster: statSafe(path.join(ROOT, `formats/exemples/${m[1]}-${m[2]}.jpg`)) ? `formats/exemples/${m[1]}-${m[2]}.jpg` : null,
    });
  }
  formats.sort((a, b) => a.number.localeCompare(b.number));

  return {
    styles,
    styleCount,
    cardCount,
    registryMtime,
    registryStale,
    formats,
    assets: { assetCount, byType, registryMtime: assetRegistryMtime },
  };
}

export { STAGE_IDS };

/**
 * Les projets qui ont une interface de review (review.html) et au moins un
 * rendu à commenter. Alimente la vue Review du hub.
 *
 * Le rendu proposé par défaut est le plus récent, en préférant un master
 * (-master.mp4) quand il existe : c'est celui qu'on regarde pour valider,
 * puisque c'est lui qui porte le niveau audio de publication.
 */
// Garde les `perGroup` rendus les plus récents de chaque livrable, en
// conservant l'ordre d'origine (le plus récent d'abord).
function capPerDeliverable(renders, perGroup) {
  const seen = new Map();
  return renders.filter((r) => {
    const n = (seen.get(r.deliverable) || 0) + 1;
    seen.set(r.deliverable, n);
    return n <= perGroup;
  });
}

export function scanReviews() {
  const out = [];
  for (const e of readdirSafe(PROJECTS_DIR)) {
    if (!e.isDirectory() || e.name.startsWith('.')) continue;
    const dir = path.join(PROJECTS_DIR, e.name);

    const reviewFile = path.join(dir, 'review.html');
    const reviewStat = statSafe(reviewFile);
    const hasReview = !!(reviewStat && reviewStat.isFile());

    const comps = readdirSafe(path.join(dir, 'compositions'))
      .filter((c) => c.isFile() && c.name.toLowerCase().endsWith('.html'))
      .map((c) => c.name.replace(/\.html$/i, ''));

    const rendersDir = path.join(dir, 'renders');
    const renders = [];
    for (const r of readdirSafe(rendersDir)) {
      if (!r.isFile()) continue;
      if (!/\.(mp4|webm|mov)$/i.test(r.name)) continue;
      const st = statSafe(path.join(rendersDir, r.name));
      if (!st) continue;
      renders.push({
        name: r.name,
        path: `video-projects/${e.name}/renders/${r.name}`,
        bytes: st.size,
        mtime: mtimeMs(st),
        master: /-master\.(mp4|webm|mov)$/i.test(r.name),
        // à quel livrable appartient ce rendu : sur un projet qui porte quatre
        // publicités, « le dernier rendu » ne veut rien dire sans ça
        deliverable: deliverableId(`renders/${r.name}`, comps),
      });
    }
    if (!hasReview && renders.length === 0) continue;

    // le plus récent d'abord ; un master l'emporte sur un rendu de même heure
    renders.sort((a, b) => (b.mtime - a.mtime) || (Number(b.master) - Number(a.master)));
    const latest = renders.find((r) => r.master) || renders[0] || null;

    out.push({
      slug: e.name,
      deliverableCount: new Set(renders.map((r) => r.deliverable)).size,
      hasReview,
      reviewPath: hasReview ? `video-projects/${e.name}/review.html` : null,
      reviewMtime: hasReview ? mtimeMs(reviewStat) : 0,
      renderCount: renders.length,
      latest,
      // Plafond PAR LIVRABLE, et non sur le tas : à 24 rendus à plat, un projet
      // qui porte onze publicités n'en montrait plus que cinq dans la review.
      renders: capPerDeliverable(renders, 8),
    });
  }
  out.sort((a, b) => {
    const at = a.latest ? a.latest.mtime : a.reviewMtime;
    const bt = b.latest ? b.latest.mtime : b.reviewMtime;
    return bt - at;
  });
  return { projects: out, scannedAt: Date.now() };
}

/**
 * Les cartes d'un style, lues depuis style-library/registry.json.
 * Alimente la vue « un style » du hub : chaque carte est une composition
 * autonome, donc on peut la prévisualiser telle quelle dans une iframe.
 */
export function scanStyle(styleId) {
  let reg;
  try {
    reg = JSON.parse(fs.readFileSync(STYLE_REGISTRY, 'utf8'));
  } catch {
    return null;
  }
  const style = (reg.styles || []).find((s) => s.id === styleId);
  if (!style) return null;

  const cards = (style.cards || []).map((c) => {
    // Le registre stocke déjà le dossier du style dans c.file
    // ("10-marc/cards/..."), mais les style.json individuels le donnent
    // parfois sans ("cards/..."). On accepte les deux.
    const rel = String(c.file || '').replace(/^\/+/, '');
    const wsPath = rel.startsWith(style.folder + '/')
      ? `style-library/${rel}`
      : `style-library/${style.folder}/${rel}`;
    const st = statSafe(path.join(ROOT, wsPath));
    // Orientation de la carte : data-width/data-height lus en tête du HTML.
    // Les styles reels (12, 13) sont en 1080x1920 — sans ça, la vignette
    // 320x180 recadre une carte verticale au lieu de la réduire.
    let w = null, h = null;
    if (st && st.isFile()) {
      try {
        const head = fs.readFileSync(path.join(ROOT, wsPath), 'utf8').slice(0, 6000);
        const mw = head.match(/data-width="(\d+)"/);
        const mh = head.match(/data-height="(\d+)"/);
        if (mw) w = parseInt(mw[1], 10);
        if (mh) h = parseInt(mh[1], 10);
      } catch { /* tant pis, on suppose 16:9 */ }
    }
    return {
      id: c.id,
      tier: c.tier,
      purpose: c.purpose,
      treatment: c.treatment || null,
      path: wsPath,
      exists: !!(st && st.isFile()),
      w,
      h,
      slots: (c.slots || []).map((sl) => sl.name),
      duration: c.duration || null,
      notes: c.notes || null,
    };
  });

  return {
    id: style.id,
    number: style.number,
    name: style.name,
    status: style.status,
    folder: style.folder,
    summary: style.summary || style.inspiration || '',
    palette: style.palette || {},
    fonts: style.fonts || {},
    cardCount: cards.length,
    missing: cards.filter((c) => !c.exists).length,
    cards,
  };
}
