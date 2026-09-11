# Recette paiement — de la clé de test à la première vente

À dérouler après la [configuration des variables](02-variables-environnement.md), avant
toute annonce d'ouverture.

---

## 1. Recette en mode test

Demander au client le triplet de **test** : le mode test a ses propres clés et son propre
webhook, à créer séparément (mêmes étapes 4 et 5 du guide client, interrupteur **Mode
test** activé). Les valeurs commencent par `pk_test_`, `rk_test_`, et un `whsec_` distinct
de celui du mode live.

Deux façons de mener la recette, au choix :

- **En local** — le plus simple : `SITE_ID=<site-id> npm run dev` côté front,
  `npm run server` côté backend, les clés de test dans un `.env` local. Le webhook Stripe
  ne peut pas atteindre `localhost` : utiliser `stripe listen --forward-to
  localhost:3000/api/stripe/webhook/<site-id>`, qui affiche son propre `whsec_` à utiliser
  pour la session.
- **Sur un site de recette** — plus proche du réel : créer un `site-id` dédié
  (ex. `<site-id>-recette`) avec ses propres variables Render en clés de test, et
  `…__BASE_URL` pointant sur le domaine de recette. Coût : un jeu de variables de plus, à
  supprimer après ouverture.

### Cartes de test

| Numéro | Comportement attendu |
| --- | --- |
| `4242 4242 4242 4242` | paiement accepté |
| `4000 0000 0000 0002` | paiement refusé par la banque |
| `4000 0025 0000 3155` | authentification 3-D Secure demandée |

Date d'expiration future quelconque, CVC quelconque, code postal quelconque.

### Parcours à valider

- [ ] Ajout au panier, tunnel `/checkout` complet
- [ ] Calcul du total : sous-total + livraison − remise éventuelle
- [ ] Paiement accepté → redirection `/commande/succes?order=…&token=…`
- [ ] Commande passée en `paid` côté Supabase — c'est le **webhook** qui fait cette
      transition, pas la redirection navigateur
