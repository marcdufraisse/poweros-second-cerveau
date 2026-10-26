---
name: slide
description: "Crée des slides minimalistes (un seul fichier HTML autonome 16:9, aux couleurs de votre charte, votre logo et votre nom sur chaque slide, une idée par slide, très peu de texte) pour un live, une masterclass, un webinaire ou un bootcamp, un kickoff client ou un rendez-vous. Exporte les slides validées en PDF. Applique la structure webinaire en 6 phases (accroche, présentation, enseignement, récap et transition, offre, Q/R) quand il s'agit d'un webinaire ou d'un live de vente. Se déclenche sur \"/slide\", \"crée des slides\", \"fais-moi une présentation\", \"slides du live\", \"slides du bootcamp\", \"support de webinaire\", \"prépare les slides\", \"exporte les slides en PDF\"."
user-invocable: true
context: main
---

# Slide

Fabrique des slides qui s'ouvrent dans un navigateur, en un seul fichier HTML, puis les exporte en PDF une fois validées. Un slide = un titre, une phrase, au plus deux cartes ou trois chiffres. Jamais un slide qui se lit comme un document.

## Avant de commencer

Lire, dans cet ordre :

1. `02_Contexte/Tone-and-Voice.md` et `01_About-Me/anti-ai-voice.md` : tout texte de slide est un texte pour l'extérieur.
2. `02_Contexte/Branding/charte-visuelle.md` : palette, typographies, interdits. Si elle est vide, le modèle part sur sa palette neutre (dit-le à l'utilisateur).
3. `01_About-Me/my-company.md` pour l'offre, les prix, les dates, `01_About-Me/about-me.md` pour les chiffres de preuve.
4. La note du projet concerné (`03_Projets/<Projet>/`) et, pour un client, sa note dans `05_Clients/`.

Si le type de présentation n'est pas clair (webinaire de vente, bootcamp, kickoff client, rendez-vous), pose la question en une phrase. Tout le reste se déduit des fichiers.

## Webinaire, live, bootcamp : la structure en 6 phases

Pour tout webinaire, live ou masterclass (surtout quand il se termine par une vente), suis **toujours** cette structure. Image : `ressources/structure-webinaire.png`.

| # | Phase | Durée | Rôle | Slides typiques |
|---|---|---|---|---|
| 1 | **Accroche** | 5 à 10 min | Capter l'attention dès les premières secondes. Répondre à la question inconsciente du prospect : « Pourquoi suivre cette conférence ? » Créer de la curiosité. | titre, le problème, la promesse |
| 2 | **Présentation** | 5 à 10 min | Créer le lien et construire l'autorité. Montrer que vous les connaissez et les comprenez. Présenter la nouvelle opportunité. | qui je suis, chiffres de preuve, qui sont-ils, l'opportunité |
| 3 | **Enseignement** | 30 à 45 min | Partager 3 « pièces de contenu » pour faire adhérer à l'opportunité, donner confiance, lever les freins. | 3 blocs, chacun avec son repère « Point 1 / 3 » puis 2 à 4 slides |
| 4 | **Récap et transition** | 2 à 3 min | Polariser positivement l'audience et obtenir le droit de présenter l'offre. Projeter le prospect dans sa situation idéale. | le récap en 3 points, la situation idéale |
| 5 | **Offre** | 15 à 20 min | Le moment de la vente, sans la craindre. | ce que vous obtenez, le programme, les bonus, la garantie, le prix et l'action |
| 6 | **Session Q/R** | sans limite | Accueillir les nouveaux clients, lever les objections jusqu'à ce qu'il n'y en ait plus. | un slide « Questions », un slide de rappel de l'offre avec le lien |

Règles de la structure :

- Chaque slide porte en commentaire HTML sa phase (`<!-- 3 · Le problème (phase : accroche) -->`). Jamais affichée : le public voit une promesse, pas « Accroche ».
- Montre le plan à l'utilisateur avec la phase, la durée et le nombre de slides avant de construire.
- Les 3 pièces de contenu de l'enseignement se choisissent avec lui : chacune doit faire adhérer, donner confiance ou lever un frein. Si elles ne sont pas fournies, propose-les, ne les invente jamais.
- Pour des slides qui ne sont pas un webinaire (kickoff client, rendez-vous), la structure est libre : un fil de 8 à 15 slides, du constat vers le mécanisme puis l'action.

## Étapes

1. **Cadrer** : sujet, public, durée, objectif (vendre quoi, vers quel lien), nombre de slides visé. Reprends les faits dans les fichiers, demande ce qui manque. Pas de chiffre ni de témoignage inventé.
2. **Plan** : liste numérotée « numéro, phase, titre du slide ». Attends le « oui ».
3. **Rédiger** : pour chaque slide, un repère de 1 à 3 mots, un titre en 2 lignes au plus, éventuellement une phrase d'appui. Voix appliquée, phrase affirmative, chiffres en chiffres, aucun tiret cadratin, aucun emoji.
4. **Assembler** (sous Windows, remplacer `python3` par `py` dans les commandes ci-dessous) :
   ```bash
   python3 09_Skills/slide/scripts/assembler.py 09_Skills/slide/ressources/slide-modele.html "<sortie.html>" "<Titre des slides>" --nom "<Nom affiché>"
   ```
   Le script embarque les polices, et le logo s'il existe dans `02_Contexte/Branding/logo.png` (ou `--logo <chemin>`). Le fichier marche seul, hors ligne, sur n'importe quelle machine. Ensuite :
   - Remplace le bloc `:root` du fichier de sortie par la palette de `02_Contexte/Branding/charte-visuelle.md` (fond, surface, texte, accent ; `--accent-rgb` en R, G, B). Si la charte impose une autre police, change `--font`.
   - Remplace les 4 sections d'exemple par les slides du plan (voir Composants).
5. **Vérifier dans le navigateur** : ouvre le fichier, parcours chaque slide avec les flèches, console sans erreur, aucun texte coupé ni qui déborde, nom et logo visibles partout.
6. **Faire valider le HTML** : montre les slides, applique les retours directement sur le fichier (une seule version visible, les précédentes dans `10_Archives/`). Le PDF ne se fait qu'après le « oui » sur le HTML.
7. **Exporter en PDF** (HTML validé) :
   ```bash
   python3 09_Skills/slide/scripts/exporter_pdf.py "<slides.html>"
   ```
   Le PDF est posé à côté du HTML, même nom, une page 1920 x 1080 par slide. Le script annonce le nombre de pages : il doit être égal au nombre de slides. Il utilise Google Chrome, Microsoft Edge (présent d'office sous Windows), Brave ou Chromium. Même résultat depuis le navigateur avec Cmd+P (Ctrl+P sous Windows).

## À quoi ressemble un slide

1. un **repère** en petites capitales mono : `Le problème`, `Point 2 / 3`, `Aujourd'hui` ;
2. un **titre** fort en 2 lignes au plus ;
3. une **phrase d'appui** avec une puce, mots clés en gras ;
4. au besoin **deux cartes** côte à côte : à éviter et à faire, avant et après, sans et avec. 2 puces par carte, pas plus.

Tout le reste (listes, schémas, paragraphes) a sa place dans un document, pas sur un slide.

## Composants (déjà dans le modèle)

Chaque slide est une `<section class="slide center">` (slide de titre) ou `<section class="slide left">` (cas général). Chaque élément porte `data-d="<délai en s>"` : titre à `.2`, éléments suivants espacés de `.15`.

| Besoin | Code |
|---|---|
| Repère mono | `<div class="kicker" data-d=".1">Point 1 / 3</div>` |
| Repère simple (slide de titre) | `<div class="eyebrow" data-d=".1">Live gratuit · date</div>` |
| Titre | `<h2 data-d=".2">Ligne 1<span class="grad">Ligne 2.</span></h2>` (`h1` pour le slide titre) |
| Sous-titre | `<div class="sub" data-d=".4">...</div>` |
| Phrase d'appui | `<div class="lead" data-d=".4"><span>Phrase avec un <b>mot clé</b>.</span></div>` |
| Deux cartes | `<div class="duo"><div class="card" data-d=".4"><h4>Sans</h4><ul><li>...</li><li>...</li></ul></div><div class="card yes" data-d=".55"><h4>Avec</h4><ul><li>...</li><li>...</li></ul></div></div>` |
| 2 à 4 pastilles | `<div class="pills"><div class="pill" data-d=".4">...</div>...</div>` |
| Chiffres de preuve | `<div class="stats"><div class="stat" data-d=".4"><div class="n">00</div><div class="l">libellé</div></div>...</div>` (3 au maximum) |

Besoin d'un composant absent : construis-le en CSS dans le même fichier avec les jetons du `:root`.

## Règles de minimalisme

- **Une idée par slide.** Si deux idées se battent, deux slides.
- **20 mots maximum** de texte visible par slide, titre compris ; 30 avec deux cartes.
- **2 cartes ou 3 éléments** à côté du titre au maximum. Jamais de liste à puces, jamais de paragraphe.
- Le détail va dans la bouche de l'orateur, pas sur le slide.
- Pas d'image décorative, pas d'icône sans fonction. Pas d'animation : le modèle n'a que la petite montée des éléments à l'entrée.
- Pas de prix, de garantie ni de date sur un slide tant que `01_About-Me/my-company.md` ne les confirme pas.
- Un seul CTA, sur le dernier slide d'offre : un lien ou un QR, pas trois.

## Sortie

- Fichier unique : `00_Livrables/Presentations/<Sujet>-slides_YYYY-MM-DD.html` (préfixé du tag du projet s'il y en a un). Livrable pour un client signé : `05_Clients/<Client>/`.
- Navigation : flèches, espace, clic (quart gauche pour reculer), `F` plein écran, `R` rejoue le slide, `Home` et `End`, numéro dans l'URL (`#4`).
- PDF : même nom, extension `.pdf`, même dossier. Une seule version visible : le PDF est regénéré après chaque retour.
- Ajoute le livrable à la note du projet (Où on en est).

## Règles

- Aucun chiffre inventé : les preuves viennent de `about-me.md` et `my-company.md`.
- Des slides envoyées à l'extérieur (client, partenaire) ne partent qu'avec un « oui » explicite.
- Un retour sur le fond ou le style va dans ce fichier avant la fin de la session (`/ameliorer-skill` en fin de discussion).
