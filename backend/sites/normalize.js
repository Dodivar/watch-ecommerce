/**
 * Normalise un manifest `sites/<id>/site.config.js` pour usage backend.
 *
 * Calcule les valeurs par défaut à partir des sections déjà présentes côté front
 * (brand, contact, urls, theme.colors) afin que le bloc `backend` du manifest reste
 * minimal et que tout client n'ait pas à dupliquer ce qui existe déjà.
 */

function trimTrailingSlash(value) {
  if (typeof value !== 'string') return ''
  return value.replace(/\/+$/, '')
}

/**
 * Génère, à partir d'une URL HTTP(S), un ensemble étendu d'origines (avec/sans `www.`).
 * @param {string} url
 * @returns {string[]}
 */
function expandOrigin(url) {
  const trimmed = trimTrailingSlash(url)
  if (!trimmed) return []
  let parsed
  try {
    parsed = new URL(trimmed)
  } catch {
    return []
  }
  const protocol = parsed.protocol
  const host = parsed.host
  const variants = new Set()
  variants.add(`${protocol}//${host}`)
  if (host.startsWith('www.')) {
    variants.add(`${protocol}//${host.slice(4)}`)
  } else if (!host.startsWith('localhost') && !/^\d/.test(host)) {
    variants.add(`${protocol}//www.${host}`)
  }
  return Array.from(variants)
}

/**
 * Hôte (sans schéma) extrait d'une URL.
 * @param {string} url
 * @returns {string|null}
 */
function hostOf(url) {
  if (!url) return null
  try {
    return new URL(url).host.toLowerCase()
  } catch {
    return null
  }
}

/**
 * Construit la liste finale d'origines autorisées pour un site, en combinant
 * urls.production / urls.staging / urls.development (avec leurs variantes www)
 * et `backend.cors.extraAllowedOrigins`.
 * @param {Record<string, unknown>} siteConfig
 * @returns {string[]}
 */
function deriveAllowedOrigins(siteConfig) {
  const urls = siteConfig.urls || {}
  const extras = siteConfig?.backend?.cors?.extraAllowedOrigins || []
  const out = new Set()
  for (const candidate of [urls.production, urls.staging, urls.development]) {
    for (const variant of expandOrigin(candidate)) {
      out.add(variant)
    }
  }
  for (const extra of extras) {
    const expanded = expandOrigin(extra)
    if (expanded.length > 0) {
      for (const variant of expanded) out.add(variant)
    } else if (typeof extra === 'string' && extra.trim()) {
      // Toujours autoriser une chaîne brute si elle ne se parse pas en URL valide.
      out.add(trimTrailingSlash(extra.trim()))
    }
  }
  return Array.from(out)
}

/**
 * Construit la liste de hôtes utilisable pour un fallback de résolution via
 * le header Host (utile pour les requêtes serveur-à-serveur sans Origin).
 * @param {Record<string, unknown>} siteConfig
 * @returns {string[]}
 */
const DEFAULT_CHECKOUT = {
  reserveMinutes: 30,
  currency: 'EUR',
  shipping: {
    defaultCountry: 'FR',
    freeShippingFrom: null,
    methods: [
      {
        id: 'standard_home',
        type: 'home',
        label: 'Livraison à domicile',
        countries: ['FR'],
        fee: { type: 'flat', amount: 0 },
        estimatedDays: '3 à 7 jours ouvrés',
      },
    ],
  },
  promo: { enabled: true },
  legal: {
    cgvUrl: '/conditions-generales-utilisation',
    requireAcceptance: true,
  },
  /** Relance email des paniers abandonnés — nécessite la migration `orders.recovery_email_sent_at`. */
  abandonedCart: {
    enabled: false,
    delayMinutes: 60,
    maxAgeHours: 48,
  },
}

/**
 * @param {unknown} value
 * @param {number} fallback
 * @returns {number}
 */
