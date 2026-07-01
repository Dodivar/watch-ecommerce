import { getFeaturedWatchesPublic } from '@/services/admin/adminFeaturedService'
import { getLatestAvailableWatches, getWatchById } from '@/services/watchService'

/** Contexte `home_featured_watches` dédié au bloc « mise en avant collection » de l'accueil. */
export const COLLECTION_HIGHLIGHT_CONTEXT = 'collection'

/** Nombre de montres affichées dans le bloc éditorial (1 vedette + suivantes). */
export const COLLECTION_HIGHLIGHT_LIMIT = 5

let cachedWatchesPromise = null

/**
 * Résout les montres « mise en avant collection » : sélection admin
 * (`home_featured_watches`, contexte `collection`) ou, à défaut, les dernières
 * montres disponibles par ordre d'affichage.
 *
 * @param {number} [limit]
 * @returns {Promise<Array<{ id: string }>>}
 */
export async function resolveCollectionHighlightWatches(limit = COLLECTION_HIGHLIGHT_LIMIT) {
  const featured = await getFeaturedWatchesPublic(COLLECTION_HIGHLIGHT_CONTEXT)
  if (featured?.length) {
    const assembled = (
      await Promise.all(featured.map((w) => getWatchById(w.id).catch(() => null)))
    ).filter(Boolean)
    if (assembled.length) return assembled.slice(0, limit)
  }
  return getLatestAvailableWatches(limit)
}

/**
 * Charge les montres « mise en avant collection » une seule fois par session (cache module).
 *
 * @param {number} [limit]
 * @returns {Promise<Array<{ id: string }>>}
 */
export function loadCollectionHighlightWatches(limit = COLLECTION_HIGHLIGHT_LIMIT) {
  if (!cachedWatchesPromise) {
    cachedWatchesPromise = resolveCollectionHighlightWatches(limit)
  }
  return cachedWatchesPromise
}

/** Réinitialise le cache module (après modification de la sélection en admin). */
export function resetCollectionHighlightCache() {
  cachedWatchesPromise = null
}
