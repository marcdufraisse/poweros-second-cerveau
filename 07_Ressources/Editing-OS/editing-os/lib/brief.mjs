// editing-os/lib/brief.mjs
// Le bon de commande envoyé au monteur.
//
// Les retours de review sont horodatés à la frame près. Recopiés à la main
// dans une conversation, ils perdent la moitié de ce qui les rend
// exploitables : le rendu exact auquel ils se rapportent, le fps, le numéro de
// frame. Ici on écrit le brief une fois, dans le projet, et c'est ce fichier
// qui part au monteur — donc on garde aussi la trace de ce qui a été demandé.

import fs from 'node:fs';
import path from 'node:path';

function clock(t, fps) {
  const s = Math.max(0, Number(t) || 0);
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(Math.floor(s % 60)).padStart(2, '0');
  const frame = Math.round(s * (fps || 30));
  return `${mm}:${ss}.${String(Math.floor((s % 1) * 1000)).padStart(3, '0')} (frame ${frame}, t=${s.toFixed(3)}s)`;
}

/**
 * Construit le texte du brief à partir d'un lot de retours.
 * feedback : { render, notes: [{ t, txt }] }
 */
export function buildBrief({ slug, feedback, fps = 30, nextRender }) {
  const notes = (feedback.notes || []).slice().sort((a, b) => a.t - b.t);
  const lines = notes.map((n, i) => `${i + 1}. **${clock(n.t, fps)}** — ${n.txt}`);

  return `# Retours de review à appliquer — ${slug}

Rendu commenté : \`renders/${feedback.render}\` (${fps} fps)
${notes.length} retour${notes.length > 1 ? 's' : ''} de l'utilisateur, relevés image par image dans le hub.

## Les retours, dans l'ordre du montage

${lines.join('\n')}

## Ce qu'on attend de toi

Tu es le monteur de ce projet. Applique ces retours **dans la composition**
(\`index.html\` et \`compositions/\`), et rien d'autre :

- Les timecodes ci-dessus sont ceux du rendu commenté. Les temps de parole
  passent par les helpers du projet — ne recale jamais un beat à l'oreille.
- Lis \`CLAUDE.md\`, \`PROCESS.md\` et \`style-library/10-marc/DESIGN.md\`
  à la racine du workspace avant de toucher quoi que ce soit : les règles
  visuelles et le contrat de rendu y sont écrits.
- Un retour que tu ne peux pas appliquer proprement : ne l'invente pas, dis-le
  dans ta réponse finale et laisse-le de côté.
- **Ne rends pas la vidéo.** Le hub s'en charge juste après toi et produira
  \`renders/${nextRender || 'la version suivante'}\`.

Termine par un compte rendu court : ce que tu as changé, retour par retour, et
ce que tu as laissé de côté.
`;
}

/** Écrit le brief dans le projet et renvoie son chemin + son texte. */
export function writeBrief(projDir, slug, feedback, opts = {}) {
  const dir = path.join(projDir, 'review');
  fs.mkdirSync(dir, { recursive: true });
  const stamp = new Date(opts.now || Date.now()).toISOString().slice(0, 16).replace(/[:T]/g, '-');
  const base = String(feedback.render || 'rendu').replace(/\.(mp4|webm|mov)$/i, '');
  const file = path.join(dir, `brief-${base}-${stamp}.md`);
  const text = buildBrief({ slug, feedback, fps: opts.fps, nextRender: opts.nextRender });
  fs.writeFileSync(file, text);
  return { file, text, rel: path.relative(projDir, file) };
}
