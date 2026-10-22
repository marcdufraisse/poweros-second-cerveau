# Nathan Hodgson — Design Spec

> Source de vérité : les frames dans `references/`, extraites des **10 derniers
> reels** de [instagram.com/nathanhodgson.ai](https://www.instagram.com/nathanhodgson.ai/)
> (3 → 17 août 2026 : `DcJ0T19xsFx`, `DcHRrxNReQv`, `DcEfmJeutHp`, `DcCSsqsxGW8`,
> `Db_uV82x_2_`, `Db80jdBxmNc`, `Db6G_VhO8lh`, `Db3dRm9s1yg`, `Db1Ba0iu5fy`,
> `Dbydve0OqNc`). Couleurs échantillonnées au pixel, cadences mesurées par
> détection de plans. Tout ce qui suit en est dérivé.

**Ce style est fait pour le reel vertical 9:16**, 35 à 55 secondes, un seul
sujet : « voilà un outil, voilà ce qu'il fait, commente le mot-clé ». C'est le
format le plus proche de ce que l'utilisateur produit déjà — et c'est le complément
court de [Dan Kieft](../11-dankieft/DESIGN.md), qui couvre le YouTube long.

## Le feel

Un mec qui parle dans une pièce chaude, et **au-dessus de sa tête, le logiciel
tourne tout seul**. Pas une capture d'écran collée : une interface *redessinée*,
propre, lisible à 1080 de large, qui tape sa propre requête, coche ses propres
statuts, remplit sa propre jauge. Le spectateur regarde une démo qui se joue
pendant qu'on lui explique.

Le style ne cherche jamais l'effet. Il cherche la **preuve**. Tout ce qui bouge
à l'écran raconte que la chose marche.

## L'architecture du cadre — le sandwich

C'est la règle structurelle du style, présente dans les 10 reels :

```
 0%   ┌────────────────────────┐
      │   ZONE GRAPHIQUE        │   scène crème, UI rejouée, ou capture réelle
      │                         │
~52%  ├─────────────────────────┤   ← ARÊTE FRANCHE, jamais un fondu
      │   [ mot ]               │   ← la pastille de sous-titre s'y pose
      │   TALKING HEAD          │
      │                         │
100%  └─────────────────────────┘
```

L'arête bouge entre **44% et 60%** selon la hauteur de l'asset, jamais au-delà.
Elle est **franche** : deux images superposées, pas de dégradé, pas d'ombre
portée entre les deux. Quand le graphique est plein cadre (carte de titre,
document zoomé, carte de fin), le visage disparaît complètement — mais il
revient toujours dans les 2 à 3 secondes.

## Les deux scènes

**La scène crème** porte tout ce qui est construit. Elle n'est **jamais un
aplat** : dégradé chaud `#F1E7DC` → `#E0CABB` du haut vers le bas, plus des
rectangles arrondis flous, à peine plus clairs que le fond, qui dérivent très
lentement derrière. C'est ce bruit doux qui fait que la scène ne ressemble pas
à une slide PowerPoint.

**La scène sombre** `#25201F` porte les interfaces. Elle n'apparaît jamais en
plein cadre nu : toujours sous forme de **carte arrondie** (`--r-panel: 34px`)
avec une ombre chaude, posée sur la scène crème. L'app est un objet dans la
pièce, pas un fond.

## La palette

Un seul accent. Deux statuts. Rien d'autre.

| Token | Hex | Rôle |
| --- | --- | --- |
| `--orange` | `#E88050` | **L'accent unique.** Chiffres, filet de titre, playhead, jauges, `↑ 0 KB`, l'astérisque Claude. |
| `--orange-deep` / `--orange-lit` | `#C86038` / `#F8A078` | Les deux extrémités du **filet dégradé** sous chaque titre. |
| `--cream` / `--cream-deep` | `#F1E7DC` / `#E0CABB` | La scène claire, en dégradé haut→bas. |
| `--panel` | `#25201F` | Le corps d'une app redessinée. Brun-noir, jamais bleu. |
| `--ink` | `#1F140E` | Les titres. Brun très sombre, **jamais `#000`**. |
| `--green` | `#489860` | Statut « fait » : `✓ APPLIED`. Le seul vert. |
| `--blue` | `#0068B8` | Les logos tiers uniquement (LinkedIn, Chrome, Google). |
| `--select` | `#2D5ECB` | La sélection de texte du navigateur. **C'est son surligneur.** |
| `--violet` … | `#100038` → `#4D1289` | La carte de fin. Nulle part ailleurs. |

> Note pour l'utilisateur : le style se transpose sur le violet de marque `#8E16FA` sans casser,
> parce qu'il n'y a **qu'un** accent à remplacer — voir « Adapter » plus bas.

## La typographie

Deux voix, et une seule sert de titre.

- **Titre de section** — grotesque lourde, CAPITALES, **très serrée**
  (`letter-spacing: -0.035em`). C'est le seul endroit où le texte est énorme.
  `HANDS OFF`, `BIG DECISIONS`, `5 ADVISORS`, `10 INTERVIEWS`. Substitut libre :
  Inter Tight 900. **Quand le titre contient un nombre, le nombre est orange et
  il compte.** `0 INTERVIEWS` devient `10 INTERVIEWS` sous les yeux.
- **Tout le reste** — une géométrique (Poppins). Les labels d'UI, les corps de
  carte, et surtout **les sous-titres**. C'est elle qui donne l'air « produit ».
- **Mono** (JetBrains Mono) — valeurs, compteurs, chemins, statuts :
  `frame 0650 / 1800 · on-device`, `$0.42`, `85% MATCH`. Jamais une phrase.

Aucune serif dans le style. Celles qu'on voit (`Verdict`, `The Chairman`)
appartiennent au **document filmé à l'écran**, pas au graphisme.

## Les quatre gestes signature

### 1. Le titre au filet dégradé (`cards/tier1/t1-title-rule.html`)

Astérisque orange (le sparkle Claude) centré, petit. Sous lui le titre en caps
serrées. Sous le titre un **filet arrondi de 7px, en dégradé orange foncé →
orange clair, large de 43% du cadre**, qui se dessine de gauche à droite en
0.32s. C'est le tampon du style : il est là dans tous les reels, toujours
identique.

### 2. L'UI rejouée qui s'exécute (`cards/tier1/t1-ui-run.html`)

**Le cœur du style, et ce que les gens ratent en essayant de le copier.**
Ce n'est pas une capture d'écran : c'est l'interface redessinée en HTML, à la
bonne taille pour un téléphone, et qui **joue une séquence** :

```
1. la bulle de prompt arrive à droite            pop, 0.32s
2. la requête se tape caractère par caractère    45ms/car, curseur clignotant
3. une ligne de statut apparaît                  « Opening browser ✓ »
4. les lignes de résultat tombent une par une    stagger 0.18s
5. les badges basculent                          85% MATCH → ✓ APPLIED
6. le compteur monte et la jauge se remplit      APPLIED 99 / 100, linéaire
```

Rien n'est « présenté ». Tout **arrive**, dans l'ordre où il arriverait
vraiment. Le compteur est linéaire (`ease: none`) : c'est une machine, pas une
animation. La composer bar de Claude reste en bas, inerte, comme preuve du
contexte.

### 3. Les lignes de specs (`cards/tier2/t2-spec-rows.html`)

Trois cartes blanches empilées, arrondi 22px, ombre douce. Chacune : une
pastille d'icône carrée à gauche, un label gras, un sous-label gris, et **une
valeur en mono alignée à droite**. Elles arrivent une par une, du bas, 0.18s
d'écart. C'est la carte « voilà pourquoi c'est mieux » — jamais plus de trois
lignes, jamais une phrase dans la valeur.

### 4. La sélection de texte comme surligneur (`cards/social/soc-doc-select.html`)

Quand il montre un vrai document ou une vraie page, il **zoome à 200-300%** et
**sélectionne la phrase à la souris**. Le bloc bleu `#2D5ECB` balaie le texte de
gauche à droite pendant qu'il le dit. Pas de cadre dessiné, pas de flèche : la
sélection native du navigateur *est* l'annotation.

C'est l'inverse exact du geste de [Nick Saraev](../13-nick-saraev/DESIGN.md),
qui encadre une zone en néon. Ne pas mélanger les deux.

## Les sous-titres

Un mot à la fois, dans une **pastille grise translucide** `rgba(37,27,21,0.56)`,
arrondi 14px, texte blanc gras en géométrique. Centrée. Elle se pose sous
l'arête du sandwich, autour de 56% de hauteur — **jamais sur la bouche**.

Le mot change à l'onset exact du mot parlé, avec un micro-pop (scale 0.86 → 1,
0.16s). Les mots sont ceux réellement prononcés, en minuscules, ponctuation
comprise quand elle existe.

