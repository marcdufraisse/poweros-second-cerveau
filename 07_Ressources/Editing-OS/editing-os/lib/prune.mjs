// editing-os/lib/prune.mjs
// Rangement des rendus : ne garder que les N derniers d'un projet.
//
// Un reel monté sur 18 versions laisse 18 MP4 dans renders/ — 175 Mo pour cinq
// projets, et surtout une liste dans laquelle on ne retrouve plus rien. La
// règle : on garde les N plus récents **de chaque livrable**, et on protège
// deux choses quoi qu'il arrive.
//
// Par livrable, et non par projet : un projet porte souvent plusieurs vidéos
// différentes — quatre publicités tirées du même rush, plusieurs formats
// courts tirés d'une vidéo longue. « Garder les 3 derniers du projet » y
// jetterait des livrables finis. Voir deliverables.mjs.
//
//   1. Les masters (-master.mp4) : c'est le fichier publié, celui qui porte le
//      niveau audio de sortie. Il est souvent plus ancien que le dernier draft.
//   2. renders/final/ : la livraison. Elle ne se recalcule pas.
//
// Rien n'est supprimé : les fichiers partent à la corbeille du système, donc
// une erreur de manipulation se rattrape en deux clics.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { groupRenders } from './deliverables.mjs';

const DEFAULT_KEEP = 3;
const MASTER_RE = /-master\.(mp4|webm|mov)$/i;

/** Ce qui partirait, sans rien toucher. */
export function planPrune(renders, keep = DEFAULT_KEEP, compositionNames = []) {
  const n = Math.max(1, Number(keep) || DEFAULT_KEEP);
  const groups = groupRenders(renders, compositionNames);

  const remove = [];
  const byDeliverable = [];
  let kept = 0;
  let protectedCount = 0;

  for (const g of groups) {
    const candidates = [];
    for (const r of g.renders) {
      if (r.file.startsWith('renders/final/') || MASTER_RE.test(r.file)) protectedCount++;
      else candidates.push(r);
    }
    candidates.sort((a, b) => b.mtime - a.mtime);
    const drop = candidates.slice(n);
    kept += candidates.slice(0, n).length;
    if (drop.length) {
      byDeliverable.push({
        id: g.id,
        removed: drop.length,
        bytes: drop.reduce((sum, r) => sum + (r.bytes || 0), 0),
      });
    }
    for (const r of drop) {
      remove.push({ file: r.file, bytes: r.bytes, mtime: r.mtime, kind: r.kind, deliverable: g.id });
    }
  }

  remove.sort((a, b) => b.mtime - a.mtime);
  return {
    keep: n,
    kept: kept + protectedCount,
    protected: protectedCount,
    deliverables: groups.length,
    byDeliverable,
    remove,
    freeBytes: remove.reduce((sum, r) => sum + (r.bytes || 0), 0),
  };
}

function trashDir() {
  const mac = path.join(os.homedir(), '.Trash');
  try {
    if (fs.statSync(mac).isDirectory()) return mac;
  } catch {
    /* pas macOS */
  }
  const fallback = path.join(import.meta.dirname, '..', '.cache', 'trash');
  fs.mkdirSync(fallback, { recursive: true });
  return fallback;
}

function freeName(dir, base) {
  let name = base;
  let i = 2;
  while (fs.existsSync(path.join(dir, name))) {
    const ext = path.extname(base);
    name = `${base.slice(0, base.length - ext.length)} ${i}${ext}`;
    i++;
  }
  return path.join(dir, name);
}

/**
 * Applique le plan. Renvoie ce qui a bougé et ce qui a résisté.
 * Le sidecar .meta.json d'un rendu suit son MP4 — sinon il reste orphelin.
 */
export function applyPrune(projDir, plan) {
  const dir = trashDir();
  const moved = [];
  const failed = [];

  for (const r of plan.remove) {
    const abs = path.join(projDir, r.file);
    try {
      fs.renameSync(abs, freeName(dir, `${path.basename(projDir)}__${path.basename(r.file)}`));
      moved.push(r.file);
    } catch (e) {
      failed.push({ file: r.file, error: e && e.message ? e.message : 'move failed' });
      continue;
    }
    const sidecar = abs.replace(/\.(mp4|webm|mov)$/i, '.meta.json');
    try {
      if (fs.existsSync(sidecar)) {
        fs.renameSync(sidecar, freeName(dir, `${path.basename(projDir)}__${path.basename(sidecar)}`));
      }
    } catch {
      /* le sidecar n'est qu'un cache de durée */
    }
  }
  return { moved, failed, trash: dir, freedBytes: plan.freeBytes };
}
