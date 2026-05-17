/**
 * @param {object} checkoutConfig
 * @param {string} country ISO2
 * @returns {object[]}
 */
function getAvailableShippingMethods(checkoutConfig, country) {
  const methods = checkoutConfig?.shipping?.methods || []
  const cc = String(country || checkoutConfig?.shipping?.defaultCountry || 'FR')
    .trim()
    .toUpperCase()
  return methods.filter((m) => {
    if (!m || !m.id) return false
    if (m.type === 'pickup') return true
    const countries = m.countries
    if (!Array.isArray(countries) || countries.length === 0) return true
    return countries.map((c) => String(c).toUpperCase()).includes(cc)
  })
}

/**
 * @param {object} method
 * @param {number} subtotalCents
 * @param {object} checkoutConfig
 * @returns {number}
 */
function computeShippingCents(method, subtotalCents, checkoutConfig) {
  if (!method) return 0
  const fee = method.fee || { type: 'flat', amount: 0 }
  const globalFreeFrom = checkoutConfig?.shipping?.freeShippingFrom
  const subtotalEur = subtotalCents / 100

  if (fee.type === 'free_above') {
    const threshold = fee.freeAbove ?? globalFreeFrom
    if (threshold != null && subtotalEur >= Number(threshold)) {
      return 0
    }
    return Math.round(Number(fee.amount || 0) * 100)
  }

  if (fee.type === 'flat') {
    if (globalFreeFrom != null && subtotalEur >= Number(globalFreeFrom)) {
      return 0
    }
    return Math.round(Number(fee.amount || 0) * 100)
  }

  return 0
}

/**
 * @param {object} checkoutConfig
 * @param {string} methodId
 * @returns {object|null}
 */
function findShippingMethod(checkoutConfig, methodId) {
  const methods = checkoutConfig?.shipping?.methods || []
  return methods.find((m) => m.id === methodId) || null
}

/**
 * @param {object} address
 * @returns {{ ok: true } | { ok: false, error: string }}
 */
function validateHomeAddress(address) {
  if (!address || typeof address !== 'object') {
    return { ok: false, error: 'Adresse de livraison requise' }
  }
  const required = ['firstName', 'lastName', 'line1', 'postalCode', 'city', 'country']
  for (const key of required) {
    if (!String(address[key] || '').trim()) {
      return { ok: false, error: 'Adresse de livraison incomplète' }
    }
  }
  return { ok: true }
}

module.exports = {
  getAvailableShippingMethods,
  computeShippingCents,
  findShippingMethod,
  validateHomeAddress,
}
