# Tests d’intégration end-to-end (Playwright)

Tests bout-en-bout pilotant un vrai navigateur (Chromium) contre le storefront
servi en dev Vite. Complémentaires de la suite Vitest (unitaires / contrats).

## Périmètre actuel

**Tunnel d’achat** (`checkout-funnel.spec.js`) — priorité du socle :

1. Création de la commande *draft* depuis le panier et affichage du récapitulatif.
2. Saisie contact + adresse + mode de livraison → déblocage du montant final à payer.
3. Panier vide → redirection vers la collection.

Le montage réel du Payment Element Stripe est **hors périmètre** (il nécessiterait
`js.stripe.com` et une clé + un client secret réels). Le tunnel est vérifié
jusqu’au montant final à régler.

## Principe : tests hermétiques

Aucun service externe n’est requis. Tout le réseau est simulé côté navigateur
(`tests/e2e/support/`) :

- **Maintenance + panier** amorcés via `localStorage` (`seedBrowser`).
- **Supabase** (REST / auth / storage) → réponses vides (`stubSupabase`).
- **Backend commandes** Express (`/api/orders*`) → mock avec état en mémoire
  reproduisant le cycle de vie d’une commande draft (`mockOrderBackend`).

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

- Parcours navigation → fiche produit → ajout au panier (mock des tables
  Supabase `watches` / images).
- Codes promo (le mock accepte déjà `E2E10` = −10 %).
- Retrait en boutique (méthode `pickup`) vs livraison à domicile.
- Pages de retour de paiement (`/commande/succes`, `/commande/annulee`).
