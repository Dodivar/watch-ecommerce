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
