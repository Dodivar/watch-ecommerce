-- fulfill_order_payment: renvoie true UNIQUEMENT lors de la transition réelle
-- (draft|pending_payment -> paid). Ceci permet de gater les effets de bord
-- non-idempotents (décrément de stock, comptage promo, email) côté backend de
-- façon atomique, que l'appel vienne du webhook Stripe ou de la réconciliation
-- au retour /commande/succes. La concurrence est résolue par le verrou de ligne
-- sur l'UPDATE de `orders` (ROW_COUNT) : un seul appelant obtient true.

CREATE OR REPLACE FUNCTION fulfill_order_payment(p_order_id uuid, p_stripe_payment_intent_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now timestamptz := now();
  v_updated integer;
BEGIN
  IF p_order_id IS NULL THEN
    RETURN false;
  END IF;

  UPDATE orders
  SET
    status = 'paid',
    stripe_payment_intent_id = COALESCE(p_stripe_payment_intent_id, stripe_payment_intent_id),
    paid_at = v_now,
    updated_at = v_now
  WHERE id = p_order_id
    AND status IN ('draft', 'pending_payment');

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  -- Déjà payée (ou introuvable / non payable) : aucune transition effectuée.
  IF v_updated = 0 THEN
    RETURN false;
  END IF;

  UPDATE watches w
  SET
    is_sold = true,
    is_available = false,
    sale_date = v_now,
    checkout_reserved_until = NULL,
    updated_at = v_now
  FROM order_lines ol
  WHERE ol.order_id = p_order_id
    AND ol.watch_id = w.id
    AND w.is_sold = false;

  RETURN true;
END;
$$;
