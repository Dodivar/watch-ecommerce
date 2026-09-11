# Checklist d'onboarding — interne

Séquence complète d'ouverture d'une vitrine. Duplique cette liste par client (hors dépôt,
ou dans le ticket de suivi) et coche au fur et à mesure.

Conventions utilisées partout : `<site-id>` en kebab-case (ex. `place-des-montres`),
`<SITE_ID_MAJ>` en UPPER_SNAKE (ex. `PLACE_DES_MONTRES`). La transformation est faite par
`siteIdToEnvSegment()` dans `backend/sites/secrets.js` : minuscules → majuscules, tout
caractère non alphanumérique → `_`.

---

## Phase 0 — Cadrage (avant tout envoi au client)

- [ ] **Figer le `site-id`.** Il apparaît dans l'URL du webhook Stripe : le changer après
      coup oblige le client à refaire son étape 4. Kebab-case, sans accent, stable.
- [ ] **Figer le domaine de production.** Il conditionne le CORS, les URL de retour Stripe
      et l'enregistrement Apple Pay.
- [ ] Préparer les documents client : copier `documentation/onboarding/client/*` hors
      dépôt, remplacer `<IDENTIFIANT-BOUTIQUE>`, `<NOM-BOUTIQUE>`, `<ADRESSE-DU-SITE>`,
      `<TON-EMAIL>`, `<LIEN-SECURISE>` (voir le tableau du [README](../README.md)).
- [ ] Envoyer `01-guide-stripe.md`, `02-informations-a-fournir.md` et
      `03-fiche-de-transmission.md`.

## Phase 1 — Socle technique (en parallèle du client)

- [ ] `sites/<site-id>/` créé — partir de `sites/demo-store/` (squelette neutre) ou
      dupliquer un site existant. Procédure : [`sites/_template/README.md`](../../../sites/_template/README.md).
- [ ] `site.config.js` renseigné : `siteId`, `brand`, `contact`, `legal`, `urls`, `theme`,
      `features`, `home.sections`, `navigation`, `seo`, `checkout`, `backend`.
- [ ] `urls.production` **exact** — c'est lui qui alimente les origines CORS
      (`backend/sites/normalize.js`, variantes `www.` incluses) et les URL de retour Stripe
      (`backend/utils/getBaseUrl.js`).
- [ ] `backend.publicApiUrl` = `https://watch-ecommerce-mp9l.onrender.com`
- [ ] `checkout.shipping.methods` alignés sur les tarifs fournis par le client.
- [ ] Assets sous `sites/<site-id>/src/assets/` et `public/` (favicons, `robots.txt`,
      `site.webmanifest`).
- [ ] `npm run test:contracts` — le manifest est validé comme les autres.
- [ ] `SITE_ID=<site-id> npm run build` passe.

## Phase 2 — Supabase (projet dédié au client)

- [ ] Projet Supabase créé, région UE.
- [ ] Migrations appliquées **dans l'ordre chronologique** via le SQL Editor :
      [`supabase/migrations/README.md`](../../../supabase/migrations/README.md). Ne pas
      sauter `20260824120000_order_returns.sql` ni `20260911120000_order_refunds.sql` : sans
      elles, le panneau retour ne charge pas et l'enregistrement d'un remboursement échoue
      (le webhook répond 500, Stripe rejoue — l'argent est parti, la commande l'ignore).
- [ ] Buckets Storage présents (visuels montres, `home-carousel`, `order-receipts` privé).
- [ ] Lignes `admin_users` créées pour les personnes désignées par le client
      (`role` ∈ `admin`, `moderator`, `visitor`) — **au moins deux `admin`**.
- [ ] Catalogue importé si reprise (`npm run db:import-prestashop` en aperçu, puis
      `:apply`).

## Phase 3 — Réception des valeurs Stripe

- [ ] Les trois valeurs sont arrivées **par le canal sécurisé**, pas par e-mail. Si elles
      arrivent quand même par e-mail : demander au client de **révoquer et recréer** la clé
      restreinte, puis supprimer le message. Une clé passée par une boîte mail est
      compromise, indépendamment de la confiance qu'on a dans le client.
- [ ] `rk_live_…` et non `sk_live_…`. Si c'est un `sk_`, ne pas l'utiliser : renvoyer le
      client à l'étape 5.2 du guide.
