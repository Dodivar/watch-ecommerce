/** Défauts si absents du manifest client (`sites/<SITE_ID>/site.config.js`). */
export const DEFAULT_COLLECTION_FILTERS = {
  price: true,
  brand: true,
  audience: true,
  caseSize: true,
  promotion: true,
}

/** Nombre de montres par page sur `/collection` si `collection.pageSize` est absent. */
export const DEFAULT_COLLECTION_PAGE_SIZE = 12

const COLLECTION_PAGE_SIZE_MIN = 1
const COLLECTION_PAGE_SIZE_MAX = 96

/**
 * Sections de filtres collection (`collection.filters`) fusionnées avec les défauts.
 * @param {Record<string, unknown>} siteConfig - résultat de `getSiteConfig()`
 */
export function getMergedCollectionFilters(siteConfig) {
  return {
    ...DEFAULT_COLLECTION_FILTERS,
    ...(siteConfig.collection?.filters ?? {}),
  }
}

/**
 * Taille de page collection (`collection.pageSize`) avec défaut et bornes.
 * @param {Record<string, unknown>} siteConfig - résultat de `getSiteConfig()`
 * @returns {number}
 */
export function getResolvedCollectionPageSize(siteConfig) {
  const raw = siteConfig.collection?.pageSize
  if (typeof raw !== 'number' || !Number.isFinite(raw)) {
    return DEFAULT_COLLECTION_PAGE_SIZE
  }
  const n = Math.floor(raw)
  return Math.min(COLLECTION_PAGE_SIZE_MAX, Math.max(COLLECTION_PAGE_SIZE_MIN, n))
}

/**
 * Formats d'affichage du catalogue (`collection.displayMode`).
 *
 * - `grid` — grille 2/3/4 colonnes, le format historique.
 * - `list` — une montre par ligne, vignette à gauche et caractéristiques lisibles.
 * - `showcase` — 1 à 2 montres par rangée, grands visuels portrait.
 * - `compact` — grille dense jusqu'à 6 colonnes, visuel et prix seulement.
 */
export const COLLECTION_DISPLAY_MODES = ['grid', 'list', 'showcase', 'compact']

/** Format d'affichage si `collection.displayMode` est absent. */
export const DEFAULT_COLLECTION_DISPLAY_MODE = 'grid'

/**
 * Format d'affichage collection (`collection.displayMode`) avec défaut.
 * Une valeur inconnue retombe sur `grid` — un manifest fautif ne doit pas
 * laisser la page sans disposition.
 *
 * @param {Record<string, unknown>} siteConfig - résultat de `getSiteConfig()`
 * @returns {'grid' | 'list' | 'showcase' | 'compact'}
 */
export function getResolvedCollectionDisplayMode(siteConfig) {
  const raw = siteConfig?.collection?.displayMode
  if (raw == null) return DEFAULT_COLLECTION_DISPLAY_MODE
  if (COLLECTION_DISPLAY_MODES.includes(raw)) return raw

  if (import.meta.env?.DEV) {
    console.warn(
      `[collection.displayMode] Valeur inconnue « ${raw} ». Formats acceptés : ` +
        `${COLLECTION_DISPLAY_MODES.join(', ')}. Retour à « ${DEFAULT_COLLECTION_DISPLAY_MODE} ».`,
    )
  }

  return DEFAULT_COLLECTION_DISPLAY_MODE
}
