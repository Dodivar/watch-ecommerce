# Offres commerciales — Place des Montres

Proposition structurée en **3 packs** pour la vente de la plateforme watch-ecommerce à Place des Montres (horlogerie retail, Strasbourg).

---

## Message central

> Votre nouveau site conserve tout ce qui fait vendre Place des Montres — catalogue, promos, Colissimo, retrait aux Halles, garanties, services atelier — avec un back-office plus simple et une expérience d'achat moderne. La bascule se fait sans interruption du magasin physique.

---

## Pack 1 — Lancement (MVP migration)

**Objectif** : Remplacer PrestaShop par une boutique moderne, opérationnelle et conforme.

### Inclus

| Domaine | Livrables |
|---------|-----------|
| **Catalogue** | Import ~3 000 références PrestaShop + images (voir `IMPORT-CATALOG.md`) |
| **E-commerce** | Panier, checkout Stripe (CB 3D Secure), codes promo |
| **Livraison** | Colissimo offert dès 80 €, retrait magasin Place des Halles |
| **Contenu** | Accueil (carrousel, nouveautés, sélections), À propos, Services, Guide horloger, FAQ, Contact |
| **Légal** | Mentions légales, CGV, confidentialité — SIRET LHN S.A.R.L. |
| **SEO** | Métadonnées, sitemap, redirections 301 PrestaShop |
| **Back-office** | Montres, commandes, promos, carrousel, stats, messages contact |
| **Emails** | Confirmations commande depuis `service.client@placedesmontres.fr` |
| **Hébergement** | Mise en production `www.placedesmontres.fr` (Vercel) + backend commandes (Render) |
| **Formation** | 1 session admin (création montre, commande, promo) |

### Non inclus (reportés phase 2)

- Espace client / compte acheteur
- PayPal, point relais Colissimo interactif
- Coups de cœur, newsletter
- Blog, paiement 3x/4x en ligne

### Indicateurs de succès

- Site en production avec catalogue complet
- Parcours achat testé bout en bout
- Équipe autonome sur l'admin quotidien
- Aucune régression SEO majeure à J+30

### Référence technique

- Config client : [`site.config.js`](../site.config.js)
- Checklist démo : [`DEMO-CHECKLIST.md`](./DEMO-CHECKLIST.md)

---

## Pack 2 — Fidélisation (2–3 mois post-lancement)

**Objectif** : Combler l'écart avec les habitudes clients PrestaShop et renforcer la rétention.

### Inclus

| Lot | Fonctionnalité | Priorité |
|-----|----------------|----------|
| A | **Espace client** — compte, historique commandes, factures PDF | Haute |
| B | **Coups de cœur** — liste de souhaits (anonyme puis synchronisée compte) | Haute |
| C | **PayPal** — via Stripe, plafond configurable (ex. 250 €) | Moyenne |
| D | **Point relais Colissimo** — sélection sur carte au checkout | Haute |
| E | **Newsletter** — inscription / désinscription (Brevo ou Mailjet) | Moyenne |
| F | **Filtres enrichis** — bracelet, cadran, mouvement en collection | Moyenne |
| G | **Ajustement bracelet** — champ tour de poignet au checkout | Valeur métier |

### Planning indicatif

- **M+1** : PayPal, Newsletter, Ajustement bracelet
- **M+2** : Favoris, Filtres catalogue
- **M+2 à M+3** : Espace client + Point relais (selon API transporteur)

### Prérequis client

- Compte Stripe avec PayPal activé
- Contrat / identifiants API Colissimo ou partenaire relais
- Compte email marketing (Brevo/Mailjet)
- Communication « recréez votre compte » pour anciens clients PrestaShop

### Détail technique

Voir [`PHASE-2-SCOPE.md`](./PHASE-2-SCOPE.md).

---

## Pack 3 — Croissance (optionnel)

**Objectif** : Accélérer le trafic, le panier moyen et l'efficacité opérationnelle.

### Inclus

