-- RLS admin pour campagnes promotionnelles montres.
-- Prérequis : is_admin_user() (migration 20260525120000_admin_phase1.sql).

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

-- Lecture publique des campagnes actives / programmées (prix effectif catalogue + checkout).
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
