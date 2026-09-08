import { getFeaturedWatchesPublic } from '@/services/admin/adminFeaturedService'
import { getLatestAvailableWatches, getWatchById } from '@/services/watchService'

/** Contexte `home_featured_watches` dédié à la montre exposée dans le hero « vitrine ». */
export const HOME_VITRINE_CONTEXT = 'vitrine'

let cachedWatchPromise = null

/**
 * La vitrine annonce « En stock » : une montre partie à la vente ne peut pas y rester,
 * même si l'admin l'y a placée. `getFeaturedWatchesPublic` écarte déjà `is_available: false`,
 * pas `is_sold`.
 *
 * @param {{ is_sold?: boolean } | null | undefined} watch
 * @returns {boolean}
 */
function isShowcasable(watch) {
  return Boolean(watch) && watch.is_sold !== true
}

/**
 * Montre exposée dans le panneau du hero « vitrine ».
 *
 * La sélection admin (`home_featured_watches`, contexte `vitrine`) est une liste ordonnée dont
 * seule la tête est montrée : les suivantes sont des remplaçantes, prises dans l'ordre dès que
 * celle du dessus part à la vente. Sélection vide ou entièrement vendue, on retombe sur le
 * comportement d'origine — la dernière montre disponible du catalogue.
 *
 * @returns {Promise<Record<string, unknown> | null>}
 */
export async function resolveVitrineWatch() {
  let featured = null
  try {
    featured = await getFeaturedWatchesPublic(HOME_VITRINE_CONTEXT)
  } catch {
    // Tenant sans la migration du contexte `vitrine` : repli silencieux sur le catalogue.
    featured = null
  }

  for (const row of featured ?? []) {
    if (!isShowcasable(row)) continue
    // Repasser par `getWatchById` : la ligne jointe n'a pas ses images ni ses relations.
    const watch = await getWatchById(row.id).catch(() => null)
    if (isShowcasable(watch)) return watch
  }

  const [latest] = await getLatestAvailableWatches(1)
  return latest ?? null
}

/**
 * Charge la montre en vitrine une seule fois par session (cache module), comme le font
 * déjà les nouveautés et l'aperçu collection.
 *
 * @returns {Promise<Record<string, unknown> | null>}
 */
export function loadVitrineWatch() {
  if (!cachedWatchPromise) {
    cachedWatchPromise = resolveVitrineWatch()
  }
  return cachedWatchPromise
}

/** Réinitialise le cache module (après modification de la sélection en admin). */
export function resetVitrineWatchCache() {
  cachedWatchPromise = null
}
