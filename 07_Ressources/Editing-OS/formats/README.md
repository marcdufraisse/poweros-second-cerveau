# Formats — les trois reels standard de l'utilisateur

> Standardisés le 2026-08-18 à partir des 6 reels publiés qu'il a désignés lui-même.
> Les chiffres viennent tous de [`MESURES.md`](MESURES.md), jamais d'une estimation.
>
> **Ce dossier est la source de vérité de la géométrie et de la structure d'un reel.**
> `style-library/10-marc/DESIGN.md` reste la source de vérité du *look* (palette,
> typo, motion). Quand les deux se croisent, la géométrie est ici, le look est là-bas.

## Choisir en une question

> **Qu'est-ce que le spectateur doit avoir compris à la seconde 3 ?**

| Réponse | Format | Fichier |
|---|---|---|
| « Il y a un problème / une idée, et il va me l'expliquer » | **01 · Split carte** | [01-split-carte.md](01-split-carte.md) |
| « Regarde la différence entre ces deux vidéos » | **02 · Avant/après** | [02-avant-apres.md](02-avant-apres.md) |
| « Ce truc est dingue, et je vais pouvoir le refaire » | **03 · Recréer ce contenu viral** | [03-recreer-viral.md](03-recreer-viral.md) |

Si la réponse est « je ne sais pas », le reel n'est pas prêt à être monté. Ce n'est
pas un problème de montage.

## Les trois formats en une ligne

| | 01 · Split carte | 02 · Avant/après | 03 · Recréer viral |
|---|---|---|---|
| **Ce que ça vend** | un point de vue | un outil | une recette |
| **Ce qu'on voit d'abord** | l'illustration + lui | les deux volets qui divergent | le contenu viral, en grand, muet |
| **Il est à l'écran** | tout du long, carte tiers bas | jamais dans la démo ; carte dans la vente | 0–9 s en détouré, puis plus du tout |
| **Durée type** | 30–60 s | 35–55 s | 30–65 s |
| **CTA** | en sortie (85–95 %) | en sortie (90–95 %) | **à ~20–25 %**, en étape 1 |
| **Densité zone haute** | 1 chgt / ~0,8 s | démo continue | 1 chgt / ~1 s |
| **Référence mesurée** | F1a `DbQDB7Go39M` ×0,86 | F2b `DZS0GnEoeps` ×1,00 | F3a `Db578PhInhG` **×2,37** |
| **Scaffold** | `style-templates/reel-01-split-carte/` | `.../reel-02-avant-apres/` | `.../reel-03-recreer-viral/` |

## Le format long YouTube

| | 04 · Tella |
|---|---|
| **Ce que c'est** | la vidéo longue YouTube en 16:9 : partage d'écran à gauche, cam verticale à droite, panneau chapitres au-dessus de la cam |
| **Spec** | [04-tella.md](04-tella.md) |
| **Scaffold** | `style-templates/yt-04-tella/` |
| **Chapitres** | Claude les construit lui-même depuis le transcript monté, puis les montre à l'utilisateur avant le rendu |

| | 05 · YouTube minimaliste |
|---|---|
| **Ce que c'est** | la vidéo longue YouTube sobre : ciel de nuit violet (ou noir et blanc), vidéo 16:9 dans une fenêtre Mac centrée qui s'ouvre comme sur macOS, notifications macOS pour les chapitres et les éléments clés |
| **Spec** | [05-youtube-minimaliste.md](05-youtube-minimaliste.md) |
| **Scaffold** | `style-templates/yt-05-youtube-minimaliste/` |
| **Notifications** | Claude les construit au montage (titre du chapitre ou de l'élément + commentaire), puis les montre à l'utilisateur avant le rendu |

Créé le 2026-10-08 d'après la capture d'un créateur. Choisir 04 pour une démo ou un tuto (écran + chapitres), 05 pour un récit.

Créé le 2026-10-07 à la demande de l'utilisateur d'après la mise en page d'un créateur, sans attendre deux vidéos publiées (exception à la règle du bas de page). Les règles propres au 9:16 ne s'y appliquent pas : voir sa spec.

## La colonne vertébrale commune

Ces cinq règles valent pour les trois formats. Elles ne se renégocient pas par vidéo.

1. **Cadre 1080×1920, 30 fps.** Les 10 % du bas et les 15 % du haut peuvent être
   mangés par l'UI Instagram : rien d'indispensable n'y vit jamais.
2. **Rien ne recouvre le visage.** Ni sous-titre, ni carte, ni étiquette. Si la place
   manque, on déplace le layout, jamais la règle.
3. **Zéro frame morte.** Tout élément qui tient plus de ~0,5 s porte une animation
   d'entretien (curseur, playhead, shimmer, zoom lent, compteur). Un plan figé est un
   bug de montage, pas un choix.
4. **La parole finit avec la vidéo** — dernier mot à ~0,2 s de la fin — *sauf* payoff
   muet volontaire (format 03). Pas de queue morte, jamais.
5. **Master à −14 LUFS / −1 dBTP**, vérifié par `autoverify` sur le master, pas sur le
   draft. C'est ce fichier-là qu'on publie.

Et une règle de fabrication : **tout se cale sur les timestamps de mots du transcript**,
jamais à l'oreille. Un beat entre 0,2 à 0,6 s *avant* le mot qu'il illustre.

## Ce qui change d'un format à l'autre

Seulement trois choses. Tout le reste est commun.

- **La division du cadre** — une carte en tiers bas / deux volets empilés / un média
  plein cadre.
- **La place du présentateur** — présent tout du long / absent puis présent / présent puis
  absent.
- **La place du CTA** — en sortie / en sortie / en étape 1.

## Les exemples rendus

Les rendus d'exemple ne sont pas livrés : vos premiers montages serviront de référence.

## Les mesures

Le détail mesuré de chaque format est dans `MESURES.md`. Les captures de référence ne sont pas livrées.

## Comment on s'en sert

```bash
# 1. le skill choisit le format, crée le projet daté et instancie le scaffold
#    (dans Claude Code : /reel-format)

# 2. le reste est le process habituel, inchangé
cat PROCESS.md
```

Le skill `reel-format` ne remplace pas `PROCESS.md` : il pose la phase 0 et la phase 3
(le squelette de composition). Le montage parole, `design-beats`, la vérification et
la boucle de review restent identiques pour les trois formats.

## Ce qui n'est pas standardisé (volontairement)

- **Le fond de la zone haute.** Noir texturé (vagues concentriques) par défaut, mais
  un média plein cadre est légitime.
- **Le nombre de segments de parole.** Ça dépend du texte.
- **Les cartes de la zone haute.** Elles viennent de `style-library/10-marc/cards/social/`
  et se choisissent au storyboard, via le skill `design-beats`.

## Une nouvelle famille de reels ?

Si un reel ne rentre dans aucun des trois, ne pas tordre un format existant : le
monter à la main, le publier, et **attendre d'en avoir deux qui se ressemblent**
avant d'écrire un `04-*.md`. Les trois formats d'ici viennent chacun de deux reels
réels, pas d'une intention.
