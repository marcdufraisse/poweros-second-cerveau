# Nick Saraev — Playbook de montage

> Le DESIGN.md dit à quoi ça ressemble. Ce fichier dit **comment on fabrique un
> reel entier** dans ce style, de A à Z. La preuve à l'appui : le reel
> « 5 plugins » (`Dbn6ElTvw_W`, 492k vues) décomposé plan par plan en bas de page.

Ce qui rend son montage bon tient en trois lois, dans cet ordre :

1. **La cadence** — pas une frame où il ne se passe rien.
2. **Les assets viennent du web** — quand il parle d'un outil, on VOIT l'outil :
   son site, son GitHub, son UI, son logo. Jamais du texte à la place d'une preuve.
3. **Chaque élément est montré avec une animation** — zoom in, zoom out, whip,
   pop. Un asset posé statique n'existe pas dans ce style.

---

## Loi 1 — La cadence : zéro frame morte

Trois mécanismes se superposent pour qu'il se passe toujours quelque chose :

| Mécanisme | Règle |
| --- | --- |
| **La coupe** | un plan = UNE information. 1 à 3 s. Plan médian mesuré : 2,1 s. Si une phrase contient deux idées, elle a deux plans. |
| **L'entrée** | tout ce qui apparaît a une entrée animée de 0,2-0,3 s (whip, stamp, pop). Rien ne « est déjà là » au début d'un plan, sauf le visage. |
| **Le mouvement continu** | après l'entrée, l'élément DÉRIVE (zoom lent, pan, bob) jusqu'à la coupe. La coupe tombe pendant le mouvement, jamais après. |

**Le test QC final** : faire défiler le rendu image par image. À chaque instant,
une de ces trois choses doit être vraie : quelque chose vient d'entrer (< 0,3 s),
quelque chose bouge, ou on est sur le visage qui parle (max 2-3 s d'affilée).
Sinon, le plan est mort → le couper ou lui donner une dérive.

Cadence cible : **25-30 coupes/minute**. En pratique : sur un script de 55 s,
viser 25-30 plans.

## Loi 2 — Les assets viennent du web

**Chaque nom propre du script génère une course aux assets.** Pour chaque outil
mentionné, récupérer AVANT le montage (c'est le travail d'`insert-broll`, qui
sait déjà faire tout ça et met en cache dans `asset-library/`) :

| Asset | Source | Usage type |
| --- | --- | --- |
| Screenshot du site / landing | Playwright local (`insert-broll`) | media-slam `whip` ou `pan` |
| Page GitHub (README, étoiles) | Playwright sur github.com | spotlight néon sur le compteur d'étoiles |
| L'UI du produit | screenshots du site, docs, ou captures d'écran de démos | spotlight néon sur LA zone dont on parle |
| Logo | Clearbit / Simple Icons (`insert-broll`) | media-slam `pop` (fit contain) |
| Leaderboard / benchmark | Playwright sur la page réelle | spotlight néon sur la ligne n°1 |

Règle d'or : **les captures sont vraies**. On ne redessine pas (ça, c'est le
geste de Nathan Hodgson, style 12). L'effet de preuve vient de ce qu'on
reconnaît un vrai site, un vrai terminal, un vrai compteur GitHub.

Une capture haute (landing page entière) se montre en `pan` ou se découpe en
2-3 plans distincts (hero → features → pricing) plutôt qu'en un seul plan long.

## Loi 3 — Tout est montré avec une animation

La carte-atelier est **`soc-media-slam`** : elle prend n'importe quel asset et
applique une des cinq entrées + la dérive continue. C'est elle qu'on utilise
par défaut pour tout ce que la course aux assets a rapporté.

| Variante | Quand |
| --- | --- |
| `whip` | le défaut — l'asset claque, puis zoom-in lent |
| `zoomin` | montrer la page entière PUIS serrer vers ce qui compte |
| `zoomout` | partir du détail (un chiffre, un bouton) et révéler le contexte |
| `pan` | les pages hautes, les listes |
| `pop` | les logos et petites cartes, posés sur la scène avec ombre |

**Alterner les variantes.** Deux `whip` de suite passent ; trois, ça se voit.
Le spotlight néon (`soc-neon-spotlight`) est la version « annotée » du même
geste : on le réserve aux 1-2 moments par reel où il faut pointer UNE zone
précise (le chiffre, le bouton, la ligne du leaderboard).

---

## La recette, étape par étape

### 1. Le script → la beat-map

Passer le script phrase par phrase et attribuer un type de plan avec cette
table de correspondance :

