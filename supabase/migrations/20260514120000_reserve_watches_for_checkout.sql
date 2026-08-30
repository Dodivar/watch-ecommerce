-- Atomically reserve multiple watches for Stripe Checkout (one session, multiple line items).
-- Requires existing columns on public.watches: is_available, is_sold, checkout_reserved_until, updated_at.

CREATE OR REPLACE FUNCTION public.reserve_watches_for_checkout(
  p_watch_ids uuid[],
  p_reserve_minutes int
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  until_ts timestamptz;
  expected int;
  updated_count int;
BEGIN
  IF p_watch_ids IS NULL OR cardinality(p_watch_ids) = 0 THEN
    RETURN false;
  END IF;

  SELECT count(DISTINCT x) INTO expected FROM unnest(p_watch_ids) AS x;

  IF p_reserve_minutes IS NULL OR p_reserve_minutes < 1 THEN
    RETURN false;
  END IF;

  until_ts := now() + make_interval(mins => p_reserve_minutes);

  WITH distinct_ids AS (
    SELECT DISTINCT unnest(p_watch_ids)::uuid AS id
  ),
  eligible AS (
    SELECT w.id
    FROM public.watches w
    INNER JOIN distinct_ids d ON d.id = w.id
    WHERE COALESCE(w.is_available, false) = true
      AND COALESCE(w.is_sold, false) = false
      AND (w.checkout_reserved_until IS NULL OR w.checkout_reserved_until < now())
    FOR UPDATE OF w
  ),
  upd AS (
    UPDATE public.watches w
    SET
      checkout_reserved_until = until_ts,
      updated_at = now()
    FROM eligible e
    WHERE w.id = e.id
    RETURNING w.id
  )
  SELECT count(*)::int INTO updated_count FROM upd;

  RETURN updated_count = expected;
END;
$$;

COMMENT ON FUNCTION public.reserve_watches_for_checkout(uuid[], int) IS
  'Reserves all given watches until until_ts, or reserves none (all-or-nothing). Returns true when every distinct id was updated.';
