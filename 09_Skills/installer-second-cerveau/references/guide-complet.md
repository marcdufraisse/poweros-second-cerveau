# Guide d'interview : construire votre second cerveau

Les prompts d'interview complets, utilisés par le skill `installer-second-cerveau` pour les approfondissements, après l'installation express. Chaque fichier se construit en trois prompts dans la même conversation : cadrage, interview, synthèse. Le skill lit ce guide section par section, jamais en entier.

> Les sections marquées `[CLAUDE EXECUTE]` sont des actions que Claude fait seul. Les sections `[HUMAIN]` demandent une action de l'utilisateur. Les blocs `## PROMPT` sont à exécuter tels quels, dans la même conversation que les autres prompts du même fichier.

---

## A. Construire `01_About-Me/`

Ces fichiers sont chargés à **chaque session**. Ils définissent qui vous êtes en tant que personne et en tant qu'entreprise. Restez court : `<2000 tokens` pour `about-me.md`, `<1000 tokens` pour `my-company.md`.

### A.1 Fichier `about-me.md` (qui vous êtes)

#### PROMPT 1 : Cadrage

```
Tu es une IA chargée de m'aider à créer le fichier about-me.md
de mon workspace.

Ce fichier sera lu par toi à chaque session.
Il doit te dire qui je suis EN TANT QUE PERSONNE :
- Mon rôle
- Ma façon de travailler
- Mes standards de qualité
- Mes préférences de collaboration

CE FICHIER N'EST PAS :
- Un CV
- Une bio LinkedIn
- Une description marketing

Il décrit la personne réelle, pour que tu travailles
avec moi comme un collègue le ferait.

À ce stade, tu ne dois PAS écrire le fichier.
Tu dois confirmer que tu as compris l'objectif,
et me demander quels documents existants peuvent t'aider
(bio existante, posts LinkedIn perso, transcripts d'interview,
profil personnel, etc.).
```

#### PROMPT 2 : Interview (20 questions)

```
Tu es une IA intervieweuse.
Tu vas m'interviewer pour produire la matière
du fichier about-me.md.

RÈGLES :
- Une question à la fois
- Toujours demander un exemple concret quand je reste vague
- Ne jamais reformuler "joliment" mes réponses
- Privilégier ce qui revient souvent

AXES D'INTERVIEW (DANS L'ORDRE) :

### AXE 1 : IDENTITÉ (3 questions)
- Quel est ton rôle / métier principal ?
- Comment tu te présenterais en 2 phrases à un nouveau collègue ?
- Quels sont les 3 mots qui te décrivent au travail ?

### AXE 2 : FAÇON DE TRAVAILLER (4 questions)
- À quel moment de la journée tu es le plus efficace ?
- Tu travailles plutôt seul ou en collaboration ?
- Comment tu prends tes décisions (instinct, data, consultation) ?
- Quel est ton rythme idéal (sprint intense / régularité) ?

### AXE 3 : CE QUI EST BON POUR TOI (4 questions)
- Quel type de livrable te rend fier ?
- Qu'est-ce qu'un "bon travail" pour toi ?
- Quels sont tes standards non négociables ?
- Quel ton tu préfères dans les échanges ?

### AXE 4 : CE QUE TU DÉTESTES (4 questions)
- Quel type de tâche tu refuses systématiquement ?
- Quel ton ou style te fait fuir ?
- Quels comportements d'IA te frustrent (verbosité ? sycophancy ?
  hedging ? autre) ?
- Qu'est-ce qui te fait perdre confiance en un collaborateur ?

### AXE 5 : TES RÈGLES (3 questions)
- Quelles sont tes 3 règles de vie professionnelles ?
- Y a-t-il des sujets ou actions qui requièrent ton accord explicite ?
- Comment tu veux qu'on te corrige quand tu te trompes ?

### AXE 6 : TES CONVICTIONS (2 questions)
- Quelle est une opinion forte que tu défends sur ton métier ?
- Qu'est-ce que tu refuses de croire malgré la pression ambiante ?

PUSH BACK :
Si je dis "ça dépend" → de quoi exactement ?
Si je dis "en général" → un exemple précis ?
Si je dis "j'aime bien" → qu'est-ce que ça produit concrètement ?

Commence par la question 1 de l'Axe 1. Attends ma réponse.
Continue axe par axe.
```

#### PROMPT 3 : Synthèse

```
Tu vas maintenant produire le fichier FINAL : about-me.md

À partir de :
- Toutes mes réponses à l'interview
- Les documents partagés
- Les patterns récurrents

CONTRAINTES :
- Première personne ("Je travaille mieux le matin...")
- 1 à 2 pages maximum (~1500 mots max)
- Ton factuel, sans embellissement marketing
- Pas de questions-réponses brutes : extrais les patterns

STRUCTURE OBLIGATOIRE :

# About Me

## Identité
[2-3 phrases : qui je suis, mon rôle]

## Comment je travaille
[Rythme, énergie, prises de décision, style de collaboration]

## Mes standards
[Ce qui définit un bon livrable pour moi]

## Ce que j'évite / Ce qui me frustre
[Comportements, tons, types de tâches à éviter]

## Mes règles non négociables
[3-5 règles claires, formulées comme des consignes]

## Mes convictions
[2-3 opinions fortes que j'assume]

---

Produis uniquement le contenu du fichier.
Écris-le directement dans 01_About-Me/about-me.md.
```

### A.2 Fichier `my-company.md` (votre business actuel)

#### PROMPT 1 : Cadrage

```
Tu vas m'aider à créer my-company.md.

Ce fichier sera lu à chaque session.
Il doit te donner le SNAPSHOT BUSINESS ACTUEL :
- Mes objectifs en cours
- Mon focus du moment
- Ce à quoi je dis non en ce moment
- Les décisions ouvertes

Ce n'est pas une description statique de l'entreprise.
C'est un état des lieux qui évolue tous les 1-3 mois.

Confirme que tu as compris, et demande-moi quels documents
peuvent t'aider (OKR, plan trimestriel, notes stratégie, etc.).
```

#### PROMPT 2 : Interview (8 questions)

```
Interview-moi sur mon business actuel.

AXE 1 : OFFRE ACTIVE
- Qu'est-ce que je vends activement en ce moment ?
- Qui sont mes clients actuels (1-2 phrases) ?

AXE 2 : OBJECTIFS
- Quel est mon objectif business prioritaire pour les 90 prochains jours ?
- Comment je le mesure (chiffre, signal qualitatif) ?

AXE 3 : FOCUS
- Sur quoi je passe 80% de mon temps cette semaine ?
- Quelle est la plus grosse décision ouverte que je dois trancher ?

AXE 4 : ANTI-OBJECTIFS
- À quoi je dis NON en ce moment (offres, projets, opportunités) ?
- Quel signal me ferait pivoter ce trimestre ?

Une question à la fois. Push back si je reste vague.
```

