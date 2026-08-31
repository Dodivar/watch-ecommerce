import { WATCH_CARD_GRID_PROPS, WATCH_CARD_CATALOG_PROPS } from './watchCardDefaults.js'

/**
 * Dispositions du catalogue, une par valeur de `collection.displayMode`
 * (résolue par `getResolvedCollectionDisplayMode`).
 *
 * Tout ce qui distingue un format d'un autre tient ici — le composant
 * `WatchCollectionLayout.vue` ne fait que lire ce tableau. En particulier
 * `containerClass` sert **à la fois** au squelette et à la grille réelle :
 * c'est ce qui garantit qu'ils ne peuvent pas diverger.
 *
 * `eagerImageCount` doit couvrir la première rangée visible, pas plus : avec
 * les quatre images de la grille, le mode compact (6 colonnes) sous-chargeait
 * et le mode showcase préchargeait quatre grands visuels pour rien.
 *
 * @typedef {{
 *   variant: 'cards' | 'list',
 *   containerClass: string,
 *   cardProps: Record<string, unknown>,
 *   imageAspectClass?: string,
 *   eagerImageCount: number,
 *   skeletonCap: number,
 * }} WatchCollectionLayoutPreset
 */

/** @type {Record<string, WatchCollectionLayoutPreset>} */
export const WATCH_COLLECTION_LAYOUTS = {
  grid: {
    variant: 'cards',
    containerClass:
      'grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 lg:gap-6 mb-8',
    cardProps: WATCH_CARD_GRID_PROPS,
    imageAspectClass: 'aspect-square',
    eagerImageCount: 4,
    skeletonCap: 12,
  },

  // Une montre par ligne : la largeur libérée sert aux caractéristiques.
  list: {
    variant: 'list',
    containerClass: 'flex flex-col gap-3 md:gap-4 mb-8',
    cardProps: {},
    eagerImageCount: 3,
    skeletonCap: 8,
  },

  // Vitrine : peu de pièces, grands visuels portrait.
  showcase: {
    variant: 'cards',
    containerClass: 'grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 mb-8',
    cardProps: WATCH_CARD_GRID_PROPS,
    imageAspectClass: 'aspect-[4/5]',
    eagerImageCount: 2,
    skeletonCap: 4,
  },

  // Gros catalogue : visuel et prix seulement, pas de carrousel par carte.
  compact: {
    variant: 'cards',
    containerClass:
      'grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-3 lg:gap-4 mb-8',
    cardProps: { ...WATCH_CARD_CATALOG_PROPS, showReference: false, density: 'compact' },
    imageAspectClass: 'aspect-square',
    eagerImageCount: 6,
    skeletonCap: 18,
  },
}

/**
 * @param {string} mode
 * @returns {WatchCollectionLayoutPreset}
 */
export function getWatchCollectionLayout(mode) {
  return WATCH_COLLECTION_LAYOUTS[mode] ?? WATCH_COLLECTION_LAYOUTS.grid
}
