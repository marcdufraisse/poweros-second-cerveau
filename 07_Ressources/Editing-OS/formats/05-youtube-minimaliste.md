# Format 05 · YouTube minimaliste

> « Un ciel de nuit violet, ma vidéo dans une fenêtre Mac au centre, et une notification qui dit où on en est et de quoi je parle. »
> Format de la vidéo longue YouTube (16:9). Créé le 2026-10-08 à la demande de l'utilisateur, d'après la capture d'un créateur.
> Scaffold : `style-templates/yt-05-youtube-minimaliste/`.

Le contraire du format 04 · Tella : pas de panneau permanent, les repères arrivent en notification. La vidéo parle, le cadre se fait oublier. Idéal pour une vidéo récit (parcours, coulisses, « ce que j'ai appris en X ans »). Les règles 9:16 des reels ne s'appliquent pas ; restent : rien sur le visage, zéro frame morte, la parole finit avec la vidéo, master à −14 LUFS.

---

## Le cadre (1920 × 1080, 30 fps)

```
 ┌──────────────────────────────────────────────┬──────────────┐
 │  ciel nuageux noir et blanc, grain            │ ▣ LinkedIn   │ ← notification
 │      ┌────────────────────────────────┐       │ 40 000 abon. │   (de temps en temps)
 │      │ ● ● ●                          │       └──────────────┘
 │      │                                │
 │      │      LA VIDÉO 16:9             │
 │      │      1280 × 720                │
 │      │                                │
 │      └────────────────────────────────┘
 │  colline                                                     │
 └──────────────────────────────────────────────────────────────┘
```

| Élément | Valeur |
|---|---|
| Fond | Paysage dessiné en SVG (ciel, nuages, colline avec texture d'herbe), en violet par défaut ou en noir et blanc (voir Les thèmes), vignette sombre sur les bords |
| Grain | Texture `assets/grain.png` en surimpression (16 %), qui saute à 12 images par seconde comme une pellicule |
| Fenêtre | 1280 × 750 centrée (gauche 320, haut 165) : barre sombre de 30 px avec les 3 pastilles, coins arrondis 8 px, ombre douce |
| Vidéo | 1280 × 720 (16:9) dans la fenêtre, `object-fit: cover` |
| Notification | En haut à droite (420 px de large) : verre sombre translucide, logo GIF de l'utilisateur animé en icône, titre en gras, commentaire en dessous |

Pas de libellé fixe sur la vidéo (retiré le 2026-10-08 à la demande de l'utilisateur).

## Ce qui bouge

- **L'ouverture** : la fenêtre s'ouvre comme une fenêtre macOS, zoom de 86 % à 100 % depuis le centre avec un fondu, en 0,32 s, sans rebond (demande de l'utilisateur, 2026-10-08).
- **Les infos** : la notification glisse depuis la droite (0,45 s), reste 4 s, puis repart vers la droite.
- **L'entretien** : le paysage dérive très lentement (zoom de 6 % sur toute la vidéo) et le grain saute en continu. Rien d'autre : la sobriété est le style.

## Les notifications : chapitres et éléments, faites au montage

Décision de l'utilisateur (2026-10-08). Les notifications servent de repères : elles disent en quelques mots où on en est et de quoi l'utilisateur parle. L'utilisateur ne les fournit pas : Claude les construit au moment du montage, depuis le transcript monté.

- **Le titre** : le chapitre (« Introduction », « La méthode », « Conclusion ») ou l'élément évoqué (« Claude Code », « LinkedIn », « Notion »). 1 à 3 mots.
- **Le commentaire en dessous** : une phrase courte qui décrit ce qui se dit, dans la voix de l'utilisateur (exemple : titre « Claude Code », commentaire « Comment setup ses fichiers .md »). 8 mots maximum.
- **Quand** : une notification à chaque début de chapitre (la première dès l'introduction), plus une quand un outil ou une notion clé entre en scène. Jamais deux à moins de 30 s d'intervalle.
- **Calage** : la notification arrive 0,2 à 0,6 s avant la phrase qui l'annonce, reste 4 s, puis repart.
- **Validation** : la liste (timecode, titre, commentaire) est montrée à l'utilisateur avant le rendu. Elle peut resservir pour les chapitres de la description YouTube.

## Les thèmes

Le thème se choisit en haut du script (`THEME`) :
- **`violet`** (par défaut, validé par l'utilisateur le 2026-10-08) : l'univers du site de la marque et de la charte de marque. Ciel de nuit `#06060C` vers violet à l'horizon, nappes de nuages violets translucides, halos de lumière qui dérivent, étoiles (quelques-unes scintillent), grille de la charte en filigrane, colline en silhouette avec un liseré lavande, grain discret. Notification au verre de la charte, logo GIF de l'utilisateur (boule de cristal) animé en icône.
- **`noir-et-blanc`** : la version d'origine, paysage gris et grain de pellicule, d'après la capture du créateur.

## Comment s'en servir

1. Copier le scaffold dans un projet daté : `cp -R style-templates/yt-05-youtube-minimaliste video-projects/AA-MM-JJ-<sujet>` puis mettre à jour `meta.json`.
2. Remplacer `assets/video.mp4` et `assets/voix.m4a`.
3. Montage parole comme d'habitude (`cut-silences`, `cut-mistakes`, `verify-cuts`), puis reporter l'EDL dans `SEG` et `CUTS`.
4. Au montage, Claude remplit `INFOS` (chapitres et éléments, titre + commentaire) depuis le transcript et les montre à l'utilisateur.
5. Ajuster les `data-duration` de la vidéo et de l'audio à la durée montée, puis lint, rendu, vérification.

## Checklist

- [ ] Le visage reste dans la fenêtre (cadrage via `object-position` si besoin).
- [ ] Une notification par chapitre (plus les éléments clés), titres et commentaires validés par l'utilisateur, jamais deux à moins de 30 s.
- [ ] Le grain reste discret : la vidéo doit rester nette.
- [ ] Master à −14 LUFS / −1 dBTP.
