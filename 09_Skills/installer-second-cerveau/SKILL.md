---
name: installer-second-cerveau
description: "Initialise le second cerveau de l'utilisateur en une décharge guidée de 45 min à 1 h 30 : prélude pédagogique, nom de l'IA, puis six blocs (qui vous êtes, offres, projets, clients, votre moment, comment je vous parle). À chaque bloc, Claude demande d'abord des exemples (profil LinkedIn, site, propales, derniers mails, posts) et en déduit le maximum avant de poser des questions. Reformulation, clarification, validation d'un récapitulatif, puis génération de 01_About-Me/, 02_Contexte/, des notes de projets et de clients et de la note du jour. Se déclenche sur \"Installe mon second cerveau\", \"construire mon second cerveau\", \"créer mon cerveau IA\", \"on commence\", \"je démarre\", \"reprends l'installation\", ou tout premier message d'un utilisateur dont 01_About-Me/about-me.md contient encore [à remplir]."
argument-hint: "[optionnel : bloc pour reprendre, ex \"offres\" ou \"approfondir\"]"
user-invocable: true
context: main
---

# Installer mon second cerveau

**Objectif :** que Claude connaisse le métier, les offres, les clients et la voix de l'utilisateur, et sache où ranger ce qu'il produit.

**Le workspace existe déjà.** L'arborescence, le `CLAUDE.md`, les fichiers de `01_About-Me/` et `02_Contexte/` sont présents avec des `[à remplir]`, chaque dossier de travail a sa note. Ce skill ne crée pas la structure, il la remplit.

**Durée :** 45 min à 1 h 30 pour l'installation, puis des approfondissements au fil des semaines. Vouvoiement, jamais de tiret cadratin ni demi-cadratin.

**Le principe :** on récupère d'abord, on questionne ensuite. Chaque bloc commence par une demande d'exemples concrets. Claude les lit en entier, en déduit tout ce qu'il peut (reverse engineering), montre ce qu'il a compris, et ne pose des questions que sur ce qui manque. L'utilisateur doit avoir le moins possible à écrire.

---

## Étape 0 : Diagnostic

Avant tout :

1. Lis `01_About-Me/` et `02_Contexte/`. Un fichier est « à faire » s'il contient encore `[à remplir]`. Liste `03_Projets/` et `05_Clients/`. Regarde la section `## Identité` de `CLAUDE.md`.
2. Vérifie que les skills sont chargés : la section 2 du `CLAUDE.md` décrit le contrôle de `.claude/skills/` et la réparation sous Mac et sous Windows. Si ce n'est pas encore fait, fais-le maintenant, puis demande de fermer et rouvrir la session.
3. Si tout est vide : passe au prélude. Si une partie est remplie (reprise) : affiche l'état en quelques lignes et propose de reprendre au premier bloc incomplet.

Format de l'état des lieux (reprise seulement) :
```
Où on en est :
- Identité (CLAUDE.md)            faite / à faire
- Qui vous êtes (about-me.md)     fait / à faire
- Offres (my-company, Offer)      fait / à faire
- Projets                         2 notes
- Clients                         aucun
- Votre moment                    à faire
- Comment je vous parle           à faire
Prochaine étape : bloc « Offres »
```

---

## Étape 1 : Prélude pédagogique

Dis-le en conversant, avec vos mots, sans réciter :

**Où on est.** Ce dossier est votre second cerveau : un dossier que Claude lit avant chaque tâche. Plus tard, vous pourrez ouvrir d'autres projets à côté (un site, une app, un dossier client), Claude les retrouvera depuis le même endroit.

**Le deal, en trois temps.**
1. Je vous présente ce qu'on met en place et pourquoi (5 min).
2. Vous me donnez de la matière : vos documents d'abord, vos réponses ensuite (30 à 60 min, on peut s'arrêter et reprendre).
3. Je remplis vos fichiers, après votre validation.

Vous pouvez répondre à l'écrit, à la voix (dictée), ou me déposer des documents et des liens à chaque étape.

**Pourquoi un second cerveau.** Sans contexte, une IA donne des réponses génériques et réinvente la roue à chaque demande. Avec votre contexte, elle connaît vos offres, vos clients et votre façon d'écrire, et elle travaille dans votre cadre. Qualité de l'IA = qualité du contexte × qualité du modèle.

**On range par utilité, pas par thème.** La bonne question n'est pas « de quoi ça parle ? » mais « à quoi ça sert ? ».

