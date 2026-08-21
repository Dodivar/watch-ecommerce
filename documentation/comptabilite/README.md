# Export comptable (FEC, Sage, EBP, Quadra) — analyse et proposition

> Statut : **proposition d'implémentation**, rien n'est codé. À valider avant ouverture des lots.
> Périmètre : socle multi-clients (`sauvage-watches`, `place-des-montres`, `jackned`, `demo-store`).

## 1. Ce que demande réellement un cabinet comptable

Un comptable ne demande pas « un export ». Il demande, chaque mois ou chaque trimestre, **trois choses**
qui doivent se recouper au centime près :

| Livrable | Contenu | Aujourd'hui dans le socle |
| --- | --- | --- |
| **Journal des ventes** | Une écriture équilibrée par facture : client au débit, ventes + TVA collectée au crédit | ❌ inexistant |
| **Journal de banque / encaissements** | Encaissements Stripe, commissions, virements reçus, lettrage avec les factures | ❌ inexistant |
| **Pièces justificatives** | Les factures PDF numérotées de la période | ⚠️ des « reçus » PDF existent, **non numérotés** |

Et il l'attend dans le format d'import de **son** logiciel — c'est là que Sage / EBP / Quadra entrent en jeu.
Un export qui ne s'importe pas est un export inutile : le cabinet ressaisit à la main et facture la ressaisie.

## 2. État des lieux du socle

### Ce qui existe et qui est réutilisable

- Modèle de commande complet : `orders`, `order_lines`, `order_shipping`, `order_discounts`
  (montants en centimes, `paid_at`, `stripe_payment_intent_id`, `site_id`).
- Transition vers `paid` **atomique et idempotente** via la RPC `fulfill_order_payment`
  (`backend/orders/fulfillment.js:7`), appelée depuis `handlePaymentIntentSucceeded`
  (`backend/routes/orders.js:788`). C'est le point d'ancrage naturel de la numérotation de facture.
- Génération + archivage PDF (`backend/orders/receiptPdf.js`, bucket privé `order-receipts`) et
  route admin de téléchargement authentifiée (`backend/admin/adminRoutes.js:151`) — modèle exact à
  reproduire pour la route d'export.
- Configuration par client dans `sites/<id>/site.config.js`, lue côté backend via `site.config.raw`
  (`backend/orders/receiptBranding.js`) : le plan comptable s'y logera sans code spécifique par client.
- Panel admin avec rôles (`packages/base/src/services/admin/adminPermissions.js:24`) et routes
  déclaratives (`packages/base/src/site/appRouteMeta.js:43`, `buildAppRoutes.js:98`).

### Les six verrous à lever *avant* d'écrire le moindre sérialiseur

| # | Verrou | Gravité | Détail |
| --- | --- | --- | --- |
| 1 | **Aucun numéro de facture** | 🔴 bloquant | Les commandes sont identifiées par un UUID. L'art. 242 nonies A ann. II CGI impose une numérotation **séquentielle, chronologique et sans rupture**. Sans elle, ni facture valable, ni export importable (le champ `PieceRef` est obligatoire partout). |
| 2 | **TVA non figée** | 🔴 bloquant | La TVA n'est pas stockée : elle est **recalculée à l'affichage** à partir de `checkout.vatRate` du manifest (`backend/orders/receiptData.js:46`, `receiptBranding.js:102`). Changer le taux ou le manifest réécrit rétroactivement des factures déjà émises et déjà déclarées. La ventilation HT / TVA doit être gelée sur la commande au moment du paiement. |
| 3 | **TVA sur la marge non gérée** | 🔴 pour `sauvage-watches` | `watchCatalog.mode: 'resale'` = montres d'occasion. Si elles sont achetées à des particuliers, le régime applicable est celui de la marge (art. 297 A CGI) : la facture ne doit **pas** faire apparaître de TVA et doit porter la mention du régime. Le socle facture 20 % à tout le monde — les écritures produites seraient fausses. |
| 4 | **Avoirs / remboursements invisibles** | 🟠 fort | Aucune trace en base d'un remboursement (aucune occurrence de `refund` dans le code). Un remboursement fait depuis le dashboard Stripe n'existe pas pour l'application : l'export surévaluerait le chiffre d'affaires et la TVA collectée. |
| 5 | **Frais et virements Stripe absents** | 🟠 fort | Ni `stripe_charge_id`, ni `balance_transaction`, ni commission. Le comptable ne peut pas rapprocher le relevé bancaire (un virement Stripe = N commandes − commissions) ; c'est le premier point de friction en pratique. |
| 6 | **Territorialité TVA ignorée** | 🟠 moyen | Les méthodes de livraison couvrent FR, MC, BE, CH, LU (`sites/sauvage-watches/site.config.js:224`). La Suisse est un export (hors TVA), BE/LU relèvent du guichet unique OSS au-delà de 10 000 €. Un taux unique de 20 % pour tous produit des comptes de vente et de TVA erronés. |

