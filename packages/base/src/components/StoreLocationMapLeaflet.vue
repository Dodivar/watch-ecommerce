<script setup>
import { t } from '@/i18n'
import L from 'leaflet'
import { LMap, LTileLayer, LMarker, LPopup } from '@vue-leaflet/vue-leaflet'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'
import { computed } from 'vue'
import { getSiteConfig } from '@/site/getSiteConfig.js'
import { useStoreLocationMapDisplay } from '@/composables/useStoreLocationMapDisplay.js'

/** Leaflet default marker URLs break under Vite bundling without explicit asset paths. */
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
})

const DEFAULT_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const DEFAULT_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" rel="noopener noreferrer">OpenStreetMap</a> contributors'

const props = defineProps({
  center: { type: Object, default: null },
  zoom: { type: Number, default: null },
  markerLabel: { type: String, default: '' },
  tileLayerUrl: { type: String, default: '' },
  attribution: { type: String, default: '' },
  popupHtml: { type: String, default: '' },
  mapAriaLabel: { type: String, default: '' },
})

const site = getSiteConfig()
const storeMap = site.storeMap

const {
  resolvedZoom,
  resolvedCenterArray,
  resolvedPopupHtml,
  resolvedAriaLabel,
} = useStoreLocationMapDisplay(props)

const resolvedTileUrl = computed(
  () => props.tileLayerUrl || storeMap?.tileLayerUrl || DEFAULT_TILE_URL,
)

const resolvedAttribution = computed(
  () => props.attribution || storeMap?.attribution || DEFAULT_ATTRIBUTION,
)
</script>

<template>
  <div
    v-if="resolvedCenterArray"
    class="store-location-map store-location-map--leaflet w-full overflow-hidden rounded-lg shadow-md"
  >
    <div
      class="store-location-map__frame border border-cream-300"
      role="region"
      :aria-label="resolvedAriaLabel"
    >
      <l-map
        class="store-location-map__leaflet h-[min(420px,55vh)] w-full min-h-[280px]"
        :zoom="resolvedZoom"
        :center="resolvedCenterArray"
        :use-global-leaflet="false"
        :options="{ scrollWheelZoom: true }"
      >
        <l-tile-layer
          :url="resolvedTileUrl"
          :attribution="resolvedAttribution"
          layer-type="base"
          name="OpenStreetMap"
        />
        <l-marker :lat-lng="resolvedCenterArray">
          <l-popup :options="{ maxWidth: 320, minWidth: 220 }">
            <div class="store-location-map__popup" v-html="resolvedPopupHtml" />
          </l-popup>
        </l-marker>
      </l-map>
    </div>
    <p class="mt-2 text-xs text-gray-500">
      Carte
      <a
        href="https://www.openstreetmap.org/copyright"
        rel="noopener noreferrer"
        class="text-primary underline"
        >OpenStreetMap</a
      >
      {{ t('about.mapAttribution') }}
    </p>
  </div>
</template>

<style scoped>
.store-location-map--leaflet :deep(.leaflet-container) {
  font-family: inherit;
  z-index: 0;
}
.store-location-map--leaflet :deep(.leaflet-popup-content) {
  margin: 10px 12px;
}
</style>
