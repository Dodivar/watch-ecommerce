# « Et mes clients, ils perdent leur compte ? »

**Document de vente interne** — ne pas remettre au client tel quel.
*Place des Montres · Août 2026*

Le site actuel de Place des Montres propose un espace client PrestaShop riche : historique de
commandes, réimpression de factures, coups de cœur, newsletter, parrainage. La plateforme
proposée fonctionne en **checkout invité**. La question tombera, et elle est légitime.

Ce document donne la réponse à tenir, ce qui est vrai techniquement, et trois scénarios
chiffrés pour la traiter.

---

## 1. Ce qu'il faut savoir avant d'ouvrir la bouche

Trois faits vérifiés dans le code de la plateforme, à connaître avant le rendez-vous :

| Fait | Conséquence commerciale |
|---|---|
| L'e-mail de confirmation contient le **reçu en pièce jointe** **et un lien « Voir ma commande »** | L'acheteur garde deux traces durables de son achat, sans compte ni mot de passe |
| Ce lien reste valable **dix ans** (durée de conservation du reçu) et ouvre la commande en **lecture seule** | Il peut rouvrir sa commande et retélécharger son reçu à tout moment ; personne ne peut modifier ou annuler une commande avec ce lien |
| Le lien du **tunnel de commande**, lui, expire toujours en 2 heures | Sans effet pour l'acheteur : c'est le lien de paiement, pas celui de sa commande |

> **Le scénario 1 ci-dessous est livré, pas à vendre.** Il corrigeait une régression visible dès
> le premier jour par rapport à leur PrestaShop : jusqu'à sa mise en œuvre, l'accès à la
> commande expirait au bout de 2 heures. C'est désormais dans le socle, inclus dans les
> 4 900 €. L'annoncer comme acquis, sans le facturer ni le présenter comme une option.

---

## 2. La formulation à tenir

> **Formulation à tenir :**
> « Vos clients ne perdent pas leur compte — on supprime le besoin d'en avoir un. Leur
> historique reste consultable et leurs factures retéléchargeables depuis un lien envoyé à
> leur adresse e-mail, sans mot de passe à retenir ni à recréer. »

Ne pas enchaîner sur la technique. Laisser la question suivante venir.

---

## 3. Le point à énoncer le premier : les mots de passe ne sont reprenables par personne

> **À dire en RDV sans attendre la question.**

PrestaShop 1.5 stocke les mots de passe sous forme de hachages dépendant d'une clé propre à
leur installation. Ils ne sont **pas réinjectables** dans une autre plateforme — ni la nôtre,
ni celle d'un concurrent.

Conséquence à énoncer clairement : **toute** solution avec compte, quel que soit le
prestataire, impose à chaque client de refaire un mot de passe par e-mail. Quiconque promet
« on migre tout, vos clients ne verront rien » se trompe ou vous trompe.

La vraie question n'est donc pas *« garde-t-on les comptes ? »* — la réponse est non pour
tout le monde. Elle est : **qu'est-ce qui remplace le compte, et est-ce que le client s'en
aperçoit ?**

---

## 4. Les trois scénarios

| | Scénario 1 — Socle *(livré)* | Scénario 2 — **Recommandé** | Scénario 3 — Espace client |
|---|---|---|---|
| Lien de suivi durable dans l'e-mail de confirmation | Oui | Oui | Oui |
| Reçu / facture retéléchargeable | Oui | Oui | Oui |
| Page « Retrouver ma commande » (e-mail → lien) | — | Oui | Oui |
| Historique **d'avant la bascule** consultable | — | Oui | Oui |
| Numéro de suivi transporteur | — | Oui | Oui |
| Coups de cœur (sans compte, par navigateur) | — | Oui | Oui |
| Identifiant + mot de passe | — | — | Oui |
| Coups de cœur synchronisés entre appareils | — | — | Oui |
| Charge RGPD | minimale | faible | comptes à administrer |
| Effort | 3 à 5 jours | 2 à 3 semaines | + 3 à 5 semaines |
| Position tarifaire | **inclus** dans les 4 900 € (déjà livré) | ⟦À COMPLÉTER : montant HT⟧ | ⟦À COMPLÉTER : montant HT⟧ |

⟦À COMPLÉTER : les montants des scénarios 2 et 3 ne doivent pas être annoncés tant que le taux
journalier ayant servi à établir les 4 900 € n'a pas été réappliqué à ces estimations.⟧

### Scénario 1 — Socle *(livré)*

L'e-mail de confirmation porte un lien durable vers la commande. Le client la rouvre quand il
veut, consulte son statut de préparation et retélécharge sa facture.

**Pourquoi il a été inclus plutôt que facturé** : il corrigeait une régression. La facturer,
c'était faire payer un manque. L'inclure n'a coûté que quelques jours et désamorce l'objection
avant qu'elle ne devienne un point de négociation.

Argument à tenir : *« un acheteur qui n'avait pas créé de compte chez vous n'avait rien.
Là, il a un lien qui marche. »*

