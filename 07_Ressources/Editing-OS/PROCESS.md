# PROCESS — Le montage d'un reel, de A à Z

> Process validé le 17/08/2026 sur `video-projects/26-08-17-montage-video-par-ia`
> (17 versions, retours frame par frame de l'utilisateur). C'est LA recette pour toute
> prochaine vidéo courte. Les règles visuelles détaillées vivent dans
> `style-library/10-marc/DESIGN.md` ; ici on décrit l'enchaînement.

## Phase 0 — Préparation

0. **Choisir le format** avec le skill `reel-format` : `formats/README.md` (01 split
   carte / 02 avant-après / 03 recréer viral). Le projet naît du scaffold
   `style-templates/reel-0N-*`, la spec `formats/0N-*.md` s'ajoute à la checklist de
   la phase 4.
1. **Projet daté** : `video-projects/AA-MM-JJ-sujet/` (kebab-case).
2. **Rush** : réencoder en H.264 (`crf 20`, faststart). Recadrer par **crop**
   depuis le master 16:9 (jamais un scale qui déforme). Cadrage validé :
   crop large type `1612:1080` pour que le visage soit grand une fois zoomé.
3. **Transcription locale** : `node scripts/transcribe-whisper.mjs rush.mp4
   --language fr` → mots avec `start`/`end`. VAD + align restent activés
   (sans eux, les timestamps sont inutilisables).

## Phase 1 — La parole (le montage invisible)

4. **Grandes coupes au transcript** : segments `SEG` posés sur les VRAIS
   `start`/`end` des mots. Pads : ~0.3s avant la première attaque, +0.4-0.7s
   après les fins de mots. **Répétitions : garder uniquement la DERNIÈRE
   prise** — et vérifier chaque gap suspect en **re-transcrivant par tranches
   courtes qui se chevauchent** (2,5 s toutes les 2 s), jamais par une passe
   sur le fichier entier.

   > Corrigé le 2026-09-12 sur `26-09-11-iphone-duo-apple`. L'ancienne consigne
   > disait « une re-transcription naturelle » : elle ne suffit pas. Sur ce
   > rush, la passe mot à mot ET la passe naturelle du fichier entier
   > affichaient toutes deux **une seule** occurrence d'une phrase dite **trois
   > fois**. Whisper ne masque pas seulement les retakes dans le mode mot à
   > mot : il les fusionne aussi en transcription naturelle, dès que le fichier
   > est long. Seul le découpage en tranches courtes les fait apparaître. Une
   > phrase dont un mot s'étire anormalement (ici « Pourtant » sur 1,3 s) est le
   > signal à suivre.
5. **Bake unique** : un seul `ffmpeg trim/concat` → `assets/edit.mp4`.
   Le bake et la composition utilisent le MÊME EDL (leçon v10 : tout
   désaccord bake/composition produit mots coupés + karaoké désynchro).
6. **Micro-blancs au niveau SONORE** (le transcript ne les voit pas —
   whisper étire les mots sur les pauses) : `silencedetect noise=-36dB:d=0.25`
   sur l'audio monté (parole ~-26 dB), raboter le MILIEU de chaque blanc en
   laissant ~0.25s de respiration. Preuve : re-silencedetect → il ne doit
   rester que les respirations voulues. Le recalage de la composition passe
   par `shiftCut(t)` dans `ed()` + décalage des temps littéraux.
7. **Détourage** : `npx hyperframes remove-background` → webm alpha.
   Toute coupe ultérieure se fait sur le bake ET le webm avec le même EDL
   (décodage `-c:v libvpx-vp9` pour préserver l'alpha).

## Phase 2 — Direction artistique (le designer qui écoute)

> Ajoutée le 17/08 à la demande de l'utilisateur : « le système écoute ce que je dis
> et propose des animations avancées, quasi chaque seconde, comme un designer »
> — parce que la v1 du premier reel était loin du résultat final.

7bis. **Invoquer le skill `design-beats`** sur le transcript monté, AVANT toute
   composition. Il écoute phrase par phrase, applique la grille « chaque chose
   nommée → son visuel » (drag & drop, timeline animée, croix rouge, compteur,
   doc qui scrolle, mascotte, chat vivant...), vise un événement visuel
   toutes les ~1-2 s, et produit un **storyboard timecodé** (t_in ancré sur les
   mots, entrée/entretien/sortie, SFX).
7ter. **L'utilisateur arbitre le storyboard** (il est le DA final), et seulement
   ensuite on compose. La v1 doit ressembler à une v10.

## Phase 3 — La composition (HyperFrames)

8. **Layout canonique** (DESIGN.md « LA CARTE ») : split dès la frame 1,
   carte arrondie tiers bas, deux couches (vidéo clippée + détourage libre)
   aux transforms STRICTEMENT identiques, tête qui dépasse ~130px, ligne de
   tête fixe (punch-ins avec compensation `y`), karaoké un mot au-dessus de
   la tête — jamais sur le visage, jamais devant quelque chose.
9. **Beats** : un élément visuel nouveau chaque ~1-2s ; tout ce qui est
   nommé est MONTRÉ (fichier → drag & drop, opération de montage → timeline
   animée, outil rejeté → croix rouge dessinée, argent → compteur, doc →
   PDF qui scrolle). Mascotte Claude en intro + callbacks. Zéro flottement.
   SFX du pack (`asset-library/sfx/`) aux volumes du README, jamais sur les
   swaps karaoké.
10. **Tous les temps de parole passent par `ed(src)`** (source → monté) ;
    les beats se calent sur les mots, jamais à l'oreille.

## Phase 4 — Vérification (avant TOUT envoi à l'utilisateur)

11. `npx hyperframes lint` puis rendu draft.
12. **Regarder les frames** : extraire les moments clés (chaque beat, chaque
    point de coupe, le cadrage carte) et les regarder vraiment. « Le CSS a
    l'air bon » n'est pas une vérification.
13. `npm run verify -- --project <slug>` sur le rendu : re-transcription
    (mots-sentinelles, répétitions, queue morte), zone haute jamais vide,
    niveau audio. **Le script vit dans `scripts/`, pas dans le projet** — il
    n'y a plus de copie à adapter. Sa configuration tient dans le `meta.json`
    du projet (bloc `verify`) ; sans configuration il déduit ses
    mots-sentinelles du transcript **du montage** (jamais du rush, qui
    contient les phrases coupées exprès), et il saute la zone haute sur un
    format horizontal.
12bis. **Le fps se déclare, il ne se tape pas.** `data-fps="30"` sur la racine
    de la composition, et `"fps": 30` dans le `meta.json`. **30 pour tous les
    verticaux** : c'est la cadence native d'Instagram et de TikTok, et le
    format enchaîne punch-ins, zooms et swaps karaoké — du mouvement continu,
    que le 24 fait juddérer. Les masters v15 à v19 sont sortis en 24 parce que
    quelqu'un avait tapé `-f 24` un jour, sans que rien ne le déclare : c'est
    exactement le genre d'écart que ce process existe pour empêcher.
13bis. **Le rendu de publication n'est pas un draft** : `--quality high
    --video-bitrate 12M` (mesuré : un draft sort à 547 kbps de vidéo en
    1080x1920, un standard à 1,8 Mbps ; ça se voit sur les dégradés sombres,
    et les plateformes ré-encodent par-dessus). Réglable par projet dans
    `meta.json`, bloc `render`.
14. **Master de publication** : `npm run master -- --project <slug>` → **-14 LUFS,
    true peak -1 dBTP** (un mix brut sort vers -23 : trop bas pour IG/TikTok).
15. `verify` sur le **master** : PASS obligatoire (23/23 sur le reel de
    référence). C'est ce fichier qu'on envoie, pas le draft. Sur un draft, le
    niveau audio n'est qu'un avertissement — un draft n'est pas censé être
    masterisé.

> Depuis le hub (`npm run os`), la phase 4 tient en un bouton : **Finaliser**
> sur la page projet enchaîne rendu qualité publication, master et vérification
> du master. Pendant le montage, c'est **Rendu draft + vérif** qui sert à
> chaque itération.

## Phase 5 — La boucle de review

16. `review.html` pointé sur le dernier rendu (serveur `npx serve` sur :8080,
    jamais Python http.server). L'utilisateur note ses retours horodatés → « Copier
    pour Claude » → corrections chirurgicales par timecode → re-render →
    re-master → re-verify → renvoi.
17. **Chaque retour généralisable devient une règle** : mémoire persistante +
    `DESIGN.md`. Le retour vaut pour toutes les vidéos suivantes, pas pour
    celle-là seulement.
18. **Nommer le rendu par version** (`final-v3.mp4`, `final-v4.mp4`...). Constaté le
    26/08 : `review/<render>.json` est un fichier **cumulatif par nom de rendu**. Tant
    que chaque version s'appelle `final-master.mp4`, les retours déjà traités
    s'empilent avec les nouveaux, et on reçoit 16 retours dont 13 sont périmés. Avant
    de conclure qu'un retour est nouveau, le confronter au rendu courant : un retour
    dont le timecode ne correspond plus à rien est un reliquat.

## Les pièges qui ont coûté des versions

- Bake et composition sur des EDL différents (v10) → autoverify le détecte.
- Couches détourage/vidéo à des scales différents → « 4 oreilles » (v12).
- Sous-titres sur le visage quand la tête monte pendant un zoom (v12).
- Micro-blancs invisibles au transcript (v14) → silencedetect systématique.
- Audio à -23 LUFS envoyé tel quel (v15) → master systématique.
- Heredoc python qui échoue en silence → script avec `assert` sur chaque ancre.
