// editing-os/server.mjs
// Editing OS server. node:http only, port 4200 (PORT override), no auto-increment.
// Serves the four JSON endpoints + static public/, with a 60 s snapshot cache.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { execFile, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

import { scanWorkspace, buildProjectDetail, scanLibraries, scanReviews, scanStyle, pickLatestRender, ROOT } from './lib/scan.mjs';
import { buildThumb } from './lib/thumbs.mjs';
import { ensureInfo } from './lib/media-info.mjs';
import { planPrune, applyPrune } from './lib/prune.mjs';
import { readFeedback, writeFeedback, setFeedbackDone } from './lib/feedback.mjs';
import { deliverableId } from './lib/deliverables.mjs';
import { writeBrief } from './lib/brief.mjs';
import { applyEdits } from './lib/patch-html.mjs';
import { open as openStudio, close as closeStudio, list as listStudios } from './lib/studio.mjs';
import { startJob, getJob, listJobs, listActions, stopJob } from './lib/jobs.mjs';
import { buildActivity } from './lib/git.mjs';
import { buildAgentsState } from './lib/agents.mjs';

/**
 * Le moteur HyperFrames. Une composition ne l'embarque PAS : elle ne charge que
 * GSAP puis pose sa timeline sur window.__timelines. C'est le CLI qui injecte
 * le runtime dans le HTML qu'il sert (injectRuntime → injectTagsAtHeadStart,
 * dans dist/cli.js). Le hub ne le faisait pas — d'où une scène qui bougeait
 * mais sans média ni son, et aucune lecture possible.
 *
 * On injecte donc à la volée, à la réponse HTTP, JAMAIS sur le disque : le
 * rendu doit continuer à voir la composition nue.
 */
const require_ = createRequire(import.meta.url);
let HF_RUNTIME;
try {
  HF_RUNTIME = path.join(
    path.dirname(require_.resolve('hyperframes/package.json')), 'dist', 'hyperframe-runtime.js');
} catch {
  HF_RUNTIME = path.join(path.resolve(path.join(import.meta.dirname, '..')),
    'node_modules', 'hyperframes', 'dist', 'hyperframe-runtime.js');
}

const DEFAULT_PORT = 4200;
const PORT = Number(process.env.PORT) || DEFAULT_PORT;
const PUBLIC_DIR = path.join(import.meta.dirname, 'public');
const CACHE_TTL_MS = 60 * 1000;

// One in-memory snapshot.
let snapshot = null; // { state, scannedAt, scanMs, recentFiles }

function rescan() {
  const result = scanWorkspace();
  snapshot = result;
  warmMediaInfo(result.state);
  return result;
}

/**
 * Sonde en tâche de fond le format des rendus qu'on ne connaît pas encore.
 * Le relevé lui-même reste purement statistique (readdir + stat) ; ffprobe
 * tourne à côté, une fois par rendu, et le snapshot est invalidé quand il a
 * appris quelque chose — le filtre « format » se remplit donc tout seul au
 * premier chargement, sans jamais ralentir /api/state.
 */
let warming = false;
function warmMediaInfo(state) {
  if (warming) return;
  const todo = [];
  for (const p of state.projects || []) {
    for (const d of p.deliverables || []) {
      if (d.latest.orientation) continue;
      todo.push({
        abs: path.join(ROOT, 'video-projects', p.slug, d.latest.file),
        mtime: d.latest.mtime,
      });
    }
  }
  if (!todo.length) return;
  warming = true;
  Promise.all(todo.map((t) => ensureInfo(t.abs, t.mtime)))
    .then((results) => {
      warming = false;
      // au moins un format appris : le prochain appel repart d'un relevé frais
      if (results.some(Boolean)) snapshot = null;
    })
    .catch(() => { warming = false; });
}

function getSnapshot() {
  if (!snapshot || Date.now() - snapshot.scannedAt > CACHE_TTL_MS) {
    return rescan();
  }
  return snapshot;
}

// --- helpers ---