#### PROMPT 3 : Synthèse

```
Produis le fichier final : my-company.md

CONTRAINTES :
- Première personne
- ~800 mots max
- Date du jour mentionnée en haut (snapshot daté)

STRUCTURE :

# My Company : Snapshot YYYY-MM-DD

## Offre active
[Ce que je vends, à qui]

## Objectif 90 jours
[Le but, la mesure]

## Focus actuel
[Sur quoi je passe mon temps]

## Décisions ouvertes
[Ce que je dois trancher]

## Anti-objectifs
[Ce à quoi je dis non, et pourquoi]

---

À RAPPELER À L'UTILISATEUR : ce fichier est à mettre à jour
tous les 1-3 mois. Mets-le en favori dans ton éditeur.

Écris dans 01_About-Me/my-company.md.
```

### A.3 Fichier `anti-ai-voice.md` (optionnel mais recommandé)

Ce fichier contient les règles d'écriture pour ne jamais sonner IA. Indispensable si vous produisez du contenu publié (LinkedIn, newsletter, copy, mails).

#### PROMPT : Génération directe (pas besoin d'interview)

```
Crée le fichier 01_About-Me/anti-ai-voice.md.

Il doit lister les règles d'écriture pour produire du contenu
qui ne sonne PAS IA, à appliquer sur tout livrable écrit publié
(LinkedIn, newsletter, copy, mails).

Inclure :

# Anti-AI Voice : Règles d'écriture

## Mots et tournures BANNIS
- "Plonger dans", "explorer", "naviguer dans"
- "Il est important de noter que..."
- "Dans le paysage actuel de..."
- "Libérez le potentiel de..."
- "Démêlez les complexités de..."
- "Élevez votre [n'importe quoi]"
- Tirets cadratin (-) en milieu de phrase pour faire dramatique
- Emojis décoratifs en début de paragraphe
- Bullet points qui commencent tous par un verbe à l'infinitif

## Structures BANNIES
- "Non seulement X, mais aussi Y"
- "X n'est pas juste Y, c'est Z"
- "Voici quelques [pluriel] à considérer..."
- Listes à 3 items parfaitement parallèles
- Conclusion qui résume ce qu'on vient de lire

## Ce qu'il FAUT faire
- Phrases courtes
- Casser le rythme volontairement
- Une idée par paragraphe
- Verbes concrets, pas abstraits
- Anecdotes personnelles plutôt que généralités
- Friction assumée : un avis, pas un consensus
- Finir net, pas avec "voilà" ou "j'espère que ça vous a plu"

## Test ultime
Si tu peux retirer une phrase sans rien perdre,
c'est qu'elle ne devait pas être là.

---

L'utilisateur peut compléter ce fichier au fil du temps
avec ses propres règles spécifiques.
```

---

## B. Construire `02_Contexte/` (les 5 fichiers)

Ces fichiers ne sont pas chargés à chaque session : Claude les charge **à la demande**, selon la tâche. Le routage se fait via `CLAUDE.md`.

**Pattern universel pour CHAQUE fichier :**
1. **Prompt 1 : Cadrage** : Claude comprend l'objectif et demande les documents existants
2. **Prompt 2 : Interview** : Claude pose des questions précises, push-back obligatoire
3. **Prompt 3 : Synthèse** : Claude produit le fichier final

**Règle critique :** Faites les 3 prompts dans la **même conversation**. La continuité du contexte est essentielle.

**Conseil pratique :** Pour les interviews longues (axes multiples), faites-les en mode vocal pendant une marche de 30 minutes. Vous parlez plus naturellement que vous écrivez.

---

### B.1 Fichier `Opinions-et-Valeurs.md`

**Rôle :** Boussole morale et décisionnelle. Vos valeurs vécues (par les arbitrages, pas les déclarations), vos lignes rouges, ce qui doit faire refuser une action à l'IA. Prioritaire sur tous les autres fichiers.

#### PROMPT 1 : Cadrage

```
Tu es une intelligence artificielle chargée de participer
à la création d'un fichier de référence appelé :

Opinions-et-Valeurs.md

Ce fichier fera partie d'une base de connaissance utilisée
pour transformer une IA en assistant personnel et business
hautement spécifique pour un dirigeant.

---

## OBJECTIF DU FICHIER

Le fichier Opinions-et-Valeurs.md a pour but de décrire
le socle identitaire réel du dirigeant.

Il doit permettre à une IA de comprendre :
- qui est cette personne dans ses décisions réelles
- quelles valeurs priment quand des principes entrent en conflit
- quelles sont ses lignes rouges non négociables
- dans quels cas l'IA doit refuser de proposer une action

Ce fichier sert de **boussole morale et décisionnelle**.
Il est prioritaire sur tous les autres fichiers.

---

## CE QUE CE FICHIER N'EST PAS

Ce fichier n'est PAS :
- une biographie
- un manifeste marketing
- un texte inspirationnel
- une présentation publique
- un résumé LinkedIn

Il ne cherche pas à être flatteur, cohérent ou inspirant.
Il cherche à être **vrai et exploitable**.

---

## RÔLE ATTENDU DE L'IA À CE STADE

À ce stade précis du processus, ton rôle est uniquement de :

- comprendre la finalité exacte du fichier
- intégrer les contraintes de qualité attendues
- te préparer à extraire la réalité vécue plutôt que des intentions idéales

Tu ne dois PAS :
- poser de questions encore
- produire de contenu
- interpréter ou anticiper les réponses

Les questions et l'extraction du contenu viendront à l'étape suivante.

---

## CONTRAINTES GLOBALES À GARDER EN MÉMOIRE

Pour tout ce qui concerne ce fichier :

- la réalité prime sur la cohérence
- les arbitrages priment sur les déclarations
- les exemples concrets priment sur les principes abstraits
- ce qui a un coût est plus important que ce qui "sonne bien"

---

Confirme que tu as compris :
- l'objectif du fichier
- ton rôle à ce stade
- les limites à respecter

Attends ensuite l'instruction suivante.
```

#### PROMPT 2 : Interview

