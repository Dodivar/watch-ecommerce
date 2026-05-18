import { importLibrary, setOptions } from '@googlemaps/js-api-loader'
import { GOOGLE_PLACES_API_KEY } from '@/config'
import { getSiteConfig } from '@/site/getSiteConfig.js'

const INIT_FLAG = '__watch_google_places_initialized'
let loadPromise = null

/**
 * Charge la bibliothèque Places (Maps JavaScript API) une seule fois.
 * Expose notamment PlaceAutocompleteElement (API recommandée).
 * @returns {Promise<typeof google.maps.places | null>}
 */
export async function ensureGooglePlaces() {
  if (!GOOGLE_PLACES_API_KEY) {
    if (import.meta.env.DEV) {
      const prefix = getSiteConfig().integrations?.gaDevLogPrefix || '[Watch]'
      console.info(
        `${prefix} Google Places : VITE_GOOGLE_PLACES_API_KEY absent, autocomplétion désactivée.`,
      )
    }
    return null
  }

  if (window[INIT_FLAG] && window.google?.maps?.places) {
    return window.google.maps.places
  }

  if (!loadPromise) {
    setOptions({ key: GOOGLE_PLACES_API_KEY, v: 'weekly' })
    loadPromise = importLibrary('places')
      .then(() => {
        window[INIT_FLAG] = true
        return window.google.maps.places
      })
      .catch((err) => {
        loadPromise = null
        if (import.meta.env.DEV) {
          console.warn('[Watch] Google Places : échec du chargement.', err)
        }
        return null
      })
  }

  return loadPromise
}

export function isGooglePlacesEnabled() {
  return Boolean(GOOGLE_PLACES_API_KEY)
}
