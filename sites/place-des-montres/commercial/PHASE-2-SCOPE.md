# Phase 2 — Périmètre fidélisation (Place des Montres)

Document de cadrage commercial et technique pour les fonctionnalités **non incluses dans le MVP Lancement**, identifiées comme écarts par rapport au site PrestaShop actuel.

## Contexte

Le site [placedesmontres.fr](https://www.placedesmontres.fr) propose aujourd'hui un **espace client PrestaShop** riche (historique, factures, favoris, newsletter, parrainage). La plateforme watch-ecommerce couvre le cœur e-commerce et le contenu métier en phase 1 ; la phase 2 comble l'écart **fidélisation / habitudes clients**.

> **Arbitrage du 24/08/2026 — « zéro compte ».** Le Lot A ci-dessous (espace client avec
> identifiant et mot de passe) **n'est plus la réponse par défaut** à l'objection « mes clients
> ont un compte ». La réponse retenue est le **Lot A′ — Suivi sans compte** : on supprime le
> besoin de compte plutôt que de le recréer. Le Lot A reste chiffré et disponible, mais en
> option, à ne proposer que si le client le demande explicitement. Argumentaire et scénarios
> chiffrés : `documentation/commercial/place-des-montres/objection-comptes-clients.md`.

## Synthèse des écarts

| Fonctionnalité PrestaShop actuelle | Phase 1 (MVP) | Phase 2 proposée |
|-----------------------------------|---------------|------------------|
| Compte client + connexion | Checkout invité | Espace client authentifié |
| Historique commandes + suivi | Email + page succès | Portail « Mes commandes » |
| Réimpression factures | PDF admin / email | Téléchargement client |
| Coups de cœur / favoris | — | Liste de souhaits (localStorage puis compte) |
| PayPal (< 250 €) | Stripe CB uniquement | PayPal via Stripe |
| Point relais Colissimo (carte) | Adresse saisie manuelle | Widget sélection relais |
| Newsletter | — | Inscription footer + gestion compte (Brevo/Mailjet) |
| Parrainage / avoirs | Codes promo admin | À évaluer avec le client (usage réel ?) |
| Filtres bracelet / cadran / fonctions | Données en fiche seulement | Filtres collection enrichis |
| Aperçu rapide catalogue | — | Optionnel (nice-to-have) |
| Tour de poignet au checkout | PDF + email manuel | Champ dédié checkout + mention commande |

## Lots fonctionnels recommandés

### Lot A′ — Suivi sans compte (priorité haute, retenu)

**Objectif** : Répondre à l'objection « mes clients ont un compte » **sans créer de comptes**,
et corriger une régression vs PrestaShop.

**Le problème corrigé** : le token d'accès à une commande expire en **2 h** et n'est gardé
qu'en `sessionStorage` ; l'e-mail de confirmation ne porte **aucun lien** vers la commande ;
il n'existe **aucune route de suivi**. Passé 2 h ou la fermeture de l'onglet, l'acheteur ne
peut plus consulter sa commande ni retélécharger sa facture.

**Inclus** :

- Token de suivi à durée longue, distinct du token de checkout, porté par l'e-mail de
  confirmation (le mécanisme gère déjà deux hashes simultanés — `access_token_hash` et
  `recovery_token_hash`, `backend/orders/tokens.js`)
- Page **« Retrouver ma commande »** : le visiteur saisit son e-mail, reçoit la liste de ses
  commandes avec un lien par commande. Sans compte ni mot de passe
- **Import des commandes PrestaShop en archive**, rattachées à `orders.customer_email` — c'est
  ce qui rend l'historique d'avant la bascule visible, et ce qui répond à la question ouverte
  « archivage consultable ou export PDF ? » plus bas
- Numéro de suivi transporteur, saisi depuis l'administration (colonne absente aujourd'hui)
- Téléchargement du reçu / facture depuis le bucket existant `order-receipts`

**Points de coût à ne pas oublier** : index sur `lower(orders.customer_email)` (absent),
anti-énumération d'e-mails sur la page de suivi (même traitement que
`requestAdminPasswordReset`), textes et e-mails à livrer en **fr / en / de**, et migration SQL
à recopier dans `supabase/migrations/README.md` puis à appliquer par tenant.

**Estimation** : 2–3 semaines dev + tests — dont **3 à 5 jours** pour le seul lien de suivi
durable, qui corrige la régression et doit être **inclus dans la migration**, pas facturé.

**Dépendances** : backend commandes (existant), emails Mailjet (existant), export PrestaShop
des commandes.

---

### Lot A — Espace client (option, sur demande explicite du client)

**Objectif** : Ajouter identifiant + mot de passe **si le client le demande après avoir vu le
Lot A′**. Ne pas le proposer spontanément : le sortir trop tôt valide l'idée que le compte est
indispensable, et vend plus cher une friction supplémentaire à l'achat.

**Inclus** :

- Inscription / connexion (Supabase Auth côté acheteur, distinct des admins)
- Table `customer_profiles` liée aux commandes par email
- Page **Mes commandes** : statut, détail lignes, numéro de suivi (saisi admin)
- Téléchargement reçu / facture PDF (bucket existant `order-receipts`)
- Réinitialisation mot de passe par email

