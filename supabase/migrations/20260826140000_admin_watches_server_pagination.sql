-- Catalogue admin : pagination serveur et réordonnancement à coût constant.
--
-- La liste admin chargeait tout le catalogue puis paginait en mémoire. Deux conséquences
-- au-delà de quelques centaines de références :
--   * PostgREST tronquait silencieusement la réponse à `max_rows` (l'admin affichait un
--     catalogue amputé sans le dire) ;
--   * un glisser-déposer réécrivait le `display_order` de toutes les montres non vendues,
--     à raison d'une requête PATCH par montre.
--
-- Ce fichier fournit ce qui manquait côté base pour paginer, filtrer et réordonner sans
-- jamais charger le catalogue entier.

-- Tri par défaut (display_order desc) : `id` départage les valeurs égales. Sans cette clé
-- stable, une même montre peut apparaître sur deux pages consécutives — ou sur aucune.
create index if not exists watches_display_order_id_idx
  on public.watches (display_order desc nulls last, id);

-- Les autres colonnes triables depuis l'en-tête du tableau.
create index if not exists watches_created_at_id_idx on public.watches (created_at desc, id);
create index if not exists watches_price_id_idx on public.watches (price, id);
create index if not exists watches_brand_id_idx on public.watches (brand, id);
create index if not exists watches_model_id_idx on public.watches (model, id);

-- Volontairement pas d'index trigramme sur le champ de recherche admin : à l'échelle
-- visée (quelques milliers de références) le balayage séquentiel d'un ILIKE coûte
-- quelques millisecondes, et pg_trgm ajouterait une dépendance d'extension plus une
-- surcharge en écriture. À reconsidérer si la recherche devient perceptiblement lente.

-- ---------------------------------------------------------------------------
-- Liste des marques du filtre admin.
--
-- PostgREST ne sait pas faire de DISTINCT : sans cette fonction, le menu déroulant ne
-- proposerait que les marques présentes sur la page affichée. Contrairement à
-- `getAvailableCatalogBrands()` (vitrine), on inclut ici les montres hors stock et vendues.
-- ---------------------------------------------------------------------------
create or replace function public.admin_watch_brands()
returns table (brand text)
language sql
stable
security invoker
set search_path = public
as $$
  select distinct w.brand
  from public.watches w
  where w.brand is not null and w.brand <> ''
  order by 1
$$;

grant execute on function public.admin_watch_brands() to authenticated;

-- ---------------------------------------------------------------------------
-- Réordonnancement : un seul aller-retour, quelle que soit la taille du lot.
--
-- SECURITY INVOKER : c'est la policy RLS « Admins can update watches » qui autorise ou non
-- l'écriture. Un appelant non admin ne met à jour aucune ligne, ce que le contrôle de
-- `row_count` transforme en erreur explicite plutôt qu'en succès silencieux.
-- ---------------------------------------------------------------------------
create or replace function public.admin_reorder_watches(p_orders jsonb)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_expected integer;
  v_updated integer;
begin
  if p_orders is null or jsonb_typeof(p_orders) <> 'array' then
    raise exception 'admin_reorder_watches attend un tableau JSON' using errcode = '22023';
  end if;

  v_expected := jsonb_array_length(p_orders);
  if v_expected = 0 then
    return 0;
  end if;

  with input as (
    select * from jsonb_to_recordset(p_orders) as x(id uuid, display_order integer)
  )
  update public.watches w
     set display_order = input.display_order,
         updated_at = now()
    from input
   where w.id = input.id;

  get diagnostics v_updated = row_count;

  if v_updated <> v_expected then
    raise exception 'Réordonnancement refusé : % montre(s) mises à jour sur %', v_updated, v_expected
      using errcode = '42501';
  end if;

  return v_updated;
end
$$;

grant execute on function public.admin_reorder_watches(jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- « Mettre en tête » / « mettre en fin » : la seule opération de repositionnement qui
-- garde du sens sur un catalogue de plusieurs milliers de références, où faire glisser une
-- ligne de la page 40 vers la page 1 est impossible. Une ligne touchée, un aller-retour.
-- ---------------------------------------------------------------------------
create or replace function public.admin_move_watch_to_catalog_edge(p_watch_id uuid, p_edge text)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_order integer;
begin
  if p_edge not in ('top', 'bottom') then
    raise exception 'Position inconnue : %', p_edge using errcode = '22023';
  end if;

  -- Les montres vendues sortent du classement (display_order null) : pas de repositionnement.
  if exists (select 1 from public.watches where id = p_watch_id and is_sold is true) then
    raise exception 'Une montre vendue ne peut pas être repositionnée' using errcode = '22023';
  end if;

  if p_edge = 'top' then
    select coalesce(max(display_order), 0) + 1 into v_order
      from public.watches where is_sold is distinct from true;
  else
    select coalesce(min(display_order), 0) - 1 into v_order
      from public.watches where is_sold is distinct from true;
  end if;

  update public.watches
     set display_order = v_order,
         updated_at = now()
   where id = p_watch_id;

  if not found then
    raise exception 'Montre introuvable ou droits insuffisants' using errcode = '42501';
  end if;

  return v_order;
end
$$;

grant execute on function public.admin_move_watch_to_catalog_edge(uuid, text) to authenticated;
