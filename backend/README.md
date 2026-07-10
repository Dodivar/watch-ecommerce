# Backend — service Render multi-tenant

Serveur Express.js qui sert **plusieurs clients** (sites e-commerce) à partir d'un **unique déploiement Render**. Pour chaque requête, le site actif est résolu à partir du `Origin` HTTP (ou du paramètre URL pour les webhooks Stripe), puis la configuration et les secrets correspondants sont chargés à la volée.

Aujourd'hui le service héberge `sauvage-watches`. Ajouter un nouveau client se fait sans toucher au code (voir [Ajouter un nouveau client](#-ajouter-un-nouveau-client)).

## Architecture multi-tenant

```
                      ┌───────────────────────────────────────────────┐
   Front Vercel       │  Backend Render unique                         │
   (sauvage)  ──HTTPS─▶ ┌───────┐  resolveSite(req)   ┌────────────┐  │
                      │ │ CORS  │ ─────────────────▶  │ req.site = │  │
   Front Vercel       │ │ dyn.  │  via Origin/Host/    │  config +  │  │
   (demo-store)──HTTPS▶│       │  X-Site-Id /:siteId  │  secrets   │  │
                      │ └───────┘                      └────────────┘  │
                      │            ↳ getStripeClient(site)             │
                      │            ↳ getSupabaseClient(site)           │
                      │            ↳ getMailjetClient(site)            │
                      └───────────────────────────────────────────────┘
   Stripe (webhook) ──POST /api/stripe/webhook/:siteId──▶ même backend
```

Chaque site a son propre triplet **frontend** + **comptes externes** (Stripe / Supabase / Mailjet) ; le backend reste un seul service partagé.

## Structure du projet

```
backend/
├── server.js                       # Bootstrap async (charge le registry, monte CORS dynamique, monte les routes)
├── sites/
│   ├── registry.js                 # Charge tous les sites/<id>/site.config.js, construit les index byId/byOrigin/byHost
│   ├── normalize.js                # Calcule les défauts (brand → email, theme → couleur d'accent, urls → CORS)
│   └── secrets.js                  # Lit SITE_<ID>__<KEY> (avec fallback legacy pour Sauvage)
├── middleware/
│   ├── resolveSite.js              # Pose req.site à partir de Origin / X-Site-Id / :siteId
│   └── corsFromRegistry.js         # CORS dynamique : autorise toute origine déclarée par un site
├── routes/
│   ├── mailjet.js                  # /api/send-email — utilise req.site
│   ├── stripe.js                   # /api/stripe/* — webhook /api/stripe/webhook/:siteId
│   └── n8n.js                      # /api/n8n/generate-article — utilise req.site
├── utils/
│   ├── getBaseUrl.js               # URL frontend du site (success/cancel Stripe)
│   ├── paymentCancelToken.js       # HMAC paramétré par site
│   └── siteClients.js              # Cache mémoïsé des clients Stripe / Supabase / Mailjet
├── templates/
│   └── estimationEmail.js          # Template HTML paramétrable par site
├── env.example                     # Modèle des variables d'env (voir aussi la section ci-dessous)
└── README.md                       # Ce fichier
```

## Aiguillage de la requête

Le middleware `resolveSite` détermine `req.site` selon la priorité suivante :


| Source                      | Usage                                                      |
| --------------------------- | ---------------------------------------------------------- |
| `req.params.siteId`         | Webhook Stripe (`/api/stripe/webhook/:siteId`)             |
| Header `X-Site-Id`          | Tests / curl / dev                                         |
| Header `Origin`             | Cas standard : appel front → backend                       |
| Header `Host`               | Fallback (rare)                                            |
| `DEV_DEFAULT_SITE_ID` (dev) | Fallback dev quand aucun matche (défaut `sauvage-watches`) |
| Sinon                       | Réponse `400 { error: "Unknown site" }`                    |


