# Charte motion — Sauvage Watches

Règles visuelles et éditoriales des vidéos Instagram (story et post) de Sauvage Watches.
Elles sont tirées des motions validés par le client : « Coup de foudre » (nov. 2026) et
« Recherche personnalisée — Submariner ». Les valeurs ci-dessous sont celles de
`base/sauvage.css` et `base/motion.js` : en cas de doute, ces fichiers font foi.

Références vidéo : `pub/Sauvage watches/coup de foudre/` (versions 15 s validées) et
`pub/Sauvage watches/sauvage-story-recherche-submariner.mp4`.

---

## 1. Esprit

- **Une maison de confiance, pas une boutique bruyante.** Fond vert profond, beaucoup d'air,
  un seul message par écran. Le luxe vient de la retenue et de la précision du mouvement.
- **Le vocabulaire de la rencontre** pour tout ce qui touche au Coup de foudre : « la bonne »,
  « on fait les présentations », « coup de cœur », « match », « faire tourner la tête ».
  C'est le ton du site (catalogue `matchmaking.*` dans `packages/base/src/i18n/messages/fr.js`).
- **Montrer le produit réel** : vraies montres du stock, vrais prix, vraies références,
  et une démonstration du parcours du site (doigt qui touche, carte qui glisse).

## 2. Formats

| Format | Taille | Usage | Zone utile |
|---|---|---|---|
| Story / Reel | 1080 × 1920 (9:16) | stories, reels | 1080 × 1350 centrée, réduite à 98 %, remontée de 30 px |
| Post | 1080 × 1350 (4:5) | fil | toute l'image |

- Les deux formats partagent **une seule mise en page**, dessinée dans le cadre 1080 × 1350
  (classe `.safe`). En story, les bandes haute (~285 px, en-tête du profil) et basse
  (~300 px, barre de réponse) ne portent que le fond : rien d'important n'y va.
- 30 images/s, H.264 (CRF 16, `yuv420p`, `faststart`), **sans son** : la musique est
  ajoutée dans Instagram à la publication.
- Durée : **15 s maximum** (format validé). 10 s pour un message simple.
- Nommage : `sauvage-<campagne>_<story|post>_<largeur>x<hauteur>[_<durée>].mp4`,
  rangé dans `pub/Sauvage watches/<campagne>/`. Les versions remplacées vont dans `old/`.

## 3. Couleurs

| Jeton | Valeur | Rôle |
|---|---|---|
| `--green` | `#0f2a1d` | fond principal ; texte sur crème |
| `--green2` | `#163d2a` | surfaces posées sur le fond (chips, bouton ✕) |
| `--green3` | `#234c38` | état actif d'une surface verte |
| `--line` | `#315d47` | filets, contours, texte secondaire sur crème |
| `--glow` | `#1b4532` | centre lumineux du dégradé |
| `--cream` | `#f7ede0` | texte sur vert, cartes, boutons pleins, écran de révélation |
| `--cream2` | `#ede4d8` | bas du dégradé des photos |
| `--cream3` | `#e3d9cc` | texte secondaire sur vert, contours sur crème |
| `--flash` | `#fffaf2` | éclair des transitions |

Ce sont les couleurs du site (`theme.colors` et `theme.surfaces` dans
`sites/sauvage-watches/site.config.js`). Pas d'autre couleur, sauf celles des montres.
Vert et crème s'alternent : **vert pour le parcours, crème pour le moment fort**
(révélation), puis retour au vert pour la signature.

## 4. Fonds, dégradés, textures

- **Dégradé de fond** (`.bg-green`) :
  `radial-gradient(120% 80% at 50% 38%, #1b4532 0%, #163d2a 35%, #0f2a1d 75%)`.
  La lumière vient du haut et du centre, les bords restent sombres.
- **Monogramme SW en filigrane** (`.bg-icon`) : icône blanche, 1500 px de large, centrée,
  **opacité 4,5 %**. Elle tourne lentement de −8° (+1,2°/s) et grossit de 1,5 %/s
  (`Motion.background(t)`). Elle est présente sur tous les écrans verts.
- **Grain** (`.grain`) : bruit fractal SVG, opacité 7 %, mode `overlay`. Il casse l'aplat
  numérique.
