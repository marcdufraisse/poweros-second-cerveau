# Nick Saraev — Design Spec

> Source de vérité : les frames dans `references/`, extraites des **10 derniers
> reels** de [instagram.com/nick_saraev](https://www.instagram.com/nick_saraev/)
> (30 juillet → 17 août 2026 : `DcJTgNZv3nW`, `DcEFABnvBuH`, `Db_H8ScP5y-`,
> `Db52rxbPh6i`, `Db3UttuvfwN`, `Db0zoZMPMCV`, `DbyJNRdPyCj`, `Dbvkxq3SAE0`,
> `Dbn6ElTvw_W`, `DblTPmfPCpB`). Couleurs échantillonnées au pixel, cadences
> mesurées par détection de plans. Tout ce qui suit en est dérivé.

**Ce style est fait pour le reel vertical 9:16**, 30 à 57 secondes, la news
d'outil qui claque : « quelqu'un vient de sortir X, voilà ce que ça fait,
commente le mot-clé ». C'est le style **le plus rapide** de la bibliothèque —
presque deux fois la cadence de [Nathan Hodgson](../12-nathan-hodgson/DESIGN.md).

## Le feel

Une galerie blanche, presque vide, où les choses **claquent**. Un mot serif
italique en capitales — `A FREE`, `UNCENSORED`, `EVERY SESSION` — tamponné
plein cadre. Une vraie capture d'écran qui arrive fort, **floutée partout sauf
la zone qui compte**, cerclée d'un trait néon épais. Un petit robot pixel
corail qui sautille entre les plans. Et le visage qui revient une seconde,
détouré sur une plaque arrondie, avant que ça reparte.

Là où Nathan démontre, **Nick assène**. Tout est preuve à charge : la vraie
page GitHub, le vrai compteur d'étoiles, le vrai leaderboard — jamais
redessinés, toujours capturés, zoomés et annotés au néon.

## Les deux scènes

**La galerie blanche** `#FCFCFC` — quasi pure, jamais crème (c'est ce qui la
distingue de Nathan). Parfois une ombre de feuille de palmier très douce dans
un coin. Y flottent : la mascotte, les cartes-props beiges (l'installer, les
icônes d'app), les mots serif noirs.

**La scène noire** `#0A0A0C` — plein cadre, pour les captures sombres et les
mots serif blancs seuls dans le vide. On passe de l'une à l'autre en coupe
franche, plusieurs fois par reel.

## La palette

| Token | Hex | Rôle |
| --- | --- | --- |
| `--white` | `#FCFCFC` | La galerie. Blanc dur, jamais chaud. |
| `--black` | `#0A0A0C` | La scène noire. |
| `--coral` | `#E27D55` | **La mascotte et le script.** Le seul accent permanent. |
| `--neon-orange` | `#FE850D` | Néon d'annotation n°1 (le plus fréquent). |
| `--neon-lime` | `#D0FC10` | Néon n°2. |
| `--neon-cyan` | `#00C8CC` | Néon n°3. |
| `--neon-red` / `--mark-red` | `#FC4C34` / `#D03C3C` | Néon n°4 + le markup éditorial. |
| `--cream-prop` | `#E5DFD3` | Les cartes-props beiges. |
| `--ink` | `#131313` | Le texte sur blanc. |

**Règle des néons : un seul à l'écran.** La couleur peut changer d'un plan à
l'autre dans le même reel, mais jamais deux cadres néon simultanés.

## La typographie — le contraste EST le style

Trois voix, et le choc entre les deux premières fait tout :

1. **SERIF ITALIQUE EN CAPITALES** (Playfair Display italic 700) — les
   mots-choc, 1 à 3 mots max : `A FREE`, `STRIX`, `AI AGENTS`, `YOUR AI MODEL`,
   `ALL 33`. Tamponnée plein cadre, noire sur blanc, blanche sur noir. Jamais
   une phrase entière — dès que ça se lit comme une phrase, c'est la voix 2.
2. **Géométrique grasse minuscule** (Poppins 700) — les sous-titres courants,
   2 à 4 mots : `a scan`, `fixes to`, `try this`, `for you`. Blanche avec une
   ombre douce quand elle passe sur le visage.
3. **Le script corail** — les liaisons, en italique corail, posées À CHEVAL
   sur l'autre voix : `which gives` au-dessus de `Claude Code`, `comment` en
   script au-dessus de `"Claude"` en gras. C'est la signature de l'outro.

Le mono (JetBrains Mono) n'apparaît que DANS les captures (terminaux, GitHub).

## Les cinq gestes signature

### 1. Le spotlight néon (`cards/social/soc-neon-spotlight.html`)

**LE geste.** Une vraie capture d'écran plein cadre, **floutée** (~14px) et
assombrie, sauf **une zone nette** encadrée d'un trait néon de 8px, arrondi
28px. Le regard n'a aucun choix.

```
1. la capture arrive nette, whip-scale 1.12 → 1.0     0.26s
2. beat — on voit la page entière                      ~0.6s
3. le flou tombe sur tout SAUF la zone + le cadre
   néon se dessine (stroke qui court le périmètre)     0.4s
4. léger zoom continu vers la zone, jamais résolu
```

La zone se décrit en pourcentages (`--rx/--ry/--rw/--rh`), exactement comme le
zoom-région de Dan Kieft — mais ici **pas de label** : le cadre néon suffit.

### 2. Le mot serif tamponné (`cards/tier1/t1-serif-stamp.html`)

Plein cadre, blanc ou noir. Le mot arrive en STAMP : scale 0.94 → 1.0, 0.22s,
sec. Il tient 0.8-1.5s, la coupe tombe. Souvent enchaîné : `A FREE` → capture
→ `UNCENSORED` → capture. C'est ce ping-pong qui fait la cadence.

**Le double-stamp** (calibration Replit, 18/08) : sur un beat long, DEUX mots
serif se succèdent dans le même plan, chacun calé sur son mot parlé
(`ASSETS` → `YOUR LOGO`, `EVERY` → `DESIGN`). Le premier disparaît sec quand
le second claque.

### 3. La mascotte pixel (`cards/social/soc-mascot-pixel.html`)

Le robot corail en pixel-art (~9×8 cellules), qui **sautille** (bob ±4°,
translation sinusoïdale). Il apparaît : seul sur blanc entre deux idées, posé
au-dessus d'une carte-prop, ou à côté du logo d'un outil tiers. C'est le
personnage récurrent qui recoud le reel. Ne jamais le lisser — il est pixel.

### 4. Le markup éditorial (`cards/tier1/t1-editorial-markup.html`)

Pour parler de TEXTE (le reel Humanizer) : trois lignes en serif romaine
centrées, et des **corrections d'éditeur** qui tombent dessus — lavis rouge
derrière la phrase fautive, biffure, pilule rouge à bout de flèche
(`UNNECESSARY INTRO`, `EM DASH`, `FAKE INSIGHT`). Le texte ne bouge pas, les
annotations claquent une par une.

### 5. La plaque visage (`cards/social/soc-face-plate.html`)

Le talking head revient souvent **détouré**, posé sur une plaque arrondie
(`--plate-r: 64px`) blanche cassée ou grise, qui glisse du bas. Une seconde ou
deux, le sous-titre gras par-dessus, et on repart. C'est la respiration entre
deux preuves.

## L'outro — le script à cheval

Pas de carte dédiée : sur le dernier plan (visage plein cadre), deux mots
superposés à la troisième voix : `comment` en script italique blanc, et
`"Claude"` en géométrique très grasse blanche juste dessous, à cheval. Ombre
portée douce. C'est tout — pas de pastille, pas de panneau (l'inverse exact de
la carte violette de Nathan).

## Le rythme, mesuré

| Mesure | Valeur | Note |
| --- | --- | --- |
| Durée | 30–57 s | médiane 42 s |
| Coupes / minute | **26,5** | de 17,4 à 35,5 (`Dbn6ElTvw_W`) |
| Plan médian | **2,1 s** | de 1,1 à 2,7 s |
| Format source | 1080×1920 et 720×1280, 30 fps | |

**Presque deux fois plus rapide que Nathan.** Le style tient parce que chaque
plan ne porte qu'UNE information : un mot, une zone d'écran, un visage. Si un
plan doit en porter deux, on coupe en deux plans.

## Le talking head

Lumière du jour, mur clair, t-shirt délavé, gros micro noir en bas de cadre,
cheveux bouclés. Deux traitements :
- **plein cadre**, très rapproché (le visage occupe 80% de la largeur), le
  sous-titre gras posé sur le menton/micro ;
- **détouré sur plaque** (geste 5), pour les moments « listicle ».

Pas de lumière colorée, pas de setup nocturne — tout est daylight. C'est le
contraste maximal avec Nathan.

## Adapter le style à l'utilisateur

1. `--coral` → le robot pixel passe au violet de marque `#8E16FA` (la mascotte Claude de
   l'utilisateur existe déjà dans le style 10 — la version pixel-art est à générer).
2. Les néons restent multicolores : c'est un système de rotation, pas un
   accent de marque. Ajouter simplement `#8E16FA` à la rotation et le faire
   dominer (comme l'orange domine chez Nick).
3. La serif italique caps → **Instrument Serif italic**, déjà la police maison
   ([[polices-de-marque]]) — la transposition est quasi gratuite.
4. Le script de l'outro → garder une vraie italique serif blanche, ou la
   Caveat déjà présente dans le style 01.

## Ce qu'il ne faut PAS faire

- **Redessiner les interfaces.** Chez Nick, les captures sont VRAIES (étoiles
  GitHub, leaderboards, terminaux). Les redessiner casse l'effet de preuve.
  C'est le geste de Nathan, pas le sien.
- **Deux cadres néon en même temps**, ou un cadre néon + un label. Le cadre
  seul. Le silence autour de la zone nette fait le travail.
- **Écrire une phrase en serif caps.** Trois mots maximum. Au-delà → voix 2.
- **Réchauffer le blanc.** `#FCFCFC`, pas de crème — sinon on glisse vers
  Nathan.
- **Lisser la mascotte.** Elle est pixel-art, elle sautille, elle ne tourne
  pas en 3D.
- **Tenir un plan au-delà de ~3s.** Ce style meurt dans la durée. Si le plan
  doit durer, c'est le mauvais style — prendre Nathan (12) ou l'utilisateur (10).
- **Un fondu, n'importe où.** Tout est coupe franche.
