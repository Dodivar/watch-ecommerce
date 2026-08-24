import { getSiteConfig } from '@/site/getSiteConfig.js'

/**
 * Clés de garde propres au site, pour ne jamais injecter deux fois le script — même motif que
 * `googleAnalytics.js`. Un repli dérivé du `siteId` évite d’imposer la clé à un manifest client
 * qui n’aurait pas encore été mis à jour.
 */
function integrationKey(name, fallbackSuffix) {
  const site = getSiteConfig()
  const configured = site.integrations?.[name]
  if (configured) return configured
  const id = String(site.siteId || site.id || 'default').replace(/[^a-zA-Z0-9]+/g, '_')
  return `__${id}_${fallbackSuffix}`
}

/**
 * Charge le pixel Meta (Facebook / Instagram) et envoie la page vue initiale.
 *
 * À n’appeler qu’avec le consentement « publicité » : contrairement à la mesure d’audience,
 * ce traceur sert au ciblage.
 *
 * @param {string | undefined} pixelId Identifiant numérique du pixel.
 */
export function ensureMetaPixel(pixelId) {
  if (!pixelId) {
    if (import.meta.env.DEV) {
      console.info(
        `${getSiteConfig().integrations?.gaDevLogPrefix || ''} Meta Pixel : VITE_META_PIXEL_ID absent, chargement ignoré.`,
      )
    }
    return
  }
  if (typeof window === 'undefined') return

  const INIT_FLAG = integrationKey('metaPixelInitFlag', 'meta_pixel_initialized')
  if (window[INIT_FLAG]) return

  if (typeof window.fbq !== 'function') {
    // Stub officiel Meta : met en file les appels jusqu’au chargement de fbevents.js.
    const fbq = function fbq(...args) {
      if (fbq.callMethod) {
        fbq.callMethod.apply(fbq, args)
      } else {
        fbq.queue.push(args)
      }
    }
    fbq.push = fbq
    fbq.loaded = true
    fbq.version = '2.0'
    fbq.queue = []
    window.fbq = fbq
    window._fbq = window._fbq || fbq

    const script = document.createElement('script')
    script.async = true
    script.src = 'https://connect.facebook.net/en_US/fbevents.js'
    document.head.appendChild(script)
  }

  window[INIT_FLAG] = true
  window.fbq('init', pixelId)
  window.fbq('track', 'PageView')
}

/**
 * Envoie un événement standard Meta. No-op silencieux si le pixel n’est pas chargé
 * (pas de consentement, identifiant absent, script bloqué).
 *
 * @param {string} name Événement standard (`AddToCart`, `Purchase`…).
 * @param {Record<string, unknown>} [params]
 * @param {{ eventID?: string }} [options] `eventID` prépare le dédoublonnage avec une
 *   éventuelle Conversions API côté serveur.
 */
export function metaTrack(name, params, options) {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return
  try {
    if (options?.eventID) {
      window.fbq('track', name, params || {}, { eventID: options.eventID })
    } else {
      window.fbq('track', name, params || {})
    }
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('[analytics] événement Meta ignoré', err)
    }
  }
}
