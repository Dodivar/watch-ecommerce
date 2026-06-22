/**
 * URL Google Maps — fiche établissement.
 * @param {{ url?: string, placeId?: string, googleMapsUri?: string, lat?: number, lng?: number, query?: string }} options
 * @returns {string | null}
 */
export function buildGoogleMapsPlaceUrl({
  url,
  placeId,
  googleMapsUri,
  lat,
  lng,
  query,
}) {
  if (url?.trim()) return url.trim()
  if (googleMapsUri?.trim()) return googleMapsUri.trim()
  if (placeId?.trim()) {
    return `https://www.google.com/maps/search/?api=1&query_place_id=${encodeURIComponent(placeId.trim())}`
  }
  if (typeof lat === 'number' && typeof lng === 'number' && Number.isFinite(lat) && Number.isFinite(lng)) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`
  }
  if (query?.trim()) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query.trim())}`
  }
  return null
}

/**
 * URL Google Maps — itinéraire vers la boutique.
 * @param {{ address?: string, placeId?: string, lat?: number, lng?: number, query?: string }} options
 * @returns {string | null}
 */
export function buildGoogleMapsDirectionsUrl({ address, placeId, lat, lng, query }) {
  if (address?.trim()) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address.trim())}`
  }
  if (placeId?.trim()) {
    return `https://www.google.com/maps/dir/?api=1&destination_place_id=${encodeURIComponent(placeId.trim())}`
  }
  if (typeof lat === 'number' && typeof lng === 'number' && Number.isFinite(lat) && Number.isFinite(lng)) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${lat},${lng}`)}`
  }
  if (query?.trim()) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query.trim())}`
  }
  return null
}
