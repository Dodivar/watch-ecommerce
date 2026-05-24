/** @typedef {'resale' | 'retail'} WatchCatalogMode */

/** @typedef {{ id: string, icon?: string, label?: string, text?: string, source?: string }} WatchCatalogTrustHighlight */

export const DEFAULT_WATCH_CATALOG_MODE = 'retail'

const TRUST_HIGHLIGHT_ICON_BY_ID = {
  guarantee: 'guarantee',
  payment: 'payment',
  pickup: 'pickup',
  store: 'store',
  experience: 'experience',
  authentic: 'authentic',
  envoi: 'shipping',
  shipping: 'shipping',
  return: 'return',
  retour: 'return',
}

function resolveTrustHighlightIcon(highlight) {
  if (highlight.icon && String(highlight.icon).trim()) {
    return String(highlight.icon).trim()
  }
  return TRUST_HIGHLIGHT_ICON_BY_ID[highlight.id] ?? 'shield'
}

/**
 * Résout le profil catalogue (`watchCatalog.mode`) et les flags d'affichage dérivés.
 * @param {Record<string, unknown>} siteConfig
 */
export function resolveWatchCatalogConfig(siteConfig) {
  const raw = siteConfig?.watchCatalog ?? {}
  const mode = raw.mode === 'resale' ? 'resale' : 'retail'
  const isResale = mode === 'resale'

  return {
    mode,
    isResale,
    isRetail: !isResale,
    trustHighlights: Array.isArray(raw.trustHighlights) ? raw.trustHighlights : [],
    display: {
      showReference: isResale,
      showResaleFields: isResale,
      showSoldBadge: isResale,
      showAdCode: isResale,
      showDeliveryContent: isResale,
      showYearInDetails: isResale,
      showConditionInDetails: isResale,
    },
  }
}

function stripHtml(value) {
  return String(value ?? '')
    .replace(/<br\s*\/?>/gi, ', ')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function resolveTrustHighlight(highlight, watchItem) {
  let text = highlight.text
  if (highlight.source === 'watch.guarantee') {
    text = watchItem?.details?.guarantee
    if (!text || String(text).trim() === '') return null
  }
  if (!text || String(text).trim() === '') return null
  return {
    id: highlight.id,
    icon: resolveTrustHighlightIcon(highlight),
    label: highlight.label ? String(highlight.label).trim() : undefined,
    text: String(text).trim(),
  }
}

function buildDefaultRetailTrustHighlights(siteConfig, watchItem) {
  /** @type {{ id: string, icon: string, label?: string, text: string }[]} */
  const highlights = []

  const guarantee = watchItem?.details?.guarantee
  if (guarantee && String(guarantee).trim() !== '') {
    highlights.push({
      id: 'guarantee',
      icon: 'guarantee',
      text: String(guarantee).trim(),
    })
  }

  highlights.push({
    id: 'payment',
    icon: 'payment',
    text: 'Transaction protégée via Stripe.',
  })

  const pickupEnabled = siteConfig?.checkout?.shipping?.pickupEnabled
  const storeMapEnabled = siteConfig?.storeMap?.enabled
  if (pickupEnabled || storeMapEnabled) {
    const storeLabel = siteConfig?.storeMap?.markerLabel
    const address = siteConfig?.contact?.footerAddressHtml
    highlights.push({
      id: 'pickup',
      icon: 'pickup',
      text:
        (storeLabel && String(storeLabel).trim()) ||
        (address && stripHtml(address)) ||
        'Retrait possible en boutique après commande.',
    })
  }

  const authentic = siteConfig?.copy?.watchSecurityAuthentic
  if (authentic && String(authentic).trim() !== '') {
    highlights.push({
      id: 'authentic',
      icon: 'authentic',
      text: String(authentic).trim(),
    })
  }

  return highlights
}

/**
 * Puces de confiance pour la fiche montre en mode retail.
 * @param {Record<string, unknown>} siteConfig — manifest enrichi (`getSiteConfig()`)
 * @param {Record<string, unknown> | null | undefined} watchItem
 */
export function resolveRetailTrustHighlights(siteConfig, watchItem) {
  const catalog = resolveWatchCatalogConfig(siteConfig)
  if (catalog.isResale) return []

  if (catalog.trustHighlights.length > 0) {
    return catalog.trustHighlights
      .map((h) => resolveTrustHighlight(h, watchItem))
      .filter(Boolean)
  }

  return buildDefaultRetailTrustHighlights(siteConfig, watchItem)
}
