/**
 * Version du bundle chargé, et lecture de celle qui est déployée.
 *
 * Le site n'a pas de service worker et ne découpe pas son bundle : un onglet ouvert garde
 * indéfiniment le code qu'il a chargé, sans jamais rien redemander au serveur. C'est la
 * seule façon, sur ce socle, de voir une vitrine « pas à jour » alors que la production
 * l'est — d'où cette comparaison, faite par le navigateur lui-même.
 *
 * `VITE_APP_VERSION` est figée au build (`vite/build-version.mjs`). Elle est vide en
 * développement et sous vitest : la vérification s'éteint alors d'elle-même.
 */

/** Version du bundle en cours d'exécution. Vide hors build. */
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || ''

/**
 * `BASE_URL` finit toujours par `/` (Vite), y compris quand le site est servi sous un
 * sous-chemin via `VITE_BASE_PATH`.
 */
export const VERSION_MANIFEST_PATH = `${import.meta.env.BASE_URL || '/'}version.json`

/**
 * Version actuellement déployée, lue dans `/version.json`.
 *
 * `cache: 'no-store'` **et** un paramètre horodaté : le premier suffit aux navigateurs
 * récents, le second traverse les proxies intermédiaires qui ignorent l'en-tête. Sans les
 * deux, la réponse mise en cache renverrait éternellement la version déjà chargée — soit
 * exactement l'angle mort qu'on cherche à couvrir.
 *
 * Ne lève jamais : une vérification de version ratée ne doit rien coûter à la page.
 *
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<string | null>} version déployée, ou `null` si elle n'a pas pu être lue
 */
export async function fetchDeployedVersion(options = {}) {
  try {
    const response = await fetch(`${VERSION_MANIFEST_PATH}?t=${Date.now()}`, {
      method: 'GET',
      cache: 'no-store',
      headers: { Accept: 'application/json' },
      signal: options.signal,
    })

    if (!response.ok) return null

    const body = await response.json()
    const version = typeof body?.version === 'string' ? body.version.trim() : ''
    return version || null
  } catch {
    // Hors ligne, réponse illisible, requête annulée : rien à conclure, on réessaiera.
    return null
  }
}
