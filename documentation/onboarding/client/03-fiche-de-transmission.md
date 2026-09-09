# Fiche de transmission — codes Stripe

À remplir une fois le [guide Stripe](01-guide-stripe.md) terminé.

---

## Comment nous les envoyer

⚠️ **Pas par e-mail, SMS, WhatsApp ni message instantané.** Ces canaux conservent une copie
durable de vos codes, souvent sauvegardée ailleurs et lisible par d'autres que vous.

**Utilisez ce lien sécurisé, à usage unique :**

```
<LIEN-SECURISE>
```

Collez-y les trois valeurs, envoyez, et prévenez-nous d'un simple message « c'est
envoyé ». Le lien expire après consultation : si vous devez recommencer, demandez-nous
en un nouveau, c'est immédiat.

*Vous n'arrivez pas à utiliser le lien ?* Appelez-nous et dictez les valeurs, ou passez par
un gestionnaire de mots de passe si vous en utilisez un (Bitwarden, 1Password, Dashlane
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
**Balance** sur *Lecture*, et **tout le reste sur Aucune**.

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
- [ ] Les **trois** événements sont cochés sur ce webhook : `payment_intent.succeeded`,
      `payment_intent.payment_failed`, `payment_intent.canceled`
- [ ] La clé restreinte n'a que les **deux** permissions demandées
- [ ] Les trois valeurs sont copiées **en entier** (elles sont longues — vérifiez que la
      fin n'a pas été tronquée à la copie)

---

## Et ensuite ?

1. Nous branchons vos codes sur la boutique — **quelques minutes**.
2. Nous passons une commande de test de bout en bout, puis une **vraie commande à 1 €**
   que vous verrez arriver dans votre tableau de bord Stripe. **C'est vous qui la
   remboursez**, depuis votre tableau de bord — nous n'en avons pas le droit technique, et
   c'est l'occasion de faire une fois le geste à froid. Nous vous guidons : *Paiements* →
   ouvrir le paiement → *Rembourser*. Comptez 5 à 10 jours ouvrés pour que la somme
   revienne sur la carte.
3. Nous vous confirmons que la boutique encaisse, et vous pouvez ouvrir.

Si vous ne voyez pas la commande de test apparaître dans Stripe dans l'heure, c'est en
général que le webhook a une adresse légèrement différente de celle attendue — signalez-le
nous, la correction prend deux minutes.

---

## Ce que vous gardez, définitivement

- **L'accès exclusif** à votre tableau de bord Stripe
- **Le contrôle** des remboursements, des litiges et des virements vers votre banque
- **Le droit de révoquer** la clé restreinte quand vous le souhaitez, sans nous prévenir
- **La propriété** du compte, de son historique et de ses fonds

Nous n'avons ni votre mot de passe, ni votre double authentification, ni le pouvoir de
déplacer un euro.

Une question : `<TON-EMAIL>`
