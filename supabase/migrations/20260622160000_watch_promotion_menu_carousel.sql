-- Menu dynamique + filtre collection par événement (?event=slug) + lien carrousel d'accueil.
-- Prérequis : 20260622140000_watch_promotion_campaigns.sql, 20260608120000_home_carousel.sql

ALTER TABLE watch_promotion_campaigns
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS show_in_menu boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS menu_label text,
  ADD COLUMN IF NOT EXISTS menu_order integer NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS watch_promotion_campaigns_site_slug_idx
  ON watch_promotion_campaigns (site_id, slug)
  WHERE slug IS NOT NULL;

ALTER TABLE home_carousel_slides
  ADD COLUMN IF NOT EXISTS promotion_campaign_id uuid
  REFERENCES watch_promotion_campaigns (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS home_carousel_slides_promotion_campaign_id_idx
  ON home_carousel_slides (promotion_campaign_id)
  WHERE promotion_campaign_id IS NOT NULL;

-- Lecture publique des campagnes (filtrage actif côté application).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'watch_promotion_campaigns'
      AND policyname = 'Public read watch promotion campaigns'
  ) THEN
    CREATE POLICY "Public read watch promotion campaigns"
      ON watch_promotion_campaigns
      FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'watch_promotion_campaign_items'
      AND policyname = 'Public read watch promotion campaign items'
  ) THEN
    CREATE POLICY "Public read watch promotion campaign items"
      ON watch_promotion_campaign_items
      FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;
END $$;
