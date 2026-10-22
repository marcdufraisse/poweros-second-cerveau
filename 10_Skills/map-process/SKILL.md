---
name: map-process
description: Cartographier toutes les tâches récurrentes (perso et pro) en partant de la fréquence (daily, weekly, monthly, sur déclencheur, manuel), repérer lesquelles automatiser avec l'IA (skill, routine) et dans quel ordre. Pose les questions dès le lancement. Produit une cartographie dans 05_Departements/Strategie/. Se déclenche sur "/map-process", "cartographie mes process", "qu'est-ce que je peux automatiser", "mes tâches récurrentes".
user-invocable: true
context: main
---

# Map Process

Tu guides l'utilisateur pour cartographier ses tâches récurrentes et voir ce qu'il doit automatiser, avec un skill ou une routine. Tu commences par les questions, dès le lancement : pas d'explication préalable, pas de demande de fichier.

Structure du second cerveau :
- Identité : `01_About-Me/about-me.md` et `01_About-Me/my-company.md` (déjà chargés)
- Dossiers de travail : `06_Clients/`, `05_Departements/`
- Fiches existantes : `Process/` dans chaque département (`05_Departements/<Departement>/Process/`)
- Sortie : `05_Departements/Strategie/Cartographie-process.md`

## Avant de commencer (en silence)
1. `about-me.md` et `my-company.md` sont déjà chargés : ne les relis pas.
2. Vérifie si `Cartographie-process.md` existe (pour l'enrichir, pas l'écraser) et liste les fiches `Process-*.md` des départements pour les rattacher ensuite.
3. Enchaîne tout de suite sur la première question du Daily. Ne résume pas ce que tu viens de lire.

## Process

Une seule question à la fois. Une fréquence à la fois, dans cet ordre : Daily, Weekly, Monthly, Sur déclencheur, Manuel. L'utilisateur répond en vrac, tu reformules en liste courte et tu relances sur ce qui manque.

### Étape 1 : Daily
Demande-lui de se projeter dans une journée type, du premier geste du matin à la fin de journée. Qu'est-ce qu'il fait chaque jour, dans l'ordre ? Relance sur les pôles oubliés :
- Contenu et communication
- Acquisition et vente : messages, leads, relances, propales, appels
- Clients : préparation, suivi, livrables
- Admin : mails, tâches, tri, compta
- Perso : sport, routines

Pour chaque process cité : à quelle heure, avec quel outil, combien de temps, ce qui est pénible. Ne l'invente pas.

### Étape 2 : Weekly
Qu'est-ce qu'il fait une fois par semaine, et quel jour ? (newsletter, bilan, veille, point de pipeline, session client, planification). Même relance : outil, durée, friction.

### Étape 3 : Monthly
Qu'est-ce qui revient chaque mois ? (facturation, compta, déclarations, bilan des stats, mise à jour des offres, revue des objectifs).

### Étape 4 : Sur déclencheur
Qu'est-ce qui se lance quand un événement arrive ? Format : process, déclencheur. (nouveau lead, call terminé, propale envoyée, no-show, client signé, commentaire reçu).

### Étape 5 : Manuel (ponctuel mais fréquent)
Les tâches sans rythme fixe, mais refaites régulièrement (landing page, lead magnet, slides, séquence de mails, lancement).

### Étape 6 : Récap par fréquence, puis validation
Montre la liste complète au format ci-dessous. Demande ce qui manque ou ce qui est faux avant de créer le fichier.

```markdown
## Daily
- [Process]
## Weekly
- [Process]
## Monthly
- [Process]
## On Trigger (événement déclencheur)
- [Process] -> Trigger : [événement]
## Manuel (ponctuel)
- [Process]
```
La fréquence révèle le ROI : on priorise ce qui est fait souvent, pénible, et qui pèse sur le revenu ou le temps.

### Étape 7 : Création du fichier (après validation)
Crée ou mets à jour `05_Departements/Strategie/Cartographie-process.md` avec les fiches existantes en `[[wikilink]]` :

```markdown
---
type: cartographie-process
maj: YYYY-MM-DD
---
# Cartographie des process

## Daily
- [[Process-Tri-inbox]]
## Weekly
- [[Process-...]]
## Monthly
- [[Process-Facturation]]
## On Trigger
- [[Process-Onboarding-nouveau-client]]
## Manuel
- [[Process-...]]

## Priorisation (chronophage x pénible x impactant)
1. [Process] - pourquoi prioritaire, et automatisation visée (skill ou routine)
```

### Étape 8 : Récapitulatif
```
Process cartographiés : [X]
Candidats skills (fiche via /fiche-process, puis /create-skill) : [liste]
Candidats routines (tâche planifiée, sans intervention) : [liste]
Prochaine étape : transformer les 3 à 5 process prioritaires en skills.
Par lequel voulez-vous commencer ?
```

Skill ou routine : un **skill** est une procédure que vous déclenchez ; une **routine** est une tâche qui tourne seule à heure fixe. Propose l'un ou l'autre selon que le process demande une décision humaine ou non.

## Règles
- Questions ouvertes, ne suppose pas. Aucun process inventé.
- Une seule question à la fois, en phrases complètes.
- Garde une vue d'ensemble avant le détail.
- Valide avant de créer des fichiers.
- Français, vouvoiement, pas de tiret cadratin ni demi-cadratin.
- Si l'utilisateur le propose, lis ses notes de `09_Journal/` pour compléter, sans l'imposer.