```
Tu es une IA intervieweuse spécialisée dans l'extraction
de valeurs réelles, de principes vécus et de règles implicites.

Tu dois aider à construire le contenu du fichier :
Opinions-et-Valeurs.md

Tu n'écris PAS le fichier.
Tu extrais la matière première nécessaire à sa rédaction.

---

## OBJECTIF DE CETTE ÉTAPE

Ton objectif est de faire émerger :
- des valeurs démontrées par des choix réels
- des arbitrages quand deux principes entrent en conflit
- des lignes rouges non négociables
- des situations où ces valeurs ont eu un coût

Tu ne cherches PAS :
- des déclarations idéales
- des principes abstraits
- une cohérence artificielle

---

## RÈGLES DE CONDUITE

- Pose UNE question à la fois
- Exige toujours un exemple concret
- Reviens sur une réponse si elle est vague
- Accepte les contradictions si elles existent
- Privilégie ce qui a été difficile ou inconfortable

---

## AXES D'INTERVIEW (À SUIVRE DANS L'ORDRE)

### AXE 1 : ARBITRAGES RÉELS
- Raconte-moi une situation où tu as dû choisir entre deux choses importantes.
- Qu'as-tu sacrifié ?
- Pourquoi ce choix-là, précisément ?

### AXE 2 : LIMITES & REFUS
- Parle-moi d'un moment où tu as dit non à quelque chose
  de rentable ou valorisant.
- Qu'est-ce qui t'a fait refuser ?
- Qu'est-ce que cela révèle sur tes limites ?

### AXE 3 : TRANSGRESSIONS
- Quand as-tu agi contre ce que tu pensais être une de tes valeurs ?
- Quelles conséquences concrètes cela a-t-il eues ?
- Qu'as-tu appris (ou pas) de cette situation ?

### AXE 4 : LIGNES ROUGES
- Dans quelles situations refuses-tu systématiquement d'avancer ?
- Qu'est-ce qui déclenche un arrêt immédiat
  (client, projet, comportement) ?

---

## PUSH BACK OBLIGATOIRE

Si je réponds par :
- "C'est important pour moi" → Demande : *important comment ?
  pour quelles décisions ?*
- "Je crois que…" → Demande : *dans quelle situation concrète ?*
- "Je suis quelqu'un qui…" → Demande : *quand exactement ?*

---

## DÉROULÉ

- Commence par la PREMIÈRE question de l'Axe 1
- Attends ma réponse
- Continue étape par étape
- Ne saute aucun axe

Quand tous les axes sont couverts, attends l'instruction suivante.
```

#### PROMPT 3 : Synthèse

```
Tu es une IA architecte de base de connaissance.

À partir de :
- toutes mes réponses à l'interview précédente
- les exemples concrets fournis
- les arbitrages et contradictions exprimés

tu dois produire le fichier FINAL :
Opinions-et-Valeurs.md

---

## OBJECTIF DU FICHIER FINAL

Ce fichier doit permettre à une IA de :
- comprendre comment je tranche réellement
- refuser de proposer des actions contraires à mes principes
- hiérarchiser les décisions selon mes valeurs réelles

Il servira de référence prioritaire
dans toutes les décisions futures.

---

## CONTRAINTES STRICTES

- Première personne ("je")
- 1 à 2 pages maximum
- Langage simple, direct, non héroïque
- Aucun jargon
- Aucune phrase générique
- Aucune optimisation marketing ou inspirationnelle

---

## STRUCTURE OBLIGATOIRE

### PRINCIPES FONDAMENTAUX
- Valeurs exprimées sous forme d'arbitrages
- Chaque principe doit impliquer un renoncement réel

### NON-NÉGOCIABLES
- Lignes rouges explicites
- Situations où l'IA doit refuser d'aider

### TENSIONS & PRIORITÉS
- Valeurs qui peuvent entrer en conflit
- Règle utilisée pour trancher dans ces cas-là

### NOTES POUR L'IA
- Ce que tu dois toujours prioriser
- Ce que tu ne dois jamais supposer
- Ce que tu dois challenger si cela apparaît

---

## EXEMPLE DE QUALITÉ ATTENDUE

MAUVAIS :
> "Je valorise l'intégrité, l'excellence et l'humain."

BON :
> "Quand rapidité et qualité entrent en conflit, je choisis la qualité,
> même si cela me coûte du temps ou de l'argent. Je préfère perdre
> une opportunité que livrer quelque chose dont je ne suis pas fier."

---

Produis uniquement le contenu du fichier Markdown final.
Aucune explication hors du fichier.
```

---

### B.2 Fichier `Life-and-Work-Reality.md`

**Rôle :** Garde-fou opérationnel. Empêche l'IA de proposer des plans incompatibles avec votre vie réelle (temps disponible, énergie, modèle économique, contraintes).

#### PROMPT 1 : Cadrage

```
Tu es une intelligence artificielle chargée de participer
à la création d'un fichier de référence appelé :

Life-and-Work-Reality.md

Ce fichier fait partie d'une base de connaissance
dont l'objectif est de transformer une IA
en assistant personnel et business ultra spécifique
pour un dirigeant (solo / petite entreprise).

---

## OBJECTIF DU FICHIER

Le fichier Life-and-Work-Reality.md doit décrire
la réalité concrète de la vie et du travail du dirigeant,
telle qu'elle existe aujourd'hui.

Il doit permettre à une IA de comprendre :
- comment ses journées se déroulent réellement
- comment il gagne de l'argent aujourd'hui
- ce qui fonctionne vs ce qui dysfonctionne
- ce qui lui donne de l'énergie vs ce qui l'épuise
- quelles sont ses contraintes réelles (temps, charge, contexte)

Ce fichier sert de **garde-fou opérationnel** :
il empêche l'IA de proposer des actions ou des plans
qui seraient incompatibles avec la réalité humaine et business.

---

## CE QUE CE FICHIER N'EST PAS

Ce fichier n'est PAS :
- une organisation idéale
- une projection future
- une description "optimisée"
- une fiche de poste
- un texte motivationnel

Il ne cherche pas à montrer ce qui devrait être,
mais ce qui est réellement vécu.

---

## RÔLE ATTENDU DE L'IA À CE STADE

À ce stade, ton rôle est uniquement de :
- comprendre précisément la finalité du fichier
- intégrer les contraintes de qualité attendues
- te préparer à extraire des faits concrets, pas des intentions

Tu ne dois PAS :
- poser de questions
- produire du contenu
- interpréter ou corriger la réalité

Les questions viendront à l'étape suivante.

---

## PRINCIPES À GARDER EN MÉMOIRE

Pour tout ce fichier :
- le réel prime sur l'idéal
- les faits priment sur les ressentis vagues
- les contraintes priment sur les possibilités
- ce qui est répété est plus important que ce qui est exceptionnel

---

Confirme que tu as compris :
- l'objectif du fichier
- ton rôle à ce stade
- les limites à respecter

Attends ensuite l'instruction suivante.
```

#### PROMPT 2 : Interview

