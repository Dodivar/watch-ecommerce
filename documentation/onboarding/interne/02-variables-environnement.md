# Où atterrit chaque valeur reçue

Table de correspondance entre ce que le client nous transmet et les variables
d'environnement à déclarer. Référence complète des clés : [`backend/env.example`](../../../backend/env.example)
et [`.env.example`](../../../.env.example) ; conventions : [`documentation/multi-client.md`](../../multi-client.md).

## La convention de nommage

```
SITE_<SITE_ID_MAJ>__<CLE>
```

`<SITE_ID_MAJ>` est produit par `siteIdToEnvSegment()` (`backend/sites/secrets.js`) :
majuscules, et tout caractère non alphanumérique remplacé par `_`.

| `siteId` | Segment | Exemple de variable |
| --- | --- | --- |
| `sauvage-watches` | `SAUVAGE_WATCHES` | `SITE_SAUVAGE_WATCHES__STRIPE_SECRET_KEY` |
| `place-des-montres` | `PLACE_DES_MONTRES` | `SITE_PLACE_DES_MONTRES__STRIPE_SECRET_KEY` |
| `jackned` | `JACKNED` | `SITE_JACKNED__STRIPE_SECRET_KEY` |

> **Le double underscore n'est pas décoratif.** `SITE_X_STRIPE_SECRET_KEY` (simple `_`)
> n'est jamais lu : `getSiteSecret()` compose exactement `SITE_${segment}__${key}`.

---

## Les trois valeurs Stripe du client

| Valeur reçue | Destination | Variable |
| --- | --- | --- |
| `pk_live_…` | **Vercel** | `VITE_STRIPE_PUBLISHABLE_KEY` |
| `rk_live_…` | **Render** | `SITE_<SITE_ID_MAJ>__STRIPE_SECRET_KEY` |
| `whsec_…` | **Render** | `SITE_<SITE_ID_MAJ>__STRIPE_WEBHOOK_SECRET` |

La clé restreinte va bien dans la variable nommée `…__STRIPE_SECRET_KEY` : le nom est
historique, `getStripeClient()` (`backend/utils/siteClients.js`) ne fait aucune différence
entre `sk_` et `rk_`. Ne pas renommer la variable pour « faire propre » — ce serait une
panne silencieuse.

### Les permissions attendues sur la clé restreinte

Elles découlent strictement des appels présents dans le code :

| Ressource | Permission | Appels concernés |
| --- | --- | --- |
| **PaymentIntents** | Écriture | `create`, `update`, `retrieve`, `cancel` — `backend/routes/orders.js`, `backend/orders/paymentIntentSync.js`, `list` dans `backend/health/paymentsInvariant.js` |
| **Balance** | Lecture | `balance.retrieve()` — sonde `probeStripe`, `backend/health/probes.js:126` |

Rien d'autre n'est appelé. En particulier **pas de Refunds** : le remboursement est fait à
la main par le client dans son dashboard, puis saisi côté admin
(`packages/base/src/services/admin/orderReturns.js`). C'est ce qui justifie de ne pas
demander cette permission — si un jour on automatise le remboursement, il faudra
redemander une clé à chaque client, ce n'est pas neutre.

La vérification de signature du webhook (`stripe.webhooks.constructEvent`) est un calcul
HMAC local : elle ne consomme **aucune** permission de la clé.

> **Si un jour un appel est ajouté au code**, vérifier qu'il rentre dans ces deux
> permissions. Sinon toutes les vitrines tombent en `StripePermissionError` au déploiement,
> et il faut redemander une clé à chaque client — un incident lent et pénible. Ce tableau
> est la source de vérité à tenir à jour.

---

## Render — variables par site

Service unique multi-tenant : toutes les vitrines partagent le même déploiement.

### Obligatoires

```sh
SITE_<SITE_ID_MAJ>__STRIPE_SECRET_KEY=rk_live_…
SITE_<SITE_ID_MAJ>__STRIPE_WEBHOOK_SECRET=whsec_…
SITE_<SITE_ID_MAJ>__SUPABASE_URL=https://<ref>.supabase.co
SITE_<SITE_ID_MAJ>__SUPABASE_SERVICE_ROLE_KEY=…
SITE_<SITE_ID_MAJ>__PAYMENT_CANCEL_SECRET=<openssl rand -hex 32>
```

`PAYMENT_CANCEL_SECRET` est **généré par nous**, jamais demandé au client : c'est la clé
HMAC des jetons d'annulation de paiement (`backend/utils/paymentCancelToken.js`).

### Optionnelles

| Variable | Quand la déclarer |
| --- | --- |
| `…__MAILJET_API_KEY` / `…__MAILJET_SECRET_KEY` | seulement si le client a **son propre** compte Mailjet. Sinon ne rien déclarer : le repli sur le compte partagé est le comportement voulu (`shared: true`), sans warning. |
| `…__EMAIL_FROM` | override de `backend.email.fromAddress` du manifest |
| `…__BASE_URL` | override de `urls.production` — utile pour pointer les retours Stripe vers une recette |
| `…__GA4_MEASUREMENT_ID` / `…__GA4_API_SECRET` | envoi serveur du `purchase` depuis le webhook, pour ne pas perdre les ventes où le client ne revient jamais sur la page de confirmation |
| `…__GOOGLE_PLACES_API_KEY` | avis Google. **Clé serveur restreinte par IP**, distincte de la clé front restreinte par référent — cette dernière ne fonctionne pas depuis Render. |
| `…__STRIPE_CHECKOUT_RATE_LIMIT_MAX` | défaut 30 par IP / 15 min |

