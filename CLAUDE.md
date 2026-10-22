# PowerOS

> Lu par Claude Code au démarrage de chaque session. C'est la carte du workspace : où sont les choses, comment on crée un document, quand on lit quoi. Créé par Marc Dufraisse (https://www.linkedin.com/in/marcdufraisse/).

@01_About-Me/about-me.md
@01_About-Me/my-company.md
@01_About-Me/anti-ai-voice.md

## 1. Règles (toujours)

- Vouvoiement, ton direct et chaleureux, zéro jargon inutile. Français par défaut.
- Aucun tiret cadratin ni demi-cadratin, nulle part. Tiret simple, deux-points, virgule ou parenthèses.
- Une seule action à la fois. L'utilisateur n'est pas développeur : tu fais le travail technique, il répond aux questions.
- Rien ne part vers l'extérieur (message, invitation, email) sans un "oui" explicite.
- Jamais de contexte inventé. Si l'information manque, tu la demandes ou tu laisses vide.
- Jamais de suppression : ce qui n'a plus sa place va dans `11_Archives/`.
- Ce qui n'est pas écrit dans ce dossier n'existe pas pour toi. Une décision prise en conversation finit dans un fichier avant la fin de la session, via `/done`.

## 2. Premier message

Avant de répondre, regarde `01_About-Me/about-me.md`.

- **Il contient encore `[à remplir]`** : le second cerveau n'est pas installé. Souhaite la bienvenue en trois phrases (un dossier que l'IA lit avant chaque tâche, pour qu'elle connaisse votre métier, vos clients et votre voix) et lance le skill `installer-second-cerveau`.
- **Il est rempli** : lis le journal d'hier et d'aujourd'hui s'ils existent, puis la section "Où on en est" des projets actifs et des départements. Résume en trois lignes et propose la prochaine action la plus utile.

L'utilisateur peut aussi lancer l'installation en tapant : `Installe mon second cerveau`.

## 3. L'arbre

| Dossier | Ce qu'il contient |
|---|---|
| `00_Livrables/` | Tout ce que Claude produit, par type (section 7). `Z_Inbox/` : la capture (idée, lien, fichier déposé), vidée par `/inbox-processor`. Gros lot dans `Z_Inbox/_import/` pour `/import`. |
| `01_About-Me/` | Qui vous êtes, votre entreprise, vos règles d'écriture. Trois fichiers chargés à chaque session. |
| `02_Contexte/` | La vérité unique sur votre marché : offre, clients, voix, réalité de travail, opinions et valeurs. Cinq fichiers, chargés selon la tâche. |
| `03_Branding/` | Charte, logos, polices. |
| `04_Projets/` | Une initiative avec un objectif et une fin. Archivée quand ses Étapes sont cochées. |
| `05_Departements/` | Les responsabilités continues : Strategie, Marketing, Vente, Produit, Finance-Compta. |
| `06_Clients/` | Un dossier par client signé, avec sa note. |
| `07_Meeting/` | Les transcripts de calls : `Clients/`, `Prospects/`, `Interne/`, `Autres/`. |
| `08_Ressources/` | `templates/`, exemples, `Veille/` (sources brutes, wiki) et `Editing-OS/` (montage vidéo, voir son `COMMENCE-ICI.md`). |
| `09_Journal/` | Un fichier par jour écrit par `/done`, un par semaine par `/weekly-review`. |
| `10_Skills/` | La bibliothèque de skills. `.claude/skills` est un lien vers ce dossier. |
| `11_Archives/` | Terminé ou remplacé, à plat. |

Zones protégées, modifiées seulement sur demande explicite ou via l'installeur : `01_About-Me/`, `02_Contexte/`, `03_Branding/`, `10_Skills/`.

Projet, département ou client ? Un projet a une fin. Un département n'en a pas. Un client est une mission signée. Un prospect pas encore signé vit dans Vente. Un support réutilisable pour tous les clients vit dans Produit. Le support final l'emporte sur le sujet : un post qui annonce un event est du Marketing, la propale est de la Vente, l'event lui-même est un projet.

## 4. La forme d'un dossier de travail

Tout projet, département et client a la même forme : une note du même nom que le dossier (`05_Departements/Vente/Vente.md`), et des fichiers à plat. Les fiches de process d'un département vivent dans son sous-dossier `Process/`. Un sous-dossier seulement quand une nature de fichier dépasse dix items, nommé par ce qu'il contient, jamais par une étape (pas de `livrables/`, `input/`, `output/`). Seule exception : `sources/` pour le brut.

**Avant de travailler dans un dossier, ouvre sa note.**

| Section | Département | Projet | Client | Qui l'écrit |
|---|---|---|---|---|
| Mission | oui | oui | oui | l'utilisateur |
| Périmètre, Objectif | oui | | | l'utilisateur |
| Cadre | règles, outils | contexte, contraintes | interlocuteurs, offre | l'utilisateur ; `/done` ajoute une décision datée en fin de section |
| Étapes | | cases | cases | l'utilisateur écrit, `/done` coche |
| Où on en est | oui | oui | oui | `/done` réécrit, cinq lignes max |
| Key Notes | oui | oui | oui | `/done` complète les wikilinks |

`/done` ne réécrit jamais Mission, Périmètre, Objectif ni le texte de Cadre. Quand tu modifies un fichier, la note à mettre à jour est celle du dossier parent le plus proche qui en a une.

## 5. Créer un document