- [ ] E-mail de confirmation reçu (adresse d'expédition validée côté Mailjet)
- [ ] Reçu PDF présent dans le bucket privé `order-receipts`
- [ ] Stock décrémenté
- [ ] Paiement refusé (`4000…0002`) → la commande **repasse en `draft`** et le stock est
      relâché
- [ ] Retour en arrière depuis la page de paiement → `/commande/annulee`, commande en
      `draft`
- [ ] Événements marqués **Réussi** dans Stripe → Développeurs → Webhooks → onglet
      *Tentatives*. Un `400` ici signale une signature invalide : mauvais `whsec_`, ou
      `whsec_` du mode live utilisé en mode test.

---

## 2. Bascule en live

1. Remplacer sur Render `…__STRIPE_SECRET_KEY` et `…__STRIPE_WEBHOOK_SECRET` par les
   valeurs `live`, et sur Vercel `VITE_STRIPE_PUBLISHABLE_KEY` par le `pk_live_`.
2. Redéployer les deux.
3. **Ne pas mélanger les modes** : une clé `rk_live_` avec un `whsec_` de test produit une
   panne particulièrement pénible à diagnostiquer — les paiements passent, le webhook
   échoue en signature, et les commandes restent bloquées en `pending_payment`. C'est
   exactement le scénario que `/api/health/payments` détecte.

## 3. Commande réelle à 1 €

Le seul test qui prouve quelque chose : clés `live`, vraie carte, depuis le **domaine de
production** — pas depuis `localhost`, sinon ni le CORS ni l'URL de webhook ne sont ceux du
réel.

### 3.1 — Composer un total de 1,00 € exactement

`backend/orders/pricing.js:76` calcule :

```
totalCents = max(0, subtotal + livraison − remise)
```

La remise (`fixed`, `percent`) est **plafonnée au sous-total** : elle ne mord jamais sur les
frais de port. « Un produit à 1 € » ne fait donc pas « une commande à 1 € » si la livraison
est facturée 9,90 €. Deux façons d'atterrir juste :

- **Retrait en boutique** — si `checkout.shipping` du site déclare une méthode
  `type: 'pickup'` à `fee.amount: 0` (ou `pickupEnabled: true`).
- **Un code promo `free_shipping`** — `computeDiscountCents` renvoie exactement
  `shippingCents` (`backend/orders/promo.js:56`), quel que soit le mode choisi.

Minimum Stripe pour l'euro : 0,50 €. 1 € passe.

### 3.2 — Créer une fiche de test dédiée, jamais une vraie montre

⚠️ **Le paiement marque la montre vendue.** `fulfillOrderPayment` — *« Marque une commande
comme payée et les montres comme vendues »* (`backend/orders/fulfillment.js:2`) — la RPC
`fulfill_order_payment` passe `is_sold` à `true`, et `applyRetailStockDecrement` décrémente
`stock_quantity` et repositionne `is_available`. Utiliser une pièce réelle du catalogue
obligerait à rétablir ces trois champs à la main sur du stock vendable.

⚠️ **Il n'existe pas de fiche « achetable mais masquée ».** Le front public filtre sur
`is_available = true` et `is_sold = false` (`watchService.js:471`, `:812`) : pour être mise
au panier, la fiche doit être visible. Faire ce test **avant l'annonce publique**, ou à un
moment creux.

Dans `/admin/watches`, créer :

| Champ | Valeur |
| --- | --- |
| Marque / Nom | `TEST` / `Ne pas acheter — test technique` |
| Prix | `1` |
| Stock disponible | `1` |
| En vente / Disponible | ✅ coché — obligatoire pour l'achat |
| En promotion | ❌ décoché |

Ni photo ni fiche technique. La montre **sort d'elle-même du catalogue** après l'achat,
puisque le paiement la marque vendue : c'est le comportement recherché ici.

*Variante si le catalogue est déjà public* et qu'une fiche « TEST » visible dérange : code
promo `fixed` d'un montant `prix − 1` sur une vraie montre. Mais la pièce sera marquée
vendue, avec `is_sold`, `is_available` et `stock_quantity` à rétablir sur du stock réel —
plus risqué que de supprimer une fiche jetable. À réserver à ce cas.

### 3.3 — Passer la commande et vérifier

Panier → `/checkout` → coordonnées → retrait en boutique (ou code promo `free_shipping`) →
carte réelle → **1,00 €**.

- [ ] Redirection vers `/commande/succes?order=…&token=…`
- [ ] Le paiement apparaît dans le dashboard Stripe **du client**
- [ ] La commande est en **`paid`** dans `/admin/orders` — c'est le **webhook** qui fait
      cette transition, pas la redirection : c'est tout l'intérêt du test
- [ ] E-mail de confirmation reçu
- [ ] Reçu PDF présent dans le bucket `order-receipts`
- [ ] Stripe → Développeurs → Webhooks → *Tentatives* : `payment_intent.succeeded` en
      **Réussi** (`200`)
- [ ] Le libellé sur le relevé bancaire est bien celui de la marque — pas un sigle
      illisible : c'est le premier motif de contestation de paiement

### 3.4 — Le remboursement, par le client

C'est **son** geste : le faire faire par lui, à froid, c'est sa formation. Le chemin dépend
de la permission `Refunds` accordée à l'étape 5.2 du guide.

**Cas nominal — depuis le panel.** `/admin/orders` → ouvrir la commande → panneau **Retour
et remboursement** → le montant est pré-rempli avec le reste dû (`1,00 €`) →
**Rembourser** → confirmer. Réservé au rôle `admin` : un `moderator` ne voit pas le bouton.

**Cas sans permission `Refunds`.** Le bouton répond **403** avec un message explicite. Le
client rembourse depuis **son dashboard → Paiements → ouvrir le paiement → Rembourser**, et
le lien « Ouvrir le paiement dans Stripe » qui s'affiche alors sous le bouton pointe
directement sur la bonne page (`stripePaymentDashboardUrl` — il ajoute `/test` en mode
test). **Rien à recopier ensuite** : voir ci-dessous.

### 3.5 — Vérifier l'enregistrement automatique

Aucune saisie. Le webhook (`charge.refunded`, `refund.*`) écrit la ligne dans
`order_refunds` et recalcule le cache porté par `orders`. Rafraîchir la fiche commande :

- [ ] Une ligne **1,00 € · Effectué** apparaît dans l'historique du panneau retour, avec
      son origine (*Administration* ou *Dashboard Stripe*) et, pour un remboursement lancé
      depuis le panel, l'e-mail de l'opérateur
- [ ] « Reste à rembourser » tombe à **0,00 €** et le bouton disparaît
- [ ] Le statut du dossier passe à **Remboursée** dans `/admin/orders`
- [ ] Le client reçoit l'e-mail de confirmation de remboursement
- [ ] Stripe → Développeurs → Webhooks → *Tentatives* : `charge.refunded` en **Réussi**
      (`200`). Un `400`/`500` ici, ou l'absence d'événement, veut dire que les événements de
      remboursement ne sont pas cochés ou que la migration `order_refunds` n'a pas été
      appliquée — à corriger avant l'ouverture, sinon les remboursements resteront
      invisibles pour la comptabilité.

Si le remboursement apparaît d'abord **En cours** (`pending`), ce n'est pas une anomalie :
certains moyens de paiement passent par cet état. L'e-mail au client et le total ne
bougent qu'à la transition vers *Effectué*, portée par `refund.updated`.

### 3.6 — Nettoyage

- [ ] Supprimer la fiche montre de test
- [ ] Désactiver le code promo s'il y en a eu un (ou l'avoir plafonné à `max_uses: 1` dès
      sa création)
