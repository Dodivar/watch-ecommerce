-- Custom checkout: orders, promo, reservations linked to order_id

-- ---------------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id text NOT NULL,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'pending_payment', 'paid', 'cancelled', 'expired')),
  currency text NOT NULL DEFAULT 'EUR',
  subtotal_cents integer NOT NULL DEFAULT 0,
  shipping_cents integer NOT NULL DEFAULT 0,
  discount_cents integer NOT NULL DEFAULT 0,
  total_cents integer NOT NULL DEFAULT 0,
  customer_email text,
  customer_phone text,
  billing_address jsonb,
  shipping_address jsonb,
  stripe_payment_intent_id text,
  access_token_hash text,
  expires_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS orders_site_id_idx ON orders (site_id);
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders (status);
CREATE INDEX IF NOT EXISTS orders_stripe_pi_idx ON orders (stripe_payment_intent_id);

-- ---------------------------------------------------------------------------
-- order_lines
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  watch_id uuid NOT NULL,
  name text NOT NULL,
  reference text,
  unit_price_cents integer NOT NULL,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS order_lines_order_id_idx ON order_lines (order_id);

-- ---------------------------------------------------------------------------
-- order_shipping (one row per order)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_shipping (
  order_id uuid PRIMARY KEY REFERENCES orders (id) ON DELETE CASCADE,
  method_id text NOT NULL,
  method_type text NOT NULL CHECK (method_type IN ('home', 'pickup')),
  method_label text NOT NULL,
  shipping_cents integer NOT NULL DEFAULT 0,
  metadata jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- order_discounts (one promo per order in v1)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_discounts (
  order_id uuid PRIMARY KEY REFERENCES orders (id) ON DELETE CASCADE,
  promo_code text NOT NULL,
  discount_type text NOT NULL,
  discount_cents integer NOT NULL DEFAULT 0,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- promo_codes
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id text,
  code text NOT NULL,
  discount_type text NOT NULL CHECK (discount_type IN ('percent', 'fixed', 'free_shipping')),
  discount_value numeric NOT NULL DEFAULT 0,
  max_discount_cents integer,
  min_subtotal_cents integer NOT NULL DEFAULT 0,
  max_uses integer,
  used_count integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (site_id, code)
);

CREATE INDEX IF NOT EXISTS promo_codes_code_idx ON promo_codes (code);

-- ---------------------------------------------------------------------------
-- promo_redemptions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS promo_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id uuid NOT NULL REFERENCES promo_codes (id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  customer_email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (order_id)
);

-- ---------------------------------------------------------------------------
-- watches: link reservation to order
-- ---------------------------------------------------------------------------
ALTER TABLE watches
  ADD COLUMN IF NOT EXISTS order_id uuid;

CREATE INDEX IF NOT EXISTS watches_order_id_idx ON watches (order_id);

-- ---------------------------------------------------------------------------
-- stripe_processed_events: allow payment_intent event types (table may exist)
-- ---------------------------------------------------------------------------
-- No schema change required if event_type is free text.

-- ---------------------------------------------------------------------------
-- reserve_watches_for_order
-- p_lines: [{"watch_id":"uuid","quantity":1}, ...]
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION reserve_watches_for_order(
  p_order_id uuid,
  p_lines jsonb,
  p_reserve_minutes integer DEFAULT 30
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_until timestamptz;
  elem jsonb;
  v_watch_id uuid;
  v_qty integer;
  v_updated integer;
BEGIN
  IF p_order_id IS NULL OR p_lines IS NULL OR jsonb_array_length(p_lines) = 0 THEN
    RETURN false;
  END IF;

  v_until := now() + make_interval(mins => GREATEST(1, COALESCE(p_reserve_minutes, 30)));

  FOR elem IN SELECT value FROM jsonb_array_elements(p_lines)
  LOOP
    v_watch_id := COALESCE(
      NULLIF(elem->>'watch_id', '')::uuid,
      NULLIF(elem->>'watchId', '')::uuid
    );
    v_qty := GREATEST(1, COALESCE((elem->>'quantity')::integer, 1));

    IF v_watch_id IS NULL THEN
      RETURN false;
    END IF;

    UPDATE watches w
    SET
      checkout_reserved_until = v_until,
      order_id = p_order_id,
      stripe_checkout_session_id = NULL,
      updated_at = now()
    WHERE w.id = v_watch_id
      AND w.is_available = true
      AND w.is_sold = false
      AND (
        w.checkout_reserved_until IS NULL
        OR w.checkout_reserved_until < now()
        OR w.order_id = p_order_id
      );

    GET DIAGNOSTICS v_updated = ROW_COUNT;
    IF v_updated = 0 THEN
      RETURN false;
    END IF;
  END LOOP;

  RETURN true;
END;
$$;

-- ---------------------------------------------------------------------------
-- release_order_reservation
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION release_order_reservation(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_order_id IS NULL THEN
    RETURN;
  END IF;

  UPDATE watches
  SET
    checkout_reserved_until = NULL,
    order_id = NULL,
    stripe_checkout_session_id = NULL,
    updated_at = now()
  WHERE order_id = p_order_id
    AND is_sold = false;
END;
$$;

-- ---------------------------------------------------------------------------
-- fulfill_order_payment (idempotent mark sold)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fulfill_order_payment(p_order_id uuid, p_stripe_payment_intent_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status text;
  v_now timestamptz := now();
BEGIN
  SELECT status INTO v_status FROM orders WHERE id = p_order_id;
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF v_status = 'paid' THEN
    RETURN true;
  END IF;

  UPDATE orders
  SET
    status = 'paid',
    stripe_payment_intent_id = COALESCE(p_stripe_payment_intent_id, stripe_payment_intent_id),
    paid_at = v_now,
    updated_at = v_now
  WHERE id = p_order_id
    AND status IN ('draft', 'pending_payment');

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

-- Code promo exemple (global, tous sites)
INSERT INTO promo_codes (site_id, code, discount_type, discount_value, min_subtotal_cents, max_uses, active)
VALUES (NULL, 'BIENVENUE10', 'percent', 10, 0, 100, true)
ON CONFLICT (site_id, code) DO NOTHING;
