-- Montres « en arrivage » (`features.incomingWatches`)
--
-- Une montre annoncée mais pas encore reçue reste publiée (`is_available`) et visible avec son
-- prix, mais ne peut pas être achetée en ligne. Ce n'est ni une rupture (`stock_quantity`), ni un
-- retrait (`is_available = false`, qui la masquerait du catalogue) : d'où une colonne à part,
-- décochée à la main par l'admin à la réception.
--
-- Le blocage de l'achat est porté par le backend (`backend/orders/reservation.js` et
-- `POST /api/orders`), pas par `reserve_watches_for_order` / `create_draft_order`, dont la
-- définition n'est pas versionnée dans ce dépôt.
--
-- À appliquer uniquement sur les projets des sites qui activent `features.incomingWatches` :
-- ailleurs, le socle ne lit ni n'écrit cette colonne. Idempotent.
--
-- Les policies RLS existantes sur `watches` couvrent la colonne (lecture publique, écriture
-- admin) : rien à ajouter.

alter table public.watches
  add column if not exists is_incoming boolean not null default false;

comment on column public.watches.is_incoming is
  'Montre annoncée, pas encore reçue : visible mais non achetable (features.incomingWatches).';
