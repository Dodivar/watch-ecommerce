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

## Newsletter (admin)

`20260701120000_newsletter.sql` — requis pour les clients avec `features.newsletter` :

- Table `newsletter_subscribers` (liste opt-in + imports clients/leads, jeton de désinscription unique)
- Table `newsletter_campaigns` (brouillon → envoyée, corps HTML WYSIWYG)
- Table `newsletter_campaign_recipients` (journal d'envoi par destinataire, reprise sans doublon)
- Table `newsletter_settings` (en-tête/pied de page et marque éditables depuis l'admin)
- Policies RLS admin (`is_admin_user()`) ; inscription publique et envoi Mailjet via backend service role
- Prérequis : `20260525120000_admin_phase1.sql` (`is_admin_user()`)

Les fichiers `*.sql` étant ignorés par git (voir `.gitignore`), le contenu complet
de la migration est reproduit ci-dessous pour application via le SQL Editor.

```sql
-- Abonnés newsletter (liste opt-in + imports clients/leads)
create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  site_id text not null,
  email text not null,
  name text,
  status text not null default 'subscribed'
    check (status in ('subscribed', 'unsubscribed')),
  source text not null default 'optin'
    check (source in ('optin', 'import', 'manual')),
  consent_at timestamptz,
  unsubscribed_at timestamptz,
  unsubscribe_token uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (site_id, email)
);
create unique index if not exists newsletter_subscribers_token_idx
  on public.newsletter_subscribers (unsubscribe_token);
create index if not exists newsletter_subscribers_site_status_idx
  on public.newsletter_subscribers (site_id, status);

-- Campagnes (brouillon → envoyée)
create table if not exists public.newsletter_campaigns (
  id uuid primary key default gen_random_uuid(),
  site_id text not null,
  subject text not null default '',
  body_html text not null default '',
  status text not null default 'draft'
    check (status in ('draft', 'sending', 'sent', 'failed')),
  recipient_count integer not null default 0,
  sent_count integer not null default 0,
  created_by text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists newsletter_campaigns_site_idx
  on public.newsletter_campaigns (site_id, created_at desc);

-- Journal des destinataires par campagne (audit + reprise sans doublon)
create table if not exists public.newsletter_campaign_recipients (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.newsletter_campaigns (id) on delete cascade,
  site_id text not null,
  email text not null,
  status text not null default 'pending'
    check (status in ('pending', 'sent', 'failed')),
  error text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (campaign_id, email)
);
create index if not exists newsletter_recipients_campaign_idx
  on public.newsletter_campaign_recipients (campaign_id);

-- Réglages de marque (une ligne par site ; amorcés côté backend)
create table if not exists public.newsletter_settings (
  site_id text primary key,
  logo_text text,
  accent_color text,
  header_html text,
  footer_html text,
  sender_name text,
  reply_to text,
  updated_at timestamptz not null default now()
);

-- RLS — accès complet réservé aux admins ; le backend (service role) contourne.
alter table public.newsletter_subscribers enable row level security;
alter table public.newsletter_campaigns enable row level security;
alter table public.newsletter_campaign_recipients enable row level security;
alter table public.newsletter_settings enable row level security;

drop policy if exists newsletter_subscribers_admin on public.newsletter_subscribers;
create policy newsletter_subscribers_admin on public.newsletter_subscribers
  for all using (public.is_admin_user()) with check (public.is_admin_user());

drop policy if exists newsletter_campaigns_admin on public.newsletter_campaigns;
create policy newsletter_campaigns_admin on public.newsletter_campaigns
  for all using (public.is_admin_user()) with check (public.is_admin_user());

drop policy if exists newsletter_recipients_admin on public.newsletter_campaign_recipients;
create policy newsletter_recipients_admin on public.newsletter_campaign_recipients
  for all using (public.is_admin_user()) with check (public.is_admin_user());

drop policy if exists newsletter_settings_admin on public.newsletter_settings;
create policy newsletter_settings_admin on public.newsletter_settings
  for all using (public.is_admin_user()) with check (public.is_admin_user());
```

## Newsletter — programmation des envois (planification)

`20260701130000_newsletter_scheduling.sql` — requis pour l'envoi différé des
campagnes newsletter (planification à une date/heure) et le suivi des campagnes
programmées / envoyées / annulées :

- Colonne `newsletter_campaigns.scheduled_at` (date/heure d'envoi planifiée)
- Étend la contrainte CHECK de `newsletter_campaigns.status` pour autoriser les
  valeurs `scheduled` (programmée) et `cancelled` (annulée), en plus de
  `draft`, `sending`, `sent`, `failed`
- Index `newsletter_campaigns_due_idx` (site_id, status, scheduled_at) pour la
  boucle de planification du backend qui déclenche les envois arrivés à échéance
- Prérequis : `20260701120000_newsletter.sql`
- Prérequis config : `backend.publicApiUrl` renseigné dans le manifest du site —
  sans lui, les liens de désinscription seraient morts et la boucle de
  planification **suspend l'envoi** (warning dans les logs du backend)

Les fichiers `*.sql` étant ignorés par git, le contenu complet est reproduit
ci-dessous pour application via le SQL Editor.

```sql
-- Envoi différé : date/heure de programmation
alter table public.newsletter_campaigns
  add column if not exists scheduled_at timestamptz;

-- Statuts « programmée » et « annulée » en plus des statuts existants
alter table public.newsletter_campaigns
  drop constraint if exists newsletter_campaigns_status_check;

alter table public.newsletter_campaigns
  add constraint newsletter_campaigns_status_check
  check (status in ('draft', 'scheduled', 'sending', 'sent', 'failed', 'cancelled'));

-- Index pour la boucle de planification (campagnes arrivées à échéance)
create index if not exists newsletter_campaigns_due_idx
  on public.newsletter_campaigns (site_id, status, scheduled_at);
```

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

## Relance panier abandonné (checkout)

`20260710120000_abandoned_checkout_recovery.sql` — requis pour les clients avec `checkout.abandonedCart.enabled` (relance email des commandes draft non finalisées, voir `backend/orders/recovery.js`) :

- Colonne `orders.recovery_email_sent_at` — horodatage de la relance (une seule relance par commande, réclamation atomique)
- Colonne `orders.recovery_token_hash` — hash du token signé du lien de reprise `/checkout?order=…&token=…` (accepté en plus du token d'origine)
- Index partiel pour la requête du planificateur

```sql
alter table public.orders
  add column if not exists recovery_email_sent_at timestamptz,
  add column if not exists recovery_token_hash text;

create index if not exists orders_abandoned_recovery_idx
  on public.orders (site_id, status, updated_at)
  where recovery_email_sent_at is null and customer_email is not null;
```

## Rôles admin (admin / moderator / visitor)

`20260720130000_admin_user_roles.sql` — requis pour la gestion des utilisateurs du panel d'administration (invitation par email, rôles) :

- Colonne `admin_users.role` (`admin`, `moderator`, `visitor` — défaut `admin`, les comptes existants restent administrateurs)
- Fonctions `current_admin_role()` et `admin_has_role(...)` ; `is_admin_user()` reste **inchangée** (toujours utilisée pour la lecture)
- Policies RLS scindées lecture/écriture par table :
  - **Écriture admin + moderator** (contenu métier) : `watches`, `watch_details`, `articles`, `lead_submissions`, `orders`, `order_lines`, `order_shipping`, `order_discounts`, `newsletter_subscribers`, `newsletter_campaigns`, `newsletter_campaign_recipients`, `newsletter_settings`
  - **Écriture admin uniquement** (contenu site / promotions) : `promo_codes`, `promo_redemptions`, `watch_promotion_campaigns`, `watch_promotion_campaign_items`, `home_carousel_slides`, `home_featured_watches`
  - `admin_users` : lecture seule côté client (tous rôles) ; **aucune écriture client** — invitations, changements de rôle et suppressions passent par le backend (service role) via `/api/admin/users/*`
  - Le rôle `visitor` garde la lecture partout (`is_admin_user()`) mais aucune écriture
- Prérequis : `20260525120000_admin_phase1.sql` (`admin_users`, `is_admin_user()`)

Configuration Supabase Auth par tenant (Dashboard → Authentication → URL Configuration → Redirect URLs) — requis pour le lien d'invitation :

- `https://<domaine-du-site>/admin/set-password`
- `http://localhost:5173/admin/set-password` (dev)

Le modèle d'email « Invite user » peut être personnalisé dans Authentication → Email Templates.

Les fichiers `*.sql` étant ignorés par git, le contenu complet est reproduit ci-dessous pour application via le SQL Editor.

```sql
-- 1) Colonne role (les admins existants restent 'admin' via le défaut)
alter table public.admin_users
  add column if not exists role text not null default 'admin'
  check (role in ('admin', 'moderator', 'visitor'));

-- 2) Helpers rôle. is_admin_user() reste inchangée (lecture, tous rôles).
create or replace function public.current_admin_role()
returns text
language sql stable security definer
set search_path = public
as $$
  select role from public.admin_users
  where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  limit 1
$$;

create or replace function public.admin_has_role(variadic roles text[])
returns boolean
language sql stable security definer
set search_path = public
as $$
  select coalesce(public.current_admin_role() = any (roles), false)
$$;

-- 3) Supprimer les anciennes policies admin « for all » (noms variables selon les
-- tenants) : on retire toute policy référençant is_admin_user() sur les tables
-- concernées, puis on recrée des policies lecture/écriture nommées explicitement.
-- Les policies de lecture publique (montres, carrousel…) ne référencent pas
-- is_admin_user() et sont donc préservées.
do $$
declare p record;
begin
  for p in
    select policyname, tablename
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'admin_users',
        'watches', 'watch_details', 'articles', 'lead_submissions',
        'orders', 'order_lines', 'order_shipping', 'order_discounts',
        'newsletter_subscribers', 'newsletter_campaigns',
        'newsletter_campaign_recipients', 'newsletter_settings',
        'promo_codes', 'promo_redemptions',
        'watch_promotion_campaigns', 'watch_promotion_campaign_items',
        'home_carousel_slides', 'home_featured_watches'
      )
      and (coalesce(qual, '') ilike '%is_admin_user%'
        or coalesce(with_check, '') ilike '%is_admin_user%')
  loop
    execute format('drop policy %I on public.%I', p.policyname, p.tablename);
  end loop;
end $$;

-- 4) admin_users : lecture pour tout membre (login + liste), écritures backend
-- uniquement (service role, contourne la RLS — aucune policy d'écriture client).
create policy admin_users_member_read on public.admin_users
  for select using (public.is_admin_user());

-- 5) Contenu métier : lecture tous rôles, écriture admin + moderator.
do $$
declare t text;
begin
  foreach t in array array[
    'watches', 'watch_details', 'articles', 'lead_submissions',
    'orders', 'order_lines', 'order_shipping', 'order_discounts',
    'newsletter_subscribers', 'newsletter_campaigns',
    'newsletter_campaign_recipients', 'newsletter_settings'
  ] loop
    if to_regclass('public.' || t) is null then continue; end if;
    execute format(
      'create policy %I on public.%I for select using (public.is_admin_user())',
      t || '_admin_read', t);
    execute format(
      'create policy %I on public.%I for insert with check (public.admin_has_role(''admin'', ''moderator''))',
      t || '_admin_insert', t);
    execute format(
      'create policy %I on public.%I for update using (public.admin_has_role(''admin'', ''moderator'')) with check (public.admin_has_role(''admin'', ''moderator''))',
      t || '_admin_update', t);
    execute format(
      'create policy %I on public.%I for delete using (public.admin_has_role(''admin'', ''moderator''))',
      t || '_admin_delete', t);
  end loop;
end $$;

-- 6) Contenu site / promotions : lecture tous rôles, écriture admin uniquement.
do $$
declare t text;
begin
  foreach t in array array[
    'promo_codes', 'promo_redemptions',
    'watch_promotion_campaigns', 'watch_promotion_campaign_items',
    'home_carousel_slides', 'home_featured_watches'
  ] loop
    if to_regclass('public.' || t) is null then continue; end if;
    execute format(
      'create policy %I on public.%I for select using (public.is_admin_user())',
      t || '_admin_read', t);
    execute format(
      'create policy %I on public.%I for insert with check (public.admin_has_role(''admin''))',
      t || '_admin_insert', t);
    execute format(
      'create policy %I on public.%I for update using (public.admin_has_role(''admin'')) with check (public.admin_has_role(''admin''))',
      t || '_admin_update', t);
    execute format(
      'create policy %I on public.%I for delete using (public.admin_has_role(''admin''))',
      t || '_admin_delete', t);
  end loop;
end $$;
```

Vérification post-migration (les policies `*_admin_read` / `*_admin_insert` / `*_admin_update` / `*_admin_delete` doivent apparaître) :

```sql
select tablename, policyname, cmd
from pg_policies
where schemaname = 'public' and policyname like '%_admin_%'
order by tablename, policyname;
```

Note : les policies des buckets Storage (`home-carousel`, images montres) restent basées sur `is_admin_user()` ; les uploads y sont donc encore possibles pour tout membre authentifié du panel. Les resserrer sur `admin_has_role(...)` peut se faire dans une migration ultérieure si nécessaire.

## Codes promo — rédemption atomique

`20260720120000_redeem_promo_code_rpc.sql` — corrige la course sur `promo_codes.used_count` (lecture puis écriture côté backend : deux paiements simultanés pouvaient perdre un incrément et dépasser `max_uses`) et rend la comptabilisation idempotente (un webhook Stripe rejoué ne compte plus deux fois la même commande) :

- Index unique `promo_redemptions_order_id_key` — une seule rédemption par commande
- RPC `redeem_promo_code(p_promo_code_id, p_order_id, p_customer_email)` — insertion de la rédemption + incrément `used_count` en une transaction ; renvoie `false` si la commande est déjà comptabilisée
- Utilisée par `backend/routes/orders.js` (`handlePaymentIntentSucceeded`) ; tant que la migration n'est pas appliquée, le backend retombe sur l'ancien chemin non atomique avec un warning
- Prérequis : tables checkout existantes (`promo_codes`, `promo_redemptions`)

```sql
-- Une seule rédemption par commande (idempotence webhook / réconciliation).
create unique index if not exists promo_redemptions_order_id_key
  on public.promo_redemptions (order_id);

-- Rédemption atomique : insertion + incrément en une transaction. L'incrément
-- n'a lieu que si l'insertion a réellement créé la ligne (pas de double
-- comptage en cas de rejeu).
create or replace function public.redeem_promo_code(
  p_promo_code_id uuid,
  p_order_id uuid,
  p_customer_email text default null
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.promo_redemptions (promo_code_id, order_id, customer_email)
  values (p_promo_code_id, p_order_id, p_customer_email)
  on conflict (order_id) do nothing;

  if not found then
    return false; -- commande déjà comptabilisée
  end if;

  update public.promo_codes
  set used_count = coalesce(used_count, 0) + 1
  where id = p_promo_code_id;

  return true;
end;
$$;
```

## Descriptions traduites par montre

`20260819120000_watch_translations.sql` — requis pour les clients multilingues (`i18n.locales`)
afin de rédiger la description d'une montre en anglais et en allemand :

- Table `watch_translations` (`watch_id`, `locale`, `description`), une ligne par langue renseignée
- `watches.description` reste la source française et le repli : une table vide ne change rien au rendu
- Lecture publique RLS (comme `watches` / `watch_details`), écriture réservée à `is_admin_user()`
- Les caractéristiques techniques (mouvement, matière, état, contenu, garantie…) ne passent **pas**
  par cette table : leur vocabulaire est traduit à l'affichage
  (`packages/base/src/i18n/watchSpecs.js`), sans écriture en base
- Tant que la migration n'est pas appliquée, la fiche s'affiche en français (le service ignore
  l'erreur `PGRST205` « table absente »)

```sql
-- Traductions par montre du texte vraiment unique : la description.
--
-- Les caractéristiques techniques (mouvement, matière, état, contenu, garantie…) ne passent
-- pas par ici : leur vocabulaire est minuscule et se traduit à l'affichage via
-- `packages/base/src/i18n/watchSpecs.js`, sans écriture en base. Seule la description est
-- rédigée montre par montre et mérite donc une ligne par langue.
--
-- `watches.description` reste la source française et le repli : une table vide ne change
-- rien au rendu actuel.

create table if not exists public.watch_translations (
  watch_id uuid not null references public.watches(id) on delete cascade,
  locale text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (watch_id, locale)
);

comment on table public.watch_translations is
  'Traductions par montre et par langue. Le français canonique reste dans watches.description.';

comment on column public.watch_translations.locale is
  'Code langue court aligné sur SUPPORTED_LOCALES (packages/base/src/i18n/locales.js).';

alter table public.watch_translations drop constraint if exists watch_translations_locale_supported;

alter table public.watch_translations
  add constraint watch_translations_locale_supported
    check (locale in ('fr', 'en', 'de'));

create index if not exists watch_translations_watch_id_idx
  on public.watch_translations (watch_id);

-- RLS : lecture publique (comme watches / watch_details), écriture réservée aux admins.
alter table public.watch_translations enable row level security;

drop policy if exists "watch_translations_select_public" on public.watch_translations;

create policy "watch_translations_select_public"
  on public.watch_translations
  for select
  to anon, authenticated
  using (true);

drop policy if exists "watch_translations_admin_all" on public.watch_translations;

create policy "watch_translations_admin_all"
  on public.watch_translations
  for all
  to authenticated
  using (is_admin_user())
  with check (is_admin_user());

grant select on table public.watch_translations to anon, authenticated;
grant insert, update, delete on table public.watch_translations to authenticated;

-- `updated_at` suit la même mécanique que watch_details.
create or replace function public.touch_watch_translations_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists watch_translations_touch_updated_at on public.watch_translations;

create trigger watch_translations_touch_updated_at
  before update on public.watch_translations
  for each row
  execute function public.touch_watch_translations_updated_at();
```
