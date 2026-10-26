# Ce qui a été remplacé

## `editeur-maison.js` — l'éditeur visuel du hub (19/08 → 20/08)

Un éditeur de propriétés maison : scène jouable, timeline à pistes déduites du
rôle des éléments, inspecteur, écriture dans la source.

**Remplacé par le Studio HyperFrames**, qui faisait déjà tout cela en mieux :
images-clés par propriété, rasoir, aimantation, mixeur audio avec formes d'onde
calculées côté serveur, lint, export — et une API d'écriture transactionnelle
qui sauvegarde avant chaque modification et annule le lot en cas d'échec.

Deux trouvailles de cette version méritent de survivre, elles sont documentées
dans le README et le CLAUDE.md :

1. Le moteur, en iframe, **tamponne** de faux `data-start` sur les éléments qui
   n'en ont pas. Les lire invente des clips ; les écrire fait disparaître
   l'élément du début de la vidéo au rendu.
2. Les propriétés CSS `translate` et `scale` sont indépendantes de `transform`,
   donc elles se composent avec l'animation GSAP au lieu de l'écraser. C'est
   d'ailleurs l'astuce qu'utilise le Studio lui-même.
