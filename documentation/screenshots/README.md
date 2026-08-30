# Captures de référence

Le rendu d'une vitrine n'est lisible ni dans le code ni dans un manifest. Ce dossier accueille des
captures datées, une sous-dossier par client, pour qu'une revue, un support commercial ou un agent
puisse voir à quoi ressemble réellement le site.

## Générer

```sh
npm run screenshots:sauvage      # ou :place, :jackned
SITE_ID=demo-store npm run screenshots
```

Le script (`scripts/capture-screenshots.mjs`) lance un serveur Vite pour le `SITE_ID` demandé,
parcourt les routes en desktop (1440×900) et mobile (390×844), et écrit des JPEG pleine page dans
`documentation/screenshots/<site-id>/`, plus un `INDEX.md` daté.

Options : `--routes`, `--viewports`, `--port`, `--out`, `--quality`, `--locale`, `--keep-server`.

```sh
node scripts/capture-screenshots.mjs --routes=/,/collection --viewports=mobile --quality=85
```

## Lancer depuis un poste disposant du `.env` du client

**C'est la condition pour obtenir des captures représentatives.** Le contenu (montres, articles,
sélections d'accueil, avis) vient de Supabase. Sans `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`
valides, le script bascule sur des valeurs factices : l'application se rend, mais dans ses **états
vides** — pas de catalogue, pas de blog, et un hero d'accueil dégradé puisque la montre exposée est
chargée depuis le catalogue.

Ce que le script gère déjà pour que la capture soit exploitable :

- **Page de maintenance** franchie (drapeau `maintenance_authenticated_<siteId>` posé en
  `localStorage`) — sinon toutes les routes rendent « site en construction ».
- **Bandeau cookies** accepté au premier chargement, sinon il masque le bas de page.
- **Langue** forcée à `fr-FR` (`--locale` pour en changer) : un navigateur headless annonce
  `en-US` et un site multilingue se rendrait en anglais.
- **Éléments collants** (`position: fixed` / `sticky`) repositionnés en haut avant la capture
  pleine page, sinon l'en-tête est dessiné au milieu de l'image.
- **Animations d'apparition** laissées se terminer après un aller-retour de défilement, qui
  déclenche aussi les images en `loading="lazy"`.

## Convention

```
documentation/screenshots/
  <site-id>/
    accueil-desktop.jpg
    accueil-mobile.jpg
    collection-desktop.jpg
    …
    INDEX.md          # liste + date de génération
```

Les captures sont **datées, pas continues** : elles ne se régénèrent pas toutes seules. Avant de
s'appuyer sur une capture pour juger le rendu actuel, vérifier la date dans `INDEX.md`. En cas de
doute, la lancer à nouveau coûte deux minutes.

Régénérer après une refonte visuelle, un changement de thème ou l'ajout d'un client. Ne pas
committer de captures produites sans base de données : elles montrent des pages vides et
induisent en erreur.