1. **Une note** (projet, département, client) part toujours d'un template de `08_Ressources/templates/` : `projet.md`, `departement.md`, `client.md`. Une fiche de process part de `process.md`. Un nouveau projet s'ajoute à `04_Projets/Projets.md`, un nouveau client à `06_Clients/Clients.md`.
2. **Un livrable** est rangé dans `00_Livrables/<Type>/` (section 7) et porte un frontmatter (`livrable.md`) : `type`, `status` (draft, final), `date`, `maj`, `client` si besoin, `tags`.
3. **Le journal** : `09_Journal/YYYY-MM-DD.md` depuis `journal-jour.md`, `09_Journal/YYYY-Www.md` depuis `journal-semaine.md`.
4. **Une réflexion** de dirigeant : `reflexion.md`, rangée dans `05_Departements/Strategie/`.
5. **Nommage** : `Nom-Sujet_YYYY-MM-DD.ext`. Une entité se cite en `[[wikilink]]`.
6. **Une seule version visible** d'un livrable. Les précédentes vont dans `11_Archives/`.
7. Jamais de livrable à la racine ni dans `00_Livrables/` sans son dossier de type. Seuls `README.md`, `CLAUDE.md` et `.env` y vivent.

## 6. Quoi charger selon la tâche

| Tâche | Charger en plus d'About-Me et de la note du dossier |
|---|---|
| Rédiger quoi que ce soit de publié (post, newsletter, page, message) | `02_Contexte/Tone-and-Voice.md` |
| Offre, prospection, propale, message client | `02_Contexte/Offer-Positioning.md` + `02_Contexte/Clients-Problems-and-Messages.md` |
| Stratégie, pricing, planification | `02_Contexte/Offer-Positioning.md` + `02_Contexte/Life-and-Work-Reality.md` |
| Valeurs, décisions difficiles, prises de position | `02_Contexte/Opinions-et-Valeurs.md` |
| Travail sur un client | sa note dans `06_Clients/<Client>/` |
| Visuel, marque | `03_Branding/charte-visuelle.md` |
| Slides, présentation, support de live ou de bootcamp | skill `slide` + `03_Branding/charte-visuelle.md` + `02_Contexte/Tone-and-Voice.md` |

## 7. Où ranger un livrable (premier match gagne)

Un livrable est un document que Claude produit. Il va dans `00_Livrables/<Type>/` (type au pluriel, en français, créé au premier besoin).

| Livrable | Dossier |
|---|---|
| Post, carrousel, calendrier éditorial | `00_Livrables/Posts/` |
| Newsletter, séquence de mails à l'audience | `00_Livrables/Newsletter/` |
| Script vidéo, vidéo montée | `00_Livrables/Video/` |
| Présentation, slides, support de live ou de bootcamp | `00_Livrables/Presentations/` |
| Landing page, page de vente | `00_Livrables/Landing-Pages/` |
| Propale, devis, email d'envoi | `00_Livrables/Propositions/` |
| Liste de prospects, message outbound, script d'appel | `00_Livrables/Prospection/` |
| Autre type | `00_Livrables/<Type>/`, ligne ajoutée ici |
| Pas sûr | `00_Livrables/Z_Inbox/` |

Exceptions : un livrable pour un client signé va dans `06_Clients/<Client>/`, préfixé du nom du client. Lors d'un `/inbox-processor`, les livrables de plus de 15 jours quittent `00_Livrables/<Type>/` pour leur dossier de projet, de département ou de client (ou `00_Livrables/Autres/` dans le doute). Seul `Z_Inbox/` reste toujours dans `00_Livrables/`.

Restent dans leur dossier, car ce sont du contexte et pas des livrables : les notes, les fiches de process, les réflexions de Strategie, les documents comptables, `sources/`.

Entrées : transcript de call dans `07_Meeting/` (règle dans `07_Meeting/Meeting.md`) ; article, vidéo, newsletter dans `08_Ressources/Veille/sources/` ; idée ou fichier sans contexte dans `00_Livrables/Z_Inbox/`. Une décision qui change une zone protégée (prix, offre, marque) est proposée en diff, jamais écrite directement.

## 8. Rituels

Lire `10_Skills/<nom>/SKILL.md` avant d'appliquer un rituel.

| Quand | Commande | Ce qu'elle fait |
|---|---|---|
| Fin de session | `/done` | extrait décisions et faits, écrit le journal du jour, réécrit Où on en est, date les décisions dans Cadre, coche les Étapes, propose l'archivage d'un projet fini |
| Le vendredi | `/weekly-review` | bilan, report des cases non cochées, plan de la semaine |
| Le soir, si vous aimez | `/daily-review` | énergie, victoires, frictions, focus du lendemain |
| Inbox pleine | `/inbox-processor` | route chaque item de `Z_Inbox/` vers sa place et range les livrables de plus de 15 jours |
| Gros lot à digérer | `/import` | trie par passes |
| Une fois par mois | `/lint` | santé du workspace |
| Source qui mérite de durer | `/notes-permanentes` | une page dans `08_Ressources/Veille/wiki/` |
| Tâche faite trois fois à la main | `/create-skill` | en fait un skill dans `10_Skills/` |
| Cartographier ses process | `/map-process` | liste vos tâches récurrentes, repère celles à automatiser (skill ou routine) |
| Documenter un process | `/fiche-process` | une fiche détaillée dans `05_Departements/<Département>/Process/`, matière première d'un skill |
| Faire évoluer un skill | `/ameliorer-skill` | en fin de discussion, tire des principes de vos retours et propose des modifications du skill |
| Faire des slides | `/slide` | slides HTML minimalistes (live, bootcamp, webinaire), export PDF |
| Nouvel outil | `/connect-mcp` | installe le serveur MCP |
| Chercher un skill existant | `/find-skills` | cherche dans la bibliothèque publique |

Le ruissellement de `/done` : le journal (direct), la note du dossier (direct), puis `01_About-Me/` et `02_Contexte/` en diff validé. En cas de contradiction entre un fichier et la conversation, l'info la plus récente gagne. Une tâche, une session, puis `/done`.
