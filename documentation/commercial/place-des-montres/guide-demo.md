# Guide de démonstration — Place des Montres

Parcours recommandé pour un rendez-vous client de **45 minutes**. Ouvrir par la démo live, pas par les slides.

## Prérequis techniques

| Environnement | URL | Statut (juin 2026) |
|---|---|---|
| Production actuelle (PrestaShop) | http://www.placedesmontres.fr | ✅ Accessible |
| Recette plateforme | https://recette.placedesmontres.fr | ⚠️ Vérifier la veille du RDV — a déjà répondu 503, réactiver le déploiement le cas échéant |
| Démo locale | `SITE_ID=place-des-montres npm run dev` → http://localhost:5173 | ✅ Fonctionnel |

**Plan B si recette indisponible :** lancer la démo locale sur laptop branché en partage d'écran (`SITE_ID=place-des-montres npm run dev`). Rester centré sur Place des Montres — non par souci d'exclusivité, mais parce que 45 minutes suffisent à peine à couvrir leur site. Si la mutualisation du socle vient dans la conversation, l'assumer : élément de langage dans `contractuel/README.md` *(local)*.

**Mot de passe maintenance (recette protégée) :** demander au responsable technique, hors dépôt.

---

## Déroulé (45 min)

> **Astuce mobile (fil rouge) :** ouvrez la démo **sur un vrai smartphone** ou en mode responsive (F12 → vue mobile) et gardez-le en main tout au long du rendez-vous. Le mobile représente +60 % du trafic : montrer le mega-menu tactile, le bouton d'achat collant et le paiement Apple Pay / Google Pay en direct vaut tous les arguments. Renvoie aux slides 5 à 8.

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

| Objection | Réponse | Document à poser sur la table |
|---|---|---|
| « On va perdre notre référencement » | Redirections 301 PrestaShop déjà configurées dans `site.config.js` ; import conserve les IDs produits ; critère de recette contractuel à J+30 | `contractuel/07` *(local)* §3 |
| « C'est trop cher » | Ne pas défendre le prix : proposer de remplir la grille de coût réel avec leurs chiffres. Puis montrer la décomposition des 249 € | `contractuel/08` *(local)* |
| « On dépend de vous » | Licence perpétuelle sur le code, dépôt dont ils sont propriétaires, réversibilité sous 15 jours activable à tout moment | `contractuel/05` *(local)* |
| « La migration est risquée » | Audit express sur leur export réel **avant** devis ; migration remboursée si les critères de recette ne sont pas atteints | `contractuel/07` *(local)* §4-5 |
| « Et si le site tombe ? » | 99,5 % mesuré par un tiers indépendant, prise en charge P1 en 4 h ouvrées, pénalités en avoir, backend dédié donc sans mise en veille | `contractuel/02` *(local)* |
| **« Vous êtes seul »** *(jamais dit à voix haute — l'ouvrir soi-même)* | Dépôt de code dont ils sont propriétaires, licence perpétuelle, contact de secours nommé au contrat, comptes à leur nom qu'ils peuvent reprendre sans moi | `contractuel/05` *(local)* |
| « Et si vous perdez nos données ? » | RPO 24 h / RTO 4 h, rétention 7 j, restauration testée 2×/an avec PV remis, rapprochement Stripe pour les commandes payées | `contractuel/03` *(local)* |
| « Et le RGPD ? » | Contrat de sous-traitance article 28 signé avec le contrat, sous-traitants listés, hébergement UE | `contractuel/04` *(local)* |
| « À qui appartient le compte Stripe ? » | **Le leur** — à dire avant qu'ils ne le demandent. Aucun encaissement ne transite par nous, vérifiable dans le code | `contractuel/01` *(local)* §5 |
| « Montrez-moi un autre revendeur » | Ne pas gonfler Sauvage Watches : annoncer la différence de profil, puis basculer sur preuves vérifiables + garantie de résultat | `contractuel/07` *(local)* |
| « Et l'accessibilité ? » | Poser d'abord la question des seuils (effectif, CA). Ne revendiquer aucune conformité : aucun audit n'a eu lieu | `contractuel/06` *(local)* |
| « Et avec mes 3 000 montres, ça tient ? » | Ne pas répondre oui de mémoire : proposer l'audit express sur leur export réel avant le devis définitif | `contractuel/07` *(local)* §5 |

---

## Checklist avant le rendez-vous

- [ ] Recette `recette.placedesmontres.fr` en ligne (ou laptop avec `npm run dev`)
- [ ] Compte admin fonctionnel pour la démo
- [ ] Stripe en mode test si démo paiement
- [ ] Slides exportées (`presentation-slides.md` → PDF via Marp)
- [ ] Fiche récap imprimée (`fiche-recap-one-pager.md`)
- [ ] Devis signable avec grille tarifaire slides 16–17
- [ ] Dossier de preuves et grille TCO imprimés (`contractuel/07`, `contractuel/08`)
- [ ] Chiffres du dossier de preuves recomptés le jour même (voir `contractuel/README.md`)
- [ ] Contact de secours identifié et nommable — sans lui, l'objection « vous êtes seul » ressort renforcée
