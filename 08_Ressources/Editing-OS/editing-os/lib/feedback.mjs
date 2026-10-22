// editing-os/lib/feedback.mjs
// Les retours de review, écrits dans le projet.
//
// Avant : les retours vivaient dans le localStorage du navigateur, et le seul
// moyen de les faire arriver jusqu'ici était « Copier pour Claude » puis un
// coller manuel. Un changement de navigateur, un cache vidé, une session
// fermée, et les retours de la v14 n'existaient plus nulle part.
//
// Maintenant : un fichier par rendu, dans `video-projects/<slug>/review/`.
// N'importe quelle session les relit sans copier-coller, et on garde
// l'historique version par version — ce qui permet de voir ce qui revient.

import fs from 'node:fs';
import path from 'node:path';

const NOTE_CAP = 500;

function reviewDir(projDir) {
  return path.join(projDir, 'review');
}

// Le nom du fichier suit le rendu : des notes sur la v17 n'ont aucun sens sur
// la v18, les timecodes ont bougé.
function fileFor(projDir, render) {
  const base = path.basename(String(render || 'rendu')).replace(/\.(mp4|webm|mov)$/i, '');
  const safe = base.replace(/[^a-zA-Z0-9._-]+/g, '-');
  return path.join(reviewDir(projDir), `${safe}.json`);
}

function readJSON(abs) {
  try {
    const st = fs.statSync(abs);
    if (!st.isFile() || st.size > 512 * 1024) return null;
    return JSON.parse(fs.readFileSync(abs, 'utf8'));
  } catch {
    return null;
  }
}

/** Tous les retours d'un projet, le plus récemment touché d'abord. */
export function readFeedback(projDir) {
  const dir = reviewDir(projDir);
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const out = [];
  for (const e of entries) {
    if (!e.isFile() || !e.name.endsWith('.json')) continue;
    const abs = path.join(dir, e.name);
    const obj = readJSON(abs);
    if (!obj || !Array.isArray(obj.notes)) continue;
    out.push({
      file: `review/${e.name}`,
      render: obj.render || e.name.replace(/\.json$/, ''),
      updatedAt: obj.updatedAt || 0,
      done: !!obj.done,
      notes: obj.notes
        .filter((n) => n && typeof n.txt === 'string')
        .map((n) => ({ t: Number(n.t) || 0, txt: String(n.txt).slice(0, 2000) })),
    });
  }
  out.sort((a, b) => b.updatedAt - a.updatedAt);
  return out;
}

/** Ce que la grille affiche : combien de retours restent à traiter. */
export function feedbackSummary(projDir) {
  const all = readFeedback(projDir);
  let open = 0;
  let total = 0;
  for (const f of all) {
    total += f.notes.length;
    if (!f.done) open += f.notes.length;
  }
  return { open, total, files: all.length };
}

/**
 * Écrit les retours d'un rendu. Ajouter une note à un lot déjà marqué traité
 * le rouvre : sinon un retour arrivé après coup disparaîtrait sans bruit.
 */
export function writeFeedback(projDir, render, notes) {
  const abs = fileFor(projDir, render);
  const prev = readJSON(abs);
  const clean = (Array.isArray(notes) ? notes : [])
    .slice(0, NOTE_CAP)
    .filter((n) => n && typeof n.txt === 'string' && n.txt.trim())
    .map((n) => ({ t: Math.max(0, Number(n.t) || 0), txt: String(n.txt).trim().slice(0, 2000) }))
    .sort((a, b) => a.t - b.t);

  const changed = !prev || JSON.stringify(prev.notes || []) !== JSON.stringify(clean);
  const body = {
    project: path.basename(projDir),
    render: String(render || ''),
    updatedAt: Date.now(),
    done: changed ? false : !!(prev && prev.done),
    notes: clean,
  };
  fs.mkdirSync(reviewDir(projDir), { recursive: true });
  fs.writeFileSync(abs, JSON.stringify(body, null, 2) + '\n');
  return body;
}

/** Marque un lot traité (ou le rouvre). */
export function setFeedbackDone(projDir, render, done) {
  const abs = fileFor(projDir, render);
  const prev = readJSON(abs);
  if (!prev) return null;
  prev.done = !!done;
  prev.updatedAt = Date.now();
  fs.writeFileSync(abs, JSON.stringify(prev, null, 2) + '\n');
  return prev;
}
