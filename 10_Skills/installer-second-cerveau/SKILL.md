---
name: installer-second-cerveau
description: "Construit le second cerveau de l'utilisateur, le socle que Claude lit avant d'agir : 01_About-Me/ (3 fichiers), les 5 fichiers de 02_Contexte/, ses départements, ses projets, ses clients actifs, les skills recommandés (HyperFrames, claude-seo, installés depuis GitHub avec son accord), ses MCP et son premier skill. Process étape par étape, une étape à la fois, avec une interview en 3 prompts (cadrage, interview, synthèse) pour chaque fichier stratégique. Se déclenche sur \"Installe mon second cerveau\", \"construire mon second cerveau\", \"créer mon cerveau IA\", \"on commence\", \"je démarre\", ou tout premier message d'un utilisateur dont 01_About-Me/about-me.md contient encore [à remplir]."
argument-hint: [optionnel : numéro d'étape pour reprendre, ex "étape 3" ou "contexte"]
user-invocable: true
context: main
---

# Installer mon second cerveau

**Objectif :** transformer Claude en assistant qui connaît le métier, les clients et la voix de l'utilisateur, et qui sait où ranger ce qu'il produit.

**Le workspace existe déjà.** L'utilisateur a cloné PowerOS : l'arborescence, le CLAUDE.md racine, les fichiers de `01_About-Me/` et `02_Contexte/` sont présents avec des `[à remplir]`, chaque dossier de travail a sa note. Ce skill ne crée pas la structure, il la remplit. Vouvoiement, une étape à la fois, jamais de tiret cadratin.

**Durée totale :** 4 à 8 h, à étaler sur quelques jours.

**Référence :** `references/guide-complet.md` contient tous les prompts d'interview. Lis-le à la demande, section par section (A.1, B.3...), jamais en entier d'un coup.

---

## Règles d'orchestration (à respecter strictement)

1. **Une étape à la fois.** Jamais plusieurs étapes sans validation explicite de l'utilisateur.
2. **Toujours détecter où en est l'utilisateur** avant de proposer la suite : quels fichiers existent, lesquels contiennent encore `[à remplir]`.
3. **Proposer la prochaine étape logique**, ne pas l'imposer.
4. **Ne jamais écrire un fichier au contenu personnel** (About-Me, Contexte, notes de client) sans l'avoir montré et fait valider.
5. **Pour chaque fichier de `02_Contexte/`, suivre les 3 prompts** dans la même conversation : Cadrage, Interview, Synthèse. Ne jamais en sauter un.
6. **Écrire au fur et à mesure.** Chaque fichier est écrit à la fin de son étape, depuis la mémoire fraîche, jamais tout à la fin.
7. **Un document déposé remplace une partie de l'interview** (CV, bio, offres écrites, transcripts d'appels) : à tout moment.

---

## Étape 0 : Diagnostic initial

Commence TOUJOURS par :

1. **Vérifier le contexte.** Lis `01_About-Me/` et `02_Contexte/`. Un fichier est "à faire" s'il contient encore `[à remplir]`, "fait" sinon. Liste `06_Clients/` et `04_Projets/` : y a-t-il déjà des dossiers ? Les fiches de `05_Departements/` ont-elles encore un Objectif `[à remplir]` ?
2. **Afficher l'état des lieux** et proposer la prochaine étape logique (la première si tout est vide).
3. **Demander** :
   - Son métier (sert à décider si un département manque)
   - Le temps qu'il a pour cette session (1 h, demi-journée, étalé sur la semaine)
   - S'il a des documents à déposer

Format de l'état des lieux :
```
État de votre second cerveau :
├── 01_About-Me/
│   ├── about-me.md                      à remplir
│   ├── my-company.md                    à remplir
│   └── anti-ai-voice.md                 fourni (section 7 à compléter)
├── 02_Contexte/
│   ├── Opinions-et-Valeurs.md           à remplir
│   ├── Tone-and-Voice.md                à remplir
│   ├── Offer-Positioning.md             à remplir
│   ├── Clients-Problems-and-Messages.md à remplir
│   └── Life-and-Work-Reality.md         à remplir
├── 05_Departements/                     5 fiches, Objectif à remplir
├── 04_Projets/                          aucun projet pour l'instant
└── 06_Clients/                          aucun client pour l'instant

Prochaine étape recommandée : Étape 2 (about-me.md)
```

