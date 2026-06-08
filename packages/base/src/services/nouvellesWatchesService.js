import { getFeaturedWatchesPublic } from '@/services/admin/adminFeaturedService'
import { getLatestAvailableWatches, getWatchById } from '@/services/watchService'

/** Nombre de montres affichées dans le carrousel nouveautés (et badges collection). */
export const NOUVELLES_WATCH_LIMIT = 7

let cachedWatchesPromise = null

/**
 * Résout les montres « nouveautés » : sélection admin (`home_featured_watches`)
 * ou, à défaut, les dernières montres disponibles par ordre d'affichage.
 *
 * @param {number} [limit]
 * @returns {Promise<Array<{ id: string }>>}
 */
export async function resolveNouvellesWatches(limit = NOUVELLES_WATCH_LIMIT) {
  const featured = await getFeaturedWatchesPublic('nouvelles')
  if (featured?.length) {
    const assembled = (
      await Promise.all(featured.map((w) => getWatchById(w.id).catch(() => null)))
    ).filter(Boolean)
    if (assembled.length) return assembled
  }
  return getLatestAvailableWatches(limit)
}

/**
 * Charge les montres nouveautés une seule fois par session (cache module).
 *
 * @param {number} [limit]
 * @returns {Promise<Array<{ id: string }>>}
 */
export function loadNouvellesWatches(limit = NOUVELLES_WATCH_LIMIT) {
  if (!cachedWatchesPromise) {
    cachedWatchesPromise = resolveNouvellesWatches(limit)
  }
  return cachedWatchesPromise
}

/**
 * Identifiants des montres « nouveautés » (même jeu que le carrousel accueil).
 *
 * @param {number} [limit]
 * @returns {Promise<Set<string>>}
 */
export async function resolveNouvellesWatchIds(limit = NOUVELLES_WATCH_LIMIT) {
  const watches = await loadNouvellesWatches(limit)
  return new Set(watches.map((w) => w.id).filter(Boolean))
}

/**
 * Charge les IDs nouveautés une seule fois par session (cache module).
 *
 * @param {number} [limit]
 * @returns {Promise<Set<string>>}
 */
export function loadNouvellesWatchIds(limit = NOUVELLES_WATCH_LIMIT) {
  return resolveNouvellesWatchIds(limit)
}

/** Réinitialise le cache (tests ou invalidation explicite). */
export function resetNouvellesWatchesCache() {
  cachedWatchesPromise = null
}
