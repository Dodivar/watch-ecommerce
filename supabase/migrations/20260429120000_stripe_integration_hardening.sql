-- Stripe integration hardening: idempotency + checkout reservation
-- Apply via Supabase Dashboard SQL editor or `supabase db push`

-- Processed Stripe webhook event IDs (at-most-once processing before fulfillment side effects)
CREATE TABLE IF NOT EXISTS public.stripe_processed_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.stripe_processed_events IS 'Stripe webhook event IDs already handled (idempotency)';

-- Reservation window while Stripe Checkout is open; cleared on payment or expiry
ALTER TABLE public.watches
  ADD COLUMN IF NOT EXISTS checkout_reserved_until TIMESTAMPTZ;

COMMENT ON COLUMN public.watches.checkout_reserved_until IS 'Watch held for Stripe Checkout until this time (UTC)';

-- Last Stripe Checkout Session ID for support / reconciliation
ALTER TABLE public.watches
  ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT;

COMMENT ON COLUMN public.watches.stripe_checkout_session_id IS 'Active or last Stripe Checkout Session for this watch';

-- Atomic reservation for Stripe Checkout (prevents double-sale during concurrent session creation)
CREATE OR REPLACE FUNCTION public.reserve_watch_for_checkout(
  p_watch_id UUID,
  p_reserve_minutes INT DEFAULT 30
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.watches
  SET
    checkout_reserved_until = NOW() + (GREATEST(p_reserve_minutes, 1) || ' minutes')::INTERVAL,
    updated_at = NOW()
  WHERE id = p_watch_id
    AND is_available = TRUE
    AND is_sold = FALSE
    AND (checkout_reserved_until IS NULL OR checkout_reserved_until < NOW());
  RETURN FOUND;
END;
$$;

COMMENT ON FUNCTION public.reserve_watch_for_checkout(UUID, INT) IS 'Sets checkout_reserved_until if watch is free; returns true if one row was updated';

-- Optional: RLS policies if you use RLS on watches — service role bypasses RLS by default