- [ ] `/api/health/payments` : la commande remboursée reste `paid`, aucune alerte ne doit
      apparaître — ni sur l'invariant paiements, ni sur la clé `refunds` de la réponse, qui
      doit compter le remboursement en `matched`. Un site dont la clé n'a pas la permission
      *Refunds* rend `refunds.status: not_configured` : c'est neutre, pas une alerte.

### Ce que le test coûte

Stripe **ne restitue pas les frais de traitement** sur un remboursement : le client perd
les frais de la transaction, de l'ordre de 0,25 € fixe plus un pourcentage (tarif exact sur
[stripe.com/fr/pricing](https://stripe.com/fr/pricing)). Dérisoire face à une ouverture
avec un webhook mal branché. Le dire au client avant qu'il clique, l'écran de confirmation
du panel le rappelle aussi.

Le remboursement revient sur la carte en **5 à 10 jours ouvrés** : prévenir le client,
sinon il s'inquiète le lendemain.

## 4. Supervision

```sh
curl -s -H "X-Health-Token: $HEALTH_CHECK_TOKEN" \
  https://watch-ecommerce-mp9l.onrender.com/api/health/deep | jq

curl -s -H "X-Health-Token: $HEALTH_CHECK_TOKEN" \
  https://watch-ecommerce-mp9l.onrender.com/api/health/payments | jq
```

`/api/health/payments` vérifie l'invariant **« tout PaymentIntent réussi a sa commande
payée »**. C'est l'alerte à plus forte valeur du dispositif : elle attrape en une requête
tous les modes de panne où le client est débité sans que la commande existe — endpoint
webhook désactivé par Stripe après échecs répétés, `whsec_` tourné, régression CORS, RLS
modifiée, cold start Render au-delà du timeout de livraison. Aucune page d'état
fournisseur ne remonte ça : pendant ce temps, tous les tiers sont « operational ».

Deux garde-fous limitent les faux positifs : les paiements de moins de 5 minutes sont
ignorés (le webhook a le droit d'arriver après), et un PaymentIntent sans
`metadata.order_id` — paiement manuel depuis le dashboard, Payment Link — est compté à
part, jamais en alerte.

La même réponse porte l'invariant **symétrique sur l'argent sortant**, sous la clé
`refunds` de chaque site : « tout remboursement Stripe a sa ligne `order_refunds` ». C'est
lui qui attrape un remboursement fait dans le dashboard alors que les événements du webhook
ne sont pas cochés — le cas le plus courant après une ouverture, et le plus coûteux : la
comptabilité surévalue le chiffre d'affaires et la TVA sans que rien ne le signale.

- [ ] `<site-id>` ajouté à `HEALTH_REQUIRED_SITES` **le jour de l'ouverture**
- [ ] Moniteur externe (UptimeRobot / Better Stack) branché avec le `X-Health-Token`

---

## Pannes courantes

| Symptôme | Cause la plus probable | Vérification |
| --- | --- | --- |
| Le formulaire de paiement ne s'affiche pas | `VITE_STRIPE_PUBLISHABLE_KEY` absente du projet Vercel | console navigateur ; rien côté Render |
| Boutons « Acheter » invisibles | `VITE_PURCHASE_ENABLED` vaut `false`, **ou** `features.purchase` est faux | les deux conditions sont requises |
| `400 Unknown site` | `Origin` non couvert par les `urls.*` du manifest ni par `BACKEND_CORS_ORIGINS` | `resolveSite`, `backend/middleware/resolveSite.js` |
| `503 MISSING_SECRETS` | variable `SITE_<ID>__*` absente ou mal orthographiée | le message nomme la clé exacte ; vérifier le **double** underscore |
| Paiement OK mais commande en `pending_payment` | webhook non reçu ou signature invalide | Stripe → Webhooks → *Tentatives* ; `whsec_` du bon mode ? suffixe `/<site-id>` exact ? |
| Webhook en `400` systématique | `whsec_` de test utilisé en live (ou l'inverse) | comparer avec le secret affiché dans le dashboard, mode correspondant |
| Apple Pay absent | domaine non enregistré, ou fichier de vérification non hébergé | Stripe → Réglages → Domaines des moyens de paiement |
| E-mails non reçus | adresse `From` non validée dans le compte Mailjet | Mailjet refuse à l'envoi, sans erreur côté commande |
| Premier webhook en échec après inactivité | cold start Render dépassant le délai de livraison Stripe | Stripe réessaie ; l'invariant paiements couvre le cas s'il persiste |
| Remboursement fait dans Stripe, invisible dans l'admin | événements `charge.refunded` / `refund.*` non cochés sur le webhook | Stripe → Webhooks → *Événements écoutés* ; la clé `refunds` de `/api/health/payments` le signale en `alert` |
| `relation "public.order_refunds" does not exist` | migration `20260911120000_order_refunds.sql` non appliquée sur ce projet Supabase | le webhook répond 500 et Stripe rejoue : appliquer la migration suffit, le rejeu enregistre le remboursement |
| Bouton « Rembourser » en `403` | la clé restreinte du client n'a pas la permission *Refunds* | choix légitime : rembourser depuis le dashboard, l'enregistrement reste automatique. Pour l'activer : nouvelle clé restreinte (rotation), pas de modification possible d'une clé existante |
| Remboursement bloqué « En cours » | moyen de paiement à règlement différé, ou solde Stripe insuffisant | `refund.updated` fera la transition ; un `failed` remonte avec son motif dans l'historique du panneau retour |

## Après l'ouverture

- Supprimer les variables du site de recette, s'il y en a eu un
- Vérifier une semaine plus tard que le **premier virement** est bien arrivé sur le compte
  du client : le délai initial d'environ 7 jours surprend souvent, et c'est le moment où
  un justificatif manquant se révèle
