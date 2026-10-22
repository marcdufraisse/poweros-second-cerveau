# L'utilisateur — Playbook reels

> Le DESIGN.md dit à quoi ressemble le style. Ce fichier dit **comment on
> monte un reel entier**, en fusionnant les deux grammaires capturées le 18/08
> sur les corpus [Nathan Hodgson](../12-nathan-hodgson/PLAYBOOK.md) et
> [Nick Saraev](../13-nick-saraev/PLAYBOOK.md) — sous la charte l'utilisateur
> (jaune `#8E16FA`, navy/crème, Garet + Instrument Serif), qui ne bouge pas.
>
> Ce playbook s'applique au **registre COURT 9:16** (DESIGN.md, « Les deux
> registres »). Le YouTube long reste sur Dan Kieft (11).

## La règle de choix — d'abord, quel type de sujet ?

C'est la découverte structurelle de l'analyse des deux corpus : ce ne sont pas
deux looks, ce sont **deux grammaires pour deux types de sujets**.

| Le reel parle de... | Grammaire | Cadence | La mécanique |
| --- | --- | --- | --- |
| **un WORKFLOW** — « voilà comment je fais X, étape par étape » | Nathan (12) | 15-18 coupes/min, plans 3-6 s | chaque étape devient une séquence d'UI **redessinée qui s'exécute** dans le plan pendant que tu parles |
| **une NEWS** — « X vient de sortir, voilà la preuve » | Nick (13) | 25-30 coupes/min, plans 1-3 s | captures **réelles** en preuve, un plan = une info, cycle NOM → PREUVE → MÉCANISME → BÉNÉFICE |

Le choix se fait à la lecture du script, avant tout montage. Un script peut
mélanger (un hook « news » puis un corps « workflow ») — dans ce cas chaque
segment suit sa grammaire, mais on ne zappe pas de l'une à l'autre par plan.

## Les trois lois (communes aux deux grammaires)

### Loi 1 — Zéro frame morte
À chaque instant du rendu, une de ces trois choses est vraie :
1. quelque chose vient d'**entrer** (< 0,3 s),
2. quelque chose **bouge** (dérive, frappe, compteur, jauge — jamais résolu à la coupe),
3. le **visage parle** à l'écran (2-3 s max d'affilée).

Sinon le plan est mort : le couper, ou lui donner une dérive. Le test se fait
image par image sur le draft — et c'est vérifiable automatiquement (à ajouter
au `autoverify.py` du projet : détecter les fenêtres > 0,5 s sans variation
inter-frames dans la zone graphique).

### Loi 2 — La course aux assets
**Chaque nom propre du script génère une recherche d'assets AVANT le montage**
(c'est le travail d'`insert-broll` : screenshots Playwright, logos Clearbit,
pages GitHub, cache `asset-library/`). Règle de répartition :

- grammaire **news** → captures **réelles** (l'effet de preuve vient de ce
  qu'on reconnaît un vrai site, un vrai compteur d'étoiles) ;
- grammaire **workflow** → UI **redessinées** (une capture Retina réduite à
  1080 est illisible ; on reconstruit en plus grand, plus propre) ; seules les
  pages tierces qu'on commente restent des captures réelles.

Un asset introuvable ne se remplace pas par du texte : page GitHub, à défaut
logo en pop. Il y a toujours quelque chose à montrer.

### Loi 3 — Tout est montré avec une animation
Un asset posé statique n'existe pas. La carte-atelier est
**`soc-media-slam`** : 5 entrées (whip / zoomin / zoomout / pan / pop) + une
dérive continue jusqu'à la coupe. Alterner les variantes — deux `whip` de
suite passent, trois se voient.

## La table parole → plan (avec TES cartes)

| Ce que dit la voix | Plan | Carte 10-marc |
| --- | --- | --- |
| Le hook | titre kinétique ou visage plein cadre | `soc-title-build` / visage |
| Il NOMME un outil | logo ou UI en pop sur la scène | `soc-media-slam` (pop) |
| Un CHIFFRE, un prix, un compteur | la vraie page, cadre jaune sur le chiffre | `soc-spotlight-jaune` |
| Une ÉTAPE de workflow (« dis à Claude de... ») | l'UI redessinée s'exécute : frappe, statuts, badges, compteur | `soc-ui-run` |
| Un MÉCANISME (« il va chercher X ») | la vraie UI en zoom continu | `soc-media-slam` (zoomin) |
| Une COMPARAISON avant/après | l'empilement comparatif | `soc-stack-compare` |
| Un échange chat en direct | la conversation qui se déroule | `soc-chat-live` |
| Transition entre deux idées | la mascotte Claude | `soc-mascot-claude` |
| Preuve sociale (vues, abonnés) | les badges de vues | `soc-view-badges` |
| Le CTA final | **toujours la même carte** : « Commente MOT-CLÉ pour recevoir [la ressource] » | `soc-cta-ressource` |
| En continu | captions karaoké mot à mot, mots-clés en jaune | `soc-captions-karaoke` |

**La discipline du CTA** (mesurée chez Nathan : 10 reels sur 10, la même
carte) : ne plus jamais dévier de `soc-cta-ressource` (charte de marque, 2026-10-01 ;
remplace `soc-cta-comment`). Toujours en français, toujours les trois slots
remplis : le mot-clé en capitales, et le nom concret de la ressource reçue
(« mon guide des 50 prompts », pas « la ressource »). C'est la répétition à
l'identique qui en fait un actif de marque, pas la carte elle-même.

## La recette, étape par étape

1. **Script → beat-map** : choisir la grammaire (règle ci-dessus), puis passer
   le script phrase par phrase avec la table parole→plan. C'est le travail du
   skill `design-beats`, qui lit ce playbook.
   - grammaire news : viser 25-30 plans/minute, structure en cycles
     NOM → PREUVE → MÉCANISME → BÉNÉFICE (~10 s et 4-6 plans par idée) ;
   - grammaire workflow : viser 15-18 plans/minute, une séquence d'exécution
     par étape, le chiffre du hook qui revient en payoff avant le CTA.
2. **Course aux assets** : `insert-broll` pour tout ce que la beat-map demande.
3. **Fabriquer les UI** (workflow seulement) : dupliquer `soc-ui-run` et
   remplir ses slots par étape.
4. **Assembler** : coupes franches, alterner scènes (navy/crème) et variantes
   d'entrée. Captions karaoké en overlay continu.
5. **QC** : la loi 1 image par image sur le draft, puis `autoverify.py`
   (PROCESS.md), puis la boucle de review habituelle.

## Ce qu'il ne faut PAS faire

- **Importer les palettes des deux styles.** L'orange de Nathan, les néons de
  Nick, le violet du CTA : tout passe au jaune `#8E16FA` et aux scènes
  navy/crème. On importe la grammaire, jamais le look.
- **Mélanger les deux annotations.** Le spotlight jaune (zone nette sur flou)
  et la sélection de texte navigateur (grammaire Nathan) sont deux gestes
  distincts — un seul par reel.
- **Couper une exécution avant sa fin** (workflow) : une frappe ou un compteur
  interrompu est un plan raté.
- **Tenir un plan > 3 s sans exécution visible** (news) : si le plan doit
  durer, c'est la mauvaise grammaire.
- **Un fondu.** Tout est coupe franche, dans les deux grammaires.
