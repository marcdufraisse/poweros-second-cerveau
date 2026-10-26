#!/usr/bin/env node
// scripts/snapshot-project.mjs
// Copie la composition d'un projet dans .backup/<horodatage>/ avant qu'un agent
// y touche.
//
// Rien sous video-projects/ n'est suivi par git : une modification automatique
// d'index.html n'aurait aucun retour en arrière. Ce filet coûte quelques
// kilo-octets et une fraction de seconde, et il rend « envoyer au monteur »
// rattrapable — c'est ce qui permet de lancer l'agent sans retenir sa respiration.
//
// Usage : node scripts/snapshot-project.mjs <slug> [raison]

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.dirname(import.meta.dirname);
const PROJECTS = path.join(ROOT, 'video-projects');

// Ce qui définit le montage. Les rendus et les assets n'y sont pas : lourds,
// et régénérables ou intacts de toute façon.
const KEEP_FILES = ['index.html', 'meta.json', 'hyperframes.json', 'tokens.css', 'review.html'];
const KEEP_DIRS = ['compositions', 'cards'];

const slug = process.argv[2];
const reason = process.argv[3] || '';
if (!slug) {
  console.error('usage : node scripts/snapshot-project.mjs <slug> [raison]');
  process.exit(2);
}

const projDir = path.join(PROJECTS, slug);
if (!fs.existsSync(projDir)) {
  console.error(`projet inconnu : ${slug}`);
  process.exit(2);
}

const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
const dest = path.join(projDir, '.backup', stamp);
fs.mkdirSync(dest, { recursive: true });

let count = 0;
let bytes = 0;

for (const name of KEEP_FILES) {
  const src = path.join(projDir, name);
  if (!fs.existsSync(src)) continue;
  fs.copyFileSync(src, path.join(dest, name));
  bytes += fs.statSync(src).size;
  count++;
}

for (const dir of KEEP_DIRS) {
  const src = path.join(projDir, dir);
  if (!fs.existsSync(src)) continue;
  fs.cpSync(src, path.join(dest, dir), { recursive: true });
  for (const f of fs.readdirSync(src)) {
    const st = fs.statSync(path.join(src, f));
    if (st.isFile()) {
      bytes += st.size;
      count++;
    }
  }
}

if (reason) fs.writeFileSync(path.join(dest, 'RAISON.txt'), reason + '\n');

console.log(`sauvegarde : ${count} fichier(s), ${(bytes / 1024).toFixed(0)} Ko → ${path.relative(ROOT, dest)}`);