Deux remarques annexes, peu coûteuses à traiter :

- Le PDF s'intitule « Reçu de paiement ». En vente à distance à un consommateur, la facture est
  **obligatoire** (art. 289 CGI). Une fois la numérotation en place, ce document devient la facture :
  il porte déjà vendeur, SIRET, adresses, ventilation HT/TVA — il ne manque que le numéro, la mention
  de régime et le titre.
- `legal.vatNumber` n'est renseigné dans aucun manifest alors que le PDF sait l'afficher
  (`receiptData.js:36`). Mention obligatoire dès que l'entreprise est assujettie.

## 3. Architecture proposée

L'erreur classique est d'écrire trois exports (un par logiciel). La bonne découpe est :

```
                  ┌──────────────────────────────────────────┐
  orders (paid)   │  Moteur d'écritures                       │
  order_lines  ──▶│  buildAccountingEntries(site, période)     │──▶  écritures normalisées
  order_shipping  │  • ventilation HT / TVA / port / remise    │     (objets JS, équilibrées)
  order_discounts │  • mapping plan comptable du site          │
  order_refunds   │  • contrôle débit = crédit                 │
  stripe (balance)└──────────────────────────────────────────┘
                                    │
                 ┌──────────────────┼──────────────────┬───────────────┐
                 ▼                  ▼                  ▼               ▼
            FEC (pivot)        profil Sage       profil EBP      profil Quadra
          18 colonnes, UTF-8   CSV/positions     CSV/positions   ASCII 'M'      + CSV générique
```

Deux décisions structurantes :

**a) Le FEC est le format pivot.** Le Fichier des Écritures Comptables (art. A.47 A-1 LPF) est
normalisé, obligatoire en cas de contrôle fiscal, et **importable par tous les éditeurs** (Sage, EBP,
Cegid/Quadra, ACD, Coala…). Ses 18 colonnes sont un sur-ensemble de ce que demandent les formats
propriétaires :

```
JournalCode  JournalLib  EcritureNum  EcritureDate  CompteNum  CompteLib
CompAuxNum   CompAuxLib  PieceRef     PieceDate     EcritureLib
Debit        Credit      EcritureLet  DateLet       ValidDate
Montantdevise  Idevise
```

Conséquence : si on modélise correctement le FEC, Sage / EBP / Quadra ne sont plus que des
**projections** de la même structure. On ne réimplémente jamais la logique métier.

**b) Les formats éditeurs sont des profils déclaratifs, pas du code.** Un profil décrit :
séparateur, encodage, fin de ligne, ordre et largeur des colonnes, format de date, format de montant,
en-tête présent ou non. Ajouter un éditeur = ajouter un fichier de profil + un fichier d'or de test.

