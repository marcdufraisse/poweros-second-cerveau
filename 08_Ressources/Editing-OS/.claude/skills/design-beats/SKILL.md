---
name: design-beats
description: Directeur artistique du reel. Écoute le transcript monté et propose une animation avancée quasi chaque seconde, comme un designer, AVANT toute composition. Déclencher après le montage parole (bake propre) et avant d'écrire la moindre ligne de composition HyperFrames — ou quand l'utilisateur dit "storyboard", "propose les animations", "fais le designer".
---

# Design Beats — le designer qui écoute

## Pourquoi cette étape existe

Constat de l'utilisateur (17/08, reel montage-ia) : la v1 était loin du résultat final —
tout le niveau « designer » est arrivé par ses retours successifs (drag & drop montré,
timeline de nettoyage, croix rouges, PDF qui scrolle...). Cette étape fait ce travail
AVANT la première version : on écoute ce qu'il dit, seconde par seconde, et on propose
l'animation qui le MONTRE. La v1 doit ressembler à une v10.

## Entrées

1. Le transcript mot à mot du montage parole terminé (bake propre, temps édités via `ed(src)`).
2. `style-library/10-marc/DESIGN.md` — lu EN ENTIER avant de proposer quoi que ce soit.
3. `style-library/10-marc/PLAYBOOK.md` — la grammaire de montage (18/08, dérivée
   des corpus Nathan Hodgson et Nick Saraev). C'est lui qui fixe le choix
   ci-dessous et les trois lois (zéro frame morte, course aux assets, tout animé).
4. `PROCESS.md` et la mémoire persistante (règles gravées des retours précédents).

## La méthode

### 0. Choisir la grammaire (PLAYBOOK.md, « La règle de choix »)

Avant tout storyboard, lire le script et trancher :

- **WORKFLOW** (« voilà comment je fais X ») → plans de 3-6 s, chaque étape
  devient une séquence d'UI redessinée qui S'EXÉCUTE (`soc-ui-run`) ;
  15-18 beats/minute.
- **NEWS** (« X vient de sortir ») → plans de 1-3 s, captures RÉELLES en preuve,
  cycles NOM → PREUVE → MÉCANISME → BÉNÉFICE ; 25-30 beats/minute.

Annoncer le choix en tête du storyboard. Ensuite, **lancer la course aux
assets** : chaque nom propre du script → un asset web via `insert-broll`
(screenshot Playwright, page GitHub, logo). La beat-map liste l'asset requis
par beat ; rien ne se compose avant que les assets existent.

### 1. Écouter, pas survoler

Relire le texte monté phrase par phrase en se posant, pour chaque groupe de sens
(~1-3 s de parole), LA question du designer : **« qu'est-ce qu'on MONTRE pendant
qu'il dit ça ? »** Jamais « quel texte on affiche » — qu'est-ce qu'on montre.

### 2. La grille de traduction (chaque chose nommée → son visuel)

| Il dit... | On montre... |
| --- | --- |
| un fichier, une vidéo donnée à un outil | le chip du fichier qui se **drag & drop** dans l'interface, pièce jointe visible |
| un outil qu'il utilise | l'interface réaliste de l'outil (thème officiel), en train de FAIRE |
| un outil qu'il n'utilise PAS | sa carte + **croix rouge qui se dessine** (2 traits, buzzer) |
| couper les silences / ratés, caler, poser des SFX | la **timeline de montage animée** : gaps qui se referment, clip ✕ éjecté, pills qui tombent |
| un chiffre, de l'argent | **compteur animé** (count-up/down), gradient or |
| un document, un guide | la **carte doc qui scrolle** par pages (skeleton + code + checklist) |
| une action de tournage/création | la **mascotte Claude** qui la joue (pixel, blinks, pattes) |
| une conversation avec l'IA | le **chat vivant** : typewriter, envoi, réponse qui streame |
| un avant/après | stack comparatif A/B |
| un chiffre SUR une vraie page (prix, étoiles GitHub, leaderboard) | le **spotlight jaune** : la capture réelle floutée sauf la zone, cadre jaune (`soc-spotlight-jaune`, 1-2 par reel max) |
| un asset du web sans zone à pointer (site, logo, UI) | le **media-slam** : une des 5 entrées animées + dérive continue (`soc-media-slam`, alterner les variantes) |
| une étape de workflow (« dis à Claude de... ») | l'**UI rejouée qui s'exécute** : frappe 45 ms/car, statuts, badges jaunes, compteur (`soc-ui-run`, ne jamais couper avant la fin) |
| le CTA | carte de fin charte de marque, en français : « Commente MOT-CLÉ pour recevoir [la ressource] », le mot-clé se tape puis claque en lavande — TOUJOURS la même carte (`soc-cta-ressource`, slots keyword + resource), c'est la répétition qui fait l'actif de marque. Demander à l'utilisateur le mot-clé ET le nom concret de la ressource s'ils ne sont pas dans le rush |

Si rien ne colle : INVENTER un pattern dans le style (le vocabulaire ci-dessus est
né comme ça). Interdits : carte-label statique, texte qui répète la parole, décor.

### 3. Densité et rythme

- **Un événement visuel nouveau chaque ~1-2 s.** Un beat sans nouvel événement
  pendant 2 s doit porter une animation d'entretien (playhead, curseur, shimmer).
- L'animation d'un mot **démarre quand le mot commence** et vit assez longtemps.
- Les mots-chocs slamment dans l'espace LIBRE (jamais sur l'illustration en cours).
- Chaque beat note son SFX (rôles du pack : whoosh, pop, click, buzzer, cash,
  riser, shutter, typing) — jamais de SFX sur les swaps karaoké.

### 4. Le livrable : un storyboard timecodé, présenté AVANT de composer

Un tableau, une ligne par beat :

```
| t_in–t_out (monté) | il dit (verbatim) | on montre | entrée / entretien / sortie | SFX |
```

Chaque `t_in` est ancré sur un mot précis du transcript (via `ed`). Présenter le
storyboard complet à l'utilisateur **avant d'écrire la composition** — c'est lui le DA
final : il coche, corrige, remplace. Ne composer qu'après son passage.

### 5. Après accord

Dérouler la composition (PROCESS.md phase 3) beat par beat depuis le storyboard
approuvé. Tout écart en cours de route (place, lisibilité) se re-propose, ne se
décide pas en silence.
