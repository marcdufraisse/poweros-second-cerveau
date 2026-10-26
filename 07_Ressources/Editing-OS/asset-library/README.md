# Asset library : la base dans laquelle on pioche

Les médias réutilisables d'un projet à l'autre : votre photo de profil, vos preuves (captures de résultats), votre logo, vos b-roll, vos sons. Ce dossier est une **source**, pas une dépendance : un projet vidéo est autonome, on **copie** l'asset dans `video-projects/<slug>/assets/` au lieu de pointer ici. Une composition qui référence `asset-library/` casse dès qu'on rend le projet depuis son propre dossier.

Les cartes de la `style-library`, elles, n'y touchent jamais : elles embarquent leurs médias (data URI) pour rester copiables telles quelles.

## Ce qui est livré

- `sfx/` : le pack de sons, documenté dans [`sfx/README.md`](sfx/README.md). Les volumes y sont des multiplicateurs, pas des niveaux : lire l'encadré avant de poser un SFX.

## Ce que vous ajoutez

Créez ces dossiers au besoin, et listez chaque fichier dans le tableau du dossier concerné (format, usage) :

| Dossier | Contenu |
| --- | --- |
| `PP/` | votre photo de profil, carrée, fond clair |
| `resultats/` | vos preuves : captures réelles, jamais retouchées |
| `logos/` | votre logo (fixe, et animé si vous en avez un) |
| `broll/` | plans courts pour illustrer un propos (ils viennent en coupe sous la voix) |

Un plan filmé en 29,97 fps doit être converti à 30 fps avant usage si le projet est à 30 fps.

## Ajouter un asset

Déposer le fichier dans le bon dossier. Les noms avec espaces fonctionnent, mais toute URL vers ces fichiers doit être encodée (`%20`).
