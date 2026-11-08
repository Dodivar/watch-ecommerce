-- Réécriture des slugs des montres existantes (`rolex-rolex-…` → `rolex-…`).
--
-- Prérequis :
--   1. `20261108120000_slugs_dedup_history_articles.sql` appliqué (nouveau `build_watch_slug`,
--      table `watch_slug_history`).
--   2. Le code qui lit `watch_slug_history` déployé **en production** (`api/render-page.js` et
--      `resolveWatchIdBySlug`). Appliqué avant, chaque lien `/montre/<ancien-slug>` répondrait 404.
--
-- Chaque ancien slug est conservé dans `watch_slug_history` par le trigger : il redirige ensuite
-- en 301 vers le nouveau.
--
-- Le trigger ne se déclenche que sur `UPDATE OF brand, name, reference`, et ne recalcule rien si
-- le slug et ces colonnes sont inchangés : d'où `slug = null, name = name`.
--
-- Montres traitées une à une, la plus ancienne d'abord : quand deux montres donnent le même slug,
-- la première créée le garde sans suffixe.
--
-- Rejouable : une montre déjà à jour garde son slug et n'ajoute rien à l'historique.

do $$
declare
  r record;
begin
  for r in select id from public.watches order by created_at, id loop
    update public.watches set slug = null, name = name where id = r.id;
  end loop;
end;
$$;
