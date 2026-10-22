# PowerOS

**Votre second cerveau, installé avec Claude Code.**

PowerOS est un dossier que Claude Code lit avant chaque tâche. Il contient qui vous êtes, ce que vous vendez, à qui, comment vous parlez, et où en est chaque projet, département et client. Sans ça, l'IA plafonne à 50 % : propre, correct, interchangeable. Avec, vous démarrez à 80 %.

Vous n'écrivez rien à la main. Claude vous interviewe, une question à la fois, et construit le dossier à partir de vos réponses.

## Démarrer

Prérequis : un abonnement Claude payant. Choisissez l'une des deux voies, le résultat est le même.

### Option 1 : avec l'application Claude (sans Terminal)

La plus simple, aucune ligne de commande.

1. Installez l'application Claude pour ordinateur : [Claude Code](https://claude.com/product/claude-code).
2. Sur la page de ce dépôt, cliquez sur le bouton vert **Code**, puis sur **Download ZIP**.
3. Dézippez le fichier, renommez le dossier en `MonOS` et rangez-le dans un endroit dédié (pas dans Documents ni sur le Bureau).
4. Dans l'application Claude, ouvrez l'onglet **Code** et choisissez le dossier `MonOS` comme dossier de travail.
5. Dans le chat, écrivez :

```
Installe mon second cerveau
```

Sur Mac, le ZIP garde le lien `.claude/skills` intact. Sur Windows, il peut le transformer en simple fichier texte : Claude le détecte et vous propose de le remplacer par une copie du dossier `10_Skills`, répondez oui.

### Option 2 : avec Claude Code dans le Terminal

Pour celles et ceux qui ont déjà Git et [Claude Code](https://www.anthropic.com/claude-code) en ligne de commande.

```bash
git clone https://github.com/marcdufraisse/poweros-second-cerveau.git MonOS
cd MonOS
claude
```

Puis, dans le chat :

```
Installe mon second cerveau
```

Ici le lien `.claude/skills` est conservé tel quel.

Dans les deux cas, le dossier est votre workspace. Il n'y a rien d'autre à installer.

## Ce que Claude va faire avec vous

Une étape à la fois, avec votre validation avant chaque fichier. Comptez 4 à 8 heures, à étaler sur quelques jours.

1. **Qui vous êtes** (`01_About-Me/`) : une interview de 20 questions (faites-la à la voix, en marchant), un snapshot de votre activité, vos règles d'écriture.
2. **La vérité sur votre marché** (`02_Contexte/`) : votre offre, vos clients et leurs problèmes dans leurs mots, votre voix, vos contraintes, vos valeurs. Cinq fichiers, chacun en trois temps : cadrage, interview, synthèse.
3. **Vos départements et vos projets** : vous validez la mission de chaque département, vous donnez le chiffre qui compte, vous listez vos initiatives en cours.
4. **Vos clients actifs** : un dossier par client, avec sa note.
5. **Des skills recommandés** : Claude vous propose d'installer HyperFrames (vidéo en HTML) et claude-seo (SEO pour l'ère de l'IA) depuis leurs dépôts GitHub. Vous dites oui ou non à chacun. `find-skills` et Editing OS (montage vidéo, dans `08_Ressources/`) sont déjà inclus.
6. **Vos outils** : vos 3 à 5 outils prioritaires branchés avec `/connect-mcp`.
7. **Vos rituels** : `/done` en fin de session, `/weekly-review` le vendredi, `/lint` une fois par mois.

Pour vérifier que c'est bon, ouvrez une nouvelle session et demandez : "Où en est-on sur mes projets ?"

## Ce que contient le dossier

```
CLAUDE.md          la carte que Claude lit à chaque session
00_Livrables/      ce que Claude produit, par type (Z_Inbox/ : la capture en vrac)
01_About-Me/       qui vous êtes (toujours chargé)
02_Contexte/       offre, clients, voix, réalité de travail, valeurs (chargé selon la tâche)
03_Branding/       charte, logos, polices
04_Projets/        une initiative avec une fin
05_Departements/   Strategie, Marketing, Vente, Produit, Finance-Compta
06_Clients/        un dossier par client signé
07_Meeting/        transcripts de calls
08_Ressources/     templates, veille, Editing-OS (montage vidéo)
09_Journal/        un fichier par jour, un par semaine
10_Skills/         les 15 skills (.claude/skills pointe dessus)
11_Archives/       terminé ou remplacé
```

Chaque dossier de travail a une note du même nom, avec les mêmes sections : Mission, Périmètre, Objectif, Cadre, Étapes, Où on en est, Key Notes. Vous écrivez les premières, `/done` fait vivre les dernières.

## Les skills

| Commande                      | Quand                                                           |
| ----------------------------- | --------------------------------------------------------------- |
| `Installe mon second cerveau` | au démarrage                                                    |
| `/done`                       | en fin de chaque session : c'est ce qui garde le cerveau vivant |
| `/weekly-review`              | le vendredi                                                     |
| `/daily-review`               | le soir                                                         |
| `/inbox-processor`            | quand `Z_Inbox/` déborde                                        |
| `/import`                     | pour digérer un gros lot de notes                               |
| `/lint`                       | une fois par mois                                               |
| `/notes-permanentes`          | pour garder une source qui compte                               |
| `/create-skill`               | quand une tâche se répète                                       |
| `/map-process`                | pour lister vos tâches récurrentes et voir quoi automatiser     |
| `/fiche-process`              | pour documenter un process dans son département                 |
| `/ameliorer-skill`            | en fin de discussion, pour faire évoluer un skill               |
| `/slide`                      | pour des slides de live, de bootcamp ou de webinaire (PDF)      |
| `/connect-mcp`                | pour brancher un nouvel outil                                   |
| `/find-skills`                | pour chercher un skill existant                                 |

## Les règles du jeu

1. **Une information vit à un seul endroit.** L'offre est dans `02_Contexte/Offer-Positioning.md`, nulle part ailleurs.
2. **Ce qui n'est pas écrit n'existe pas pour Claude.** Chaque session finit par `/done`.
3. **Rien ne part sans votre oui.** Aucun message ni email n'est envoyé sans validation explicite.
4. **Rien ne se supprime.** Ce qui n'a plus sa place va dans `11_Archives/`.

## Windows

Avec l'option 2, `.claude/skills` est un lien symbolique vers `10_Skills/` : activez le mode développeur de Windows avant de cloner. Avec l'option 1 (ZIP), rien à faire : si le lien est devenu un fichier texte, Claude le remplace par une copie du dossier.

## Polices et licences

Les slides (`/slide`) et Editing OS embarquent les polices Outfit, Poppins et JetBrains Mono, sous licence libre SIL OFL. Editing OS est sous licence MIT (voir `08_Ressources/Editing-OS/LICENSE`) et s'appuie sur HyperFrames (Apache 2.0).

## Données personnelles

Vos fichiers (`01_About-Me/`, `02_Contexte/`, `03_Branding/`, `06_Clients/`, `07_Meeting/`, `09_Journal/`) sont à vous. Si vous versionnez votre workspace, faites-le dans un dépôt privé. Les clés d'outils, si vous en avez, vivent dans un fichier `.env` à la racine, ignoré par git.

## Auteur

Construit par [Marc Dufraisse](https://www.linkedin.com/in/marcdufraisse/).