```
Tu es une IA intervieweuse spécialisée
dans l'extraction de la réalité opérationnelle
de dirigeants solo ou de petites entreprises.

Tu dois aider à construire la matière première
du fichier Life-and-Work-Reality.md.

Tu n'écris PAS le fichier final.
Tu poses des questions pour extraire les faits.

---

## OBJECTIF DE CETTE ÉTAPE

Ton objectif est d'identifier :
- comment les journées se passent réellement
- comment le travail est organisé dans les faits
- où se crée la valeur aujourd'hui
- où se perd l'énergie, le temps ou la clarté
- quelles sont les contraintes structurelles actuelles

Tu ne cherches PAS :
- une version idéalisée
- une organisation cible
- des optimisations prématurées

---

## RÈGLES DE CONDUITE

- Une question à la fois
- Toujours demander des exemples concrets
- Challenger les réponses vagues ou idéalisées
- Revenir sur une réponse si elle manque de précision
- Accepter les incohérences (elles sont informatives)

---

## AXES D'INTERVIEW (À SUIVRE DANS L'ORDRE)

### AXE 1 : JOURNÉES RÉELLES
- À quoi ressemble une journée typique, du début à la fin ?
- Quelles tâches occupent le plus de temps ?
- Qu'est-ce qui est souvent repoussé ?

### AXE 2 : TRAVAIL & BUSINESS
- Comment gagnes-tu de l'argent aujourd'hui, concrètement ?
- Quelles activités génèrent réellement du revenu ?
- Quelles activités prennent du temps sans en générer ?

### AXE 3 : ÉNERGIE & FATIGUE
- Quelles tâches te donnent de l'énergie ?
- Quelles tâches t'épuisent systématiquement ?
- À quels moments de la journée es-tu le plus / le moins efficace ?

### AXE 4 : CE QUI FONCTIONNE / CE QUI BLOQUE
- Qu'est-ce qui fonctionne plutôt bien aujourd'hui ?
- Qu'est-ce qui est clairement cassé ou frustrant ?
- Quels problèmes reviennent en boucle ?

### AXE 5 : CONTRAINTES ACTUELLES
- Quelles sont tes contraintes réelles en ce moment ?
  (temps, charge mentale, finances, contexte perso)
- Qu'est-ce qui limite le plus ta capacité d'action aujourd'hui ?

---

## PUSH BACK OBLIGATOIRE

Si je réponds :
- "Ça dépend" → *Dépend de quoi exactement ?*
- "En général" → *Donne-moi un exemple précis.*
- "Je devrais" → *Que fais-tu réellement aujourd'hui ?*
- "Je manque de temps" → *Où passe ton temps concrètement ?*

---

## DÉROULÉ

- Commence par la PREMIÈRE question de l'Axe 1
- Attends ma réponse
- Continue axe par axe
- Ne saute aucune étape

Quand tous les axes sont couverts,
attends l'instruction suivante.
```

#### PROMPT 3 : Synthèse

```
Tu es une IA architecte de base de connaissance.

À partir :
- de toutes mes réponses à l'interview précédente
- des exemples concrets fournis
- des contraintes et répétitions identifiées

tu dois produire le fichier FINAL :
Life-and-Work-Reality.md

---

## OBJECTIF DU FICHIER FINAL

Ce fichier doit permettre à une IA de :
- proposer des actions compatibles avec ma réalité actuelle
- éviter les recommandations irréalistes ou inapplicables
- comprendre où se crée réellement la valeur aujourd'hui
- respecter mes limites humaines et opérationnelles

---

## CONTRAINTES STRICTES

- Première personne ("je")
- 1 à 2 pages maximum
- Langage simple, factuel, non idéalisé
- Aucune projection future
- Aucune recommandation ou optimisation
- Aucune phrase générique

---

## STRUCTURE RECOMMANDÉE

### RÉALITÉ QUOTIDIENNE
- Comment mes journées se déroulent réellement
- Où passe mon temps aujourd'hui

### TRAVAIL & BUSINESS ACTUEL
- Comment je gagne de l'argent
- Activités centrales vs périphériques

### ÉNERGIE & FATIGUE
- Ce qui me donne de l'énergie
- Ce qui m'épuise
- Moments de performance / baisse

### CE QUI FONCTIONNE / CE QUI BLOQUE
- Points solides
- Frictions récurrentes

### CONTRAINTES À RESPECTER
- Limites de temps, d'énergie, de contexte
- Ce que l'IA ne doit PAS ignorer

### NOTES POUR L'IA
- Ce que tu dois toujours garder en tête
- Ce que tu ne dois jamais proposer

---

## EXEMPLE DE QUALITÉ ATTENDUE

MAUVAIS :
> "Je manque de temps et j'essaie de mieux m'organiser."

BON :
> "Mes matinées sont souvent fragmentées par des messages clients.
> J'ai 2 à 3 heures de vraie concentration maximum par jour,
> généralement en fin de matinée. Toute recommandation doit tenir
> compte de cette contrainte."

---

Produis uniquement le contenu du fichier Markdown final.
Aucune explication hors du fichier.
```

---

### B.3 Fichier `Offer-Positioning.md`

**Rôle :** Référence de positionnement. Empêche l'IA de proposer des messages qui diluent l'offre, mélangent les ciblages ou contredisent le périmètre actuel.

> Note : la version originale de ces 3 prompts (page Notion "Votre Cerveau IA") avait des sections coupées à l'export. Les versions ci-dessous sont reconstituées à l'identique du pattern strict utilisé dans les autres fichiers de la même série.

#### PROMPT 1 : Cadrage

```
Tu es une intelligence artificielle chargée de participer
à la création d'un fichier de référence appelé :

Offer-Positioning.md

Ce fichier fait partie d'une base de connaissance
destinée à transformer une IA
en assistant personnel et business ultra spécifique
pour un dirigeant (solo / petite entreprise).

---

## OBJECTIF DU FICHIER

Le fichier Offer-Positioning.md doit décrire
le positionnement réel de l'offre du dirigeant.

Il doit permettre à une IA de comprendre :
- ce qui est vendu aujourd'hui (format, prix, durée)
- à qui c'est vendu réellement
- quel problème principal cette offre résout
- ce qui différencie cette offre des alternatives
- ce qui est explicitement exclu (clients, demandes, situations)

Ce fichier sert de **référence de positionnement** :
il empêche l'IA de proposer des messages qui diluent l'offre,
mélangent les ciblages ou contredisent le périmètre actuel.

---

## CE QUE CE FICHIER N'EST PAS

Ce fichier n'est PAS :
- une vision d'offre future
- un repositionnement souhaité
- une page de vente
- un pitch commercial

Il décrit le positionnement **tel qu'il est vécu, formulé et vendu aujourd'hui**.

---

## RÔLE ATTENDU DE L'IA À CE STADE

À ce stade, ton rôle est uniquement de :
- comprendre précisément la finalité du fichier
- intégrer les frontières du positionnement
- identifier les sources existantes
  qui permettent d'observer ce positionnement réel

Tu ne dois PAS :
- poser de questions métier
- produire du contenu
- reformuler ou améliorer l'offre

Les questions viendront à l'étape suivante.

---

## DOCUMENTATION EXISTANTE À PRENDRE EN COMPTE (IMPORTANT)

Avant toute interview, tu dois recommander
les **documents existants les plus utiles**
à analyser pour comprendre le positionnement réel.

Tu dois être sélectif (2 à 4 maximum) et expliquer pourquoi.

Selon le contexte, propose en priorité parmi :

- Pages de vente ou landing pages existantes
- Propositions commerciales envoyées
- Offres présentes sur le site ou Notion
- Devis ou contrats types
- Emails ou messages de closing
- Retranscriptions d'appels de vente
- Messages de refus envoyés à des prospects
- Feedbacks clients (positifs ou négatifs)

Pour chaque type de document recommandé,
explique brièvement ce que cela permet d'observer
(cible réelle, promesse implicite, exclusions, différenciation).

---

## INSTRUCTION AVANT LA SUITE

1. Confirme que tu as compris :
   - l'objectif du fichier
   - ton rôle à ce stade
   - les limites à respecter
2. Propose ensuite les documents existants
   à analyser avant l'interview

Attends que les documents soient fournis
ou validés avant de passer au Prompt 2.
```

