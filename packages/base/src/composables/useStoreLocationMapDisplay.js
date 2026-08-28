import { computed, toValue } from 'vue'
import { getSiteConfig } from '@/site/getSiteConfig.js'
import { t, tc } from '@/i18n'
import { formatRating } from '@/utils/formatters.js'
import { useGoogleReviews } from '@/composables/useGoogleReviews.js'
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

  // La note Google enrichit la bulle du marqueur quand les avis sont configurés. L'état est
  // partagé avec le bloc d'avis de la page : aucun appel réseau supplémentaire.
  const {
    status: reviewsStatus,
    rating,
    userRatingCount,
    profileUrl,
    load: loadReviews,
  } = useGoogleReviews()
  // `load()` sort immédiatement si la fonctionnalité est éteinte, et la promesse est mémoïsée :
  // la carte et le bloc d'avis d'une même page ne déclenchent qu'un seul appel.
  void loadReviews()

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

  const resolvedAddressHtml = computed(() => {
    if (site.contact?.footerAddressHtml) return site.contact.footerAddressHtml
    if (site.legal?.address) return escapeHtml(site.legal.address)
    return ''
  })

  const resolvedPopupHtml = computed(() => {
    if (toValue(props).popupHtml?.trim()) return toValue(props).popupHtml.trim()

    const hasRating = reviewsStatus.value === 'ready' && rating.value != null

    return buildStoreMapPopupHtml({
      title: resolvedMarkerTitle.value,
      addressHtml: resolvedAddressHtml.value,
      logoUrl: resolvedPopupLogoUrl.value,
      logoAlt: site.brand?.logoAlt || resolvedMarkerTitle.value,
      ratingLabel: hasRating ? formatRating(rating.value) : '',
      countLabel: hasRating ? tc('reviews.reviewCount', userRatingCount.value) : '',
      reviewsUrl: hasRating ? profileUrl.value : '',
      reviewsLabel: t('reviews.mapSeeReviews'),
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
    resolvedAddressHtml,
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
