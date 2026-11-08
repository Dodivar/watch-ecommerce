-- Slugs lisibles : montres sans doublon, historique des anciens slugs, articles de blog.
--
-- 1. `build_watch_slug` concaténait marque + nom + référence. Or le nom saisi en admin commence
--    presque toujours par la marque et contient souvent la référence : on obtenait
--    `rolex-rolex-explorer-i-114270-montre-seule-114270`. La marque n'est plus répétée quand le nom
--    la porte déjà, ni la référence quand le nom la contient.
--
-- 2. `watch_slug_history` garde chaque slug abandonné et la montre qu'il désignait. Le serveur
--    (`api/render-page.js`) et le client (`resolveWatchIdBySlug`) redirigent un ancien slug vers
--    le slug courant : renommer une montre ne casse plus ses liens.
--
-- 3. `articles.slug` : adresse `/blog/<slug>` au lieu de l'UUID. Posé à la création (ou quand il est
--    vide), **jamais recalculé** quand le titre change, pour ne pas casser les liens partagés.
--
-- Ce fichier ne réécrit PAS les slugs des montres existantes : voir
-- `20261108130000_watch_slugs_rewrite.sql`, à appliquer une fois le code qui lit l'historique en
-- production. Il est donc sans effet visible sur le site actuel, hormis pour les montres créées ou
-- renommées après son application (slug sans doublon).
--
-- Idempotent.

-- ---------------------------------------------------------------------------------------------
-- Montres : slug sans doublon
-- ---------------------------------------------------------------------------------------------

create or replace function public.build_watch_slug(
  p_brand text,
  p_name text,
  p_reference text,
  p_id uuid
)
returns text
language plpgsql
immutable
as $$
declare
  brand_part text := nullif(public.slugify_watch_part(p_brand), '');
  name_part text := nullif(public.slugify_watch_part(p_name), '');
  ref_part text := nullif(public.slugify_watch_part(p_reference), '');
begin
  -- « Rolex » + « Rolex Submariner » : la marque n'est écrite qu'une fois.
  if brand_part is not null and name_part is not null then
    if name_part = brand_part then
      name_part := null;
    elsif left(name_part, length(brand_part) + 1) = brand_part || '-' then
      name_part := substr(name_part, length(brand_part) + 2);
    end if;
  end if;

  -- Référence déjà présente dans le nom, en segment entier : on ne la répète pas.
  if ref_part is not null and name_part is not null
     and position('-' || ref_part || '-' in '-' || name_part || '-') > 0 then
    ref_part := null;
  end if;

  return coalesce(nullif(concat_ws('-', brand_part, name_part, ref_part), ''), p_id::text);
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Montres : historique des slugs
-- ---------------------------------------------------------------------------------------------

create table if not exists public.watch_slug_history (
  old_slug text primary key,
  watch_id uuid not null references public.watches (id) on delete cascade,
  changed_at timestamptz not null default now()
);

create index if not exists watch_slug_history_watch_id_idx
  on public.watch_slug_history (watch_id);

comment on table public.watch_slug_history is
  'Slugs abandonnés d''une montre, redirigés (301) vers son slug courant.';

alter table public.watch_slug_history enable row level security;

-- Lecture publique, comme `watches` : la redirection est résolue avec la clé anonyme.
-- Aucune policy d'écriture : seul le trigger (SECURITY DEFINER) y écrit.
drop policy if exists "Watch slug history is viewable by everyone" on public.watch_slug_history;
create policy "Watch slug history is viewable by everyone"
  on public.watch_slug_history for select
  using (true);

-- SECURITY DEFINER : le trigger écrit dans l'historique, que l'admin ne peut pas écrire
-- directement, et vérifie l'unicité sur toutes les montres quel que soit l'appelant.
create or replace function public.watches_set_slug()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  candidate text;
  final_slug text;
