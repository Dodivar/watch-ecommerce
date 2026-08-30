alter table public.watch_details
  add column if not exists bracelet_materials text[] not null default '{}'::text[];

-- Backfill depuis l'ancienne colonne scalaire
update public.watch_details
set bracelet_materials = array[bracelet_material]
where bracelet_material is not null
  and bracelet_material <> ''
  and (bracelet_materials is null or bracelet_materials = '{}'::text[]);
