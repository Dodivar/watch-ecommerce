# Mesure du tunnel d’achat (GA4, Google Ads, Meta)

## Ce que ça résout

Avant, le socle n’envoyait que des **pages vues**. Un marchand voyait son trafic mais ni son
taux de conversion, ni où le tunnel fuyait, et ne pouvait rattacher **aucune vente** à une
campagne publicitaire. Vendre un gain de conversion sans pouvoir le mesurer était intenable.

Désormais le tunnel complet est instrumenté, et l’achat remonte **deux fois** — depuis le
navigateur et depuis le webhook Stripe — pour que le chiffre d’affaires mesuré colle au
chiffre d’affaires réel.

## Architecture

Une seule couche, [`packages/base/src/services/analytics/`](../packages/base/src/services/analytics/),
expose des verbes métier. **Aucun appel `gtag(` ou `fbq(` ne doit apparaître dans un composant** :
si un nouvel écran doit mesurer quelque chose, on ajoute un verbe ici.

```
CookieBanner ──► applyConsent({analytics, marketing})
                        │
main.js ──► initAnalytics()   ┌─► gtag.js  ─► GA4 (G-…)  + Google Ads (AW-…)
                        └─────┤
composants ──► trackXxx()     └─► fbq      ─► Meta Pixel

webhook Stripe ──► sendPurchase()  ─► GA4 Measurement Protocol (même transaction_id)
```

| Fichier | Rôle |
|---|---|
| `analytics/index.js` | API publique : `initAnalytics`, `applyConsent`, les `trackXxx`, `getGaIdentifiers` |
| `analytics/items.js` | Normalisation produit → `items` GA4 / `contents` Meta |
| `analytics/consentMode.js` | Signaux Consent Mode v2 |
| `analytics/gtag.js` | Stub `gtag` / `dataLayer` et envoi sans exception |
| `services/metaPixel.js` | Chargement idempotent du pixel + `metaTrack` |
| `services/googleAnalytics.js` | Chargement idempotent de gtag.js (GA4 **et** Ads) |
| `backend/analytics/ga4MeasurementProtocol.js` | `purchase` serveur |

Tout est **no-op silencieux** si le consentement manque, si l’identifiant n’est pas configuré
ou si le script est bloqué par une extension. La mesure ne doit jamais casser une vente : les
envois sont enveloppés dans des `try/catch`.

## Événements envoyés

| Étape | GA4 | Meta | Point de déclenchement |
|---|---|---|---|
| Fiche montre affichée | `view_item` | `ViewContent` | `WatchDetail.vue`, à l’hydratation de `watchItem` |
| Ajout au panier | `add_to_cart` | `AddToCart` | `WatchDetail.handleAddToCart()` |
| Ouverture du panier | `view_cart` | — | `CartDrawer.vue`, sur `drawerOpen` |
| Départ au checkout | `begin_checkout` | `InitiateCheckout` | `CartDrawer.onCheckout()` |
| Moyen de paiement affiché | `add_payment_info` | — | `CheckoutPage.initPayment()`, premier montage seulement |
| Achat confirmé | `purchase` | `Purchase` | `OrderSuccess.vue`, après `verifyOrder` |
| Navigation SPA | `page_view` | `PageView` | `router.afterEach` dans `main.js` |

**Google Ads** ne reçoit qu’un événement, la conversion sur l’achat — c’est ce qui pilote le
ROAS :

```js
gtag('event', 'conversion', { send_to: 'AW-…/LIBELLE', transaction_id, value, currency })
```

### Consentement

- `analytics` accordé → GA4 uniquement.
- `marketing` accordé → Google Ads et Meta uniquement.
- Les deux sont indépendants : un visiteur peut accepter la mesure d’audience et refuser la
  publicité, et les événements se répartissent en conséquence.

Voir [banniere-cookies.md](./banniere-cookies.md).

## Deux pièges à ne pas réintroduire

**Les unités.** Le panier est en **euros** (`CartLine.price`), la commande en **centimes**
(`order.totalCents`, `unit_price_cents`). D’où deux fonctions séparées dans `items.js` —
`toGa4Item` pour le panier, `toGa4ItemFromOrderLine` pour la commande — plutôt qu’une devinette
sur la forme de l’objet. Se tromper fausse le chiffre d’affaires d’un facteur 100.

**Le doublon de `purchase`.** La page de confirmation est rechargeable et atteignable par
retour arrière. `trackPurchase` pose une garde `sessionStorage` (`analytics_purchase_sent:<id>`),
et n’envoie rien — ni ne pose la garde — si aucun consentement n’a été donné.

