/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} siteId
 * @param {string} codeRaw
 * @returns {Promise<{ ok: true, promo: object } | { ok: false, error: string }>}
 */
async function loadPromoCode(supabase, siteId, codeRaw) {
  const code = String(codeRaw || '')
    .trim()
    .toUpperCase()
  if (!code) {
    return { ok: false, error: 'Code promo invalide' }
  }

  const { data, error } = await supabase
    .from('promo_codes')
    .select('*')
    .eq('code', code)
    .or(`site_id.is.null,site_id.eq.${siteId}`)
    .maybeSingle()

  if (error) {
    console.error('loadPromoCode:', error)
    return { ok: false, error: 'Impossible de valider le code promo' }
  }
  if (!data || !data.active) {
    return { ok: false, error: 'Code promo invalide' }
  }

  const now = new Date()
  if (data.starts_at && new Date(data.starts_at) > now) {
    return { ok: false, error: 'Code promo invalide' }
  }
  if (data.ends_at && new Date(data.ends_at) < now) {
    return { ok: false, error: 'Code promo invalide' }
  }
  if (data.max_uses != null && data.used_count >= data.max_uses) {
    return { ok: false, error: 'Code promo invalide' }
  }

  return { ok: true, promo: data }
}

/**
 * @param {object} promo
 * @param {number} subtotalCents
 * @param {number} shippingCents
 * @returns {number}
 */
function computeDiscountCents(promo, subtotalCents, shippingCents) {
  if (!promo) return 0
  const type = promo.discount_type
  if (type === 'free_shipping') {
    return shippingCents
  }
  if (type === 'fixed') {
    return Math.min(subtotalCents, Math.round(Number(promo.discount_value) * 100))
  }
  if (type === 'percent') {
    const pct = Number(promo.discount_value) || 0
    let discount = Math.round((subtotalCents * pct) / 100)
    if (promo.max_discount_cents != null) {
      discount = Math.min(discount, promo.max_discount_cents)
    }
    return Math.min(subtotalCents, discount)
  }
  return 0
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {object} promo
 * @param {number} subtotalCents
 * @param {string|null} customerEmail
 * @returns {Promise<{ ok: true } | { ok: false, error: string }>}
 */
async function validatePromoEligibility(supabase, promo, subtotalCents, customerEmail) {
  if (subtotalCents < (promo.min_subtotal_cents || 0)) {
    return { ok: false, error: 'Code promo invalide' }
  }
  if (customerEmail) {
    const { count, error } = await supabase
      .from('promo_redemptions')
      .select('id', { count: 'exact', head: true })
      .eq('promo_code_id', promo.id)
      .eq('customer_email', customerEmail)
    if (error) {
      console.error('validatePromoEligibility:', error)
      return { ok: false, error: 'Impossible de valider le code promo' }
    }
    if (count && count > 0) {
      return { ok: false, error: 'Code promo invalide' }
    }
  }
  return { ok: true }
}

module.exports = {
  loadPromoCode,
  computeDiscountCents,
  validatePromoEligibility,
}
