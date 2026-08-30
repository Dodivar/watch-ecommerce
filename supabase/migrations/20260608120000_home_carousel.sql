-- Carrousel d'accueil : slides stockées en base + images dans Supabase Storage (bucket home-carousel).
-- Appliquer sur le projet Supabase de chaque client qui active features.homeCarousel.

-- Table des slides
CREATE TABLE IF NOT EXISTS public.home_carousel_slides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id text NOT NULL,
  image_path text NOT NULL,
  image_url text,
  alt_text text,
  brand_name text,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS home_carousel_slides_site_order_idx
  ON public.home_carousel_slides (site_id, display_order ASC);

ALTER TABLE public.home_carousel_slides ENABLE ROW LEVEL SECURITY;

-- Lecture publique (front accueil)
DROP POLICY IF EXISTS "Public read home carousel slides" ON public.home_carousel_slides;
CREATE POLICY "Public read home carousel slides"
  ON public.home_carousel_slides
  FOR SELECT
  USING (true);

-- Écriture réservée aux admins authentifiés (whitelist admin_users)
DROP POLICY IF EXISTS "Admin insert home carousel slides" ON public.home_carousel_slides;
CREATE POLICY "Admin insert home carousel slides"
  ON public.home_carousel_slides
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE lower(au.email) = lower((auth.jwt() ->> 'email'))
    )
  );

DROP POLICY IF EXISTS "Admin update home carousel slides" ON public.home_carousel_slides;
CREATE POLICY "Admin update home carousel slides"
  ON public.home_carousel_slides
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE lower(au.email) = lower((auth.jwt() ->> 'email'))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE lower(au.email) = lower((auth.jwt() ->> 'email'))
    )
  );

DROP POLICY IF EXISTS "Admin delete home carousel slides" ON public.home_carousel_slides;
CREATE POLICY "Admin delete home carousel slides"
  ON public.home_carousel_slides
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE lower(au.email) = lower((auth.jwt() ->> 'email'))
    )
  );

-- Bucket Storage (images full-width)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'home-carousel',
  'home-carousel',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Lecture publique des images
DROP POLICY IF EXISTS "Public read home carousel images" ON storage.objects;
CREATE POLICY "Public read home carousel images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'home-carousel');

-- Upload / mise à jour / suppression par les admins
DROP POLICY IF EXISTS "Admin insert home carousel images" ON storage.objects;
CREATE POLICY "Admin insert home carousel images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'home-carousel'
    AND EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE lower(au.email) = lower((auth.jwt() ->> 'email'))
    )
  );

DROP POLICY IF EXISTS "Admin update home carousel images" ON storage.objects;
CREATE POLICY "Admin update home carousel images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'home-carousel'
    AND EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE lower(au.email) = lower((auth.jwt() ->> 'email'))
    )
  )
  WITH CHECK (
    bucket_id = 'home-carousel'
    AND EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE lower(au.email) = lower((auth.jwt() ->> 'email'))
    )
  );

DROP POLICY IF EXISTS "Admin delete home carousel images" ON storage.objects;
CREATE POLICY "Admin delete home carousel images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'home-carousel'
    AND EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE lower(au.email) = lower((auth.jwt() ->> 'email'))
    )
  );
