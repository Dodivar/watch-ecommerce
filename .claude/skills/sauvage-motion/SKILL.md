---
name: sauvage-motion
description: Créer ou modifier une vidéo, un motion design, une story, un reel ou un post Instagram animé pour le client Sauvage Watches (sauvage-watches.fr) — présentation d'une fonctionnalité du site (Coup de foudre, recherche personnalisée, rachat…), mise en avant de montres du stock, publicité. Utilise le kit motion du dépôt (charte, gabarits, détourage, export MP4). À charger dès qu'une demande parle de vidéo, d'animation ou de visuel Instagram pour Sauvage, même sans le mot « motion ».
---

# Motion design Sauvage Watches

Le kit est dans `pub/Sauvage watches/kit-motion/`. Avant toute création, lire
**`pub/Sauvage watches/kit-motion/CHARTE.md`** en entier : couleurs, fonds, typographie,
composants, mouvement, rédaction, et les formulations que le client a refusées.

## Règles qui ne se discutent pas

- Partir du kit, jamais d'une page blanche : `base/sauvage.css` + `base/motion.js`, et
  `compositions/_modele/` ou une composition existante comme point de départ.
  Fond vert dégradé, filigrane SW, grain, cartes crème, boutons et signature restent ceux du kit.
- Deux formats à chaque livraison : story 1080 × 1920 et post 1080 × 1350, même version.
  15 s maximum, 30 i/s, sans son.
- Montres : les informations (modèle, référence, prix, année, surnom) viennent de la table
  `watches` du projet Supabase « Sauvage watches » (`kwdtcjqcrnzmusejaprx`). Vérifier
  `is_sold = false`. Ne jamais inventer une donnée. Pas de badge « Arrive bientôt », pas de
  mention « Garanties 1 an », sauf demande explicite du client.
- **Demander la validation des textes avant l'export final** : proposer 3 ou 4 formulations,
  dans le ton « rencontre » du site, puis regénérer une fois le choix fait.

## Déroulé

1. **Brief** : objectif, fonctionnalité ou montres à montrer, durée, page de destination
   (URL de la signature). Relire le parcours concerné dans le site
   (`packages/base/src/i18n/messages/fr.js`, `sites/sauvage-watches/site.config.js`)
   pour reprendre ses mots.
2. **Montres** : requête Supabase pour les fiches. Détourer les photos fournies :
   ```bash
   python3 -I outils/detourage.py <photo> assets/montres/<marque>-<modele>-<surnom>-<ref>.png
   ```
   Il faut `pip install "rembg[cpu]" scipy` pour le contrôle IA. Si le recouvrement annoncé
   est inférieur à 97 %, regarder le PNG sur fond vert avant de l'utiliser.
3. **Composition** : copier `compositions/_modele/` vers `compositions/<campagne>/`, puis
   écrire les scènes dans `render(t)`. L'état visuel doit être entièrement déterminé par `t` :
   pas d'animation CSS, pas de minuterie. Les mesures sont posées dans le cadre 1080 × 1350.
4. **Contrôle** : exporter des images fixes aux moments clés, dans les deux formats, et les
   regarder (textes coupés, chevauchements, zones de story, lisibilité sur téléphone) :
   ```bash
   cd "pub/Sauvage watches/kit-motion"
   node outils/render.cjs compositions/<campagne> story stills /tmp/apercu 1 4 8 12
   node outils/render.cjs compositions/<campagne> post stills /tmp/apercu 4 8
   ```
5. **Validation des textes** par l'utilisateur.
6. **Export** des deux vidéos dans `pub/Sauvage watches/<campagne>/`. Nommage :
   `sauvage-<campagne>_<story|post>_<l>x<h>[_<durée>].mp4`. Les anciennes versions vont dans `old/`.
   ```bash
   node outils/render.cjs compositions/<campagne> story video "../<campagne>/sauvage-<campagne>_story_1080x1920_15s.mp4"
   node outils/render.cjs compositions/<campagne> post  video "../<campagne>/sauvage-<campagne>_post_1080x1350_15s.mp4"
   ```
   Vérifier la durée et la taille avec `ffprobe`, et regarder une bande d'images extraite de la
   vidéo finale.
7. **Livraison** : envoyer les deux fichiers et rappeler d'ajouter la musique dans Instagram.
   Si une règle nouvelle est validée par le client (formulation acceptée ou refusée,
   composant ajouté), la reporter dans `CHARTE.md`.

## Prérequis

- `ffmpeg` dans le PATH.
- Playwright avec Chromium (`require('playwright')` ou `@playwright/test`, déjà en
  devDependency du dépôt ; en local : `npx playwright install chromium`).
- Polices et logos : déjà copiés dans `kit-motion/assets/`. Sources dans
  `sites/sauvage-watches/public/fonts` et `sites/sauvage-watches/src/assets/logos`.
- `*.md` est gitignoré dans ce dépôt : un nouveau document Markdown du kit se versionne avec
  `git add -f`.
