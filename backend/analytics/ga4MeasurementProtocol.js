/**
 * Envoi serveur de l'achat à GA4 (Measurement Protocol).
 *
 * Pourquoi doubler l'envoi navigateur : le retour depuis Stripe n'est pas garanti (onglet
 * fermé, 3-D Secure validé plus tard, bloqueur de publicité). Sans envoi serveur, une part du
 * chiffre d'affaires n'est jamais attribuée — soit exactement ce qu'on cherche à mesurer.
 *
 * Le dédoublonnage repose sur `transaction_id` : le client et le webhook envoient le même
 * identifiant de commande, GA4 n'en retient qu'un.
 *
 * RGPD : `clientId` provient de `gtag('get', …)` côté navigateur et n'existe donc que si le
 * visiteur a consenti à la mesure d'audience. Son absence coupe l'envoi — un `purchase`
 * serveur pour un visiteur ayant refusé serait précisément le manquement à éviter.
 */

const MP_ENDPOINT = 'https://www.google-analytics.com/mp/collect'

/** @param {unknown} cents */
function centsToUnits(cents) {
  const n = Number(cents)
  if (!Number.isFinite(n)) return 0
  return Math.round(n) / 100
}

/** @param {unknown} value */
function text(value) {
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

/**
 * Lignes de commande Supabase (`order_lines`, snake_case, montants en centimes) → `items` GA4.
 * @param {Record<string, any>[]} lines
 */
function toItems(lines) {
  if (!Array.isArray(lines)) return []
  return lines.map((line, index) => {
    const item = {
      item_id: text(line.reference) || text(line.watch_id),
      item_name: text(line.name),
      price: centsToUnits(line.unit_price_cents),
      quantity: Math.max(1, Number(line.quantity) || 1),
      index,
    }
    if (!item.item_id) item.item_id = item.item_name
    return item
  })
}

/**
 * Construit le corps de la requête Measurement Protocol.
 * Exporté pour les tests : c'est la partie qui mérite d'être vérifiée.
 *
 * @param {{ orderId: string, currency?: string, totalCents?: number, shippingCents?: number,
 *   lines?: Record<string, any>[], clientId: string, sessionId?: string|null }} params
 */
function buildPurchasePayload({
  orderId,
  currency,
  totalCents,
  shippingCents,
  lines,
  clientId,
  sessionId,
}) {
  const params = {
    transaction_id: orderId,
    currency: (currency || 'EUR').toUpperCase(),
    value: centsToUnits(totalCents),
    shipping: centsToUnits(shippingCents || 0),
    items: toItems(lines),
    // Sans durée d'engagement, GA4 rattache l'événement à une session vide.
    engagement_time_msec: 1,
  }
  if (sessionId) {
    params.session_id = String(sessionId)
  }

  return {
    client_id: clientId,
    non_personalized_ads: false,
    events: [{ name: 'purchase', params }],
  }
}

/**
 * Envoie l'achat à GA4. Ne lève jamais : l'appelant est un webhook Stripe dont l'échec
 * provoquerait un rejeu et masquerait de vraies erreurs de fulfillment.
 *
 * @param {{
 *   site: { id: string, secrets?: { analytics?: { ga4MeasurementId?: string|null, ga4ApiSecret?: string|null } } },
 *   orderId: string,
 *   currency?: string,
 *   totalCents?: number,
 *   shippingCents?: number,
 *   lines?: Record<string, any>[],
 *   clientId?: string|null,
 *   sessionId?: string|null,
 *   debug?: boolean,
 * }} params
 * @returns {Promise<{ sent: boolean, reason?: string }>}
 */
async function sendPurchase({
  site,
  orderId,
  currency,
  totalCents,
  shippingCents,
  lines,
  clientId,
  sessionId,
  debug = false,
}) {
  if (!clientId) {
    // Pas de consentement mesure d'audience, ou gtag bloqué : on n'envoie rien.
    return { sent: false, reason: 'no_client_id' }
  }
  if (!orderId) {
    return { sent: false, reason: 'no_order_id' }
  }

  const measurementId = site?.secrets?.analytics?.ga4MeasurementId
  const apiSecret = site?.secrets?.analytics?.ga4ApiSecret
  if (!measurementId || !apiSecret) {
    return { sent: false, reason: 'not_configured' }
  }

  const payload = buildPurchasePayload({
    orderId,
    currency,
    totalCents,
    shippingCents,
    lines,
    clientId,
    sessionId,
  })

  const query = new URLSearchParams({
    measurement_id: measurementId,
    api_secret: apiSecret,
  })
  const url = `${MP_ENDPOINT}${debug ? '/debug' : ''}?${query.toString()}`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    // Le Measurement Protocol répond 204 sans corps même pour un payload invalide :
    // l'endpoint `/debug` est le seul moyen de valider la forme (voir documentation).
    if (!response.ok) {
      console.error(
        `[${site.id}] GA4 Measurement Protocol : réponse ${response.status} pour la commande ${orderId}`,
      )
      return { sent: false, reason: `http_${response.status}` }
    }
    return { sent: true }
  } catch (err) {
    console.error(`[${site.id}] GA4 Measurement Protocol (commande ${orderId}) :`, err.message)
    return { sent: false, reason: 'network_error' }
  }
}

module.exports = { sendPurchase, buildPurchasePayload }