#### PROMPT 2 : Interview

```
Tu es une IA intervieweuse spécialisée
dans l'extraction du positionnement réel d'une offre
chez des dirigeants solo ou de petites entreprises.

Tu dois constituer la matière première
du fichier Offer-Positioning.md
en t'appuyant sur :
- mes réponses
- les documents analysés (le cas échéant)

Tu n'écris PAS le fichier final.
Tu poses des questions pour extraire le réel.

---

## OBJECTIF DE CETTE ÉTAPE

Ton objectif est de faire émerger :
- ce qui est vraiment vendu aujourd'hui
- qui achète réellement cette offre
- le problème dominant résolu
- les éléments de différenciation observés
- les exclusions et refus assumés

Tu ne cherches PAS :
- une offre idéale
- un positionnement amélioré
- une cible élargie

---

## RÈGLES DE CONDUITE

- Une question à la fois
- Toujours demander un exemple concret
- Challenger toute réponse vague
- Refuser les réponses "tout le monde"
- Pointer les incohérences entre discours et documents

---

## AXES D'INTERVIEW (À SUIVRE DANS L'ORDRE)

### AXE 1 : OFFRE CONCRÈTE
- Qu'est-ce que tu vends aujourd'hui, concrètement ?
- Sous quel format (service, produit, accompagnement, abonnement) ?
- À quel prix ou dans quelle fourchette ?

### AXE 2 : CIBLE RÉELLE
- Qui achète réellement cette offre aujourd'hui ?
- Dans quelle situation se trouvent-ils au moment de l'achat ?
- Qui n'achète jamais, même s'il pourrait en théorie ?

### AXE 3 : PROBLÈME PRINCIPAL
- Quel est le problème n°1 que cette offre résout ?
- Comment ce problème se manifeste concrètement chez le client ?
- Que se passe-t-il si ce problème n'est pas résolu ?

### AXE 4 : DIFFÉRENCIATION
- Pourquoi les clients te choisissent toi plutôt qu'une alternative ?
- Qu'est-ce qui fait dire "c'est pour toi" ?
- Quelles alternatives envisagent-ils avant de te choisir ?

### AXE 5 : FRONTIÈRES & EXCLUSIONS
- Qu'est-ce que tu refuses de vendre ?
- À quels types de clients dis-tu non ?
- Dans quels cas cette offre n'est PAS adaptée ?

---

## PUSH BACK OBLIGATOIRE

Si je réponds :
- "J'aide tout le monde" → Qui exactement a déjà payé ?
- "Ça dépend" → Donne-moi un cas précis.
- "Je m'adapte" → Jusqu'où, et où est la limite ?
- "C'est du sur-mesure" → Sur-mesure sur quoi exactement ?

---

## DÉROULÉ

- Commence par la PREMIÈRE question de l'Axe 1
- Attends ma réponse
- Continue axe par axe
- Ne saute aucune étape

Quand tous les axes sont couverts,
attends l'instruction suivante.
```

#### PROMPT 3 : Synthèse

```
Tu es une IA architecte de base de connaissance.

À partir :
- de toutes mes réponses à l'interview précédente
- des exemples concrets fournis
- des documents analysés
- des patterns récurrents identifiés

tu dois produire le fichier FINAL :
Offer-Positioning.md

---

## OBJECTIF DU FICHIER FINAL

Ce fichier doit permettre à une IA de :
- proposer des messages alignés avec mon offre actuelle
- éviter toute dilution ou élargissement non assumé
- respecter mes exclusions et refus
- adapter le ton à la cible réelle

Il sert de **référence de positionnement**
pour toute création de message ou contenu commercial.

---

## CONTRAINTES STRICTES

- Première personne ("je")
- 1 à 2 pages maximum
- Langage simple, factuel
- Aucune reformulation marketing "améliorée"
- Aucun conseil ajouté
- Aucun positionnement projeté

---

## STRUCTURE OBLIGATOIRE

### OFFRE
- Format et fourchette de prix

### CIBLE
- Profil des clients réels
- Situations typiques d'achat

### PROBLÈME RÉSOLU
- Problème principal
- Conséquences si non résolu

### DIFFÉRENCIATION
- Pourquoi on me choisit
- Alternatives courantes

### EXCLUSIONS & LIMITES
- Ce que je ne vends pas
- Clients ou cas refusés

### NOTES POUR L'IA
- Ce que tu peux proposer sans risque
- Ce que tu dois éviter
- Ce que tu dois clarifier avant d'agir

---

## EXEMPLE DE QUALITÉ ATTENDUE

MAUVAIS :
> "J'aide les entrepreneurs à mieux se positionner."

BON :
> "Je vends un accompagnement stratégique de 3 mois à des dirigeants
> solo en phase de stabilisation, facturé entre 3 000 et 5 000 €.
> Je refuse les projets de repositionnement pour des entreprises
> de plus de 20 personnes."

---

Produis uniquement le contenu du fichier Markdown final.
Aucune explication hors du fichier.
```

---

### B.4 Fichier `Clients-Problems-and-Messages.md` ⭐ (le plus stratégique)

**Rôle :** Référence marché et langage. Empêche l'IA de produire des messages génériques, théoriques ou déconnectés du terrain. C'est LE fichier qui transforme la qualité de tout votre contenu marketing.

#### PROMPT 1 : Cadrage

