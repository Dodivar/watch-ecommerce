import { importLibrary, setOptions } from '@googlemaps/js-api-loader'
import { GOOGLE_PLACES_API_KEY } from '@/config'
import { getSiteConfig } from '@/site/getSiteConfig.js'

const PLACES_READY = '__watch_google_places_initialized'
const MAPS_READY = '__watch_google_maps_initialized'
const MARKER_READY = '__watch_google_marker_initialized'

let loaderConfigured = false
let mapsLoadPromise = null
let markerLoadPromise = null
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
 * Charge la bibliothèque Marker (AdvancedMarkerElement).
 * @returns {Promise<google.maps.MarkerLibrary | null>}
 */
export async function ensureGoogleMarkerLibrary() {
  const maps = await ensureGoogleMaps()
  if (!maps) return null

  if (window[MARKER_READY] && window.google?.maps?.marker?.AdvancedMarkerElement) {
    return window.google.maps.marker
  }

  if (!markerLoadPromise) {
    markerLoadPromise = importLibrary('marker')
      .then((lib) => {
        window[MARKER_READY] = true
        return lib
      })
      .catch((err) => {
        markerLoadPromise = null
        if (import.meta.env.DEV) {
          console.warn('[Watch] Google Marker : échec du chargement.', err)
        }
        return null
      })
  }

  return markerLoadPromise
}

function loadPlacesLibrary() {
  if (!placesLoadPromise) {
    placesLoadPromise = importLibrary('places')
      .then((lib) => {
        window[PLACES_READY] = true
        return lib
      })
      .catch((err) => {
        placesLoadPromise = null
        if (import.meta.env.DEV) {
          console.warn('[Watch] Google Places : échec du chargement.', err)
        }
        throw err
      })
  }

  return placesLoadPromise
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

  try {
    await loadPlacesLibrary()
    return window.google.maps.places
  } catch {
    return null
  }
}