## La carte de fin — la règle absolue

**10 reels sur 10 se terminent par la même carte**, mesurée : un violet occupant
21 à 28% du haut du cadre, 2 à 3 secondes avant la fin.

```
dégradé violet #280850 → #100038, lueur #4D1289 en haut à droite
« Comment » en géométrique blanche, ~92px
une pastille blanche pleine hauteur 90px :  [IG] Mot-clé            [partage]
puis l'arête, et le visage en dessous
```

Le mot-clé est en **poids normal**, pas gras — c'est la seule typo non grasse du
style. Elle imite un champ de commentaire Instagram réel.

## Le rythme, mesuré

| Mesure | Valeur | Note |
| --- | --- | --- |
| Durée | 34–54 s | médiane 44 s |
| Coupes / minute | **16,9** | de 11,4 (Db_uV82x_2_) à 22,3 (Db80jdBxmNc) |
| Plan médian | **3,0 s** | de 2,3 à 5,1 s |
| Format source | 1080×1920, 25–30 fps | |
| Carte de fin | 10/10 | à −1 à −3 s |

**Deux fois plus lent que Nick Saraev.** C'est cohérent : chaque plan doit tenir
le temps qu'une séquence d'UI se joue. Ne pas accélérer ce style — les coupes
rapides détruisent la démonstration.

