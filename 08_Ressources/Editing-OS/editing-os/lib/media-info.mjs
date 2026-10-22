// editing-os/lib/media-info.mjs
// Dimensions et durée d'un rendu, avec cache sur disque.
//
// Le scanner ne lit jamais un fichier média : c'est ce qui lui permet de
// relever tout le workspace en quelques millisecondes. Mais pour filtrer les
// projets par format (vertical / horizontal), il faut bien connaître la taille
// de l'image quelque part.
//
// Compromis retenu : ffprobe tourne UNE fois par rendu, en tâche de fond après
// le relevé, et le résultat est écrit dans .cache/media-info.json. Le scanner
// se contente d'une lecture synchrone de ce cache — s'il ne sait pas encore,
// le projet est simplement « format inconnu » jusqu'au relevé suivant.
//
// La clé inclut le mtime : un nouveau rendu au même chemin est re-sondé.

import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';

const CACHE_DIR = path.join(import.meta.dirname, '..', '.cache');
const CACHE_FILE = path.join(CACHE_DIR, 'media-info.json');
const MAX_ENTRIES = 500;

let cache = null; // { [key]: { w, h, dur } }
let dirty = false;
const inFlight = new Map();

function load() {
  if (cache) return cache;
  try {
    const raw = fs.readFileSync(CACHE_FILE, 'utf8');
    const obj = JSON.parse(raw);
    cache = obj && typeof obj === 'object' ? obj : {};
  } catch {
    cache = {};
  }
  return cache;
}

function persist() {
  if (!dirty) return;
  dirty = false;
  const c = load();
  const keys = Object.keys(c);
  if (keys.length > MAX_ENTRIES) {
    for (const k of keys.slice(0, keys.length - MAX_ENTRIES)) delete c[k];
  }
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(CACHE_FILE, JSON.stringify(c));
  } catch {
    /* le cache n'est jamais critique */
  }
}

function keyFor(abs, mtime) {
  return `${abs}|${mtime}`;
}

/** Ce qu'on sait déjà, sans rien lancer. null si jamais sondé. */
export function readCached(abs, mtime) {
  const hit = load()[keyFor(abs, mtime)];
  return hit || null;
}

/**
 * Orientation lisible à partir des dimensions. Le carré parfait est rare mais
 * réel (posts 1:1) : on le range avec l'horizontal côté filtre, tout en le
 * nommant correctement dans l'interface.
 */
export function orientationOf(info) {
  if (!info || !info.w || !info.h) return null;
  const r = info.w / info.h;
  if (r < 0.95) return 'vertical';
  if (r > 1.05) return 'horizontal';
  return 'square';
}

/** Ratio affichable : 9:16, 16:9, 1:1, 4:5… */
export function ratioLabel(info) {
  if (!info || !info.w || !info.h) return null;
  const g = (a, b) => (b ? g(b, a % b) : a);
  const d = g(info.w, info.h) || 1;
  let a = Math.round(info.w / d);
  let b = Math.round(info.h / d);
  // les ratios exotiques (1612:1080 après crop) ne disent rien à personne :
  // au-delà de deux chiffres on arrondit sur le ratio décimal.
  if (a > 99 || b > 99) {
    const r = info.w / info.h;
    const known = [[9, 16], [16, 9], [1, 1], [4, 5], [3, 4], [4, 3], [2, 3], [3, 2], [21, 9]];
    let best = known[0];
    let bestErr = Infinity;
    for (const k of known) {
      const err = Math.abs(k[0] / k[1] - r);
      if (err < bestErr) { bestErr = err; best = k; }
    }
    a = best[0]; b = best[1];
  }
  return `${a}:${b}`;
}

function probe(abs) {
  return new Promise((resolve) => {
    execFile(
      'ffprobe',
      ['-v', 'error', '-select_streams', 'v:0', '-show_streams', '-show_format', '-of', 'json', abs],
      { timeout: 15000, maxBuffer: 4 * 1024 * 1024 },
      (err, stdout) => {
        if (err) { resolve(null); return; }
        try {
          const obj = JSON.parse(String(stdout));
          const st = (obj.streams || [])[0];
          if (!st || !st.width || !st.height) { resolve(null); return; }
          let w = Number(st.width);
          let h = Number(st.height);
          // Une vidéo tournée au téléphone porte ses dimensions à plat et sa
          // rotation à côté : sans ça, un reel vertical passerait pour du 16:9.
          let rot = 0;
          for (const sd of st.side_data_list || []) {
            if (typeof sd.rotation === 'number') rot = sd.rotation;
          }
          if (st.tags && st.tags.rotate) rot = Number(st.tags.rotate) || rot;
          if (Math.abs(rot) === 90 || Math.abs(rot) === 270) { const t = w; w = h; h = t; }
          const dur = parseFloat((obj.format && obj.format.duration) || st.duration || '');
          resolve({ w, h, dur: Number.isFinite(dur) && dur > 0 ? dur : null });
        } catch {
          resolve(null);
        }
      }
    );
  });
}

/** Sonde si nécessaire, met en cache, renvoie l'info (ou null). */
export function ensureInfo(abs, mtime) {
  const key = keyFor(abs, mtime);
  const hit = load()[key];
  if (hit) return Promise.resolve(hit);
  if (inFlight.has(key)) return inFlight.get(key);

  const job = probe(abs).then((info) => {
    inFlight.delete(key);
    if (!info) return null;
    load()[key] = info;
    dirty = true;
    persist();
    return info;
  });
  inFlight.set(key, job);
  return job;
}
