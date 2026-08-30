-- RPC atomique : création commande draft + réservation stock + lignes + quote initiale.
-- Prérequis : tables checkout + reserve_watches_for_order + release_order_reservation.

CREATE OR REPLACE FUNCTION public.create_draft_order(
  p_site_id text,
  p_currency text,
  p_expires_at timestamptz,
  p_reserve_minutes integer,
  p_lines jsonb,
  p_storage_public_prefix text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_order_id uuid;
  v_order orders%ROWTYPE;
  v_subtotal_cents bigint := 0;
  v_missing_count integer;
  v_unavailable record;
  v_reserved boolean;
  v_lines_json jsonb;
BEGIN
  IF p_lines IS NULL OR jsonb_typeof(p_lines) <> 'array' OR jsonb_array_length(p_lines) = 0 THEN
    RAISE EXCEPTION 'Panier vide' USING ERRCODE = 'P0001';
  END IF;

  WITH parsed AS (
    SELECT
      (elem->>'watch_id')::uuid AS watch_id,
      GREATEST(1, LEAST(99, COALESCE((elem->>'quantity')::integer, 1))) AS quantity
    FROM jsonb_array_elements(p_lines) AS elem
  )
  SELECT COUNT(*)::integer INTO v_missing_count
  FROM parsed p
  LEFT JOIN watches w ON w.id = p.watch_id
  WHERE w.id IS NULL;

  IF v_missing_count > 0 THEN
    RAISE EXCEPTION 'Une ou plusieurs montres sont introuvables' USING ERRCODE = 'P0002';
  END IF;

  WITH parsed AS (
    SELECT
      (elem->>'watch_id')::uuid AS watch_id,
      GREATEST(1, LEAST(99, COALESCE((elem->>'quantity')::integer, 1))) AS quantity
    FROM jsonb_array_elements(p_lines) AS elem
  )
  SELECT w.name INTO v_unavailable
  FROM parsed p
  JOIN watches w ON w.id = p.watch_id
  WHERE NOT w.is_available OR w.is_sold
  LIMIT 1;

  IF FOUND THEN
    RAISE EXCEPTION 'La montre « % » n''est plus disponible', v_unavailable.name
      USING ERRCODE = 'P0003';
  END IF;

  WITH parsed AS (
    SELECT
      (elem->>'watch_id')::uuid AS watch_id,
      GREATEST(1, LEAST(99, COALESCE((elem->>'quantity')::integer, 1))) AS quantity
    FROM jsonb_array_elements(p_lines) AS elem
  )
  SELECT w.name INTO v_unavailable
  FROM parsed p
  JOIN watches w ON w.id = p.watch_id
  WHERE w.stock_quantity IS NOT NULL AND p.quantity > w.stock_quantity
  LIMIT 1;

  IF FOUND THEN
    RAISE EXCEPTION 'Stock insuffisant pour « % »', v_unavailable.name
      USING ERRCODE = 'P0004';
  END IF;

  WITH parsed AS (
    SELECT
      (elem->>'watch_id')::uuid AS watch_id,
      GREATEST(1, LEAST(99, COALESCE((elem->>'quantity')::integer, 1))) AS quantity
    FROM jsonb_array_elements(p_lines) AS elem
  )
  SELECT COALESCE(SUM(ROUND(w.price * 100)::bigint * p.quantity), 0)::bigint
  INTO v_subtotal_cents
  FROM parsed p
  JOIN watches w ON w.id = p.watch_id;

  INSERT INTO orders (
    site_id,
    status,
    currency,
    expires_at,
    subtotal_cents,
    shipping_cents,
    discount_cents,
    total_cents
  ) VALUES (
    p_site_id,
    'draft',
    p_currency,
    p_expires_at,
    v_subtotal_cents,
    0,
    0,
    v_subtotal_cents
  )
  RETURNING * INTO v_order;

  v_order_id := v_order.id;

  SELECT public.reserve_watches_for_order(v_order_id, p_lines, p_reserve_minutes)
  INTO v_reserved;

  IF v_reserved IS DISTINCT FROM true THEN
    DELETE FROM orders WHERE id = v_order_id;
    RAISE EXCEPTION 'Une ou plusieurs montres ne sont plus disponibles'
      USING ERRCODE = 'P0005';
  END IF;

  INSERT INTO order_lines (
    order_id,
    watch_id,
    name,
    reference,
    unit_price_cents,
    quantity,
    image_url
  )
  SELECT
    v_order_id,
    w.id,
    w.name,
    w.reference,
    ROUND(w.price * 100)::integer,
    p.quantity,
    COALESCE(
      img.image_url,
      CASE
        WHEN img.image_path IS NOT NULL AND p_storage_public_prefix IS NOT NULL
          THEN p_storage_public_prefix || img.image_path
        ELSE NULL
      END
    )
  FROM (
    SELECT
      (elem->>'watch_id')::uuid AS watch_id,
      GREATEST(1, LEAST(99, COALESCE((elem->>'quantity')::integer, 1))) AS quantity
    FROM jsonb_array_elements(p_lines) AS elem
  ) AS p
  JOIN watches w ON w.id = p.watch_id
  LEFT JOIN LATERAL (
    SELECT wi.image_url, wi.image_path
    FROM watch_images wi
    WHERE wi.watch_id = w.id
    ORDER BY wi.image_order ASC NULLS LAST
    LIMIT 1
  ) AS img ON true;

  SELECT COALESCE(jsonb_agg(to_jsonb(ol) ORDER BY ol.created_at NULLS LAST, ol.id), '[]'::jsonb)
  INTO v_lines_json
  FROM order_lines ol
  WHERE ol.order_id = v_order_id;

  RETURN jsonb_build_object(
    'order', to_jsonb(v_order),
    'lines', v_lines_json,
    'quote', jsonb_build_object(
      'subtotalCents', v_subtotal_cents,
      'shippingCents', 0,
      'discountCents', 0,
      'totalCents', v_subtotal_cents
    )
  );
EXCEPTION
  WHEN OTHERS THEN
    IF v_order_id IS NOT NULL THEN
      BEGIN
        PERFORM public.release_order_reservation(v_order_id);
      EXCEPTION
        WHEN OTHERS THEN
          NULL;
      END;
      DELETE FROM order_lines WHERE order_id = v_order_id;
      DELETE FROM orders WHERE id = v_order_id;
    END IF;
    RAISE;
END;
$function$;

REVOKE ALL ON FUNCTION public.create_draft_order(text, text, timestamptz, integer, jsonb, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_draft_order(text, text, timestamptz, integer, jsonb, text) TO service_role;
