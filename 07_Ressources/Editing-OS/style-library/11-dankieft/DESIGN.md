# Dan Kieft — Design Spec

> Source de vérité : les frames dans `references/`, extraites de trois vidéos de
> [youtube.com/@Dankieft](https://www.youtube.com/@Dankieft) —
> `0B_xyflXrwc` (« Why My AI Videos look Ultra Realistic », 400k vues),
> `UxwV16jDglA` (« Seedance 2.5 is an ABSOLUTE MONSTER », 104k) et
> `e9ZupmL9BcM` (« Master AI Filmmaking in 30 Minutes », 317k).
> Tout ce qui suit en est dérivé, couleurs échantillonnées au pixel.

**Ce style est fait pour le YouTube long** (10–30 min, tutoriel / walkthrough), pas
pour le reel. Sa logique est celle d'un cours filmé : un présentateur, beaucoup
d'écran, et des graphismes dont le seul job est de dire *où regarder*.

## Le feel

Un présentateur assis dans un décor sombre, et à côté de lui un espace où les écrans
existent **physiquement**. Ce n'est jamais une capture d'écran collée sur un fond :
c'est un panneau qui se tient dans une pièce, en perspective, et la caméra marche
vers lui. Tout le reste — une pastille, un surligneur, un chiffre jaune — sert à
pointer un endroit précis de cet écran.

Le style ne cherche pas à impressionner. Il cherche à ce que tu ne décroches pas
d'un pavé de texte pendant 40 secondes. C'est de la pédagogie, mise en scène.

## Les deux mouvements signature

### 1. Le push-in 3D (`cards/custom/screen-3d-push.html`)

**Le mouvement le plus reconnaissable de la chaîne.** Un écran commence petit, loin
et fortement fuyant ; la caméra avance vers lui pendant 8 à 14 secondes ; il finit
grand, presque de face, débordant du cadre.

Ce qui le fait marcher, ce n'est pas le zoom — c'est le **redressement**. Le lacet
(`rotateY`) passe de ~−13° à ~−2,5° pendant l'approche. La perspective se déforme
en continu. Un `scale()` plat ne produit rien de comparable, et c'est l'erreur
numéro un quand on essaie de copier ce look.

```
perspective: 2200px           sur la scène
translateZ: -1050px → 100px   l'approche
rotateY:      -13°  → -2.5°   le redressement — LA variable qui vend le plan
rotateX:        5°  →  1°
durée:        11s, power1.inOut, JAMAIS d'ease-out
```

**Règle absolue : le mouvement ne se résout pas.** Il bouge encore au moment de la
coupe. C'est ce qui empêche le plan de retomber à plat pendant que le présentateur
parle par-dessus.

### 2. Le zoom sur zone (`cards/custom/screen-zoom-region.html`)

L'écran entier est à l'image, puis on plonge dans **un rectangle** — le champ dont
il parle à cet instant. Un filet jaune encadre la zone, un label en serif italique
la nomme, et la caméra punche dessus en ~0,9 s.

La zone se décrit en pourcentages de l'écran (`--rx` / `--ry` / `--rw` / `--rh`,
largeur et hauteur indépendantes), ce qui est
exactement la manière dont un agent peut désigner « le bouton Generate » ou « la
ligne Scene context » à partir d'une capture. Le punch est un `transform` sur un
wrapper, pas un recadrage : le filet et le label sont dessinés *sur* l'écran et
grossissent avec lui.

Après le punch, ça continue de dériver lentement. Même règle : jamais immobile.

## La palette

Trois couleurs saturées, pas une de plus. Tout le reste est neutre.

| Token | Hex | Rôle |
| --- | --- | --- |
| `--yellow` | `#FFE930` | **L'accent.** Surligneur, chiffres, titres sur b-roll, cadres d'annotation. |
| `--royal` | `#002085` | La scène « graphique » — le bleu sur lequel flottent les cartes noires. |
| `--royal-lit` / `--royal-deep` | `#0B3AC4` / `#00112F` | Centre éclairé et vignette du dégradé de scène. |
| `--electric` | `#0200FF` | Le **second** surligneur. Bleu pur, texte blanc dessus. Sert à opposer deux catégories dans un même pavé. |
| `--ink` | `#000000` | La carte de contenu. Noir pur, volontairement. |
| `--charcoal` | `#262626` | La scène « écran » — là où se passe le travail en 3D. Neutre chaud, pas bleu. |
| `--charcoal-lit` | `#343431` | La face éclairée d'un panneau dans cette pièce. |
| `--periwinkle` | `#8889FF` | L'anneau du PIP et les bords de pastilles. La seule lueur. |
| `--bone` | `#CDCDCB` | Les titres de chapitre en serif. Blanc cassé, jamais pur. |
| `--ember` | `#CF785A` | L'astérisque de chapitre. Une fois par carte, minuscule. |

**Deux scènes, jamais mélangées.** Le bleu roi porte les graphiques construits
(pavés de prompt, comparatifs, marqueurs de segment). Le charbon porte le travail
d'écran en 3D. Passer de l'une à l'autre est une coupe franche, jamais un fondu.

> Note pour l'utilisateur : son accent est un jaune `#FFE930`, le tien est le violet de
> marque `#8E16FA`. Le style ne tient que sur un accent unique : la substitution
> est directe, voir « Adapter » plus bas.

## La typographie

Deux voix, et elles ne se croisent jamais.