- [ ] Le webhook client pointe sur `/api/stripe/webhook/<site-id>` — vérifier le suffixe
      caractère par caractère, c'est la panne n° 1.
- [ ] Les **six** événements sont cochés, dont les quatre de remboursement
      (`charge.refunded`, `refund.created`, `refund.updated`, `charge.refund.updated` si
      proposé). Sans eux, un remboursement n'existe pas pour l'application : CA et TVA
      surévalués, et l'invariant ne peut rien rattraper.
- [ ] Noter si le client a accordé la permission **Refunds — Écriture**. Si non, prévenir
      l'équipe : le bouton « Rembourser » du panel répondra 403 (message explicite), et le
      geste reste dans son dashboard — ce qui est un choix valable, pas une anomalie.

## Phase 4 — Configuration des variables

Détail complet et table de correspondance : [`02-variables-environnement.md`](02-variables-environnement.md).

- [ ] **Render** : `SITE_<SITE_ID_MAJ>__*` (Stripe, Supabase, PaymentCancel, options).
- [ ] **Render global** : `<site-id>` ajouté à `HEALTH_REQUIRED_SITES` **le jour de
      l'ouverture** (pas avant : un site pas encore lancé ferait passer la supervision au
      rouge).
- [ ] **Render global** : domaine ajouté à `BACKEND_CORS_ORIGINS` si le domaine n'est pas
      déjà couvert par les `urls.*` du manifest.
- [ ] **Vercel** : projet créé, `SITE_ID` + variables `VITE_*`.
- [ ] Redéploiement Render (le registry recharge `sites/<site-id>/site.config.js` au boot)
      et déploiement Vercel.

## Phase 5 — Recette

Procédure détaillée : [`03-recette-paiement.md`](03-recette-paiement.md).

- [ ] Recette en **mode test** de bout en bout (commande, paiement, webhook, commande
      `paid`, e-mail de confirmation, reçu PDF).
- [ ] Bascule en clés **live**.
- [ ] **Commande réelle à 1 €**, puis remboursement **par le client**, depuis le panel s'il
      a accordé la permission Refunds, sinon depuis son dashboard — c'est aussi sa formation
      au geste. Procédure détaillée (composer le total à 1 €, fiche de test dédiée,
      vérification de l'enregistrement automatique, nettoyage) :
      [`03-recette-paiement.md` §3](03-recette-paiement.md#3-commande-réelle-à-1-).
- [ ] Vérifier après ce remboursement que la ligne apparaît **seule** dans le panneau
      retour (aucune saisie) et que la commande passe au statut « Remboursée ».
- [ ] `GET /api/health/deep` et `GET /api/health/payments` au vert avec `X-Health-Token`.
- [ ] Fichier de vérification Apple Pay hébergé, si le client a enregistré son domaine.

## Phase 6 — Ouverture

- [ ] DNS pointé, HTTPS actif.
- [ ] `VITE_PURCHASE_ENABLED=true` et `features.purchase: true` — les deux sont requis
      pour que les boutons d'achat apparaissent.
- [ ] `<site-id>` dans `HEALTH_REQUIRED_SITES` (cf. phase 4).
- [ ] Client formé : administration, commandes, remboursements (bouton du panel, ou
      dashboard s'il n'a pas donné la permission), dossiers de rétractation ouverts par les
      acheteurs depuis leur page de suivi, stock.
- [ ] Contrat signé mentionnant la clé restreinte détenue, ses permissions — **y compris
      `Refunds — Écriture` si elle a été accordée**, puisqu'elle autorise un mouvement
      d'argent, borné au remboursement de l'acheteur d'une commande —, sa révocabilité et sa
      suppression en fin de mission. DPA si nous traitons ses données
      clients — c'est le cas via Supabase.

## Phase 7 — Fin de collaboration

À dérouler le jour où le contrat s'arrête, dans cet ordre :

- [ ] Le **client révoque** lui-même la clé restreinte et supprime le webhook depuis son
      dashboard. C'est son geste, pas le nôtre — il doit pouvoir le constater.
- [ ] Nous supprimons les variables `SITE_<SITE_ID_MAJ>__*` sur Render et le projet Vercel.
- [ ] `<site-id>` retiré de `HEALTH_REQUIRED_SITES`.
- [ ] Transfert du projet Supabase ou export des données, selon le contrat.