### Globales, à mettre à jour à chaque nouveau site

| Variable | Action |
| --- | --- |
| `BACKEND_CORS_ORIGINS` | ajouter le domaine **s'il n'est pas déjà couvert** par `urls.production/staging/development` du manifest (les variantes `www.` sont générées automatiquement par `normalize.js`) |
| `HEALTH_REQUIRED_SITES` | ajouter `<site-id>` **le jour de l'ouverture**. Avant : la supervision passerait au rouge pour un site pas encore lancé. Après cet ajout, un secret effacé par erreur devient une **panne** au lieu d'un « site non configuré » silencieux — c'est tout l'intérêt. |

Le redéploiement Render est nécessaire : le registry charge les `site.config.js` au boot.

---

## Vercel — variables par projet

Un projet Vercel par client.

### Obligatoires

```sh
SITE_ID=<site-id>                    # sans lui, le build échoue volontairement
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_…
VITE_SUPABASE_URL=https://<ref>.supabase.co
VITE_SUPABASE_ANON_KEY=…
VITE_PURCHASE_ENABLED=true
```

`VITE_STRIPE_PUBLISHABLE_KEY` est lue par `packages/base/src/config.js:28`. **Sans elle, le
Payment Element ne s'initialise pas** et le paiement échoue côté navigateur, sans erreur
serveur : rien dans les logs Render, rien dans Stripe. Symptôme : le tunnel se bloque à
l'étape paiement.

`VITE_PURCHASE_ENABLED` est un coupe-circuit : les boutons d'achat n'apparaissent que si
la valeur **n'est pas la chaîne exacte** `false` **et** que `features.purchase` est vrai
dans le manifest. Les deux conditions, pas l'une ou l'autre.

### Selon le cas

| Variable | Quand |
| --- | --- |
| `VITE_BACKEND_URL` | si `backend.publicApiUrl` n'est pas renseigné dans le manifest — l'un des deux est obligatoire, sinon avertissement au build et checkout mort en production |
| `SUPABASE_SERVICE_ROLE_KEY` | requise par `api/sitemap.js` |
| `VITE_BASE_URL` / `VITE_BASE_PATH` | URL canonique, et sous-chemin pour GitHub Pages |
| `VITE_GOOGLE_PLACES_API_KEY` | carte boutique + autocomplétion d'adresse au checkout |
| `VITE_GA_ID`, `VITE_GOOGLE_ADS_ID`, `VITE_GOOGLE_ADS_PURCHASE_LABEL`, `VITE_META_PIXEL_ID` | mesure et attribution — chargées uniquement après consentement publicitaire |
| `VITE_SUPABASE_IMAGE_TRANSFORMS` | plan Supabase Pro+ uniquement |

---

## Hygiène des secrets

- **Réception** : uniquement par lien à usage unique et expiration courte (Bitwarden Send,
  1Password). Une clé arrivée par e-mail ou messagerie est compromise : faire révoquer et
  recréer, quelle que soit la confiance dans l'interlocuteur.
- **Stockage** : Render et Vercel, rien d'autre. Jamais dans le dépôt, jamais dans un
  fichier local durable, jamais dans un ticket. `*.md` est gitignoré à la racine mais
  **pas sous `documentation/`** (`.gitignore:59`) : ne jamais coller une valeur réelle
  dans un fichier de ce dossier.
- **Rotation sans coupure** : le client crée une nouvelle clé restreinte → on remplace la
  variable Render → redéploiement → le client révoque l'ancienne. Dans cet ordre.
- **Cloisonnement** : Stripe et Supabase restent **strictement par site**. Ne jamais
  passer une clé Stripe en `shared: true` pour dépanner — l'argent d'un client
  retomberait sur le compte d'un autre. Seul Mailjet est légitimement partagé, l'identité
  de la marque tenant à l'adresse `From` et non à la clé d'API. L'en-tête de
  `backend/sites/secrets.js` développe ce point.
- **Dette legacy** : les variables non préfixées (`STRIPE_SECRET_KEY`, `SUPABASE_URL`…)
  servent encore de repli pour `sauvage-watches` uniquement, avec warning au boot. Un
  autre site ne peut pas tomber dessus, mais ce sont des secrets « argent » qui traînent :
  à supprimer dès que Sauvage est migré.

---

## Vérification rapide après configuration

```sh
# Le site est-il connu du registry, et ses secrets présents ?
curl -s -H "X-Health-Token: $HEALTH_CHECK_TOKEN" \
  https://watch-ecommerce-mp9l.onrender.com/api/health/deep | jq

# Un secret manquant sur une route métier répond 503 MISSING_SECRETS,
# avec le nom exact de la variable attendue dans le message.
curl -s -X POST -H "X-Site-Id: <site-id>" \
  https://watch-ecommerce-mp9l.onrender.com/api/orders
```

Le message d'erreur de `MissingSecretsError` nomme précisément la clé absente — le lire
plutôt que de deviner.
