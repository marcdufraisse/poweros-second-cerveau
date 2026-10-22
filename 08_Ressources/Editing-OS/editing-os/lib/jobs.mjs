// editing-os/lib/jobs.mjs
// Lancer les commandes du pipeline depuis le hub, et en suivre la sortie.
//
// Le hub ne faisait que regarder le disque. Or un rendu draft de reel prend
// ~60 s : le coût n'est pas le calcul, c'est de retourner au terminal, de
// taper la commande dans le bon dossier, d'attendre, puis de lancer la
// vérification à la main. Ici on clique, on part, et l'enchaînement se fait.
//
// Deux règles de sûreté :
//   - la liste des actions est fermée. Rien n'est construit depuis l'URL, et
//     aucune commande ne passe par un shell (spawn avec un tableau d'args).
//   - un seul rendu à la fois sur la machine : un rendu occupe déjà six
//     workers Chrome, deux en parallèle se battraient pour le CPU.

import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

const MAX_LINES = 400; // ce qu'on garde d'un log, en mémoire
const MAX_JOBS = 40; // historique conservé

const jobs = new Map(); // id -> job
let seq = 0;

/**
 * Les actions disponibles. `steps` est une liste : c'est ce qui permet
 * d'enchaîner rendu puis vérification sans revenir cliquer. `cwd` vaut
 * 'project' (dossier du projet) ou 'root' (racine du workspace) — la CLI
 * HyperFrames résout assets/ et renders/ depuis le dossier courant.
 *
 * Le catalogue dépend du livrable visé : un projet porte souvent plusieurs
 * vidéos (quatre publicités tirées du même rush, plusieurs verticaux tirés
 * d'une vidéo longue). Quand un livrable a sa composition, on rend CELLE-LÀ,
 * vers `renders/<livrable>-draft.mp4` — sinon deux publicités se battraient
 * pour le même fichier de sortie.
 *
 * ctx : { composition, file } — la composition du livrable choisi, et le
 * dernier rendu de ce livrable (pour le master et la vérification).
 */
