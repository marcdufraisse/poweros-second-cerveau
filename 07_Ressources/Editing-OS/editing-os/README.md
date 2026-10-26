# Editing OS

A live visual operating system for the Video Automation workspace. The filesystem is
the source of truth: a single Node process scans `video-projects/`, `style-library/`,
`asset-library/`, and git state on demand, holds one in-memory snapshot, and serves a
dark mission-control UI. No database, no build step, no new npm dependencies (node
builtins only).

## Run

```bash
node editing-os/server.mjs        # http://localhost:4200
PORT=4300 node editing-os/server.mjs   # override the port
```

The server never auto-increments. If 4200 is taken it prints a message naming the port
and exits. It warms one snapshot at startup and logs the scan time (about 50 to 100 ms
for 75 projects on the M4 Pro). The snapshot is reused for 60 seconds; the Refresh
button forces a rescan (`POST /api/rescan`).

## Views

- Mission Control (`#/`) - summary strip (projects, with-renders, stale renders, render
  disk) plus a card grid. Each card has a 9-segment pipeline rail, family and archetype
  badges, newest-render age, and a stale flag. Client-side filters: search, family,
  archetype, minimum reached stage, stale-only, hide-utility (default on), and sort.
- Project Detail (`#/project/<slug>`) - absolute path with Copy and Reveal in Finder,
  per-stage rows with evidence, a renders table with per-file stale flags, and NOTES.md
  rendered as markdown-lite.
- Studio (`#/studio`) - an 8-bit pixel-art office of the five pipeline agents; see the
  Studio section below.
- Libraries (`#/libraries`) - style rows with palette swatches and fonts, plus asset
  registry counts and a registry-staleness banner.
- Activity (`#/activity`) - branch, dirty count, last 20 commits, 30 most recently
  modified project files.

## Studio

The Studio (`#/studio`) is a bright, lived-in 8-bit co-working office (warm cream walls,
wood-plank floor, sunny daylight windows, plants, bookshelf, whiteboard, kitchenette, and
a wall clock) that shows the pipeline agents as characters at five desks. Everything is
drawn on one HTML5 canvas (logical 640x360, integer-scaled, no external images or fonts).
The roster is fixed:

- Snip - Silence Editor (cut-silences), green
- Redo - Mistake Editor (cut-mistakes), amber
- Vera - Verifier (verify-cuts), purple
- Mo - Motion Designer (motion-graphics), blue
- Scout - B-roll Scout (insert-broll), orange

Status detection is server-side (`GET /api/agents`, see STUDIO_CONTRACT.md). It reuses
the same 60 s snapshot as the rest of the OS, then re-stats only the winning evidence
file per agent plus the session directory. Each agent is attributed the newest evidence
mtime of its own pipeline stage across all projects (verify excludes the clean.mp4 proxy
so a fresh editor render does not light the verifier). The age of that artifact maps to a
tier: working (15 min), winding-down (2 h), or idle. A recent Claude session touching the
workspace turns the office lights on (full bright daytime); with no recent session the
lights go to a dimmer, warm after-hours mood that stays clearly readable. Working agents sit and type at a lit desk with a
floating project tag; winding-down agents sit and occasionally stretch or sip; idle agents
stroll the whole office floor on varied routes (along and behind the desk row, to the water
cooler, couch, window, and across the middle), spread apart with light separation so they
never bunch up, with only brief pauses and the occasional short couch sit, cooler sip, or
look out the window. Each desk chair and mousepad is tinted its owner's accent color, so an
empty seat still reads as that agent's. Status changes are smooth: an agent starting work
walks to its desk and sits rather than snapping there. The canvas rAF loop stops when Studio is not the active route or the tab
is hidden, and the topbar shows a pulsing dot on the Studio nav item when any agent is
working (a single 30 s global poll).

Dev force param: append `?force=<id>:<status>[,<id>:<status>...]` to the URL to override
just the status of named agents for screenshots and tests, for example
`?force=silences:working,motion:working`. Invalid ids or statuses are ignored, and no real
project files are ever touched. A forced agent with no project shows a demo tag. The
standalone preview `?fixture=1` renders canned data with no server, and `?fixture=1&lights=off`
previews the dimmer after-hours look.

## How stage detection works

Nine stages in fixed order: source, transcript, silences, mistakes, verify, motion,
broll, render, delivered. Each resolves to a status (`done`, `partial`, `unknown`,
`n-a`) with evidence files. Evidence comes in two tiers:

- Direct - an artifact written by that stage (a `.silence-edl.json`, an `approved-cuts.json`,
  a render mp4). Highest confidence.
