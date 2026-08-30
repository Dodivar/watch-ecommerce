-- Migration : public / audience des montres
-- Ajoute la colonne `watches.audience` (slug) + table de référence `watch_audiences`.
-- Corrige l'erreur PostgREST :
--   "Could not find the 'audience' column of 'watches' in the schema cache"
--
-- Idempotent : peut être rejoué sans risque.
-- À appliquer dans le SQL Editor du projet Supabase de CHAQUE client.

-- 1. Table de référence des publics (slug + libellés)
create table if not exists public.watch_audiences (
  slug text primary key,
  label_fr text not null,
  sort_order integer not null default 0,
  show_in_collection_filter boolean not null default false
);

-- Seed / mise à jour des valeurs (aligné sur src/constants/watchAudiences.js)
insert into public.watch_audiences (slug, label_fr, sort_order, show_in_collection_filter)
values
  ('unisexe', 'Unisexe', 5,  false),
  ('homme',   'Homme',   10, true),
  ('femme',   'Femme',   20, true),
  ('enfant',  'Enfant',  30, true)
on conflict (slug) do update set
  label_fr = excluded.label_fr,
  sort_order = excluded.sort_order,
  show_in_collection_filter = excluded.show_in_collection_filter;

-- Lecture publique de la table de référence
alter table public.watch_audiences enable row level security;

drop policy if exists "watch_audiences_public_read" on public.watch_audiences;
create policy "watch_audiences_public_read"
  on public.watch_audiences
  for select
  using (true);

-- 2. Colonne audience sur watches (slug, défaut unisexe)
alter table public.watches
  add column if not exists audience text not null default 'unisexe';

-- Backfill des éventuelles lignes existantes sans valeur
update public.watches
  set audience = 'unisexe'
  where audience is null;

-- Intégrité : la valeur doit exister dans la table de référence
alter table public.watches
  drop constraint if exists watches_audience_fkey;
alter table public.watches
  add constraint watches_audience_fkey
  foreign key (audience)
  references public.watch_audiences (slug)
  on update cascade
  on delete set default;

-- Index pour le filtre collection
create index if not exists watches_audience_idx
  on public.watches (audience);

-- 3. Forcer le rechargement du cache de schéma PostgREST
notify pgrst, 'reload schema';
