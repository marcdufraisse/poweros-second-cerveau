# PowerOS

**Votre second cerveau, installé avec Claude Code.**

PowerOS est un dossier que Claude Code lit avant chaque tâche. Il contient qui vous êtes, ce que vous vendez, à qui, comment vous parlez, et où en est chaque projet, département et client. Sans ça, l'IA plafonne à 50 % : propre, correct, interchangeable. Avec, vous démarrez à 80 %.

Vous n'écrivez rien à la main. Claude vous interviewe, une question à la fois, et construit le dossier à partir de vos réponses.

## Démarrer

Prérequis : un abonnement Claude payant. Mac ou Windows. Choisissez l'une des deux voies, le résultat est le même.

### Option 1 : avec l'application Claude (sans Terminal)

La plus simple, aucune ligne de commande.

1. Installez l'application Claude pour ordinateur : [Claude Code](https://claude.com/product/claude-code).
2. Sur la page de ce dépôt, cliquez sur le bouton vert **Code**, puis sur **Download ZIP**.
3. Dézippez le fichier, renommez le dossier en `MonOS` et rangez-le dans un endroit dédié (pas dans Documents ni sur le Bureau, et sous Windows hors de OneDrive, par exemple `C:\Users\<vous>\MonOS`).
4. Dans l'application Claude, ouvrez l'onglet **Code** et choisissez le dossier `MonOS` comme dossier de travail.
5. Dans le chat, écrivez :

```
Installe mon second cerveau
```

### Option 2 : avec Claude Code dans le Terminal

Pour celles et ceux qui ont déjà Git et [Claude Code](https://www.anthropic.com/claude-code) en ligne de commande.

```bash
git clone https://github.com/marcdufraisse/poweros-second-cerveau.git MonOS
cd MonOS
claude
```

Puis, dans le chat : `Installe mon second cerveau`.

Dans les deux cas, le dossier est votre workspace. Il n'y a rien d'autre à installer.

**Sous Windows**, le dossier des skills (`.claude/skills`) arrive parfois cassé après le dézippage. Au premier message, Claude le vérifie, recopie les skills si besoin et vous demande de rouvrir la session une fois. S'il manque un outil (Git, Node, Python, FFmpeg), il vous donne la commande `winget` à coller dans PowerShell.

## Ce que Claude va faire avec vous

Comptez 45 minutes à 1 h 30, en une ou plusieurs fois (pour reprendre : « reprends l'installation »). Claude vous demande d'abord des exemples, en déduit le maximum, et ne vous pose que les questions qui restent.

1. **Le prélude** : ce qu'on construit, comment le dossier est rangé, et le nom que vous donnez à votre IA.
2. **Qui vous êtes** : votre profil LinkedIn, votre site ou votre CV, puis quelques questions sur votre parcours et votre façon de travailler.
3. **Vos offres** : 2 ou 3 propositions commerciales ou votre page de vente, d'où Claude tire vos offres et vos prix.
4. **Vos projets et vos clients** : ce qui est en cours, vos clients actifs, vos propales et comptes rendus d'appels.
5. **Votre moment** : votre focus des 3 prochains mois, vos contraintes, ce que vous refusez.
6. **Votre voix** : vos 5 derniers mails et quelques posts, d'où Claude tire votre façon d'écrire.
7. **La validation** : Claude reformule tout, vous corrigez, puis il écrit les fichiers.

Ensuite, quand vous voulez : approfondir votre voix et vos clients, installer les outils de montage vidéo et d'animation (HyperFrames, Editing OS), proposés à la fin de l'installation, et claude-seo, brancher vos outils avec `/connect-mcp`, créer votre premier skill, poser vos rituels (`/done`, `/weekly-review`, `/lint`).

Pour vérifier que c'est bon, ouvrez une nouvelle session et demandez : "Où en est-on sur mes projets ?"

## Ce que contient le dossier

```
CLAUDE.md          la carte que Claude lit à chaque session
00_Livrables/      ce que Claude produit, par type (Z_Inbox/ : la capture en vrac)
01_About-Me/       qui vous êtes (toujours chargé)
02_Contexte/       offre, clients, voix, réalité de travail, valeurs, et Branding/ (charte, logos, polices)
03_Projets/        une initiative avec une fin
04_Departements/   Strategie, Marketing, Vente, Produit, Finance-Compta
05_Clients/        un dossier par client signé
06_Meeting/        transcripts de calls
07_Ressources/     templates, veille, Editing-OS (montage vidéo)
08_Journal/        un fichier par jour, un par semaine
09_Skills/         les 15 skills (.claude/skills pointe dessus)
10_Archives/       terminé ou remplacé
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
| `/linkedin-post-generator`    | pour écrire un post LinkedIn dans votre voix                    |
| `/slide`                      | pour des slides de live, de bootcamp ou de webinaire (PDF)      |
| `/connect-mcp`                | pour brancher un nouvel outil                                   |
| `/find-skills`                | pour chercher un skill existant                                 |

## Les règles du jeu

1. **Une information vit à un seul endroit.** L'offre est dans `02_Contexte/Offer-Positioning.md`, nulle part ailleurs.
2. **Ce qui n'est pas écrit n'existe pas pour Claude.** Chaque session finit par `/done`.
3. **Rien ne part sans votre oui.** Aucun message ni email n'est envoyé sans validation explicite.
4. **Rien ne se supprime.** Ce qui n'a plus sa place va dans `10_Archives/`.

## Windows

`.claude/skills` est un lien symbolique vers `09_Skills/`. Sur Windows, activez le mode développeur avant de cloner, sinon Claude remplace le lien par une copie du dossier lors de l'installation.

## Polices et licences

Les slides (`/slide`) et Editing OS embarquent les polices Outfit, Poppins et JetBrains Mono, sous licence libre SIL OFL. Editing OS est sous licence MIT (voir `07_Ressources/Editing-OS/LICENSE`) et s'appuie sur HyperFrames (Apache 2.0).

## Données personnelles

Vos fichiers (`01_About-Me/`, `02_Contexte/` (Branding compris), `05_Clients/`, `06_Meeting/`, `08_Journal/`) sont à vous. Si vous versionnez votre workspace, faites-le dans un dépôt privé. Les clés d'outils, si vous en avez, vivent dans un fichier `.env` à la racine, ignoré par git.

## Auteur

Construit par [Marc Dufraisse](https://www.linkedin.com/in/marcdufraisse/).