- **Écran crème** (`.bg-cream`) : aplat `#f7ede0`, sans filigrane ni grain. C'est la respiration.

## 5. Typographie

| Rôle | Police | Taille (cadre 1080) | Détails |
|---|---|---|---|
| Titre d'accroche | Poppins Bold | 120–130 px | interlettrage −0,02 em, interligne 1,02 |
| Titre de scène | Poppins Bold | 80–92 px | 2 lignes max |
| Titre de révélation | Poppins Bold | 170–200 px | interligne 0,95, se termine par un point |
| Surtitre | HK Grotesk ExtraBold | 30 px | capitales, interlettrage 0,22 em |
| Texte courant | HK Grotesk Regular | 38–48 px | phrase courte |
| Mentions | HK Grotesk ExtraBold | 24–27 px | capitales, 0,2 em, `--cream3` |

- Texte crème sur vert et vert sur crème, jamais de blanc pur.
- Rien sous 24 px : la vidéo est vue sur téléphone.
- Les titres apparaissent **mot à mot**. Chaque mot monte hors d'un masque (`.line` /
  `.word`, fonction `words()`) avec un décalage de 0,05 à 0,1 s, et sort par le haut.

## 6. Composants

Tous sont dans `base/sauvage.css`.

- **Bouton plein** (`.btn`) : pilule crème, texte vert ExtraBold 40–44 px, flèche ou cœur à
  droite. C'est l'appel à l'action ; un seul par écran.
- **Pastille contour** (`.pill-outline`) : filet `--line` 2 px, texte `--cream3`. Elle sert
  aux surtitres d'accroche (« Nouveau · Sauvage Watches »).
- **Chips** (`.chip`) : pilules vertes `--green2` à contour `--line`. Une chip sélectionnée se
  remplit de crème (le remplissage grossit de 60 % à 100 %) et fait un petit rebond.
- **Carte montre** (`.card`), calquée sur la fiche du site : 680 × 820, rayon 44 px, crème,
  ombre portée profonde. Elle comprend :
  - une photo sur dégradé `#fffaf3 → --cream2`, avec l'année en vignette blanche en haut à droite ;
  - en dessous, « MARQUE · « Surnom » » en capitales, puis le modèle en Poppins 50 px ;
  - une ligne avec le prix (Poppins 44 px), « Réf. … » et « Full set » en pastilles contour.
- **Tampons** (`.stamp`) : « PASSER » en contour vert incliné à +12° ; « ♥ COUP DE CŒUR » en
  plein vert incliné à −12°. Ils apparaissent pendant le glissement, en passant de 140 % à
  100 % de taille.
- **Boutons ronds** (`.rb`) : ✕ (vert, contour) et ♥ (crème), 128 px. Ils pulsent quand
  l'action correspondante a lieu.
- **Doigt** (`.finger`) : disque blanc translucide de 104 px avec un anneau blanc. Il se pose,
  appuie (−18 %) et glisse ; il rend le parcours lisible sans texte.
- **Éclair** (`SVG.bolt`) : pictogramme anguleux, dans l'esprit du monogramme. Il annonce
  le « coup de foudre ».
- **Carte de fin** (`.endcard`), toujours la même :
  - logo vertical blanc de 520 px, puis un filet de 120 px ;
  - l'URL en ExtraBold, le chemin en Regular `--cream3` ;
  - un bouton plein, puis une mention en capitales.

## 7. Mouvement

- **Courbes** : `eOut5` pour les entrées (arrivée nette qui se pose), `eIn` pour les sorties,
  `eInOut` pour les gestes et transitions, `eBack` (léger dépassement) pour les boutons et
  pictogrammes. Jamais de mouvement linéaire.
- **Transitions entre scènes** :
  1. **Cercle crème** qui s'ouvre depuis l'élément choisi (`clip-path: circle()`, 0,5 s),
     précédé d'un **double éclair blanc** (opacités 75 % puis 50 %, ~0,1 s chacun) ;
  2. **Panneau vert qui monte** du bas avec des coins arrondis qui se redressent (0,5 s),
     pour aller vers la signature ;
  3. Sinon, les éléments sortent par le haut pendant que les suivants entrent par le bas.
