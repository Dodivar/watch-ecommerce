-- Garde-fous sur les buckets d'images publics.
--
-- Les photos étaient uploadées telles quelles (jusqu'à 12 Mo pièce) puis servies
-- sans redimensionnement : c'est le poste principal de « cached egress » du
-- projet. Le code compresse désormais avant envoi (1600 px max, WebP q80), ces
-- limites empêchent qu'un contournement — import en masse, upload depuis un
-- autre outil — réintroduise des originaux lourds.
--
-- 2 Mo laisse une marge confortable : une image compressée par l'admin pèse
-- environ 100 à 200 Ko.

UPDATE storage.buckets
SET
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY[
    'image/webp',
    'image/jpeg',
    'image/png',
    'image/avif'
  ]::text[]
WHERE id IN ('watch-images', 'home-carousel');