---

## Étape 1 : Vérifier la structure

En 30 secondes, `ls` : `00_Livrables/` à `11_Archives/`, les cinq départements de `05_Departements/` (Strategie, Marketing, Vente, Produit, Finance-Compta), `08_Ressources/templates/` avec ses huit templates. Chaque département a une fiche du même nom.

Vérifie que `.claude/skills` est un lien symbolique vers `10_Skills/` (`ls -l`). Si c'est un fichier texte (Windows cloné sans mode développeur), remplace-le par une copie de `10_Skills/` et dis-le.

Si le métier appelle un département de plus (`Formation/` pour un formateur, `Recrutement/` pour un cabinet) ou un de moins, propose-le. Un département se crée sur le même patron : un dossier, sa fiche depuis `08_Ressources/templates/departement.md`, une ligne de plus dans `05_Departements/Departements.md`. Demande avant de figer.

---

## Étape 2 : Construire `01_About-Me/`

**Quand :** toujours en premier. C'est le coeur du second cerveau.

**3 fichiers, dans cet ordre :**

### 2a. about-me.md (qui vous êtes)
- Lis la section A.1 du guide.
- Présente le PROMPT 1 (cadrage), confirme la compréhension.
- PROMPT 2 : interview de 20 questions sur 6 axes (identité, façon de travailler, ce qui est bon, ce qu'on déteste, règles, convictions).
- **Recommande :** « Faites ça à la voix pendant une marche de 30 minutes, c'est plus naturel. »
- Une question à la fois, push-back si la réponse est vague.
- PROMPT 3 (synthèse) : produis `01_About-Me/about-me.md` (1500 mots max, structure du fichier existant). Demande une relecture rapide.

### 2b. my-company.md (snapshot business)
- Lis la section A.2 du guide. Même process en 3 prompts (8 questions sur 4 axes : offre active, objectifs 90 jours, focus actuel, anti-objectifs).
- Produis `01_About-Me/my-company.md`, daté. C'est la source de vérité sur l'offre et les prix : partout ailleurs, on pointe dessus.
- Rappelle : à mettre à jour tous les 1 à 3 mois.

### 2c. anti-ai-voice.md (fourni, à compléter)
- Le fichier est livré en version générique. Ne le régénère pas.
- Demande ses expressions orales (celles qu'on entend quand il parle) et ses mots bannis, et complète la section 7.

---

## Étape 3 : Construire les 5 fichiers de `02_Contexte/`

**Quand :** `01_About-Me/` complet.

**Règle critique :** chaque fichier suit le pattern 3-prompts (Cadrage, Interview, Synthèse) dans la **même conversation**. **Recommande** de ne faire qu'un ou deux fichiers par session : chaque interview prend 30 à 45 minutes.

**Ordre suggéré (du plus stable au plus volatile) :**

1. **Opinions-et-Valeurs.md** (guide B.1) : valeurs, non-négociables, prises de position. Très stable, revu tous les 12 mois.
2. **Tone-and-Voice.md** (B.5) : la voix. Demande des documents : posts, mails, transcripts.
3. **Offer-Positioning.md** (B.3) : offre actuelle, exclusions.
4. **Clients-Problems-and-Messages.md** (B.4), le plus stratégique. Demande en priorité des transcripts d'appels de vente et des verbatim clients. Dépose-les dans `07_Meeting/Clients/<Nom>/` (client signé) ou `07_Meeting/Prospects/YYYY-MM/` (prospect).
5. **Life-and-Work-Reality.md** (B.2) : contraintes réelles, rythme, modèle économique.

**Pour chaque fichier :**

1. Annonce le fichier et son rôle (une phrase).
2. Lis la section correspondante du guide pour récupérer les 3 prompts.
3. **PROMPT 1 (Cadrage)** : présente-le ou exécute-le, demande les documents existants.
4. Attends les documents (ou la confirmation qu'il n'y en a pas).
5. **PROMPT 2 (Interview)** : axes dans l'ordre, une question à la fois, push-back obligatoire.
6. Quand tous les axes sont couverts : « OK pour produire le fichier final ? »
7. **PROMPT 3 (Synthèse)** : écris `02_Contexte/<Nom>.md` en respectant la structure et les contraintes du prompt.
8. Demande une relecture : « Dites-moi ce qui sonne juste ou faux. On itère si besoin. »
9. Propose le fichier suivant.

---

## Étape 4 : Vos départements et vos projets

**Quand :** `about-me.md` et `Offer-Positioning.md` produits.

Les fiches de `05_Departements/` sont livrées avec une Mission et un Périmètre génériques et un Objectif `[à remplir]`.

**Département par département (dix minutes chacun) :**
1. Lis la fiche. Demande : « Cette Mission décrit-elle bien ce que ce département fait chez vous ? Qu'est-ce qui manque, qu'est-ce qui est en trop ? » Ajuste Mission et Périmètre avec ses mots.
2. Demande le chiffre qui dit que ce département fait son travail (rendez-vous par semaine, abonnés, clients signés par mois). Écris-le dans Objectif et dans le frontmatter `objectif:`. Sans chiffre, `[à remplir]` reste : `/lint` le rappellera.
3. Ne touche pas à Cadre sauf si l'utilisateur a des outils ou des règles à lui : une ligne.
4. Montre, fais valider, écris.

**Puis les projets.** Demande : « Quelles sont vos initiatives en cours qui ont une fin : un lancement, un event, un site, une offre à structurer ? » Trois maximum. Pour chacune : un dossier dans `04_Projets/`, sa note depuis `08_Ressources/templates/projet.md` (Mission, Cadre avec le département porteur, Étapes), et une ligne dans `04_Projets/Projets.md`. Montre, fais valider, écris.

---

## Étape 5 : Vos clients actifs

**Quand :** `Offer-Positioning.md` et `Clients-Problems-and-Messages.md` produits.

1. Demande : « Quels sont vos 3 clients les plus actifs en ce moment ? » Trois maximum, les autres viendront au fil de l'eau.
2. Par client, une conversation courte : qui c'est (secteur, taille), la mission et son prix, l'interlocuteur principal, comment il aime travailler, où en est la mission. Un document déposé (propale, compte rendu, transcript) remplace les questions.
3. Crée `06_Clients/<Nom>/<Nom>.md` depuis `08_Ressources/templates/client.md`, remplie avec ce qui a été dit. Ajoute une ligne dans `06_Clients/Clients.md`. Montre, fais valider, écris.

C'est la note que Claude lira avant tout travail pour ce client. Un transcript de call avec lui va dans `07_Meeting/Clients/<Nom>/`, et `/done` fait ruisseler ce qui s'y décide vers sa note.

---

## Étape 6 : Branding, ressources, veille

**Quand :** quelques fichiers de `02_Contexte/` produits.

1. `08_Ressources/` : demande s'il a des exemples de bons contenus à lui (posts, newsletters, mails) à déposer. Ils servent à calibrer la voix.
2. `03_Branding/` : s'il a une charte, des logos, des polices, dépose-les ici. Sinon, une ligne dans `03_Branding/charte-visuelle.md` avec ses couleurs et sa police suffit.
3. `08_Ressources/Veille/` : explique le wiki en deux phrases (voir `Veille.md`) et propose une première source à ingérer avec `/notes-permanentes`.
4. Rappelle la convention de nommage des livrables (`Nom-Sujet_YYYY-MM-DD.ext`, rangés selon la section 7 du `CLAUDE.md`) et la règle des notes : avant de travailler dans un dossier, on lit sa note.

---

## Étape 7 : Installer les skills recommandés

**Quand :** workspace en place. Ces skills ne sont pas dans le dossier : ils s'installent depuis leur dépôt GitHub, à ce moment-là. **Propose-les un par un, explique en une phrase à quoi ils servent, et n'installe rien sans le "oui" de l'utilisateur.** Montre la commande avant de la lancer. Si l'utilisateur dit non ou "plus tard", passe au suivant.

**Avant tout :** vérifie les prérequis avec `node --version` (22 ou plus), `ffmpeg -version`, `python3 --version` (3.10 ou plus), `git --version`, et la présence de Google Chrome (ou Brave, Chromium : il sert aux animations d'Editing OS et à l'export PDF de `/slide`). Dis ce qui manque et comment l'installer (`brew install node ffmpeg` et `brew install --cask google-chrome` sur Mac). Un mot de passe Mac demandé par une installation, c'est à l'utilisateur de le saisir : donne-lui la ligne à coller dans le Terminal.

**Prévenir une fois :** ces installations se font au niveau de l'utilisateur (dans `~/.claude/skills`), pas dans ce dossier. Elles restent donc disponibles dans tous ses projets.

### 7a. HyperFrames (écrire du HTML, rendre de la vidéo)

Dépôt : https://github.com/heygen-com/hyperframes (licence Apache 2.0). Sert à fabriquer des vidéos, des titres animés et des overlays en HTML. Prérequis : Node.js 22 ou plus, FFmpeg.

```bash
claude plugin marketplace add heygen-com/hyperframes
claude plugin install hyperframes@hyperframes
```

**Ne lance pas `npx hyperframes skills update` ni `npx skills add` sans prévenir** : ces commandes réécrivent `~/.claude/skills` et peuvent **supprimer des skills HyperFrames plus anciens** que l'utilisateur a déjà. Si l'utilisateur en a déjà (vérifie avec `ls ~/.claude/skills | grep hyperframes`), propose d'abord de les sauvegarder.

Vérification : après un redémarrage de Claude Code, la commande `/hyperframes:hyperframes` est disponible.

### 7b. claude-seo (GEO, le SEO pour l'ère de l'IA)

Dépôt : https://github.com/zubair-trabzada/geo-seo-claude (licence MIT). Sert à auditer un site pour qu'il soit cité par ChatGPT, Claude, Perplexity et Google AI Overviews. Commandes : `/geo audit <url>`, `/geo quick <url>`, `/geo report <url>`. Prérequis : Python 3.10 ou plus, Git.

Le dépôt est celui d'un tiers : **télécharge-le, lis `install.sh` et résume-le à l'utilisateur avant de l'exécuter** (ne pas faire `curl ... | bash` à l'aveugle).

```bash
git clone https://github.com/zubair-trabzada/geo-seo-claude.git /tmp/geo-seo-claude
less /tmp/geo-seo-claude/install.sh
cd /tmp/geo-seo-claude && ./install.sh
```

L'installeur place le skill dans `~/.claude/skills/geo/` avec son propre environnement Python isolé. Vérification : `/geo quick <un site de l'utilisateur>`.

### 7c. find-skills (trouver et installer un skill)

Déjà inclus dans `10_Skills/find-skills/` : rien à installer. Vérifie qu'il est présent et dis à l'utilisateur de taper `/find-skills` (ou "existe-t-il un skill pour ...") quand il cherche une capacité.

### 7d. Editing OS (montage vidéo, dans les ressources)

Déjà inclus dans `08_Ressources/Editing-OS/` : c'est un système de montage vidéo piloté par Claude Code (un rush face caméra devient un reel monté, avec sous-titres karaoké et sound design). Il s'appuie sur HyperFrames (7a). Il ne s'installe pas ici : explique en deux phrases ce que c'est et renvoie vers `08_Ressources/Editing-OS/COMMENCE-ICI.md`. Pour l'utiliser, l'utilisateur ouvre ce dossier comme projet dans Claude Code et demande : « Installe tout ce dont ce système a besoin pour tourner, puis vérifie que tout est bon. »

### Récapitulatif

```
Skills recommandés :
- hyperframes     [installé / à faire plus tard / refusé]
- claude-seo      [installé / à faire plus tard / refusé]
- find-skills     inclus
- Editing OS      inclus (08_Ressources/Editing-OS/)
```
Note ce récapitulatif dans la note du jour avec `/done`. Si un skill est refusé, ne le reproposes pas dans la même session.

---

## Étape 8 : Connecter les MCP

**Quand :** workspace fonctionnel, l'utilisateur veut étendre.

1. Lis la section C du guide.
2. Présente la hiérarchie : MCP natifs, puis fichiers locaux, puis navigateur, puis Computer Use.
3. Demande ses 3 à 5 outils prioritaires.
4. Connecte-les un par un avec `/connect-mcp <nom>`.
5. Ajoute au `CLAUDE.md` une section "MCP connectés" : nom, usage (lecture ou écriture), actions qui demandent une confirmation explicite.

**Garde-fou :** audit des permissions, lecture seule par défaut, jamais d'envoi automatique, un MCP à la fois.

---

## Étape 9 : Créer le premier skill

**Quand :** l'utilisateur a fait une tâche 2 ou 3 fois à la main et veut l'automatiser.

**Règle d'or :** jamais de skill from scratch. On fait la tâche à la main plusieurs fois, puis on crée le skill.

1. Lis la section D du guide.
2. Synthèse : tâche en une phrase, inputs, étapes, outputs, variations, règles. Fais-la valider.
3. Lance `/create-skill` : il cadre, teste sur un cas réel et crée `10_Skills/<nom>/SKILL.md`.

---

## Étape 10 : Poser les rituels

**Quand :** infra complète.

1. Lis la section E du guide et présente la cadence de mise à jour par fichier.
2. Présente les rituels, un par un, avec la phrase à taper : `/done` en fin de chaque session (c'est lui qui garde le cerveau vivant), `/weekly-review` le vendredi, `/lint` une fois par mois, `/inbox-processor` quand l'Inbox déborde, `/import` pour un gros lot, `/daily-review` le soir pour ceux qui aiment. Présente aussi `/map-process` (cartographier ses tâches et voir quoi automatiser), `/fiche-process`, `/ameliorer-skill` et `/slide`.
3. Aide à les poser dans l'agenda : hebdo (vendredi, 10 min), mensuel (30 min : `/lint` puis relire `my-company.md`), trimestriel (1 h : relire `02_Contexte/`).
4. Lance `/done` sur cette session : c'est la première entrée du journal.

---

## Erreurs à signaler activement

- L'utilisateur veut créer un skill sans avoir fait la tâche à la main avant.
- Il veut donner accès à tout son disque dur (proposer un dossier dédié).
- Un fichier de `02_Contexte/` a été produit sans interview (résultat vague garanti).
- Une même information (prix, offre) est écrite à deux endroits.

---

## Checklist finale (quand l'utilisateur dit "j'ai fini")

```
Second cerveau : état final

Setup
- [ ] Claude Code installé, PowerOS cloné dans un dossier dédié
- [ ] Arborescence vérifiée

Fondations (chargées chaque session)
- [ ] 01_About-Me/about-me.md
- [ ] 01_About-Me/my-company.md
- [ ] 01_About-Me/anti-ai-voice.md (section 7)

Cerveau (chargé à la demande)
- [ ] Opinions-et-Valeurs.md
- [ ] Tone-and-Voice.md
- [ ] Offer-Positioning.md
- [ ] Clients-Problems-and-Messages.md
- [ ] Life-and-Work-Reality.md

Workspace
- [ ] Les cinq fiches de 05_Departements/ relues, Objectif rempli
- [ ] Projets en cours dans 04_Projets/, chacun avec sa note
- [ ] Clients actifs dans 06_Clients/, chacun avec sa note
- [ ] 03_Branding/ et 08_Ressources/ initiés

Connectivité
- [ ] Skills recommandés proposés (HyperFrames, claude-seo)
- [ ] 3 à 5 MCP connectés et documentés dans CLAUDE.md
- [ ] Au moins 1 skill créé

Rituels
- [ ] /done lancé sur cette session
- [ ] Hebdo, mensuel, trimestriel posés dans l'agenda
```

Quand la checklist est verte : "Votre second cerveau est en place. Demandez-moi : Où en est-on sur mes projets ?"

---

## Reprise de session

Avec un argument (ex "étape 3" ou "contexte"), va directement à l'étape demandée après avoir vérifié l'état des lieux. Avec "reprends là où on s'était arrêté", fais le diagnostic initial et déduis la prochaine étape.
