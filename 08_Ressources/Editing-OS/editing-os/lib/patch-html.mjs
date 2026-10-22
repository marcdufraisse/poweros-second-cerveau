// editing-os/lib/patch-html.mjs
// Écrire une retouche dans la source d'une composition.
//
// C'est la pièce risquée de l'éditeur visuel : on modifie un fichier que
// personne ne relit avant le rendu. Trois partis pris pour que ça reste sûr.
//
//  1. On ne reformate jamais le document. On remplace des tranches de texte
//     repérées par leur position, le reste du fichier ressort octet pour octet
//     identique — un diff ne montre que ce qui a changé.
//  2. On vise par `id`, et un id qui n'est pas unique fait échouer la retouche
//     plutôt que de modifier le mauvais élément.
//  3. Chaque écriture est relue et vérifiée : si la valeur attendue n'est pas
//     là après coup, on rend une erreur au lieu d'un succès silencieux.
//
// Deux endroits où poser une valeur, et ils ne sont pas interchangeables :
//   - les attributs (`data-start`, `data-duration`) portent le TIMING ;
//   - la règle CSS `#id { }` porte la GÉOMÉTRIE de base.
// Une propriété animée par GSAP n'appartient à aucun des deux : la timeline la
// réécrit à chaque image. L'éditeur la détecte côté navigateur et refuse de la
// toucher — voir editor.js.

import fs from 'node:fs';

/** Toutes les positions d'ouverture de balise portant cet id. */
function findTags(html, id) {
  const hits = [];
  const re = /<([a-zA-Z][\w-]*)\b([^>]*)>/g;
  let m;
  while ((m = re.exec(html))) {
    const attrs = m[2];
    // `(^|\s)id` et non `\bid` : HyperFrames pose un `data-hf-id` sur chaque
    // élément, et une frontière de mot le confond avec l'attribut `id`.
    const idm = /(^|\s)id\s*=\s*("([^"]*)"|'([^']*)')/.exec(attrs);
    if (!idm) continue;
    const val = idm[3] !== undefined ? idm[3] : idm[4];
    if (val === id) hits.push({ start: m.index, end: m.index + m[0].length, tag: m[1], attrs, raw: m[0] });
  }
  return hits;
}

function escapeAttr(v) {
  return String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

/**
 * Pose (ou remplace) des attributs sur la balise ouvrante de `id`.
 * Une valeur null supprime l'attribut.
 */
export function setAttributes(html, id, attrs) {
  const hits = findTags(html, id);
  if (!hits.length) throw new Error(`élément introuvable : #${id}`);
  if (hits.length > 1) throw new Error(`id non unique dans le fichier : #${id} (${hits.length} occurrences)`);

  const hit = hits[0];
  let open = hit.raw;
  // on travaille sur la balise seule, jamais sur le document entier
  const selfClosing = /\/>$/.test(open);
  let inner = open.slice(1 + hit.tag.length, open.length - (selfClosing ? 2 : 1));

  for (const [name, value] of Object.entries(attrs)) {
    const re = new RegExp(`\\s${name.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}\\s*=\\s*("[^"]*"|'[^']*')`, 'i');
    if (value === null || value === undefined) {
      inner = inner.replace(re, '');
      continue;
    }
    const attr = `${name}="${escapeAttr(value)}"`;
    if (re.test(inner)) inner = inner.replace(re, ' ' + attr);
    else inner = inner.replace(/\s*$/, '') + ' ' + attr;
  }

  const rebuilt = `<${hit.tag}${inner}${selfClosing ? ' />' : '>'}`;
  return html.slice(0, hit.start) + rebuilt + html.slice(hit.end);
}

/** Le contenu du dernier bloc <style> du document, avec ses bornes. */
function lastStyleBlock(html) {
  const re = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
  let last = null;
  let m;
  while ((m = re.exec(html))) {
    last = { open: m.index + m[0].indexOf('>') + 1, close: m.index + m[0].length - '</style>'.length };
  }
  return last;
}

/** Les bornes de la règle `selector { ... }` dans un bloc CSS, ou null. */
function findRule(css, selector) {
  // le sélecteur doit être seul devant l'accolade : `#carte {` et pas
  // `#carte .titre {`, qui vise autre chose
  const esc = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(^|[}\\n;])\\s*${esc}\\s*\\{([^}]*)\\}`, 'm');
  const m = re.exec(css);
  if (!m) return null;
  const bodyStart = m.index + m[0].indexOf('{') + 1;
  const bodyEnd = m.index + m[0].length - 1;
  return { bodyStart, bodyEnd, body: m[2] };
}

function mergeDeclarations(body, props) {
  let out = body;
  for (const [prop, value] of Object.entries(props)) {
    const re = new RegExp(`(^|;|\\n)\\s*${prop.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}\\s*:[^;}]*;?`, 'i');
    if (value === null || value === undefined) {
      out = out.replace(re, '$1');
      continue;
    }
    const decl = `${prop}: ${value};`;
    if (re.test(out)) out = out.replace(re, `$1 ${decl}`);
    else out = out.replace(/\s*$/, '') + `\n  ${decl}\n`;
  }
  return out;
}

/**
 * Pose des propriétés CSS sur la règle `#id`. La règle est créée à la fin du
 * dernier bloc <style> si elle n'existe pas — donc après les règles
 * existantes, ce qui la fait gagner à spécificité égale.
 */
