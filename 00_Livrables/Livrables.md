---
type: index
status: active
date: AAAA-MM-JJ
maj: AAAA-MM-JJ
---

# Livrables

> Tout ce que Claude produit pour vous, rangé par type : un post, une newsletter, des slides, une propale, une landing page. C'est aussi le dossier de capture : `Z_Inbox/` accueille tout ce qui arrive sans place définie.

## Organisation

- `Z_Inbox/` : la capture. Une idée, un lien, un fichier déposé, un transcript pas encore trié. Vidé par `/inbox-processor`. Toujours à sa place, jamais déplacé ni archivé. Gros lot dans `Z_Inbox/_import/` pour `/import`.
- `<Type>/` : un dossier par type de livrable, au pluriel et en français, créé au premier besoin (`Posts/`, `Newsletter/`, `Presentations/`, `Propositions/`, `Landing-Pages/`...). La liste est dans la section 7 du `CLAUDE.md`.

## Règles

- Un livrable porte un frontmatter (`type`, `status`, `date`, `maj`, `client` si besoin, `tags`), depuis `08_Ressources/templates/livrable.md`.
- Nommage `Nom-Sujet_YYYY-MM-DD.ext`. Une seule version visible : les précédentes vont dans `11_Archives/`.
- Un livrable reste ici le temps qu'il sert, environ quinze jours. Ensuite `/inbox-processor` le range dans son vrai dossier : un projet, un département ou un client.
- Un livrable pour un client signé va directement dans `06_Clients/<Client>/`, préfixé du nom du client.