## Le talking head

Deux setups, alternés d'un reel à l'autre, jamais dans le même :

- **Sombre** — t-shirt noir, pièce sombre, une lampe violette côté gauche et une
  ambre côté droit, gros micro sur pied dans le bas du cadre.
- **Crème** — pull écru, salon lumineux, lampe violette au fond, plante, canapé.

Dans les deux cas : cadre poitrine, visage centré, yeux au tiers haut,
profondeur de champ courte. La lumière est **toujours violette + ambre** — c'est
ce qui relie visuellement les deux setups au violet de la carte de fin.

## Adapter le style à l'utilisateur

Le style ne tient que sur **un accent unique**. La transposition est donc
mécanique :

1. `--orange` → `#8E16FA` (violet de marque), `--orange-deep` / `--orange-lit` →
   `#733FC6` / `#A97BF0` pour garder le filet dégradé.
2. `--ink` reste un violet-noir, pas du noir pur : `#170B30` sur fond rose pâle.
3. La carte de fin : garder la structure exacte (mot « Commente », pastille
   blanche, glyphe IG), remplacer le violet de la carte par le nuit profond
   `#0A0718` du style [l'utilisateur](../10-marc/DESIGN.md), lueur violette en haut à droite.
4. La géométrique reste. C'est elle qui porte le côté produit.

Ne pas transposer : les deux statuts vert/bleu (ils appartiennent aux UI
rejouées, ils sont vrais), et la sélection bleue du navigateur (c'est une
couleur système).

## Ce qu'il ne faut PAS faire

- **Coller une capture d'écran brute** dans la zone haute. Le style entier
  repose sur le fait que l'UI est redessinée, propre et lisible à 1080 de large.
  Une capture Retina réduite est illisible et casse tout.
- **Faire un dégradé à l'arête du sandwich.** Elle est franche. Toujours.
- **Aplatir la scène crème.** Sans le dégradé et les blocs flous qui dérivent,
  c'est une slide.
- **Ajouter une deuxième couleur d'accent.** Il y en a une. Le vert et le bleu
  ne sont pas des accents, ce sont des statuts d'interface.
- **Mettre le sous-titre sur la bouche.** Il vit sous l'arête.
- **Écrire une phrase en mono.** Le mono, c'est des valeurs et des compteurs.
- **Terminer sans la carte violette.** C'est le seul élément 10/10 du corpus.
- **Emprunter le geste de Nick** (cadre néon sur zone floutée). Les deux styles
  annotent différemment, et c'est précisément ce qui les distingue.
