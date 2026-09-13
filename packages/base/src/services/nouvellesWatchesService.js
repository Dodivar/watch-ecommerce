import { getFeaturedWatchesPublic } from '@/services/admin/adminFeaturedService'
import { getLatestAvailableWatches, getWatchById } from '@/services/watchService'

/** Nombre de montres affichées dans le carrousel nouveautés (et badges collection). */
export const NOUVELLES_WATCH_LIMIT = 7

let cachedWatchesPromise = null

/**
 * Monte le carrousel « nouveautés » à partir d'une liste d'identifiants : chaque
 * montre est chargée par le même chemin que l'accueil (`getWatchById`, donc
 * toutes ses images et son prix promotionnel), et une sélection vide — ou dont
 * plus aucune montre n'est en vente — retombe sur les dernières disponibles.
 *
 * Deux appelants : la résolution publique ci-dessous, et l'aperçu de l'écran
 * d'administration, qui doit montrer le brouillon avec exactement les mêmes
 * données que la page d'accueil.
 *
 * @param {string[] | null | undefined} watchIds Sélection ordonnée (accueil : `display_order` décroissant).
 * @param {{ limit?: number, loadWatch?: (id: string) => Promise<object | null> }} [options]
 *   `loadWatch` permet à l'aperçu admin de mémoriser les montres déjà chargées.
 * @returns {Promise<Array<{ id: string }>>}
 */
export async function assembleNouvellesWatches(watchIds, options = {}) {
  const { limit = NOUVELLES_WATCH_LIMIT, loadWatch = getWatchById } = options
  const ids = (watchIds ?? []).filter(Boolean)

  if (ids.length) {
    const assembled = (
      await Promise.all(ids.map((id) => Promise.resolve(loadWatch(id)).catch(() => null)))
    ).filter(Boolean)
    if (assembled.length) return assembled
  }

  return getLatestAvailableWatches(limit)
}

/**
 * Résout les montres « nouveautés » : sélection admin (`home_featured_watches`)
 * ou, à défaut, les dernières montres disponibles par ordre d'affichage.
 *
 * @param {number} [limit]
 * @returns {Promise<Array<{ id: string }>>}
 */
export async function resolveNouvellesWatches(limit = NOUVELLES_WATCH_LIMIT) {
  const featured = await getFeaturedWatchesPublic('nouvelles')
  return assembleNouvellesWatches(
    featured?.map((watch) => watch.id),
    { limit },
  )
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
