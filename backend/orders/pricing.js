const {
  findShippingMethod,
  computeShippingCents,
} = require('./shipping')
const { loadPromoCode, computeDiscountCents, validatePromoEligibility } = require('./promo')

/**
 * @param {{ unit_price_cents: number, quantity: number }[]} orderLines
 * @returns {number}
 */
function sumSubtotalCents(orderLines) {
  return orderLines.reduce((s, l) => s + l.unit_price_cents * l.quantity, 0)
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {object} params
 * @returns {Promise<object>}
 */
async function buildOrderQuote(supabase, params) {
  const {
    siteId,
    checkoutConfig,
    orderLines,
    shippingMethodId,
    shippingCentsOverride,
    promoCode,
    customerEmail,
    country,
  } = params

  const subtotalCents = sumSubtotalCents(orderLines)

  let shippingCents = 0
  let shippingSnapshot = null
  if (shippingMethodId) {
    const method = findShippingMethod(checkoutConfig, shippingMethodId)
    if (method) {
      shippingCents =
        shippingCentsOverride != null
          ? shippingCentsOverride
          : computeShippingCents(method, subtotalCents, checkoutConfig)
      shippingSnapshot = {
        method_id: method.id,
        method_type: method.type,
        method_label: method.label,
        shipping_cents: shippingCents,
        metadata: method.pickupLocation ? { pickupLocation: method.pickupLocation } : null,
      }
    }
  }

  let discountCents = 0
  let discountSnapshot = null
  if (promoCode && checkoutConfig?.promo?.enabled !== false) {
    const loaded = await loadPromoCode(supabase, siteId, promoCode)
    if (loaded.ok) {
      const eligible = await validatePromoEligibility(
        supabase,
        loaded.promo,
        subtotalCents,
        customerEmail,
      )
      if (eligible.ok) {
        discountCents = computeDiscountCents(loaded.promo, subtotalCents, shippingCents)
        discountSnapshot = {
          promo_code: loaded.promo.code,
          discount_type: loaded.promo.discount_type,
          discount_cents: discountCents,
          metadata: { promo_code_id: loaded.promo.id },
        }
      }
    }
  }

  const totalCents = Math.max(0, subtotalCents + shippingCents - discountCents)

  return {
    subtotalCents,
    shippingCents,
    discountCents,
    totalCents,
    shippingSnapshot,
    discountSnapshot,
  }
}

module.exports = {
  sumSubtotalCents,
  buildOrderQuote,
}
