// editing-os/lib/studio.mjs
// Lancer, retrouver et arrêter le Studio HyperFrames, un par projet.
//
// Pourquoi le Studio et pas un éditeur maison : il fait déjà tout ce qu'on
// voulait, et mieux — timeline à pistes avec images-clés par propriété, rasoir,
// aimantation, mixeur audio avec formes d'onde, inspecteur, lint, export. Et
// surtout il ÉCRIT dans la source par une API transactionnelle qui sauvegarde
// avant chaque écriture (.hyperframes/backup) et annule le lot si un fichier
// résiste. Refaire ça à côté, c'était doubler le travail en moins sûr.
//
// Ce que le hub garde pour lui : la vue de tous les projets et de leurs
// livrables, la review horodatée qui devient un brief, et les actions du
// pipeline. Le Studio ne sait rien de tout ça.
//
// Trois choses à savoir, toutes vérifiées à l'exécution :
//
//  1. Le Studio détaché SURVIT au hub (`detached: true`, PPID 1). Il ne peut
//     donc pas vivre dans jobs.mjs, où une action bloque le projet jusqu'à la
//     sortie du process — un Studio ouvert y interdirait rendu et vérification.
//  2. Il n'expose AUCUN en-tête CORS : le navigateur du hub ne pourra jamais
//     lire son API. Tout dialogue passe par ce module, côté serveur.
//  3. Ouvrir un Studio coûte 400 à 600 Mo (il lance son propre pool Chrome).
//     D'où le plafond et la purge du plus ancien.

import http from 'node:http';
import path from 'node:path';
import { execFile, spawnSync } from 'node:child_process';

const BASE_PORT = 3900;
// EXACTEMENT la fenêtre que balaie la CLI depuis --port : au-delà, on louperait
// un studio qu'elle a placé plus loin, et on en lancerait un doublon.
const SPAN = 100;
const MAX_OPEN = 3;

const lastUsed = new Map(); // projectDir -> horodatage

/** Le serveur répond-il déjà sur sa page ? */
function ready(port, timeoutMs = 500) {
  return new Promise((resolve) => {
    const req = http.get({ host: '127.0.0.1', port, path: '/', timeout: timeoutMs }, (res) => {
      res.resume();
      resolve(res.statusCode === 200);
    });
    req.on('timeout', () => { req.destroy(); resolve(false); });
    req.on('error', () => resolve(false));
  });
}

/** Interroge un port : est-ce un Studio, et pour quel projet ? */
function probe(port, timeoutMs = 300) {
  return new Promise((resolve) => {
    const req = http.get(
      { host: '127.0.0.1', port, path: '/__hyperframes_config', timeout: timeoutMs },
      (res) => {
        if (res.statusCode !== 200) { res.resume(); resolve(null); return; }
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (c) => { body += c; if (body.length > 64 * 1024) req.destroy(); });
        res.on('end', () => {
          try {
            const cfg = JSON.parse(body);
            resolve(cfg && cfg.isHyperframes ? { port, ...cfg } : null);
          } catch { resolve(null); }
        });
      }
    );
    req.on('timeout', () => { req.destroy(); resolve(null); });
    req.on('error', () => resolve(null));
  });
}

/**
 * Les Studios réellement vivants. On sonde les ports plutôt que de lire les
 * fichiers de session de la CLI : un studio orphelin (session perdue, process
 * encore là) est invisible aux fichiers mais bien présent sur son port — et
 * c'est exactement celui qui mange 400 Mo pour rien.
 */
export async function list() {
  const found = [];
  for (let i = 0; i < SPAN; i += 20) {
    const batch = [];
    for (let p = BASE_PORT + i; p < BASE_PORT + Math.min(i + 20, SPAN); p++) batch.push(probe(p));
    (await Promise.all(batch)).forEach((r) => { if (r) found.push(r); });
  }
  return found;
}

export async function findFor(projDir) {
  const all = await list();
  const want = path.resolve(projDir);
  return all.find((s) => path.resolve(s.projectDir || '') === want) || null;
}

/**
 * Ouvre le Studio d'un projet, ou rend celui qui tourne déjà (la CLI est
 * idempotente par projet : relancer réutilise le même process).
 *
 * `snapshot` est appelé avant le premier lancement. Ce n'est pas de la
 * précaution excessive : le Studio réécrit des attributs `data-hf-id` dans les
 * fichiers source dès qu'il sert la composition. C'est bénin, mais ça modifie
 * des fichiers, et on ne fait pas ça dans le dos de quelqu'un.
 */
export async function open(projDir, { snapshot } = {}) {
  const existing = await findFor(projDir);
  if (existing) {
    lastUsed.set(path.resolve(projDir), Date.now());
    await settle(existing.port);
    return { ...existing, reused: true, url: `http://127.0.0.1:${existing.port}` };
  }

  await evictIfNeeded();
  if (typeof snapshot === 'function') snapshot();

  const r = spawnSync('npx',
    ['hyperframes', 'preview', '--background', '--no-open', '--port', String(BASE_PORT)],
    { cwd: projDir, encoding: 'utf8', timeout: 60000 });
  if (r.error) return { error: r.error.message };

  // Le port annoncé n'est pas fiable (la CLI saute les ports pris) : on cherche
  // le studio par son projectDir, en laissant le temps au serveur d'écouter.
  for (let i = 0; i < 20; i++) {
    const s = await findFor(projDir);
    if (s) {
      lastUsed.set(path.resolve(projDir), Date.now());
      // Répondre sur /__hyperframes_config ne veut pas dire servir l'interface :
      // rendre la main trop tôt donnait une iframe blanche qu'il fallait
      // recharger à la main.
      await settle(s.port);
      return { ...s, reused: false, url: `http://127.0.0.1:${s.port}` };
    }
    await new Promise((res) => setTimeout(res, 400));
  }
  return { error: (r.stderr || r.stdout || '').trim().split('\n').slice(-2).join(' ') || 'studio introuvable après lancement' };
}

/** Attend que la page du Studio réponde, quelques secondes au plus. */
async function settle(port) {
  for (let i = 0; i < 12; i++) {
    if (await ready(port)) return true;
    await new Promise((r) => setTimeout(r, 400));
  }
  return false;
}

export function close(projDir) {
  lastUsed.delete(path.resolve(projDir));
  return new Promise((resolve) => {
    execFile('npx', ['hyperframes', 'preview', '--stop'],
      { cwd: projDir, timeout: 30000 }, (err, stdout, stderr) => {
        resolve({ ok: !err, out: String(stdout || stderr || '').trim() });
      });
  });
}

/** Au-delà du plafond, on ferme le Studio le moins récemment ouvert. */
async function evictIfNeeded() {
  const open_ = await list();
  if (open_.length < MAX_OPEN) return;
  const scored = open_
    .map((s) => ({ s, t: lastUsed.get(path.resolve(s.projectDir || '')) || 0 }))
    .sort((a, b) => a.t - b.t);
  const victim = scored[0];
  if (victim && victim.s.projectDir) await close(victim.s.projectDir);
}

export const STUDIO_LIMITS = { basePort: BASE_PORT, span: SPAN, maxOpen: MAX_OPEN };