| Dossier | Ce qu'il contient |
|---|---|
| `00_Livrables/` | Tout ce que Claude produit pour vous, un sous-dossier par type. `Z_Inbox/` pour ce que vous déposez en vrac. |
| `01_About-Me/` | Qui vous êtes, votre activité, vos règles d'écriture. Lu à chaque session. |
| `02_Contexte/` | Votre offre, votre voix, votre réalité de travail, vos valeurs, votre branding. Lu selon la tâche. |
| `03_Projets/` | Ce qui a une fin : un lancement, un site, un événement. |
| `04_Departements/` | Ce qui n'a pas de fin : Stratégie, Marketing, Vente, Produit, Finance. |
| `05_Clients/` | Un dossier par client signé. |
| `06_Meeting/` | Les transcripts de vos appels. |
| `07_Ressources/` | Modèles, veille, Editing OS. |
| `08_Journal/` | Le journal de bord, écrit en fin de session. |
| `09_Skills/` | Les compétences de Claude. |
| `10_Archives/` | Terminé ou remplacé, toujours accessible. |

**Trois choses à ne pas confondre.** Un projet a une fin. Un département n'en a pas. Un client est une mission signée (un prospect vit dans Vente).

**La règle des livrables.** Tout ce que Claude produit va dans `00_Livrables/<Type>/`. Exception : un livrable pour un client signé va dans `05_Clients/<Client>/`.

**Les deux mémoires.**

| Mémoire | Où | Quoi |
|---|---|---|
| Le savoir durable | `CLAUDE.md`, `01_About-Me/`, `02_Contexte/` | qui vous êtes, vos règles, vos offres, les faits établis |
| L'historique daté | `08_Journal/` | ce qui s'est passé, quand, pourquoi |

En fin de session, vous tapez `/done` : Claude écrit le journal du jour et met à jour les notes. Le vendredi, `/weekly-review` fait le bilan de la semaine.

**Le principe qu'on ne lâche pas.** On amplifie ce que vous faites déjà, on ne vous invente pas de nouvelles habitudes.

Termine par : « Des questions avant de commencer ? Sinon, on attaque par vous. » Attends une réponse.

---

## Étape 2 : Nommer

Pose ces trois questions, avant tout le reste :
1. « Comment voulez-vous que je vous appelle ? »
2. « Et moi, comment voulez-vous m'appeler ? Vous pouvez donner un nom à votre IA. »
3. « Vous travaillez sur Mac ou sur Windows ? » (Vérifie toi-même avec `uname` ou la variable `OS` ; la question sert à confirmer et à rassurer.) La réponse fixe les commandes que tu donneras ensuite : `brew` et `python3` sur Mac, `winget`, PowerShell et `py` sous Windows.

Note les réponses. Le prénom et le nom de l'IA vont dans la section `## Identité` de `CLAUDE.md`, jamais dans `about-me.md`. Le système (Mac ou Windows) va dans `02_Contexte/Life-and-Work-Reality.md`, avec les outils.

---

## Étapes 3 à 8 : les six blocs

Chaque bloc suit le même déroulé :

1. **Annonce** le bloc en une phrase.
2. **Demande les exemples** listés pour ce bloc. Précise qu'un seul suffit et que « je n'ai rien » est une réponse valable.
3. **Lis tout** ce qui est déposé, en entier. Un lien : lis la page (Firecrawl ou navigateur intégré). Si la page est inaccessible (LinkedIn bloque souvent les robots), demande à l'utilisateur de copier-coller le texte ou d'exporter son profil en PDF.
4. **Montre ce que tu as déduit**, en 5 à 10 lignes : « Voici ce que j'ai compris. Qu'est-ce qui est faux ou manque ? »
5. **Pose seulement les questions qui restent**, une par une. Suis l'énergie : une question qui tombe à plat, passe ; une réponse riche, creuse.
6. **Reformule** en 2 ou 3 phrases denses, fais valider, passe au bloc suivant.

Rappelle à chaque bloc qu'on peut déposer un document ou répondre à la voix.

### Étape 3 : Qui vous êtes

**Exemples à demander :**
- L'URL de votre profil LinkedIn (ou son export PDF : « Plus » puis « Enregistrer au format PDF » sur votre profil).
- Votre site internet, sa page « à propos ».
- Un CV, une bio, une présentation que vous utilisez déjà.

