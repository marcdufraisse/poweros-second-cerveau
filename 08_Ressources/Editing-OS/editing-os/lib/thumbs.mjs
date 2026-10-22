// editing-os/lib/thumbs.mjs
// Vignettes des rendus : une image fixe (poster) et une boucle animée (gif).
//
// Pourquoi côté serveur : la grille des projets doit dire en un coup d'œil DE
// QUELLE vidéo il s'agit. Un <video> par carte ferait décoder cinq MP4 pour
// afficher cinq images — on extrait donc une frame avec ffmpeg, une seule fois,
// et on la met en cache sur disque.
//
// Le cache est indexé par (fichier, mtime) : un nouveau rendu produit une
// nouvelle clé, donc rien à invalider à la main. Les entrées d'un rendu
// précédent sont balayées à la génération suivante du même projet.

import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';

import { ensureInfo } from './media-info.mjs';

const CACHE_DIR = path.join(import.meta.dirname, '..', '.cache', 'thumbs');

// Une génération à la fois par clé : deux cartes qui demandent la même vignette
// au chargement ne doivent pas lancer deux ffmpeg.
const inFlight = new Map();

function run(cmd, args, timeout) {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { timeout, maxBuffer: 4 * 1024 * 1024 }, (err, stdout) => {
      if (err) reject(err);
      else resolve(String(stdout || ''));
    });
  });
}

function ensureCacheDir() {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

function safeKey(s) {
  return String(s).replace(/[^a-zA-Z0-9._-]+/g, '_');
}

// La durée vient du même cache que les dimensions : un seul ffprobe par rendu
// sert la vignette et le filtre par format.
async function probeDuration(abs, mtime) {
  const info = await ensureInfo(abs, mtime);
  return info && info.dur ? info.dur : null;
}

// Le premier plan d'un reel est souvent un fondu ou une carte d'intro : à 22%
// de la durée on est déjà dans le vif du sujet, ce qui rend la vignette
// reconnaissable. On reste borné pour les rendus très longs.
function sampleTime(duration) {
  if (!duration) return 1.5;
  return Math.min(Math.max(duration * 0.22, 0.4), 30);
}

// Balaye les vignettes d'un projet qui ne correspondent plus au rendu courant.
// On garde TOUT ce qui porte le stem du rendu courant, pas seulement le fichier
// qu'on vient d'écrire : le poster et la boucle partagent ce stem et ne doivent
// pas se chasser l'un l'autre.
function sweep(slug, keepStem) {
  let entries;
  try {
    entries = fs.readdirSync(CACHE_DIR);
  } catch {
    return;
  }
  const prefix = safeKey(slug) + '__';
  for (const name of entries) {
    if (!name.startsWith(prefix) || name.startsWith(keepStem + '.')) continue;
    try {
      fs.unlinkSync(path.join(CACHE_DIR, name));
    } catch {
      /* le cache n'est jamais critique */
    }
  }
}

/**
 * Chemin d'une vignette, générée à la demande puis servie depuis le cache.
 *
 * kind: 'poster' (jpg, une frame) ou 'loop' (webp animé, ~2,4 s à 10 fps).
 * Renvoie le chemin absolu du fichier, ou null si ffmpeg n'a pas pu produire
 * l'image (ffmpeg absent, rendu illisible) — l'appelant répond alors 404 et
 * l'interface se contente du bloc vide.
 */
export function buildThumb(slug, render, kind) {
  // GIF et pas WebP animé : le ffmpeg de Homebrew est compilé sans encodeur
  // webp, alors que l'encodeur gif est présent partout. Une boucle de 2,4 s en
  // 380 px pèse quelques centaines de Ko — sans conséquence en local.
  const ext = kind === 'loop' ? 'gif' : 'jpg';
  const stem = `${safeKey(slug)}__${safeKey(path.basename(render.file))}__${render.mtime}`;
  const out = path.join(CACHE_DIR, `${stem}.${ext}`);

  try {
    const st = fs.statSync(out);
    if (st.isFile() && st.size > 0) return Promise.resolve(out);
  } catch {
    /* pas encore en cache */
  }

  if (inFlight.has(out)) return inFlight.get(out);

  const job = (async () => {
    ensureCacheDir();
    const duration = await probeDuration(render.abs, render.mtime);
    const t = sampleTime(duration);
    const tmp = out + '.tmp.' + process.pid + '.' + ext;

    const args =
      kind === 'loop'
        ? [
            '-y', '-ss', String(t), '-t', '2.4', '-i', render.abs,
            '-an',
            // palettegen/paletteuse en une passe : sans palette dédiée, un
            // dégradé de fond vire au bruit dans les 256 couleurs du GIF.
            '-filter_complex',
            'fps=10,scale=380:380:force_original_aspect_ratio=decrease:flags=lanczos,' +
              'split[a][b];[a]palettegen=max_colors=128[p];[b][p]paletteuse=dither=bayer:bayer_scale=3',
            '-loop', '0',
            tmp,
          ]
        : [
            '-y', '-ss', String(t), '-i', render.abs,
            '-frames:v', '1',
            '-vf', 'scale=520:520:force_original_aspect_ratio=decrease',
            '-q:v', '4',
            tmp,
          ];

    try {
      await run('ffmpeg', args, kind === 'loop' ? 90000 : 25000);
      fs.renameSync(tmp, out);
      sweep(slug, stem);
      return out;
    } catch {
      try { fs.unlinkSync(tmp); } catch { /* rien à nettoyer */ }
      return null;
    } finally {
      inFlight.delete(out);
    }
  })();

  inFlight.set(out, job);
  return job;
}
