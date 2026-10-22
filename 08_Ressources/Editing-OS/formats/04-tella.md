# Format 04 · Tella

> « Mon écran à gauche, moi à droite en vertical, et au-dessus on voit où on en est dans la vidéo. »
> Format de la vidéo longue YouTube (16:9). Créé le 2026-10-07 à la demande de l'utilisateur, d'après la mise en page d'un créateur qu'il aime, aux couleurs de la charte de marque.
> Scaffold : `style-templates/yt-04-tella/`.

Ce n'est pas un reel : les règles 9:16 du README (zones Instagram, densité d'un changement par seconde) ne s'appliquent pas. Le reste de la colonne vertébrale tient : rien sur le visage, zéro frame morte, la parole finit avec la vidéo, master à −14 LUFS.

---

## Le cadre (1920 × 1080, 30 fps)

```
 ┌───────────────────────────────────────────────┬────────────┐
 │ ● ● ●       formation-en-intelligence-...      │ LE SUJET   │
 │                                               │ Titre      │
 │                                               │ 1 Chap.    │
 │          PARTAGE D'ÉCRAN (16:10)              │▌2 Chap.  ▐ │  ← pastille violette
 │          1488 × 930                           │ 3 Chap.    │
 │                                               ├────────────┤
 │                                               │            │
 │                                               │    CAM     │
 │                                               │ verticale  │
 │                                               │  344×654   │
 └───────────────────────────────────────────────┴────────────┘
```

| Élément | Valeur |
|---|---|
| Marges | 32 px à gauche et à droite, colonnes centrées verticalement (haut à 53 px) |
| Fenêtre écran | 1488 × 974 (barre de 44 px avec les 3 pastilles + contenu 1488 × 930, 16:10), rayon 28 px |
| Colonne de droite | 344 px de large, 24 px après la fenêtre écran |
| Panneau chapitres | 344 × 300 : petit label en JetBrains Mono lavande, titre en Outfit 800, 4 lignes visibles |
| Cam | 344 × 654 (~9:17), bas aligné sur la fenêtre écran, `object-position: 50% 30%` |
| Fond | charte de marque : `#06060C`, grille violette 60 px, 3 aurores violettes qui dérivent |
| Verre | dégradé blanc 13 → 4 %, `backdrop-filter: blur(26px) saturate(180%)`, liseré lavande, reflet en haut à gauche, ombre portée profonde |

Toutes les valeurs vivent dans `tokens-formats.css`, section FORMAT 04.

## Ce qui bouge

- **Les chapitres.** À chaque début de chapitre, la pastille violette glisse sur la ligne en cours (0,5 s, expo.inOut), la ligne s'allume en blanc, un reflet traverse le panneau. Une barre blanche avance dans la pastille pendant tout le chapitre : c'est l'entretien qui évite le panneau figé. Au-delà de 4 chapitres, la liste défile pour garder le chapitre en cours visible.
- **L'entrée.** Fenêtre, panneau et cam arrivent en 0,6 s, décalés de 0,1 s, avec un reflet sur la fenêtre et la cam.
- **Le fond.** Les aurores dérivent lentement sur toute la durée.

## Les chapitres : c'est Claude qui les fait

Décision de l'utilisateur (2026-10-08) : L'utilisateur ne fournit pas la liste des chapitres. Claude la construit lui-même à partir du transcript, une fois le montage parole terminé :
- lire tout le transcript monté et repérer les vrais changements de sujet (nouvelle étape, nouvel outil, nouvelle question), pas un découpage au chronomètre ;
- 3 à 8 chapitres selon la durée, aucun de moins de 45 s ;
- un intitulé court, concret et dans la voix de l'utilisateur (22 caractères maximum, pas de titre générique comme « Introduction » ou « Conclusion ») ;
- le début de chaque chapitre calé 0,2 à 0,6 s avant la phrase qui l'ouvre ;
- `SUJET` et `TITRE` du panneau proposés aussi ;
- montrer la liste à l'utilisateur (timecode + intitulé) avant le rendu, et réutiliser la même liste pour les chapitres de la description YouTube (`00:00 Intitulé`).

## Comment s'en servir

1. Copier le scaffold dans un projet daté : `cp -R style-templates/yt-04-tella video-projects/AA-MM-JJ-<sujet>` puis mettre à jour `meta.json`.
2. Remplacer `assets/ecran.mp4` (l'enregistrement d'écran), `assets/cam.mp4` (la cam) et `assets/voix.m4a` (le son de la cam). Les deux vidéos doivent être synchronisées sur le même départ.
3. Dans `index.html`, section 1 : `BARRE` (par défaut `formation-en-intelligence-artificielle.fr/liens`), puis `SUJET`, `TITRE` et `CHAPITRES` que Claude construit lui-même depuis le transcript (voir plus haut).
4. Montage parole comme d'habitude (`cut-silences`, `cut-mistakes`, `verify-cuts`), puis reporter l'EDL dans `SEG` et `CUTS`. Les chapitres suivent tout seuls grâce à `ed()`.
5. Ajuster les `data-duration` des vidéos et de l'audio à la durée montée, puis lint, rendu, vérification.

## Checklist

- [ ] Rien ne recouvre le visage dans la cam (cadrage via `object-position`).
- [ ] Les chapitres ont été construits par Claude depuis le transcript et validés par l'utilisateur.
- [ ] Les intitulés de chapitres tiennent sur une ligne.
- [ ] Le changement de chapitre tombe 0,2 à 0,6 s avant la phrase qui l'annonce.
- [ ] L'écran est lisible : enregistrer en 16:10, zoom navigateur à 125 % si besoin.
- [ ] Master à −14 LUFS / −1 dBTP.

## Les déclinaisons verticales

Une vidéo longue donne plusieurs reels : on les découpe ensuite avec les formats 01 à 03, à partir des mêmes rushes.
