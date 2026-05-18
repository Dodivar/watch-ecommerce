# Composants de Paiement

Le checkout utilise désormais un **parcours personnalisé** (`/checkout`) avec **Stripe Payment Element** (PaymentIntent), et non plus Stripe Checkout hébergé.

## Routes

| Route | Composant | Rôle |
|-------|-----------|------|
| `/checkout` | `checkout/CheckoutPage.vue` | Parcours commande (coordonnées, livraison, promo, paiement) |
| `/commande/succes` | `checkout/OrderSuccess.vue` | Confirmation (`?order=` + `?token=`) |
| `/commande/annulee` | `checkout/OrderCancel.vue` | Annulation |

Les anciennes URLs `/paiement-succes` et `/paiement-annule` redirigent vers les nouvelles routes.

## Services

- `@/services/orderService.js` — API `/api/orders`
- `@/config` — `STRIPE_PUBLISHABLE_KEY` (`VITE_STRIPE_PUBLISHABLE_KEY`)

## Backend

Voir `backend/routes/orders.js`, `backend/routes/stripe.js` (webhooks `payment_intent.*`) et `supabase/migrations/20260517120000_custom_checkout_orders.sql`.

## Configuration site

Bloc `checkout` dans `sites/<SITE_ID>/site.config.js` (livraison, promo, CGV).

## Autocomplétion adresse (Google Places)

Sur `/checkout`, le champ « Adresse » utilise `PlaceAutocompleteElement` (API Places recommandée) si `VITE_GOOGLE_PLACES_API_KEY` est défini (par déploiement Vercel, comme Stripe).

**Google Cloud (par projet) :**

1. Activer **Maps JavaScript API**, **Places API** et **Places API (New)**.
2. Créer une clé API restreinte par **référent HTTP** (`localhost:5173`, domaines prod/recette du client).
3. Ne pas activer **Address Validation API** (hors scope, coût supplémentaire).

Sans clé, la saisie manuelle reste inchangée.
