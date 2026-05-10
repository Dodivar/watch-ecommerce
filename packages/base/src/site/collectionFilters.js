/** Défauts si absents du manifest client (`sites/<SITE_ID>/site.config.js`). */
export const DEFAULT_COLLECTION_FILTERS = {
  price: true,
  brand: true,
  audience: true,
}

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