```js
// backend/accounting/formats/profiles/ebp.js (exemple de forme)
module.exports = {
  id: 'ebp',
  label: 'EBP Compta — import paramétrable',
  extension: 'csv',
  encoding: 'windows-1252',   // ⚠ pas UTF-8 : les accents cassent sur les imports éditeurs
  eol: '\r\n',
  delimiter: ';',
  header: true,
  columns: [
    { key: 'journalCode', label: 'Journal', max: 3 },
    { key: 'entryDate', label: 'Date', format: 'DDMMYYYY' },
    { key: 'accountNum', label: 'Compte', max: 13 },
    { key: 'pieceRef', label: 'Piece', max: 15 },
    { key: 'entryLabel', label: 'Libelle', max: 40 },
    { key: 'debit', label: 'Debit', format: 'amount:comma' },
    { key: 'credit', label: 'Credit', format: 'amount:comma' },
  ],
}
```

### ⚠️ Point d'honnêteté sur les spécifications éditeurs

Les mises en page exactes (positions de colonnes du format ASCII Quadratus, variantes Sage 100 / Sage 50,
version d'EBP Compta) **ne doivent pas être écrites de mémoire**. Ce que l'on sait de façon fiable :

- **FEC** : spécification publique et stable → implémentable immédiatement, sans validation externe.
- **Quadra (Cegid)** : fichier texte ASCII à **longueur fixe**, un enregistrement de type `M` par ligne
  de mouvement (compte, code journal, date `JJMMAA`, libellé tronqué, sens `D`/`C`, montant en centimes
  cadré à droite). Les **offsets exacts sont à figer sur la documentation Quadratus** avant codage.
- **Sage** et **EBP** : plusieurs formats coexistent selon la gamme et la version ; en pratique la
  quasi-totalité des cabinets acceptent un **import paramétrable délimité** (CSV `;`).

D'où la règle de conduite proposée, qui est aussi la moins risquée commercialement :

> Pour chaque nouveau client, **demander au cabinet un fichier d'exemple** de son import (ou le nom exact
> de son logiciel + version). Ce fichier devient le fichier d'or du test de non-régression du profil.
> Livrer FEC + CSV générique dès le lot 1 permet de ne jamais bloquer un client en attendant cet aller-retour.

## 4. Modèle de données (migrations Supabase)

Convention du dépôt : un fichier `supabase/migrations/<timestamp>_<nom>.sql` + reproduction intégrale
dans `supabase/migrations/README.md` (les `*.sql` sont gitignorés).

### 4.1 Numérotation des documents (lot 0)

Une séquence Postgres classique **ne convient pas** : elle laisse des trous en cas de rollback, ce que
la réglementation interdit. Table + verrou de ligne :

```sql
create table if not exists public.accounting_sequences (
  site_id    text not null,
  kind       text not null check (kind in ('invoice', 'credit_note')),
  year       integer not null,
  last_value bigint not null default 0,
  primary key (site_id, kind, year)
);

-- Allocation atomique : UPDATE ... RETURNING pose un verrou de ligne, deux
-- paiements simultanés ne peuvent pas obtenir le même numéro.
create or replace function public.allocate_document_number(
  p_site_id text, p_kind text, p_year integer
) returns bigint
language plpgsql security definer set search_path = public as $$
declare v_next bigint;
begin
  insert into public.accounting_sequences (site_id, kind, year, last_value)
  values (p_site_id, p_kind, p_year, 0)
  on conflict (site_id, kind, year) do nothing;

  update public.accounting_sequences
  set last_value = last_value + 1
  where site_id = p_site_id and kind = p_kind and year = p_year
  returning last_value into v_next;

  return v_next;
end $$;
```

### 4.2 Gel de la facture sur la commande (lot 0)

```sql
alter table public.orders
  add column if not exists invoice_number    text,
  add column if not exists invoice_issued_at timestamptz,
  add column if not exists vat_regime        text,      -- 'normal' | 'margin' | 'exempt_export' | 'oss'
  add column if not exists vat_rate          numeric(5,2),
  add column if not exists net_cents         integer,   -- HT total, figé
  add column if not exists vat_cents         integer,   -- TVA totale, figée
  add column if not exists customer_country  text,      -- code ISO retenu pour la territorialité
  add column if not exists accounting_locked_at timestamptz;

create unique index if not exists orders_invoice_number_key
  on public.orders (site_id, invoice_number) where invoice_number is not null;

alter table public.order_lines
  add column if not exists vat_rate  numeric(5,2),
  add column if not exists net_cents integer,
  add column if not exists vat_cents integer;
```