- **Pendant un plan fixe**, l'image ne s'arrête jamais complètement : léger zoom
  (+3 à 4 %), filigrane qui tourne.
- **Rythme, pour 15 s** :

  | Temps | Contenu |
  |---|---|
  | 0 – 2 s | accroche |
  | 2 – 4 s | démonstration |
  | ensuite | environ 1 s de lecture par carte avant chaque geste |
  | à la fin | ≈ 3 s de révélation, puis ≥ 2,4 s de signature |

  Le dernier écran reste affiché assez longtemps pour lire l'URL.

## 8. Photos de montres

- **Source** : photo fournie par le client, ou visuel fabricant sur fond uni.
- **Détourage** : `outils/detourage.py`. Le fond uni est rempli depuis les bords, avec un
  contrôle par IA : un recouvrement inférieur à 97 % signifie qu'il faut vérifier à l'œil.
  Le haut et le bas du bracelet sont estompés sur 13 % de la hauteur, pour que la coupe
  nette des photos fabricant disparaisse dans la carte.
- **Rangement** : `assets/montres/<marque>-<modele>-<surnom>-<reference>.png`, 900 px de haut
  au maximum.
- **Informations affichées** : uniquement celles de la table Supabase `watches` (projet
  « Sauvage watches »), à savoir `model`, `reference`, `price`, `year` et le surnom tiré de
  `name`. Ne jamais inventer un prix, une année ou une caractéristique. Vérifier aussi
  `is_sold = false` avant de mettre une montre en avant.

## 9. Rédaction

- Phrases courtes, vouvoiement, ponctuation française (espace insécable avant « ? » et « ! »,
  guillemets « »).
- Une idée par écran ; le titre fait le travail, le sous-texte précise.
- **Formules validées** : « Vous cherchez la bonne ? » · « Dites-nous ce que vous cherchez. » ·
  « Glissez à droite si le cœur y est. » · « Coup de foudre. » ·
  « Votre prochain match se porte au poignet. » · « Essayez le Coup de foudre ».
- **Refusées ou retirées par le client** (ne pas les réutiliser sans son accord) :
  - « Arrive bientôt » sur les cartes ;
  - « Garanties 1 an » dans la signature ;
  - « Une montre à la fois », jugée peu claire. Le client préfère une formule qui évoque le
    fonctionnement « à la Tinder » : match, swipe, coup de cœur.
- La signature finit sur « Montres de luxe d'occasion ».

## 10. Méthode de travail avec le client

1. Proposer les textes (accroche, révélation) **avant** de lancer l'export final : le client
   valide la formulation, puis on regénère. Montrer des images fixes pour valider une mise en
   page.
2. Toujours livrer **les deux formats** (story et post) de la même version.
3. Ranger les vidéos livrées dans `pub/Sauvage watches/<campagne>/` et garder la composition
   source dans `kit-motion/compositions/<campagne>/`.

## 11. Utiliser le kit

```
kit-motion/
├── CHARTE.md                 ce document
├── base/sauvage.css          jetons, fonds, typo, composants
├── base/motion.js            cadre story/post, courbes, words(), Motion.start()
├── assets/fonts|logos|montres
├── compositions/_modele/     point de départ (10 s : accroche → montre → révélation → signature)
├── compositions/coup-de-foudre/  motion livré en nov. 2026 (15 s)
└── outils/render.cjs, outils/detourage.py
```

Aperçu : ouvrir `compositions/<nom>/index.html` dans un navigateur (`?format=post` pour le
4:5). Export, depuis `kit-motion/` (ffmpeg et Playwright Chromium requis) :

```bash
node outils/render.cjs compositions/<nom> story stills /tmp/apercu 1 4 8
node outils/render.cjs compositions/<nom> story video "../<campagne>/sauvage-<campagne>_story_1080x1920_15s.mp4"
node outils/render.cjs compositions/<nom> post  video "../<campagne>/sauvage-<campagne>_post_1080x1350_15s.mp4"
```

Une composition décrit tout l'état de l'image avec `render(t)`, sans animation CSS : le
rendu est identique d'une machine à l'autre.