### Scénario 2 — « Retrouver ma commande » *(recommandé)*

Le client saisit son adresse e-mail sur une page dédiée. Il reçoit un e-mail listant **toutes**
ses commandes, avec un lien vers chacune. Pas de compte, pas de mot de passe, pas d'inscription.

Ce scénario inclut trois choses qui font réellement tomber l'objection :

1. **L'historique d'avant la bascule.** Les commandes PrestaShop sont importées en archive et
   apparaissent dans la même liste. C'est le point décisif : le client ne perd rien de visible.
2. **Le numéro de suivi transporteur**, saisi depuis l'administration. Sans lui, une page de
   suivi n'a aucun intérêt.
3. **Les coups de cœur**, conservés par navigateur.

> **Note interne.** Ce scénario répond aussi à une question restée ouverte dans
> `IMPORT-CATALOG.md` : que fait-on de l'historique ? La réponse écrite jusqu'ici — garder
> l'ancien PrestaShop allumé 12 mois — n'a jamais été chiffrée et fait porter au client un
> hébergement supplémentaire. L'import en archive la remplace.

### Scénario 3 — Espace client complet

Identifiant, mot de passe, page « Mes commandes », coups de cœur synchronisés. C'est le Lot A
du cadrage Phase 2.

**Ne le proposer que s'ils le demandent explicitement après avoir vu le scénario 2.** Le
sortir trop tôt revient à valider l'idée que le compte est indispensable, et à vendre plus
cher une friction supplémentaire à l'achat.

---

## 5. Objections de deuxième niveau

| Objection | Réponse |
|---|---|
| « Je veux qu'ils se connectent, pour la fidélité » | L'identité, c'est l'adresse e-mail, pas le mot de passe. La newsletter et la relance de panier abandonné fonctionnent déjà sur l'e-mail. Un identifiant ajoute une friction à l'achat sans apporter une donnée marketing de plus |
| « Sur PrestaShop ils ont leurs factures » | Elles restent téléchargeables, depuis le lien e-mail, sans identification supplémentaire |
| « Et les coups de cœur ? » | Conservés sans compte, dans le navigateur. Seule la synchronisation entre appareils exige le scénario 3 |
| « Et le parrainage ? » | **Ne rien promettre.** Demander le nombre de parrainages réellement enregistrés sur 12 mois — le cadrage Phase 2 le classait déjà « usage réel à évaluer ». Si le chiffre est faible, la question tombe d'elle-même |
| « C'est moins bien qu'aujourd'hui » | Assumer : deux usages disparaissent, la synchronisation des coups de cœur et le parrainage. Tout le reste est couvert ou amélioré. Ne pas le nier — c'est ce qui rend crédible le reste de la réponse |

---

## 6. Le RGPD, à retourner en avantage

Ne pas créer de comptes, c'est :

- aucun mot de passe client stocké, donc aucun risque de fuite d'identifiants ;
- moins de données personnelles confiées au sous-traitant ;
- rien à purger le jour où un client demande la suppression de son compte.

C'est cohérent avec le contrat de sous-traitance déjà rédigé (`contractuel/04` *(local)*).

**Point à ne pas passer sous silence** : l'import de l'historique de commandes reste un
traitement de données personnelles. Il doit figurer au registre, dont Place des Montres reste
responsable en tant que responsable de traitement.

---

## 7. Ce qu'il faut leur demander pour chiffrer fermement

Avant d'annoncer un montant pour le scénario 2, demander l'export PrestaShop des tables
`ps_customer`, `ps_orders`, `ps_order_detail` et `ps_address`, et relever :

- le nombre de clients enregistrés ;
- le nombre de commandes et la profondeur d'historique ;
- **le nombre de comptes réellement actifs** — connectés au moins une fois sur 12 mois.

Ce dernier chiffre sert deux fois : il conditionne le chiffrage, et il sert l'argumentaire.
Sur une boutique PrestaShop, la part de commandes passées en invité est le plus souvent
majoritaire. S'il s'avère que peu de clients se connectent réellement, la question du compte
se dégonfle sans qu'on ait à la plaider.

---

## Documents associés

| Document | Usage |
|---|---|
| [`guide-demo.md`](./guide-demo.md) | Tableau d'objections du rendez-vous — la ligne « comptes clients » renvoie ici |
| [`fiche-recap-one-pager.md`](./fiche-recap-one-pager.md) | Document remis en fin de rendez-vous |
| `sites/place-des-montres/commercial/PHASE-2-SCOPE.md` | Cadrage des lots fidélisation, dont le Lot A (scénario 3) |
| `sites/place-des-montres/commercial/IMPORT-CATALOG.md` | Périmètre de la migration de données |
| `contractuel/04` *(local)* | Contrat de sous-traitance RGPD |

> *« Vous avez passé 30 ans à construire la confiance de vos clients à Strasbourg. Nous portons
> cette même exigence en ligne — sans que la technique ne vous en distraie un jour de plus. »*
