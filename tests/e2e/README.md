# Tests d’intégration end-to-end (Playwright)

Tests bout-en-bout pilotant un vrai navigateur (Chromium) contre le storefront
servi en dev Vite. Complémentaires de la suite Vitest (unitaires / contrats).

## Périmètre actuel

**Tunnel d’achat** (`checkout-funnel.spec.js`) — priorité du socle :

1. Création de la commande *draft* depuis le panier et affichage du récapitulatif.
2. Saisie contact + adresse + mode de livraison → déblocage du montant final à payer.
3. Application d’un code promo → mise à jour du total.
4. Retrait en boutique (mode *pickup*) au lieu de la livraison à domicile.
5. Panier vide → redirection vers la collection.

**Fiche produit → panier** (`browse-to-cart.spec.js`) :

1. Chargement de la fiche produit (`/montre/:slug`) depuis le catalogue simulé.
2. Ajout au panier → ouverture du tiroir avec l’article.
3. « Commander » → checkout reprenant la montre ajoutée.

**Retour de paiement** (`payment-return.spec.js`) :

1. `/commande/succes` avec paiement vérifié → confirmation.
2. Lien de confirmation invalide → redirection vers la collection.
3. `/commande/annulee` → réservation libérée.

Le montage réel du Payment Element Stripe est **hors périmètre** (il nécessiterait
`js.stripe.com` et une clé + un client secret réels). Le tunnel est vérifié
jusqu’au montant final à régler.

## Principe : tests hermétiques

Aucun service externe n’est requis. Tout le réseau est simulé côté navigateur
(`tests/e2e/support/`) :

- **Maintenance + panier** amorcés via `localStorage` (`seedBrowser`).
- **Supabase** (REST / auth / storage) → réponses vides (`stubSupabase`), ou
  catalogue de montres factices conscient des tables `watches` /
  `watch_details` / `watch_images` (`stubSupabaseCatalog`).
- **Backend commandes** Express (`/api/orders*`) → mock avec état en mémoire
  reproduisant le cycle de vie d’une commande draft, y compris promo, retrait,
  vérification et annulation (`mockOrderBackend`).

Le site testé est `sauvage-watches` (SITE_ID par défaut du dev Vite), avec des
variables `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` factices injectées par
le `webServer` de Playwright.

## Lancer

```sh
npm run test:e2e          # exécute la suite (démarre le dev server automatiquement)
npm run test:e2e:ui       # mode interactif
npm run test:e2e:report   # ouvre le dernier rapport HTML
```

Le navigateur Chromium est déjà présent dans l’environnement CI web
(`PLAYWRIGHT_BROWSERS_PATH`). En local, si besoin : `npx playwright install chromium`.

## Pistes d’extension

- Page collection (grille + filtres) → clic sur une carte → fiche produit.
- Paiement Stripe : monter le Payment Element avec une clé de test et un
  `clientSecret` simulé (nécessite d’autoriser `js.stripe.com`).
- Multi-articles / quantités (sites avec `cartMultiQuantity`).
- Autres vitrines (`SITE_ID` différent) pour couvrir les variations de config.
