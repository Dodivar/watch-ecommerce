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

## Google Maps / Places (`VITE_GOOGLE_PLACES_API_KEY`)

Une même clé sert à l’**autocomplétion checkout** et à la **carte boutique** (pages Contact et À propos), lorsque `storeMap.provider: 'google'` dans `site.config.js`.

### Autocomplétion adresse (checkout)

Sur `/checkout`, le champ « Adresse » utilise `PlaceAutocompleteElement` si la clé est définie. Sans clé, la saisie manuelle reste inchangée.

### Carte boutique (Contact / À propos)

`StoreLocationMap.vue` affiche Google Maps si `storeMap.provider === 'google'` et la clé est présente. Sinon, repli sur **Leaflet + OpenStreetMap** (`provider: 'leaflet'` ou clé absente).

Configuration par client dans `sites/<SITE_ID>/site.config.js` :

```js
storeMap: {
  enabled: true,
  provider: 'google', // ou 'leaflet'
  center: { lat: 48.59, lng: 7.77 },
  zoom: 16,
  markerLabel: 'Nom boutique',
  /** Optionnel — logo dans la bulle (chemin `public/` ou URL absolue) */
  popupLogoSrc: '/brand-logo.jpg',
  /** Lien fiche Google Maps du client (Partager → Copier le lien) */
  googleMapsUrl: 'https://maps.app.goo.gl/…',
  /** Adresse postale exacte pour lancer l'itinéraire */
  directionsAddress: '24 rue Exemple, 75000 Paris, France',
  /** Bonhomme Street View (vue 360°) sur la carte Google — défaut : désactivé */
  streetViewControl: false,
  /** Optionnel — Map ID Google Cloud (recommandé en prod). Défaut : `DEMO_MAP_ID` */
  mapId: 'VOTRE_MAP_ID',
},
```

Par défaut, le logo utilise `popupLogoSrc`, sinon `/apple-touch-icon.png` (dossier `public/` du site).

### Google Cloud (par projet Vercel)

1. Activer **Maps JavaScript API**, **Places API** et **Places API (New)**.
2. Créer une clé API restreinte par **référent HTTP** (`localhost:5173`, domaines prod/recette du client).
3. Créer un **Map ID** (console Google Cloud → Maps → Map Management) et le renseigner dans `storeMap.mapId` pour la production. Sans Map ID client, la carte utilise `DEMO_MAP_ID` (adapté au dev).
4. Ne pas activer **Address Validation API** (hors scope, coût supplémentaire).
