-- Campagnes promotionnelles montres (groupes d'événements avec sélection bulk).

CREATE TABLE IF NOT EXISTS watch_promotion_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id text NOT NULL,
  name text NOT NULL,
  description text,
  default_discount_percent smallint NOT NULL
    CHECK (default_discount_percent >= 1 AND default_discount_percent <= 99),
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'scheduled', 'active', 'ended', 'cancelled')),
  applied_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT watch_promotion_campaigns_ends_after_start
    CHECK (ends_at IS NULL OR ends_at > starts_at)
);

CREATE TABLE IF NOT EXISTS watch_promotion_campaign_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES watch_promotion_campaigns(id) ON DELETE CASCADE,
  watch_id uuid NOT NULL REFERENCES watches(id) ON DELETE CASCADE,
  discount_percent smallint
    CHECK (discount_percent IS NULL OR (discount_percent >= 1 AND discount_percent <= 99)),
  promotion_price numeric
    CHECK (promotion_price IS NULL OR promotion_price > 0),
  previous_promotion_price numeric,
  previous_discount_percent smallint,
  UNIQUE (campaign_id, watch_id)
);

CREATE INDEX IF NOT EXISTS idx_watch_promotion_campaigns_site_status
  ON watch_promotion_campaigns (site_id, status);

CREATE INDEX IF NOT EXISTS idx_watch_promotion_campaign_items_campaign
  ON watch_promotion_campaign_items (campaign_id);

CREATE INDEX IF NOT EXISTS idx_watch_promotion_campaign_items_watch
  ON watch_promotion_campaign_items (watch_id);

COMMENT ON TABLE watch_promotion_campaigns IS
  'Événements promotionnels groupés (ex. soldes Noël) avec dates et remise par défaut.';

COMMENT ON TABLE watch_promotion_campaign_items IS
  'Montres incluses dans une campagne ; snapshot promo précédente à l''application.';

-- RLS : voir aussi 20260622150000_watch_promotion_campaigns_rls.sql si appliqué séparément.
ALTER TABLE watch_promotion_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_promotion_campaign_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS watch_promotion_campaigns_admin_all ON watch_promotion_campaigns;
CREATE POLICY watch_promotion_campaigns_admin_all ON watch_promotion_campaigns
  FOR ALL TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

DROP POLICY IF EXISTS watch_promotion_campaign_items_admin_all ON watch_promotion_campaign_items;
CREATE POLICY watch_promotion_campaign_items_admin_all ON watch_promotion_campaign_items
  FOR ALL TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

DROP POLICY IF EXISTS watch_promotion_campaigns_public_read ON watch_promotion_campaigns;
CREATE POLICY watch_promotion_campaigns_public_read ON watch_promotion_campaigns
  FOR SELECT TO anon, authenticated
  USING (
    status IN ('scheduled', 'active')
    AND starts_at <= now()
    AND (ends_at IS NULL OR ends_at > now())
  );

DROP POLICY IF EXISTS watch_promotion_campaign_items_public_read ON watch_promotion_campaign_items;
CREATE POLICY watch_promotion_campaign_items_public_read ON watch_promotion_campaign_items
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM watch_promotion_campaigns c
      WHERE c.id = watch_promotion_campaign_items.campaign_id
        AND c.status IN ('scheduled', 'active')
        AND c.starts_at <= now()
        AND (c.ends_at IS NULL OR c.ends_at > now())
    )
  );
