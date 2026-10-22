# Format 01 · Split carte

> « Moi en bas, tête détourée, je parle, et au-dessus il y a des animations. »
> Références mesurées : [F1a `DbQDB7Go39M`](https://www.instagram.com/reel/DbQDB7Go39M/) (×0,86)
> et [F1b `DZXp0E9IN20`](https://www.instagram.com/reel/DZXp0E9IN20/) (×0,52).
> Implémentation validée : `video-projects/26-08-17-montage-video-par-ia` (v18, relue
> image par image par l'utilisateur).

C'est le format par défaut. Les deux autres sont des cas particuliers ; celui-ci porte
tout ce qui n'est ni une comparaison ni une recette.

---

## Le cadre

```
 0 %  ┌──────────────────────────┐
      │                          │
      │   ZONE ILLUSTRATION      │  fond noir texturé (vagues concentriques),
      │   0 → 50 %               │  cartes / médias / mockups qui s'enchaînent
      │                          │
50 %  ├──────────────────────────┤
      │   sous-titre 50–56 %     │  dans l'interstice, jamais sur un visuel
55 %  │ ····· ligne de tête ···· │  le détourage dépasse ici (8–11 % de hauteur)
      │        ╭──────────╮      │
65 %  │        │  CARTE   │      │  marge latérale 5–7 %, rayon 42 px
      │        │  SPEAKER │      │  vidéo clippée + détourage libre, transforms
      │        ╰──────────╯      │  STRICTEMENT identiques
100 % └──────────────────────────┘
```

**Valeurs canoniques en 1080×1920** (celles du projet v18, seules relues image par image) :

| Élément | Valeur |
|---|---|
| Zone illustration | `top: 0; height: 970px` — rayon bas `0 0 44px 44px` |
| Sous-titre | `top: 985px`, 66 px, poids 900, blanc, `text-shadow 0 3px 8px rgba(0,0,0,.8)` |
| Carte speaker | `left/right: 55px; top: 1250px; bottom: 42px`, rayon `42px` |
| Cadrage dans la carte | `scale(1.28)`, `transform-origin: 50% 100%`, `object-position: 50% 20%` |
| Haut de tête | ~y 1115 — **ne franchit jamais 985 + hauteur du sous-titre** |
| Fond | charte de marque : `#06060C` + grille violette 60 px à 8 % + deux nappes violettes figées (`.reel-bg`) |

### Les trois règles de géométrie qui ont coûté des versions

1. ~~**Split dès la frame 1, jusqu'à la fin.**~~ **Remplacée le 2026-10-19 par l'utilisateur :**
   le reel **commence en face cam plein écran**, puis bascule en split sur un mot précis
   (la vidéo plein écran se rétracte dans la carte, ~0,6 s). Ensuite, **alterner de temps
   en temps** face cam et split (1 à 2 retours en face cam dans le corps) pour créer des
   séquences différentes. Pendant la face cam, sous-titre en bas (top ~1560), jamais sur
   le visage ; pas de punch-in pendant une transition. Le mot de bascule se propose au
   storyboard. Implémentation de référence : `video-projects/26-10-19-adobe` et `26-10-19-design`.
2. **Deux couches, un seul transform.** La vidéo clippée par la carte et le détourage
   non clippé portent le *même* scale/origin à tout instant. Toute divergence dédouble
   l'image — c'est le bug « 4 oreilles » de la v12.
3. **Ligne de tête fixe.** Un punch-in (origin bas) fait monter la tête : il
   s'accompagne **toujours** d'une translation `y` vers le bas qui compense.
   Barème v14 : base `1.28 / y 0`, punch `1.33 / y 50`, zoom `1.43 / y 150`.

## La structure temporelle

| Phase | Part | Ce qui s'y passe |
|---|---|---|
| **Accroche** | 0 → ~3 s | Le problème ou la promesse, en une phrase. La zone haute est déjà pleine et animée à la frame 1. |
| **Corps** | ~3 s → 85 % | Un argument par respiration. Chaque chose nommée est montrée. |
| **CTA** | 85 → 100 % | Carte de fin `soc-cta-ressource` : « Commente MOT-CLÉ pour recevoir [la ressource] », dans la zone haute. |

Durée cible **30 à 60 s**. Cadence de parole mesurée : **210 à 255 mots/min** — c'est
rapide, et c'est volontaire.

## La densité — le chiffre qui décide

**Un changement dans la zone haute toutes les 0,8 à 1,2 s.** Mesuré : F1a change
toutes les 0,77 s (et même exactement toutes les 0,567 s sur ses 14 premières
secondes, au métronome) et fait ×0,86 ; F1b change toutes les 2,77 s et fait ×0,52.

**Seuil dur : jamais plus de 1,5 s sans changement dans la zone haute.**
Un « changement » = une carte qui entre ou sort, un média qui swappe, une comparaison
A/B qui bascule, un compteur qui atteint sa valeur. Un drift ou un shimmer n'en est
pas un — c'est de l'entretien, obligatoire *en plus*.

## Les sous-titres

- Groupes de **1 à 4 mots**, remplacés en bloc, **0,6 à 1,2 s** par groupe.
- Le groupe se coupe sur le sens, pas sur le compte de mots : « hideuses » seul tient
  0,6 s parce que c'est le mot qui porte.
- Blanc, poids 900, 66 px, centré, ombre douce. Mot-clé du CTA en lavande `#A78BFA` (charte de marque).
- **Dans l'interstice noir uniquement.** Jamais sur le visage, jamais sur un visuel.

## Checklist avant envoi

- [ ] Face cam au début, bascule en split sur le mot prévu, 1 à 2 retours en face cam (règle du 2026-10-19)
- [ ] Aucun intervalle > 1,5 s sans changement dans la zone haute
- [ ] Aucun sous-titre qui touche le visage ou un visuel (vérifié sur des images, pas en CSS)
- [ ] Détourage et vidéo au même scale sur toute la timeline (pas de « 4 oreilles »)
- [ ] Chaque punch-in compensé en `y` — la ligne de tête ne bouge pas
- [ ] Dernier mot à ≤ 0,3 s de la fin
- [ ] `node scripts/validate-beat-sync.mjs` → 0
- [ ] `npx hyperframes lint` → propre
- [ ] `python3 tools/autoverify.py renders/<master>.mp4` → PASS complet
- [ ] Master à −14 LUFS / −1 dBTP

## Scaffold

```bash
cp -R style-templates/reel-01-split-carte video-projects/AA-MM-JJ-mon-sujet
```
