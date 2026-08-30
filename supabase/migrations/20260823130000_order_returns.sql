-- Retours et remboursements : suivi du droit de rétractation (14 jours) et
-- traçabilité du remboursement.
--
-- Aucun remboursement n'est déclenché depuis l'admin : l'opération se fait
-- manuellement depuis le dashboard Stripe, puis est enregistrée ici
-- (montant, identifiant `re_…`, date) pour garder une trace côté commande.

ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at timestamptz;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS return_status text NOT NULL DEFAULT 'none';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS return_requested_at timestamptz;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS return_notes text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_amount_cents integer;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refunded_at timestamptz;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_refund_id text;

COMMENT ON COLUMN orders.delivered_at IS
  'Date de réception par le client : point de départ du délai de rétractation de 14 jours (art. L221-18). Vide = délai calculé à titre indicatif depuis paid_at.';
COMMENT ON COLUMN orders.stripe_refund_id IS
  'Identifiant du remboursement Stripe (re_…) saisi après opération manuelle dans le dashboard.';

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_return_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_return_status_check
  CHECK (return_status IN ('none', 'requested', 'received', 'refunded', 'rejected'));

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_refund_amount_nonneg;
ALTER TABLE orders ADD CONSTRAINT orders_refund_amount_nonneg
  CHECK (refund_amount_cents IS NULL OR refund_amount_cents >= 0);

-- Les retours sont une minorité des commandes : index partiel pour la liste
-- admin filtrée sur les dossiers en cours.
CREATE INDEX IF NOT EXISTS orders_site_return_status_idx
  ON orders (site_id, return_status)
  WHERE return_status <> 'none';

-- Aucune policy à ajouter : `orders_admin_update_fulfillment`
-- (20260525120000_admin_phase1.sql) couvre déjà l'UPDATE des commandes par un
-- admin authentifié, colonnes comprises.
