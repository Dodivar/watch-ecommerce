# Template nouveau site (`SITE_ID`)

Ce dossier **n’est pas** un site buildable : il sert de référence pour créer `sites/<votre-site-id>/`.

## Checklist d’onboarding

1. **Copier un site existant comme base** (recommandé)  
   Dupliquer `sites/sauvage-watches/` vers `sites/<SITE_ID>/` (ou partir de `sites/demo-store` comme squelette déjà neutre).

2. **Renommer et éditer** `site.config.js`  
   - `siteId`, `brand`, `contact`, `legal`, `urls`, `social`, `copy`, `integrations`, `seo` (toutes les sections utilisées par le socle `packages/base`).
   - **Page d’accueil** : sans `home.sections` (ou tableau vide), la route `/` n’affiche aucun bloc ; renseigner explicitement les ids dans `home.sections` pour composer l’accueil (voir [documentation/multi-client.md](../../documentation/multi-client.md) section « Page d’accueil » et `packages/base/src/site/homeSections.js`).

3. **Assets marque**  
   Placer logos et visuels sous `sites/<SITE_ID>/src/assets/` en respectant les chemins attendus par les imports `@site/*` dans `packages/base` (voir grep `@site/` dans le socle).

4. **`public/`**  
   Favicons, `robots.txt`, `site.webmanifest`, polices — adaptés au client (`Sitemap:` dans `robots.txt`, nom court dans le manifest).

5. **Variables d’environnement**  
   Configurer le projet Vercel du client : `SITE_ID`, `VITE_SUPABASE_*`, `SUPABASE_*` pour `api/sitemap`, `BASE_URL` / `VITE_BASE_URL`, etc. Voir [documentation/multi-client.md](../../documentation/multi-client.md).

6. **Backend**  
   Si le front parle au serveur Express, renseigner `BACKEND_CORS_ORIGINS` avec les domaines du nouveau client.

7. **Validation**  
   `npm run dev` avec `SITE_ID=<votre-site-id>` puis `SITE_ID=<votre-site-id> npm run build`.

## Fichiers exemple

- `index.html.example` — même squelette que les sites réels (placeholder SEO remplis au build).
- `main.js.example` — point d’entrée pont vers `@/main.js`.

Copier-les vers `index.html` et `main.js` dans le nouveau dossier `sites/<SITE_ID>/`.
