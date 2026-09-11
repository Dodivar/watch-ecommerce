import { getFeaturedWatchesPublic } from '@/services/admin/adminFeaturedService'
import { getLatestAvailableWatches, getWatchById } from '@/services/watchService'

/** Contexte `home_featured_watches` dédié au bloc « mise en avant collection » de l'accueil. */
export const COLLECTION_HIGHLIGHT_CONTEXT = 'collection'

/** Nombre de montres affichées dans le bloc éditorial (1 vedette + suivantes). */
export const COLLECTION_HIGHLIGHT_LIMIT = 5

let cachedWatchesPromise = null

/**
 * Monte le bloc « mise en avant collection » à partir d'une liste
 * d'identifiants : chaque montre est chargée par le même chemin que l'accueil
 * (`getWatchById`, donc toutes ses images et son prix promotionnel), et une
 * sélection vide — ou dont plus aucune montre n'est en vente — retombe sur les
 * dernières disponibles.
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
export async function assembleCollectionHighlightWatches(watchIds, options = {}) {
  const { limit = COLLECTION_HIGHLIGHT_LIMIT, loadWatch = getWatchById } = options
  const ids = (watchIds ?? []).filter(Boolean)

  if (ids.length) {
    const assembled = (
      await Promise.all(ids.map((id) => Promise.resolve(loadWatch(id)).catch(() => null)))
    ).filter(Boolean)
    if (assembled.length) return assembled.slice(0, limit)
  }

  return getLatestAvailableWatches(limit)
}

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
  return assembleCollectionHighlightWatches(
    featured?.map((watch) => watch.id),
    { limit },
  )
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
