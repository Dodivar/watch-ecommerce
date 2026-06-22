import { supabase } from './supabase'
import { getSiteConfig } from '@/site/getSiteConfig.js'
import { resolveLiveCampaignStatus } from '@/utils/watchPromotionCampaign.js'
import { isValidCampaignSlug } from '@/utils/campaignSlug.js'

function getPublicSiteId() {
  return getSiteConfig().siteId
}

function mapPublicCampaignRow(row) {
  if (!row) return null
  const campaign = {
    id: row.id,
    name: row.name,
    slug: row.slug,
    menuLabel: row.menu_label,
    menuOrder: row.menu_order ?? 0,
    showInMenu: Boolean(row.show_in_menu),
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    status: row.status,
  }
  if (campaign.status !== 'draft' && campaign.status !== 'cancelled' && campaign.status !== 'ended') {
    campaign.status = resolveLiveCampaignStatus(campaign)
  }
  return campaign
}

/**
 * Campagnes actives visibles dans le menu (show_in_menu + status live active).
 * @returns {Promise<Array<{ label: string, to: string, slug: string, name: string }>>}
 */
export async function getMenuCampaignLinksPublic() {
  const siteId = getPublicSiteId()
  const { data, error } = await supabase
    .from('watch_promotion_campaigns')
    .select('id, name, slug, menu_label, menu_order, show_in_menu, starts_at, ends_at, status')
    .eq('site_id', siteId)
    .eq('show_in_menu', true)
    .in('status', ['scheduled', 'active'])
    .order('menu_order', { ascending: true })
    .order('starts_at', { ascending: false })

  if (error) {
    console.warn('getMenuCampaignLinksPublic:', error.message)
    return []
  }

  return (data || [])
    .map(mapPublicCampaignRow)
    .filter((campaign) => campaign?.status === 'active' && campaign.slug)
    .map((campaign) => ({
      slug: campaign.slug,
      name: campaign.name,
      label: campaign.menuLabel?.trim() || campaign.name,
      to: buildCampaignCollectionQuery(campaign.slug),
    }))
}

/**
 * Campagnes actives pour sélection carrousel admin / public.
 * @returns {Promise<Array<{ id: string, name: string, slug: string }>>}
 */
export async function getActiveCampaignsPublic() {
  const siteId = getPublicSiteId()
  const { data, error } = await supabase
    .from('watch_promotion_campaigns')
    .select('id, name, slug, starts_at, ends_at, status')
    .eq('site_id', siteId)
    .in('status', ['scheduled', 'active'])
    .order('starts_at', { ascending: false })

  if (error) {
    console.warn('getActiveCampaignsPublic:', error.message)
    return []
  }

  return (data || [])
    .map(mapPublicCampaignRow)
    .filter((campaign) => campaign?.status === 'active' && campaign.slug)
    .map(({ id, name, slug }) => ({ id, name, slug }))
}

/**
 * @param {string} slug
 * @returns {Promise<{ id: string, name: string, slug: string, watchIds: string[] } | null>}
 */
export async function getActiveCampaignBySlugPublic(slug) {
  if (!isValidCampaignSlug(slug)) return null

  const siteId = getPublicSiteId()
  const { data, error } = await supabase
    .from('watch_promotion_campaigns')
    .select(
      `
      id,
      name,
      slug,
      starts_at,
      ends_at,
      status,
      watch_promotion_campaign_items ( watch_id )
    `,
    )
    .eq('site_id', siteId)
    .eq('slug', slug)
    .maybeSingle()

  if (error) {
    console.warn('getActiveCampaignBySlugPublic:', error.message)
    return null
  }

  if (!data) return null

  const campaign = mapPublicCampaignRow(data)
  if (campaign?.status !== 'active') return null

  const watchIds = (data.watch_promotion_campaign_items || [])
    .map((item) => item.watch_id)
    .filter(Boolean)

  return {
    id: campaign.id,
    name: campaign.name,
    slug: campaign.slug,
    watchIds,
  }
}

/**
 * Tarifs promotionnels des campagnes actives, indexés par watch_id.
 * En cas de chevauchement, la campagne la plus récente (starts_at) l'emporte.
 * @returns {Promise<Map<string, { item: { discountPercent: number | null, promotionPrice: number | null }, defaultDiscountPercent: number }>>}
 */
export async function getActiveCampaignWatchPricingPublic() {
  const siteId = getPublicSiteId()
  const { data, error } = await supabase
    .from('watch_promotion_campaigns')
    .select(
      `
      id,
      default_discount_percent,
      starts_at,
      ends_at,
      status,
      watch_promotion_campaign_items (
        watch_id,
        discount_percent,
        promotion_price
      )
    `,
    )
    .eq('site_id', siteId)
    .in('status', ['scheduled', 'active'])
    .order('starts_at', { ascending: false })

  if (error) {
    console.warn('getActiveCampaignWatchPricingPublic:', error.message)
    return new Map()
  }

  /** @type {Map<string, { item: object, defaultDiscountPercent: number }>} */
  const pricingByWatchId = new Map()

  for (const row of data || []) {
    const campaign = mapPublicCampaignRow(row)
    if (campaign?.status !== 'active') continue

    for (const item of row.watch_promotion_campaign_items || []) {
      if (!item.watch_id || pricingByWatchId.has(item.watch_id)) continue

      pricingByWatchId.set(item.watch_id, {
        item: {
          discountPercent: item.discount_percent,
          promotionPrice: item.promotion_price,
        },
        defaultDiscountPercent: row.default_discount_percent,
      })
    }
  }

  return pricingByWatchId
}

/**
 * @param {string} campaignId
 */
export async function getActiveCampaignByIdPublic(campaignId) {
  if (!campaignId) return null

  const siteId = getPublicSiteId()
  const { data, error } = await supabase
    .from('watch_promotion_campaigns')
    .select('id, name, slug, starts_at, ends_at, status')
    .eq('site_id', siteId)
    .eq('id', campaignId)
    .maybeSingle()

  if (error) {
    console.warn('getActiveCampaignByIdPublic:', error.message)
    return null
  }

  const campaign = mapPublicCampaignRow(data)
  if (campaign?.status !== 'active') return null
  return campaign
}

/**
 * @param {string} slug
 * @param {Record<string, string>} [extraQuery]
 */
export function buildCampaignCollectionQuery(slug, extraQuery = {}) {
  const query = { event: slug, ...extraQuery }
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value != null && value !== '') params.set(key, String(value))
  }
  const qs = params.toString()
  return qs ? `/collection?${qs}` : '/collection'
}
