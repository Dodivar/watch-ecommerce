<script setup>
import { computed } from 'vue'
import { getSiteConfig } from '@/site/getSiteConfig.js'
import { isGoogleMapsEnabled } from '@/services/googleMaps.js'
import StoreLocationMapLeaflet from '@/components/StoreLocationMapLeaflet.vue'
import StoreLocationMapGoogle from '@/components/StoreLocationMapGoogle.vue'

defineProps({
  center: { type: Object, default: null },
  zoom: { type: Number, default: null },
  markerLabel: { type: String, default: '' },
  tileLayerUrl: { type: String, default: '' },
  attribution: { type: String, default: '' },
  popupHtml: { type: String, default: '' },
  mapAriaLabel: { type: String, default: '' },
})

const storeMap = getSiteConfig().storeMap

const useGoogleProvider = computed(() => {
  const provider = storeMap?.provider === 'google' ? 'google' : 'leaflet'
  if (provider === 'google' && isGoogleMapsEnabled()) return true
  if (provider === 'google' && import.meta.env.DEV && !isGoogleMapsEnabled()) {
    console.info(
      '[Watch] storeMap.provider=google mais VITE_GOOGLE_PLACES_API_KEY absent — repli Leaflet.',
    )
  }
  return false
})

const MapComponent = computed(() =>
  useGoogleProvider.value ? StoreLocationMapGoogle : StoreLocationMapLeaflet,
)
</script>

<template>
  <component :is="MapComponent" v-bind="$props" />
</template>