export function actionCatalog(root, ctx) {
  const comp = ctx && ctx.composition ? ctx.composition : null;
  const target = ctx && ctx.file ? ctx.file : null;
  // Le nom de sortie porte le livrable, même sans composition dédiée : sinon
  // un « renders/standard.mp4 » formerait un livrable fantôme nommé
  // « standard », détaché de la vidéo dont il est pourtant une version.
  const base = comp || (ctx && ctx.deliverable) || null;

  // Réglages d'encodage du projet (meta.json, bloc `render`). Le défaut de
  // publication est délibérément généreux : un rendu draft de reel vertical
  // sort vers 550 kbps, ce qui est très bas pour du 1080x1920 — les
  // plateformes ré-encodent par-dessus, et une source pauvre ressort pire.
  const rc = (ctx && ctx.render) || {};
  const PUBLISH_BITRATE = rc.videoBitrate || '12M';

  const lint = { cmd: 'npx', args: ['hyperframes', 'lint'], cwd: 'project', label: 'lint' };
  const render = (quality, publish, outOverride) => {
    const out = outOverride || (base ? `renders/${base}-${quality}.mp4` : `renders/${quality}.mp4`);
    const args = ['hyperframes', 'render', '--quality', publish ? (rc.quality || 'high') : quality,
      '--workers', 'auto', '--browser-gpu', '--gpu', '-o', out];
    if (comp) args.splice(2, 0, '-c', `compositions/${comp}.html`);
    if (rc.fps) args.push('-f', String(rc.fps));
    // débit imposé sur le chemin de publication seulement : sur un draft on
    // veut la vitesse, pas la finesse
    if (publish && PUBLISH_BITRATE) args.push('--video-bitrate', String(PUBLISH_BITRATE));
    return {
      cmd: 'npx', args, cwd: 'project',
      label: (publish ? 'rendu publication' : `rendu ${quality}`) + (base ? ` — ${base}` : ''),
      produces: out,
    };
  };
  // Viser un fichier précis quand on en connaît un : --project prendrait le
  // rendu le plus récent du projet, qui peut appartenir à un autre livrable.
  const py = (script, extra, label, file) => ({
    cmd: 'python3',
    args: file
      ? [path.join(root, 'scripts', script), '{projdir}/' + file, ...extra]
      : [path.join(root, 'scripts', script), '--project', '{slug}', ...extra],
    cwd: 'root',
    label,
  });

  // La version suivante porte un numéro, elle n'écrase pas la précédente : on
  // compare des versions dans la review, donc on les garde.
  const nextOut = ctx && ctx.nextRender ? `renders/${ctx.nextRender}` : null;
  const draftOut = base ? `renders/${base}-draft.mp4` : 'renders/draft.mp4';
  const stdOut = base ? `renders/${base}-standard.mp4` : 'renders/standard.mp4';
  const masterOf = (f) => (f ? f.replace(/\.mp4$/i, '-master.mp4') : null);

  return {
    'render-verify': {
      group: 'montage',
      primary: true,
      label: 'Rendu draft + vérif',
      hint: 'rendu rapide puis auto-vérification',
      desc: 'Le geste courant. Rend en qualité brouillon (~1 min pour un reel) puis '
        + 'contrôle le fichier produit : mots coupés, phrases répétées, queue morte, '
        + 'zone haute vide. C\'est ce rendu qu\'on regarde et qu\'on annote.',
      steps: [lint, render('draft'), py('autoverify.py', [], 'auto-vérification', draftOut)],
    },
    'render-draft': {
      group: 'montage',
      label: 'Rendu draft seul',
      hint: 'rendu rapide sans vérification',
      desc: 'Le même rendu, sans le contrôle derrière. À réserver aux essais visuels '
        + 'rapides — on ne montre jamais un fichier non vérifié.',
      steps: [lint, render('draft')],
    },
    lint: {
      group: 'montage',
      label: 'Lint',
      hint: 'contrôle statique, sans rendu',
      desc: 'Relit la composition sans rien rendre (2 s) : attributs de timing manquants, '
        + 'chevauchements de pistes, timeline mal déclarée. Utile après une grosse '
        + 'modification, avant de lancer un rendu qui prendrait une minute pour rien.',
      steps: [lint],
    },
    verify: {
      group: 'montage',
      label: 'Vérifier',
      hint: 'contrôle du dernier rendu, sans le refaire',
      desc: 'Repasse l\'auto-vérification sur le dernier rendu du livrable, sans le '
        + 'recalculer. Pratique après avoir changé les mots-sentinelles du meta.json.',
      steps: [py('autoverify.py', [], 'auto-vérification', target)],
    },

    'send-to-editor': {
      group: 'montage',
      primary: true,
      label: 'Envoyer au monteur',
      hint: 'applique les retours puis rend la version suivante',
      desc: 'Prend les retours horodatés de ce rendu, les confie à un agent monteur '
        + 'qui modifie la composition, puis enchaîne lint, rendu et vérification — '
        + 'tu récupères une nouvelle version. La composition est sauvegardée dans '
        + '.backup/ juste avant, donc le geste est rattrapable. L\'agent n\'a le droit '
        + 'que de lire et d\'écrire des fichiers : le rendu reste au hub.',
      steps: [
        { cmd: 'node', args: [path.join(root, 'scripts', 'snapshot-project.mjs'), '{slug}',
          'avant application des retours de review'], cwd: 'root',
          label: 'sauvegarde de la composition' },
        { cmd: 'claude',
          args: ['-p', (ctx && ctx.brief) || 'Aucun retour fourni.',
            '--permission-mode', 'acceptEdits',
            // le monteur édite, il ne rend pas : pas de Bash, donc pas de
            // commande lancée dans le dos du hub
            '--allowedTools', 'Read', 'Edit', 'Write', 'Glob', 'Grep',
            '--add-dir', root],
          cwd: 'project', label: 'le monteur applique les retours',
          timeoutMs: 25 * 60 * 1000 },
        lint,
        render('draft', false, nextOut),
        py('autoverify.py', [], 'vérification de la nouvelle version', nextOut),
      ],
    },

    finalize: {
      group: 'publication',
      primary: true,
      label: 'Finaliser',
      hint: 'rendu qualité publication, master audio, vérification finale',
      desc: 'La séquence complète de sortie, en une fois : rendu en qualité publication '
        + '(débit imposé, ' + PUBLISH_BITRATE + ' par défaut — un draft sort vers 550 kbps, '
        + 'bien trop bas pour du 1080x1920), puis master audio à -14 LUFS / -1 dBTP '
        + '(un mix brut sort vers -23, deux fois trop bas pour Instagram et TikTok), '
        + 'puis vérification de ce master. Le fichier -master.mp4 est celui qu\'on publie.',
      steps: [
        lint,
        render('standard', true),
        py('master.py', [], 'master audio', stdOut),
        py('autoverify.py', ['--master'], 'vérification du master', masterOf(stdOut)),
      ],
    },
    'render-standard': {
      group: 'publication',
      label: 'Rendu standard seul',
      hint: 'qualité publication, sans le master',
      desc: 'Rend en qualité publication (CRF 18) et s\'arrête là. Le fichier n\'est pas '
        + 'au niveau audio de diffusion : il faut encore le master.',
      steps: [lint, render('standard', true)],
    },
    'master-verify': {
      group: 'publication',
      label: 'Master + vérif',
      hint: 'masterise le dernier rendu du livrable',
      desc: 'Prend le dernier rendu du livrable, le met au niveau de publication, puis '
        + 'le vérifie. À utiliser quand le rendu existe déjà et qu\'on ne veut pas '
        + 'le refaire.',
      steps: [py('master.py', [], 'master audio', target),
        py('autoverify.py', ['--master'], 'vérification du master', masterOf(target))],
    },
  };
}