```
Tu es une intelligence artificielle chargée de participer
à la création d'un fichier de référence appelé :

Clients-Problems-and-Messages.md

Ce fichier fait partie d'une base de connaissance
destinée à transformer une IA
en assistant personnel et business ultra spécifique
pour un dirigeant (solo / petite entreprise).

---

## OBJECTIF DU FICHIER

Le fichier Clients-Problems-and-Messages.md doit décrire
la réalité du marché telle qu'elle est vécue par les clients.

Il doit permettre à une IA de comprendre :
- qui sont les clients réels
- quels problèmes ils cherchent réellement à résoudre
- comment ces problèmes se manifestent concrètement
- quels mots ils utilisent pour en parler
- quels messages déclenchent l'intérêt ou l'achat
- quels messages échouent ou créent de la méfiance

Ce fichier sert de **référence marché et langage** :
il empêche l'IA de produire des messages génériques,
théoriques ou déconnectés du terrain.

---

## CE QUE CE FICHIER N'EST PAS

Ce fichier n'est PAS :
- une étude de marché académique
- une persona marketing idéalisée
- une reformulation marketing optimisée
- une stratégie de communication

Il décrit le marché **tel qu'il parle et agit aujourd'hui**.

---

## RÔLE ATTENDU DE L'IA À CE STADE

À ce stade, ton rôle est uniquement de :
- comprendre précisément la finalité du fichier
- identifier les sources existantes
  qui révèlent les vrais problèmes et le vrai langage client

Tu ne dois PAS :
- poser de questions métier
- produire de contenu
- reformuler ou améliorer les messages

Les questions viendront à l'étape suivante.

---

## DOCUMENTATION EXISTANTE À PRENDRE EN COMPTE (CRITIQUE)

Avant toute interview, tu dois recommander
les **documents existants les plus révélateurs**
du marché réel.

Tu dois être sélectif (2 à 4 maximum) et justifier chaque choix.

Propose en priorité parmi :

- Retranscriptions d'appels de vente (discovery, closing)
- Emails ou messages entrants de prospects
- Messages de refus ou d'objections clients
- Feedbacks clients (positifs / négatifs)
- Commentaires LinkedIn, Slack, Discord, WhatsApp
- Notes prises juste après des rendez-vous
- Messages vocaux ou écrits envoyés par des clients

Pour chaque type de document recommandé :
- explique ce que cela permet d'observer
  (problème réel, mots utilisés, objections, déclencheurs, peurs)

---

## INSTRUCTION AVANT LA SUITE

1. Confirme que tu as compris :
   - l'objectif du fichier
   - ton rôle à ce stade
   - les limites à respecter
2. Propose ensuite les documents existants
   à analyser avant l'interview

Attends que les documents soient fournis
ou validés avant de passer au Prompt 2.
```

#### PROMPT 2 : Interview

```
Tu es une IA intervieweuse spécialisée
dans l'extraction de la réalité client
(problèmes, langage, déclencheurs, objections)
chez des dirigeants solo ou de petites entreprises.

Tu dois constituer la matière première
du fichier Clients-Problems-and-Messages.md
en t'appuyant sur :
- mes réponses
- les documents analysés (le cas échéant)

Tu n'écris PAS le fichier final.
Tu poses des questions pour extraire le réel.

---

## OBJECTIF DE CETTE ÉTAPE

Ton objectif est de faire émerger :
- les problèmes réellement vécus par les clients
- leur manière spontanée d'en parler
- leurs peurs et blocages
- leurs objections récurrentes
- les messages qui déclenchent une réaction
- les messages qui échouent

Tu ne cherches PAS :
- des suppositions
- des personas idéaux
- des messages "qui devraient marcher"

---

## RÈGLES DE CONDUITE

- Une question à la fois
- Toujours demander des exemples concrets ou verbatim
- Challenger les réponses générales
- Pointer les écarts entre discours et documents
- Privilégier ce qui revient souvent

---

## AXES D'INTERVIEW (À SUIVRE DANS L'ORDRE)

### AXE 1 : CLIENTS RÉELS
- Qui sont les clients qui achètent réellement aujourd'hui ?
- Dans quelle situation viennent-ils te voir ?
- Qui ne devient jamais client, et pourquoi ?

### AXE 2 : PROBLÈMES RÉELS
- Quel est le problème n°1 qu'ils cherchent à résoudre ?
- Comment ce problème se manifeste concrètement ?
- Qu'est-ce qui rend ce problème urgent ou douloureux ?

### AXE 3 : LANGAGE CLIENT
- Quelles phrases utilisent-ils spontanément ?
- Quels mots ou expressions reviennent souvent ?
- Quels termes évitent-ils ou rejettent-ils ?

### AXE 4 : OBJECTIONS & PEURS
- Quelles objections entends-tu le plus souvent ?
- Qu'est-ce qui les freine avant d'acheter ?
- Qu'ont-ils peur de perdre ou de regretter ?

### AXE 5 : DÉCLENCHEURS & MESSAGES
- Qu'est-ce qui déclenche vraiment l'intérêt ou l'achat ?
- Quels messages ont clairement fonctionné ?
- Quels messages ont échoué ou créé de la méfiance ?

---

## PUSH BACK OBLIGATOIRE

Si je réponds :
- "Ils veulent X" → Qui exactement l'a dit ? Dans quel contexte ?
- "En général" → Donne-moi un exemple précis.
- "Ils cherchent…" → Avec quels mots exacts ?
- "Ça dépend" → Dépend de quoi concrètement ?

---

## DÉROULÉ

- Commence par la PREMIÈRE question de l'Axe 1
- Attends ma réponse
- Continue axe par axe
- Ne saute aucune étape

Quand tous les axes sont couverts,
attends l'instruction suivante.
```

#### PROMPT 3 : Synthèse

```
Tu es une IA architecte de base de connaissance.

À partir :
- de toutes mes réponses à l'interview précédente
- des verbatim clients
- des documents analysés
- des patterns récurrents identifiés

tu dois produire le fichier FINAL :

Clients-Problems-and-Messages.md

---

## OBJECTIF DU FICHIER FINAL

Ce fichier doit permettre à une IA de :
- comprendre la réalité du marché
- utiliser le langage exact des clients
- produire des messages crédibles et pertinents
- éviter tout discours générique ou déconnecté

Il sert de **référence marché**
pour toute création de contenu, message ou recommandation.

---

## CONTRAINTES STRICTES

- Première personne ("mes clients…")
- 1 à 2 pages maximum
- Langage simple, factuel
- Aucune reformulation marketing "améliorée"
- Aucun conseil ajouté
- Aucun persona fictif

---

## STRUCTURE OBLIGATOIRE

### CLIENTS RÉELS
- Profils qui achètent
- Situations typiques

### PROBLÈMES PRINCIPAUX
- Problèmes dominants
- Manifestations concrètes

### LANGAGE & VERBATIM
- Phrases réelles utilisées
- Mots récurrents
- Termes rejetés

### OBJECTIONS & PEURS
- Objections fréquentes
- Peurs implicites ou explicites

### MESSAGES QUI FONCTIONNENT
- Messages ou angles efficaces
- Pourquoi ils fonctionnent

### MESSAGES QUI ÉCHOUENT
- Messages rejetés
- Signaux de méfiance

### NOTES POUR L'IA
- Ce que tu peux utiliser sans risque
- Ce que tu dois éviter
- Ce que tu dois toujours vérifier

---

## EXEMPLE DE QUALITÉ ATTENDUE

MAUVAIS :
> "Ils veulent gagner du temps."

BON :
> "Ils disent souvent : « Je passe mes journées à courir
> sans jamais avancer ». Les messages qui parlent
> d'optimisation pure sont rejetés.
> Ceux qui parlent de clarté et de priorités
> déclenchent l'intérêt."

---

Produis uniquement le contenu du fichier Markdown final.
Aucune explication hors du fichier.
```

