<script setup>
import { computed } from 'vue'
import L from 'leaflet'
import { LMap, LTileLayer, LMarker, LPopup } from '@vue-leaflet/vue-leaflet'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'
import { getSiteConfig } from '@/site/getSiteConfig.js'

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
  /** Overrides `site.storeMap.center` when set */
  center: {
    type: Object,
    default: null,
  },
  /** Overrides `site.storeMap.zoom` */
  zoom: {
    type: Number,
    default: null,
  },
  /** Overrides `site.storeMap.markerLabel` */
  markerLabel: {
    type: String,
    default: '',
  },
  tileLayerUrl: {
    type: String,
    default: '',
  },
  attribution: {
    type: String,
    default: '',
  },
  /** Full HTML for marker popup (trusted site manifest content). Overrides auto-built text. */
  popupHtml: {
    type: String,
    default: '',
  },
  mapAriaLabel: {
    type: String,
    default: '',
  },
})

const site = getSiteConfig()
const storeMap = site.storeMap

const resolvedZoom = computed(() => {
  const z = props.zoom ?? storeMap?.zoom
  return typeof z === 'number' && Number.isFinite(z) ? z : 15
})

const resolvedCenterArray = computed(() => {
  const c = props.center ?? storeMap?.center
  if (
    !c ||
    typeof c.lat !== 'number' ||
    typeof c.lng !== 'number' ||
    !Number.isFinite(c.lat) ||
    !Number.isFinite(c.lng)
  ) {
    return null
  }
  return [c.lat, c.lng]
})

const resolvedTileUrl = computed(
  () => props.tileLayerUrl || storeMap?.tileLayerUrl || DEFAULT_TILE_URL,
)

const resolvedAttribution = computed(
  () => props.attribution || storeMap?.attribution || DEFAULT_ATTRIBUTION,
)

const resolvedMarkerTitle = computed(() => {
  const fromProp = props.markerLabel?.trim()
  if (fromProp) return fromProp
  const fromSite = storeMap?.markerLabel?.trim()
  if (fromSite) return fromSite
  return site.brand.displayName || site.brand.legalName || 'Boutique'
})

const resolvedPopupHtml = computed(() => {
  if (props.popupHtml?.trim()) return props.popupHtml.trim()
  const lines = []
  lines.push(`<strong>${escapeHtml(resolvedMarkerTitle.value)}</strong>`)
  const addr = site.contact?.footerAddressHtml
  if (addr) {
    lines.push(addr)
  } else if (site.legal?.address) {
    lines.push(escapeHtml(site.legal.address))
  }
  return lines.join('<br />')
})

const resolvedAriaLabel = computed(() => {
  const custom = props.mapAriaLabel?.trim()
  if (custom) return custom
  return `Carte — ${resolvedMarkerTitle.value}`
})

function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}
</script>

<template>
  <div v-if="resolvedCenterArray" class="store-location-map w-full overflow-hidden rounded-lg shadow-md">
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
          <l-popup>
            <div class="text-sm text-gray-800" v-html="resolvedPopupHtml" />
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
      — fond de carte selon la configuration du site.
    </p>
  </div>
</template>

<style scoped>
.store-location-map :deep(.leaflet-container) {
  font-family: inherit;
  z-index: 0;
}
.store-location-map :deep(.leaflet-popup-content) {
  margin: 10px 12px;
}
</style>
