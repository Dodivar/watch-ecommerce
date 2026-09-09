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

Le seul test qui prouve quelque chose. Créer un produit temporaire à 1 €, non listé, et
acheter avec une vraie carte.

- [ ] Le paiement apparaît dans le dashboard **du client**
- [ ] La commande est en `paid` côté admin
- [ ] L'e-mail de confirmation part
- [ ] Le libellé sur le relevé bancaire est bien celui de la marque — pas un sigle
      illisible : c'est le premier motif de contestation de paiement
- [ ] **Le client rembourse lui-même** depuis son dashboard, puis saisit le montant et la
      référence `re_…` dans l'admin. C'est sa formation au geste, et la vérification que
      nous n'en avons effectivement pas besoin.
- [ ] Supprimer le produit temporaire

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

## Après l'ouverture

- Supprimer les variables du site de recette, s'il y en a eu un
- Vérifier une semaine plus tard que le **premier virement** est bien arrivé sur le compte
  du client : le délai initial d'environ 7 jours surprend souvent, et c'est le moment où
  un justificatif manquant se révèle