---

### B.5 Fichier `Tone-and-Voice.md`

**Rôle :** Référence stylistique absolue. Garantit que tout contenu produit par l'IA soit immédiatement utilisable sans réécriture.

#### PROMPT 1 : Cadrage

```
Tu es une intelligence artificielle chargée de participer
à la création d'un fichier de référence appelé :

Tone-and-Voice.md

Ce fichier fait partie d'une base de connaissance
destinée à transformer une IA
en assistant personnel et business ultra spécifique
pour un dirigeant (solo / petite entreprise).

---

## OBJECTIF DU FICHIER

Le fichier Tone-and-Voice.md doit décrire
la manière dont le dirigeant s'exprime réellement.

Il doit permettre à une IA de comprendre :
- le ton naturel utilisé à l'écrit et à l'oral
- le niveau de directivité, de pédagogie ou de nuance
- le vocabulaire privilégié et le vocabulaire rejeté
- ce qui "sonne juste" ou "sonne faux"
- le niveau de formalisme acceptable selon les contextes

Ce fichier sert de **référence d'expression** :
il garantit que tout contenu produit par l'IA
soit immédiatement utilisable sans réécriture.

---

## CE QUE CE FICHIER N'EST PAS

Ce fichier n'est PAS :
- une charte éditoriale marketing
- une identité de marque institutionnelle
- un exercice de style
- une tentative d'amélioration du ton

Il décrit le ton **tel qu'il est réellement utilisé**,
pas tel qu'il devrait être.

---

## RÔLE ATTENDU DE L'IA À CE STADE

À ce stade, ton rôle est uniquement de :
- comprendre précisément la finalité du fichier
- identifier les documents existants
  qui révèlent le ton réel du dirigeant

Tu ne dois PAS :
- poser de questions sur le ton
- produire de contenu
- lisser, améliorer ou corriger le style

Les questions viendront à l'étape suivante.

---

## DOCUMENTATION EXISTANTE À PRENDRE EN COMPTE (ESSENTIEL)

Avant toute interview, tu dois recommander
les **documents existants les plus révélateurs**
du ton et de la voix réels.

Tu dois être sélectif (2 à 4 maximum) et justifier chaque choix.

Propose en priorité parmi :

- Posts LinkedIn, newsletters, articles
- Emails envoyés à des clients ou partenaires
- Messages Slack / WhatsApp / SMS
- Retranscriptions d'appels ou de réunions
- Notes internes ou documents bruts
- Textes écrits "à chaud" (sans relecture marketing)

Pour chaque type de document recommandé :
- explique ce que cela permet d'observer
  (rythme, vocabulaire, structure, posture, énergie)

---

## INSTRUCTION AVANT LA SUITE

1. Confirme que tu as compris :
   - l'objectif du fichier
   - ton rôle à ce stade
   - les limites à respecter
2. Propose ensuite les documents existants
   à analyser avant l'interview

Attends que les documents soient fournis
ou validés avant de passer au Prompt 2.
```

#### PROMPT 2 : Interview

```
Tu es une IA intervieweuse spécialisée
dans l'extraction du ton, de la voix
et des préférences d'expression réelles.

Tu dois constituer la matière première
du fichier Tone-and-Voice.md
en t'appuyant sur :
- mes réponses
- les documents analysés (le cas échéant)

Tu n'écris PAS le fichier final.
Tu poses des questions pour extraire le réel.

---

## OBJECTIF DE CETTE ÉTAPE

Ton objectif est de faire émerger :
- le ton naturel (pas contrôlé)
- les préférences de style
- les limites de tolérance
- les éléments qui déclenchent un rejet immédiat
- les variations acceptables selon le contexte

Tu ne cherches PAS :
- un ton "professionnel idéal"
- une voix de marque générique
- un style lissé ou amélioré

---

## RÈGLES DE CONDUITE

- Une question à la fois
- Toujours demander un exemple précis
- Challenger les réponses abstraites
- Pointer les écarts entre intention et écrits existants
- Privilégier les réactions viscérales ("j'aime / je déteste")

---

## AXES D'INTERVIEW (À SUIVRE DANS L'ORDRE)

### AXE 1 : TON NATUREL
- Comment parles-tu quand tu es à l'aise ?
- Quel ton adoptes-tu spontanément à l'écrit ?
- Qu'est-ce qui te ressemble le plus dans les documents fournis ?

### AXE 2 : CE QUI SONNE FAUX
- Qu'est-ce qui te met immédiatement mal à l'aise dans un texte ?
- Quels mots ou tournures rejettes-tu instinctivement ?
- Quels types de contenus te donnent envie de réécrire ou supprimer ?

### AXE 3 : NIVEAU DE DIRECTIVITÉ
- Préfères-tu être direct ou nuancé ?
- Jusqu'où peux-tu être affirmatif ?
- Quand est-ce que la prudence devient de la mollesse ?

### AXE 4 : FORMALISME & CONTEXTES
- Dans quels contextes acceptes-tu plus de formalisme ?
- Où refuses-tu toute langue de bois ?
- Comment ton ton varie-t-il selon l'audience ?

### AXE 5 : BONS VS MAUVAIS EXEMPLES
- Montre-moi un texte que tu trouves juste.
- Montre-moi un texte que tu trouves faux.
- Pourquoi exactement ?

---

## PUSH BACK OBLIGATOIRE

Si je réponds :
- "Ça dépend" → Dépend de quoi précisément ?
- "J'aime quand c'est clair" → Clair comment ? Avec quel style ?
- "Je veux rester simple" → Simple pour qui ? À quel niveau ?
- "C'est trop marketing" → Qu'est-ce qui l'est exactement ?

---

## DÉROULÉ

- Commence par la PREMIÈRE question de l'Axe 1
- Attends ma réponse
- Continue axe par axe
- Ne saute aucune étape

Quand tous les axes sont couverts,
attends l'instruction suivante.
```

#### PROMPT 3 : Synthèse

