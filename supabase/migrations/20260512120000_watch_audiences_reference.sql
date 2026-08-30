-- Référentiel « public / catégorie client » pour les montres (homme, femme, enfant, unisexe, …).
-- Extensible : ajouter des lignes dans watch_audiences (nouveaux slug + label_fr) sans changer le schéma.
-- La colonne watches.audience (texte = slug) référence watch_audiences.slug.

create table if not exists public.watch_audiences (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  label_fr text not null,
  sort_order integer not null default 0,
  show_in_collection_filter boolean not null default true,
  created_at timestamptz not null default now(),
  constraint watch_audiences_slug_format check (slug ~ '^[a-z0-9_]+$'),
  constraint watch_audiences_slug_unique unique (slug)
);

comment on table public.watch_audiences is
  'Catalogue du public cible (catégorie client). watches.audience doit correspondre à un slug.';

comment on column public.watch_audiences.slug is
  'Identifiant stable (API, URL, filtre collection).';

comment on column public.watch_audiences.show_in_collection_filter is
  'Si true, le slug peut apparaître comme chip dans les filtres collection (ex. unisexe réservé à l’admin).';

create index if not exists watch_audiences_sort_idx
  on public.watch_audiences (sort_order asc, slug asc);

-- Données initiales (idempotentes)
insert into public.watch_audiences (slug, label_fr, sort_order, show_in_collection_filter)
values
  ('unisexe', 'Unisexe', 5, false),
  ('homme', 'Homme', 10, true),
  ('femme', 'Femme', 20, true),
  ('enfant', 'Enfant', 30, true)
on conflict (slug) do update set
  label_fr = excluded.label_fr,
  sort_order = excluded.sort_order,
  show_in_collection_filter = excluded.show_in_collection_filter;

-- Colonne audience si elle n’existe pas encore (projets créés sans cette colonne)
alter table public.watches
  add column if not exists audience text;

update public.watches
set audience = 'unisexe'
where audience is null
   or trim(audience) = ''
   or lower(trim(audience)) not in (
     select wa.slug from public.watch_audiences wa
   );

alter table public.watches
  alter column audience set default 'unisexe';

-- Contrainte FK slug ↔ watches.audience (mise à jour du slug propagée ; pas de suppression d’une ligne référencée)
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'watches_audience_slug_fkey'
      and conrelid = 'public.watches'::regclass
  ) then
    alter table public.watches
      add constraint watches_audience_slug_fkey
      foreign key (audience) references public.watch_audiences (slug)
      on update cascade
      on delete restrict;
  end if;
end $$;

create index if not exists watches_audience_idx on public.watches (audience);

-- RLS : lecture publique du référentiel (écriture réservée au SQL / rôle service)
alter table public.watch_audiences enable row level security;

drop policy if exists "watch_audiences_select_public" on public.watch_audiences;

create policy "watch_audiences_select_public"
  on public.watch_audiences
  for select
  to anon, authenticated
  using (true);

grant select on table public.watch_audiences to anon, authenticated;
