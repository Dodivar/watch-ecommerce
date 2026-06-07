<script setup>
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { ensureGoogleMaps } from '@/services/googleMaps.js'
import { useStoreLocationMapDisplay } from '@/composables/useStoreLocationMapDisplay.js'
import { useGoogleStorePlace } from '@/composables/useGoogleStorePlace.js'
import { getSiteConfig } from '@/site/getSiteConfig.js'
import StoreLocationMapGoogleCard from '@/components/StoreLocationMapGoogleCard.vue'

const props = defineProps({
  center: { type: Object, default: null },
  zoom: { type: Number, default: null },
  markerLabel: { type: String, default: '' },
  popupHtml: { type: String, default: '' },
  mapAriaLabel: { type: String, default: '' },
})

const mapContainerRef = ref(null)
const mapFrameRef = ref(null)
const mapShouldLoad = ref(false)
/** @type {google.maps.Map | null} */
let mapInstance = null
/** @type {google.maps.Marker | null} */
let markerInstance = null

const site = getSiteConfig()
const storeMap = site.storeMap

const {
  resolvedZoom,
  resolvedCenter,
  resolvedAriaLabel,
  resolvedMarkerTitle,
  resolvedPopupLogoUrl,
  resolvedAddressHtml,
} = useStoreLocationMapDisplay(props)

const googlePlaceSource = computed(() => ({
  placeId: storeMap?.googlePlaceId,
  placeQuery: storeMap?.googlePlaceQuery,
  googleMapsUrl: storeMap?.googleMapsUrl,
  directionsAddress: storeMap?.directionsAddress,
  center: resolvedCenter.value,
  fallbackTitle: resolvedMarkerTitle.value,
}))

const {
  loading: placeLoading,
  displayName: placeDisplayName,
  formattedAddress: placeFormattedAddress,
  rating: placeRating,
  userRatingCount: placeUserRatingCount,
  reviews: placeReviews,
  profileUrl: placeProfileUrl,
  directionsUrl: placeDirectionsUrl,
} = useGoogleStorePlace(googlePlaceSource)

function destroyMap() {
  markerInstance = null
  mapInstance = null
  if (mapContainerRef.value) {
    mapContainerRef.value.replaceChildren()
  }
}

async function initMap() {
  const center = resolvedCenter.value
  const container = mapContainerRef.value
  if (!center || !container) return

  const maps = await ensureGoogleMaps()
  if (!maps) return

  destroyMap()

  const position = { lat: center.lat, lng: center.lng }
  mapInstance = new maps.Map(container, {
    center: position,
    zoom: resolvedZoom.value,
    scrollwheel: true,
    mapTypeControl: false,
    streetViewControl: storeMap?.streetViewControl === true,
    fullscreenControl: true,
  })

  markerInstance = new maps.Marker({
    position,
    map: mapInstance,
    title: resolvedMarkerTitle.value,
  })
}

let mapVisibilityObserver = null

onMounted(() => {
  const target = mapFrameRef.value
  if (!target || typeof IntersectionObserver === 'undefined') {
    mapShouldLoad.value = true
    void initMap()
    return
  }

  mapVisibilityObserver = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return
      mapShouldLoad.value = true
      mapVisibilityObserver?.disconnect()
      mapVisibilityObserver = null
      void initMap()
    },
    { rootMargin: '240px 0px' },
  )
  mapVisibilityObserver.observe(target)
})

onUnmounted(() => {
  mapVisibilityObserver?.disconnect()
  mapVisibilityObserver = null
  destroyMap()
})

watch([resolvedCenter, resolvedZoom], () => {
  if (!mapShouldLoad.value) return
  void initMap()
})
</script>

<template>
  <div
    v-if="resolvedCenter"
    class="store-location-map store-location-map--google w-full overflow-hidden rounded-lg shadow-md"
  >
    <div
      ref="mapFrameRef"
      class="store-location-map__frame relative border border-cream-300"
      role="region"
      :aria-label="resolvedAriaLabel"
    >
      <StoreLocationMapGoogleCard
        :title="placeDisplayName || resolvedMarkerTitle"
        :address-html="resolvedAddressHtml"
        :formatted-address="placeFormattedAddress"
        :logo-url="resolvedPopupLogoUrl || ''"
        :logo-alt="site.brand?.logoAlt || resolvedMarkerTitle"
        :rating="placeRating"
        :user-rating-count="placeUserRatingCount"
        :profile-url="placeProfileUrl || ''"
        :directions-url="placeDirectionsUrl || ''"
        :reviews="placeReviews"
        :loading="placeLoading"
      />

      <div
        v-if="!mapShouldLoad"
        class="store-location-map__google h-[min(420px,55vh)] w-full min-h-[280px] bg-cream-100"
        aria-hidden="true"
      />
      <div
        v-else
        ref="mapContainerRef"
        class="store-location-map__google h-[min(420px,55vh)] w-full min-h-[280px]"
      />
    </div>
  </div>
</template>

<style scoped>
.store-location-map--google :deep(.store-location-map-google-card) {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
</style>