`fulfill_order_payment` est étendue pour, **dans la même transaction** que la transition `→ paid` :
allouer le numéro, poser `invoice_issued_at = paid_at`, et écrire la ventilation HT/TVA calculée par le
backend et passée en paramètre. Idempotence conservée : la fonction ne renvoie `true` qu'au premier
appelant, donc un rejeu de webhook ne consomme pas de numéro.

### 4.3 Remboursements (lot 4) et journal des exports (lot 1)

```sql
create table if not exists public.order_refunds (
  id uuid primary key default gen_random_uuid(),
  site_id text not null,
  order_id uuid not null references public.orders (id),
  credit_note_number text,
  amount_cents integer not null,
  net_cents integer, vat_cents integer, vat_rate numeric(5,2),
  reason text,
  stripe_refund_id text unique,
  refunded_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.accounting_exports (
  id uuid primary key default gen_random_uuid(),
  site_id text not null,
  period_start date not null,
  period_end   date not null,
  journals text[] not null,          -- {'VE'} | {'VE','BQ'}
  format text not null,              -- fec | sage | ebp | quadra | csv
  entry_count integer not null,
  total_debit_cents bigint not null,
  total_credit_cents bigint not null,
  checksum text not null,            -- sha256 du fichier : re-export = même empreinte
  storage_path text,
  created_by text,
  created_at timestamptz not null default now()
);
```

`accounting_exports` sert à trois choses : tracer qui a exporté quoi, garantir qu'un ré-export produit
un fichier **identique** (contrôle par checksum), et proposer un **verrouillage de période**
(`orders.accounting_locked_at`) pour éviter le double envoi au cabinet.

## 5. Plan comptable configurable par client

Nouveau bloc dans `sites/<id>/site.config.js`, avec des défauts PCG appliqués dans un
`resolveAccountingConfig()` côté backend (même mécanique que `resolveReceiptBranding`) :

```js
accounting: {
  enabled: true,
  journals: { sales: 'VE', bank: 'BQ' },
  accounts: {
    customer: '411VEN',        // client collectif « ventes web »
    salesFr: '707100',         // ventes de marchandises France
    salesEu: '707200',         // livraisons intracommunautaires B2C (OSS)
    salesExport: '707300',     // exportations (Suisse…)
    shipping: '708500',        // ports et frais accessoires facturés
    discount: '709000',        // rabais, remises et ristournes accordés
    vatCollected: { '20': '445710', '5.5': '445720' },
    stripeClearing: '512200',  // compte d'attente Stripe
    bank: '512000',
    bankFees: '627000',        // services bancaires (commissions Stripe)
  },
  vat: {
    regime: 'normal',          // 'margin' pour un catalogue d'occasion art. 297 A
    defaultRate: 20,
    marginMention: "Régime particulier – Biens d'occasion – art. 297 A du CGI",
  },
  invoice: { prefix: 'FA', creditNotePrefix: 'AV', padding: 6, resetYearly: true },
  export: { defaultFormat: 'fec', timezone: 'Europe/Paris' },
}
```

Un test de contrat (`tests/contracts/site-config.contract.test.js`) vérifiera pour chaque site que les
numéros de compte sont bien formés, que chaque taux de TVA utilisé a un compte de TVA associé, et que
`vat.regime: 'margin'` n'est pas combiné avec un taux non nul.

## 6. Écritures produites — exemple chiffré

Commande `FA2026-000123`, payée le 14/03/2026 : montre 3 000,00 € TTC, livraison 20,00 € TTC,
code promo −100,00 € TTC → **2 920,00 € encaissés**, régime normal 20 %.

**Journal VE (ventes)**

