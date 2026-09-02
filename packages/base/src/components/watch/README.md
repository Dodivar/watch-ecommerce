# Composants montres

Vue dédiée à la collection publique.

## Fichiers

- `WatchesCollection.vue` : liste publique des montres (`/collection` et
 `/collection/marque/:brandSlug`), filtres, tri, hero marque optionnel ; props
 `showFilters`, `showSort`, `showContactSection`, `showBrandHero` pour adapter l’UI.
- `WatchCollectionLayout.vue` : disposition du catalogue selon
 `collection.displayMode` du manifest (`grid`, `list`, `showcase`, `compact`).
 Rend **et** le squelette **et** la grille depuis le même `containerClass` :
 c'est ce qui les empêche de diverger. Tout ce qui distingue un format d'un
 autre vit dans `constants/watchCollectionLayouts.js`.
- `WatchCard.vue` : carte réutilisable (visuel, prix, CTA) utilisée partout où
une montre est affichée. `imageAspectClass` et `density` l'adaptent aux formats
showcase et compact.
- `WatchListRow.vue` : ligne pleine largeur du format `list` — la carte étant
verticale et son titre tronqué, aucune classe ne suffisait à la coucher.
- `WatchDetail.vue` : fiche détaillée (galerie, spécifications, articles liés).

## Composants Skeleton

Des composants skeleton sont présents pour afficher un état de chargement pendant que les données sont récupérées :

- `WatchCardSkeleton.vue` : skeleton correspondant à `WatchCard.vue` — il reçoit
  les mêmes `imageAspectClass` et `density` que la carte
- `WatchListRowSkeleton.vue` : skeleton correspondant à `WatchListRow.vue`
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