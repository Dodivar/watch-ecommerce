import { ref, watch, toValue } from 'vue'
import { importLibrary } from '@googlemaps/js-api-loader'
import { isGoogleMapsEnabled } from '@/services/googleMaps.js'
import {
  buildGoogleMapsDirectionsUrl,
  buildGoogleMapsPlaceUrl,
} from '@/utils/googleMapsLinks.js'

/**
 * Charge les détails Google (note, avis, liens) pour la carte boutique.
 * @param {import('vue').MaybeRefOrGetter<{
 *   placeId?: string,
 *   placeQuery?: string,
 *   googleMapsUrl?: string,
 *   directionsAddress?: string,
 *   center?: { lat: number, lng: number } | null,
 *   fallbackTitle?: string,
 * }>} source
 */
export function useGoogleStorePlace(source) {
  const loading = ref(false)
  const error = ref(null)
  const placeId = ref('')
  const displayName = ref('')
  const formattedAddress = ref('')
  const rating = ref(null)
  const userRatingCount = ref(null)
  const googleMapsUri = ref('')
  const reviews = ref([])
  const profileUrl = ref(null)
  const directionsUrl = ref(null)

  let requestId = 0

  function resolveProfileUrl(config, overrides = {}) {
    return buildGoogleMapsPlaceUrl({
      url: config.googleMapsUrl,
      placeId: overrides.placeId ?? config.placeId,
      googleMapsUri: overrides.googleMapsUri,
      lat: config.center?.lat,
      lng: config.center?.lng,
      query: config.placeQuery,
    })
  }

  function resolveDirectionsUrl(config, overrides = {}) {
    return buildGoogleMapsDirectionsUrl({
      address: config.directionsAddress,
      placeId: overrides.placeId ?? config.placeId,
      lat: config.center?.lat,
      lng: config.center?.lng,
      query: config.placeQuery,
    })
  }

  function resolveDisplayAddress(config, fromApi = '') {
    return fromApi?.trim() || config.directionsAddress?.trim() || ''
  }

  async function resolvePlaceId(Place, config) {
    const explicitId = config.placeId?.trim()
    if (explicitId) return explicitId

    const query = config.placeQuery?.trim()
    if (!query) return null

    const center = config.center
    const searchRequest = {
      textQuery: query,
      fields: ['id', 'displayName', 'location'],
      maxResultCount: 1,
    }
    if (
      center &&
      typeof center.lat === 'number' &&
      typeof center.lng === 'number' &&
      Number.isFinite(center.lat) &&
      Number.isFinite(center.lng)
    ) {
      searchRequest.locationBias = center
    }

    const { places } = await Place.searchByText(searchRequest)
    return places?.[0]?.id ?? null
  }

  async function loadPlaceDetails() {
    const config = toValue(source)
    requestId += 1
    const currentRequest = requestId

    loading.value = true
    error.value = null
    reviews.value = []

    const canLoadReviews =
      isGoogleMapsEnabled() &&
      Boolean(config.placeId?.trim() || config.placeQuery?.trim())

    try {
      if (!canLoadReviews) {
        applyFallbackLinks(config)
        return
      }

      const { Place } = await importLibrary('places')
      const resolvedId = await resolvePlaceId(Place, config)

      if (!resolvedId) {
        applyFallbackLinks(config)
        return
      }

      const place = new Place({ id: resolvedId })
      await place.fetchFields({
        fields: [
          'id',
          'displayName',
          'formattedAddress',
          'googleMapsUri',
          'rating',
          'userRatingCount',
          'reviews',
        ],
      })

      if (currentRequest !== requestId) return

      placeId.value = place.id || resolvedId
      displayName.value = place.displayName || config.fallbackTitle || ''
      formattedAddress.value = resolveDisplayAddress(config, place.formattedAddress || '')
      rating.value = typeof place.rating === 'number' ? place.rating : null
      userRatingCount.value =
        typeof place.userRatingCount === 'number' ? place.userRatingCount : null
      googleMapsUri.value = place.googleMapsUri || ''
      reviews.value = Array.isArray(place.reviews)
        ? place.reviews.slice(0, 3).map((review) => ({
            authorName: review.authorAttribution?.displayName || 'Client Google',
            authorUri: review.authorAttribution?.uri || '',
            rating: typeof review.rating === 'number' ? review.rating : null,
            text: review.text || '',
            relativeTime: review.relativePublishTimeDescription || '',
          }))
        : []

      profileUrl.value = resolveProfileUrl(config, {
        placeId: placeId.value,
        googleMapsUri: googleMapsUri.value,
      })
      directionsUrl.value = resolveDirectionsUrl(config, { placeId: placeId.value })
    } catch (err) {
      if (currentRequest !== requestId) return
      error.value = err instanceof Error ? err.message : 'Impossible de charger la fiche Google.'
      applyFallbackLinks(config)
      if (import.meta.env.DEV) {
        console.warn('[Watch] Google Place : échec du chargement.', err)
      }
    } finally {
      if (currentRequest === requestId) {
        loading.value = false
      }
    }
  }

  function applyFallbackLinks(config) {
    placeId.value = config.placeId?.trim() || ''
    displayName.value = config.fallbackTitle || ''
    formattedAddress.value = resolveDisplayAddress(config)
    rating.value = null
    userRatingCount.value = null
    googleMapsUri.value = ''
    reviews.value = []
    profileUrl.value = resolveProfileUrl(config)
    directionsUrl.value = resolveDirectionsUrl(config)
  }

  watch(
    () => toValue(source),
    () => {
      void loadPlaceDetails()
    },
    { immediate: true, deep: true },
  )

  return {
    loading,
    error,
    placeId,
    displayName,
    formattedAddress,
    rating,
    userRatingCount,
    googleMapsUri,
    reviews,
    profileUrl,
    directionsUrl,
    reload: loadPlaceDetails,
  }
}
