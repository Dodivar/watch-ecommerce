<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { ensureGoogleMaps, ensureGoogleMarkerLibrary } from '@/services/googleMaps.js'
import { useStoreLocationMapDisplay } from '@/composables/useStoreLocationMapDisplay.js'
import { getSiteConfig } from '@/site/getSiteConfig.js'

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
/** @type {google.maps.marker.AdvancedMarkerElement | null} */
let markerInstance = null
/** @type {google.maps.InfoWindow | null} */
let infoWindowInstance = null

const storeMap = getSiteConfig().storeMap

const {
  resolvedZoom,
  resolvedCenter,
  resolvedPopupHtml,
  resolvedAriaLabel,
  resolvedMarkerTitle,
} = useStoreLocationMapDisplay(props)

function destroyMap() {
  infoWindowInstance?.close()
  if (markerInstance) {
    markerInstance.map = null
    markerInstance = null
  }
  infoWindowInstance = null
  mapInstance = null
  if (mapContainerRef.value) {
    mapContainerRef.value.replaceChildren()
  }
}

async function initMap() {
  const center = resolvedCenter.value
  const container = mapContainerRef.value
  if (!center || !container) return

  const [maps, markerLib] = await Promise.all([
    ensureGoogleMaps(),
    ensureGoogleMarkerLibrary(),
  ])
  if (!maps || !markerLib?.AdvancedMarkerElement) return

  destroyMap()

  const position = { lat: center.lat, lng: center.lng }
  mapInstance = new maps.Map(container, {
    center: position,
    zoom: resolvedZoom.value,
    mapId: storeMap?.mapId || 'DEMO_MAP_ID',
    scrollwheel: true,
    mapTypeControl: false,
    streetViewControl: storeMap?.streetViewControl === true,
    fullscreenControl: true,
  })

  markerInstance = new markerLib.AdvancedMarkerElement({
    position,
    map: mapInstance,
    title: resolvedMarkerTitle.value,
  })

  infoWindowInstance = new maps.InfoWindow({
    content: resolvedPopupHtml.value,
    maxWidth: 320,
    headerDisabled: true,
  })
  infoWindowInstance.open({ map: mapInstance, anchor: markerInstance })
}

async function scheduleInitMap() {
  if (!mapShouldLoad.value) return
  await nextTick()
  await initMap()
}

let mapVisibilityObserver = null

watch(mapShouldLoad, (shouldLoad) => {
  if (shouldLoad) void scheduleInitMap()
})

onMounted(() => {
  const target = mapFrameRef.value
  if (!target || typeof IntersectionObserver === 'undefined') {
    mapShouldLoad.value = true
    return
  }

  mapVisibilityObserver = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return
      mapShouldLoad.value = true
      mapVisibilityObserver?.disconnect()
      mapVisibilityObserver = null
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

watch([resolvedCenter, resolvedZoom, resolvedPopupHtml], () => {
  void scheduleInitMap()
})
</script>

<template>
  <div
    v-if="resolvedCenter"
    class="store-location-map store-location-map--google w-full overflow-hidden rounded-lg shadow-md"
  >
    <div
      ref="mapFrameRef"
      class="store-location-map__frame border border-cream-300"
      role="region"
      :aria-label="resolvedAriaLabel"
    >
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
.store-location-map__google :deep(.gm-style-iw-c) {
  padding: 0 !important;
}

.store-location-map__google :deep(.gm-style-iw-ch) {
  padding-top: 0 !important;
}

.store-location-map__google :deep(.gm-style-iw-d) {
  overflow: hidden !important;
}
</style>
