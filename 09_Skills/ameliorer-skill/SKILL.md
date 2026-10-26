---
name: ameliorer-skill
description: "Fin de discussion avec un skill : relit tous les retours de l'utilisateur dans la conversation (V1, V2, V3...), en extrait les grands principes (ce qu'il corrige, refuse, répète, valide) et propose des modifications du skill utilisé, qu'il accepte ou refuse une par une. Se déclenche sur \"/ameliorer-skill\", \"améliore le skill\", \"qu'est-ce qu'on retient de mes retours\", \"analyse mes feedbacks\", \"fais évoluer ce skill\", ou quand une discussion avec un skill se termine après plusieurs allers-retours."
user-invocable: true
context: main
---

# Améliorer un skill

À la fin d'une discussion où un skill a servi, tu relis les retours de l'utilisateur, tu en tires des principes, et tu proposes de les écrire dans le skill. Chaque conversation rend le skill meilleur. Ce que l'utilisateur a dû corriger à la main ne doit plus jamais avoir à l'être.

Le skill ne s'améliore pas tout seul : c'est toujours l'utilisateur qui accepte ou refuse chaque modification.

## Input

1. **Le skill utilisé.** Repère-le dans la conversation. Si plusieurs ont servi, ou si tu hésites, demande lequel analyser (un seul à la fois).
2. **Son `SKILL.md`**, en entier, avec ses `references/` et `examples/` s'il y en a.
3. **La fiche process de la tâche**, si elle existe (`04_Departements/<Departement>/Process/Process-<Nom>.md`) : c'est là que vit la méthode source.
4. **Toute la conversation**, depuis le premier lancement du skill : les versions produites (V1, V2, V3...) et les retours entre chacune.

Si la conversation ne contient aucun retour de l'utilisateur sur l'output (il a tout validé du premier coup), dis-le et arrête-toi : rien à améliorer. Un "c'est bon" sans correction est un signal positif à noter, pas une modification à proposer.

## Étapes

### Étape 1 : lister les retours

Relis la conversation dans l'ordre et sors chaque retour sur l'output, en une ligne, avec sa version (V1 -> V2...). Cherche :

- les **corrections** directes ("enlève les accents", "plus court", "tutoie")
- les **refus** ("non, pas comme ça", "trop corporate")
- les **demandes répétées** : le même retour fait deux fois ou plus
- les **réécritures** : il a corrigé le texte lui-même
- les **validations** : ce qu'il a gardé tel quel ou salué ("c'est exactement ça")
- les **questions que Claude aurait dû poser** et qu'il a fallu lui rappeler

Cite ses mots, pas ta paraphrase.

### Étape 2 : en extraire les principes

Un principe est une règle **générale**, valable pour la prochaine fois, pas seulement pour ce cas. Regroupe les retours qui disent la même chose et formule le principe en une phrase.

Trie chaque retour dans l'une de quatre cases :

| Case | Exemple | Où ça va |
|---|---|---|
| **Principe du skill** | "Jamais plus de 20 mots par phrase" | Le SKILL.md (Méthode, Règles, Critères, Formatage, Exemple) |
| **Étape manquante** | "Vérifie la source avant d'écrire" | Le SKILL.md (Étapes ou Input) |
| **Règle de voix ou de contexte** | "Plus direct, pas de politesse" | `02_Contexte/Tone-and-Voice.md` ou `01_About-Me/`, en diff validé |
| **Cas particulier** | "Pour ce client, parle de X" | Nulle part : c'est du ponctuel, pas une règle |

Un retour compte comme principe quand il est explicite ("toujours", "jamais", "à chaque fois"), ou répété, ou quand il corrige un défaut qui reviendrait forcément. Un retour isolé et lié à un contenu précis n'en est pas un.

### Étape 3 : comparer au skill actuel

Pour chaque principe, regarde dans le `SKILL.md` :

- **Déjà couvert** : la règle existe mais n'a pas été suivie. Propose de la **renforcer** (la remonter, la rendre plus nette, ajouter un exemple), pas de la dupliquer.
- **Absent** : propose de l'ajouter, dans le bon bloc.
- **Contradictoire** : le skill dit X, l'utilisateur a dit Y. Propose de corriger le skill, et signale la contradiction.

### Étape 4 : proposer les modifications

