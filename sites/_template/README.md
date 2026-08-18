# Template nouveau site (`SITE_ID`)

Ce dossier **n’est pas** un site buildable : il sert de référence pour créer `sites/<votre-site-id>/`.

## Checklist d’onboarding

1. **Copier un site existant comme base** (recommandé)  
   Dupliquer `sites/sauvage-watches/` vers `sites/<SITE_ID>/` (ou partir de `sites/demo-store` comme squelette déjà neutre).

2. **Renommer et éditer** `site.config.js`  
   - `siteId`, `brand`, `contact`, `legal`, `urls`, `social`, `copy`, `integrations`, `seo` (toutes les sections utilisées par le socle `packages/base`).
   - **Page d’accueil** : sans `home.sections` (ou tableau vide), la route `/` n’affiche aucun bloc ; renseigner explicitement les ids dans `home.sections` pour composer l’accueil (voir [documentation/multi-client.md](../../documentation/multi-client.md) section « Page d’accueil » et `packages/base/src/site/homeSections.js`).

3. **Langues** (facultatif)
   Pour un site multilingue, ajouter le bloc `i18n` au manifest et envelopper les textes dans `t({ fr, en, de })` — voir [documentation/i18n/README.md](../../documentation/i18n/README.md). Sans ce bloc, le site reste monolingue et se comporte comme avant.

   ```js
   i18n: { enabled: true, defaultLocale: 'fr', locales: ['fr', 'en', 'de'] },
   ```

4. **Assets marque**  
   Placer logos et visuels sous `sites/<SITE_ID>/src/assets/` en respectant les chemins attendus par les imports `@site/*` dans `packages/base` (voir grep `@site/` dans le socle).

5. **`public/`**  
   Favicons, `robots.txt`, `site.webmanifest`, polices — adaptés au client (`Sitemap:` dans `robots.txt`, nom court dans le manifest).

6. **Variables d’environnement**  
   Configurer le projet Vercel du client : `SITE_ID`, `VITE_SUPABASE_*`, `SUPABASE_*` pour `api/sitemap`, `BASE_URL` / `VITE_BASE_URL`, etc. Voir [documentation/multi-client.md](../../documentation/multi-client.md).

7. **Backend**  
   Si le front parle au serveur Express, renseigner `backend.publicApiUrl` dans `site.config.js` (prod : `https://watch-ecommerce-mp9l.onrender.com`) et `BACKEND_CORS_ORIGINS` côté Render avec les domaines du nouveau client.

8. **Catalogue (migration PrestaShop)**  
   Si le client vient de PrestaShop : import réalisé par l’équipe technique (pas d’accès admin client). Préparer `prestashop-import.mapping.json`, exporter le CSV produits (+ CSV images), appliquer la migration SQL documentée dans [`scripts/prestashop-import/README.md`](../../scripts/prestashop-import/README.md), puis lancer `npm run db:import-prestashop` (aperçu) avant `npm run db:import-prestashop:apply`.

9. **Validation**  
   `npm run dev` avec `SITE_ID=<votre-site-id>` puis `SITE_ID=<votre-site-id> npm run build`.

## Fichiers exemple

- `index.html.example` — même squelette que les sites réels (placeholder SEO remplis au build).
- `main.js.example` — point d’entrée pont vers `@/main.js`.

Copier-les vers `index.html` et `main.js` dans le nouveau dossier `sites/<SITE_ID>/`.
