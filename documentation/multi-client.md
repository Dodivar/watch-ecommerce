# Multi-clients : `SITE_ID`, variables d'environnement, déploiements

> Ce document a été reconstitué à partir du code (`vite/`, `scripts/`, `.github/workflows/`,
> `.env.example`, `vercel.json`). Si tu disposes d'une version locale antérieure plus riche,
> fusionne-la : git refusera d'écraser un fichier non suivi, donc rien n'est perdu.

Un seul dépôt, un seul socle, **une vitrine par client**. Ce qui change d'un client à l'autre :
le dossier `sites/<SITE_ID>/`, un projet d'hébergement, un projet Supabase, des comptes tiers.
Ce qui ne change pas : `packages/base`, le backend Render, la CI.

## `SITE_ID` : la variable qui décide de tout

`vite/resolve-site.mjs` la résout dans cet ordre : `SITE_ID`, puis `VITE_SITE_ID`.

| Commande | Comportement si `SITE_ID` est absent |
| --- | --- |
| `npm run dev` (`vite serve`) | Retombe sur `sauvage-watches` — **confort de dev uniquement** |
| `npm run build` (`vite build`) | **Échec volontaire** avec un message d'exemple Unix / PowerShell |

Le build échoue aussi si le dossier `sites/<SITE_ID>/` n'existe pas, s'il n'a pas de
`site.config.js`, ou s'il n'a pas de dossier `src/` (l'alias `@site/*` pointe dessus).

```sh
# Unix
SITE_ID=mon-client npm run build
# PowerShell
$env:SITE_ID = "mon-client"; npm run build
```

Raccourcis existants : `dev:sauvage`, `dev:place`, `dev:jackned`, `build:sauvage`, `build:place`,
`build:jackned`, `build:demo-store`.

## Ce que le build fabrique à partir du manifest

`vite/vite.config.mjs` charge `sites/<SITE_ID>/site.config.js`, puis monte deux plugins :

- **`merge-base-public.mjs`** — fusionne `packages/base/public/` (logos de marques partagés sous
  `/brands/vendor/*`) avec le `public/` du site : middleware en dev, copie dans `outDir` au build.
- **`site-from-config.mjs`** — génère le CSS de thème (module virtuel `virtual:site-theme.css`),
  remplit les marqueurs `__…__` de `index.html` (titre, meta, JSON-LD, `theme-color`) et émet une
  coquille `index.html` par langue secondaire. Détail visuel :
  [design-system.md](design-system.md).

Alias Vite : `@/*` → `packages/base/src/*`, `@site/*` → `sites/<SITE_ID>/src/*`,
`@site-config` → le manifest du site actif.

Avertissement au build si ni `VITE_BACKEND_URL` ni `backend.publicApiUrl` ne sont définis : les
formulaires et le checkout échoueraient en production.

## Variables d'environnement (front)

Modèle complet et commenté : [`.env.example`](../.env.example). Les principales :

| Variable | Rôle |
| --- | --- |
| `SITE_ID` | Site à construire — **obligatoire au build** |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | Projet Supabase du client |
| `VITE_BACKEND_URL` | Backend Render (sinon `backend.publicApiUrl` du manifest) |
| `VITE_PURCHASE_ENABLED` | Coupe-circuit achat ; les boutons n'apparaissent que si cette valeur n'est pas la chaîne `false` **et** `features.purchase` est vrai |
| `VITE_BASE_URL` / `VITE_BASE_PATH` | URL canonique et sous-chemin (GitHub Pages) |
| `VITE_GA_ID`, `VITE_GOOGLE_ADS_ID`, `VITE_GOOGLE_ADS_PURCHASE_LABEL`, `VITE_META_PIXEL_ID` | Mesure et attribution — chargés uniquement avec le consentement « publicité » |
| `VITE_GOOGLE_PLACES_API_KEY` | Carte boutique + autocomplétion d'adresse au checkout |
| `SUPABASE_SERVICE_ROLE_KEY` | Scripts de maintenance uniquement, **jamais** exposé au front |

Règle générale : ce qui est **public et propre à la marque** va dans `site.config.js` ; ce qui est
**secret ou propre à l'environnement** va dans les variables d'environnement.

## Variables d'environnement (backend)

Le backend Render est **unique et partagé**. Il résout le site par `Origin`, `X-Site-Id` ou
`:siteId`, puis lit les secrets préfixés : `SITE_<ID_EN_MAJUSCULES>__<CLE>`
(ex. `SITE_PLACE_DES_MONTRES__STRIPE_SECRET_KEY`). Détail et liste des clés :
[backend/README.md](../backend/README.md).

En production, renseigner `BACKEND_CORS_ORIGINS` avec les domaines des fronts autorisés.

## Matrice de déploiement

| Cible | Déclencheur | Configuration |
| --- | --- | --- |
| **Vercel** (recommandé, un projet par client) | Push sur `staging` / `main` | `buildCommand: npm run build:vercel`, `SITE_ID` dans les variables du projet. `vercel.json` gère la réécriture SPA, `/sitemap.xml` → `api/sitemap.js`, et la redirection `/fr/*` → `/*` |
| **GitHub Pages** (`place-des-montres`) | Push sur `staging` touchant `packages/**`, `sites/place-des-montres/**`, `vite/**` | `.github/workflows/deploy-place-github-pages.yml`, environnement `github-pages`, `VITE_BASE_PATH=/<repo>/` |
| **Render** (backend) | Push sur la branche suivie | Service unique multi-tenant |

`npm run build:vercel` (`scripts/vercel-build.mjs`) valide `SITE_ID` **avant** de déléguer au
build Vite, puis enchaîne `generate-vercel-seo-redirects.mjs` et `prerender-static-routes.mjs`.

Un projet Vercel existant qui appelait encore `npm run build` sans variable dédiée doit se voir
ajouter `SITE_ID=<identifiant>` dans ses variables d'environnement.

## Branches

`staging` est la branche d'intégration, `main` la production. Le workflow
`.github/workflows/guard-main-source.yml` est promu en *required status check* sur `main` : une PR
vers `main` dont la source n'est pas `staging` reste non mergeable.

## Ajouter un client

1. Copier `sites/_template/` vers `sites/<SITE_ID>/` (voir [son README](../sites/_template/README.md)) ;
   renommer `index.html.example` et `main.js.example`, créer `src/` et `public/`.
2. Écrire `site.config.js` : `siteId`, `brand`, `contact`, `urls`, `theme`, `features`, `home`,
   `navigation`, `seo`, `backend`. Règles : [sites/CLAUDE.md](../sites/CLAUDE.md).
3. Créer le projet Supabase et appliquer les migrations dans l'ordre
   ([supabase/migrations/README.md](../supabase/migrations/README.md)).
4. Créer le projet d'hébergement avec `SITE_ID` et les variables `VITE_*` du client.
5. Déclarer les secrets backend `SITE_<ID>__<KEY>` sur Render et ajouter le domaine à
   `BACKEND_CORS_ORIGINS`.
6. Lancer `npm run test:contracts` : le nouveau manifest est validé comme les autres.

## Confort d'éditeur

`jsconfig.json` fige `@site/*` sur `sites/sauvage-watches/src/*` pour que l'auto-complétion
fonctionne. **Ce n'est pas le site actif au build** : pour travailler sur un autre client,
ajuster temporairement ce chemin ou ouvrir directement les fichiers sous `sites/<SITE_ID>/src/`.
