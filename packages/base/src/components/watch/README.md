# Composants montres

Vue dédiée à la collection publique.

## Fichiers

- `WatchesCollection.vue` : liste publique des montres (`/collection` et
 `/collection/marque/:brandSlug`), filtres, tri, hero marque optionnel ; props
 `showFilters`, `showSort`, `showContactSection`, `showBrandHero` pour adapter l’UI.
- `WatchCard.vue` : carte réutilisable (visuel, prix, CTA) utilisée partout où
une montre est affichée.
- `WatchDetail.vue` : fiche détaillée (galerie, spécifications, articles liés).

## Composants Skeleton

Des composants skeleton sont présents pour afficher un état de chargement pendant que les données sont récupérées :

- `WatchCardSkeleton.vue` : skeleton correspondant à `WatchCard.vue`
- `WatchDetailSkeleton.vue` : skeleton correspondant à `WatchDetail.vue`

**⚠️ Important** : Si la structure de `WatchCard.vue` ou `WatchDetail.vue` est modifiée (layout, espacements, sections), il est **essentiel** de mettre à jour leurs composants skeleton respectifs pour éviter un désalignement visuel entre l'état de chargement et le contenu réel.

## Sources de données

- S’appuient sur `watchService.js` et `watchArticleService.js` pour récupérer les
données Supabase.
- Affichent les liaisons `watch_articles` afin de lier une montre à un article
de blog pertinent.

## Conseils

- Vérifier que les composants restent SSR-safe (pas d’accès direct à `window`
sans garde).
- Extraire les conversions de prix/états dans des helpers pour éviter la
duplication.