- Proxy - a file that implies the stage ran without being its own output. The main proxy
  is `assets/clean.mp4`: its existence marks source, silences, mistakes, and verify as
  done even when the per-stage artifacts were not kept.

Detection is stat-driven. JSON transcripts are sniffed by reading the first 16 KB and
testing for a `"words"` key (widened from 4 KB because real ElevenLabs transcripts put
`"words"` about 7 to 11 KB in). Media files are never opened or read.

## Known limitations

- Verify is proxy-only today. No direct verify artifact is written to disk yet, so a
  clean render is the strongest signal. If a `verify-report.md` or `*.verify.json` ever
  lands it becomes direct evidence automatically.
- B-roll has not completed on any project, so that stage reads unknown or n-a everywhere.
- Registry staleness is heuristic: the style registry is flagged stale when its mtime is
  older than the newest `style-library/*/style.json`. It does not re-derive card counts.
- Archetype can read `unknown` for hand-built graphics projects that have an `index.html`
  but no `_gen*.mjs` and no `cards/` dir. Motion still detects correctly; the badge is
  just conservative.
- Reveal in Finder runs `open -R` and only works on the host machine. Paths are confined
  to the workspace root (400 outside root, 404 if missing).

## Le hub — un seul lien à mettre en favori

`http://localhost:4200` regroupe tout ce dont on a besoin au quotidien :

| Onglet | Ce qu'on y fait |
| --- | --- |
| Mission Control | les projets en cours, la vignette de leur dernier rendu, leur état |
| Studio | les agents au travail |
| Libraries | la bibliothèque de styles, avec accès aux galeries de previews |
| Activity | ce qui a bougé récemment |

La review n'a plus son onglet : on y entre **par le projet**. Ouvrir un projet
montre son dernier rendu, et « Apporter des modifications » mène à la review
image par image de ce rendu-là. Une place de moins dans le menu, un chemin de
moins à choisir.

### Lancer le hub

Double-cliquer `editing-os/Editing OS.command` : il démarre le serveur s'il ne
tourne pas déjà, puis ouvre le hub dans le navigateur. **Laisser la fenêtre de
Terminal ouverte** — c'est elle qui fait tourner le hub. La fermer arrête le
serveur, et le favori ne répond plus.

Équivalent en ligne de commande : `npm run os`.

### L'état d'un projet, et non ses étapes

La grille affiche **un état en français** — à démarrer, en montage, prêt à
relire, à re-rendre, livré — et plus le rail des 9 étapes. Sur la page
d'accueil on cherche « où en est cette vidéo », pas quel agent a écrit quel
fichier. Le rail détaillé, avec ses preuves sur disque, reste sur la page
projet, là où on va justement chercher ce niveau de détail.

Même logique pour le nommage : le titre d'une carte **est** le slug embelli,
donc l'afficher avec le slug revenait à écrire deux fois la même chose. La
carte montre le titre et la **date du dossier** (`AA-MM-JJ-`) mise en clair ;
le slug reste visible sur la page projet, dans le chemin. Le badge de famille
ignore ce préfixe de date — sinon tous les projets d'une même année tombaient
dans une famille « 26 », qui ne regroupe rien — et disparaît quand il n'y a
qu'une famille à départager.

### Les vignettes de rendu

Chaque carte de Mission Control montre une image extraite du dernier rendu :
cinq reels verticaux se ressemblent tous tant qu'on n'en voit qu'un slug. Au
survol, la vignette passe à une boucle animée de 2,4 s.

Les deux sont produites par ffmpeg à la première demande
(`GET /api/thumb/<slug>`, `?kind=loop` pour la boucle) et mises en cache dans
`editing-os/.cache/thumbs/`, indexées par `(fichier, mtime)` : un nouveau rendu
produit une nouvelle clé, il n'y a jamais rien à invalider à la main. Le cache
est gitignoré et se régénère seul.

La grille se filtre aussi **par format** — vertical, horizontal, carré. Le
format vient des dimensions du dernier rendu, sondées une fois par ffprobe en
tâche de fond après le relevé (`.cache/media-info.json`) : le scanner, lui,
n'ouvre toujours aucun fichier média. Un projet dont le format n'est pas encore
connu n'apparaît que dans « tous les formats ».

### La vue Review

Le rendu proposé par défaut est le **master le plus récent** (`-master.mp4`) :
c'est celui qu'on regarde pour valider, puisqu'il porte le niveau audio de
publication. Quand un draft plus frais existe, la page projet le signale au
lieu de laisser croire qu'on regarde le dernier état du montage.