function sendJSON(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

function sendError(res, status, message) {
  sendJSON(res, status, { error: message });
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.m4a': 'audio/mp4',
  '.wav': 'audio/wav',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
};

function serveStatic(req, res, urlPath) {
  // Map "/" -> index.html; strip leading slash; block traversal.
  let rel = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');
  rel = decodeURIComponent(rel);
  const abs = path.join(PUBLIC_DIR, rel);
  // Confine to PUBLIC_DIR.
  if (abs !== PUBLIC_DIR && !abs.startsWith(PUBLIC_DIR + path.sep)) {
    sendError(res, 403, 'Forbidden');
    return;
  }
  fs.stat(abs, (err, st) => {
    if (err || !st.isFile()) {
      if (urlPath === '/') {
        // public/ not built yet: friendly placeholder.
        const html =
          '<!doctype html><meta charset="utf-8"><title>Editing OS</title>' +
          '<body style="background:#0A0C10;color:#37BDF8;font:16px -apple-system,Inter,sans-serif;padding:40px">' +
          '<h1>Editing OS</h1><p>API is live. The UI (public/) has not been built yet.</p>' +
          '<p>Try <code style="color:#F5B942">/api/state</code>.</p></body>';
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
        return;
      }
      sendError(res, 404, 'Not found');
      return;
    }
    const ext = path.extname(abs).toLowerCase();
    // no-store sur l'interface, pas seulement no-cache : le hub est servi en
    // local et ses fichiers changent souvent. Avec no-cache, le navigateur
    // gardait encore des copies (revalidation manquée dans une iframe), et une
    // correction restait invisible jusqu'à un rechargement forcé — ça a piégé
    // deux fois sur la review. Les vignettes, elles, restent immuables : leur
    // URL porte le mtime du rendu.
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': 'no-store, must-revalidate',
    });
    fs.createReadStream(abs).pipe(res);
  });
}

/**
 * Sert un fichier du workspace sous /workspace/<chemin relatif à ROOT>.
 * Nécessaire pour la vue Review : review.html vit dans le projet, pas dans
 * public/, et il lit son MP4 à côté de lui.
 *
 * Le support des Range requests n'est pas optionnel ici — sans lui, la barre
 * de progression d'une vidéo ne répond pas et on ne peut pas naviguer image
 * par image. (C'est exactement pour ça que le CLAUDE.md interdit python
 * http.server pour prévisualiser un rendu.)
 */
function serveWorkspace(req, res, urlPath) {
  const rel = decodeURIComponent(urlPath.replace(/^\/workspace\/?/, ''));
  if (!rel) { sendError(res, 400, 'Bad path'); return; }
  const abs = path.join(ROOT, rel);
  // confiné au workspace, quoi qu'il arrive
  if (!abs.startsWith(ROOT + path.sep)) { sendError(res, 403, 'Forbidden'); return; }

  fs.stat(abs, (err, st) => {
    if (err || !st.isFile()) { sendError(res, 404, 'Not found'); return; }
    const ext = path.extname(abs).toLowerCase();
    const type = MIME[ext] || 'application/octet-stream';
    const range = req.headers.range;

    // Une composition servie au hub reçoit le moteur, comme chez le CLI. Le
    // test sur data-composition-id garde review.html à l'écart : ce n'est pas
    // une composition, le runtime n'y aurait rien à piloter.
    if (ext === '.html') {
      let html;
      try { html = fs.readFileSync(abs, 'utf8'); }
      catch { sendError(res, 500, 'lecture impossible'); return; }
      if (html.includes('data-composition-id')) {
        const tag = '<script src="/hf-runtime.js"></script>';
        html = /<head\b[^>]*>/i.test(html)
          ? html.replace(/<head\b[^>]*>/i, (m) => m + '\n' + tag)
          : (html.includes('<body') ? html.replace('<body', tag + '\n<body') : tag + '\n' + html);
      }
      const buf = Buffer.from(html, 'utf8');
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Length': buf.length,           // recalculé : le tag change la taille
        'Cache-Control': 'no-store, must-revalidate',
      });
      res.end(buf);
      return;
    }

    if (range) {
      const m = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (m) {
        let start = m[1] ? parseInt(m[1], 10) : 0;
        let end = m[2] ? parseInt(m[2], 10) : st.size - 1;
        if (isNaN(start) || isNaN(end) || start > end || end >= st.size) {
          res.writeHead(416, { 'Content-Range': `bytes */${st.size}` });
          res.end();
          return;
        }
        res.writeHead(206, {
          'Content-Type': type,
          'Content-Length': end - start + 1,
          'Content-Range': `bytes ${start}-${end}/${st.size}`,
          'Accept-Ranges': 'bytes',
        });
        fs.createReadStream(abs, { start, end }).pipe(res);
        return;
      }
    }

    res.writeHead(200, {
      'Content-Type': type,
      'Content-Length': st.size,
      'Accept-Ranges': 'bytes',
    });
    fs.createReadStream(abs).pipe(res);
  });
}