| Ce que dit la voix | Plan | Carte |
| --- | --- | --- |
| Le hook (« Don't use X unless... ») | prop ou visage plein cadre | `soc-media-slam` pop / visage |
| Il NOMME un outil | le nom à l'écran : logo pop, prop beige + mascotte, ou mot serif | `soc-media-slam` pop / `t1-serif-stamp` |
| Il donne un CHIFFRE (« 200 providers », « 76k stars ») | la vraie page, néon sur le chiffre | `soc-neon-spotlight` |
| Il décrit un MÉCANISME (« it switches models ») | la vraie UI en zoom, ou mock minimal | `soc-media-slam` zoomin |
| Il donne le BÉNÉFICE (« same results, fewer tokens ») | mot-choc serif plein cadre | `t1-serif-stamp` |
| Transition entre deux idées | mascotte qui sautille, 1 s | `soc-mascot-pixel` |
| Respiration (« so », « and honestly ») | visage détouré sur plaque | `soc-face-plate` |
| Il parle de TEXTE / d'écriture | le markup éditorial | `t1-editorial-markup` |
| Le CTA final | script à cheval sur le visage | `soc-cta-script` |

Structure type pour un « listicle » (N outils) — chaque segment de ~8-11 s suit
le même cycle : **NOM → PREUVE → MÉCANISME → BÉNÉFICE**, puis respiration visage
ou mascotte avant le segment suivant.

### 2. La course aux assets

Pour chaque ligne de la beat-map qui demande une preuve : invoquer
`insert-broll` (screenshots Playwright, logos Clearbit, cache asset-library).
Un asset introuvable ne se remplace PAS par du texte : on prend la page GitHub,
ou à défaut le logo en pop. Il y a toujours quelque chose à montrer.

### 3. L'assemblage

Une composition par plan, enchaînées en coupes franches. Alterner les scènes
(blanc / noir) et les variantes d'entrée. Les sous-titres gras minuscules
(voix 2) courent par-dessus en overlay séparé, calés sur le transcript.

### 4. Le QC cadence

Le test des trois vérités (Loi 1) sur le rendu draft, puis `autoverify.py`
comme pour tout reel (PROCESS.md).

---

## La preuve : « 5 plugins » décomposé (Dbn6ElTvw_W, 57 s, 34 coupes, 492k vues)

Transcription word-level + détection de plans alignées :

| t | Voix | À l'écran | Geste |
| --- | --- | --- | --- |
| 0,0–1,2 | « Don't use Claude Code unless... » | carte beige « Claude Code Plugin Installer » + jauge | prop pop |
| 1,2–3,2 | « ...installed these five plugins » | « 1 2 3 4 5 » flèches au-dessus d'une icône pixel | compteur animé |
| 3,2–4,6 | « The first is OmniRoute » | terminal noir, ASCII infini corail | media whip (noir) |
| 4,6–6,9 | « gives Claude Code almost unlimited usage » | script corail « which gives Claude Code » à cheval | script overlap |
| 6,9–9,9 | « 200 free AI API providers » | **vraie page** « 251 AI Providers », cadre néon orange sur la grille | spotlight néon |
| 9,9–13,5 | « the moment your limit runs out, it switches » | mock « Switching model... » avec la carte Kimi qui s'allume | UI zoomin |
| 13,5–16,9 | « 1.6 billion free tokens every month » | visage + sous-titre gras | respiration |
| 16,9–22,8 | « ClaudeMem... memory across every session » | « EVERY SESSION » serif blanc sur noir → **vrai README GitHub** claude-mem | stamp → media whip |
| 23,9–31,2 | « Headroom... only passes what matters » | badge LED « HEADROOM » + robot pixel → terminal réel, « UNNECESSARY » serif | pop → spotlight → stamp |
| 33,6–43,1 | « ClaudeCodeSetup... scans your codebase » | « THE FOURTH » serif sur icône pixel → **vrai /context terminal** → « MCP » serif + UI | stamp → media → stamp |
| 45,6–53,2 | « TaskObserver... learns your style » | capture sombre agent-prompt → cartes checklist beiges + mascotte | media → props |
| 53,2–57,4 | « comment Claude down below » | visage plein cadre + « *comment* "Claude" » | cta script |

À retenir de cette décomposition : **chaque outil suit le cycle
NOM → PREUVE → MÉCANISME → BÉNÉFICE en ~10 s et 4-6 plans**, les vraies captures
portent les chiffres, les mots serif portent les bénéfices, et il n'y a pas un
seul plan sans entrée animée ni dérive.
