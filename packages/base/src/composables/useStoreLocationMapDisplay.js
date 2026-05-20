import { computed, toValue } from 'vue'
import { getSiteConfig } from '@/site/getSiteConfig.js'
import {
  buildStoreMapPopupHtml,
  resolveStoreMapPopupLogoUrl,
} from '@/utils/buildStoreMapPopupHtml.js'

/**
 * Résolution centre / zoom / popup pour les cartes boutique (Leaflet ou Google).
 * @param {import('vue').MaybeRefOrGetter<{
 *   center?: { lat: number, lng: number } | null,
 *   zoom?: number | null,
 *   markerLabel?: string,
 *   popupHtml?: string,
 *   popupLogoSrc?: string,
 *   mapAriaLabel?: string,
 * }>} props
 */
export function useStoreLocationMapDisplay(props) {
  const site = getSiteConfig()
  const storeMap = site.storeMap

  const resolvedZoom = computed(() => {
    const z = toValue(props).zoom ?? storeMap?.zoom
    return typeof z === 'number' && Number.isFinite(z) ? z : 15
  })

  const resolvedCenter = computed(() => {
    const c = toValue(props).center ?? storeMap?.center
    if (
      !c ||
      typeof c.lat !== 'number' ||
      typeof c.lng !== 'number' ||
      !Number.isFinite(c.lat) ||
      !Number.isFinite(c.lng)
    ) {
      return null
    }
    return { lat: c.lat, lng: c.lng }
  })

  const resolvedCenterArray = computed(() => {
    const c = resolvedCenter.value
    return c ? [c.lat, c.lng] : null
  })

  const resolvedMarkerTitle = computed(() => {
    const fromProp = toValue(props).markerLabel?.trim()
    if (fromProp) return fromProp
    const fromSite = storeMap?.markerLabel?.trim()
    if (fromSite) return fromSite
    return site.brand.displayName || site.brand.legalName || 'Boutique'
  })

  const resolvedPopupLogoUrl = computed(() => {
    const custom = toValue(props).popupLogoSrc ?? storeMap?.popupLogoSrc
    const path = custom || '/apple-touch-icon.png'
    return resolveStoreMapPopupLogoUrl(path)
  })

  const resolvedPopupHtml = computed(() => {
    if (toValue(props).popupHtml?.trim()) return toValue(props).popupHtml.trim()

    const addr = site.contact?.footerAddressHtml
      ? site.contact.footerAddressHtml
      : site.legal?.address
        ? escapeHtml(site.legal.address)
        : ''

    return buildStoreMapPopupHtml({
      title: resolvedMarkerTitle.value,
      addressHtml: addr,
      logoUrl: resolvedPopupLogoUrl.value,
      logoAlt: site.brand?.logoAlt || resolvedMarkerTitle.value,
    })
  })

  const resolvedAriaLabel = computed(() => {
    const custom = toValue(props).mapAriaLabel?.trim()
    if (custom) return custom
    return `Carte — ${resolvedMarkerTitle.value}`
  })

  return {
    resolvedZoom,
    resolvedCenter,
    resolvedCenterArray,
    resolvedMarkerTitle,
    resolvedPopupLogoUrl,
    resolvedPopupHtml,
    resolvedAriaLabel,
  }
}

function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}
