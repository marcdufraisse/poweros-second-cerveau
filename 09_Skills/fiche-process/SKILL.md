---
name: fiche-process
description: "Crée la fiche détaillée d'un process récurrent (fréquence, déclencheur, input, étapes, output, méthode, exemples) à partir de la cartographie de /map-process, dans le dossier Process/ du département concerné. Cette fiche est la matière première de /create-skill. Se déclenche sur \"/fiche-process\", \"crée la fiche process de\", \"fiche process newsletter\", \"documente ce process\", \"détaille ce process\"."
user-invocable: true
context: main
---

# Fiche process

Une fiche process décrit une tâche récurrente assez précisément pour qu'on puisse ensuite la transformer en skill. Elle est le chaînon entre `/map-process` (la liste des process) et `/create-skill` (l'automatisation). Une fiche par tâche, jamais plus. Elle vit dans le département concerné : elle répertorie comment la tâche se passe dans votre contexte.

## Avant de commencer

1. Lis `07_Ressources/templates/process.md` : c'est le gabarit, ne le réécris pas de mémoire.
2. Lis `04_Departements/Strategie/Cartographie-process.md` s'il existe : le process demandé y est-il listé, avec quelle fréquence et quel déclencheur ? Reprends ces infos, ne les redemande pas.
3. Détermine le département concerné (Marketing, Vente, Produit, Strategie, Finance-Compta), selon la section 3 du `CLAUDE.md`. En cas de doute, demande.
4. Regarde si `04_Departements/<Departement>/Process/Process-<Nom>.md` existe déjà. Si oui, enrichis-le, ne l'écrase pas.
5. `about-me.md` et `my-company.md` sont déjà chargés.

## Étape 1 : cadrer

Une question à la fois, seulement pour ce qui manque :

1. La tâche en une phrase, et son nom court (ex. "Newsletter hebdo").
2. Fréquence et déclencheur : qu'est-ce qui la lance, à quel moment.
3. Temps actuel : combien de temps ça prend à la main.
4. Input : de quoi avez-vous besoin pour commencer (fichiers, notes, outils, infos).

## Étape 2 : dérouler les étapes

Demande à l'utilisateur de raconter la dernière fois qu'il l'a faite, étape par étape. Numérote dans l'ordre réel, pas dans l'ordre idéal. Pour chaque étape : l'action, l'outil, ce qui bloque ou prend du temps.

Repère les étapes qu'un humain seul doit faire (décision, validation, envoi) : elles deviendront des points de validation dans le skill.

## Étape 3 : output, méthode, exemples

- **Output** : ce qui sort à la fin, avec format, longueur, destination et moment (ex. "800 à 1200 mots, objet et preview, envoi mardi 9h").
- **Méthode** : la partie la plus importante de la fiche, celle qui fait que l'IA produit "à votre façon" et pas du générique. L'IA sait suivre des étapes, appliquer des règles, reproduire des formats. Elle ne devine pas : votre style, vos critères de qualité, ce que vous considérez comme "bien fait", ce que vous évitez absolument. Une méthode tient en 1000 à 2000 mots.
  - Demande d'abord d'où vient la méthode : un livre, une vidéo, un coach, une personne de référence, sa propre pratique.
  - Pour chaque source, récupère la matière (extraits, notes, transcript, lien) et demande ce qu'il en retient et ce qu'il adapte. Une source externe se range dans `07_Ressources/Veille/sources/`, la fiche y renvoie.
  - Fais ressortir quatre éléments : style, critères de qualité, ce qui compte comme "bien fait", ce qu'il évite absolument.
  - Range-les dans les sous-sections du gabarit : Structure, Ce que je fais toujours, Ce que je ne fais jamais, Critères de qualité (mesurables), Formatage.
  - Ne l'invente jamais. S'il n'a pas encore de méthode, dis-le : propose de la construire à partir de ses meilleurs exemples ou d'une source à étudier avant de créer le skill.
  - Au-delà de 300 mots, écris-la dans `Methode-<Nom>.md` à côté de la fiche et mets le lien dans la section.
- **Exemples** : au moins un bon et un mauvais, réels, avec l'analyse de pourquoi. Puis l'**exemple complet** : un livrable idéal de bout en bout, qui servira de référence. S'il n'en a pas sous la main, cherche dans ses livrables (`00_Livrables/`) et propose des candidats. Laisse vide plutôt qu'inventer.

## Étape 4 : montrer et écrire

Montre la fiche complète. Après le "oui", écris `04_Departements/<Departement>/Process/Process-<Nom>.md` (noms sans espace, tirets) à partir du gabarit, `maj` à la date du jour.

Mets à jour `Cartographie-process.md` : le process pointe vers `[[Process-<Nom>]]` s'il est déjà dans la liste, sinon ajoute-le à la bonne fréquence.

## Étape 5 : proposer la suite

Dis en une ligne si la tâche a été faite au moins trois fois (condition de `/create-skill`) et propose de lancer `/create-skill` dessus. Le champ `skill:` du frontmatter se remplit une fois le skill créé.

## Sortie

- `04_Departements/<Departement>/Process/Process-<Nom>.md` (frontmatter `type: process`, blocs : Fréquence, Déclencheur, Input, Étapes, Output, Méthode avec ses sous-sections, Exemples, Exemple complet)
- optionnel : `Methode-<Nom>.md` dans le même dossier
- `Cartographie-process.md` mis à jour

## Règles

- Une fiche = une tâche. Deux tâches, deux fiches.
- Jamais de chiffre, d'étape ou d'exemple inventé : si l'info manque, tu la demandes ou tu laisses vide.
- Une fiche existante s'enrichit, elle ne s'écrase pas.
- Vouvoiement, aucun tiret cadratin ni demi-cadratin dans les fichiers produits.