export function setCssProps(html, id, props) {
  const block = lastStyleBlock(html);
  if (!block) throw new Error('aucun bloc <style> dans ce fichier');

  const css = html.slice(block.open, block.close);
  const selector = `#${id}`;
  const rule = findRule(css, selector);

  let nextCss;
  if (rule) {
    const merged = mergeDeclarations(rule.body, props);
    nextCss = css.slice(0, rule.bodyStart) + merged + css.slice(rule.bodyEnd);
  } else {
    const decls = Object.entries(props)
      .filter(([, v]) => v !== null && v !== undefined)
      .map(([p, v]) => `  ${p}: ${v};`)
      .join('\n');
    if (!decls) return html;
    nextCss = css.replace(/\s*$/, '') +
      `\n\n/* retouche depuis le hub */\n${selector} {\n${decls}\n}\n`;
  }
  return html.slice(0, block.open) + nextCss + html.slice(block.close);
}

/**
 * Pose des propriétés dans l'attribut `style=` de la balise, en fusionnant avec
 * ce qui s'y trouve déjà.
 *
 * Pourquoi là et pas dans une règle `#id { }` : une déclaration inline gagne
 * TOUJOURS contre une règle d'id. Les compositions posent souvent un
 * `style="…"` sur l'élément ; une retouche écrite dans la feuille de style y
 * perdait en silence — l'aperçu bougeait (il écrit `el.style`), le rendu non,
 * et l'interface annonçait « écrit » quand même. On écrit donc exactement au
 * niveau où l'aperçu écrit.
 */
export function setInlineStyle(html, id, props) {
  const hits = findTags(html, id);
  if (!hits.length) throw new Error(`élément introuvable : #${id}`);
  if (hits.length > 1) throw new Error(`id non unique dans le fichier : #${id} (${hits.length} occurrences)`);

  const cur = /(^|\s)style\s*=\s*("([^"]*)"|'([^']*)')/.exec(hits[0].attrs);
  const raw = cur ? (cur[3] !== undefined ? cur[3] : cur[4]) : '';

  const decls = [];
  raw.split(';').forEach((chunk) => {
    const i = chunk.indexOf(':');
    if (i < 0) return;
    const name = chunk.slice(0, i).trim();
    const value = chunk.slice(i + 1).trim();
    if (name) decls.push([name, value]);
  });

  for (const [prop, value] of Object.entries(props)) {
    const at = decls.findIndex((d) => d[0].toLowerCase() === prop.toLowerCase());
    if (value === null || value === undefined) {
      if (at >= 0) decls.splice(at, 1);
      continue;
    }
    if (at >= 0) decls[at][1] = String(value);
    else decls.push([prop, String(value)]);
  }

  const next = decls.map(([n, v]) => `${n}: ${v}`).join('; ');
  return setAttributes(html, id, { style: next ? next + ';' : null });
}

/**
 * Applique un lot de retouches à un fichier, puis relit pour vérifier.
 * edits : [{ id, attrs?: {...}, css?: {...} }]
 * Renvoie { changed, applied: [...] } ou lève.
 */
export function applyEdits(absFile, edits) {
  const before = fs.readFileSync(absFile, 'utf8');
  let html = before;
  const applied = [];

  for (const e of edits) {
    if (!e || !e.id) throw new Error('retouche sans id');
    if (e.attrs && Object.keys(e.attrs).length) {
      html = setAttributes(html, e.id, e.attrs);
      applied.push({ id: e.id, attrs: Object.keys(e.attrs) });
    }
    if (e.css && Object.keys(e.css).length) {
      html = setInlineStyle(html, e.id, e.css);
      applied.push({ id: e.id, css: Object.keys(e.css) });
    }
  }

  if (html === before) return { changed: false, applied: [] };
  fs.writeFileSync(absFile, html);

  // Relecture : on vérifie que chaque valeur demandée est bien là. Une
  // retouche qui « réussit » sans rien changer est pire qu'une erreur.
  const after = fs.readFileSync(absFile, 'utf8');
  for (const e of edits) {
    // le style aussi est relu : une retouche qui « réussit » sans rien changer
    // est pire qu'une erreur
    for (const [prop, value] of Object.entries(e.css || {})) {
      if (value === null || value === undefined) continue;
      const tag = findTags(after, e.id)[0];
      const styleAttr = tag && /(^|\s)style\s*=\s*"([^"]*)"/.exec(tag.attrs);
      const has = styleAttr && new RegExp(`(^|;)\\s*${prop}\\s*:`, 'i').test(styleAttr[2]);
      if (!has) {
        fs.writeFileSync(absFile, before);
        throw new Error(`vérification échouée sur #${e.id} ${prop} — fichier restauré`);
      }
    }
    for (const [name, value] of Object.entries(e.attrs || {})) {
      if (value === null || value === undefined) continue;
      const tag = findTags(after, e.id)[0];
      if (!tag || !new RegExp(`\\b${name}\\s*=\\s*"${escapeAttr(value)}"`).test(tag.raw)) {
        fs.writeFileSync(absFile, before);
        throw new Error(`vérification échouée sur #${e.id} ${name} — fichier restauré`);
      }
    }
  }
  return { changed: true, applied, bytes: after.length };
}
