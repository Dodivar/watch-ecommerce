/** @typedef {'resale' | 'retail'} WatchCatalogMode */

/** @typedef {{ id: string, icon?: string, label?: string, text?: string, source?: string }} WatchCatalogTrustHighlight */

/** @typedef {{ id: string, icon?: string, title?: string, text?: string, source?: string }} WatchCatalogGuaranteeItem */

/** @typedef {{ heading?: string, items?: WatchCatalogGuaranteeItem[] }} WatchCatalogGuaranteesConfig */

export const DEFAULT_WATCH_CATALOG_MODE = 'retail'

export const MIN_WATCH_GUARANTEES = 3
export const MAX_WATCH_GUARANTEES = 6

/** Contenu par défaut (Sauvage Watches — revente). */
export const DEFAULT_WATCH_GUARANTEES = {
  heading: 'Les garanties pour cette annonce',
  items: [
    {
      id: 'return',
      icon: 'return',
      title: 'Droit de rétractation de 14 jours',
      text: "Si la montre présente des défauts ou ne correspond pas à vos attentes, vous pouvez exercer votre droit de rétractation dans un délai de 14 jours à compter de la réception pour obtenir un remboursement intégral du prix d'achat, rapidement et simplement.",
    },
    {
      id: 'authentic',
      icon: 'authentic',
      title: 'Authentification garantie',
      source: 'copy.watchSecurityAuthentic',
    },
    {
      id: 'guarantee',
      icon: 'guarantee',
      title: 'Garantie 1 an sur le mécanisme',
      text: "Toutes nos montres bénéficient d'une garantie d'un an sur le mécanisme. En cas de problème mécanique, nous prenons en charge la réparation ou le remplacement, vous permettant d'acheter en toute sérénité.",
    },
    {
      id: 'insurance',
      icon: 'shield',
      title: 'Envoi assuré',
      source: 'copy.watchSecurityInsurance',
    },
    {
      id: 'payment',
      icon: 'payment',
      title: 'Paiement sécurisé',
      text: "Tous les paiements sont traités de manière sécurisée via Stripe, garantissant la protection de vos données bancaires. Aucune information de paiement n'est stockée sur nos serveurs.",
    },
    {
      id: 'shipping',
      icon: 'shipping',
      title: 'Colis sécurisé et assuré',
      text: "L'envoi de votre montre est sécurisé et assuré à la valeur déclarée de la montre. Chaque colis est suivi et protégé de bout en bout, garantissant une livraison en toute sécurité jusqu'à votre domicile.",
    },
  ],
}

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

  // Position de l'année sur la carte montre : 'corner' (badge en haut à gauche
  // de l'image) ou 'inline' (à droite du prix/contenu, comportement historique).
  const yearBadgePosition = raw.yearBadgePosition === 'corner' ? 'corner' : 'inline'

  const appointmentEnabled = !isResale || raw.appointment === true

  return {
    mode,
    isResale,
    isRetail: !isResale,
    appointmentEnabled,
    trustHighlights: Array.isArray(raw.trustHighlights) ? raw.trustHighlights : [],
    guarantees:
      raw.guarantees != null && typeof raw.guarantees === 'object'
        ? raw.guarantees
        : undefined,
    display: {
      showReference: isResale,
      showResaleFields: isResale,
      showSoldBadge: isResale,
      // Catalogue retail (gestion de stock) : afficher l'etat "Hors stock"
      // (badge + achat desactive) au lieu de masquer la montre.
      showStockStatus: !isResale,
      showAdCode: isResale,
      showDeliveryContent: isResale,
      showYearInDetails: isResale,
      showConditionInDetails: isResale,
      yearBadgePosition,
    },
  }
}

/**
 * Determine si une montre est en rupture de stock pour l'affichage catalogue.
 * Concerne uniquement le mode retail (gestion de stock) : `stock_quantity <= 0`.
 * En mode resale, la disponibilite repose sur `isSold` (pas de notion de stock).
 *
 * @param {Record<string, unknown>} siteConfig — manifest enrichi (`getSiteConfig()`)
 * @param {Record<string, unknown> | null | undefined} watchItem
 * @returns {boolean}
 */
export function isWatchOutOfStock(siteConfig, watchItem) {
  const catalog = resolveWatchCatalogConfig(siteConfig)
  if (!catalog.display.showStockStatus) return false
  if (!watchItem) return false
  const raw = watchItem.stockQuantity
  // Stock inconnu (null/undefined) → ne pas afficher "Hors stock" par defaut.
  if (raw === null || raw === undefined || raw === '') return false
  const stock = Number(raw)
  return Number.isFinite(stock) && stock <= 0
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

function resolveGuaranteeSource(source, siteConfig, watchItem) {
  switch (source) {
    case 'copy.watchSecurityAuthentic':
      return siteConfig?.copy?.watchSecurityAuthentic
    case 'copy.watchSecurityInsurance':
      return siteConfig?.copy?.watchSecurityInsurance
    case 'watch.guarantee':
      return watchItem?.details?.guarantee
    default:
      return undefined
  }
}

/**
 * @param {WatchCatalogGuaranteeItem} item
 * @param {Record<string, unknown>} siteConfig
 * @param {Record<string, unknown> | null | undefined} watchItem
 */
function resolveGuaranteeItem(item, siteConfig, watchItem) {
  const title = item.title ? String(item.title).trim() : ''
  if (!title) return null

  let text = item.text
  if (item.source) {
    text = resolveGuaranteeSource(item.source, siteConfig, watchItem)
  }
  if (!text || String(text).trim() === '') return null

  return {
    id: item.id,
    icon: resolveTrustHighlightIcon(item),
    title,
    text: String(text).trim(),
  }
}

/**
 * Cartes garanties / sécurité de l'onglet fiche montre.
 * @param {Record<string, unknown>} siteConfig — manifest enrichi (`getSiteConfig()`)
 * @param {Record<string, unknown> | null | undefined} watchItem
 */
export function resolveWatchGuarantees(siteConfig, watchItem) {
  /** @type {WatchCatalogGuaranteesConfig} */
  const raw = siteConfig?.watchCatalog?.guarantees ?? {}
  const hasCustomItems = Array.isArray(raw.items) && raw.items.length > 0
  const config = hasCustomItems ? raw : DEFAULT_WATCH_GUARANTEES

  const heading =
    (config.heading && String(config.heading).trim()) ||
    DEFAULT_WATCH_GUARANTEES.heading

  const items = (config.items ?? [])
    .map((item) => resolveGuaranteeItem(item, siteConfig, watchItem))
    .filter(Boolean)
    .slice(0, MAX_WATCH_GUARANTEES)

  if (import.meta.env?.DEV && hasCustomItems) {
    const count = config.items?.length ?? 0
    if (count < MIN_WATCH_GUARANTEES || count > MAX_WATCH_GUARANTEES) {
      console.warn(
        `[watchCatalog.guarantees] Attendu entre ${MIN_WATCH_GUARANTEES} et ${MAX_WATCH_GUARANTEES} items, reçu ${count}.`,
      )
    }
  }

  return {
    heading,
    items,
  }
}