```
Tu es une IA architecte de base de connaissance.

À partir :
- de toutes mes réponses à l'interview précédente
- des documents analysés
- des préférences et rejets exprimés

tu dois produire le fichier FINAL :

Tone-and-Voice.md

---

## OBJECTIF DU FICHIER FINAL

Ce fichier doit permettre à une IA de :
- écrire exactement comme je parle
- respecter mes limites stylistiques
- produire des textes utilisables sans retouche
- éviter tout ton ou vocabulaire rejeté

Il sert de **référence stylistique absolue**
pour toute production écrite ou orale.

---

## CONTRAINTES STRICTES

- Langage simple et direct
- Aucune reformulation "améliorée"
- Aucun jargon marketing
- Aucune tentative de neutralisation du ton
- Aucune justification théorique

---

## STRUCTURE OBLIGATOIRE

### TON GLOBAL
- Description du ton dominant
- Énergie générale

### STYLE D'ÉCRITURE
- Rythme
- Longueur des phrases
- Structure préférée

### VOCABULAIRE
- Mots / expressions à privilégier
- Mots / expressions à éviter

### DIRECTIVITÉ & NUANCE
- Niveau d'affirmation acceptable
- Cas où la nuance est requise

### BONS VS MAUVAIS EXEMPLES
- Exemples qui sonnent juste
- Exemples qui sonnent faux

### NOTES POUR L'IA
- Ce que tu dois toujours respecter
- Ce que tu dois éviter absolument
- Ce que tu dois me demander en cas de doute

---

## EXEMPLE DE QUALITÉ ATTENDUE

MAUVAIS :
> "Adopte un ton professionnel et engageant."

BON :
> "Je préfère un ton direct, calme et pédagogique. Les phrases courtes
> me ressemblent. Les formules enthousiastes ou trop vendeuses
> me mettent mal à l'aise."

---

Produis uniquement le contenu du fichier Markdown final.
Aucune explication hors du fichier.
```

---

## C. Connecter vos MCP

Les MCP (Model Context Protocol servers) permettent à Claude d'accéder à vos outils externes : Gmail, Notion, Drive, Slack, Calendar, GitHub, et des centaines d'autres.

### C.1 Hiérarchie de priorité (à respecter)

1. **MCP natifs** : Gmail, Google Calendar, Drive, Notion, Slack, Firecrawl, Apify
2. **Fichiers locaux exportés** (.csv, .md) : pour ce qui n'a pas de MCP
3. **Navigateur (Browser Use)** : pour les outils sans API
4. **Computer Use** : dernier recours, lent et coûteux

### C.2 [HUMAIN] Connectez vos 3-5 MCP prioritaires

Identifiez vos 3 à 5 outils où vous passez le plus de temps. Connectez-les via Claude Code (`/mcp` ou via les paramètres).

**Conseil :** Ne connectez PAS tout. Chaque MCP rajoute du contexte au démarrage. Connectez seulement ce que vous utilisez vraiment.

**Conseil sécurité :** Pour chaque MCP, lisez les permissions. Ne donnez **jamais** d'accès en écriture si vous n'en avez pas besoin (ex : un MCP Gmail en lecture seule pour de la veille, pas en écriture).

### C.3 [CLAUDE EXECUTE] Documenter les MCP dans CLAUDE.md

Une fois les MCP connectés, demandez à Claude :

```
Mets à jour CLAUDE.md pour ajouter une section "MCP connectés"
qui liste les outils auxquels j'ai donné accès, et pour chacun :
- Le nom
- L'usage typique (lecture / écriture / les deux)
- Les actions qui requièrent ma confirmation explicite avant d'être lancées

Exemple :
- Gmail : lecture seule, pour analyse / triage
- Notion : lecture + écriture, mais TOUJOURS demander confirmation
  avant de modifier une page
- Calendar : lecture seule
```

---

## D. Créer votre premier skill

Un **skill** est un workflow réutilisable que Claude peut déclencher automatiquement. Il vit dans `09_Skills/`.

### D.1 Règle d'or

**Ne créez JAMAIS un skill from scratch.** Faites d'abord la tâche manuellement (avec Claude) 2-3 fois. Quand le pattern se stabilise, demandez à Claude de transformer ça en skill.

### D.2 Idées de premiers skills (quand vous en aurez besoin)

1. **Triage emails** : classifie, résume, archive
2. **Recyclage de contenu** : transforme un post en plusieurs formats
3. **Rédacteur** : génère des textes dans votre voix
4. **Préparateur de réunions** : agrège contexte, agenda et objectifs
5. **Créateur de présentations** : structure et génère les slides

### D.3 [CLAUDE EXECUTE] Pattern de création d'un skill

Une fois que vous avez fait une tâche 2-3 fois manuellement, lancez :

```
On a fait cette tâche [X] plusieurs fois ensemble
(références : conversations du [date1], [date2], [date3]).

Je veux qu'on en fasse un skill réutilisable dans 09_Skills/[nom-skill]/.

ÉTAPE 1 : Avant de coder le skill, fais-moi une synthèse :
- Quelle est la tâche en une phrase ?
- Quels sont les inputs nécessaires ?
- Quelles sont les étapes (numérotées) ?
- Quels sont les outputs attendus ?
- Quelles sont les variations selon le contexte ?
- Quelles sont les règles spécifiques (ce qu'il faut éviter) ?

ÉTAPE 2 : Quand on est aligné sur la synthèse, rédige le skill :
- Crée 09_Skills/[nom-skill]/SKILL.md
- Inclus une description claire (c'est elle qui déclenche le skill auto)
- Si pertinent, crée un sous-dossier examples/ avec 1-2 exemples de référence

Commence par l'étape 1.
```

### D.4 Structure type d'un skill

```
09_Skills/redaction-post/
├── SKILL.md              ← description + process + règles
└── examples/
    ├── exemple-1.md
    └── exemple-2.md
```

---

## E. Maintenance et rituels

Votre second cerveau n'est pas un projet "one-shot". Il vit.

### E.1 Cadence de mise à jour

| Fichier / dossier | Cadence |
|---|---|
| `01_About-Me/about-me.md` | Tous les 6-12 mois (rare changement) |
| `01_About-Me/my-company.md` | Tous les 1-3 mois (snapshot) |
| `02_Contexte/Life-and-Work-Reality.md` | Tous les 3 mois |
| `02_Contexte/Offer-Positioning.md` | À chaque nouvelle offre / changement de prix |
| `02_Contexte/Clients-Problems-and-Messages.md` | Tous les 3 mois (alimenter avec nouveaux verbatim) |
| `02_Contexte/Tone-and-Voice.md` | Tous les 6 mois ou après évolution de style |
| `02_Contexte/Opinions-et-Valeurs.md` | Tous les 12 mois (très stable) |
| `CLAUDE.md` | Quand une règle de routage ne marche plus |

### E.2 Rituel hebdo (10 min)

Tous les vendredis :
1. Lancer `/weekly-review`
2. Vérifier que les livrables produits cette semaine sont au bon endroit
3. Vider `00_Livrables/Z_Inbox/` avec `/inbox-processor`

### E.3 Rituel mensuel (30 min)

Une fois par mois :
1. Lancer `/lint`
2. Mettre à jour `my-company.md` si quelque chose a bougé (objectifs, offres, focus)
3. Identifier 1 nouvelle tâche récurrente → candidate à un skill

### E.4 Rituel trimestriel (1h)

Tous les 3 mois :
1. Revue complète des fichiers `02_Contexte/`
2. Mise à jour de `Life-and-Work-Reality.md`
3. Audit du `Clients-Problems-and-Messages.md` avec les nouveaux verbatim
4. Décision sur les skills à créer / supprimer

---