**Hors périmètre initial** :

- Migration automatique des comptes PrestaShop (mots de passe non exportables) → communication client : « recréez votre compte » ou magic link première connexion
- Gestion retours en self-service (reste email + SAV humain en v1)

**Estimation** : 3–5 semaines dev + tests

**Dépendances** : backend commandes (existant), emails Mailjet (existant)

---

### Lot B — Coups de cœur (priorité moyenne-haute)

**Objectif** : Remplacer « Ajouter Coup de coeur » visible sur le site actuel.

**Inclus** :

- Bouton cœur sur cartes catalogue et fiche produit
- Persistance `localStorage` pour visiteurs anonymes
- Synchronisation avec le compte client si Lot A livré
- Page `/favoris` ou tiroir dédié

**Estimation** : 1–2 semaines

**Dépendances** : Lot A pour synchro multi-appareils (optionnel en v1 anonyme)

---

### Lot C — PayPal (priorité moyenne)

**Objectif** : Conserver l'habitude d'achat PayPal (< 250 € sur l'ancien site).

**Inclus** :

- Activation PayPal dans Stripe Payment Element (ou Stripe Checkout)
- Plafond configurable (ex. 250 €) aligné politique client

**Estimation** : 3–5 jours (configuration Stripe + tests)

**Dépendances** : Compte Stripe client avec PayPal activé

---

### Lot D — Point relais Colissimo (priorité haute livraison)

**Objectif** : Aligner le checkout sur la FAQ actuelle (« livraison en point de dépôt »).

**Inclus** :

- Intégration API/widget La Poste / partenaire Colissimo Pickup (ou Mondial Relay selon contrat transporteur)
- Sélection relais sur carte au checkout
- Stockage point relais dans la commande + affichage admin

**Estimation** : 2–4 semaines (selon API retenue et contrat La Poste)

**Dépendances** : Contrat Colissimo / identifiants API du client

---

### Lot E — Newsletter (priorité moyenne)

**Objectif** : Reprendre l'inscription / désinscription mentionnée dans l'espace client PrestaShop.

**Inclus** :

- Formulaire footer + case opt-in checkout
- Webhook ou API Brevo / Mailjet (outil actuel du client à confirmer)
- Lien désinscription conforme RGPD

**Estimation** : 1 semaine

**Dépendances** : Compte Brevo/Mailjet du client

---

### Lot F — Filtres catalogue enrichis (priorité moyenne)

**Objectif** : Reproduire les critères mis en avant dans la FAQ PrestaShop (bracelet, couleur, fonctions).

**Inclus** :

- Filtres collection : matière bracelet, couleur cadran, type de mouvement
- Données déjà importées depuis PrestaShop (`details.*` dans Supabase)

**Estimation** : 1–2 semaines

**Dépendances** : Qualité des données post-import (spike normalisation)

---

### Lot G — Ajustement bracelet au checkout (priorité basse, forte valeur métier)

**Objectif** : Digitaliser le processus PDF + email décrit en FAQ.

**Inclus** :

- Champ optionnel « Tour de poignet (mm) » au checkout si montre bracelet métal
- Mention dans email confirmation + fiche commande admin

**Estimation** : 3–5 jours

---

## Fonctionnalités à valider avec le client (usage réel inconnu)

Avant de chiffrer, demander au client :

1. **Parrainage et bons d'achat** — utilisés aujourd'hui ? Volume ?
2. **PayPal** — part du CA en ligne ?
3. **Newsletter** — outil actuel (Mailchimp, Brevo, PrestaShop natif) ?
4. **Historique commandes PrestaShop** — ~~archivage consultable ou export PDF ?~~ **Tranché
   (24/08/2026)** : import en archive dans la nouvelle base (Lot A′). L'ancienne piste « garder
   le PrestaShop allumé 12 mois » est abandonnée — jamais chiffrée, et elle fait porter au
   client un hébergement supplémentaire. Reste à demander la **volumétrie** de l'export.

## Planning indicatif

| Mois | Livrables |
|------|-----------|
| M+0 | MVP Lancement en production |
| M+1 | Lot C PayPal + Lot E Newsletter + Lot G Ajustement bracelet |
| M+2 | Lot B Favoris + Lot F Filtres |
| M+0 | **Lot A′ — lien de suivi durable** (inclus dans la migration) |
| M+1–M+2 | Lot A′ — page « Retrouver ma commande » + import historique |
| M+2–M+3 | Lot A Espace client — **seulement si demandé** |
| M+3 | Lot D Point relais (en parallèle dès M+1 si API disponible) |

## Critères d'acceptation phase 2

- [ ] Un client existant retrouve ses commandes **post- et pré-migration** depuis son e-mail,
      sans créer de compte, et retélécharge ses factures
- [ ] PayPal fonctionne en test puis production pour montants < plafond convenu
- [ ] Un point relais peut être sélectionné et apparaît sur la commande admin
- [ ] Les favoris persistent après reconnexion
- [ ] Inscription newsletter avec désinscription en un clic

## Référence commerciale

Voir le packaging détaillé dans [`OFFRES-COMMERCIALES.md`](./OFFRES-COMMERCIALES.md) — offre **Fidélisation**.
