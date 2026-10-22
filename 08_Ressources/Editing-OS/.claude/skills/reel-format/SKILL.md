---
name: reel-format
description: >
  Choisit le format standard d'un reel de l'utilisateur (01 split carte, 02 avant/après,
  03 recréer viral), crée le projet daté depuis le scaffold correspondant et pose la
  checklist de la spec. Déclencher au démarrage de tout nouveau reel : « nouveau
  reel », « on monte un reel sur… », « quel format pour… », « /reel-format ».
---

# reel-format — choisir et instancier le format d'un reel

Les trois formats standard vivent dans `formats/` (specs) et `style-templates/reel-0*`
(scaffolds). Ce skill est la porte d'entrée : il choisit, il instancie, il ne monte pas.

> Vidéo longue YouTube (16:9, écran + cam) : ce n'est pas un reel, utiliser le format
> **04 · Tella** (`formats/04-tella.md`, scaffold `style-templates/yt-04-tella/`) pour une démo ou un tuto,
> ou **05 · YouTube minimaliste** (`formats/05-youtube-minimaliste.md`, scaffold
> `style-templates/yt-05-youtube-minimaliste/`) pour un récit.

## Étape 1 — Choisir le format

Poser LA question : **qu'est-ce que le spectateur doit avoir compris à la seconde 3 ?**

| Réponse | Format |
|---|---|
| « Il y a un problème / une idée, et il va me l'expliquer » | **01 · split carte** |
| « Regarde la différence entre ces deux vidéos » | **02 · avant/après** |
| « Ce truc est dingue, et je vais pouvoir le refaire » | **03 · recréer viral** |

Aides à la décision :
- Le sujet est une **sortie d'outil** dont l'effet se voit sur une vidéo de l'utilisateur
  lui-même → 02.
- Le sujet est un **contenu qui circule** (ou généré) qu'on va apprendre à reproduire,
  avec un doc/prompt à envoyer en DM → 03.
- Tout le reste (opinion, méthode, annonce, build-in-public) → 01.

En cas de doute entre deux formats, présenter le choix à l'utilisateur avec une ligne
d'argument par option. Ne jamais mélanger deux formats dans un reel.

Si le reel ne rentre dans aucun format : le dire, monter à la main, et n'écrire un
`04-*.md` que lorsque DEUX reels publiés se ressemblent (règle du `formats/README.md`).

## Étape 2 — Instancier le projet

```bash
# depuis la racine EditingOS-dist ; slug daté, convention AA-MM-JJ-sujet-kebab
cp -R style-templates/reel-0N-<format> video-projects/AA-MM-JJ-<sujet>
cd video-projects/AA-MM-JJ-<sujet>
```

Puis, dans l'ordre :
1. Mettre à jour `meta.json` (slug, title, notes). Conserver le champ `format`.
2. Copier `tools/autoverify.py` et `tools/master.py` depuis
   `video-projects/26-08-17-montage-video-par-ia/tools/` et adapter les
   mots-sentinelles. **Format 03 : reprendre `muteZones` du `meta.json` dans
   autoverify** — le hook et le payoff sont muets par design, il ne doit pas les
   compter en queue morte.
3. Vérifier que les fonts sont là (`assets/fonts/`) — le scaffold les embarque.

## Étape 3 — Annoncer la suite

Le reste est le process standard, inchangé : **`PROCESS.md`** phase par phase
(transcription → montage parole → `design-beats` → composition → autoverify →
master → review). La spec du format (`formats/0N-*.md`) s'ajoute à la checklist
de la phase 4 — sa checklist finale doit passer en entier avant tout envoi.

Les trois différences de fabrication à ne pas rater :

- **01** : la densité (jamais > 1,5 s sans changement en zone haute) se vérifie sur
  le rendu avec `ffmpeg -vf "crop=iw:ih*0.5:0:0,select='gt(scene,0.15)',showinfo"`.
- **02** : les deux volets = la même prise au même timecode ; vérifier sur images
  extraites que les gestes coïncident.
- **03** : la voix ne commence qu'à la fin du hook ; le CTA tombe entre 20 et 30 %
  de la durée totale ET la suite du script en dépend (« le lien que tu vas recevoir »).

## Ce que ce skill ne fait pas

- Il ne coupe pas la parole (skills `cut-silences`, `cut-mistakes`).
- Il ne fait pas le storyboard (skill `design-beats`).
- Il ne choisit pas les cartes (skill `motion-graphics` + `style-library/10-marc`).
- Il ne modifie jamais `formats/` : les specs n'évoluent que sur mesure de reels
  publiés, jamais pendant un montage.
