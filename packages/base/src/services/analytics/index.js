/**
 * Mesure du tunnel d’achat : point d’entrée unique.
 *
 * Les composants appellent un verbe métier (`trackAddToCart`…) et rien d’autre. Ce module est
 * le seul endroit qui connaît le consentement, les identifiants et les destinations — aucun
 * appel gtag ou fbq ne doit apparaître dans un composant.
 *
 * Trois destinations :
 *   - GA4 (finalité « mesure d’audience ») — comprendre où le tunnel fuit ;
 *   - Google Ads et Meta Pixel (finalité « publicité ») — attribuer une vente à une campagne.
 *
 * Tout est no-op silencieux si le consentement manque, si l’identifiant n’est pas configuré ou
 * si le script est bloqué : la mesure ne doit jamais casser une vente.
 */

import {
  GA_MEASUREMENT_ID,
  GOOGLE_ADS_ID,
  GOOGLE_ADS_PURCHASE_LABEL,
  META_PIXEL_ID,
} from '@/config.js'
import { isAnalyticsAllowed, isMarketingAllowed } from '@/services/cookieConsent'
import { ensureGoogleAnalytics } from '@/services/googleAnalytics'
import { ensureMetaPixel, metaTrack } from '@/services/metaPixel'
import { pushConsentDefault, pushConsentUpdate } from './consentMode.js'
import { gtagEvent, pushGtag } from './gtag.js'
import {
  centsToUnits,
  getCurrency,
  sumItemsValue,
  toGa4Item,
  toGa4ItemFromOrderLine,
  toGa4Items,
  toMetaContentIds,
  toMetaContents,
} from './items.js'

export { getCurrency, centsToUnits } from './items.js'

/* -------------------------------------------------------------------------- */
/* Consentement et chargement                                                  */
/* -------------------------------------------------------------------------- */

/**
 * À appeler une fois au démarrage, avant le montage de l’application.
 * Pose les signaux Consent Mode puis rejoue le choix déjà mémorisé.
 */
export function initAnalytics() {
  pushConsentDefault()
  applyConsent({ analytics: isAnalyticsAllowed(), marketing: isMarketingAllowed() })
}

/**
 * Applique un choix de consentement (démarrage ou clic dans le bandeau).
 * @param {{ analytics: boolean, marketing: boolean }} choice
 */
export function applyConsent({ analytics, marketing }) {
  pushConsentUpdate({ analytics, marketing })

  // gtag.js sert GA4 *et* Google Ads : une seule des deux finalités suffit à le charger.
  if (analytics || marketing) {
    ensureGoogleAnalytics(GA_MEASUREMENT_ID, marketing ? GOOGLE_ADS_ID : '')
  }
  if (marketing) {
    ensureMetaPixel(META_PIXEL_ID)
  }
}

/* -------------------------------------------------------------------------- */
/* Navigation                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Page vue d’une navigation SPA.
 * @param {string} path Chemin complet, préfixe de langue compris.
 */
export function trackPageView(path) {
  if (GA_MEASUREMENT_ID && isAnalyticsAllowed()) {
    pushGtag('config', GA_MEASUREMENT_ID, { page_path: path })
  }
  if (isMarketingAllowed()) {
    metaTrack('PageView')
  }
}

/* -------------------------------------------------------------------------- */
/* Tunnel d’achat                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Consultation d’une fiche montre.
 * @param {Record<string, any>} watch Montre issue de `transformWatchData`.
 */
export function trackViewItem(watch) {
  const item = toGa4Item(watch)
  if (!item) return

  const currency = getCurrency()
  if (isAnalyticsAllowed()) {
    gtagEvent('view_item', { currency, value: item.price, items: [item] })
  }
  if (isMarketingAllowed()) {
    metaTrack('ViewContent', {
      content_type: 'product',
      content_ids: toMetaContentIds([item]),
      contents: toMetaContents([item]),
      value: item.price,
      currency,
    })
  }
}

/**
 * Ajout au panier.
 * @param {Record<string, any>} source Montre ou ligne de panier (prix en euros).
 * @param {{ quantity?: number }} [options]
 */
export function trackAddToCart(source, options = {}) {
  const item = toGa4Item(source, { quantity: options.quantity ?? 1 })
  if (!item) return

  const currency = getCurrency()
  const value = sumItemsValue([item])
  if (isAnalyticsAllowed()) {
    gtagEvent('add_to_cart', { currency, value, items: [item] })
  }
  if (isMarketingAllowed()) {
    metaTrack('AddToCart', {
      content_type: 'product',
      content_ids: toMetaContentIds([item]),
      contents: toMetaContents([item]),
      value,
      currency,
    })
  }
}

/**
 * Ouverture du panier.
 * @param {Record<string, any>[]} cartLines Lignes de `useCart` (prix en euros).
 * @param {number} [totalValue] Total faisant foi ; recalculé depuis les lignes sinon.
 */
export function trackViewCart(cartLines, totalValue) {
  if (!isAnalyticsAllowed()) return

  const items = toGa4Items(cartLines)
  if (!items.length) return

  gtagEvent('view_cart', {
    currency: getCurrency(),
    value: totalValue ?? sumItemsValue(items),
    items,
  })
}

/**
 * Départ vers le checkout.
 * @param {Record<string, any>[]} cartLines Lignes de `useCart` (prix en euros).
 * @param {number} [totalValue]
 */
