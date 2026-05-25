import { supabase } from '../supabase'
import { getAdminSiteId } from './adminSiteContext.js'

/**
 * @param {object} row
 */
function mapPromoRow(row) {
  return {
    id: row.id,
    siteId: row.site_id,
    code: row.code,
    active: row.active,
    discountType: row.discount_type,
    discountValue: row.discount_value,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    maxUses: row.max_uses,
    usedCount: row.used_count ?? 0,
    createdAt: row.created_at,
  }
}

export async function getPromoCodesForAdmin() {
  const siteId = getAdminSiteId()
  const { data, error } = await supabase
    .from('promo_codes')
    .select('*')
    .or(`site_id.is.null,site_id.eq.${siteId}`)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data || []).map(mapPromoRow)
}

/**
 * @param {string} promoId
 */
export async function getPromoCodeByIdForAdmin(promoId) {
  const siteId = getAdminSiteId()
  const { data, error } = await supabase
    .from('promo_codes')
    .select('*')
    .eq('id', promoId)
    .or(`site_id.is.null,site_id.eq.${siteId}`)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data ? mapPromoRow(data) : null
}

/**
 * @param {object} promo
 */
export async function createPromoCode(promo) {
  const siteId = getAdminSiteId()
  const code = String(promo.code || '')
    .trim()
    .toUpperCase()
  if (!code) throw new Error('Code promo requis')

  const { data, error } = await supabase
    .from('promo_codes')
    .insert({
      site_id: siteId,
      code,
      active: promo.active !== false,
      discount_type: promo.discountType,
      discount_value: promo.discountValue,
      starts_at: promo.startsAt || null,
      ends_at: promo.endsAt || null,
      max_uses: promo.maxUses ?? null,
      used_count: 0,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return mapPromoRow(data)
}

/**
 * @param {string} promoId
 * @param {object} promo
 */
export async function updatePromoCode(promoId, promo) {
  const siteId = getAdminSiteId()
  const { error } = await supabase
    .from('promo_codes')
    .update({
      code: String(promo.code || '')
        .trim()
        .toUpperCase(),
      active: promo.active !== false,
      discount_type: promo.discountType,
      discount_value: promo.discountValue,
      starts_at: promo.startsAt || null,
      ends_at: promo.endsAt || null,
      max_uses: promo.maxUses ?? null,
    })
    .eq('id', promoId)
    .eq('site_id', siteId)

  if (error) throw new Error(error.message)
  return { success: true }
}

/**
 * @param {string} promoId
 */
export async function deletePromoCode(promoId) {
  const siteId = getAdminSiteId()
  const { error } = await supabase.from('promo_codes').delete().eq('id', promoId).eq('site_id', siteId)
  if (error) throw new Error(error.message)
  return { success: true }
}
