# Format 02 · Avant/après

> « Format comparaison avant après. »
> Références mesurées : [F2b `DZS0GnEoeps`](https://www.instagram.com/reel/DZS0GnEoeps/)
> (×1,00, la version pure) et [F2a `Dba-jOyIbom`](https://www.instagram.com/reel/Dba-jOyIbom/)
> (×0,71, la version collab avec vente en fin).

Le format des sorties d'outil. Il ne raconte rien : il **montre la même prise avant et
après**, en simultané, et laisse l'écart faire le travail. C'est le seul des trois où
L'utilisateur n'est pas monteur mais cobaye — il est *dans* les deux volets, pas à côté.

## Le cadre

```
 0 %  ┌──────────────────────────┐
      │  BANDEAU TITRE           │  noir plein, 2 lignes, blanc gras + emoji
18 %  ├──────────────────────────┤
      │  étiquette « Après »     │  blanc gras ~28 px, centrée, sur le noir
21 %  ├──────────────────────────┤
      │  VOLET A — transformé    │  crop 16:9 de la prise, pleine largeur
53 %  ├──────────────────────────┤
      │  étiquette « Originale » │
58 %  ├──────────────────────────┤
      │  VOLET B — original      │  crop 16:9, MÊME hauteur au pixel près
90 %  ├──────────────────────────┤
      │  noir de pied            │  laissé vide pour l'UI Instagram
100 % └──────────────────────────┘
```

**Valeurs canoniques en 1080×1920** (converties depuis F2b mesuré au pixel) :

| Élément | Valeur |
|---|---|
| Bandeau titre | `0 → 354px` — L1 66 px poids 800, L2 54 px poids 700, blanc, centré |
| Étiquette volet A | baseline ~`y 366` — 42 px, poids 800, blanc |
| Volet A | `y 399 → 1008` (609 px = 1080×9/16), pleine largeur |
| Étiquette volet B | baseline ~`y 1073` |
| Volet B | `y 1110 → 1719` — **hauteur identique à A, au pixel** |
| Noir de pied | `y 1719 → 1920` (10,5 %) — reste vide |
| Fond | noir plein `#000` (pas de texture ici : les deux volets portent tout) |

### Les règles non négociables

1. **Les deux volets sont la même prise, au même instant.** Pas un rush voisin, pas un
   plan approchant : la même seconde, cadrée pareil. Toute la crédibilité tient là.
2. **Hauteurs strictement égales.** Un volet plus grand que l'autre suggère lequel est
   « le bon » et casse la démonstration.
3. **Ordre : transformé EN HAUT, original EN BAS.** Le pouce s'arrête sur le haut de
   l'écran. La version qui étonne y va.
4. **Le bandeau titre ne bouge pas de la vidéo entière.** C'est le seul texte permanent
   du format ; il porte le hook parce que ce format n'a pas de sous-titres pour le porter.
5. **Le noir de pied reste vide.** Rien d'important sous 90 %.

### Étiquettes : centrées au-dessus, pas dans le volet

F2a les met en bas à gauche *à l'intérieur* de chaque volet, F2b centrées au-dessus,
sur le noir. **La spec retient F2b** : dans le volet, l'étiquette recouvre l'image au
moment précis où on demande au spectateur de la comparer, et elle change de lisibilité
selon le fond. Sur le noir, elle est toujours lisible et ne coûte rien.

## La structure temporelle

| Phase | Part | Ce qui s'y passe |
|---|---|---|
| **Démo** | 0 → 60–100 % | Les deux volets tournent. Une transformation nouvelle toutes les ~4 s (saison, vêtement, décor, disparition, animal…). Voix off, pas de sous-titres. |
| **Vente** *(optionnelle)* | 60 → 90 % | Bascule en split carte (format 01) : comment on fait, l'offre. |
| **CTA** | 90 → 100 % | Carte de fin `soc-cta-ressource` (Commente MOT-CLÉ pour recevoir…), mot-clé en lavande `#A78BFA`. |

Durée cible **35 à 55 s**. Cadence **209 à 227 mots/min** — un peu plus lent que le
format 01 : il faut laisser le temps de comparer.

**Deux variantes, les deux légitimes :**
- **Pure** (F2b, 35,8 s, ×1,00) — l'empilement du début à la fin, CTA en surimpression
  sur le volet A dans les 2 dernières secondes. C'est la version la plus propre.
- **Collab** (F2a, 55,1 s, ×0,71) — 38 s d'empilement, puis bascule en split carte pour
  le tuto + l'offre partenaire. À réserver aux collabs : la bascule coûte de la
  rétention, et c'est la variante la moins performante du panel.

## La démo — ce qui la rend regardable

- **Une transformation par idée, ~4 s chacune.** Saison, oiseaux, disparition, singe,
  vêtements, décor, angle de caméra. Chaque nouvelle est plus improbable que la
  précédente.
- **Il continue de parler et de bouger dans les deux volets.** Une comparaison sur un
  plan fixe ne prouve rien : c'est le mouvement identique des deux côtés qui prouve
  que c'est la même prise.
- **Pas de sous-titres pendant la démo.** L'œil compare, il ne lit pas. Le bandeau
  titre porte le message.

## Checklist avant envoi

- [ ] Les deux volets sont la même prise, au même timecode (vérifié sur images)
- [ ] Hauteurs des volets identiques au pixel
- [ ] Transformé en haut, original en bas
- [ ] Bandeau titre présent frame 1 → dernière frame, jamais recouvert
- [ ] Rien sous 90 % de la hauteur
- [ ] Une transformation nouvelle au moins toutes les 5 s
- [ ] Aucun sous-titre pendant la démo
- [ ] Dernier mot à ≤ 0,3 s de la fin
- [ ] `npx hyperframes lint` → propre
- [ ] Master à −14 LUFS / −1 dBTP, `autoverify` PASS

## Scaffold

```bash
cp -R style-templates/reel-02-avant-apres video-projects/AA-MM-JJ-mon-sujet
```
