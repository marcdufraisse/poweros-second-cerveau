# Editing OS : commencez ici

Un système de montage vidéo piloté par Claude Code. Vous lui donnez un rush de face caméra, il vous rend un reel monté : silences coupés, ratés supprimés, illustrations animées calées sur vos mots, sous-titres karaoké, sound design, et un master au bon niveau pour Instagram.

**Tout se pilote depuis Claude Code.** Vous n'avez aucune ligne de commande à connaître : vous écrivez ce que vous voulez en français, il le fait.

---

## Installation (20 minutes, une seule fois)

### 1. Claude Code et PowerOS

Vous avez déjà Claude Code (https://claude.com/product/claude-code) et le dossier PowerOS. Editing OS vit dans `07_Ressources/Editing-OS/`. Le skill HyperFrames, dont il dépend, vous a été proposé pendant "Installe mon second cerveau" (étape 7). S'il manque, dites à Claude : « Installe HyperFrames ».

### 2. Ouvrez ce dossier comme projet

Dans Claude Code, ouvrez le dossier `07_Ressources/Editing-OS` comme projet (pas la racine de PowerOS). Claude voit alors tout le système : les agents, les scripts, les styles, la méthode.

### 3. Demandez-lui de s'installer lui-même

Écrivez-lui simplement, dans la conversation :

> Installe tout ce dont ce système a besoin pour tourner, puis vérifie que tout est bon.

Il vérifie ce qui manque sur votre machine (Node.js 22 ou plus, FFmpeg, Google Chrome), installe la transcription locale (Whisper) et les dépendances du projet, puis lance le diagnostic intégré et vous confirme que tout est vert. Chrome sert à fabriquer les animations.

**Il vous demande votre accord avant chaque commande** : vous voyez ce qu'il s'apprête à faire, vous validez d'un clic. Une seule chose qu'il ne peut pas faire à votre place : si une installation réclame votre mot de passe Mac, il vous donne la ligne exacte à coller vous-même dans le Terminal.

**Aucune clé API n'est nécessaire.** La transcription tourne en local, sur votre machine, gratuitement. Le fichier `.env.example` ne concerne que des options avancées (banques d'images pour la b-roll automatique).

---

## Votre première vidéo

Tout se passe dans la même conversation. Vous n'ouvrez rien d'autre.

**1. Ouvrez le tableau de bord.** Dites-lui « lance le tableau de bord ». Il le démarre et vous donne le lien à ouvrir dans votre navigateur : vos projets, l'état de chaque montage, vos rendus.

**2. Donnez-lui votre rush.** Glissez votre fichier vidéo dans la conversation et écrivez « nouveau reel à partir de ce rush ».

**3. Laissez-le dérouler, et intervenez au bon moment.** Il choisit le format, transcrit votre parole mot à mot, monte le son, puis **s'arrête et vous propose un storyboard** : ce qu'il compte animer, seconde par seconde. C'est votre moment. Vous validez, ou vous corrigez en une phrase. Ensuite il compose, rend, vérifie son propre travail, et vous livre un fichier prêt à publier.

Vous pouvez tout lui dire en langage normal : « refais l'intro plus punchy », « enlève la musique », « la vidéo doit finir quand j'arrête de parler ».

Le process complet est décrit dans `PROCESS.md`. Vous n'avez pas besoin de le lire pour commencer : Claude le connaît, il le suit.

---

## Les 3 règles qui font 80 % du résultat

**1. Donnez vos retours par timecode.** Chaque projet embarque une interface de review (`review.html`) : vous avancez image par image, vous écrivez « à 00:12 le texte cache mon visage », vous cliquez « Copier pour Claude », vous collez dans la conversation. Il corrige au millimètre.

**2. Vos retours sont permanents.** Dites-lui « retiens ça pour les prochaines » : il l'écrit dans ses règles. La vidéo suivante démarre avec cet acquis. C'est ça qui fait qu'au bout de trois vidéos, la v1 ressemble à la v10 de la première.

**3. Rien ne sort sans vérification.** Le système re-transcrit son propre rendu pour prouver qu'aucun mot n'a été coupé, vérifie qu'aucun moment n'est vide à l'écran, et masterise le son à -14 LUFS (le niveau des plateformes). Un rendu qui échoue ne vous est pas envoyé. Mais regardez quand même : c'est vous le directeur artistique.

---

## Mettez-le à votre identité

Ce dossier arrive volontairement **neutre**. Trois choses sont à vous :

| Quoi | Où | Comment |
| --- | --- | --- |
| **Vos sound effects** | `asset-library/sfx/` | Déposez vos .wav en respectant les NOMS DE RÔLES listés dans le README de ce dossier (`whoosh.wav`, `pop.wav`, `click.wav`...). Rien d'autre à configurer. |
| **Vos polices** | `style-library/10-marc/fonts/` | Déposez vos `.woff2`. Sans ça, le système utilise les polices livrées (Outfit, Poppins, JetBrains Mono). |
| **Votre couleur** | `style-library/10-marc/tokens.css` | Changez la variable `--jaune` par votre couleur de marque. Tout le style suit. |

Le plus simple : dites-le à Claude, « configure mon style : ma couleur est #XXXXXX, mes polices sont X et Y », il s'occupe du reste.

Pourquoi les sons ne sont pas fournis : les sound effects d'un montage sont souvent sous licence, ils ne peuvent pas être redistribués. Utilisez les vôtres, ou une banque libre de droits (Pixabay, Freesound, Google Fonts pour les polices).

Les modèles de reels (`style-templates/`) n'embarquent pas de rushes d'exemple : ils attendent les vôtres.

---

## En cas de problème

| Symptôme | Solution |
| --- | --- |
| Claude dit qu'il manque quelque chose | Répondez « installe ce qui manque » |
| Le diagnostic affiche du rouge | Collez ce que vous voyez dans la conversation, il se répare lui-même |
| Le premier montage est lent | Normal : le modèle de transcription (1,6 Go) se télécharge une fois |
| Le tableau de bord ne s'ouvre pas | Dites-lui « relance le tableau de bord » |
| Une animation ne vous plaît pas | Dites-le avec le timecode, en langage normal |

Et sinon : décrivez votre problème à Claude dans la conversation, capture d'écran à l'appui. Il a accès à tout le système et se débogue lui-même la plupart du temps.

---

*Editing OS : licence MIT. Construit sur HyperFrames.*
