---
marp: true
theme: default
paginate: true
size: 16:9
style: |
  section {
    font-family: Tahoma, Arial, sans-serif;
    color: #2c2412;
  }
  section.lead {
    background: linear-gradient(135deg, #2c2412 0%, #7c6300 100%);
    color: #f9f7f1;
  }
  section.lead h1, section.lead h2, section.lead p {
    color: #f9f7f1;
  }
  h1, h2 {
    color: #7c6300;
    font-family: 'Segoe UI', Tahoma, sans-serif;
  }
  strong { color: #7c6300; }
  table { font-size: 0.78em; }
  th { background: #7c6300; color: #fff; }
  blockquote { border-left: 4px solid #7c6300; color: #555; }
---



# Place des Montres

## Une boutique en ligne à la hauteur de votre expertise depuis 1995

Plateforme e-commerce dédiée à l'horlogerie — hébergement, maintenance et évolutions inclus.

**Présenté par** Doryan Dillen · [doryandillen@gmail.com](mailto:doryandillen@gmail.com)

---

## Nous comprenons votre métier


| Ce que vous faites                  | Ce que notre plateforme couvre                            |
| ----------------------------------- | --------------------------------------------------------- |
| ~3 000 références, ~30 marques      | Catalogue retail, filtres marque / genre / promo          |
| Conseil en magasin + vente en ligne | Pages À propos, Services, Guide de l'horloger             |
| Atelier réparation aux Halles       | Mise en avant pile, étanchéité, réparation                |
| Colissimo + retrait magasin         | Checkout : domicile (gratuit dès 80 €) + retrait boutique |
| Garantie 2 ans, retour 30 jours     | Blocs confiance fiche produit + FAQ (15 questions)        |


> **Notre atout :** une version personnalisée de votre futur site est déjà prête — identité, textes et règles métier repris de placedesmontres.fr.

bg right:42%

---

## Le constat : PrestaShop en 2026

**Ce qui fonctionnait hier pèse aujourd'hui sur votre temps et votre image.**

- **Maintenance technique** — mises à jour cœur, modules, thème custom, correctifs sécurité
- **Back-office générique** — pas pensé pour piloter 3 000 montres, promos par marque, carrousel d'accueil
- **Expérience mobile datée** — navigation marques peu fluide, parcours d'achat lent
- **Performance catalogue** — lenteur perçue, impact SEO et conversion
- **Hébergement à votre charge** — serveur, sauvegardes, SSL, incidents
- **Évolutions coûteuses** — chaque nouveauté = développement sur mesure

> *« Votre cœur de métier, c'est la montre — pas les mises à jour PHP. »*

bg right:38%

---

## Ce que vos clients attendent en 2026

1. **Rapidité** — catalogue fluide sur mobile, recherche instantanée, paiement en 2 minutes
2. **Confiance** — garanties visibles, Stripe, politique retour claire
3. **Continuité boutique / web** — ajustement bracelet, retrait magasin, guide entretien

Plus de **60 %** du trafic e-commerce mode & accessoires se fait sur mobile — un site lent ou peu lisible, ce sont des ventes perdues **en ligne et en boutique** (clients qui comparent avant de passer aux Halles).

---

## Notre plateforme : conçue pour l'horlogerie

**Spécialisée montres** — pas un thème Shopify ou WooCommerce adapté.


| Critère       | PrestaShop classique   | Notre plateforme                          |
| ------------- | ---------------------- | ----------------------------------------- |
| Cible métier  | E-commerce généraliste | Horlogers & joailliers                    |
| Admin         | Modules tiers          | Tableau de bord intégré                   |
| Hébergement   | Serveur à gérer        | Vercel + Render + Supabase managés        |
| Évolutions    | Dev sur mesure         | Mises à jour partagées, config par client |
| Paiement      | Module CB              | Stripe natif, conforme PCI                |
| SEO migration | Risque de perte        | Redirections 301 automatisées             |


**Référence en production :** [sauvage-watches.fr](https://sauvage-watches.fr)

---

## L'expérience client : avant / après

### Avant (PrestaShop actuel)

Navigation marques peu immersive · fiches denses · checkout hérité d'une autre époque

### Après (votre plateforme — déjà personnalisée)

- **Mega-menu marques** — Tissot, G-Shock, homme / femme / enfant, promos
- **Carrousel d'accueil** — nouveautés gérées depuis l'admin
- **Fiches retail** — stock temps réel, badges promo, garanties / livraison / retrait
- **Checkout moderne** — Stripe, codes promo, réservation stock 30 min
- **Pages de confiance** — FAQ, Guide de l'horloger, Nos services, carte Google Maps

> *« Ce n'est pas une maquette : c'est votre futur site, avec vos couleurs, vos textes, vos règles. »*

bg right:40%

---

## Votre nouveau back-office

**Pilotez sans être informaticien.**

- **Tableau de bord** — CA jour / semaine, commandes en attente, alertes stock
- **Gestion montres** — CRUD, images, disponibilité, import catalogue
- **Commandes** — suivi, traitement, reçus PDF automatiques
- **Promotions** — campagnes par montre
- **Codes promo checkout**
- **Carrousel & sélections accueil** — sans toucher au code
- **Statistiques** — valeur stock, taux d'écoulement, graphiques ventes

> *« Mettez en avant une collection Tissot en 5 minutes, pas en 5 jours de dev. »*

bg right:35%

---

## Fiabilité, sécurité, conformité

- **Hébergement cloud** — Vercel (front), Render (API), Supabase (données isolées)
- **Paiement Stripe** — aucune donnée bancaire stockée chez vous
- **RGPD** — bandeau cookies, consentement Google Analytics
- **Pages légales** — CGU, mentions légales, politique de confidentialité
- **Sauvegardes & disponibilité** — infrastructure managée, zéro serveur à maintenir
- **Mises à jour sécurité** — incluses dans l'offre maintenance

> *« Vous dormez tranquille : nous surveillons, mettons à jour et corrigeons. »*

---

## Migration sans perdre votre référencement

**Peur n°1 des commerçants :** perdre le SEO Google accumé depuis des années.

1. **Import catalogue PrestaShop** — pipeline CLI existant (~3 000 références)
2. **Redirections 301** — `/:id-:rewrite.html` → `/montre/:slug`
3. **Sitemap dynamique** — généré depuis la base produits
4. **Données structurées** — JSON-LD Organization, LocalBusiness, Product
5. **Pré-rendu SEO** — pages indexables pour les crawlers


| Phase                | Durée      | Action                               |
| -------------------- | ---------- | ------------------------------------ |
| Recette              | Avancée    | Validation sur environnement de démo |
| Import catalogue     | 1–2 j      | Sync références + images             |
| Tests commandes      | 2–3 j      | Paiement, livraison, retrait         |
| Bascule DNS          | Quelques h | Cutover + redirections actives       |
| Suivi post-lancement | 30 j       | Monitoring SEO + corrections         |


---

## Preuve : ça fonctionne déjà en production

**[sauvage-watches.fr](https://sauvage-watches.fr)** — même socle technique

- Commandes, paiements, admin : opérationnels en conditions réelles
- Démontre la **maturité** de la plateforme

**Place des Montres** — profil retail le plus proche de votre activité, **déjà configuré** dans notre dépôt (couleurs `#7c6300`, FAQ, services, checkout Colissimo + retrait Halles).

**Environnement de démo :** `recette.placedesmontres.fr` (à réactiver avant bascule) ou démo locale sur demande.

---

## Notre offre : hébergement + maintenance

### Migration (one-shot) — **4 900 € HT**

Import ~3 000 références · configuration personnalisée (déjà réalisée) · tests & recette · bascule DNS + SEO · **formation admin 2 h**

### Abonnement mensuel — **à partir de 249 € HT / mois**


| Inclus      | Détail                                        |
| ----------- | --------------------------------------------- |
| Hébergement | Vercel + Render + Supabase                    |
| Maintenance | Corrective + évolutions plateforme partagées  |
| Monitoring  | Disponibilité, alertes incidents              |
| Support     | **2 h / mois** — réponse sous **4 h ouvrées** |
| Sauvegardes | Politique backup Supabase                     |


**Engagement recommandé :** 12 mois · **Domaine et données restent à vous** (export Supabase possible)

*Comparatif : hébergement PrestaShop + maintenance agence + modules ≈ souvent équivalent ou supérieur, sans la modernité ni le back-office horloger.*

---



## Prochaines étapes

1. **Démo guidée** — 45 min (accueil, fiche produit, checkout, admin)
2. **Audit express** — export PrestaShop → estimation import définitif
3. **Devis personnalisé** — sous 48 h
4. **Date de bascule** — fenêtre hors pic (Noël, soldes)

> *« Vous avez passé 30 ans à construire la confiance de vos clients à Strasbourg. Nous portons cette même exigence en ligne — sans que la technique ne vous en distraie un jour de plus. »*

**Contact :** [doryandillen@gmail.com](mailto:doryandillen@gmail.com)