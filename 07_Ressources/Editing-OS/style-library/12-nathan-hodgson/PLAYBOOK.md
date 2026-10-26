# Nathan Hodgson — Playbook de montage

> Le DESIGN.md dit à quoi ça ressemble. Ce fichier dit **comment on fabrique un
> reel entier** dans ce style. La preuve à l'appui : le reel « apply to 100
> jobs » (`Db3dRm9s1yg`, 59k vues, son plus gros du mois) décomposé en bas.

La différence fondamentale avec [Nick Saraev](../13-nick-saraev/PLAYBOOK.md),
mesurée sur les 10 reels : **la cadence de Nathan est DANS le plan, pas dans la
coupe**. Ses plans tiennent 3 à 6 secondes — deux fois plus longs que ceux de
Nick — parce qu'à l'intérieur, une interface s'exécute en continu : la requête
se tape, les statuts tombent, le compteur monte. Chez Nick on coupe pour créer
le mouvement ; chez Nathan le mouvement EST le contenu du plan.

Corollaire : ce style se choisit quand le sujet est un **workflow** (une suite
d'étapes qu'on peut rejouer), et celui de Nick quand le sujet est une **news**
(un outil qui vient de sortir, à prouver vite).

---

## Les trois lois

### 1. Chaque étape du workflow devient une séquence d'UI rejouée

Le script de Nathan est toujours une suite d'actions (« upload your CV »,
« say act as a recruiter », « turn on agent mode »...). Chaque action = un plan
où l'interface **fait l'action en direct** :

| L'action dite | Ce qu'on voit s'exécuter |
| --- | --- |
| « say / ask / tell Claude... » | la requête SE TAPE dans la bulle (45 ms/car) — `t1-ui-run` |
| « upload your CV » | la carte du fichier tombe dans la zone de dépôt |
| « turn on agent mode » | le menu s'ouvre, le toggle bascule sous un curseur |
| « it builds a spreadsheet » | les lignes du tableau tombent une par une |
| « it applies for you » | badges qui basculent ✓ + compteur qui monte — `t1-ui-run` |
| le résultat chiffré | le titre dont le nombre COMPTE — `t1-title-rule` |

Le rendu de la parole est donc un storyboard d'exécution : on n'illustre pas ce
qu'il dit, on le **rejoue**.

### 2. Les interfaces sont redessinées, pas capturées

C'est l'inverse exact de Nick. Une capture Retina réduite à 1080 est illisible ;
Nathan reconstruit l'UI en plus grand, plus propre, avec seulement les éléments
dont il parle. La composer bar (« How can I help you today? · Chat · Opus 5 »)
reste visible en bas comme preuve de contexte. Les seules captures réelles :
les pages tierces qu'il commente (un vrai job posting, une vraie page LinkedIn),
toujours zoomées avec la **sélection bleue** comme surligneur (`soc-doc-select`).

### 3. Le sandwich respire mais ne meurt jamais

L'arête graphique/visage vit entre 44 et 60 %. Quand une séquence d'UI se joue,
elle occupe le haut et le visage parle en bas. Les plans plein cadre (titre,
carte de fin) durent 2-3 s max. Et même dans un plan « long », il y a TOUJOURS
un mouvement en cours : la frappe, une jauge, la dérive des blocs crème.
Le test QC est le même que chez Nick : image par image, si rien ne s'exécute,
rien n'entre et personne ne parle à l'écran, le plan est mort.

---

## La recette, étape par étape

1. **Script → beat-map** : découper le script en actions. Chaque action reçoit
   un plan et une séquence d'exécution (table ci-dessus). Les chiffres du hook
   et du payoff reçoivent un `t1-title-rule` avec compteur.
2. **Fabriquer les UI** : pour chaque séquence, dupliquer `t1-ui-run` et
   remplir ses slots (prompt, statuts, lignes, compteur). Pas de course aux
   assets web ici — on redessine. Seules les pages tierces passent par
   `insert-broll` (capture Playwright) puis `soc-doc-select`.
3. **Assembler** : titre → séquences d'UI dans l'ordre du workflow → preuve
   chiffrée → carte violette (`soc-cta-violet`), obligatoire, à −2/−3 s.
   Sous-titres pastille (`soc-captions-pill`) en overlay continu sous l'arête.
4. **QC cadence** interne au plan + `autoverify.py` (PROCESS.md).

Cadence cible : **15-18 coupes/minute**, plans de 2 à 6 s. Ne pas accélérer :
une séquence d'UI coupée avant la fin de son exécution est un plan raté.

---

## La preuve : « apply to 100 jobs » décomposé (Db3dRm9s1yg, 54 s, 59k vues)

| t | Voix | À l'écran | Geste |
| --- | --- | --- | --- |
| 0,0–1,8 | « What happens when you ask Claude... » | carte sombre « ASK CLAUDE » + fichier your-cv.pdf | prop + dépôt de fichier |
| 1,8–4,7 | « ...apply to 100 jobs for you? » | photo du « one guy » en webcam | media plein cadre |
| 4,7–9,9 | « landed 10 interviews in days » | titre « 10 INTERVIEWS » (le 10 compte) → **calendrier qui se remplit** de blocs Interview | title-rule + UI rejouée |
| 9,9–14,6 | « upload your CV and say act as a senior recruiter » | chat Claude : le CV tombe, la requête se tape | ui-run (frappe) |
| 14,6–21,0 | « list the 20 job titles + ATS keywords » | la requête complète se tape, réponse arrive | ui-run (frappe longue) |
| 21,0–27,5 | « rewrite your CV into a master template » | nouveau prompt tapé + aperçu du template à droite | ui-run |
| 27,5–29,4 | « turn on agent mode » | le menu connecteurs s'ouvre, toggle « Claude in Chrome » bascule | UI menu |
| 29,4–37,6 | « go to LinkedIn and Indeed... build a spreadsheet » | prompt tapé → vraie capture du spreadsheet scores | ui-run → doc réel |
| 37,6–45,6 | « apply to the top 100 matched jobs » | « Download all » puis le prompt final se tape | ui-run |
| 45,6–49,0 | « Claude applies whilst you get on with your day » | titre « HANDS OFF » + l'UI applique : ✓ APPLIED, APPLIED 99/100 | t1-ui-run complet |
| 49,0–53,8 | « let me know in the comments » | bulle « Did this land you any interviews? » puis carte violette | cta |

À retenir : 16 plans en 54 s, mais **chaque plan de plus de 3 s contient une
exécution visible** (frappe, remplissage, bascule). Le hook donne le chiffre
(10 interviews) avant la méthode, et le même chiffre revient en payoff
(« HANDS OFF », 99/100) juste avant le CTA.