- **Grotesque (`Inter Tight`)** — tout ce qui structure. Les pastilles sont en
  **italique 800 capitales** (`SIMPLE PROMPTING TECHNIQUE`), penchées vers l'avant.
  Les payoffs de segment sont en capitales droites (`SMART EDITING`).
- **Serif (`Instrument Serif`)** — **uniquement** les titres de chapitre et les
  labels d'annotation. C'est le seul endroit où le style s'adoucit
  (`✳ What shall we think through?`). Précédé d'un astérisque `--ember`.
- **Body (`Inter` 24 px)** — les pavés de prompt. Petit exprès : c'est un document
  qu'on lit, pas un titre qu'on admire. Ne jamais grossir le corps pour « aider » —
  c'est le zoom sur zone qui aide.
- **Mono (`JetBrains Mono`)** — badges et compteurs seulement (`30 sec`).

## Le surlignage progressif

Le geste pédagogique central, et le plus facile à sous-estimer.

Un pavé de texte arrive **entier**, non surligné. Puis, au fil de la parole, chaque
bloc s'allume : un balayage de surligneur de gauche à droite, ~0,3 s par marqueur,
0,12 s entre deux. Jaune pour une catégorie, bleu électrique pour l'autre.

Le pavé lui-même ne bouge pas. Rien n'apparaît, rien ne disparaît. Seuls les
marqueurs avancent. C'est ce qui permet de tenir 40 secondes sur un mur de texte
sans perdre le spectateur : il voit toujours *où on en est*.

## Le PIP

Un médaillon circulaire du présentateur, coin haut droit, cerclé de `--periwinkle`
avec une lueur douce. Il est **permanent** dès qu'un écran est à l'image — jamais
d'aller-retour entre plein cadre et écran pour un simple commentaire. C'est ce qui
fait que le montage ne « saute » pas alors qu'il y a une coupe toutes les 6 secondes.

## Le rythme (mesuré)

Sur `0B_xyflXrwc`, 1003 s, 156 coupes détectées :

| | |
| --- | --- |
| Coupes / minute | **9,3** |
| Plan médian | **3,3 s** |
| Plan moyen | 6,5 s |
| Coupes dans les 30 premières secondes | **15** (une toutes les 2 s) |

Le hook est deux fois plus rapide que le corps. Et le hook n'est pas du talking
head : c'est un **court-métrage IA de 30 à 60 s**, dialogué, avec sous-titres
minuscules en bas, dont il sort pour se présenter. Les specs produit s'incrustent
dedans en `--yellow` (`30 SECONDS` + `VIDEO GENERATION` en blanc).

Le talking head lui-même n'est jamais fixe : push-in lent et continu sur toute la
durée du plan.

## Ce qu'il ne faut pas faire

- **Un screencast plein cadre, immobile, sans PIP.** C'est précisément ce que ce
  style remplace.
- **Un `scale()` à la place du push-in 3D.** Sans le redressement du lacet, ça fait
  diaporama.
- **Un mouvement qui se termine.** Si le plan s'immobilise avant la coupe, l'effet
  est mort.
- **Une quatrième couleur saturée.** Jaune, bleu roi, bleu électrique. C'est tout.
- **Le serif ailleurs que sur un chapitre ou un label d'annotation.**
- **Grossir le corps d'un pavé de prompt.** Zoomer dessus, oui. Le grossir, non.
- **Mélanger les deux scènes** (bleu roi et charbon) dans un même plan.

## Adapter à la charte l'utilisateur

Le style se transpose presque tel quel :

| Token | Dan Kieft | L'utilisateur |
| --- | --- | --- |
| `--yellow` | `#FFE930` | `#8E16FA` — un seul accent à remplacer, substitution directe |
| `--font-serif` | Instrument Serif | Instrument Serif italic — **déjà la police maison** |
| `--font-display` | Inter Tight | Garet (espacement −50, condensé) |
| `--royal` | `#002085` | à trancher : garder le bleu roi, ou passer la scène graphique en nuit profond + violet |

La discipline à conserver quoi qu'il arrive : les écrans vivent en 3D et dérivent en
permanence, une seule couleur d'accent, le serif réservé aux chapitres, et le
surligneur qui avance au rythme de la parole.

## État — ce qui est construit, ce qui reste

**Construit et vérifié au navigateur :**

- `custom/screen-3d-push` — le push-in 3D
- `custom/screen-zoom-region` — le zoom sur zone + cadre + label
- `t1-prompt-highlight` — le pavé de prompt à surlignage progressif

Les trois sont aussi portés sur la charte l'utilisateur dans `10-marc`
(`cx-screen-push3d`, `cx-screen-punch`, `cx-text-marker`) — c'est cette
version-là qu'on utilise en production.

**Backlog** (patterns identifiés dans les références, pas encore construits) :
- `t1-chapter-serif` — le carton de chapitre serif plein cadre (`✳ Production`)
- `t1-section-segment` — pastille `SEGMENT 6` + payoff `SMART EDITING`
- `t1-two-paths` — deux pastilles italiques + chiffre fantôme en filigrane + flèches
- `t1-grid-badge` — grille de vignettes avec badge `30 sec`
- `t2-pip-ring` — le médaillon PIP cerclé
- `t2-spec-inline` — chiffre jaune + label blanc incrusté sur b-roll
- `custom/thumb-strip` — le ruban de vignettes sur ruban de lumière bleue
  (réf `duo-cartes-pilule.png`)
