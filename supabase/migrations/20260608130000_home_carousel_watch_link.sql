-- Lien optionnel vers une fiche montre (prioritaire sur brand_name côté front).

ALTER TABLE public.home_carousel_slides
  ADD COLUMN IF NOT EXISTS watch_id uuid REFERENCES public.watches (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS home_carousel_slides_watch_id_idx
  ON public.home_carousel_slides (watch_id)
  WHERE watch_id IS NOT NULL;
