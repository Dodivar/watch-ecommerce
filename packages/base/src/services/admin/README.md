# Services Admin

Fonctions JavaScript manipulant les tables Supabase réservées à
l’administration.

## Modules

- `adminAuthService.js` : gestion de session (login/logout via Supabase Auth,
  vérification des rôles).
- `adminArticleService.js` : CRUD complet sur `articles` + association
  `watch_articles`.
- `adminWatchService.js` : création/mise à jour de montres, upload d’images,
  bascules `is_available` / `is_sold`.
- `adminWatchPromotionService.js` : campagnes promotionnelles (brouillon,
  application, fin anticipée, menu) et lecture transverse des remises —
  `getActiveCampaignMembershipsForAdmin()` / `getCampaignByWatchIdForAdmin()` disent
  d'où vient la remise d'une montre, `getPromotedWatchesForAdmin()` alimente l'écran
  « Montres en promotion ». Le classement d'une remise (campagne, promo directe,
  campagne à venir) vit dans `@/utils/watchPromotionSummary.js`, module pur et testé.

## Consignes

- Toujours valider les entrées avant appel Supabase (ex. trimming des titres,
  contrôle des catégories).
- Logguer les erreurs avec suffisamment de contexte (id concerné, opération).
- Prévoir des retours structurés (`{ success, error }`) pour permettre à l’UI de
  différencier les erreurs métier des erreurs réseau.