begin
  candidate := public.build_watch_slug(NEW.brand, NEW.name, NEW.reference, NEW.id);

  if TG_OP = 'UPDATE'
     and NEW.slug is not null
     and NEW.slug = OLD.slug
     and NEW.brand is not distinct from OLD.brand
     and NEW.name is not distinct from OLD.name
     and NEW.reference is not distinct from OLD.reference then
    return NEW;
  end if;

  final_slug := candidate;

  if exists (
    select 1
    from public.watches w
    where w.slug = final_slug
      and w.id <> NEW.id
  ) then
    final_slug := candidate || '-' || left(replace(NEW.id::text, '-', ''), 8);
  end if;

  NEW.slug := final_slug;

  if TG_OP = 'UPDATE' then
    -- Le slug redevient courant (retour à un ancien nom) : il ne doit plus rediriger.
    delete from public.watch_slug_history where old_slug = final_slug;

    if OLD.slug is not null and OLD.slug <> final_slug then
      insert into public.watch_slug_history (old_slug, watch_id)
      values (OLD.slug, NEW.id)
      on conflict (old_slug) do update
        set watch_id = excluded.watch_id,
            changed_at = now();
    end if;
  end if;

  return NEW;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Articles : slug lisible
-- ---------------------------------------------------------------------------------------------

alter table public.articles
  add column if not exists slug text;

create unique index if not exists articles_slug_key on public.articles (slug);

comment on column public.articles.slug is
  'Segment d''URL /blog/<slug>. Posé à la création, conservé si le titre change.';

-- Titre en slug, coupé à un mot entier vers 70 caractères (les titres approchent les 100).
create or replace function public.build_article_slug(p_title text, p_id uuid)
returns text
language plpgsql
immutable
as $$
declare
  s text := public.slugify_watch_part(p_title);
begin
  if length(s) > 70 then
    s := left(s, 71);
    -- Retire le mot coupé ; un mot unique de plus de 70 caractères reste tronqué tel quel.
    if position('-' in s) > 0 then
      s := regexp_replace(s, '-[^-]*$', '');
    end if;
    s := trim(both '-' from s);
  end if;

  return coalesce(nullif(s, ''), p_id::text);
end;
$$;

create or replace function public.articles_set_slug()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  candidate text;
begin
  if TG_OP = 'UPDATE' and NEW.slug is not distinct from OLD.slug and NEW.slug is not null then
    return NEW;
  end if;

  if nullif(trim(coalesce(NEW.slug, '')), '') is null then
    candidate := public.build_article_slug(NEW.title, NEW.id);
  else
    -- Slug fourni à la main : on le normalise, sans le recalculer depuis le titre.
    candidate := coalesce(nullif(public.slugify_watch_part(NEW.slug), ''),
                          public.build_article_slug(NEW.title, NEW.id));
  end if;

  if exists (
    select 1
    from public.articles a
    where a.slug = candidate
      and a.id <> NEW.id
  ) then
    candidate := candidate || '-' || left(replace(NEW.id::text, '-', ''), 8);
  end if;

  NEW.slug := candidate;
  return NEW;
end;
$$;

drop trigger if exists articles_set_slug_trigger on public.articles;
create trigger articles_set_slug_trigger
  before insert or update of slug on public.articles
  for each row execute function public.articles_set_slug();

-- Reprise des articles existants, du plus ancien au plus récent : en cas de titres identiques,
-- le premier publié garde le slug sans suffixe.
do $$
declare
  r record;
begin
  for r in select id from public.articles where slug is null order by created_at, id loop
    update public.articles set slug = null where id = r.id;
  end loop;
end;
$$;

-- Fonctions de trigger : pas d'appel direct par `/rest/v1/rpc/…`.
revoke execute on function public.watches_set_slug() from public, anon, authenticated;
revoke execute on function public.articles_set_slug() from public, anon, authenticated;
alter function public.build_watch_slug(text, text, text, uuid) set search_path = public;
alter function public.build_article_slug(text, uuid) set search_path = public;

notify pgrst, 'reload schema';
