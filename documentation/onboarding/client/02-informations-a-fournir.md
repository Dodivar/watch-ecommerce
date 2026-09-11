# Les informations à nous fournir pour votre boutique

En parallèle de la mise en place de Stripe, voici tout ce dont nous avons besoin pour
configurer votre boutique. Rien ici n'est technique : ce sont vos informations
commerciales, légales et vos contenus.

Vous pouvez nous les envoyer au fil de l'eau, par e-mail — **à l'exception des codes
Stripe**, qui passent par le canal sécurisé décrit dans la
[fiche de transmission](03-fiche-de-transmission.md).

> **Le formulaire à remplir est à côté.** Ce document-ci explique ce que nous demandons et
> pourquoi. Pour répondre, ouvrez la
> [**fiche de renseignements**](04-fiche-de-renseignements.html) dans votre navigateur :
> elle reprend les mêmes rubriques en champs de saisie, garde votre travail d'une session à
> l'autre, et produit en un clic le fichier à nous renvoyer. Une version imprimable est
> jointe si vous préférez le papier.

---

## 1. Identité de la marque

| Information | Exemple | Où elle apparaît |
| --- | --- | --- |
| Nom commercial | `<NOM-BOUTIQUE>` | en-tête, onglet du navigateur, e-mails |
| Raison sociale complète | `Ma Boutique SAS` | mentions légales, factures |
| Logo | fichier vectoriel `.svg` ou `.png` haute définition, fond transparent | en-tête, e-mails, favicon |
| Couleurs de la marque | codes hexadécimaux si vous les connaissez, sinon le logo suffit | ensemble du site |
| Slogan / phrase d'accroche | une ligne | page d'accueil |

## 2. Informations légales

Obligatoires pour les mentions légales et les CGV — et vérifiées par Stripe à
l'activation de votre compte.

- Raison sociale, forme juridique et capital social
- Adresse du siège social
- SIRET et numéro de TVA intracommunautaire
- Nom du directeur de la publication
- Numéro RCS et ville d'immatriculation
- Hébergeur : nous le renseignons, rien à faire de votre côté

## 3. Contact et adresse

- Adresse e-mail affichée aux clients
- Téléphone, et numéro WhatsApp si vous souhaitez le proposer
- Adresse de la boutique physique, si vous en avez une (elle sert à afficher la carte)
- Horaires d'ouverture
- Lien de votre fiche Google Maps, si elle existe : depuis Google Maps, **Partager →
  Copier le lien**

## 4. Adresse e-mail d'expédition

L'adresse depuis laquelle partiront les confirmations de commande et les réponses aux
formulaires — par exemple `commandes@votre-domaine.fr`.

Cette adresse doit être **validée une fois** chez notre prestataire d'envoi : nous
déclenchons la demande, vous recevez un e-mail de confirmation à cette adresse et cliquez
sur le lien. Sans cette validation, les e-mails de la boutique sont refusés à l'envoi.

Préférez une adresse sur votre propre domaine : les adresses en `@gmail.com` ou
`@orange.fr` sont massivement classées en indésirable quand elles sont utilisées pour des
envois automatiques.

## 5. Nom de domaine

- **Vous en avez déjà un** : ne le transférez pas. Nous vous enverrons deux ou trois
  lignes de configuration (des « enregistrements DNS ») à ajouter chez votre registrar
  (OVH, Gandi, Ionos…). Si vous préférez, donnez-nous un accès limité à la seule zone DNS
  du domaine — pas à votre compte complet.
- **Vous n'en avez pas** : dites-nous le nom souhaité, nous vérifions sa disponibilité.
  Achetez-le **à votre nom** : un domaine est un actif de votre entreprise, il ne doit pas
  être immatriculé au nom d'un prestataire.

## 6. Livraison

Ce sont les options que verront vos clients au moment de payer.

| À définir | Précision attendue |
| --- | --- |
| Modes de livraison | domicile, point relais, retrait en boutique… |
| Tarif de chaque mode | montant fixe en euros TTC |
| Pays livrés | France seule, UE, international |
| Franchise de port | à partir de quel montant la livraison est offerte, ou aucune |
| Délais annoncés | ex. « 3 à 7 jours ouvrés » |
| Retrait en boutique | l'adresse exacte du point de retrait, si vous l'activez |

## 7. Conditions commerciales

- **CGV** : si vous en avez déjà, envoyez-les. Sinon nous partons d'une base type que
  vous faites relire — nous ne sommes pas juristes et ne pouvons pas les valider pour vous.
- **Politique de retour** : délai de rétractation et conditions de reprise. Obligatoire, et
  vérifiée par Stripe.
- **Taux de TVA** applicable à vos produits.
- **Codes promotionnels** : souhaitez-vous cette fonctionnalité au moment du paiement ?

## 8. Catalogue

- Liste des produits : référence, désignation, description, prix TTC, stock
- Photos : le plus haute définition possible, fond uni de préférence
- Si vous venez d'une autre plateforme (PrestaShop, Shopify, WooCommerce) : **ne
  ressaisissez rien**. Exportez votre catalogue en CSV depuis l'ancien site et
  envoyez-le nous, nous le reprenons automatiquement.

## 9. Accès à votre administration

Donnez-nous la liste des personnes qui géreront la boutique, avec pour chacune son adresse
e-mail et son niveau d'accès :

| Niveau | Ce qu'il permet |
| --- | --- |
| **Administrateur** | tout, y compris gérer les autres accès |
| **Modérateur** | catalogue, commandes, contenus — pas la gestion des accès |
| **Lecture seule** | consulter, sans rien modifier |

Chaque personne recevra une invitation par e-mail et choisira son propre mot de passe.
Prévoyez **au moins deux administrateurs** : un compte administrateur unique dont l'e-mail
devient inaccessible est un vrai problème.

## 10. Mesure d'audience (facultatif)

Si vous souhaitez suivre votre fréquentation et vos conversions, transmettez-nous les
identifiants correspondants — ou dites-nous simplement que vous voulez ces outils, nous
créons les comptes avec vous :

- Google Analytics 4
- Google Ads, si vous prévoyez des campagnes
- Pixel Meta, pour Facebook et Instagram

Ces outils ne se déclenchent qu'après acceptation du bandeau cookies par le visiteur.

---

## Récapitulatif — ce qui bloque l'ouverture si ça manque

| Élément | Pourquoi c'est bloquant |
| --- | --- |
| Informations légales | mentions légales obligatoires, et exigées par Stripe |
| CGV et politique de retour | exigées par Stripe pour activer votre compte |
| Codes Stripe (guide n° 1) | pas d'encaissement possible |
| Adresse e-mail d'expédition validée | aucune confirmation de commande envoyée |
| Nom de domaine configuré | site inaccessible à l'adresse prévue |
| Tarifs de livraison | le tunnel de commande ne peut pas calculer le total |

Le reste (catalogue complet, mesure d'audience, contenus éditoriaux) peut être complété
après l'ouverture.

Pour nous répondre : [fiche de renseignements](04-fiche-de-renseignements.html) → remplir →
**Télécharger la fiche remplie** → nous renvoyer le fichier.
