-- Audience cible pour filtres collection / page marque (homme, femme, enfant, unisexe).
-- Appliquer dans Supabase SQL Editor ou via CLI après revue.

ALTER TABLE public.watches
  ADD COLUMN IF NOT EXISTS audience text NOT NULL DEFAULT 'unisexe';

ALTER TABLE public.watches
  DROP CONSTRAINT IF EXISTS watches_audience_check;

ALTER TABLE public.watches
  ADD CONSTRAINT watches_audience_check
  CHECK (audience IN ('homme', 'femme', 'enfant', 'unisexe'));

COMMENT ON COLUMN public.watches.audience IS 'Public cible : homme, femme, enfant, ou unisexe (mixte).';
