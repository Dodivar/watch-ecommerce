import { importLibrary, setOptions } from '@googlemaps/js-api-loader'
import { GOOGLE_PLACES_API_KEY } from '@/config'
import { getSiteConfig } from '@/site/getSiteConfig.js'

const PLACES_READY = '__watch_google_places_initialized'
const MAPS_READY = '__watch_google_maps_initialized'

let loaderConfigured = false
let mapsLoadPromise = null
let placesLoadPromise = null

function devLogPrefix() {
  return getSiteConfig().integrations?.gaDevLogPrefix || '[Watch]'
}

function configureLoader() {
  if (!GOOGLE_PLACES_API_KEY) return false
  if (!loaderConfigured) {
    setOptions({ key: GOOGLE_PLACES_API_KEY, v: 'weekly' })
    loaderConfigured = true
  }
  return true
}

/** Clé Google présente (carte boutique + autocomplétion checkout). */
export function isGoogleMapsEnabled() {
  return Boolean(GOOGLE_PLACES_API_KEY)
}

/** Alias pour l'autocomplétion checkout. */
export function isGooglePlacesEnabled() {
  return isGoogleMapsEnabled()
}

/**
 * Charge la bibliothèque Maps (affichage carte boutique).
 * @returns {Promise<typeof google.maps | null>}
 */
export async function ensureGoogleMaps() {
  if (!configureLoader()) {
    if (import.meta.env.DEV) {
      console.info(
        `${devLogPrefix()} Google Maps : VITE_GOOGLE_PLACES_API_KEY absent, carte Google désactivée.`,
      )
    }
    return null
  }

  if (window[MAPS_READY] && window.google?.maps) {
    return window.google.maps
  }

  if (!mapsLoadPromise) {
    mapsLoadPromise = importLibrary('maps')
      .then(() => {
        window[MAPS_READY] = true
        return window.google.maps
      })
      .catch((err) => {
        mapsLoadPromise = null
        if (import.meta.env.DEV) {
          console.warn('[Watch] Google Maps : échec du chargement.', err)
        }
        return null
      })
  }

  return mapsLoadPromise
}

/**
 * Charge la bibliothèque Places (PlaceAutocompleteElement checkout).
 * @returns {Promise<typeof google.maps.places | null>}
 */
export async function ensureGooglePlaces() {
  if (!configureLoader()) {
    if (import.meta.env.DEV) {
      console.info(
        `${devLogPrefix()} Google Places : VITE_GOOGLE_PLACES_API_KEY absent, autocomplétion désactivée.`,
      )
    }
    return null
  }

  if (window[PLACES_READY] && window.google?.maps?.places) {
    return window.google.maps.places
  }

  if (!placesLoadPromise) {
    placesLoadPromise = importLibrary('places')
      .then(() => {
        window[PLACES_READY] = true
        return window.google.maps.places
      })
      .catch((err) => {
        placesLoadPromise = null
        if (import.meta.env.DEV) {
          console.warn('[Watch] Google Places : échec du chargement.', err)
        }
        return null
      })
  }

  return placesLoadPromise
}