## `purchase` côté serveur (Measurement Protocol)

Le retour depuis Stripe n’est pas garanti : onglet fermé, 3-D Secure validé plus tard,
bloqueur de publicité. Sans envoi serveur, une part du chiffre d’affaires n’est jamais
attribuée.

**Chemin du `client_id`** — aucune colonne n’a été ajoutée en base :

1. `CheckoutPage.initPayment()` lit `client_id` / `session_id` via `getGaIdentifiers()`
   (wrapper de `gtag('get', …)` avec délai de garde).
2. Ils partent dans le corps de `POST /api/orders/:id/pay`.
3. Le backend les range dans les **metadata du PaymentIntent** (`ga_client_id`,
   `ga_session_id`), à côté de `order_id` et `site_id`.
4. Le webhook `payment_intent.succeeded` les relit et appelle `sendPurchase`.

**Dédoublonnage** : le `transaction_id` est l’identifiant de commande, identique côté client et
côté serveur. GA4 n’en retient qu’un.

**Garde-fou RGPD** : `getGaIdentifiers()` renvoie `null` sans consentement à la mesure
d’audience. Pas de `ga_client_id` ⇒ **aucun envoi serveur**. Le chiffre d’affaires des
visiteurs non consentants reste non mesuré : c’est le prix de la conformité, à assumer dans le
discours commercial plutôt qu’à contourner.

L’appel est dans un `try/catch` qui **ne fait jamais échouer le webhook** : la commande est
déjà payée, une erreur de mesure ne doit pas déclencher un rejeu Stripe.

## Brancher un nouveau client

### Front (variables Vite, toutes optionnelles)

| Variable | Effet si absente |
|---|---|
| `VITE_GA_ID` | Pas de GA4 (les événements restent poussés dans `dataLayer`, exploitables par GTM) |
| `VITE_GOOGLE_ADS_ID` | Pas de tag Ads |
| `VITE_GOOGLE_ADS_PURCHASE_LABEL` | **Aucune conversion Ads**, même avec l’identifiant : le `send_to` s’écrit `AW-123456789/AbC-D_efGh12` |
| `VITE_META_PIXEL_ID` | Pas de pixel Meta |

Sur GitHub Pages, les propager dans le bloc `env` du build
([deploy-place-github-pages.yml](../.github/workflows/deploy-place-github-pages.yml)).

### Manifest du site

Ajouter dans `integrations` la clé de garde du pixel, sur le modèle des clés `ga*` :

```js
integrations: {
  // …
  metaPixelInitFlag: '__monclient_meta_pixel_initialized',
},
```

### Backend (optionnel — active le `purchase` serveur)

```
SITE_<ID>__GA4_MEASUREMENT_ID=G-XXXXXXXXXX
SITE_<ID>__GA4_API_SECRET=…
```

Le secret se crée dans **GA4 → Admin → Flux de données → Protocole de mesure**. Sans ces deux
valeurs, l’envoi serveur est simplement ignoré (`reason: 'not_configured'`).

## Vérifier

**Automatisé**

```bash
npx vitest run packages/base/src/services/analytics tests/backend/ga4MeasurementProtocol.test.js
```

```bash
npx playwright test tests/e2e/analytics.spec.js
```

L’E2E vide volontairement les identifiants de mesure : aucun script tiers n’est chargé, mais
les événements restent observables dans `window.dataLayer` — de quoi vérifier les noms et les
montants sans dépendre de Google.

**Manuellement, avec de vrais identifiants de test**

1. `npm run dev:place`, accepter les deux catégories du bandeau.
2. **GA4 → Admin → DebugView** : dérouler le tunnel et voir les six événements avec leurs `items`.
3. Extension **Meta Pixel Helper** : `AddToCart`, `InitiateCheckout`, `Purchase`.
4. **Google Tag Assistant** : la conversion Ads part avec son `transaction_id`.
5. Paiement de test, puis vérifier dans les logs backend l’appel Measurement Protocol et dans
   GA4 qu’un **seul** `purchase` apparaît pour la commande.
6. Refuser le bandeau, refaire un achat : `dataLayer` sans événement, aucun envoi serveur.

Pour valider la forme d’un payload serveur, `sendPurchase({ …, debug: true })` vise
l’endpoint `/mp/collect/debug`, seul à répondre autre chose qu’un `204` muet.
