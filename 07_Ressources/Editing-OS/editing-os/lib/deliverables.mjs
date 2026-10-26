// editing-os/lib/deliverables.mjs
// Un projet, plusieurs livrables.
//
// Un projet n'est pas une vidéo : c'est un tournage. D'un même rush sortent
// quatre ou cinq publicités différentes ; d'une vidéo YouTube sortent
// plusieurs formats verticaux. Le dossier `compositions/` le dit déjà —
// demo-3d-marc en porte trois, avec un rendu chacun.
//
// D'où le regroupement : un livrable, c'est le nom de base d'un rendu, une
// fois retirés les suffixes qui ne désignent qu'une VERSION du même livrable
// (-v3, -master, -draft, un horodatage). « reel-v19-master.mp4 » et
// « reel-v17.mp4 » sont deux états du livrable « reel » ; « b-comparatif.mp4 »
// est un autre livrable.
//
// La distinction n'est pas cosmétique : ranger « les 3 derniers rendus » d'un
// projet qui porte cinq publicités finies en jetterait deux. On range les 3
// derniers DE CHAQUE livrable.

import path from 'node:path';

const MASTER_RE = /-master$/i;
// Les suffixes de version, retirés de droite à gauche.
const VERSION_SUFFIXES = [
  /-master$/i,
  // v9, v9b : la lettre marque une variante de la même version, pas un autre livrable
  /[-_]?v\d+[a-z]?$/i,
  /[-_](draft|standard|final|export|preview|publication)$/i,
  // « v2a-draft-06 » : le numéro qui SUIT un marqueur de version en est un aussi.
  // On ne touche pas à un numéro isolé — « ad-01 » et « ad-02 » restent deux
  // publicités différentes, pas deux versions d'une même.
  /[-_](draft|standard|final|export|preview|publication)[-_]\d{1,3}$/i,
  /_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}$/,
  /-\d{8,}$/,
];

/** Nom de base d'un rendu : ce qui reste quand on ôte la version. */
export function deliverableId(file, compositionNames = []) {
  let base = path.basename(String(file)).replace(/\.(mp4|webm|mov)$/i, '');

  // Une composition qui porte ce préfixe fait autorité : c'est elle qui a
  // produit le rendu, et son nom est le nom du livrable.
  const hit = compositionNames
    .filter((c) => base === c || base.startsWith(c + '-') || base.startsWith(c + '_'))
    .sort((a, b) => b.length - a.length)[0];
  if (hit) return hit;

  let changed = true;
  while (changed) {
    changed = false;
    for (const re of VERSION_SUFFIXES) {
      // les séparateurs restés en fin de nom partent avec : « nom--v09 » donne
      // « nom », pas « nom-- »
      const next = base.replace(re, '').replace(/[-_]+$/, '');
      if (next !== base && next.length) {
        base = next;
        changed = true;
      }
    }
  }
  return base || path.basename(String(file));
}

/**
 * Regroupe les rendus par livrable, le plus récemment touché d'abord.
 * `renders` : [{ file, mtime, bytes, kind, durationMs, stale }]
 */
export function groupRenders(renders, compositionNames = []) {
  const byId = new Map();
  for (const r of renders || []) {
    // La livraison finale reste rattachée à son livrable : le nom du fichier
    // dans renders/final/ est le même, seul le dossier change.
    const id = deliverableId(r.file, compositionNames);
    if (!byId.has(id)) byId.set(id, []);
    byId.get(id).push(r);
  }

  const out = [];
  for (const [id, list] of byId) {
    const sorted = list.slice().sort((a, b) => b.mtime - a.mtime);
    const master = sorted.find((r) => MASTER_RE.test(
      path.basename(r.file).replace(/\.(mp4|webm|mov)$/i, '')
    ));
    const latest = master || sorted[0];
    out.push({
      id,
      renders: sorted,
      versions: sorted.length,
      bytes: sorted.reduce((n, r) => n + (r.bytes || 0), 0),
      lastTouched: sorted[0].mtime,
      latest: {
        file: latest.file,
        mtime: latest.mtime,
        bytes: latest.bytes,
        kind: latest.kind,
        durationMs: latest.durationMs,
        stale: !!latest.stale,
        master: !!master,
        // un rendu plus frais que le master existe : la page projet le dit
        newerExists: !!master && sorted[0].file !== latest.file,
        newerFile: !!master && sorted[0].file !== latest.file ? sorted[0].file : null,
      },
    });
  }
  out.sort((a, b) => b.lastTouched - a.lastTouched);
  return out;
}