L'origine acceptée est calculée pour chaque site à partir de `urls.production`, `urls.staging`, `urls.development` (et leur variante `www.`) plus `backend.cors.extraAllowedOrigins`. Aucune liste hardcodée dans le code.

## Configuration par client (`sites/<id>/site.config.js`)

La configuration partagée front/back se trouve dans `sites/<SITE_ID>/site.config.js`. Le backend ne lit que le bloc `backend` plus quelques sections déjà présentes :


| Champ utilisé                      | Source                                                                       |
| ---------------------------------- | ---------------------------------------------------------------------------- |
| `From Name` Mailjet                | `backend.email.fromName` ou `brand.legalName`                                |
| `From / To` Mailjet                | `backend.email.fromAddress` / `toAddress` ou `contact.email`                 |
| Logo texte du template email       | `backend.email.template.logoText` ou `brand.displayName.toUpperCase()`       |
| Couleur d'accent du template email | `backend.email.template.accentColor` ou `theme.colors.primary`               |
| Origines CORS autorisées           | `urls.{production,staging,development}` + `backend.cors.extraAllowedOrigins` |
| URL base Stripe (success/cancel)   | `urls.production` (prod) / `urls.development` (dev)                          |
| Workflow n8n                       | `backend.n8n.{production,test}WorkflowUrl`                                   |


Exemple minimal :

```js
backend: {
  cors: { extraAllowedOrigins: [] },
  email: {
    fromName: 'Sauvage Watches',
    fromAddress: 'contact@sauvage-watches.fr',
    toAddress: 'contact@sauvage-watches.fr',
    template: { logoText: 'SAUVAGE WATCHES', accentColor: '#d4af37' },
  },
  n8n: {
    productionWorkflowUrl: 'https://n8n.exemple.com/webhook/...',
    testWorkflowUrl: 'https://n8n.exemple.com/webhook-test/...',
  },
},
```

## Variables d'environnement

Voir `[env.example](env.example)` pour la liste complète. Convention :

```
SITE_<UPPER_SNAKE_SITE_ID>__<KEY>
```

Exemple pour `sauvage-watches` (kebab-case → `SAUVAGE_WATCHES`) :

```
SITE_SAUVAGE_WATCHES__STRIPE_SECRET_KEY=sk_...
SITE_SAUVAGE_WATCHES__STRIPE_WEBHOOK_SECRET=whsec_...
SITE_SAUVAGE_WATCHES__SUPABASE_URL=https://...
SITE_SAUVAGE_WATCHES__SUPABASE_SERVICE_ROLE_KEY=...
SITE_SAUVAGE_WATCHES__MAILJET_API_KEY=...
SITE_SAUVAGE_WATCHES__MAILJET_SECRET_KEY=...
SITE_SAUVAGE_WATCHES__PAYMENT_CANCEL_SECRET=...
```

Variables optionnelles :

- `SITE_<ID>__BASE_URL` — override de `urls.production` pour les redirections Stripe (utile pour pointer vers un sous-domaine de recette).
- `SITE_<ID>__EMAIL_FROM` — override de l'adresse expéditeur Mailjet.
- `SITE_<ID>__STRIPE_CHECKOUT_RATE_LIMIT_MAX` — par défaut 30 sur 15 min.

### Rétrocompatibilité Sauvage

Les variables historiques (`STRIPE_SECRET_KEY`, `MAILJET_API_KEY`, `BASE_URL`, etc., **sans préfixe**) servent encore de fallback pour le site `sauvage-watches`. Le serveur émet un warning au boot pour chaque clé tombant sur le legacy. Migration recommandée : renommer une à une dans le dashboard Render.

## ➕ Ajouter un nouveau client