| Fonctionnalité | Bénéfice client |
|----------------|-----------------|
| **Blog horloger** + générateur articles (n8n) | SEO long terme, expertise |
| **Recherche personnalisée** (« trouvez-moi une montre ») | Leads qualifiés |
| **Paiement fractionné en ligne** (Alma / Stripe BNPL) | Panier moyen ↑ |
| **Synchro stock magasin / caisse** | Fiabilité stock « plusieurs MAJ / jour » |
| **RDV atelier en ligne** | Prise de rendez-vous piles / réparation |
| **Campagnes promo avancées** | Soldes par événement (déjà partiellement en place) |

### Indicateurs de succès

- Trafic organique blog mesurable à M+6
- Réduction des écarts stock web / magasin
- Taux de conversion checkout stable ou en hausse

---

## Matrice de couverture (argument vente)

| Catégorie | Pack Lancement | + Fidélisation | + Croissance |
|-----------|----------------|----------------|--------------|
| Vente en ligne | ~85 % | ~95 % | ~98 % |
| Contenu / SEO | ~95 % | ~95 % | ~100 % |
| Back-office | ~90 % | ~92 % | ~95 % |
| Fidélisation client | ~30 % | ~85 % | ~90 % |
| Paiements / livraison | ~70 % | ~95 % | ~98 % |
| Filtres catalogue | ~60 % | ~85 % | ~90 % |

---

## Traitement des 3 objections fréquentes

### « Mes clients ont un compte »

**Réponse** : Le Pack Lancement fonctionne en checkout invité avec emails et PDF — comme beaucoup de boutiques modernes. Le Pack Fidélisation ajoute l'espace client sans bloquer la mise en ligne.

### « Et PayPal / le point relais ? »

**Réponse** : Intégrations standards planifiées en Pack Fidélisation (M+1 à M+3). Le MVP lance avec CB Stripe + Colissimo domicile + retrait magasin, déjà conformes à votre FAQ principale.

### « Qui met à jour les 3 000 montres ? »

**Réponse** : Import initial automatisé + admin simplifié (démo incluse). Option synchro caisse en Pack Croissance si le flux magasin l'exige.

---

## Points de vigilance contractuels

À valider **avant signature** :

1. **Délai de retour** : 14 jours (légal actuel PrestaShop) vs 30 jours (config FAQ nouvelle plateforme) — choix commercial à acter. ⚠️ Toujours ouvert
2. **Garantie produit** : 1 an à l'import (`IMPORT-CATALOG.md`) vs **2 ans** annoncés en fiche produit et sur la home. ⚠️ Toujours ouvert — contradiction affichée au consommateur, à trancher **avant** la mise en production : c'est un risque juridique pour le Client, pas seulement une incohérence de contenu
3. **Horaires téléphone SAV** : aligner config et réalité boutique (lun–sam 9h–20h en config actuelle). ⚠️ Toujours ouvert
4. **Hébergeur historique** : RFI Informatique (PrestaShop) → Vercel + Render (à mentionner en mentions légales — déjà prévu côté template)
5. **Données personnelles** : ✅ traité — DPA article 28, sous-traitants et localisation dans `documentation/commercial/place-des-montres/contractuel/04` *(local)*. Le registre RGPD reste à la charge du Client, responsable de traitement
6. **SLA, sauvegardes, réversibilité, propriété du code et des comptes** : ✅ traités par le pack contractuel *(local)*

---

## Documents associés

| Document | Usage |
|----------|-------|
| [`DEMO-CHECKLIST.md`](./DEMO-CHECKLIST.md) | Préparation rendez-vous et démo live |
| [`PHASE-2-SCOPE.md`](./PHASE-2-SCOPE.md) | Cadrage technique phase 2 |
| [`IMPORT-CATALOG.md`](./IMPORT-CATALOG.md) | Chiffrage et plan migration catalogue |

---

## Synthèse pour devis

| Pack | Périmètre | Durée indicative |
|------|-----------|------------------|
| **Lancement** | MVP production | 4–6 semaines |
| **Fidélisation** | Compte, favoris, PayPal, relais, newsletter | 8–12 semaines (post-lancement) |
| **Croissance** | Blog, BNPL, synchro stock, RDV | Sur devis, 3–6 mois |

*Les durées supposent disponibilité des exports PrestaShop et des accès Stripe / Colissimo dans les délais convenus.*
