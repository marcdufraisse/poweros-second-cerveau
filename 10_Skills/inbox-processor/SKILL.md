---
name: inbox-processor
description: "Vider 00_Livrables/Z_Inbox/ : chaque item est lu, typé, puis routé vers un projet, un département, un client, un sous-dossier de 00_Livrables/ (livrable), 08_Ressources/ (référence ou source de veille) ou 11_Archives/, en suivant le routage du CLAUDE.md. Range aussi les livrables de plus de 15 jours de 00_Livrables/ dans leur vraie place (client, département, projet), ou dans 00_Livrables/Autres/ en cas de doute. Jamais de suppression, seulement des déplacements. À lancer dès que l'inbox dépasse cinq items ou une fois par semaine."
user-invocable: true
context: main
---

# Inbox processor

Tu aides l'utilisateur à vider `00_Livrables/Z_Inbox/`. C'est un sas : rien n'y reste plus de quelques jours. Chaque item finit à un seul endroit, avec un nom propre et un frontmatter.

## Avant de commencer

1. Relis les sections 3, 5 et 7 du `CLAUDE.md` : c'est la règle de vérité.
2. Liste les destinations possibles : `ls "04_Projets" "05_Departements" "06_Clients" "00_Livrables"`.
3. Scanne `00_Livrables/Z_Inbox/` en ignorant `Inbox.md` et `_import/` (ce dernier se traite avec `/import`).

## Étape 1 : scanner

```
J'ai trouvé X items dans l'inbox :
1. <fichier> : <aperçu en une ligne>
...
On les traite un par un ?
```

## Étape 2 : pour chaque item, typer et proposer

```
Item : <nom>
Contenu : <résumé en une ou deux phrases>
Type : Idée / Tâche / Transcript / Livrable / Source de veille / Référence / Réflexion / Autre

Destinations possibles :
1. Un projet (04_Projets/<Projet>/) : ça sert une initiative avec une fin
2. Un département (05_Departements/<Departement>/) : ça sert une responsabilité continue
3. Un client (06_Clients/<Client>/) : ça concerne une mission signée
4. Un livrable (00_Livrables/<Type>/) : c'est un document produit
5. Une source de veille (08_Ressources/Veille/sources/) puis /notes-permanentes si ça mérite de durer
6. Une référence (08_Ressources/) : template, exemple, doc d'API
7. Un transcript de call (07_Meeting/, routage de la note Meeting.md)
8. 11_Archives/ : obsolète ou déjà traité
9. Développer maintenant : on creuse ensemble, puis on range
10. Supprimer : doublon ou vide, seulement avec votre oui

Je propose : <numéro>, parce que <une raison>. OK ?
```

Une seule proposition argumentée par item. L'utilisateur dit oui, ou corrige.

## Étape 3 : exécuter

- **Idée ou fait lié à un dossier** : verser dans Où on en est, en décision datée dans Cadre, ou en case dans Étapes de la note du dossier (format de `/done`), puis retirer l'item de l'inbox.
- **Livrable ou fichier** : déplacer dans `00_Livrables/<Type>/` selon la section 7 du `CLAUDE.md` (ou dans `06_Clients/<Client>/` pour un client signé), renommer en `Nom-Sujet_YYYY-MM-DD.ext`, ajouter le frontmatter s'il manque (`type`, `status`, `date`, `maj`, `client` si besoin).
- **Nouveau projet** : créer le dossier, sa note depuis `08_Ressources/templates/projet.md`, et l'ajouter à `04_Projets/Projets.md`.
- **Transcript** : appliquer le routage de `07_Meeting/Meeting.md`, puis faire ruisseler les décisions vers la note du client ou du prospect.
- **Source de veille** : déplacer dans `08_Ressources/Veille/sources/`, proposer `/notes-permanentes`.
- **Vague mais à potentiel** : dérouler l'idée en trois questions (c'est quoi, pour qui, quelle première action), puis ranger le résultat.
- **Archive** : déplacer vers `11_Archives/` à plat, nom d'origine conservé.
- **Suppression** : uniquement après un oui explicite sur cet item précis.