Montre un récapitulatif, puis les propositions numérotées, 7 maximum (les plus utiles d'abord). Pour chacune :

```
### Proposition 1 : <titre court>
Principe : <une phrase>
Preuve : "<citation de l'utilisateur>" (V2), répété en V4
Bloc : Méthode > Ce que je ne fais jamais
Avant : <texte actuel, ou "absent">
Après : <texte proposé>
```

Termine par la question : "Lesquelles acceptez-vous ?" Il peut répondre par numéros, tout accepter, ou en refuser.

### Étape 5 : appliquer, après validation seulement

1. Copie la version actuelle du skill dans `10_Archives/<nom-du-skill>_SKILL_YYYY-MM-DD.md`.
2. Applique uniquement les propositions acceptées dans le `SKILL.md`, dans le bloc indiqué.
3. Si la fiche process existe, mets à jour son bloc concerné (la méthode vit là en premier) et son champ `maj`.
4. Pour une règle de voix ou de contexte, propose le diff sur `02_Contexte/` ou `01_About-Me/` séparément et attends le "oui".
5. Vérifie qu'aucun tiret cadratin ni demi-cadratin n'a été introduit.

### Étape 6 : confirmer

```
Skill amélioré : <nom>
Retours analysés : X
Principes extraits : X
Acceptés : X (n°...)   Refusés : X (n°...)
Ancienne version : 10_Archives/...
```

## Output

- Une liste de propositions numérotées avec preuve et diff.
- Le `SKILL.md` modifié (propositions acceptées seulement).
- L'ancienne version archivée dans `10_Archives/`.
- Éventuellement un diff sur `02_Contexte/` (voix, contexte), à valider à part.

## Méthode

**Structure d'une analyse**

1. Retours listés, version par version.
2. Principes regroupés et tries dans les quatre cases.
3. Comparaison au skill actuel (couvert, absent, contradictoire).
4. Propositions numérotées, avec preuve.
5. Validation, puis application.

**Ce que tu fais toujours**

- Citer les mots exacts de l'utilisateur comme preuve de chaque proposition.
- Généraliser : transformer "enlève cet accent ici" en règle sur le fond.
- Chercher d'abord à renforcer une règle existante avant d'en ajouter une.
- Distinguer ce qui change le skill de ce qui change le contexte (voix, offre, ICP).
- Noter ce qui a été validé sans correction : c'est un exemple de ce qui marche.

**Ce que tu ne fais jamais**

- Modifier le skill sans son "oui".
- Inventer un retour qu'il n'a pas fait.
- Ajouter une règle déduite d'un seul retour lié à un contenu précis.
- Recopier du contexte (prix, offre, cible) en dur dans le skill.
- Réécrire tout le skill : on propose des modifications ciblées.
- Proposer plus de 7 modifications d'un coup.

## Règles

Comparaison d'une bonne et d'une mauvaise proposition :

| Mauvaise | Bonne |
|---|---|
| "L'utilisateur a dit que le post n'était pas bien. Rends le skill meilleur." (vague, sans preuve) | "L'utilisateur a barré l'intro en V2 et V3 : 'pas de contexte avant le hook'. Principe : le hook ouvre le post. Bloc : Méthode > Structure." |
| Ajoute "ne parle pas du client Alpha" (cas particulier) | Ne propose rien : c'est du ponctuel |
| Ajoute une règle de ton dans le skill alors qu'elle vaut pour tous les textes | Propose un diff sur `Tone-and-Voice.md` |
| Duplique une règle déjà présente | "La règle existe en Méthode, mais elle a été violée 3 fois : la remonter en tête de Règles" |

Validations obligatoires : toute modification du `SKILL.md` (zone protégée `09_Skills/`) et toute modification de `01_About-Me/` ou `02_Contexte/` passent par son "oui".

## Critères de qualité

L'analyse est réussie si :

- chaque proposition a une citation de l'utilisateur comme preuve ;
- chaque proposition est une règle générale, pas un cas particulier ;
- aucune règle n'est dupliquée ou contradictoire avec le reste du skill ;
- il y a 7 propositions maximum, classées par utilité ;
- l'utilisateur comprend en un coup d'œil quoi accepter ;
- l'ancienne version est archivée avant toute écriture.

## Formatage

- Propositions numérotées, format fixe (Principe, Preuve, Bloc, Avant, Après).
- Un récapitulatif en tête : retours analysés, principes trouvés.
- Vouvoiement, aucun tiret cadratin ni demi-cadratin, aucune émoticône.

## Exemple complet

Après une discussion avec un skill de rédaction (post rédigé en V1 à V4) :

```
Skill analysé : redaction-post
Retours relevés : 6 (V1 -> V4)
Principes extraits : 3 (1 déjà couvert, 1 absent, 1 pour Tone-and-Voice.md)

### Proposition 1 : le hook ouvre le post
Principe : aucune phrase de contexte avant l'accroche.
Preuve : "enlève l'intro, commence direct" (V2), "encore une intro, je vous l'ai dit" (V3)
Bloc : Méthode > Structure
Avant : "1. Intro, 2. Hook, 3. Corps"
Après : "1. Hook (première ligne du post), 2. Corps, 3. CTA. Jamais d'intro avant le hook."

### Proposition 2 : une règle existante a été violée
Principe : phrases de 20 mots maximum.
Preuve : "trop long, coupe" (V1, V3)
Bloc : Règles (renforcer)
Avant : règle présente en Méthode, jamais vérifiée
Après : ajouter en Critères de qualité : "aucune phrase de plus de 20 mots"

### Proposition 3 : règle de voix (diff sur Tone-and-Voice.md, pas sur le skill)
Principe : jamais de "je pense que".
Preuve : "affirme, ne tourne pas autour" (V2)

Lesquelles acceptez-vous ?
```

L'utilisateur répond "1 et 2, pas la 3". Tu archives, tu appliques 1 et 2, tu confirmes.
