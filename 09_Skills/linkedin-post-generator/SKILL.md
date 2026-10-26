---
name: linkedin-post-generator
description: "Génère des posts LinkedIn dans la voix de l'utilisateur, à partir d'un transcript, de notes ou d'une idée. 7 frameworks validés (Bold Statement, Scène forte, Offre irrésistible, Thread, Medium, Méthode des 75 %, PASFA) et 20 templates de hooks. Lit d'abord le second cerveau (qui il est, son offre, sa voix), génère les posts un par un avec validation entre chaque, et les vérifie avec un script. À utiliser quand l'utilisateur demande un post LinkedIn, des idées de posts, ou de transformer un transcript en publications."
---

# LinkedIn Post Generator

## Avant d'écrire : lisez le second cerveau

Ce skill écrit pour l'utilisateur, avec sa voix, pas une voix générique. Avant le premier post, lis :

1. `01_About-Me/about-me.md` et `01_About-Me/my-company.md` : qui il est, ce qu'il vend, son focus du moment.
2. `02_Contexte/Tone-and-Voice.md` : sa façon d'écrire. **Il l'emporte sur toutes les règles de style ci-dessous** (longueur, tutoiement ou vouvoiement du lecteur, flèches, emojis).
3. `01_About-Me/anti-ai-voice.md` : les tics d'IA à bannir, à appliquer sur chaque post.
4. `02_Contexte/Offer-Positioning.md` pour un post qui parle de l'offre, et `02_Contexte/Clients-Problems-and-Messages.md` s'il existe, pour les problèmes et les mots des clients.

**Sa cible, ses problèmes et sa promesse** viennent de ces fichiers. S'ils contiennent encore `[à remplir]`, dis-le et propose de lancer l'installation (« Installe mon second cerveau ») ou demande en deux questions : à qui s'adresse le post, et qu'est-ce que le lecteur doit retenir.

N'invente rien : ni chiffre, ni client, ni anecdote, ni résultat. Une histoire vient de l'utilisateur ou du transcript.

Le post fini va dans `00_Livrables/Posts/`, nommé `Post-Sujet_AAAA-MM-JJ.md`.

## Style d'Écriture - IMPÉRATIF

### Caractéristiques obligatoires :

- **Phrases courtes** : 1 idée = 1 phrase
- **Sauts de ligne fréquents**
- **Tirets → pour lister**
- **Répétitions volontaires**
- **Langage cash et direct**
- **AUCUNE question de fin**
- **Conclusion percutante**
- **Ton très oral** (comme une discussion)

### Progression naturelle :

1. Accroche référence (externe ou anecdote forte)
2. Révélation courte
3. Contexte clair
4. Lien vers son expérience
5. Observations personnelles
6. Principe général
7. Conclusion percutante

## Contraintes STRICTES

### Obligations (par défaut, `Tone-and-Voice.md` l'emporte) :

- **Longueur : 550 à 750 caractères** (espaces compris)
- Style **100% oral et percutant**
- **Aucun call to action**
- Aucune phrase alambiquée
- Phrases courtes à moyennes
- 1 à 2 phrases max par paragraphe
- Alternance entre phrase seule et bloc de 2 phrases liées

### Interdictions ABSOLUES :

- Pas de structure type blog (intro-développement-conclusion-CTA)
- Pas de question finale ("Et toi, t'en penses quoi ?")
- Aucune phrase longue et complexe
- Aucune motivation type "coach" ou "prof"
- Aucune référence inventée
- Pas de développement artificiel pour remplir
- Zéro reformulation gratuite
- Zéro phrase "jolie mais vide"
- Si une phrase peut être supprimée sans perdre de sens → elle est interdite

### Mots INTERDITS :

"bruit", "bruyant", "empiler", "fortement", "grincer", "révélation", "brutale", "décor", "flou", "irritation", "vernis"

## Références Autorisées

- **Si c'est sur Wikipedia, c'est OK**
- **Si c'est connu et vérifiable, c'est OK**
- **Si c'est inventé, c'est non**

Autorisées :
- Personnalités connues (Steve Jobs, Elon Musk…)
- Entreprises célèbres (Apple, Amazon, Tesla…)
- Études réelles (Harvard, MIT…)
- Concepts culturels reconnus (Japon, stoïcisme…)
- Événements actuels (startup, business…)
- Éléments réels du transcript

## Processus de Génération

### IMPORTANT : Génération progressive avec validation

