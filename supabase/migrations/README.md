# Migrations Supabase

Appliquer chaque fichier SQL dans l’ordre chronologique via le SQL Editor du projet Supabase **de chaque client**.

## Admin Phase 1

`20260525120000_admin_phase1.sql` — requis pour :

- Boîte de réception leads (`lead_submissions`)
- Stock retail (`watches.stock_quantity`)
- Suivi commandes (`orders.fulfillment_status`)
- Sélections accueil (`home_featured_watches`)
- Policies RLS admin

Prérequis : tables checkout existantes (`orders`, `order_lines`, `promo_codes`, `admin_users`) — voir `backend/README.md`.

## Carrousel d'accueil

`20260608120000_home_carousel.sql` — requis pour les clients avec `features.homeCarousel` :

- Table `home_carousel_slides` (ordre, marque optionnelle, métadonnées)
- Bucket Storage public `home-carousel`

`20260608130000_home_carousel_watch_link.sql` — lien optionnel vers une fiche montre (`watch_id`) sur chaque slide.
- Policies RLS admin (lecture publique)

## Public / audience des montres

`20260614120000_watch_audiences.sql` — requis pour le champ « Public » du formulaire admin et le filtre collection par audience :

- Colonne `watches.audience` (slug, défaut `unisexe`)
- Table de référence `watch_audiences` (slugs `unisexe`, `homme`, `femme`, `enfant`) + lecture publique RLS
- Corrige l'erreur `Could not find the 'audience' column of 'watches' in the schema cache`

## Checkout — création commande optimisée

`20260618120000_create_draft_order_rpc.sql` — RPC `create_draft_order` (insert commande + réservation stock + lignes + quote initiale en une transaction). Requis pour le backend checkout actuel (`POST /api/orders`). Prérequis : `reserve_watches_for_order`, `release_order_reservation`.

## Reçus PDF commandes (Storage privé)

`20260621120000_order_receipts_storage.sql` — requis pour l'archivage des reçus PDF :

- Colonne `orders.receipt_storage_path`
- Bucket Storage privé `order-receipts` (PDF uniquement, accès backend service role)
- Téléchargement admin via `GET /api/admin/orders/:orderId/receipt`

## Promotions montres

`20260622120000_watch_promotions.sql` — prix promotionnels par montre :

- Colonnes `watches.promotion_price`, `watches.discount_percent`
- Fonction `watch_effective_price(price, promotion_price)`
- Mise à jour RPC `create_draft_order` pour facturer le prix effectif
- Prérequis : `20260618120000_create_draft_order_rpc.sql`

## Campagnes promotionnelles (admin)

`20260622140000_watch_promotion_campaigns.sql` — événements promo groupés :

- Tables `watch_promotion_campaigns`, `watch_promotion_campaign_items`
- Prérequis : `20260525120000_admin_phase1.sql` (`is_admin_user()`)

`20260622150000_watch_promotion_campaigns_rls.sql` — à appliquer si les tables existent déjà sans policies RLS (corrige `new row violates row-level security policy`).

`20260622160000_watch_promotion_menu_carousel.sql` — menu dynamique + filtre collection + carrousel :

- Colonnes `slug`, `show_in_menu`, `menu_label`, `menu_order` sur `watch_promotion_campaigns`
- Colonne `promotion_campaign_id` sur `home_carousel_slides`
- Policies RLS lecture publique campagnes et items (filtrage actif côté app)
- Prérequis : `20260622140000_watch_promotion_campaigns.sql`, `20260608120000_home_carousel.sql`

## Couleur du bracelet

`20260627120000_watch_bracelet_colors.sql` — requis pour le filtre collection « Couleur du bracelet » (pastilles rondes) et le champ correspondant du formulaire admin :

- Colonne `watch_details.bracelet_colors` (`text[]`, défaut `{}`) — une montre peut être bicolore
- Valeurs validées côté application (`packages/base/src/constants/watchBraceletColors.js` : `gold`, `silver`, `black`, `rose_gold`, `bronze`, `blue`)
- Corrige l'erreur `Could not find the 'bracelet_colors' column of 'watch_details' in the schema cache`

```sql
alter table public.watch_details
  add column if not exists bracelet_colors text[] not null default '{}'::text[];
```

## Matières du bracelet (filtre collection + admin multi-sélection)

`20260628120000_watch_bracelet_materials.sql` — requis pour sélectionner plusieurs matières par montre (ex. acier + or) :