Ne jamais écrire dans `01_About-Me/`, `02_Contexte/` ni `03_Branding/` : si un item les concerne, proposer un diff comme `/done` le fait.

## Étape 4 : récapitulatif

```
Inbox traitée.
- X vers des projets, X vers des départements, X vers des clients
- X en livrables, X en veille, X en références, X en Meeting
- X archivés, X supprimés (avec votre oui)
Items restants : X
```

Puis une ligne dans `09_Journal/YYYY-MM-DD.md` au format de `/done` si au moins un fichier a bougé.

## Étape 5 : ranger les livrables de plus de 15 jours

Une fois l'inbox traitée, passe en revue les livrables déjà produits. Un livrable reste dans `00_Livrables/<Type>/` le temps qu'il sert (15 jours), puis il rejoint sa vraie place. Cette étape ne supprime rien : elle déplace seulement.

**`Z_Inbox/` ne part jamais.** Le dossier `00_Livrables/Z_Inbox/` reste toujours à sa place : il n'est ni déplacé, ni archivé, ni retiré. Les dossiers par type se vident au fil des rangements, `Autres/` n'est qu'un sas temporaire.

**Périmètre.** Les fichiers de `00_Livrables/<Type>/` (hors `Z_Inbox/`, `Autres/` et `Livrables.md`). Âge = champ `date` du frontmatter, à défaut la date de dernière modification. Moins de 15 jours : on n'y touche pas.

**Pour chaque livrable, trouver la bonne place :**

1. Produit pour un client signé : `06_Clients/<Client>/`, préfixé du nom du client.
2. Produit pour un projet (préfixe `[tag]_` ou sujet d'un projet de `04_Projets/`) : `04_Projets/<Projet>/`.
3. Relève d'une responsabilité continue : `05_Departements/<Departement>/` (un post, une newsletter, des slides dans `Marketing/`, une propale dans `Vente/`, une offre dans `Produit/`).
4. Aucune place évidente : `00_Livrables/Autres/` (créé au premier besoin). L'utilisateur vous guide ensuite, et vous rangez à sa réponse.

**Déroulé :**

1. Scanne et présente un seul tableau : fichier, âge, destination proposée, raison en quelques mots. Les cas incertains partent dans la colonne `Autres`.
2. Attends le oui de l'utilisateur, ou ses corrections, avant tout déplacement.
3. Déplace avec `mv` (ou `git mv`), jamais `rm`. Conserve le nom d'origine, sauf pour ajouter le préfixe client ou projet quand il manque. Ajoute le frontmatter manquant.
4. Mets à jour dans la même session tout ce qui pointe vers le fichier déplacé (notes, wikilinks).
5. Journalise : une ligne dans `09_Journal/YYYY-MM-DD.md`.

**Récapitulatif de l'étape :**

```
Livrables rangés.
- X vers des clients, X vers des projets, X vers des départements
- X dans Autres (à guider)
- X laissés en place (moins de 15 jours)
Rien supprimé.
```

## Règles de routage

- Projet si l'item a un objectif, une fin, et demande plusieurs actions.
- Département si l'item sert une responsabilité qui ne se termine pas.
- Client si l'item cite une mission signée. Un prospect pas signé va dans [[Vente]].
- Le support final l'emporte sur le sujet : un post qui parle d'un client va dans Marketing, pas chez le client.
- Rangement des livrables (étape 5) : déplacer seulement, jamais supprimer. Le doute va dans `00_Livrables/Autres/`, pas dans un dossier au hasard.
- En cas de doute entre deux destinations, demande. Mieux vaut ranger vite qu'attendre, mais jamais au hasard.
- Français, vouvoiement avec l'utilisateur, wikilinks, aucun tiret cadratin ni demi-cadratin.