export function trackBeginCheckout(cartLines, totalValue) {
  const items = toGa4Items(cartLines)
  if (!items.length) return

  const currency = getCurrency()
  const value = totalValue ?? sumItemsValue(items)
  if (isAnalyticsAllowed()) {
    gtagEvent('begin_checkout', { currency, value, items })
  }
  if (isMarketingAllowed()) {
    metaTrack('InitiateCheckout', {
      content_type: 'product',
      content_ids: toMetaContentIds(items),
      contents: toMetaContents(items),
      num_items: items.reduce((sum, item) => sum + (item.quantity || 1), 0),
      value,
      currency,
    })
  }
}

/**
 * Moyen de paiement affiché (Payment Element monté).
 * @param {{ lines?: Record<string, any>[], totalCents?: number }} order Lignes de commande
 *   (prix en **centimes**).
 */
export function trackAddPaymentInfo({ lines, totalCents } = {}) {
  if (!isAnalyticsAllowed()) return

  const items = toGa4Items(lines, toGa4ItemFromOrderLine)
  if (!items.length) return

  gtagEvent('add_payment_info', {
    currency: getCurrency(),
    value: centsToUnits(totalCents),
    items,
  })
}

/**
 * Clé de garde anti-doublon : la page de confirmation est rechargeable et atteignable par
 * retour arrière, or GA4 ne dédoublonne un `purchase` que sur son `transaction_id`.
 */
function purchaseGuardKey(orderId) {
  return `analytics_purchase_sent:${orderId}`
}

function hasSentPurchase(orderId) {
  try {
    return sessionStorage.getItem(purchaseGuardKey(orderId)) === '1'
  } catch {
    return false
  }
}

function markPurchaseSent(orderId) {
  try {
    sessionStorage.setItem(purchaseGuardKey(orderId), '1')
  } catch {
    /* mode privé : au pire un doublon, que GA4 écarte sur le transaction_id */
  }
}

/**
 * Achat confirmé. Envoie GA4, la conversion Google Ads et Meta selon les consentements.
 *
 * Le `transaction_id` est l’identifiant de commande : c’est lui qui dédoublonne cet envoi avec
 * celui du webhook Stripe (`backend/analytics/ga4MeasurementProtocol.js`).
 *
 * @param {{ orderId: string, lines?: Record<string, any>[], totalCents?: number,
 *   shippingCents?: number }} order Montants en **centimes**.
 */
export function trackPurchase({ orderId, lines, totalCents, shippingCents } = {}) {
  if (!orderId || hasSentPurchase(orderId)) return

  const analytics = isAnalyticsAllowed()
  const marketing = isMarketingAllowed()
  if (!analytics && !marketing) return

  markPurchaseSent(orderId)

  const items = toGa4Items(lines, toGa4ItemFromOrderLine)
  const currency = getCurrency()
  const value = centsToUnits(totalCents)

  if (analytics) {
    gtagEvent('purchase', {
      transaction_id: orderId,
      currency,
      value,
      shipping: centsToUnits(shippingCents || 0),
      items,
    })
  }

  if (marketing) {
    // Sans libellé d’action de conversion, Google Ads ignorerait l’envoi.
    if (GOOGLE_ADS_ID && GOOGLE_ADS_PURCHASE_LABEL) {
      gtagEvent('conversion', {
        send_to: `${GOOGLE_ADS_ID}/${GOOGLE_ADS_PURCHASE_LABEL}`,
        transaction_id: orderId,
        currency,
        value,
      })
    }
    metaTrack(
      'Purchase',
      {
        content_type: 'product',
        content_ids: toMetaContentIds(items),
        contents: toMetaContents(items),
        value,
        currency,
      },
      { eventID: orderId },
    )
  }
}

/* -------------------------------------------------------------------------- */
/* Identifiants GA4 (pour l’envoi serveur)                                     */
/* -------------------------------------------------------------------------- */

/**
 * `gtag('get', …)` répond par callback, et ne répond jamais si le script est bloqué : d’où le
 * délai de garde.
 * @param {string} field
 * @param {number} timeoutMs
 * @returns {Promise<string | null>}
 */
function readGtagField(field, timeoutMs) {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || typeof window.gtag !== 'function') {
      resolve(null)
      return
    }

    let settled = false
    const finish = (value) => {
      if (settled) return
      settled = true
      resolve(value || null)
    }

    const timer = setTimeout(() => finish(null), timeoutMs)
    try {
      window.gtag('get', GA_MEASUREMENT_ID, field, (value) => {
        clearTimeout(timer)
        finish(value)
      })
    } catch {
      clearTimeout(timer)
      finish(null)
    }
  })
}

/**
 * Identifiants de session GA4 du visiteur, transmis au backend pour que le `purchase` envoyé
 * depuis le webhook Stripe se rattache à la bonne session — sans quoi l’achat serait compté
 * mais pas attribué à sa campagne d’origine.
 *
 * Renvoie `{ clientId: null }` sans consentement : c’est cette absence qui empêche l’envoi
 * serveur pour un visiteur non consentant.
 *
 * @param {{ timeoutMs?: number }} [options]
 * @returns {Promise<{ clientId: string | null, sessionId: string | null }>}
 */
export async function getGaIdentifiers({ timeoutMs = 800 } = {}) {
  if (!GA_MEASUREMENT_ID || !isAnalyticsAllowed()) {
    return { clientId: null, sessionId: null }
  }

  const [clientId, sessionId] = await Promise.all([
    readGtagField('client_id', timeoutMs),
    readGtagField('session_id', timeoutMs),
  ])
  return { clientId, sessionId }
}
