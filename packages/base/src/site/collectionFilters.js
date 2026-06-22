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