function positiveNumberOr(value, fallback) {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

/**
 * @param {unknown} raw
 * @returns {typeof DEFAULT_CHECKOUT}
 */
function normalizeCheckout(raw) {
  const c = raw && typeof raw === 'object' ? raw : {}
  const shippingRaw = c.shipping && typeof c.shipping === 'object' ? c.shipping : {}
  const methods = Array.isArray(shippingRaw.methods) ? shippingRaw.methods : DEFAULT_CHECKOUT.shipping.methods

  return {
    reserveMinutes:
      Number.isFinite(Number(c.reserveMinutes)) && Number(c.reserveMinutes) > 0
        ? Number(c.reserveMinutes)
        : DEFAULT_CHECKOUT.reserveMinutes,
    currency: typeof c.currency === 'string' && c.currency.trim() ? c.currency.trim() : 'EUR',
    shipping: {
      defaultCountry: shippingRaw.defaultCountry || DEFAULT_CHECKOUT.shipping.defaultCountry,
      freeShippingFrom:
        shippingRaw.freeShippingFrom === null || shippingRaw.freeShippingFrom === undefined
          ? DEFAULT_CHECKOUT.shipping.freeShippingFrom
          : Number(shippingRaw.freeShippingFrom),
      methods: methods.filter((m) => m && m.id && m.type && m.label),
    },
    promo: {
      enabled: c.promo?.enabled !== false,
    },
    legal: {
      cgvUrl: c.legal?.cgvUrl || DEFAULT_CHECKOUT.legal.cgvUrl,
      requireAcceptance: c.legal?.requireAcceptance !== false,
    },
    abandonedCart: {
      enabled: c.abandonedCart?.enabled === true,
      delayMinutes: positiveNumberOr(
        c.abandonedCart?.delayMinutes,
        DEFAULT_CHECKOUT.abandonedCart.delayMinutes,
      ),
      maxAgeHours: positiveNumberOr(
        c.abandonedCart?.maxAgeHours,
        DEFAULT_CHECKOUT.abandonedCart.maxAgeHours,
      ),
    },
  }
}

function deriveAllowedHosts(siteConfig) {
  const origins = deriveAllowedOrigins(siteConfig)
  const hosts = new Set()
  for (const origin of origins) {
    const host = hostOf(origin)
    if (host) hosts.add(host)
  }
  return Array.from(hosts)
}

/**
 * Renvoie la version normalisée du site, prête à être consommée côté backend.
 * Le bloc original reste accessible via `raw`.
 * @param {Record<string, unknown>} rawConfig
 * @returns {{ id: string, raw: Record<string, unknown>, urls: object, brand: object, contact: object, backend: object, allowedOrigins: string[], allowedHosts: string[] }}
 */
function normalizeSiteConfig(rawConfig) {
  const id = rawConfig.siteId
  if (!id || typeof id !== 'string') {
    throw new Error('site.config.js sans siteId valide')
  }

  const brand = rawConfig.brand || {}
  const contact = rawConfig.contact || {}
  const urls = rawConfig.urls || {}
  const themeColors = rawConfig?.theme?.colors || {}
  const backendRaw = rawConfig.backend || {}

  const fromName = backendRaw?.email?.fromName || brand.legalName || brand.displayName || id
  const fromAddress = backendRaw?.email?.fromAddress || contact.email || ''
  const toAddress = backendRaw?.email?.toAddress || contact.email || ''
  const logoText =
    backendRaw?.email?.template?.logoText ||
    (brand.displayName ? String(brand.displayName).toUpperCase() : id.toUpperCase())
  const accentColor =
    backendRaw?.email?.template?.accentColor || themeColors.primary || '#d4af37'

  const corsAllowedOrigins = deriveAllowedOrigins(rawConfig)
  const allowedHosts = deriveAllowedHosts(rawConfig)

  const backend = {
    email: {
      fromName,
      fromAddress,
      toAddress,
      template: {
        logoText,
        accentColor,
      },
    },
    n8n: {
      productionWorkflowUrl: backendRaw?.n8n?.productionWorkflowUrl || '',
      testWorkflowUrl: backendRaw?.n8n?.testWorkflowUrl || '',
    },
    cors: {
      extraAllowedOrigins: backendRaw?.cors?.extraAllowedOrigins || [],
    },
  }

  const checkout = normalizeCheckout(rawConfig.checkout)

  return {
    id,
    raw: rawConfig,
    urls,
    brand,
    contact,
    backend,
    checkout,
    allowedOrigins: corsAllowedOrigins,
    allowedHosts,
  }
}

module.exports = {
  normalizeSiteConfig,
  normalizeCheckout,
  DEFAULT_CHECKOUT,
  deriveAllowedOrigins,
  deriveAllowedHosts,
  expandOrigin,
  hostOf,
  trimTrailingSlash,
}