`review.html` est générique et vit dans le hub : un seul fichier pour tous les
projets, appelé avec `?project=<slug>&render=<fichier>`.

### Un projet, plusieurs livrables

Un projet n'est pas une vidéo, c'est un **tournage**. D'un même rush sortent
quatre ou cinq publicités ; d'une vidéo YouTube sortent plusieurs formats
verticaux. `26-08-17-demo-3d-marc` le montrait déjà : trois compositions,
trois rendus, trois vidéos différentes.

Le hub regroupe donc les rendus par **livrable** (`lib/deliverables.mjs`). Le
livrable, c'est le nom de base d'un rendu une fois retirés les suffixes qui ne
désignent qu'une version : `-v3`, `-master`, `-draft`, un horodatage. Quand le
projet a un dossier `compositions/`, le nom de la composition fait autorité —
c'est elle qui a produit le rendu.

    reel-v19-master.mp4  ┐
    reel-v19.mp4         ├─ livrable « reel », 3 versions
    reel-v17.mp4         ┘
    b-comparatif.mp4     ── livrable « b-comparatif », 1 version

Ce que ça change :

- **La page projet** liste les livrables avec leur vignette ; cliquer l'un
  d'eux change le lecteur, et les actions portent sur celui-là.
- **Un rendu vise sa composition** : `-c compositions/<livrable>.html` vers
  `renders/<livrable>-draft.mp4`, jamais un `draft.mp4` unique que deux
  publicités s'écraseraient l'une l'autre.
- **Le rangement garde les 3 derniers de CHAQUE livrable.** C'est la raison
  d'être de tout ce qui précède : « garder les 3 derniers du projet » sur un
  dossier qui porte cinq publicités finies en jetterait deux.

### Le Studio HyperFrames, embarqué (`#/edit/<slug>`)

Le hub n'a **pas** d'éditeur à lui. Il ouvre le Studio du projet et le monte en
plein cadre, sous une bande qui ramène au projet et à la review.

Pourquoi ne pas en écrire un : le Studio fait déjà tout, et mieux — une piste
par élément avec **images-clés par propriété** lues dans la timeline GSAP,
rasoir, aimantation, mixeur audio avec formes d'onde calculées côté serveur,
inspecteur, calques, lint, export. Et surtout il **écrit dans la source** par
une API transactionnelle (`file-mutations/patch-element`) qui sauvegarde dans
`.hyperframes/backup` avant chaque écriture et annule le lot si un fichier
résiste. Vérifié à l'exécution : timing (`data-start`, `data-duration`) et
géométrie (propriété CSS `translate`, la même astuce que celle décrite plus
bas) atterrissent bien dans le fichier.

`editing-os/lib/studio.mjs` s'occupe du cycle de vie, avec trois contraintes
mesurées :

- **Il survit au hub** (`detached`, PPID 1), donc il ne peut pas vivre dans
  `jobs.mjs` : une action y bloque le projet jusqu'à la sortie du process, et un
  Studio ouvert interdirait rendu et vérification.
- **Aucun en-tête CORS** : le navigateur du hub ne lira jamais son API. Tout
  passe par le serveur. En revanche il s'affiche en iframe sans obstacle (ni
  `X-Frame-Options`, ni CSP).
- **400 à 600 Mo par Studio ouvert** (il lance son propre pool Chrome). D'où le
  plafond de 3 et la fermeture du plus ancien.

La découverte se fait en sondant `GET /__hyperframes_config` sur les ports
3900-3999 — la fenêtre exacte que balaie la CLI — et non en lisant ses fichiers
de session : un Studio orphelin y est invisible alors qu'il mange sa mémoire.

Trois choses à savoir en l'utilisant :

1. **Ouvrir le Studio modifie les fichiers** : il y réécrit des attributs
   `data-hf-id`. C'est bénin, mais le hub prend une photo dans `.backup/` juste
   avant, comme pour toute écriture.
2. **Un Studio lancé à la main sur un autre port est invisible au hub** (3002
   par défaut). Deux Studios coexisteraient alors pour un même projet.
3. **Un rendu lancé depuis le Studio échappe au hub** : il contourne la règle
   « un seul rendu à la fois » et produit un nom horodaté
   (`<projet>_AAAA-MM-JJ_HH-MM-SS.mp4`) qui ne se range pas dans le bon
   livrable. Pour rendre, préférer les actions de la page projet.

Ce que le hub garde, et que le Studio ignore : la vue de tous les projets et de
leurs livrables, la review horodatée qui devient un brief pour le monteur, et
les actions du pipeline.

