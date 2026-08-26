/**
 * Construction des liens vitrine envoyés par email (reprise de panier, suivi de
 * commande). Aucun `req` disponible depuis un webhook ou le planificateur de
 * relance : la base publique vient toujours de `site.config.urls`.
 */

/**
 * @param {object} site
 * @returns {string}
 */
function resolveStorefrontBase(site) {
  const urls = site.config?.urls || {}
  const base = urls.production || urls.staging || urls.development || ''
  return String(base).replace(/\/+$/, '')
}

/**
 * @param {object} site
 * @param {string} orderId
 * @param {string} token
 * @returns {string}
 */
function buildResumeCheckoutUrl(site, orderId, token) {
  const params = new URLSearchParams({ order: String(orderId), token })
  return `${resolveStorefrontBase(site)}/checkout?${params.toString()}`
}

/**
 * Lien durable de suivi de commande, envoyé dans l'email de confirmation.
 * Renvoie `null` si le site n'expose aucune URL publique : mieux vaut un email
 * sans lien qu'un email avec un lien mort.
 * @param {object} site
 * @param {string} orderId
 * @param {string} token
 * @returns {string|null}
 */
function buildOrderFollowUpUrl(site, orderId, token) {
  const base = resolveStorefrontBase(site)
  if (!base || !token) return null
  const params = new URLSearchParams({ order: String(orderId), token })
  return `${base}/commande/suivi?${params.toString()}`
}

module.exports = {
  resolveStorefrontBase,
  buildResumeCheckoutUrl,
  buildOrderFollowUpUrl,
}
