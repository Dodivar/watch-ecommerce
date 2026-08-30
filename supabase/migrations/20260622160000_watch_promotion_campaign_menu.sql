-- Slug URL, visibilité menu et lien carrousel pour campagnes promotionnelles.

ALTER TABLE watch_promotion_campaigns
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS show_in_menu boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS menu_label text,
  ADD COLUMN IF NOT EXISTS menu_order smallint NOT NULL DEFAULT 0;

UPDATE watch_promotion_campaigns
SET slug = trim(both '-' from regexp_replace(
  regexp_replace(lower(trim(coalesce(name, 'evenement'))), '[^a-z0-9]+', '-', 'g'),
  '-+', '-', 'g'
))
WHERE slug IS NULL OR slug = '';

UPDATE watch_promotion_campaigns c
SET slug = c.slug || '-' || left(replace(c.id::text, '-', ''), 8)
WHERE c.slug IN (
  SELECT slug
  FROM watch_promotion_campaigns
  GROUP BY site_id, slug
  HAVING count(*) > 1
);

ALTER TABLE watch_promotion_campaigns
  ALTER COLUMN slug SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_watch_promotion_campaigns_site_slug
  ON watch_promotion_campaigns (site_id, slug);

ALTER TABLE home_carousel_slides
  ADD COLUMN IF NOT EXISTS promotion_campaign_id uuid
    REFERENCES watch_promotion_campaigns (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS home_carousel_slides_promotion_campaign_id_idx
  ON home_carousel_slides (promotion_campaign_id)
  WHERE promotion_campaign_id IS NOT NULL;

COMMENT ON COLUMN watch_promotion_campaigns.slug IS
  'Identifiant URL public (?event=slug) — unique par site.';

COMMENT ON COLUMN watch_promotion_campaigns.show_in_menu IS
  'Afficher dans la colonne Promotions du mega-menu lorsque la campagne est active.';

COMMENT ON COLUMN home_carousel_slides.promotion_campaign_id IS
  'Redirection collection filtrée par événement promotionnel actif.';
