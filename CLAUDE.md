# Guide agent — watch-ecommerce

Socle e-commerce **Vue 3 + Vite** multi-clients. Le site construit est choisi **au build** par la
variable `SITE_ID`. Lire ce fichier avant toute intervention ; les détails vivent dans les README
locaux référencés ci-dessous.

## Carte du dépôt

| Chemin | Rôle |
| --- | --- |
| `packages/base/src/` | Socle partagé : composants, services, composables, router, i18n. [README](packages/base/src/README.md) |
| `packages/base/src/site/` | Résolution du manifest client (features, thème, home, SEO, checkout) — **le cœur du multi-site** |
| `sites/<SITE_ID>/` | Une vitrine par client : `site.config.js`, `index.html`, `main.js`, `src/` (alias `@site/*`), `public/` |
| `backend/` | Express multi-tenant déployé sur Render (Stripe, Mailjet, n8n, avis Google). [README](backend/README.md) |
| `api/` | Fonctions serverless Vercel (`sitemap.js`). [README](api/README.md) |
| `vite/` | Config Vite + génération des CSS de thème depuis `site.config.js` |
| `supabase/migrations/` | Migrations SQL à appliquer **par client**. [README](supabase/migrations/README.md) |
| `scripts/` | Imports catalogue (PrestaShop), seed démo, ré-encodage images, pré-rendu |
| `tests/` | Vitest (`base`, `backend`, `api`, `contracts`) + Playwright (`e2e`) |
| `documentation/` | Design system, i18n, avis Google, comptabilité, supports commerciaux |

Sites existants : `sauvage-watches` (référence), `place-des-montres`, `jackned`, `demo-store`,
gabarit `_template`.

## Commandes

```sh
npm install                # node_modules n'est pas versionné : requis avant tests/lint
npm run dev                # SITE_ID implicite = sauvage-watches
npm run dev:place          # idem pour place-des-montres (aussi :sauvage, :jackned)
npm run build              # SITE_ID OBLIGATOIRE, sinon échec volontaire
npm test                   # Vitest — à lancer avant toute PR touchant packages/base ou sites/*
npm run test:contracts     # contrats sur tous les site.config.js
npm run test:e2e           # Playwright
npm run lint               # ESLint --fix
```

CI (`.github/workflows/test.yml`) : `npm ci` puis `npm test` sur chaque push.

## La règle n°1 : la configuration client d'abord

Chaque client vit sous `sites/<SITE_ID>/`. Son manifest est **`sites/<SITE_ID>/site.config.js`**
(jamais `client.config.js` ni un fichier parallèle non demandé).

1. **Identifier le `SITE_ID` actif** — mention de l'utilisateur, chemin ouvert
   (`sites/place-des-montres/...`), ou script npm (`dev:place`). **Ne jamais supposer
   `sauvage-watches`** : c'est seulement le défaut en dev quand `SITE_ID` est absent.
2. **Lire** `sites/<SITE_ID>/site.config.js` et ses imports locaux (`faq.config.js`,
   `homeSelections.config.js`, `services.config.js`, `guide.config.js`).
3. **Préférer la config** aux valeurs en dur dans `packages/base` : contact, copy, thème,
   livraison, feature flags, navigation, SEO.

Détail de la mécanique : `sites/CLAUDE.md`.

## Comportements : où les lire

- **Drapeaux de fonctionnalité** — `packages/base/src/site/siteFeatures.js`
  (`DEFAULT_SITE_FEATURES` est commenté clé par clé). Ils activent routes, entrées de menu et
  blocs d'accueil. Certains sont **dérivés** et ne doivent pas être posés à la main
  (`faq`, `googleReviews`, `serviceLandings`, `watchReference`, `homeNouvelles`).
- **Routes** — `packages/base/src/site/buildAppRoutes.js` construit la table à partir des
  features ; `router.js` y ajoute les gardes (maintenance, admin, vérification de commande) et
  la base d'historique i18n.
- **Accueil** — `home.sections` du manifest, ids validés dans
  `packages/base/src/site/homeSections.js` (`KNOWN_HOME_SECTION_IDS`). Liste vide → accueil sans blocs.
- **Manifest résolu** — `getSiteConfig()` (`packages/base/src/site/getSiteConfig.js`) enrichit
  FAQ, checkout shipping, home, et aplatit les textes `t({ fr, en, de })` dans la langue active.
- **Réseau / métier** — tout passe par `packages/base/src/services/`
  ([README](packages/base/src/services/README.md)) ; les vues restent déclaratives.
- **Backend multi-tenant** — le site est résolu par `Origin` / `X-Site-Id` / `:siteId`, puis
  `req.site` porte config + secrets (`SITE_<ID>__<KEY>`). Voir [backend/README.md](backend/README.md).

## Design et aspect visuel

Le rendu n'est **jamais** codé en dur dans les composants : le manifest décrit des tokens, Vite
les transforme en variables CSS, Tailwind les expose en utilitaires.

`sites/<SITE_ID>/site.config.js` → `theme` → `vite/site-from-config.mjs` → variables `--color-*`,
`--radius-*`, `@font-face` → `tailwind.config.js` (`theme.extend`) → utilitaires
`bg-primary`, `text-text-main`, `rounded-lg`…

Référence complète (palette, surfaces, typographie, arrondis, thème sombre) :
[documentation/design-system.md](documentation/design-system.md).

## Données

Supabase par client. Tables principales : `watches`, `watch_details`, `watch_images`,
`watch_translations`, `watch_audiences`, `watch_accessories`, `watch_articles`, `articles`,
`orders`, `order_lines`, `order_shipping`, `order_discounts`, `promo_codes`, `admin_users`,
`lead_submissions`, `home_carousel_slides`, `home_featured_watches`, `newsletter_*`,
`watch_promotion_campaigns`.

Les fichiers `.sql` sont exclus du dépôt (voir `.gitignore`) : le schéma se déduit des services
`packages/base/src/services/` et de [supabase/migrations/README.md](supabase/migrations/README.md).

## Multilingue (fr / en / de)

Un site déclare ses langues par un bloc `i18n` dans son manifest ; sans ce bloc il reste
monolingue. Textes client traduits sur place avec `t({ fr, en, de })`, textes d'interface dans
`packages/base/src/i18n/messages/`. Conventions et garde-fous :
[documentation/i18n/README.md](documentation/i18n/README.md).

## Conventions de code

- Vue 3 `<script setup>`, Composition API.
- Logique réseau dans `services/`, état partagé dans `composables/`.
- Commentaires et documentation **en français**, noms de fichiers/variables en anglais.
- Prettier (`.prettierrc.json`) + ESLint (`eslint.config.js`) ; `npm run format` cible
  `packages/base/src/`.
- Un test à côté du module qu'il couvre (`*.test.js` dans `packages/base/src/site/`), les tests
  transverses dans `tests/`.

## Pièges connus

- `.gitignore` contient `*.md` et `*.sql` avec une liste d'exceptions : **toute nouvelle
  documentation Markdown doit être ajoutée en exception**, sinon elle reste locale et invisible
  pour un clone frais (CI, Vercel, sessions Claude sur le web).
- `jsconfig.json` fige `@site/*` sur `sites/sauvage-watches/src/*` pour le confort de l'éditeur ;
  ce n'est pas le site actif au build.
- Le dépôt est **public** : ne jamais y committer marges, TJM, clauses contractuelles ou secrets
  (`documentation/commercial/place-des-montres/contractuel/` reste strictement local).
- La ligne éditoriale par site n'est pas versionnée. Avant d'écrire du texte pour un client,
  demander le document de référence à l'utilisateur.
