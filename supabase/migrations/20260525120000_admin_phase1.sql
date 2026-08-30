-- Admin Phase 1 : leads, stock retail, fulfillment commandes, contenu site, marques, sélections accueil
-- Appliquer sur chaque projet Supabase client avant d'utiliser les nouvelles fonctionnalités admin.

ALTER TABLE watches ADD COLUMN IF NOT EXISTS stock_quantity integer NOT NULL DEFAULT 1;
ALTER TABLE watches DROP CONSTRAINT IF EXISTS watches_stock_quantity_nonneg;
ALTER TABLE watches ADD CONSTRAINT watches_stock_quantity_nonneg CHECK (stock_quantity >= 0);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS fulfillment_status text NOT NULL DEFAULT 'pending';
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_fulfillment_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_fulfillment_status_check
  CHECK (fulfillment_status IN ('pending', 'preparing', 'shipped', 'ready_for_pickup', 'completed'));

CREATE TABLE IF NOT EXISTS lead_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id text NOT NULL,
  type text NOT NULL CHECK (type IN ('contact', 'appointment', 'estimation', 'search')),
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'archived')),
  customer_name text,
  customer_email text,
  watch_id uuid REFERENCES watches(id) ON DELETE SET NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lead_submissions_site_id_created_at_idx
  ON lead_submissions (site_id, created_at DESC);
CREATE INDEX IF NOT EXISTS lead_submissions_site_id_type_status_idx
  ON lead_submissions (site_id, type, status);

CREATE TABLE IF NOT EXISTS site_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id text NOT NULL,
  content_key text NOT NULL,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (site_id, content_key)
);

CREATE TABLE IF NOT EXISTS catalog_brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id text NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  logo_url text,
  display_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (site_id, slug)
);

CREATE INDEX IF NOT EXISTS catalog_brands_site_id_order_idx
  ON catalog_brands (site_id, display_order DESC);

CREATE TABLE IF NOT EXISTS home_featured_watches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id text NOT NULL,
  watch_id uuid NOT NULL REFERENCES watches(id) ON DELETE CASCADE,
  context text NOT NULL CHECK (context IN ('nouvelles', 'selection')),
  selection_key text,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (site_id, context, watch_id, selection_key)
);

CREATE INDEX IF NOT EXISTS home_featured_watches_site_context_order_idx
  ON home_featured_watches (site_id, context, display_order DESC);

CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users au
    WHERE au.email = (auth.jwt() ->> 'email')
  );
$$;

ALTER TABLE lead_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE home_featured_watches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS lead_submissions_admin_all ON lead_submissions;
CREATE POLICY lead_submissions_admin_all ON lead_submissions
  FOR ALL TO authenticated USING (is_admin_user()) WITH CHECK (is_admin_user());

DROP POLICY IF EXISTS lead_submissions_service_insert ON lead_submissions;
CREATE POLICY lead_submissions_service_insert ON lead_submissions
  FOR INSERT TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS site_content_admin_all ON site_content;
CREATE POLICY site_content_admin_all ON site_content
  FOR ALL TO authenticated USING (is_admin_user()) WITH CHECK (is_admin_user());

DROP POLICY IF EXISTS site_content_public_read ON site_content;
CREATE POLICY site_content_public_read ON site_content
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS catalog_brands_admin_all ON catalog_brands;
CREATE POLICY catalog_brands_admin_all ON catalog_brands
  FOR ALL TO authenticated USING (is_admin_user()) WITH CHECK (is_admin_user());

DROP POLICY IF EXISTS catalog_brands_public_read ON catalog_brands;
CREATE POLICY catalog_brands_public_read ON catalog_brands
  FOR SELECT TO anon, authenticated USING (is_visible = true);

DROP POLICY IF EXISTS home_featured_admin_all ON home_featured_watches;
CREATE POLICY home_featured_admin_all ON home_featured_watches
  FOR ALL TO authenticated USING (is_admin_user()) WITH CHECK (is_admin_user());

DROP POLICY IF EXISTS home_featured_public_read ON home_featured_watches;
CREATE POLICY home_featured_public_read ON home_featured_watches
  FOR SELECT TO anon, authenticated USING (true);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS orders_admin_select ON orders;
CREATE POLICY orders_admin_select ON orders
  FOR SELECT TO authenticated USING (is_admin_user());

DROP POLICY IF EXISTS orders_admin_update_fulfillment ON orders;
CREATE POLICY orders_admin_update_fulfillment ON orders
  FOR UPDATE TO authenticated USING (is_admin_user()) WITH CHECK (is_admin_user());

ALTER TABLE order_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_shipping ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS order_lines_admin_select ON order_lines;
CREATE POLICY order_lines_admin_select ON order_lines
  FOR SELECT TO authenticated USING (is_admin_user());

DROP POLICY IF EXISTS order_shipping_admin_select ON order_shipping;
CREATE POLICY order_shipping_admin_select ON order_shipping
  FOR SELECT TO authenticated USING (is_admin_user());

ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS promo_codes_admin_all ON promo_codes;
CREATE POLICY promo_codes_admin_all ON promo_codes
  FOR ALL TO authenticated USING (is_admin_user()) WITH CHECK (is_admin_user());
