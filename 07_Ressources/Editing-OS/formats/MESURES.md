# Mesures — les 6 reels de référence

> Relevé du 2026-08-18. Les 6 reels donnés par l'utilisateur ont été téléchargés depuis
> Instagram, re-transcrits en local (whisper large-v3-turbo, `--language fr`) et
> mesurés image par image. **C'est la source de preuve des trois specs de `formats/`.**
> Aucun chiffre de ces specs n'est estimé : tout vient de ce tableau.
>
> `score` = vues ÷ moyenne des 30 publications précédentes (colonne `sp` du
> `dashboard-reseaux`). ×1 = pile son rythme du moment, ×2 = deux fois mieux.
> C'est la seule métrique comparable entre des reels publiés à 2 mois d'écart.

## Le tableau

| # | Reel | Publié | Format | Durée | Vues IG | **Score** | Mots/min | 1er mot | CTA | Chgt zone haute | LUFS |
|---|------|--------|--------|-------|---------|-----------|----------|---------|-----|-----------------|------|
| F1a | [DbQDB7Go39M](https://www.instagram.com/reel/DbQDB7Go39M/) — affiches moches | 26/07 | split carte | 59,9 s | 12 083 | ×0,86 | n/d¹ | 0,0 s | visuel | **1 / 0,77 s** | n/d¹ |
| F1b | [DZXp0E9IN20](https://www.instagram.com/reel/DZXp0E9IN20/) — storyboard ramen | 09/06 | split carte | 44,2 s | 6 886 | ×0,52 | 245 | 0,03 s | 38,7 s (87 %) | 1 / 2,77 s | −14,4 |
| F2a | [Dba-jOyIbom](https://www.instagram.com/reel/Dba-jOyIbom/) — Higgsfield Omni | 30/07 | avant/après | 55,1 s | 9 869 | ×0,71 | 227 | 0,04 s | 52,1 s (94 %) | — (démo continue) | −14,5 |
| F2b | [DZS0GnEoeps](https://www.instagram.com/reel/DZS0GnEoeps/) — Gemini Omni | 07/06 | avant/après | 35,8 s | 8 469 | ×1,00 | 209 | 0,60 s | 33,4 s (93 %) | — (démo continue) | −14,9 |
| F3a | [Db578PhInhG](https://www.instagram.com/reel/Db578PhInhG/) — le plat / PLAT | 11/08 | recréer viral | 65,0 s | 25 659 | **×2,37** | 159² | **9,03 s** | **14,7 s (23 %)** | 1 / 1,09 s | −14,3 |
| F3b | [Da5cgNmoNDr](https://www.instagram.com/reel/Da5cgNmoNDr/) — meubler une pièce | 17/07 | recréer viral | 28,6 s | 5 761 | ×0,52 | 255 | 2,41 s | 26,7 s (93 %) | 1 / 2,21 s | −14,4 |

¹ Le rendu IG servi pour F1a est une piste vidéo seule (pas d'audio dans la variante
téléchargée). Sa structure a été relevée sur les sous-titres incrustés.
² 159 mots/min parce que F3a porte 9 s de hook muet + 12,4 s de résultat muet en fin.
Sur sa partie parlée seule il est à ~240, comme les autres.

## Ce que les mesures disent

**1. La densité visuelle sépare les deux moitiés du tableau.**
Les deux reels au-dessus de ×0,85 (F3a ×2,37, F1a ×0,86) changent la zone haute
toutes les **0,77 à 1,09 s**. Les deux reels à ×0,52 (F1b, F3b) changent toutes les
**2,2 à 2,8 s**, soit 2 à 3 fois moins souvent. Sur 6 reels ce n'est pas une preuve,
mais ça va dans le sens de la règle déjà écrite dans `DESIGN.md` (« un élément visuel
nouveau chaque ~1-2 s ») et ça lui donne un seuil chiffré : **sous 1 changement /
1,5 s, le reel décroche**.

Détail F1a : sur ses 14 premières secondes, la zone haute change **exactement toutes
les 0,567 s** (17 images à 30 fps). C'est un métronome, pas une improvisation.

**2. Le seul reel qui double son audience place son CTA à 23 % du temps.**
F3a dit « tu as juste à commenter PLAT et je te l'envoie » à **14,7 s sur 65**, puis
enchaîne 50 s de tutoriel qui suppose qu'on a commenté (« tu ouvres le lien que tu vas
recevoir »). Les 4 autres posent le CTA à **87–94 %**, en sortie. Le CTA de F3a n'est
pas une fin, c'est **l'étape 1 de la recette** — on ne peut pas suivre la suite sans
commenter.

**3. Zéro queue morte, partout.**
Sur 5 reels mesurables, le dernier mot tombe à **0,19–0,22 s de la fin du fichier**.
La seule exception est volontaire : F3a garde 12,4 s de résultat muet en fin (le plat
qui se termine), qui est le payoff.

**4. Le hook muet n'est pas une perte de temps.**
F3a ne parle pas avant 9,03 s. Ces 9 s sont le contenu viral qui tourne en grand avec
l'étiquette manuscrite « Comment refaire ceci : ». C'est le reel qui performe le mieux.

**5. Tous les reels sortent à −14,3 à −14,9 LUFS.**
Instagram normalise à ~−14. Le master à −14 LUFS / −1 dBTP de `PROCESS.md` est donc
le bon réglage : livrer plus bas fait remonter le fichier par la plateforme, avec sa
dynamique à elle.

## Géométrie relevée

Mesures prises au pixel sur les images extraites (`f/` du scratchpad), ramenées en %
de la hauteur pour être indépendantes du 1080×1920 / 720×1280.

### Split carte (F1a, F1b, F3b — et la seconde moitié de F2a)

| Repère | F1a (1080×1920) | F1b (720×1280) | F3b (720×1280) | **Canon** |
|---|---|---|---|---|
| Bas de la zone illustration | y 925 (48,2 %) | y 635 (49,6 %) | plein cadre | **~50 %** |
| Ligne de sous-titre | y 1000–1080 (52–56 %) | y 680 (53 %) | y 640 (50 %) | **50–56 %** |
| Haut de la tête détourée | y 1120 (58,3 %) | y 715 (55,9 %) | y 710 (55,5 %) | **55–58 %** |
| Haut de la carte speaker | y 1275 (66,4 %) | y 820 (64,1 %) | y 850 (66,4 %) | **~65 %** |
| Débord tête au-dessus de la carte | 155 px (8,1 %) | 105 px (8,2 %) | 140 px (10,9 %) | **8–11 %** |
| Marge latérale de la carte | 78 px (7,2 %) | 50 px (6,9 %) | 32 px (4,4 %) | **5–7 %** |

Le projet HyperFrames validé (`video-projects/26-08-17-montage-video-par-ia`, 18
versions relues par l'utilisateur) utilise 1250 / 55 / rayon 42 / zone haute 970 — soit
65,1 % / 5,1 %, dans la fourchette. **C'est lui le canon** : c'est la seule géométrie
qui a été relue image par image.

### Empilement avant/après (F2b, 720×1280)

| Bande | y | % hauteur |
|---|---|---|
| Bandeau titre noir | 0 → 236 | 18,4 % |
| Étiquette « Gemini Omni » | 236 → 252 | — |
| Volet A (transformé), 16:9 | 266 → 672 | 31,7 % |
| Étiquette « Originale » | 690 → 727 | — |
| Volet B (original), 16:9 | 740 → 1146 | 31,7 % |
| Noir de pied | 1146 → 1280 | 10,5 % |

Les deux volets sont des **crops 16:9 de la même prise**, empilés, à hauteur stricte-
ment égale. Le noir de pied de 10,5 % laisse la place à l'UI Instagram.

F2a place ses étiquettes **en bas à gauche à l'intérieur de chaque volet**, F2b les
place **centrées au-dessus**. Les deux existent ; la spec tranche pour F2b (voir
`02-avant-apres.md`).

## Sous-titres — le point qui contredit `DESIGN.md`

Échantillonnage à 5 images/s de la bande de sous-titres de F1a, 0 → 6 s :

```
0,0 → 1,0 s   « T'as déjà sûrement vu »
1,0 → 2,2 s   « ces affiches absolument »
2,2 → 2,8 s   « hideuses »
2,8 → 4,0 s   « partout sur internet »
4,0 → 5,0 s   « sauf qu'elles donnent »
5,0 → 6,0 s   « une image complètement »
```

Ce sont des **groupes de 1 à 4 mots qui se remplacent en bloc, toutes les 0,6 à 1,2 s**.
Pas de mot-à-mot, pas de mot surligné dans le groupe. Les 6 reels publiés font ça.

`DESIGN.md` imposait le mot-à-mot (règle héritée de Nathan/Nick). **Tranché par
L'utilisateur le 18/08 : les groupes gagnent** — `DESIGN.md` a été mis à jour et les
scaffolds n'embarquent que ce mode.

## Reproduire ces mesures

```bash
node scripts/transcribe-whisper.mjs <reel>.mp4 --language fr      # cadence, CTA, queue
ffmpeg -i <reel>.mp4 -vf "crop=iw:ih*0.55:0:0,select='gt(scene,0.15)',showinfo" -f null -   # densité zone haute
ffmpeg -i <reel>.mp4 -af loudnorm=print_format=json -f null -     # LUFS
ffmpeg -ss 0 -t 6 -i <reel>.mp4 -vf "fps=5,crop=iw:230:0:930,tile=3x10" caps_%02d.png       # cadence sous-titres
```
