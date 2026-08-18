# Watch e-commerce — monorepo multi-clients

Socle e-commerce **Vue 3 + Vite** : code partagé dans `packages/base`, vitrines par marque sous `sites/<SITE_ID>/`. Le site construit et déployé est choisi **au moment du build** via la variable d’environnement `SITE_ID`.

Documentation détaillée : [documentation/multi-client.md](documentation/multi-client.md).

## Principes du monorepo multi-sites

- `**packages/base`** — composants, services et configuration communs à toutes les vitrines.
- `**sites/<SITE_ID>/`** — un dossier par client ou marque : `site.config.js`, `index.html`, `main.js`, `public/`, `src/` (obligatoire pour l’alias `@site/*`). Exemples : `sauvage-watches`, `demo-store`, gabarit `_template`.
- **Un projet Vercel par client** (recommandé) — même dépôt et branches (`staging` / `main`), mais `SITE_ID` et variables d’environnement propres à chaque déploiement.
- **Un projet Supabase par client** — URL et clés injectées dans le projet Vercel correspondant.
- **Backend Express** (`backend/`) — déployé sur Render (`https://watch-ecommerce-mp9l.onrender.com`) ; en production, renseigner `BACKEND_CORS_ORIGINS` avec les domaines des fronts autorisés.

### Évolution récente : passage multi-clients

Les builds ne présument plus un seul site : `**SITE_ID` est obligatoire pour `npm run build`** (sinon le build échoue volontairement). En développement local, si `SITE_ID` est absent, la valeur par défaut est `sauvage-watches`.

**Projets Vercel déjà existants** : si le build utilisait encore `npm run build` sans variable dédiée, ajouter `SITE_ID=sauvage-watches` (ou l’identifiant du site concerné) dans les variables d’environnement du projet.

Les préférences par marque (feature flags, wording spécifique) se configurent de préférence dans `sites/<SITE_ID>/site.config.js` plutôt que par multiplication de branches ou de variables `VITE_`* booléennes.

### Scripts utiles


| Commande                                        | Rôle                                                       |
| ----------------------------------------------- | ---------------------------------------------------------- |
| `npm run dev`                                   | Dev ; `SITE_ID` implicite `sauvage-watches` si non défini. |
| `npm run build`                                 | Build production ; `**SITE_ID` obligatoire**.              |
| `npm run dev:sauvage` / `npm run build:sauvage` | Force `SITE_ID=sauvage-watches`.                           |
| `npm run build:demo-store`                      | Build du site démo `sites/demo-store`.                     |


Sous PowerShell, pour un autre site :

```powershell
$env:SITE_ID = "mon-client"
npm run dev
```

Variables d’environnement (Vite, API serverless, backend), matrice déploiements et alias `@site/*` dans l’IDE : voir [documentation/multi-client.md](documentation/multi-client.md).

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

`jsconfig.json` pointe `@site/*` vers `sites/sauvage-watches/src/*` pour le confort de l’éditeur ; pour travailler sur un autre site, ajuster temporairement ce chemin ou ouvrir les fichiers sous `sites/<SITE_ID>/src/`.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Multilingue (fr / en / de)

`sites/sauvage-watches` et `sites/place-des-montres` sont servis en français, anglais et allemand. Un site déclare ses langues par un bloc `i18n` dans son manifest ; sans ce bloc il reste monolingue. Les textes du client se traduisent sur place avec `t({ fr, en, de })`, ceux de l’interface vivent dans `packages/base/src/i18n/messages/`. Conventions, URLs préfixées, garde-fous de traduction et périmètre laissé en français : voir [documentation/i18n/README.md](documentation/i18n/README.md).

## Ligne éditoriale

Pour le site `sites/sauvage-watches` : avant toute modification ou ajout de texte, consulter [documentation/ligne-editoriale.md](documentation/ligne-editoriale.md) (ton, vocabulaire, valeurs, conventions, exemples).

Pour les autres vitrines sous `sites/<SITE_ID>/`, suivre la ligne éditoriale du client concerné ; l’agent Cursor ne charge une règle dédiée que si un fichier `.cursor/rules/<site-id>-editorial.mdc` existe pour ce site.

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```

(`SITE_ID` requis — voir ci-dessus ou les scripts `build:*`.)

### Tests

```sh
npm test
```

Suite Vitest (unitaires socle, contrats sur tous les `site.config.js`, registry backend). À lancer avant toute PR touchant `packages/base` ou `sites/*`. Détail : [documentation/testing.md](documentation/testing.md).

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```

