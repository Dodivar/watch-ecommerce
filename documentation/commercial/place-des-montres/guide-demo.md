# Guide de démonstration — Place des Montres

Parcours recommandé pour un rendez-vous client de **45 minutes**. Ouvrir par la démo live, pas par les slides.

## Prérequis techniques

| Environnement | URL | Statut (juin 2026) |
|---|---|---|
| Production actuelle (PrestaShop) | http://www.placedesmontres.fr | ✅ Accessible |
| Recette plateforme | https://recette.placedesmontres.fr | ⚠️ 503 — réactiver le déploiement Vercel avant le RDV |
| Démo locale | `SITE_ID=place-des-montres npm run dev` → http://localhost:5173 | ✅ Fonctionnel |

**Plan B si recette indisponible :** lancer la démo locale sur laptop branché en partage d'écran, ou montrer [sauvage-watches.fr](https://sauvage-watches.fr) pour la preuve production puis basculer sur localhost pour la personnalisation Place des Montres.

**Mot de passe maintenance (recette protégée) :** voir `sites/place-des-montres/site.config.js` → `maintenance.password`.

---

## Déroulé (45 min)

### 1. Accroche visuelle (5 min) — « C'est déjà votre site »

**URL :** `/` (accueil)

Montrer :
- Carrousel d'accueil (géré en admin)
- Section « Nouvelles arrivées »
- Blocs stats : 3 000 montres, 30 ans, 30+ marques
- Garanties : envoi 48 h, garantie 2 ans, retour 30 jours
- Aperçu boutique Strasbourg

**Message clé :** *« Nous avons repris votre identité — couleurs, textes, règles de livraison — pas un template générique. »*

Capture de référence : `assets/apres-accueil-plateforme.png`

---

### 2. Navigation & catalogue (10 min)

**URL :** `/collection`

Montrer :
- Mega-menu **Nos montres** → marques, genre (homme / femme / enfant), promotions dynamiques
- Filtres : marque, prix, public, taille boîtier, promotion
- Tri : ajout récent, prix
- Cartes produit : badge Nouveau, promo -10 %, prix barré

**Comparer avec PrestaShop :** ouvrir http://www.placedesmontres.fr dans un second onglet — navigation datée, boutons « Ajouter / Aperçu / Coup de coeur ».

Capture avant : `assets/avant-accueil-prestashop.png`  
Capture après : `assets/apres-collection-plateforme.png`

---

### 3. Fiche produit & confiance (8 min)

**URL :** cliquer une montre en stock (ex. Tissot ou G-Shock une fois le catalogue importé)

Montrer :
- Photos, prix, stock disponible
- Blocs confiance : envoi 48 h, garantie 2 ans, retour 30 jours, retrait magasin
- Ajout panier multi-quantité (retail)
- Lien vers Guide de l'horloger / Services si pertinent

---

### 4. Parcours d'achat (7 min)

**URL :** panier → checkout

Montrer :
- Réservation stock 30 minutes
- Livraison Colissimo (gratuit dès 80 €) **ou** retrait Place des Halles
- Code promo
- Paiement Stripe (mode test en recette)
- Acceptation CGU

**Ne pas finaliser un vrai paiement** en démo sauf environnement Stripe test configuré.

---

### 5. Pages métier (5 min)

| Page | URL | Argument |
|---|---|---|
| Nos services | `/services` | Atelier, pile, réparation — lien boutique physique |
| Guide horloger | `/guide-horloger` | Contenu SEO + expertise |
| FAQ | `/faq` | 15 questions reprises du site actuel |
| À propos | `/a-propos` | Histoire depuis 1995, stats, marques |
| Contact + carte | `/contact` | Google Maps, horaires 9h–20h |

---

### 6. Back-office admin (10 min)

**URL :** `/admin` (connexion requise)

Montrer dans l'ordre :
1. **Tableau de bord** — CA, commandes en attente, leads
2. **Montres** — liste, édition, images, disponibilité
3. **Commandes** — détail, traitement, reçu PDF
4. **Promotions montres** — campagne -10 % sur sélection
5. **Carrousel accueil** — upload visuel sans code
6. **Sélections accueil** — cartes homme / femme / marques
7. **Statistiques** — valeur stock, écoulement

Capture : `assets/apres-admin-plateforme.png`

**Message clé :** *« Mettez en avant une promo Tissot en 5 minutes depuis votre bureau ou le comptoir. »*

---

## Objections fréquentes & réponses

| Objection | Réponse |
|---|---|
| « On va perdre notre référencement » | Redirections 301 PrestaShop déjà configurées dans `site.config.js` ; import conserve les IDs produits |
| « C'est trop cher » | Comparatif coût total PrestaShop (hébergeur + agence + modules + temps interne) vs. 249 €/mois tout inclus |
| « On dépend de vous » | Domaine à vous, données exportables Supabase, pas de lock-in propriétaire |
| « La migration est risquée » | Recette déjà avancée, import CLI testé, bascule DNS en quelques heures |
| « Et si le site tombe ? » | Infra Vercel / Render / Supabase managée, monitoring inclus |

---

## Checklist avant le rendez-vous

- [ ] Recette `recette.placedesmontres.fr` en ligne (ou laptop avec `npm run dev`)
- [ ] Compte admin fonctionnel pour la démo
- [ ] Stripe en mode test si démo paiement
- [ ] Slides exportées (`presentation-slides.md` → PDF via Marp)
- [ ] Fiche récap imprimée (`fiche-recap-one-pager.md`)
- [ ] Devis signable avec grille tarifaire slide 11
