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

**Collection → fiche produit** (`collection.spec.js`) :

1. Grille de la page `/collection` depuis le catalogue simulé.
2. Clic sur une carte → fiche produit canonique.

**Fiche produit → panier** (`browse-to-cart.spec.js`) :

1. Chargement de la fiche produit (`/montre/:slug`) depuis le catalogue simulé.
2. Ajout au panier → ouverture du tiroir avec l’article.
3. « Commander » → checkout reprenant la montre ajoutée.

**Gestion du panier — intégrité** (`cart-management.spec.js`) :

1. Retrait d’articles depuis le tiroir → compteur, ligne et total suivent ;
   panier vidé → bouton « Commander » désactivé.
2. Persistance du panier après un rechargement de page (`localStorage`).

**Disponibilité produit — garde anti-survente** (`product-availability.spec.js`) :

1. Montre vendue (`is_sold`) : fiche consultable en archive, message dédié,
   mais **aucun** bouton « Ajouter au panier » (impossible d’acheter).

**Recherche catalogue** (`search.spec.js`) :

1. `/collection/recherche?q=…` → grille filtrée sur le terme (nom / marque /
   modèle / référence, casse et accents ignorés).
2. Terme sans correspondance → état vide « Aucune montre trouvée ».

**Panier multi-quantité** (`place-des-montres/multi-quantity.spec.js`) :

1. Vitrine `place-des-montres` (feature `cartMultiQuantity`, config distincte).
2. Ajout au panier puis incrément de la quantité dans le tiroir.

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

Deux vitrines sont couvertes, chacune avec son propre serveur de dev démarré
par Playwright (voir `playwright.config.js`) :

- `sauvage-watches` (défaut) — projet `sauvage-watches`, port 5173.
- `place-des-montres` (panier multi-quantité) — projet `place-des-montres`,
  port 5174. Les specs de ce site vivent sous `tests/e2e/place-des-montres/`.

Les variables `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` factices sont
injectées par le `webServer` de Playwright. Les helpers de `support/` sont
paramétrables par `siteId` (clés `localStorage` du panier et de la maintenance).

## Lancer

```sh
npm run test:e2e          # exécute la suite (démarre le dev server automatiquement)
npm run test:e2e:ui       # mode interactif
npm run test:e2e:report   # ouvre le dernier rapport HTML
```

Le navigateur Chromium est déjà présent dans l’environnement CI web
(`PLAYWRIGHT_BROWSERS_PATH`). En local, si besoin : `npx playwright install chromium`.

## Pistes d’extension

- Filtres de la page collection (marque, public, taille) et pagination.
- Paiement Stripe : monter le Payment Element avec une clé de test et un
  `clientSecret` simulé (nécessite d’autoriser `js.stripe.com` — non hermétique).
- Code promo invalide → message d’erreur (le backend simulé renvoie déjà 400).
- Archive des ventes (`/ventes`) : liste des montres vendues.
- Parcours admin (connexion, gestion catalogue) sur un projet dédié.
