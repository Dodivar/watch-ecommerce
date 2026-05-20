<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { ensureGoogleMaps } from '@/services/googleMaps.js'
import { useStoreLocationMapDisplay } from '@/composables/useStoreLocationMapDisplay.js'

const props = defineProps({
  center: { type: Object, default: null },
  zoom: { type: Number, default: null },
  markerLabel: { type: String, default: '' },
  popupHtml: { type: String, default: '' },
  mapAriaLabel: { type: String, default: '' },
})

const mapContainerRef = ref(null)
/** @type {google.maps.Map | null} */
let mapInstance = null
/** @type {google.maps.Marker | null} */
let markerInstance = null
/** @type {google.maps.InfoWindow | null} */
let infoWindowInstance = null

const {
  resolvedZoom,
  resolvedCenter,
  resolvedPopupHtml,
  resolvedAriaLabel,
  resolvedMarkerTitle,
} = useStoreLocationMapDisplay(props)

function destroyMap() {
  infoWindowInstance?.close()
  markerInstance = null
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

  const maps = await ensureGoogleMaps()
  if (!maps) return

  destroyMap()

  const position = { lat: center.lat, lng: center.lng }
  mapInstance = new maps.Map(container, {
    center: position,
    zoom: resolvedZoom.value,
    scrollwheel: true,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: true,
  })

  markerInstance = new maps.Marker({
    position,
    map: mapInstance,
    title: resolvedMarkerTitle.value,
  })

  infoWindowInstance = new maps.InfoWindow({
    content: resolvedPopupHtml.value,
    maxWidth: 320,
  })
  infoWindowInstance.open({ map: mapInstance, anchor: markerInstance })
}

onMounted(() => {
  void initMap()
})

onUnmounted(() => {
  destroyMap()
})

watch([resolvedCenter, resolvedZoom, resolvedPopupHtml], () => {
  void initMap()
})
</script>

<template>
  <div
    v-if="resolvedCenter"
    class="store-location-map store-location-map--google w-full overflow-hidden rounded-lg shadow-md"
  >
    <div
      class="store-location-map__frame border border-cream-300"
      role="region"
      :aria-label="resolvedAriaLabel"
    >
      <div
        ref="mapContainerRef"
        class="store-location-map__google h-[min(420px,55vh)] w-full min-h-[280px]"
      />
    </div>
  </div>
</template>