### Lancer le pipeline depuis le hub

La page projet porte un panneau **Actions**, rangé en deux moments — et chaque
bouton dit ce qu'il fait, parce que « rendre » ne suffit pas à finir un projet :

- **Pendant le montage** : `Rendu draft + vérif` (le geste courant), `Rendu
  draft seul`, `Lint`, `Vérifier`.
- **Pour publier** : `Finaliser` — rendu qualité publication, puis master audio
  à -14 LUFS / -1 dBTP, puis vérification de ce master, en une fois. C'est le
  fichier `-master.mp4` produit là qu'on envoie.

Le chemin de publication force **`--quality high --video-bitrate 12M`**, soit
~60 Mo pour 44 s de vertical. Mesuré sur le reel de référence : un rendu draft
sort à **547 kbps** de vidéo en 1080x1920, un standard à 1,8 Mbps. 550 kbps,
c'est très bas — ça se voit d'abord sur les **dégradés sombres**, qui sont
justement le fond de la charte. Et les plateformes ré-encodent par-dessus :
une source pauvre ressort pire qu'elle n'est entrée. Réglages surchargeables
par projet dans `meta.json` :

```json
"fps": 30,
"render": { "quality": "high", "videoBitrate": "12M" }
```

Le `fps` est lu à la racine du `meta.json` (c'est là que les scaffolds de
format le déclarent) ou dans le bloc `render`. Il vit surtout **dans la
composition** — `data-fps="30"` sur la racine — pour qu'un rendu lancé à la
main depuis le terminal donne exactement le même fichier que le bouton. `Rendu standard seul` et
  `Master + vérif` restent disponibles pour reprendre la séquence en cours de
  route.

La sortie de la commande défile dans la page, étape par étape, et le projet se
redessine à la fin — un rendu draft de reel prend ~60 s, donc ce qui coûtait
cher n'était pas l'attente mais l'aller-retour vers le terminal, et le fait de
devoir penser à lancer la vérification derrière.

Deux garde-fous : la liste des actions est **fermée** (`lib/jobs.mjs`, aucune
commande construite depuis l'URL, aucun shell — `spawn` avec un tableau
d'arguments), et **un seul rendu tourne à la fois** sur la machine, puisqu'un
rendu occupe déjà six workers Chrome. Une action déjà en cours est reprise à
l'affichage si on revient sur la page.

`GET /api/actions` · `POST /api/run {slug, action}` · `GET /api/job/<id>?since=<n>`
· `POST /api/job-stop/<id>`.

### Les retours de review, dans le projet

L'interface de review enregistre chaque note dans
`video-projects/<slug>/review/<rendu>.json`, un fichier par rendu — des notes
sur la v17 n'ont aucun sens sur la v18, les timecodes ont bougé. N'importe
quelle session les relit sans copier-coller, et ils survivent au changement de
navigateur. La grille affiche une pastille « n retours » tant qu'ils ne sont pas
marqués traités ; la page projet les liste avec leurs timecodes.

Le localStorage reste comme filet, mais c'est le fichier du projet qui fait foi.

### Ranger les rendus

Un reel monté sur 19 versions laisse 19 MP4 dans `renders/`. Le panneau Renders
d'un projet propose **« Ne garder que les 3 derniers par livrable »** dès qu'il
y a de quoi ranger. Trois protections, toujours :

- les **autres livrables** : le compte se fait livrable par livrable, jamais
  sur le tas de rendus du projet ;

- les **masters** (`-master.mp4`), qui sont souvent plus anciens que le dernier
  draft mais qui sont le fichier publié ;
- `renders/final/`, la livraison.

Rien n'est supprimé : les fichiers partent à la **corbeille du système**, et
l'interface liste nommément ce qui va bouger avant de demander confirmation.
Rien n'est jamais rangé automatiquement — un rendu qu'on croyait périmé est
parfois celui qu'on allait publier.

`GET /api/prune/<slug>?keep=3` renvoie le plan sans rien toucher ;
`POST /api/prune {slug, keep}` l'applique.

### La route `/workspace/`

`review.html` vit dans le projet, pas dans `public/` — le serveur l'expose donc
via `/workspace/<chemin relatif à la racine>`, confiné à la racine du workspace.

Cette route **supporte les Range requests**, et ce n'est pas optionnel : sans
elles la barre de progression d'une vidéo ne répond pas et la navigation image
par image est impossible. C'est la même raison qui fait interdire
`python -m http.server` pour prévisualiser un rendu (voir CLAUDE.md).
