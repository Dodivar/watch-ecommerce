-- Sauvage Watches — bascule des montres « [EN ARRIVAGE] » vers le statut « Arrive bientôt »
--
-- Avant `features.incomingWatches`, l'arrivage se signalait dans le nom (« [EN ARRIVAGE] Rolex… »)
-- et la montre restait achetable. Ce script coche `is_incoming` et retire le préfixe du nom :
-- le badge « Arrive bientôt » prend le relais.
--
-- À exécuter dans le SQL Editor du projet Supabase « Sauvage watches », APRÈS :
--   1. la migration `supabase/migrations/20261101120000_watch_incoming.sql` ;
--   2. la mise en production du code qui gère l'arrivage. Avant, le site en ligne ignore
--      `is_incoming` : les montres renommées perdraient leur mention sans gagner le badge,
--      et resteraient achetables.
--
-- ⚠ Le slug change. Le trigger `watches_set_slug` le recalcule dès que le nom change :
--   rolex-en-arrivage-rolex-submariner-… → rolex-rolex-submariner-…
-- Les anciennes URL sont redirigées en 301 par `seo.legacyRedirects.static` du manifest
-- Sauvage (`sites/sauvage-watches/site.config.js`), prises en compte au build Vercel. La
-- prévisualisation (étape 1) donne les nouveaux slugs : ils doivent correspondre à ces
-- redirections. Une montre ajoutée depuis n'y figure pas — ajouter sa paire au manifest.
--
-- Rejouable : une montre déjà traitée n'a plus le préfixe et n'est plus sélectionnée.

-- ------------------------------------------------------------- 1. Prévisualisation
-- Lecture seule. Vérifier la liste, les nouveaux noms et l'absence de collision.

select
  id,
  name as nom_actuel,
  regexp_replace(
    regexp_replace(name, '^\s*\[\s*EN ARRIVAGE\s*\]\s*', '', 'i'),
    '[\s-]+$', ''
  ) as nouveau_nom,
  slug as slug_actuel,
  public.build_watch_slug(
    brand,
    regexp_replace(
      regexp_replace(name, '^\s*\[\s*EN ARRIVAGE\s*\]\s*', '', 'i'),
      '[\s-]+$', ''
    ),
    reference,
    id
  ) as nouveau_slug,
  is_available,
  is_sold
from public.watches
where name ~* '^\s*\[\s*EN ARRIVAGE\s*\]'
order by name;

-- ------------------------------------------------------------- 2. Application
-- Une seule transaction : tout passe ou rien. Les montres vendues sont laissées telles
-- quelles (une vente l'emporte sur l'arrivage, inutile de les cocher).

begin;

update public.watches
set
  is_incoming = true,
  name = regexp_replace(
    regexp_replace(name, '^\s*\[\s*EN ARRIVAGE\s*\]\s*', '', 'i'),
    '[\s-]+$', ''
  )
where name ~* '^\s*\[\s*EN ARRIVAGE\s*\]'
  and is_sold = false
returning id, name, slug, is_incoming;

commit;

-- ------------------------------------------------------------- 3. Contrôle
-- Doit renvoyer les montres traitées, cochées, sans préfixe ; et aucune ligne restante
-- avec « [EN ARRIVAGE] » hormis d'éventuelles montres vendues.

select id, name, slug, is_incoming
from public.watches
where is_incoming = true or name ~* '\[\s*EN ARRIVAGE\s*\]'
order by name;