| Compte | Libellé | Débit | Crédit |
| --- | --- | ---: | ---: |
| 411VEN | Client web — FA2026-000123 | 2 920,00 | |
| 707100 | Ventes marchandises France | | 2 416,67 |
| 708500 | Ports facturés | | 16,67 |
| 445710 | TVA collectée 20 % | | 486,66 |

**Règle d'arrondi (à implémenter telle quelle)** : les bases HT sont calculées composant par composant,
puis **la TVA est le solde** (`TTC − Σ HT`), jamais un recalcul indépendant. C'est la seule façon de
garantir une écriture équilibrée au centime sans dérive.

**Journal BQ (banque), lot 3** — encaissement puis commission puis virement :

| Compte | Libellé | Débit | Crédit |
| --- | --- | ---: | ---: |
| 512200 | Stripe — encaissement FA2026-000123 | 2 920,00 | |
| 411VEN | Lettrage FA2026-000123 | | 2 920,00 |
| 627000 | Commission Stripe (pi_xxx) | 44,05 | |
| 512200 | Stripe | | 44,05 |
| 512000 | Virement Stripe du 17/03/2026 | 2 875,95 | |
| 512200 | Stripe | | 2 875,95 |

Le lettrage (`EcritureLet`) est renseigné avec le numéro de facture : le comptable rapproche
automatiquement facture et encaissement.

**Cas TVA sur la marge** (`vat.regime: 'margin'`) : une seule ligne de vente, sans TVA collectée
(`D 411 3 000 / C 707100 3 000`), et la mention de régime portée sur la facture. La TVA sur marge est
calculée par le cabinet à partir du prix d'achat — que l'application ne connaît pas aujourd'hui
(voir lot 5).

### Piège à ne pas manquer : le fuseau horaire

`paid_at` est stocké en UTC. Une commande payée le 1er février à 00 h 30 à Paris est horodatée
**31 janvier 23 h 30 UTC** : découper les périodes en UTC la ferait basculer dans la déclaration de TVA
du mois précédent. Toutes les bornes de période doivent être calculées en `Europe/Paris`.

## 7. Découpage backend / frontend

### Backend — nouveau dossier `backend/accounting/`

```
backend/accounting/
├── config.js              # resolveAccountingConfig(site) — défauts PCG + surcharges manifest
├── vat.js                 # ventilation HT/TVA, régimes (normal, marge, export, OSS), arrondis
├── entries.js             # buildSalesEntries() / buildBankEntries() → écritures normalisées
├── balance.js             # contrôle débit = crédit, totaux, rapprochement CA
├── period.js              # bornes de période en Europe/Paris
└── formats/
    ├── index.js           # registre des profils, serialize(entries, profile)
    ├── fec.js             # 18 colonnes normalisées (implémentable sans validation externe)
    ├── csv.js             # CSV générique paramétrable
    └── profiles/{sage,ebp,quadra}.js
```

Routes admin (mêmes garde-fous que `GET /api/admin/orders/:orderId/receipt`) :

| Méthode | URL | Rôle | Réponse |
| --- | --- | --- | --- |
| GET | `/api/admin/accounting/preview?from&to` | admin | JSON : totaux, nb écritures, contrôle d'équilibre, anomalies |
| GET | `/api/admin/accounting/export?from&to&format&journals` | admin | fichier (`text/plain` ou `text/csv`), `Content-Disposition` |
| GET | `/api/admin/accounting/vouchers?from&to` | admin | ZIP des factures PDF de la période |
| POST | `/api/admin/accounting/lock` | admin | verrouille la période exportée |

L'export **doit** passer par le backend (service role) et non par le front Supabase : agrégation
multi-tables, encodage `windows-1252`, et surtout aucun risque de fuite de données comptables via RLS.

### Frontend — page `/admin/comptabilite`

Nouveau composant `AdminAccountingExport.vue` + service `adminAccountingService.js`, déclarés dans
`appRouteMeta.js` / `buildAppRoutes.js`, et ajoutés à `ADMIN_ONLY_PREFIXES`
(`adminPermissions.js:24`) — la comptabilité n'a pas à être visible d'un modérateur.