**Ce que tu en déduis :** parcours (dates, entreprises, rôles, tournants), expertise, chiffres publics (années d'expérience, clients cités, audience), positionnement affiché.

**Questions qui restent (une par une) :**
1. « Racontez-moi votre parcours : les étapes clés, les tournants, les chiffres. » Pousse vers le précis : pas « j'ai lancé une boîte » mais « j'ai lancé X en 2019, 20 k€ de CA la première année, seul jusqu'en 2021 ».
2. « Comment fonctionnez-vous ? Vos forces, vos faiblesses, comment vous décidez (analyse, intuition, avis des autres), comment vous gérez le stress. » Si l'utilisateur connaît un test de personnalité (MBTI, PCM, DISC), note-le ; ne l'impose pas.
3. « Sur quels sujets pourriez-vous parler des heures ? Quelles sont vos convictions dans votre métier ? » Pousse vers le précis : pas « la tech » mais « l'IA appliquée à la prospection des indépendants ».

**Alimente :** `01_About-Me/about-me.md` (Qui je suis, avec le parcours, Comment je travaille).

### Étape 4 : Vos offres

Annonce : « Maintenant ce que vous vendez. Une offre se vend, a un prix et se délivre. Si vous n'en avez pas encore, dites-le, on passe. »

**Exemples à demander :**
- 2 ou 3 propositions commerciales envoyées à des clients (même anciennes).
- Votre page de vente, votre grille tarifaire, un devis, une facture type.
- Le lien de prise de rendez-vous ou le formulaire par lequel les clients arrivent.

**Ce que tu en déduis (reverse engineering) :** les offres réelles et leur nom, les prix pratiqués (et leurs écarts d'un client à l'autre), le format (durée, sessions, livrables), le client type, le vocabulaire utilisé, les garanties, les modes de paiement. Signale les incohérences entre documents (« la propale de mars dit 1 500 €, la page de vente 1 900 € : lequel est à jour ? »).

**Puis :** liste les offres avec l'utilisateur. Pour chacune, ouvre avec : « Parlez-moi de [Offre]. C'est quoi concrètement, vous la vendez à qui, à quel prix ? » Banque d'inspiration (pas une checklist) :
- Ce que le client achète, en une phrase.
- Le client type, sa situation, ce qui le pousse à acheter.
- Le prix, le paiement, les financements possibles.
- Ce qui est inclus : livrables, sessions, accès, durée.
- Comment le client arrive jusqu'à vous et comment il signe.
- Ce que « bien vendre cette offre » veut dire : volume, marge, satisfaction.
- Les partenaires, prestataires et outils impliqués.
- Ce qui bloque ou coûte trop d'énergie aujourd'hui.

**Alimente :** `01_About-Me/my-company.md` (Offres : la source de vérité des prix) et `02_Contexte/Offer-Positioning.md`.

### Étape 5 : Vos projets

Annonce : « Vos projets en cours ou à venir. Rappel : un projet a une fin, même floue. »

**Exemples à demander :** une to-do, un plan, un tableau de suivi, une note de cadrage, un rétroplanning.

**Puis :** liste les projets (3 maximum pour l'installation, les autres viendront). Pour chacun : « Parlez-moi de [Projet]. De quoi il s'agit, où vous en êtes, qu'est-ce que vous visez ? » Banque d'inspiration :
- Pourquoi vous le faites, vous, personnellement.
- Ce que vous livrez ou vendez à la fin.
- L'échéance.
- Qui travaille dessus avec vous, et qui fait quoi.
- Où vous en êtes exactement, la prochaine étape.
- Ce qui bloque.

Si une « initiative » n'a pas de fin, c'est un département : dis-le et range-la dans le bon dossier.

**Alimente :** `03_Projets/<Nom>/<Nom>.md` et `03_Projets/Projets.md`.

### Étape 6 : Vos clients

Annonce : « Vos clients. On crée un dossier par client signé. »

**Exemples à demander :**
- Les propositions signées, les contrats, les récapitulatifs de mission.
- Des comptes rendus ou transcripts d'appels avec des clients ou des prospects.
- Un export de votre CRM (Notion, Airtable, HubSpot, un tableur).

**Ce que tu en déduis :** qui sont les clients actifs, ce qui leur a été vendu et à quel prix, où en est chaque mission, les problèmes qu'ils décrivent et leurs mots exacts.

**Questions qui restent :**
1. « Vos clients actifs : nom, entreprise, ce que vous leur avez vendu, où en est la relation ? » (3 détaillés maximum.)
2. « Vous avez un CRM ? Lequel ? » S'il existe, préviens : on pourra le brancher plus tard avec `/connect-mcp`. Avertis : les bases CRM sont souvent polluées par des comptes rendus de réunion importés automatiquement ; il faudra d'abord repérer la base qui porte vraiment le pipeline.

Les transcripts déposés vont dans `06_Meeting/Clients/<Nom>/` (client signé) ou `06_Meeting/Prospects/AAAA-MM/` (prospect).

**Alimente :** `05_Clients/<Nom>/<Nom>.md`, `05_Clients/Clients.md`, l'outil CRM dans le Cadre de `04_Departements/Vente/Vente.md`, et un premier niveau de `02_Contexte/Clients-Problems-and-Messages.md` (problèmes, mots des clients, objections) s'il y a de la matière.

### Étape 7 : Votre moment

Annonce : « Où vous en êtes aujourd'hui : votre cap, vos contraintes, ce que vous refusez. »

**Exemples à demander :** vos objectifs écrits (trimestre, année), un tableau de bord, votre agenda type d'une semaine.

**Questions qui restent :**
1. « Quel est votre focus des 3 prochains mois ? Vos objectifs concrets, chiffrés si possible ? »
2. « Vos contraintes réelles : combien d'heures par semaine pour votre activité, votre budget outils, vos obligations ? »
3. « Que faites-vous quand vous êtes débordé, dispersé, ou au contraire dans le flow ? » Utile pour que Claude vous aide au bon moment.
4. « À quoi dites-vous non : clients, missions, canaux, façons de travailler ? »

**Alimente :** `01_About-Me/my-company.md` (Objectifs, Focus actuel, Ce à quoi je dis non) et `02_Contexte/Life-and-Work-Reality.md`. Les objectifs chiffrés par département vont dans l'Objectif de la fiche concernée de `04_Departements/`.

### Étape 8 : Comment je vous parle

Annonce : « Dernier bloc : comment vous écrivez, comment vous voulez que je vous parle, ce qui guide vos choix. »

**Exemples à demander (le plus important de l'installation) :**
- **Vos 5 derniers mails** écrits à des clients, prospects ou partenaires (copiez-collez le texte, sans les pièces jointes).
- 2 ou 3 posts, newsletters ou articles que vous avez écrits.
- Un message LinkedIn ou WhatsApp typique envoyé à un client.

**Ce que tu en déduis :** tutoiement ou vouvoiement, longueur des phrases et des paragraphes, formules d'ouverture et de fin, expressions qui reviennent, niveau de langue, ponctuation, emojis ou non, ce qu'il n'écrit jamais, la structure de ses posts. Montre 5 à 8 traits concrets, chacun avec une citation tirée de ses textes.

**Questions qui restent :**
1. « Vos valeurs et vos lignes rouges : ce qui guide vos choix. 3 à 5 lignes. »
2. « Comment voulez-vous que je vous parle ? Tutoiement ou vouvoiement, ton (direct, chaleureux, cash), et voulez-vous que je vous challenge ou que j'exécute ? »
3. « Des interdits d'écriture ? Emojis, tirets cadratins, jargon, longueur. Et vos expressions à vous, celles qu'on entend quand vous parlez ? »
4. « Vos heures de travail profond et le rythme de votre semaine ? »

**Alimente :** `02_Contexte/Tone-and-Voice.md` (avec les traits et 2 ou 3 extraits courts de ses textes comme exemples), section 7 de `01_About-Me/anti-ai-voice.md`, `02_Contexte/Opinions-et-Valeurs.md`, `about-me.md` (Ce qui est bon, Ce que je déteste, Mes règles, Instructions pour Claude), le rythme dans `Life-and-Work-Reality.md`.

Dès que le style de l'utilisateur est connu, applique-le dans la suite de la conversation.

---

## Étape 9 : Analyse et reformulation

Relis toutes les réponses et tous les documents des blocs 3 à 8. Présente une synthèse courte :
- Qui est l'utilisateur, en 2 ou 3 phrases denses.
- Son focus du moment.
- Ses offres, avec nom et prix.
- Ses projets actifs, avec un pitch d'une phrase.
- Ses clients et l'état de son CRM.
- Sa voix, en 3 traits.
- Les documents déposés et ce que tu en as concrètement extrait.

---

## Étape 10 : Questions de clarification

Pose 2 à 5 questions ciblées, pas plus :
- Les informations manquantes ou contradictoires (deux prix pour la même offre, deux dates).
- Ce qui est flou et bloquerait un fichier propre.
- Les arbitrages : « "Formation" est un projet ou un département ? », « ce client est signé ou encore prospect ? ».

---

## Étape 11 : Validation finale

Montre le récapitulatif complet et demande un « oui » explicite avant d'écrire quoi que ce soit :

```
Voici ce que je vais écrire :

Identité
- CLAUDE.md, section Identité        → nom de l'IA « [Nom IA] », votre prénom

Vous (lu à chaque session)
- 01_About-Me/about-me.md            → qui vous êtes, parcours, façon de travailler, règles, instructions pour moi
- 01_About-Me/my-company.md          → offres et prix, objectifs, focus, ce à quoi vous dites non (daté)
- 01_About-Me/anti-ai-voice.md       → section 7 : vos expressions et vos interdits

Votre contexte (lu selon la tâche)
- 02_Contexte/Offer-Positioning.md   → [X] offres
- 02_Contexte/Tone-and-Voice.md      → votre voix, tirée de vos mails et posts
- 02_Contexte/Opinions-et-Valeurs.md → valeurs et lignes rouges
- 02_Contexte/Life-and-Work-Reality.md → contraintes, rythme, modèle économique
- 02_Contexte/Clients-Problems-and-Messages.md → premier niveau (si matière)

Projets ([Y])
- 03_Projets/[Projet]/[Projet].md

Clients ([C])
- 05_Clients/[Client]/[Client].md
- 06_Meeting/... pour les transcripts déposés

Départements
- Objectif de [Département] (si un chiffre a été donné)

Journal
- 08_Journal/[AAAA-MM-JJ].md         → la session d'initialisation

Je confirme ? Répondez « oui » ou dites-moi ce qu'on ajuste.
```

---

## Étape 12 : Génération

Uniquement après le « oui ». Écris dans cet ordre, en conservant la structure et les titres de chaque fichier existant (remplace les `[à remplir]`, ne supprime pas les sections). Ajoute sous le titre de chaque fichier de `02_Contexte/` écrit une ligne `maj : AAAA-MM-JJ`.

1. **`CLAUDE.md`, section `## Identité`** : nom de l'IA, prénom de l'utilisateur. Rien d'autre dans cette section.
2. **`01_About-Me/about-me.md`** : titre `# ABOUT ME : [Prénom Nom]`. Qui je suis (dont le parcours chronologique, enrichi des documents), Comment je travaille, Ce qui est bon, Ce que je déteste, Mes règles, Instructions pour Claude (style capturé à l'étape 8). Jamais le nom de l'IA ici.
3. **`01_About-Me/my-company.md`** : `maj :` à la date du jour, Objectifs, Offres, Focus actuel, Ce à quoi je dis non.
4. **`01_About-Me/anti-ai-voice.md`** : section 7 seulement (expressions, interdits). Ne régénère pas le reste.
5. **`02_Contexte/`** : Offer-Positioning, Tone-and-Voice, Opinions-et-Valeurs, Life-and-Work-Reality, et Clients-Problems-and-Messages s'il existe et s'il y a de la matière. Le prix vit dans `my-company.md` : `Offer-Positioning.md` y renvoie au lieu de le recopier.
6. **Projets** : pour chacun, `03_Projets/<Nom>/<Nom>.md` depuis `07_Ressources/templates/projet.md` (Mission, Cadre avec le département porteur, Étapes, Où on en est), et une ligne dans `03_Projets/Projets.md`.
7. **Clients** : pour chacun, `05_Clients/<Nom>/<Nom>.md` depuis `07_Ressources/templates/client.md`, une ligne dans `05_Clients/Clients.md`. Range les documents déposés dans le dossier du client, les transcripts dans `06_Meeting/`.
8. **Départements** : l'Objectif (et le frontmatter `objectif:`) des fiches pour lesquelles un chiffre a été donné. L'outil CRM dans le Cadre de `Vente.md`.
9. **Journal** : `08_Journal/AAAA-MM-JJ.md` depuis `07_Ressources/templates/journal-jour.md`, avec en fin de fichier :

```markdown
## Sessions avec Claude

### Session [HH:MM] : initialisation du second cerveau

**Demandé :**
- Initialiser le second cerveau et remplir le contexte

**Fait :**
- `about-me.md`, `my-company.md`, `anti-ai-voice.md` (section 7) écrits
- [N] fichiers de `02_Contexte/` remplis
- [X] offres, [Y] projets, [C] clients
- Nom de l'IA enregistré dans `CLAUDE.md` : « [Nom IA] »
- Documents analysés : [liste courte]

**Décisions :**
- [arbitrages pris pendant l'installation]

**Reste à faire :**
- [ ] Relire les fichiers de `01_About-Me/` et corriger ce qui sonne faux
- [ ] Approfondir `Tone-and-Voice.md` et `Clients-Problems-and-Messages.md` (installation, bloc « approfondir »)
- [ ] Lancer `/map-process` pour repérer les tâches à automatiser
```

**Ne jamais inventer.** Un chiffre, une date, un prix qui n'a pas été donné ou lu dans un document reste `[à remplir]`.

---

## Étape 13 : Confirmation et suite

Récapitule ce qui a été écrit (une ligne par fichier), puis donne trois consignes :
1. Tapez `/done` à la fin de chaque session de travail : c'est ce qui garde votre second cerveau vivant.
2. Tout ce que je produis ira dans `00_Livrables/<Type>/`.
3. Testez-moi : ouvrez une nouvelle session et demandez « Où en est-on sur mes projets ? ».

**Puis propose les outils vidéo et animation.** Commence par rassurer : « Votre second cerveau est installé et fonctionne. Ce qui suit est optionnel : ce sont des outils pour le montage vidéo et les animations, par exemple des slides animées, des titres ou des reels montés automatiquement. Vous pouvez les installer maintenant, plus tard, ou jamais, ça ne change rien à ce qu'on vient de faire. »

Si l'utilisateur dit oui, suis le point 4 de la liste ci-dessous, dans cet ordre, un outil à la fois, avec son accord avant chaque commande :
1. Les prérequis manquants (Node 22, FFmpeg, Chrome ou Edge), avec les commandes de son système.
2. **HyperFrames** : écrire des vidéos et des animations en HTML.
3. **Editing OS** : déjà dans `07_Ressources/Editing-OS/`, il s'appuie sur HyperFrames. Explique qu'il se lance comme un projet à part : ouvrir le dossier `07_Ressources/Editing-OS/` dans l'onglet Code de l'application Claude, puis écrire « Installe tout ce dont ce système a besoin pour tourner, puis vérifie que tout est bon ». Le guide est dans `07_Ressources/Editing-OS/COMMENCE-ICI.md`. Sous Windows, préviens que ce système est surtout testé sur Mac : au moindre blocage, Claude le dira et proposera une solution.

À la fin, vérifie et dis ce qui est installé, en une ligne par outil. Ensuite, propose **un seul** autre approfondissement, au choix de l'utilisateur, pour maintenant ou plus tard (liste ci-dessous).

---

## Après l'installation : approfondir (un à la fois, quand l'utilisateur le veut)

Avec l'argument « approfondir », fais le diagnostic puis propose cette liste :

1. **Voix et clients en profondeur** : interview complète de `Tone-and-Voice.md` (guide B.5) et de `Clients-Problems-and-Messages.md` (guide B.4), à partir de plus de textes et de transcripts. Les prompts sont dans `references/guide-complet.md` : lis seulement la section utile.
2. **Départements** : relire la Mission et le Périmètre de chaque fiche de `04_Departements/` avec l'utilisateur, ajouter ou retirer un département selon son métier (un dossier, sa fiche depuis `07_Ressources/templates/departement.md`, une ligne dans `Departements.md`).
3. **Branding** : charte, logos, polices dans `02_Contexte/Branding/` (sinon une ligne dans `charte-visuelle.md` avec couleurs et police). Exemples de bons contenus dans `07_Ressources/`.
4. **Skills recommandés** : à proposer un par un, rien sans le « oui » de l'utilisateur, commande montrée avant de la lancer.
   - Prérequis : `node --version` (22 ou plus), `ffmpeg -version`, `python3 --version` (sous Windows : `py --version`, 3.10 ou plus), `git --version`, Google Chrome (ou Edge, Brave, Chromium). Sur Mac : `brew install node ffmpeg` et `brew install --cask google-chrome`. Sous Windows (PowerShell) : une commande par outil manquant, `winget install --id OpenJS.NodeJS.LTS -e`, `winget install --id Gyan.FFmpeg -e`, `winget install --id Python.Python.3.12 -e`, `winget install --id Git.Git -e`, puis fermer et rouvrir l'application Claude. Un mot de passe ou une fenêtre d'autorisation demandés par une installation sont validés par l'utilisateur.
   - Ces installations se font dans `~/.claude/skills`, pas dans ce dossier.
   - **HyperFrames** (vidéo en HTML, https://github.com/heygen-com/hyperframes) : `claude plugin marketplace add heygen-com/hyperframes` puis `claude plugin install hyperframes@hyperframes`. Ne lance jamais `npx hyperframes skills update` ni `npx skills add` sans prévenir : ces commandes réécrivent `~/.claude/skills` et peuvent supprimer des skills existants. Si `ls ~/.claude/skills | grep hyperframes` renvoie quelque chose, propose d'abord une sauvegarde.
   - **claude-seo** (GEO, https://github.com/zubair-trabzada/geo-seo-claude) : `git clone https://github.com/zubair-trabzada/geo-seo-claude.git ~/geo-seo-claude`, lis `install.sh` et résume-le avant de lancer `cd ~/geo-seo-claude && ./install.sh` (sous Windows, dans Git Bash : c'est un script bash). Vérification : `/geo quick <site>`.
   - **find-skills** : déjà inclus dans `09_Skills/find-skills/`.
   - **Editing OS** : déjà inclus dans `07_Ressources/Editing-OS/`, s'appuie sur HyperFrames. Renvoie vers `07_Ressources/Editing-OS/COMMENCE-ICI.md`.
5. **Outils (MCP)** : guide section C. Hiérarchie : MCP natifs, puis fichiers locaux, puis navigateur, puis Computer Use. 3 à 5 outils prioritaires, un à la fois avec `/connect-mcp`, lecture seule par défaut, jamais d'envoi automatique. Ajoute au `CLAUDE.md` une section « MCP connectés » (nom, usage, actions qui demandent une confirmation).
6. **Premier skill** : guide section D. Jamais de skill sans avoir fait la tâche deux ou trois fois à la main. `/map-process` pour repérer les tâches, `/fiche-process` pour en documenter une, `/create-skill` pour la transformer.
7. **Rituels** : guide section E. `/done` en fin de session, `/weekly-review` le vendredi, `/lint` une fois par mois, `/inbox-processor` quand `Z_Inbox/` déborde, `/import` pour un gros lot, `/daily-review` le soir pour ceux qui aiment. À poser dans l'agenda : hebdo (vendredi, 10 min), mensuel (30 min : `/lint` puis relire `my-company.md`), trimestriel (1 h : relire `02_Contexte/`).

---

## Règles

- Ne jamais écrire avant la validation de l'étape 11.
- Toujours demander des exemples avant de poser des questions, et lire en entier tout document déposé avant d'en extraire quoi que ce soit.
- Montrer ce qu'on a déduit d'un document avant de l'utiliser.
- Reformuler après chaque réponse pour valider la compréhension.
- Rappeler à chaque bloc qu'on peut déposer un document ou répondre à la voix.
- Ne jamais inventer : ni chiffre, ni date, ni prix, ni client. Si une information manque, la demander ou laisser `[à remplir]`.
- Appliquer le style capturé à l'étape 8 dès qu'il est connu.
- Une même information (prix, offre) vit à un seul endroit.

## Ce que vous ne faites pas

- Sauter le prélude : l'utilisateur doit comprendre ce qu'il construit.
- Écrire les fichiers sans validation finale.
- Mettre le nom de l'IA dans `about-me.md` : il va dans `CLAUDE.md`.
- Confondre projet, département et client.
- Poser les questions personnelles hors activité (santé, famille, patrimoine) : ce second cerveau est professionnel.
- Créer quoi que ce soit à la racine en dehors de `CLAUDE.md` et `README.md`.
- Proposer un département, un projet ou un fichier sans demander d'abord.

---

## Reprise de session

Avec un argument (« offres », « clients », « approfondir »), fais le diagnostic puis va directement au bloc demandé. Avec « reprends l'installation », fais le diagnostic et reprends au premier bloc incomplet. Les réponses déjà validées dans une session précédente sont dans les fichiers : ne les redemande pas.