1. **Créer le manifest front** : `sites/<nouveau-client>/site.config.js` (le front Vite l'utilise déjà). Compléter le bloc `backend` (cf. exemple ci-dessus).
2. **Configurer les secrets** dans le dashboard Render : ajouter toutes les variables `SITE_<UPPER_ID>__`* correspondantes (Stripe, Supabase, Mailjet, PaymentCancel).
3. **Configurer le webhook Stripe** : dans le dashboard Stripe du nouveau client, pointer le webhook vers :
  ```
   https://watch-ecommerce-mp9l.onrender.com/api/stripe/webhook/<nouveau-client>
  ```
   Inclure au minimum `payment_intent.succeeded`, `payment_intent.payment_failed` et `payment_intent.canceled`.
4. **Redéployer Render** : le boot charge automatiquement le nouveau `sites/<id>/site.config.js`. Aucune modification de code.

## Endpoints


| Méthode | URL                            | Site résolu via         |
| ------- | ------------------------------ | ----------------------- |
| GET     | `/api/health`                  | (aucun)                 |
| POST    | `/api/send-email`              | Origin                  |
| GET     | `/api/config-check`            | Origin                  |
| GET     | `/api/test-mailjet`            | Origin                  |
| POST    | `/api/n8n/generate-article`    | Origin                  |
| POST    | `/api/orders`                  | Origin                  |
| PATCH   | `/api/orders/:id/customer`     | Origin + Bearer token   |
| PATCH   | `/api/orders/:id/shipping`     | Origin + Bearer token   |
| POST    | `/api/orders/:id/promo`        | Origin + Bearer token   |
| POST    | `/api/orders/:id/pay`          | Origin + Bearer token   |
| GET     | `/api/orders/:id/verify`       | Origin + token query    |
| POST    | `/api/stripe/webhook/:siteId`  | Param `:siteId`         |
| POST    | `/api/stripe/webhook` (legacy) | Forcé `sauvage-watches` |


## Démarrage local

```bash
cd backend
npm install
cp env.example .env   # remplir au minimum SITE_SAUVAGE_WATCHES__* ou les legacy
npm run dev
```

Pour tester un autre site en local :

```bash
curl -H "X-Site-Id: demo-store" http://localhost:3000/api/health
```

## Déploiement Render

URL de production : `https://watch-ecommerce-mp9l.onrender.com`

1. Connecter le repo GitHub, dossier `backend/`.
2. Build command : `npm install`. Start command : `npm start`.
3. Variables d'environnement Render :
  - `NODE_ENV=production`, `RENDER=true`
  - Pour chaque client actif : `SITE_<ID>__*` (Stripe / Supabase / Mailjet / PaymentCancel)
  - Optionnel : `BACKEND_CORS_ORIGINS` (extras globaux)
4. Healthcheck : `/api/health` (renvoie la liste des sites chargés).

## Sécurité

- **CORS strict** : seules les origines déclarées par un `site.config.js` ou par `BACKEND_CORS_ORIGINS` sont acceptées. Toute origine inconnue → erreur 403 (transformée par le handler global).
- **Webhooks Stripe** : signature vérifiée avec `SITE_<ID>__STRIPE_WEBHOOK_SECRET`. Échec → 400 (non-réessai par Stripe). Erreur métier après réception → 500 (Stripe réessaie). Idempotence via `stripe_processed_events`.
- **Tokens d'annulation** : signés HMAC avec `SITE_<ID>__PAYMENT_CANCEL_SECRET` ; isolés par site.
- **Aucun secret partagé entre sites** : chaque siteId a son propre Stripe / Supabase / Mailjet.

## Maintenance

### Webhook Stripe en migration

L'URL legacy `POST /api/stripe/webhook` reste branchée sur `sauvage-watches` pour ne pas casser le webhook actuellement configuré. Une fois le dashboard Stripe Sauvage mis à jour vers `/api/stripe/webhook/sauvage-watches`, l'alias peut être supprimé.

### Nettoyage des uploads

Le dossier `uploads/` (multer pour les pièces jointes Mailjet) doit être nettoyé régulièrement :

```bash
find uploads/ -type f -mtime +1 -delete
```

### Migration SQL Stripe (historique + checkout personnalisé)

Avant de déployer, appliquer côté Supabase de chaque client :

1. `supabase/migrations/20260429120000_stripe_integration_hardening.sql` — `stripe_processed_events`, colonnes `watches`, `reserve_watch_for_checkout`
2. `supabase/migrations/20260514120000_reserve_watches_for_checkout.sql` — panier multi-montres (legacy)
3. `supabase/migrations/20260517120000_custom_checkout_orders.sql` — tables `orders*`, `promo_codes`, RPC `reserve_watches_for_order` / `fulfill_order_payment`
4. `supabase/migrations/20260525120000_admin_phase1.sql` — admin Phase 1 : leads, stock retail, fulfillment commandes, sélections accueil, policies RLS admin
5. `supabase/migrations/20260608120000_home_carousel.sql` — carrousel d'accueil (si `features.homeCarousel` activé)
6. `supabase/migrations/20260608130000_home_carousel_watch_link.sql` — lien optionnel vers une fiche montre sur chaque slide
7. `supabase/migrations/20260609120000_fulfill_order_payment_transition_flag.sql` — `fulfill_order_payment` ne renvoie `true` que lors de la transition réelle → paid (réconciliation idempotente au retour `/commande/succes`, en plus du webhook)
8. `supabase/migrations/20260618120000_create_draft_order_rpc.sql` — RPC `create_draft_order` (création commande draft atomique : order + réservation + lignes + quote)
9. `supabase/migrations/20260621120000_order_receipts_storage.sql` — reçus PDF commandes (Storage privé)
10. `supabase/migrations/20260622120000_watch_promotions.sql` — promotions par montre (`promotion_price`, `discount_percent`, prix effectif au checkout)
11. « Relance panier abandonné » (`supabase/migrations/README.md`) — colonnes `orders.recovery_email_sent_at` / `orders.recovery_token_hash`, requis pour les sites avec `checkout.abandonedCart.enabled`

### Checkout personnalisé (Payment Element)

- API : `POST /api/orders`, `PATCH …/customer`, `PATCH …/shipping`, `POST …/promo`, `POST …/pay`, `GET …/verify`
- Webhooks Stripe : `payment_intent.succeeded` (plus de `checkout.session.*`)
- Passage en `paid` : déclenché soit par le webhook, soit par `GET …/verify` qui réconcilie en interrogeant le PaymentIntent (utile si le webhook tarde ou, en dev local, sans `stripe listen`). Idempotent : les effets de bord (stock, promo, email) ne s'exécutent qu'une fois.
- Dev local : pour recevoir le webhook, lancer `stripe listen --forward-to http://localhost:3000/api/stripe/webhook/<site-id>` et reporter le `whsec_…` dans `SITE_<ID>__STRIPE_WEBHOOK_SECRET`. La réconciliation `/verify` permet néanmoins de finaliser sans webhook.
- Front : `VITE_STRIPE_PUBLISHABLE_KEY` + parcours `/checkout` → `/commande/succes`
- Configuration livraison / promo : bloc `checkout` dans `sites/<id>/site.config.js`

### Relance des paniers abandonnés

Boucle interne au process (`backend/orders/recovery.js`, tick 5 min) pour les sites avec `checkout.abandonedCart.enabled: true` :

- Cible les commandes `draft` / `pending_payment` avec email client, sans activité depuis `delayMinutes` (défaut 60) et créées il y a moins de `maxAgeHours` (défaut 48).
- Une seule relance par commande (réclamation atomique via `orders.recovery_email_sent_at`), jamais de relance si une montre de la commande a été vendue entre-temps.
- L'email contient un lien de reprise `/checkout?order=…&token=…` (token HMAC signé 48 h, hash stocké dans `orders.recovery_token_hash`, accepté en plus du token d'origine). Le front recharge la commande et reconstruit le panier local.
- Prérequis : migration « Relance panier abandonné » (voir `supabase/migrations/README.md`) + Mailjet configuré.

## Dépendances principales

- `express`, `cors`, `multer`, `express-rate-limit`
- `stripe`, `@supabase/supabase-js`, `node-mailjet`
- `dotenv`, `form-data`