function readBody(req, limit = 64 * 1024) {
  return new Promise((resolve, reject) => {
    let data = '';
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) {
        reject(new Error('body too large'));
        req.destroy();
        return;
      }
      data += c;
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

// --- reveal (mandatory security check) ---
async function handleReveal(req, res) {
  let body;
  try {
    const raw = await readBody(req);
    body = raw ? JSON.parse(raw) : {};
  } catch {
    sendError(res, 400, 'Invalid JSON body');
    return;
  }
  if (!body || typeof body.path !== 'string') {
    sendError(res, 400, 'Missing path');
    return;
  }
  const p = path.resolve(body.path);
  const insideWorkspace = p !== ROOT && p.startsWith(ROOT + path.sep);
  if (!insideWorkspace) {
    sendError(res, 400, 'Path outside workspace');
    return;
  }
  if (!fs.existsSync(p)) {
    sendError(res, 404, 'Path does not exist');
    return;
  }
  execFile('open', ['-R', p], (err) => {
    if (err) sendError(res, 500, 'Failed to reveal');
    else sendJSON(res, 200, { ok: true });
  });
}

/**
 * Vignette du dernier rendu d'un projet.
 *   /api/thumb/<slug>            -> image fixe (jpg)
 *   /api/thumb/<slug>?kind=loop  -> boucle animée (gif), pour le survol
 *
 * Générée par ffmpeg à la première demande puis servie depuis .cache/. L'URL
 * porte ?v=<mtime>, donc on peut la déclarer immuable : un nouveau rendu
 * change l'URL, le navigateur ne sert jamais une vignette périmée.
 */
async function handleThumb(req, res, slug, kind, file) {
  const render = pickLatestRender(slug, file);
  if (!render) { sendError(res, 404, 'No render'); return; }
  const abs = await buildThumb(slug, render, kind);
  if (!abs) { sendError(res, 404, 'Thumbnail unavailable'); return; }
  let st;
  try { st = fs.statSync(abs); } catch { sendError(res, 404, 'Thumbnail unavailable'); return; }
  res.writeHead(200, {
    'Content-Type': kind === 'loop' ? 'image/gif' : 'image/jpeg',
    'Content-Length': st.size,
    'Cache-Control': 'public, max-age=31536000, immutable',
  });
  fs.createReadStream(abs).pipe(res);
}

/**
 * Rangement des rendus d'un projet : on ne garde que les N plus récents.
 *
 * GET  /api/prune/<slug>?keep=3   -> ce qui partirait, sans rien toucher
 * POST /api/prune                 -> l'applique (corbeille du système)
 *
 * Deux appels séparés, et pas un seul : l'interface montre d'abord la liste
 * exacte des fichiers et l'espace libéré, l'action n'est envoyée qu'après.
 * Rien n'est jamais rangé automatiquement — un rendu qu'on croyait périmé est
 * parfois celui qu'on allait publier.
 */
function prunePlanFor(slug, keep) {
  const detail = buildProjectDetail(slug);
  if (!detail) return null;
  // par livrable : un projet porte souvent plusieurs vidéos différentes
  const plan = planPrune(detail.renders, keep, detail.compositions || []);
  return { slug, absPath: detail.absPath, ...plan };
}

async function handlePrune(req, res) {
  let body;
  try {
    const raw = await readBody(req);
    body = raw ? JSON.parse(raw) : {};
  } catch {
    sendError(res, 400, 'Invalid JSON body');
    return;
  }
  const slug = typeof body.slug === 'string' ? body.slug : '';
  if (!slug || slug.includes('/')) { sendError(res, 400, 'Bad slug'); return; }
  const plan = prunePlanFor(slug, body.keep);
  if (!plan) { sendError(res, 404, 'Unknown project'); return; }
  if (!plan.remove.length) { sendJSON(res, 200, { ok: true, moved: [], failed: [], freedBytes: 0 }); return; }
  const result = applyPrune(plan.absPath, plan);
  snapshot = null; // les tailles sur disque viennent de changer
  sendJSON(res, 200, { ok: true, ...result });
}

/**
 * Le même rangement, mais sur tout l'espace de travail.
 *
 * GET  /api/prune-all?keep=3  -> ce qui partirait, projet par projet
 * POST /api/prune-all         -> l'applique
 *
 * La tuile « Disque rendus » de Mission Control annonçait un volume à ranger
 * sans offrir de geste : le ménage ne se faisait que projet par projet, et
 * l'essentiel du volume se concentre toujours sur un ou deux projets qu'il
 * fallait aller chercher. Même garde-fous qu'au singulier : la liste d'abord,
 * l'action ensuite, les masters et les livraisons intouchés, corbeille système.
 */
function prunePlanAll(keep) {
  const projects = [];
  for (const p of getSnapshot().state.projects) {
    const plan = prunePlanFor(p.slug, keep);
    if (plan && plan.remove.length) projects.push(plan);
  }
  projects.sort((a, b) => b.freeBytes - a.freeBytes);
  return {
    keep: projects.length ? projects[0].keep : Math.max(1, Number(keep) || 3),
    projects,
    removeCount: projects.reduce((n, p) => n + p.remove.length, 0),
    freeBytes: projects.reduce((n, p) => n + p.freeBytes, 0),
    protected: projects.reduce((n, p) => n + p.protected, 0),
  };
}

async function handlePruneAll(req, res) {
  let body;
  try {
    const raw = await readBody(req);
    body = raw ? JSON.parse(raw) : {};
  } catch {
    sendError(res, 400, 'Invalid JSON body');
    return;
  }
  const all = prunePlanAll(body.keep);
  const moved = [];
  const failed = [];
  let freedBytes = 0;
  for (const plan of all.projects) {
    const result = applyPrune(plan.absPath, plan);
    for (const f of result.moved) moved.push({ slug: plan.slug, file: f });
    for (const f of result.failed) failed.push({ slug: plan.slug, ...f });
    freedBytes += result.moved.length === plan.remove.length
      ? plan.freeBytes
      : plan.remove.filter((r) => result.moved.includes(r.file))
        .reduce((n, r) => n + (r.bytes || 0), 0);
  }
  snapshot = null; // les tailles sur disque viennent de changer
  sendJSON(res, 200, { ok: true, moved, failed, freedBytes, projects: all.projects.length });
}

/**
 * Retours de review, écrits dans le projet (video-projects/<slug>/review/).
 * L'interface de review les enregistre à chaque note : plus de copier-coller
 * pour les faire arriver jusqu'à une session, et ils survivent au navigateur.
 */
function projDirFor(slug) {
  if (!slug || slug.includes('/') || slug.includes('..')) return null;
  const dir = path.join(ROOT, 'video-projects', slug);
  return fs.existsSync(dir) ? dir : null;
}

async function handleFeedbackWrite(req, res, done) {
  let body;
  try {
    const raw = await readBody(req, 512 * 1024);
    body = raw ? JSON.parse(raw) : {};
  } catch {
    sendError(res, 400, 'Invalid JSON body');
    return;
  }
  const dir = projDirFor(body.slug);
  if (!dir) { sendError(res, 404, 'Unknown project'); return; }
  if (!body.render) { sendError(res, 400, 'Missing render'); return; }

  const result = done
    ? setFeedbackDone(dir, body.render, body.done)
    : writeFeedback(dir, body.render, body.notes);
  if (!result) { sendError(res, 404, 'No feedback for this render'); return; }
  snapshot = null; // la pastille de la grille change
  sendJSON(res, 200, { ok: true, feedback: result });
}

/**
 * Actions du pipeline lancées depuis le hub (lint, rendu, master, vérif).
 * La liste est fermée et vit dans lib/jobs.mjs ; le serveur ne fait que
 * transmettre un identifiant d'action et un slug.
 */
async function handleRun(req, res) {
  let body;
  try {
    const raw = await readBody(req);
    body = raw ? JSON.parse(raw) : {};
  } catch {
    sendError(res, 400, 'Invalid JSON body');
    return;
  }
  const slug = typeof body.slug === 'string' ? body.slug : '';
  if (!projDirFor(slug)) { sendError(res, 404, 'Unknown project'); return; }
  // Le livrable visé : sa composition (ce qu'on rend) et son dernier rendu (ce
  // qu'on masterise ou vérifie). Validés contre le projet, jamais pris au mot.
  const detail = buildProjectDetail(slug);
  const comps = (detail && detail.compositions) || [];
  const composition = comps.includes(String(body.composition || '')) ? String(body.composition) : null;
  const known = (detail && detail.renders || []).some((r) => r.file === body.file);
  // Réglages d'encodage du projet : meta.json, bloc `render`
  let renderCfg = {};
  try {
    const meta = JSON.parse(fs.readFileSync(path.join(ROOT, 'video-projects', slug, 'meta.json'), 'utf8'));
    if (meta && typeof meta.render === 'object' && meta.render) renderCfg = { ...meta.render };
    // Les scaffolds de format déclarent leur fps à la racine du meta.json :
    // on l'accepte là aussi, sinon la moitié des projets ne serait pas lue.
    if (renderCfg.fps == null && Number(meta && meta.fps)) renderCfg.fps = Number(meta.fps);
  } catch { /* pas de meta.json : les défauts s'appliquent */ }

  const file = known ? String(body.file) : null;
  const deliverable = file ? deliverableId(file, comps) : null;
  const ctx = {
    composition,
    file,
    deliverable,
    render: renderCfg,
  };

  // « Envoyer au monteur » : on assemble le bon de commande à partir des
  // retours de ce rendu, et on réserve le numéro de la version suivante. Sans
  // retour, il n'y a rien à envoyer — on le dit plutôt que de lancer un agent
  // devant une page blanche.
  let feedbackRender = null;
  if (String(body.action || '') === 'send-to-editor') {
    const dir = projDirFor(slug);
    const wanted = file ? path.basename(file) : null;
    const files = readFeedback(dir);
    const lot = files.find((f) => f.render === wanted && f.notes.length && !f.done)
      || files.find((f) => f.notes.length && !f.done);
    if (!lot) { sendError(res, 409, 'aucun retour à envoyer sur ce projet'); return; }
    feedbackRender = lot.render;
    ctx.nextRender = nextVersionName(detail, deliverable || deliverableId(lot.render, comps));
    const brief = writeBrief(dir, slug, lot, {
      fps: Number(renderCfg.fps) || 30,
      nextRender: ctx.nextRender,
    });
    ctx.brief = brief.text;
    // Le brief reste sur le disque quoi qu'il arrive : si l'agent ne démarre
    // pas, il y a toujours un fichier prêt à coller dans une conversation.
    ctx.briefRel = brief.rel;
  }

  const { job, error } = startJob(ROOT, slug, String(body.action || ''), (done) => {
    snapshot = null; // un rendu vient de changer le contenu de renders/
    // Les retours ne sont classés que si la nouvelle version est bien sortie :
    // un échec en cours de route les laisse ouverts, ce qui est le bon défaut.
    if (feedbackRender && done.status === 'done') {
      try { setFeedbackDone(projDirFor(slug), feedbackRender, true); } catch { /* sans gravité */ }
    }
  }, ctx);
  if (error) { sendError(res, 409, error); return; }
  sendJSON(res, 200, { ok: true, job, brief: ctx.briefRel || null, nextRender: ctx.nextRender || null });
}

/**
 * Le nom de la prochaine version d'un livrable : on relit les numéros déjà
 * sortis et on prend le suivant. Écraser `draft.mp4` à chaque passage
 * empêcherait de comparer deux versions dans la review, qui est justement ce
 * qu'on y fait.
 */
function nextVersionName(detail, deliverable) {
  const base = deliverable || 'rendu';
  let max = 0;
  for (const r of (detail && detail.renders) || []) {
    const m = /-v(\d+)/i.exec(path.basename(r.file));
    if (m && deliverableId(r.file, detail.compositions || []) === base) {
      max = Math.max(max, Number(m[1]) || 0);
    }
  }
  return `${base}-v${max + 1}.mp4`;
}

/**
 * Retouche visuelle : écrit un lot de modifications dans la source d'une
 * composition. Le fichier visé est toujours `index.html` ou
 * `compositions/<nom>.html` DU projet — jamais un chemin venu du navigateur.
 *
 * Une sauvegarde part dans .backup/ avant la première écriture de la session
 * d'édition : ce qu'on touche ici n'est pas suivi par git.
 */
function compositionAbs(slug, file) {
  const projDir = projDirFor(slug);
  if (!projDir) return null;
  const rel = String(file || 'index.html').replace(/^\/+/, '');
  const ok = rel === 'index.html' || /^compositions\/[A-Za-z0-9._-]+\.html$/.test(rel);
  if (!ok) return null;
  const abs = path.join(projDir, rel);
  if (!abs.startsWith(projDir + path.sep)) return null;
  if (!fs.existsSync(abs)) return null;
  return abs;
}

async function handleEdit(req, res) {
  let body;
  try {
    const raw = await readBody(req, 256 * 1024);
    body = raw ? JSON.parse(raw) : {};
  } catch {
    sendError(res, 400, 'Invalid JSON body');
    return;
  }
  const slug = typeof body.slug === 'string' ? body.slug : '';
  if (!slug || slug.includes('/')) { sendError(res, 400, 'Bad slug'); return; }
  if (!projDirFor(slug)) { sendError(res, 404, 'Unknown project'); return; }

  const abs = compositionAbs(slug, body.file);
  if (!abs) { sendError(res, 400, 'Fichier de composition invalide'); return; }

  const edits = Array.isArray(body.edits) ? body.edits : [];
  if (!edits.length) { sendError(res, 400, 'Aucune retouche'); return; }

  // Garde-fou : le moteur HyperFrames tamponne des `data-start`/`data-duration`
  // fictifs sur les éléments qui n'en ont pas, dans l'aperçu. Les écrire dans la
  // source transformerait une animation en clip chronométré — l'élément
  // disparaîtrait du début de la vidéo au rendu. On refuse donc de CRÉER ces
  // attributs : on ne fait que modifier ceux qui existent déjà.
  const src = fs.readFileSync(abs, 'utf8');
  for (const e of edits) {
    for (const name of Object.keys((e && e.attrs) || {})) {
      if (name !== 'data-start' && name !== 'data-duration') continue;
      const tag = new RegExp(`<[a-zA-Z][^>]*(^|\\s)id\\s*=\\s*"${String(e.id).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>`)
        .exec(src);
      if (!tag || !new RegExp(`\\s${name}\\s*=`).test(tag[0])) {
        sendError(res, 409, `#${e.id} n'a pas de ${name} dans la source : son timing vit dans la ` +
          `timeline GSAP, pas dans un attribut. Créer l'attribut le ferait disparaître au rendu.`);
        return;
      }
    }
  }

  // sauvegarde avant d'écrire — le script est le même que pour le monteur
  const snap = spawnSync('node',
    [path.join(ROOT, 'scripts', 'snapshot-project.mjs'), slug, 'avant retouche visuelle'],
    { cwd: ROOT, encoding: 'utf8' });

  try {
    const result = applyEdits(abs, edits);
    snapshot = null; // la composition a changé : les rendus deviennent périmés
    sendJSON(res, 200, { ok: true, ...result, backup: (snap.stdout || '').trim() });
  } catch (e) {
    sendError(res, 409, e && e.message ? e.message : 'retouche impossible');
  }
}

/**
 * Le Studio HyperFrames d'un projet. Le hub ne le refait pas : il l'ouvre, le
 * retrouve et le ferme. Voir lib/studio.mjs pour le pourquoi.
 */
async function handleStudio(req, res, slug, method) {
  const projDir = projDirFor(slug);
  if (!projDir) { sendError(res, 404, 'Unknown project'); return; }

  if (method === 'DELETE') {
    sendJSON(res, 200, await closeStudio(projDir));
    return;
  }

  const r = await openStudio(projDir, {
    // Le Studio réécrit des data-hf-id dans la source dès qu'il sert la
    // composition : on prend une photo avant, comme pour toute écriture.
    snapshot: () => spawnSync('node',
      [path.join(ROOT, 'scripts', 'snapshot-project.mjs'), slug, 'avant ouverture du Studio'],
      { cwd: ROOT, encoding: 'utf8' }),
  });
  if (r.error) { sendError(res, 500, r.error); return; }
  sendJSON(res, 200, r);
}

// --- router ---
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  try {
    if (req.method === 'GET' && pathname === '/api/state') {
      sendJSON(res, 200, getSnapshot().state);
      return;
    }

    if (req.method === 'GET' && pathname.startsWith('/api/project/')) {
      const slug = decodeURIComponent(pathname.slice('/api/project/'.length));
      if (!slug || slug.includes('/')) {
        sendError(res, 400, 'Bad slug');
        return;
      }
      const detail = buildProjectDetail(slug);
      if (!detail) {
        sendError(res, 404, 'Unknown project');
        return;
      }
      sendJSON(res, 200, detail);
      return;
    }

    if (req.method === 'GET' && pathname.startsWith('/api/thumb/')) {
      const slug = decodeURIComponent(pathname.slice('/api/thumb/'.length));
      if (!slug || slug.includes('/')) { sendError(res, 400, 'Bad slug'); return; }
      const kind = url.searchParams.get('kind') === 'loop' ? 'loop' : 'poster';
      await handleThumb(req, res, slug, kind, url.searchParams.get('file') || null);
      return;
    }

    if (req.method === 'GET' && pathname === '/api/prune-all') {
      const all = prunePlanAll(url.searchParams.get('keep'));
      sendJSON(res, 200, {
        keep: all.keep,
        removeCount: all.removeCount,
        freeBytes: all.freeBytes,
        protected: all.protected,
        // un résumé par projet : la liste complète des 48 fichiers n'aide
        // personne à décider, le volume et le nom du projet si
        projects: all.projects.map((p) => ({
          slug: p.slug,
          removed: p.remove.length,
          bytes: p.freeBytes,
          deliverables: p.deliverables,
        })),
      });
      return;
    }

    if (req.method === 'POST' && pathname === '/api/prune-all') {
      await handlePruneAll(req, res);
      return;
    }

    if (req.method === 'GET' && pathname.startsWith('/api/prune/')) {
      const slug = decodeURIComponent(pathname.slice('/api/prune/'.length));
      if (!slug || slug.includes('/')) { sendError(res, 400, 'Bad slug'); return; }
      const plan = prunePlanFor(slug, url.searchParams.get('keep'));
      if (!plan) { sendError(res, 404, 'Unknown project'); return; }
      sendJSON(res, 200, plan);
      return;
    }

    if (pathname.startsWith('/api/studio/') && (req.method === 'POST' || req.method === 'DELETE')) {
      const slug = decodeURIComponent(pathname.slice('/api/studio/'.length));
      if (!slug || slug.includes('/')) { sendError(res, 400, 'Bad slug'); return; }
      await handleStudio(req, res, slug, req.method);
      return;
    }

    if (req.method === 'GET' && pathname === '/api/studios') {
      sendJSON(res, 200, { studios: await listStudios() });
      return;
    }

    if (req.method === 'POST' && pathname === '/api/edit') {
      await handleEdit(req, res);
      return;
    }

    if (req.method === 'POST' && pathname === '/api/prune') {
      await handlePrune(req, res);
      return;
    }

    if (req.method === 'GET' && pathname.startsWith('/api/feedback/')) {
      const slug = decodeURIComponent(pathname.slice('/api/feedback/'.length));
      const dir = projDirFor(slug);
      if (!dir) { sendError(res, 404, 'Unknown project'); return; }
      sendJSON(res, 200, { slug, files: readFeedback(dir) });
      return;
    }

    if (req.method === 'POST' && pathname === '/api/feedback') {
      await handleFeedbackWrite(req, res, false);
      return;
    }

    if (req.method === 'POST' && pathname === '/api/feedback/done') {
      await handleFeedbackWrite(req, res, true);
      return;
    }

    if (req.method === 'GET' && pathname === '/api/actions') {
      sendJSON(res, 200, { actions: listActions(ROOT) });
      return;
    }

    if (req.method === 'POST' && pathname === '/api/run') {
      await handleRun(req, res);
      return;
    }

    if (req.method === 'GET' && pathname.startsWith('/api/job/')) {
      const id = decodeURIComponent(pathname.slice('/api/job/'.length));
      const job = getJob(id, Number(url.searchParams.get('since')) || 0);
      if (!job) { sendError(res, 404, 'Unknown job'); return; }
      sendJSON(res, 200, job);
      return;
    }

    if (req.method === 'GET' && pathname.startsWith('/api/jobs/')) {
      const slug = decodeURIComponent(pathname.slice('/api/jobs/'.length));
      sendJSON(res, 200, { jobs: listJobs(slug) });
      return;
    }

    if (req.method === 'POST' && pathname.startsWith('/api/job-stop/')) {
      const id = decodeURIComponent(pathname.slice('/api/job-stop/'.length));
      sendJSON(res, 200, { ok: stopJob(id) });
      return;
    }

    if (req.method === 'GET' && pathname === '/api/libraries') {
      getSnapshot(); // keep snapshot warm/consistent
      sendJSON(res, 200, scanLibraries());
      return;
    }

    if (req.method === 'GET' && pathname.startsWith('/api/style/')) {
      const id = decodeURIComponent(pathname.slice('/api/style/'.length));
      if (!id || id.includes('/')) { sendError(res, 400, 'Bad style id'); return; }
      const style = scanStyle(id);
      if (!style) { sendError(res, 404, 'Unknown style'); return; }
      sendJSON(res, 200, style);
      return;
    }

    if (req.method === 'GET' && pathname === '/api/reviews') {
      getSnapshot(); // garde le snapshot chaud/cohérent
      sendJSON(res, 200, scanReviews());
      return;
    }

    if (req.method === 'GET' && pathname === '/api/activity') {
      const snap = getSnapshot();
      const activity = await buildActivity(snap.recentFiles);
      sendJSON(res, 200, activity);
      return;
    }

    if (req.method === 'GET' && pathname === '/api/agents') {
      const snap = getSnapshot();
      const agentsState = buildAgentsState(snap, url.searchParams.get('force'));
      sendJSON(res, 200, agentsState);
      return;
    }

    if (req.method === 'POST' && pathname === '/api/rescan') {
      const result = rescan();
      sendJSON(res, 200, { ok: true, scannedAt: result.scannedAt, ms: result.scanMs });
      return;
    }

    if (req.method === 'POST' && pathname === '/api/reveal') {
      await handleReveal(req, res);
      return;
    }

    if (req.method === 'GET' && pathname === '/hf-runtime.js') {
      fs.stat(HF_RUNTIME, (err, st) => {
        if (err) { sendError(res, 404, 'runtime hyperframes introuvable'); return; }
        res.writeHead(200, {
          'Content-Type': 'application/javascript; charset=utf-8',
          'Content-Length': st.size,
          'Cache-Control': 'no-store',
        });
        fs.createReadStream(HF_RUNTIME).pipe(res);
      });
      return;
    }

    if (req.method === 'GET' && pathname.startsWith('/workspace/')) {
      serveWorkspace(req, res, pathname);
      return;
    }

    if (req.method === 'GET') {
      serveStatic(req, res, pathname);
      return;
    }

    sendError(res, 404, 'Not found');
  } catch (e) {
    sendError(res, 500, e && e.message ? e.message : 'Internal error');
  }
});

server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.error(
      `[editing-os] Port ${PORT} is already in use. This server never auto-increments. ` +
        `Free the port or set PORT=<n> and retry.`
    );
    process.exit(1);
  }
  console.error('[editing-os] server error:', err);
  process.exit(1);
});

server.listen(PORT, () => {
  // Warm the snapshot once at startup and log the scan time.
  const t0 = Date.now();
  const result = rescan();
  const warmMs = Date.now() - t0;
  console.log(
    `[editing-os] listening on http://localhost:${PORT}  ` +
      `(scanned ${result.state.projects.length} projects in ${result.scanMs}ms, warm ${warmMs}ms)`
  );
});
