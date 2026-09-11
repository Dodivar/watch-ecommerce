# Fiche de transmission — codes Stripe

À remplir une fois le [guide Stripe](01-guide-stripe.md) terminé.

---

## Comment nous les envoyer

⚠️ **Vos codes ne doivent circuler ni par e-mail, ni par SMS, WhatsApp ou message
instantané.** Ces canaux en conservent une copie durable, souvent sauvegardée ailleurs et
lisible par d'autres que vous. Le **lien** ci-dessous, lui, peut passer par e-mail sans
danger : il ne contient rien par lui-même, il ne s'ouvre qu'une fois, et la phrase de passe
qui le déverrouille voyage par un autre chemin.

**Passez par One Time Secret : [onetimesecret.com/fr](https://onetimesecret.com/fr/)**

Le service est gratuit, en français, et ne demande aucune inscription. Il transforme un
texte en un **lien qui ne s'ouvre qu'une fois** : à la première consultation, le message
s'affiche, puis il est détruit sur le serveur. Le lien qui reste ensuite dans votre boîte
d'envoi ne montre plus rien.

1. Ouvrez [onetimesecret.com/fr](https://onetimesecret.com/fr/).
2. Collez les trois valeurs dans le grand cadre de saisie, sur le modèle ci-dessous.
3. Renseignez une **phrase de passe** (le champ *passphrase*) : un mot simple suffit, mais
   il ne doit apparaître ni dans le message ni dans l'e-mail qui portera le lien.
4. Choisissez une **durée de vie courte** — 7 jours au plus, le temps qu'on ouvre le lien.
5. Validez. Le site vous rend un lien du type `https://onetimesecret.com/secret/…`.
   **Ne cliquez pas dessus pour vérifier** : vous consommeriez l'unique ouverture et nous
   recevrions une page vide.
6. Envoyez-nous **le lien** par e-mail à `<TON-EMAIL>`. Seul, il ne donne rien.
7. Donnez-nous la **phrase de passe par un autre canal** : SMS ou téléphone. C'est cette
   séparation en deux canaux qui fait la sécurité de l'envoi — la phrase de passe glissée
   dans le même e-mail annulerait tout.

À coller dans le cadre :

```
Clé publique   : pk_live_…
Clé restreinte : rk_live_…
Secret webhook : whsec_…
```

Prévenez-nous ensuite d'un simple message « c'est envoyé ». Si le délai expire avant qu'on
ait ouvert le lien, refaites l'opération : c'est gratuit et immédiat, vos codes n'ont pas
besoin d'être changés pour autant.

⚠️ En revanche, si nous vous disons que **le lien avait déjà été consulté** alors que vous ne
l'avez jamais ouvert vous-même, considérez les valeurs comme lues par un tiers : révoquez la
clé restreinte, recréez-en une (étape 5.2 du guide) et recommencez l'envoi.

*Vous n'arrivez pas à utiliser le service ?* Appelez-nous et dictez les valeurs, ou passez
par un gestionnaire de mots de passe si vous en utilisez un (Bitwarden, 1Password, Dashlane
proposent tous un partage à expiration). Ne cherchez pas de solution de contournement par
e-mail : nous préférons perdre dix minutes au téléphone.

---

## Les trois valeurs

### 1. Clé publique

Développeurs → Clés API → ligne **Clé publiable**

```
pk_live_
```

### 2. Clé restreinte

Développeurs → Clés API → **Créer une clé restreinte** (étape 5.2 du guide)

```
rk_live_
```

☑ Confirmez avant d'envoyer : dans cette clé, **PaymentIntents** est sur *Écriture*,
**Balance** sur *Lecture*, **Refunds** sur *Écriture*, et **tout le reste sur Aucune**.

*Refunds est facultatif* : il sert uniquement à rembourser une commande de votre boutique
depuis votre administration, à l'acheteur qui l'a réglée. Si vous préférez rembourser
depuis Stripe, laissez-le sur *Aucune* et signalez-le nous — votre boutique enregistrera
quand même vos remboursements.

⚠️ Si votre valeur commence par `sk_live_`, ce n'est pas la bonne : c'est la clé secrète,
qui donne tous les droits sur votre compte. Reprenez l'étape 5.2 du guide.

### 3. Secret de webhook

Développeurs → Webhooks → votre point de terminaison → **Secret de signature** → *Révéler*

```
whsec_
```

---

## Vérifications avant envoi

Cochez, cela nous évite un aller-retour :

- [ ] Le compte Stripe est **activé** (plus de bandeau « Activez les paiements » en haut
      du tableau de bord)
- [ ] L'**IBAN de la société** est renseigné
- [ ] La **double authentification** est activée sur le compte
- [ ] Le webhook pointe **exactement** sur :
      `https://watch-ecommerce-mp9l.onrender.com/api/stripe/webhook/<IDENTIFIANT-BOUTIQUE>`
- [ ] Les **six** événements sont cochés sur ce webhook : `payment_intent.succeeded`,
      `payment_intent.payment_failed`, `payment_intent.canceled`, `charge.refunded`,
      `refund.created`, `refund.updated` (plus `charge.refund.updated` si votre compte le
      propose)
- [ ] La clé restreinte n'a que les permissions demandées, et aucune autre
- [ ] Les trois valeurs sont copiées **en entier** (elles sont longues — vérifiez que la
      fin n'a pas été tronquée à la copie)

---

## Et ensuite ?

1. Nous branchons vos codes sur la boutique — **quelques minutes**.
2. Nous passons une commande de test de bout en bout, puis une **vraie commande à 1 €**
   que vous verrez arriver dans votre tableau de bord Stripe. **C'est vous qui la
   remboursez**, et c'est l'occasion de faire une fois le geste à froid : dans
   l'administration de votre boutique, *Commandes* → ouvrir la commande → **Rembourser**.
   Si vous avez préféré ne pas accorder la permission *Refunds*, le geste se fait depuis
   Stripe (*Paiements* → ouvrir le paiement → *Rembourser*) et votre boutique
   l'enregistrera seule. Comptez 5 à 10 jours ouvrés pour que la somme revienne sur la
   carte.
3. Nous vous confirmons que la boutique encaisse, et vous pouvez ouvrir.

Si vous ne voyez pas la commande de test apparaître dans Stripe dans l'heure, c'est en
général que le webhook a une adresse légèrement différente de celle attendue — signalez-le
nous, la correction prend deux minutes.

---

## Ce que vous gardez, définitivement

- **L'accès exclusif** à votre tableau de bord Stripe
- **Le contrôle** des litiges et des virements vers votre banque
- **La décision** de chaque remboursement — que vous le déclenchiez depuis votre
  administration ou depuis Stripe, et quelle que soit la permission accordée
- **Le droit de révoquer** la clé restreinte quand vous le souhaitez, sans nous prévenir
- **La propriété** du compte, de son historique et de ses fonds

Nous n'avons ni votre mot de passe, ni votre double authentification, ni le pouvoir de
sortir un euro de votre compte vers ailleurs : un remboursement ne peut aller qu'à
l'acheteur qui a payé la commande.

Une question : `<TON-EMAIL>`
