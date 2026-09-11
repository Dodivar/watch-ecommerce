# Onboarding d'un nouveau client

Tout ce qu'il faut pour brancher une nouvelle vitrine, des deux côtés :

- **[`client/`](client/)** — documents **à envoyer au client**. Rédigés pour être suivis
  seul, sans nous, sans vocabulaire technique interne. Il n'y a rien à expliquer par
  téléphone en plus.
- **[`interne/`](interne/)** — notre procédure : où atterrit chaque valeur reçue, dans quel
  ordre, et comment vérifier que la boutique encaisse vraiment.

## Le principe : le client garde son compte Stripe, nous n'avons qu'une clé

Le client crée **son** compte Stripe, à **son** nom, avec **son** IBAN. C'est lui le
marchand : il encaisse, il déclare la TVA, il gère les litiges. Nous ne sommes jamais
membre de son équipe Stripe et nous ne voyons pas son dashboard.

Les **remboursements** se déclenchent depuis l'administration de sa boutique — c'est
toujours son compte Stripe qui exécute, mais il n'a plus à ouvrir le dashboard pour ça, et
la commande, les statistiques et la comptabilité restent justes sans ressaisie. Cela
suppose une permission de plus sur la clé restreinte (« Refunds — Écriture »), qu'il donne
ou non : sans elle, tout fonctionne à l'identique, le bouton en moins et un remboursement
fait dans son dashboard reste enregistré automatiquement.

Il nous transmet trois valeurs, et trois seulement :

| Valeur | Ce qu'elle permet | Ce qu'elle ne permet pas |
| --- | --- | --- |
| `pk_live_…` clé publique | afficher le formulaire de paiement | rien d'autre — elle est publique par nature |
| `rk_live_…` **clé restreinte** | créer et suivre les paiements de la boutique, et rembourser une commande (permission optionnelle) | virer des fonds vers un compte, lire ses clients, changer ses réglages |
| `whsec_…` secret de webhook | vérifier que les notifications viennent bien de Stripe | aucun appel à son compte |

La clé restreinte est le point clé : elle est créée par le client, avec des permissions
qu'il choisit, et il peut la révoquer seul et à tout moment sans nous prévenir. Un
remboursement ne peut de toute façon que **rendre l'argent à l'acheteur de la commande**,
sur son moyen de paiement d'origine : aucune permission Stripe ne permet d'envoyer un euro
ailleurs.

Les permissions exactes sont listées dans
[`interne/02-variables-environnement.md`](interne/02-variables-environnement.md).

Ce que nous ne demandons **jamais** : son mot de passe, un code 2FA, une clé secrète
complète `sk_live_…`, ni une invitation comme membre de son équipe.

## Ordre des opérations

```
   CLIENT                              NOUS
     │
     │ 01-guide-stripe.md
     ├─ crée et active son compte Stripe
     ├─ choisit ses moyens de paiement
     │                                   ┌─ prépare sites/<site-id>/ et le projet Vercel
     │                                   ├─ lui envoie l'URL de webhook à coller
     ├─ crée le webhook ─────────────────┘   (interne/01, étape 3)
     ├─ crée la clé restreinte
     │
     │ 03-fiche-de-transmission.md
     ├─ envoie les 3 valeurs ────────────▶ interne/02 : Render + Vercel
     │                                   ├─ recette en mode test
     │                                   ├─ bascule live + commande à 1 €
     │                                   └─ interne/03 : contrôle /api/health/payments
     ▼
   boutique en ligne
```

Le client peut démarrer les étapes 1 et 2 du guide Stripe **avant** que le site existe.
Seule la création du webhook attend qu'on lui ait donné son identifiant de boutique.

## Avant d'envoyer les documents au client

Les documents `client/` contiennent des marqueurs à remplacer. Duplique-les dans un
dossier de travail hors dépôt, remplace, puis envoie (PDF ou lien) :

| Marqueur | Remplacer par | Où le trouver |
| --- | --- | --- |
| `<IDENTIFIANT-BOUTIQUE>` | le `siteId` en kebab-case, ex. `place-des-montres` | `sites/<id>/site.config.js` |
| `<NOM-BOUTIQUE>` | le nom commercial | `brand.displayName` |
| `<ADRESSE-DU-SITE>` | le domaine final, ex. `www.exemple.fr` | `urls.production` |
| `<TON-EMAIL>` | notre adresse de contact technique | — |
| `<LIEN-SECURISE>` | le lien de dépôt à usage unique | Bitwarden Send / 1Password |

L'identifiant de boutique doit être **figé avant** l'envoi : il est dans l'URL du webhook,
et le changer après coup oblige le client à refaire l'étape.

## Documents

### Pour le client

| Fichier | Contenu | Quand l'envoyer |
| --- | --- | --- |
| [`client/01-guide-stripe.md`](client/01-guide-stripe.md) | création, activation, moyens de paiement, webhook, clé restreinte | dès la signature |
| [`client/02-informations-a-fournir.md`](client/02-informations-a-fournir.md) | identité légale, contact, livraison, domaine, contenus | dès la signature |
| [`client/03-fiche-de-transmission.md`](client/03-fiche-de-transmission.md) | le formulaire de retour + le canal sécurisé | avec le guide Stripe |

### Pour nous

| Fichier | Contenu |
| --- | --- |
| [`interne/01-checklist-onboarding.md`](interne/01-checklist-onboarding.md) | la séquence complète, à cocher |
| [`interne/02-variables-environnement.md`](interne/02-variables-environnement.md) | chaque valeur reçue → sa variable Render ou Vercel |
| [`interne/03-recette-paiement.md`](interne/03-recette-paiement.md) | recette test, bascule live, supervision, pannes courantes |

## Documents voisins

- [`../multi-client.md`](../multi-client.md) — `SITE_ID`, build, matrice de déploiement
- [`../../backend/README.md`](../../backend/README.md) — architecture multi-tenant, endpoints
- [`../../sites/_template/README.md`](../../sites/_template/README.md) — créer `sites/<id>/`
- [`../../supabase/migrations/README.md`](../../supabase/migrations/README.md) — migrations, dans l'ordre

> Les `.md` sont gitignorés à la racine du dépôt, **sauf** sous `documentation/`
> (`.gitignore:59` — `!documentation/**/*.md`). Les fichiers de ce dossier sont donc
> suivis normalement, sans `git add -f`.