1. **Lire le transcript ou l'idée de l'utilisateur**
2. **Consulter les ressources** :
   - `references/hooks.md` pour les 20 templates de hooks
   - `references/exemples-posts.md` : exemples d'un autre auteur, à lire pour la structure et le rythme, jamais à recopier
3. **Générer le POST 1** avec un framework choisi
4. **Valider avec l'utilisateur** avant de passer au suivant
5. **Répéter pour les 7 posts** (un à la fois)

### Sélection du Framework

Pour chaque post, choisis parmi ces 7 frameworks :

1. **Bold Statement** : Prise de position cash
2. **Scène forte** : Plonge direct dans le pic
3. **Offre Irrésistible** : Offre une ressource précieuse
4. **Thread** : Explique étape par étape
5. **Medium** : Annonce ce que tu vas résoudre
6. **Méthode des 75%** : Garde un suspense partiel
7. **PASFA** : Problème → Agitation → Solution → Futur → Accroche

## Templates des 7 Frameworks

### 1. BOLD STATEMENT

```
J'ai décidé de [action forte].
Parce que [élément déclencheur qui change la donne].

[Révélation courte].

[Explication contexte].

C'est pareil avec [son expérience].

[Observation personnelle].

[Principe général].

[Conclusion cash].
```

### 2. SCÈNE FORTE

```
[Période], j'ai [émotion] sur [événement] pour une raison particulière :

[Révélation].

[Développement scène].

[Ce qui s'est passé].

[Réaction/conséquence].

[Leçon tirée].

[Conclusion percutante].
```

### 3. OFFRE IRRÉSISTIBLE

```
[J'ai investi X € / passé Y heures] pour créer [résultat ou ressource puissante].

Tu peux l'avoir GRATUITEMENT aujourd'hui.

[C'est quoi concrètement + pourquoi ça compte].

[Origine / pourquoi c'est légitime].

Voici ce que tu reçois :

→ [Bénéfice 1 concret]
→ [Bénéfice 2 transformationnel]
→ [Méthode / framework propriétaire]

[Projection transformation rapide].

Tu veux y accéder ?

→ Pour que je te l'envoie :
↳ Like ce post + commente
↳ Ajoutez moi sur LinkedIn
↳ Re-Post pour le partager à ton réseau
```

### 4. THREAD

```
[Étude/Entreprise] a testé [méthodes].

[Résultat surprenant].

[Détails du processus].

Voici comment [application concrète] :

[Étapes/méthode].

[Résultats observés].

[Conclusion].
```

### 5. MEDIUM

```
Comment [faire X] comme [Référence] :

[Méthode étape 1].

[Méthode étape 2].

[Méthode étape 3].

[Résultat chiffré].

[Application pratique].

[Conclusion directe].
```

### 6. MÉTHODE DES 75%

```
[Situation forte/révélation partielle].

[Contexte qui intrigue].

[Développement qui maintient la tension].

Mais le vrai déclic, c'est [élément manquant].

[Révélation complète].

[Explication du pourquoi].

[Application/leçon].

[Conclusion percutante].
```

### 7. PASFA

```
[Avis contrarian / réalité dure à avaler].

→ [Agitation 1]
→ [Agitation 2]
→ [Agitation 3]

[Solution qui résout tout].

Dans le futur, le monde [changement positif].

[Conclusion percutante].
```

## Checklist de Validation (avant chaque post)

Avant d'envoyer chaque post, vérifie :

1. Se lit-il comme **l'utilisateur parle** (comparé à `Tone-and-Voice.md`) ?
2. Phrases **courtes**, avec sauts de ligne fréquents ?
3. Progression **naturelle et organique** ?
4. - **Conclusion percutante**, sans question ?
5. Longueur **entre 550 à 750 caractères** ?
6. Aucun **mot interdit** ?
7. - **Max 2 phrases par paragraphe** ?

## Validation Technique

Utilise le script `scripts/validate_post.py` pour valider automatiquement chaque post :

```bash
python3 09_Skills/linkedin-post-generator/scripts/validate_post.py "texte du post"
```

Sous Windows, remplacez `python3` par `py`.

Le script vérifie :
- Longueur (550-750 caractères)
- Mots interdits
- Structure des paragraphes

## Format de Livraison

Pour chaque post :

```markdown
POST X - [Nom du Framework]

[Texte du post]

---
Caractères : XXX
Framework : [Nom]
```

**Attendre la validation de l'utilisateur avant de passer au post suivant.**

## Ressources Disponibles

- `references/hooks.md` - 20 templates de hooks validés avec exemples
- `references/exemples-posts.md` - 10 exemples de posts dans le bon style
- `scripts/validate_post.py` - Script de validation automatique