export function listActions(root) {
  const cat = actionCatalog(root, null);
  return Object.keys(cat).map((id) => ({
    id,
    label: cat[id].label,
    hint: cat[id].hint,
    desc: cat[id].desc,
    group: cat[id].group,
    primary: !!cat[id].primary,
    steps: cat[id].steps.length,
  }));
}

function isRenderAction(id) {
  return id.startsWith('render-');
}

export function runningJobs() {
  return [...jobs.values()].filter((j) => j.status === 'running');
}

function publicJob(j, sinceLine) {
  const from = Number.isFinite(sinceLine) ? sinceLine : 0;
  return {
    id: j.id,
    slug: j.slug,
    action: j.action,
    label: j.label,
    status: j.status,
    step: j.step,
    stepCount: j.stepCount,
    stepLabel: j.stepLabel,
    exitCode: j.exitCode,
    startedAt: j.startedAt,
    endedAt: j.endedAt,
    lines: j.lines.slice(from),
    lineCount: j.lines.length,
  };
}

export function getJob(id, sinceLine) {
  const j = jobs.get(id);
  return j ? publicJob(j, sinceLine) : null;
}

export function listJobs(slug) {
  return [...jobs.values()]
    .filter((j) => !slug || j.slug === slug)
    .sort((a, b) => b.startedAt - a.startedAt)
    .slice(0, 12)
    .map((j) => publicJob(j, j.lines.length)); // sans les logs
}

export function stopJob(id) {
  const j = jobs.get(id);
  if (!j || j.status !== 'running') return false;
  j.canceled = true;
  if (j.child) j.child.kill('SIGTERM');
  return true;
}

/**
 * Démarre une action. Renvoie { job } ou { error }.
 * onDone est appelé à la fin — le serveur en profite pour invalider son relevé,
 * puisqu'un rendu vient de changer le contenu de renders/.
 */