Contenu de l'écran : sélecteur de période (mois / trimestre / personnalisé), sélecteur de format,
choix des journaux, **aperçu avant téléchargement** (total débit, total crédit, écart, nombre de
factures, CA TTC — à rapprocher des KPI existants de `getSalesStatsByDay`), liste des anomalies
bloquantes (commande payée sans numéro, écriture déséquilibrée, remboursement non rattaché), bouton
de téléchargement, historique des exports avec empreinte et état de verrouillage.

## 8. Phasage proposé

| Lot | Contenu | Livrable client | Effort |
| --- | --- | --- | --- |
| **0 — Prérequis** | Numérotation factures + gel HT/TVA + migration + PDF renommé « Facture » avec mentions | Factures légalement valables | ~2–3 j |
| **1 — Socle export** | Moteur d'écritures, FEC, CSV générique, routes admin, page `/admin/comptabilite`, ZIP des pièces | **Export utilisable par n'importe quel cabinet** | ~3 j |
| **2 — Profils éditeurs** | Profils Sage / EBP / Quadra + encodages + fichiers d'or | La case « Sage, EBP, Quadra » est cochée | ~2 j (après réception d'un fichier d'exemple) |
| **3 — Journal de banque** | `stripe_charge_id` + balance transactions + commissions + virements | Rapprochement bancaire automatique | ~2 j |
| **4 — Avoirs** | Webhook `charge.refunded`, `order_refunds`, numérotation `AV`, écritures d'avoir | CA et TVA justes | ~2 j |
| **5 — Régimes de TVA** | TVA sur la marge (prix d'achat par montre, jamais exposé au front), export hors UE, OSS | Conformité `resale` + ventes UE/CH | ~2–3 j |

Le lot 1 seul répond déjà à la promesse commerciale : le FEC est accepté partout. Le lot 2 est du
confort — mais c'est celui qui se vend, donc il ne doit pas être renvoyé aux calendes.

## 9. Stratégie de test

- **Unitaires** (`tests/backend/accountingEntries.test.js`) : ventilation HT/TVA avec remise et port,
  arrondis (TVA = solde), livraison gratuite, remise supérieure au sous-total, régime marge, régime
  export, multi-taux. Invariant systématique : `Σ débit === Σ crédit`.
- **Bornes de période** : commande payée à 00 h 30 Paris le 1er du mois → présente dans le bon mois.
- **Sérialiseurs** (`tests/backend/accountingFormats.test.js`) : comparaison à des fichiers d'or
  (`tests/fixtures/accounting/*.txt`), y compris encodage et fins de ligne — un accent mal encodé est
  un rejet d'import.
- **Contrat manifest** : bloc `accounting` cohérent pour les quatre sites.
- **Idempotence** : deux exports de la même période → même checksum.

## 10. Points à trancher avant ouverture des lots

1. **Régime de TVA de `sauvage-watches`** : marge (art. 297 A) ou régime normal ? La réponse change la
   facture, l'export et le lot 5. À confirmer avec le comptable du client, pas à déduire du code.
2. **Numérotation** : format `FA2026-000123` et remise à zéro annuelle, ou compteur continu ? Faut-il
   reprendre les commandes déjà payées (attribution rétroactive dans l'ordre de `paid_at`) ?
3. **Compte client** : compte collectif unique (`411VEN`) — recommandé en e-commerce B2C — ou un compte
   auxiliaire par client (`CompAuxNum` du FEC) ?
4. **Périodicité** : mensuelle ou trimestrielle ? Envoi manuel depuis l'admin, ou dépôt automatique
   (email au cabinet en fin de mois, sur la mécanique de planification déjà en place pour la newsletter) ?
5. **Logiciel réel du cabinet** de chaque client, avec version, et si possible un fichier d'import
   d'exemple — prérequis du lot 2.