- Colonne `watch_details.bracelet_materials` (`text[]`, défaut `{}`) — une montre peut combiner plusieurs matières
- Valeurs validées côté application (`packages/base/src/constants/watchBraceletMaterials.js` : `steel`, `gold`, `leather`, `rubber`, `titanium`, `ceramic`, `fabric`)
- Backfill automatique depuis l'ancienne colonne `bracelet_material` (singulier, legacy — lecture de repli uniquement côté app)
- Corrige l'erreur `Could not find the 'bracelet_materials' column of 'watch_details' in the schema cache`

```sql
alter table public.watch_details
  add column if not exists bracelet_materials text[] not null default '{}'::text[];

update public.watch_details
set bracelet_materials = array[bracelet_material]
where bracelet_material is not null
  and bracelet_material <> ''
  and (bracelet_materials is null or bracelet_materials = '{}'::text[]);
```

Activer le filtre dans le manifest client :

```js
collection: {
  filters: {
    braceletMaterial: true,
    braceletColor: true,
  },
},
```

### Backfill des libellés texte existants (une fois par projet Supabase)

À exécuter après déploiement si des montres ont encore des libellés PrestaShop en clair :

```sql
-- Acier
update public.watch_details set bracelet_material = 'steel'
where bracelet_material is not null and bracelet_material not in ('steel','gold','leather','rubber','titanium','ceramic','fabric')
  and (bracelet_material ilike '%acier%' or bracelet_material ilike '%inox%' or bracelet_material ilike 'steel');

-- Or
update public.watch_details set bracelet_material = 'gold'
where bracelet_material is not null and bracelet_material not in ('steel','gold','leather','rubber','titanium','ceramic','fabric')
  and (bracelet_material ilike '% or %' or bracelet_material ilike 'or %' or bracelet_material ilike '% or' or bracelet_material = 'or' or bracelet_material ilike 'gold');

-- Cuir
update public.watch_details set bracelet_material = 'leather'
where bracelet_material is not null and bracelet_material not in ('steel','gold','leather','rubber','titanium','ceramic','fabric')
  and (bracelet_material ilike '%cuir%' or bracelet_material ilike 'leather');

-- Caoutchouc / silicone
update public.watch_details set bracelet_material = 'rubber'
where bracelet_material is not null and bracelet_material not in ('steel','gold','leather','rubber','titanium','ceramic','fabric')
  and (bracelet_material ilike '%caoutchouc%' or bracelet_material ilike '%silicone%' or bracelet_material ilike 'rubber');

-- Titane
update public.watch_details set bracelet_material = 'titanium'
where bracelet_material is not null and bracelet_material not in ('steel','gold','leather','rubber','titanium','ceramic','fabric')
  and (bracelet_material ilike '%titane%' or bracelet_material ilike 'titanium');

-- Céramique
update public.watch_details set bracelet_material = 'ceramic'
where bracelet_material is not null and bracelet_material not in ('steel','gold','leather','rubber','titanium','ceramic','fabric')
  and (bracelet_material ilike '%céramique%' or bracelet_material ilike '%ceramique%' or bracelet_material ilike 'ceramic');

-- Tissu / NATO
update public.watch_details set bracelet_material = 'fabric'
where bracelet_material is not null and bracelet_material not in ('steel','gold','leather','rubber','titanium','ceramic','fabric')
  and (bracelet_material ilike '%tissu%' or bracelet_material ilike '%nato%' or bracelet_material ilike '%nylon%' or bracelet_material ilike 'fabric');
```

Les valeurs non reconnues restent en texte libre : elles n'apparaissent pas dans le filtre collection tant qu'elles ne sont pas corrigées via l'admin ou un import.

## Aperçu collection (bloc éditorial accueil)

`20260630120000_home_featured_collection_context.sql` — requis pour l'admin « Aperçu collection » et la section `collectionHighlight` de l'accueil :

- Étend la contrainte CHECK de `home_featured_watches.context` pour autoriser la valeur `collection` (en plus de `nouvelles` et `selection`)
- Corrige l'erreur `new row for relation "home_featured_watches" violates check constraint "home_featured_watches_context_check"` lors de l'ajout d'une montre depuis l'admin « Aperçu collection »
- Prérequis : `20260525120000_admin_phase1.sql`

```sql
alter table public.home_featured_watches
  drop constraint if exists home_featured_watches_context_check;

alter table public.home_featured_watches
  add constraint home_featured_watches_context_check
  check (context in ('nouvelles', 'selection', 'collection'));
```