export function startJob(root, slug, actionId, onDone, ctx) {
  const cat = actionCatalog(root, ctx);
  const action = cat[actionId];
  if (!action) return { error: `action inconnue : ${actionId}` };

  const projDir = path.join(root, 'video-projects', slug);
  if (!fs.existsSync(projDir)) return { error: `projet inconnu : ${slug}` };

  const busy = runningJobs();
  if (busy.some((j) => j.slug === slug)) {
    return { error: `une action tourne déjà sur ${slug}` };
  }
  if (isRenderAction(actionId) && busy.some((j) => isRenderAction(j.action))) {
    return { error: 'un rendu tourne déjà — un seul à la fois (six workers Chrome chacun)' };
  }

  const job = {
    id: `job_${Date.now().toString(36)}_${++seq}`,
    slug,
    action: actionId,
    label: action.label + (ctx && (ctx.composition || ctx.deliverable)
      ? ' · ' + (ctx.composition || ctx.deliverable) : ''),
    status: 'running',
    step: 0,
    stepCount: action.steps.length,
    stepLabel: action.steps[0].label,
    exitCode: null,
    startedAt: Date.now(),
    endedAt: null,
    lines: [],
    child: null,
    canceled: false,
  };
  jobs.set(job.id, job);
  if (jobs.size > MAX_JOBS) {
    const oldest = [...jobs.values()].sort((a, b) => a.startedAt - b.startedAt)[0];
    if (oldest && oldest.status !== 'running') jobs.delete(oldest.id);
  }

  const push = (line) => {
    job.lines.push(line);
    if (job.lines.length > MAX_LINES) job.lines.splice(0, job.lines.length - MAX_LINES);
  };

  const finish = (status, code) => {
    job.status = status;
    job.exitCode = code;
    job.endedAt = Date.now();
    job.step = action.steps.length;
    if (typeof onDone === 'function') onDone(job);
  };

  const runStep = (i) => {
    if (job.canceled) {
      finish('canceled', null);
      return;
    }
    const step = action.steps[i];
    job.step = i;
    job.stepLabel = step.label;
    const args = step.args.map((a) => a.replace('{slug}', slug).replace('{projdir}', projDir));
    const cwd = step.cwd === 'project' ? projDir : root;
    push(`-- ${step.label} --`);
    push(`$ ${step.cmd} ${args.map((a) => (a.startsWith(root) ? path.relative(root, a) : a)).join(' ')}`);

    // stdin fermé : le CLI du monteur attend 3 s une entrée qui ne viendra
    // jamais avant de démarrer, et aucune étape d'ici ne lit l'entrée standard.
    const child = spawn(step.cmd, args, { cwd, env: process.env, stdio: ['ignore', 'pipe', 'pipe'] });
    job.child = child;

    // Un agent qui attend une réponse qui ne viendra jamais bloquerait le
    // projet entier : au-delà du budget de l'étape, on coupe.
    let killer = null;
    if (step.timeoutMs) {
      killer = setTimeout(() => {
        push(`délai dépassé (${Math.round(step.timeoutMs / 60000)} min) — étape interrompue`);
        job.canceled = true;
        child.kill('SIGTERM');
      }, step.timeoutMs);
    }

    const onData = (buf) => {
      // Une barre de progression réécrit la même ligne : on découpe aussi sur
      // le retour chariot, sinon le log ne bougerait qu'à la fin du rendu.
      String(buf).split(/[\r\n]+/).forEach((l) => {
        const t = l.replace(new RegExp(String.fromCharCode(27) + '\\[[0-9;]*m', 'g'), '').trimEnd();
        if (!t) return;
        push(t);
        // Un « Not logged in » brut ne dit pas quoi faire : on traduit sur place.
        if (/not logged in|please run \/login/i.test(t)) {
          push('→ Le monteur n\'est pas authentifié. Ouvre un terminal, lance `claude`, '
            + 'connecte-toi une fois, puis relance depuis le hub.');
        }
      });
    };
    child.stdout.on('data', onData);
    child.stderr.on('data', onData);

    child.on('error', (err) => {
      push(`erreur : ${err.message}`);
      finish('failed', -1);
    });
    child.on('close', (code) => {
      if (killer) clearTimeout(killer);
      job.child = null;
      if (job.canceled) {
        finish('canceled', code);
        return;
      }
      if (code !== 0) {
        push(`echec ${step.label} : code ${code}`);
        finish('failed', code);
        return;
      }
      push(`ok ${step.label}`);
      if (i + 1 < action.steps.length) runStep(i + 1);
      else finish('done', 0);
    });
  };

  runStep(0);
  return { job: publicJob(job) };
}
