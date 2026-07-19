# Checklist démo — Place des Montres

Guide pour présenter la plateforme au client avant ou pendant un rendez-vous commercial.

## Prérequis techniques


| Élément                             | Commande / valeur                                                        |
| ----------------------------------- | ------------------------------------------------------------------------ |
| Lancer le site local                | `npm run dev:place` → [http://localhost:5173](http://localhost:5173)     |
| Build production                    | `npm run build:place` (validé — build OK)                                |
| Staging client                      | [https://recette.placedesmontres.fr](https://recette.placedesmontres.fr) |
| Production cible                    | [https://www.placedesmontres.fr](https://www.placedesmontres.fr)         |
| Mot de passe maintenance (pré-prod) | Voir `maintenance.password` dans `site.config.js`                        |
| Paiement test Stripe                | Carte `4242 4242 4242 4242`, date future, CVC quelconque                 |


Variables d'environnement requises pour une démo complète (fichier `.env` à la racine du monorepo) :

- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` — catalogue et admin
- `VITE_STRIPE_PUBLISHABLE_KEY` — checkout
- `VITE_BACKEND_URL` — commandes (défaut : URL Render dans `site.config.js`)
- `VITE_PURCHASE_ENABLED=true` — activer l'achat en ligne
- `VITE_GA_ID` (optionnel) — analytics après consentement cookies

## Parcours storefront (15–20 min)

### 1. Accueil

- [ ] Carrousel pleine largeur (slides administrables)
- [ ] Section **Nouvelles arrivées** (montres mises en avant)
- [ ] **Notre sélection du moment** (homme / femme / marque)
- [ ] Bloc chiffres clés : 3 000 montres, 30 ans, 30+ marques
- [ ] Aperçu **Qui sommes-nous** avec lien vers `/a-propos`

### 2. Catalogue

- [ ] Mega-menu **Nos montres** → marques, genre, promotions
- [ ] `/collection` — filtres prix, marque, genre, diamètre, promo
- [ ] `/collection/marques` — index des marques
- [ ] `/collection/tissot` (ou autre marque) — collection par marque
- [ ] Recherche header : taper une référence ou un nom de modèle
- [ ] `/collection/recherche?q=...` — page résultats dédiée

### 3. Fiche produit

- [ ] Galerie images + zoom
- [ ] Specs horlogères (mouvement, diamètre, matériaux, étanchéité…)
- [ ] Bloc **Nos garanties et services** (garantie 2 ans, retour 30 j, Colissimo, retrait magasin)
- [ ] Ajout au panier (quantité multiple activée)

### 4. Panier et checkout

- [ ] Tiroir panier → **Commander**
- [ ] Coordonnées + adresse (autocomplétion Google Places si clé configurée)
- [ ] **Livraison Colissimo** — offerte dès 80 € (frais 6,90 € en dessous)
- [ ] **Retrait magasin** — Place des Halles, 0 €
- [ ] Code promo (créer un code test dans l'admin avant la démo)
- [ ] Acceptation CGV
- [ ] Paiement Stripe Payment Element
- [ ] Page `/commande/succes` + email de confirmation (si backend + Mailjet configurés)

### 5. Pages contenu (différenciation vs simple e-commerce)

- [ ] `/a-propos` — histoire depuis 1995, stats, marques
- [ ] `/services` — atelier, piles 9 €, étanchéité 21 €, bracelets, 3/4x en magasin
- [ ] `/guide-horloger` — conseils entretien (pile, étanchéité, mouvements…)
- [ ] `/faq` — 15 questions (stock, livraison, retours, garantie, ajustement bracelet PDF)
- [ ] `/contact` — formulaire + carte Google Maps / Street View
- [ ] PDF ajustement bracelet : `/documents/aide-ajustement-montres.pdf`
- [ ] Pages légales : `/mentions-legales`, `/conditions-generales-utilisation`, `/politique-confidentialite`

## Parcours admin (10 min)

Connexion : `/admin/login` (compte Supabase Auth autorisé dans `admin_users`).

- [ ] **Tableau de bord** — KPI commandes, CA, alertes stock
- [ ] **Montres** — liste, création, édition, upload images
- [ ] **Commandes** — statut, expédition / retrait, reçu PDF
- [ ] **Codes promo checkout** — création d'un code pour la démo
- [ ] **Promotions montres** — campagne soldes (si utilisée)
- [ ] **Carrousel accueil** — ajout / réordonnancement de slides
- [ ] **Nouveautés accueil** — montres mises en avant
- [ ] **Messages** — leads formulaire contact
- [ ] **Statistiques** — valeur stock, écoulement

## Messages clés à prononcer pendant la démo

1. **« Tout votre métier horloger est déjà là »** — vente, services atelier, guide, FAQ alignée sur vos engagements.
2. **« Un seul back-office »** — plus de modules PrestaShop à payer ou maintenir.
3. **« La bascule SEO est prévue »** — redirections 301 depuis les URL PrestaShop (voir `seo.legacyRedirects`).
4. **« Phase 2 cadrée »** — espace client, PayPal, point relais (voir `commercial/PHASE-2-SCOPE.md`).

## Ce qu'il ne faut pas promettre en démo MVP

- Espace client / compte acheteur
- Coups de cœur / liste de souhaits
- PayPal
- Choix interactif du point relais Colissimo sur carte
- Newsletter intégrée
- Paiement 3x/4x en ligne (disponible en magasin — page Services)

→ Présenter ces points comme **pack Fidélisation** (voir `commercial/OFFRES-COMMERCIALES.md`).

## Après la démo

- [ ] Noter les questions du client sur la phase 2
- [ ] Valider délai de retour commercial (14 j légal vs 30 j affichés)
- [ ] Confirmer horaires téléphone service client (lun–sam 9h–20h en config actuelle)
- [ ] Planifier export CSV PrestaShop pour dimensionner l'import (voir `commercial/IMPORT-CATALOG.md`)