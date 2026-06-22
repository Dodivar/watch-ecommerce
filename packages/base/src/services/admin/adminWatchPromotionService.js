import { supabase } from '../supabase'
import { getAdminSiteId } from './adminSiteContext.js'
import { getWatchesByIdsForAdmin } from './adminWatchService.js'
import {
  resolveCampaignItemPricing,
  resolveLiveCampaignStatus,
  normalizeCampaignSchedule,
  resolveEarlyCampaignTermination,
} from '@/utils/watchPromotionCampaign.js'
import { slugifyCampaignName, appendCampaignSlugSuffix } from '@/utils/campaignSlug.js'
import { invalidateMenuCampaignsCache } from '@/composables/useMenuCampaigns.js'

function mapCampaignRow(row) {
  if (!row) return null
  const mapped = {
    id: row.id,
    siteId: row.site_id,
    name: row.name,
    description: row.description,
    defaultDiscountPercent: row.default_discount_percent,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    status: row.status,
    appliedAt: row.applied_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    slug: row.slug,
    showInMenu: Boolean(row.show_in_menu),
    menuLabel: row.menu_label,
    menuOrder: row.menu_order ?? 0,
  }
  if (mapped.status !== 'draft' && mapped.status !== 'cancelled' && mapped.status !== 'ended') {
    mapped.status = resolveLiveCampaignStatus(mapped)
  }
  return mapped
}

function mapItemRow(row) {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    watchId: row.watch_id,
    discountPercent: row.discount_percent,
    promotionPrice: row.promotion_price,
    previousPromotionPrice: row.previous_promotion_price,
    previousDiscountPercent: row.previous_discount_percent,
    watch: row.watches
      ? {
          id: row.watches.id,
          name: row.watches.name,
          brand: row.watches.brand,
          model: row.watches.model,
          reference: row.watches.reference,
          price: row.watches.price,
          promotionPrice: row.watches.promotion_price,
          discountPercent: row.watches.discount_percent,
          isAvailable: row.watches.is_available,
          isSold: row.watches.is_sold,
        }
      : null,
  }
}

function resolveItemStatusOnApply(startsAt, endsAt, now = new Date()) {
  const start = startsAt ? new Date(startsAt) : now
  if (start > now) return 'scheduled'
  if (endsAt && new Date(endsAt) <= now) return 'ended'
  return 'active'
}

/**
 * @param {string} name
 * @param {string | null | undefined} [excludeCampaignId]
 */
async function resolveUniqueCampaignSlug(name, excludeCampaignId = null) {
  const siteId = getAdminSiteId()
  const base = slugifyCampaignName(name) || 'evenement'

  for (let attempt = 1; attempt <= 50; attempt += 1) {
    const candidate = appendCampaignSlugSuffix(base, attempt)
    let query = supabase
      .from('watch_promotion_campaigns')
      .select('id')
      .eq('site_id', siteId)
      .eq('slug', candidate)
      .limit(1)

    if (excludeCampaignId) {
      query = query.neq('id', excludeCampaignId)
    }

    const { data, error } = await query
    if (error) throw new Error(error.message)
    if (!data?.length) return candidate
  }

  throw new Error('Impossible de générer un identifiant URL unique pour cet événement')
}

/**
 * @returns {Promise<Array<object>>}
 */
export async function getWatchPromotionCampaignsForAdmin() {
  const siteId = getAdminSiteId()
  const { data, error } = await supabase
    .from('watch_promotion_campaigns')
    .select('*, watch_promotion_campaign_items(count)')
    .eq('site_id', siteId)
    .neq('status', 'draft')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  return (data || []).map((row) => {
    const campaign = mapCampaignRow(row)
    campaign.itemCount = row.watch_promotion_campaign_items?.[0]?.count ?? 0
    return campaign
  })
}

/**
 * @param {string} campaignId
 * @param {{ includeDraft?: boolean }} [options]
 */
export async function getWatchPromotionCampaignByIdForAdmin(campaignId, { includeDraft = true } = {}) {
  const siteId = getAdminSiteId()
  const { data, error } = await supabase
    .from('watch_promotion_campaigns')
    .select(
      `
      *,
      watch_promotion_campaign_items (
        id,
        campaign_id,
        watch_id,
        discount_percent,
        promotion_price,
        previous_promotion_price,
        previous_discount_percent,
        watches (
          id,
          name,
          brand,
          model,
          reference,
          price,
          promotion_price,
          discount_percent,
          is_available,
          is_sold
        )
      )
    `,
    )
    .eq('id', campaignId)
    .eq('site_id', siteId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null
  if (!includeDraft && data.status === 'draft') return null

  const campaign = mapCampaignRow(data)
  campaign.items = (data.watch_promotion_campaign_items || []).map(mapItemRow)
  return campaign
}

/**
 * @param {object} payload
 * @param {string} [campaignId]
 */
export async function saveWatchPromotionCampaignDraft(payload, campaignId = null) {
  const siteId = getAdminSiteId()
  const { name, defaultDiscountPercent, items, schedule } = validateWatchPromotionCampaignPayload(payload)
  const slug = await resolveUniqueCampaignSlug(name, campaignId)

  const row = {
    site_id: siteId,
    name,
    slug,
    description: String(payload.description || '').trim() || null,
    default_discount_percent: defaultDiscountPercent,
    starts_at: schedule.startsAt,
    ends_at: schedule.endsAt,
    status: 'draft',
    updated_at: new Date().toISOString(),
  }

  let savedId = campaignId

  if (campaignId) {
    const { data: existing, error: fetchError } = await supabase
      .from('watch_promotion_campaigns')
      .select('id, status')
      .eq('id', campaignId)
      .eq('site_id', siteId)
      .maybeSingle()

    if (fetchError) throw new Error(fetchError.message)
    if (!existing) throw new Error('Campagne introuvable')
    if (existing.status !== 'draft') {
      throw new Error('Seuls les brouillons peuvent être modifiés')
    }

    const { error: updateError } = await supabase
      .from('watch_promotion_campaigns')
      .update(row)
      .eq('id', campaignId)
      .eq('site_id', siteId)

    if (updateError) throw new Error(updateError.message)

    const { error: deleteItemsError } = await supabase
      .from('watch_promotion_campaign_items')
      .delete()
      .eq('campaign_id', campaignId)

    if (deleteItemsError) throw new Error(deleteItemsError.message)
  } else {
    const { data: created, error: createError } = await supabase
      .from('watch_promotion_campaigns')
      .insert(row)
      .select('id')
      .single()

    if (createError) throw new Error(createError.message)
    savedId = created.id
  }

  const itemRows = items.map((item) => {
    const discountPercent =
      item.discountPercent != null && item.discountPercent !== ''
        ? parseInt(String(item.discountPercent), 10)
        : null
    const promotionPrice =
      item.promotionPrice != null && item.promotionPrice !== ''
        ? parseFloat(String(item.promotionPrice))
        : null

    return {
      campaign_id: savedId,
      watch_id: item.watchId,
      discount_percent: Number.isFinite(discountPercent) ? discountPercent : null,
      promotion_price: Number.isFinite(promotionPrice) ? promotionPrice : null,
    }
  })

  const { error: itemsError } = await supabase.from('watch_promotion_campaign_items').insert(itemRows)
  if (itemsError) throw new Error(itemsError.message)

  return getWatchPromotionCampaignByIdForAdmin(savedId)
}

function validateWatchPromotionCampaignPayload(payload) {
  const name = String(payload.name || '').trim()
  if (!name) throw new Error('Le titre de l\'événement est requis')

  const defaultDiscountPercent = parseInt(String(payload.defaultDiscountPercent), 10)
  if (!Number.isFinite(defaultDiscountPercent) || defaultDiscountPercent < 1 || defaultDiscountPercent > 99) {
    throw new Error('La remise par défaut doit être entre 1 et 99 %')
  }

  const items = Array.isArray(payload.items) ? payload.items : []
  if (items.length === 0) {
    throw new Error('Sélectionnez au moins une montre')
  }

  const schedule = normalizeCampaignSchedule(payload.startsAt, payload.endsAt)

  return { name, defaultDiscountPercent, items, schedule }
}

/**
 * Met à jour une campagne déjà appliquée (en cours ou à venir).
 * @param {string} campaignId
 * @param {object} payload
 */
export async function updateWatchPromotionCampaign(campaignId, payload) {
  const siteId = getAdminSiteId()
  const { name, defaultDiscountPercent, items, schedule } = validateWatchPromotionCampaignPayload(payload)

  const campaign = await getWatchPromotionCampaignByIdForAdmin(campaignId, { includeDraft: false })
  if (!campaign) throw new Error('Campagne introuvable')

  const liveStatus = resolveLiveCampaignStatus(campaign)
  if (liveStatus !== 'active' && liveStatus !== 'scheduled') {
    throw new Error('Cette campagne ne peut plus être modifiée')
  }

  const now = new Date()
  if (schedule.endsAt && new Date(schedule.endsAt) <= now) {
    throw new Error('La date de fin est déjà passée')
  }

  const watchIds = items.map((item) => item.watchId)
  const watches = await getWatchesByIdsForAdmin(watchIds)
  const watchesById = new Map(watches.map((watch) => [watch.id, watch]))

  if (watchesById.size !== watchIds.length) {
    throw new Error('Une ou plusieurs montres sélectionnées sont introuvables')
  }

  for (const item of items) {
    const watch = watchesById.get(item.watchId)
    const pricing = resolveCampaignItemPricing(watch, item, defaultDiscountPercent)
    if (!pricing.promotionPrice) {
      throw new Error(`Remise invalide pour « ${watch.name} »`)
    }
  }

  const existingByWatchId = new Map((campaign.items || []).map((row) => [row.watchId, row]))
  const nextWatchIds = new Set(watchIds)

  if (liveStatus === 'active') {
    for (const existingItem of campaign.items || []) {
      if (nextWatchIds.has(existingItem.watchId)) continue

      const { error: restoreError } = await supabase
        .from('watches')
        .update({
          promotion_price: existingItem.previousPromotionPrice ?? null,
          discount_percent: existingItem.previousDiscountPercent ?? null,
        })
        .eq('id', existingItem.watchId)

      if (restoreError) throw new Error(restoreError.message)
    }
  }

  const slug = await resolveUniqueCampaignSlug(name, campaignId)
  const updatedAt = now.toISOString()

  const { error: updateError } = await supabase
    .from('watch_promotion_campaigns')
    .update({
      name,
      slug,
      description: String(payload.description || '').trim() || null,
      default_discount_percent: defaultDiscountPercent,
      starts_at: schedule.startsAt,
      ends_at: schedule.endsAt,
      updated_at: updatedAt,
    })
    .eq('id', campaignId)
    .eq('site_id', siteId)
    .in('status', ['scheduled', 'active'])

  if (updateError) throw new Error(updateError.message)

  const { error: deleteItemsError } = await supabase
    .from('watch_promotion_campaign_items')
    .delete()
    .eq('campaign_id', campaignId)

  if (deleteItemsError) throw new Error(deleteItemsError.message)

  const itemRows = items.map((item) => {
    const watch = watchesById.get(item.watchId)
    const existing = existingByWatchId.get(item.watchId)
    const discountPercent =
      item.discountPercent != null && item.discountPercent !== ''
        ? parseInt(String(item.discountPercent), 10)
        : null
    const promotionPrice =
      item.promotionPrice != null && item.promotionPrice !== ''
        ? parseFloat(String(item.promotionPrice))
        : null

    return {
      campaign_id: campaignId,
      watch_id: item.watchId,
      discount_percent: Number.isFinite(discountPercent) ? discountPercent : null,
      promotion_price: Number.isFinite(promotionPrice) ? promotionPrice : null,
      previous_promotion_price: existing
        ? existing.previousPromotionPrice ?? null
        : watch.promotion_price ?? watch.promotionPrice ?? null,
      previous_discount_percent: existing
        ? existing.previousDiscountPercent ?? null
        : watch.discount_percent ?? watch.discountPercent ?? null,
    }
  })

  const { error: itemsError } = await supabase.from('watch_promotion_campaign_items').insert(itemRows)
  if (itemsError) throw new Error(itemsError.message)

  if (liveStatus === 'active') {
    for (const item of items) {
      const watch = watchesById.get(item.watchId)
      const pricing = resolveCampaignItemPricing(watch, item, defaultDiscountPercent)
      const { error: watchUpdateError } = await supabase
        .from('watches')
        .update({
          promotion_price: pricing.promotionPrice,
          discount_percent: pricing.discountPercent,
        })
        .eq('id', item.watchId)

      if (watchUpdateError) throw new Error(watchUpdateError.message)
    }
  }

  invalidateMenuCampaignsCache()
  return getWatchPromotionCampaignByIdForAdmin(campaignId, { includeDraft: false })
}

/**
 * @param {string} campaignId
 */
export async function cancelWatchPromotionCampaignDraft(campaignId) {
  const siteId = getAdminSiteId()
  const { data: existing, error: fetchError } = await supabase
    .from('watch_promotion_campaigns')
    .select('id, status')
    .eq('id', campaignId)
    .eq('site_id', siteId)
    .maybeSingle()

  if (fetchError) throw new Error(fetchError.message)
  if (!existing) throw new Error('Campagne introuvable')
  if (existing.status !== 'draft') {
    throw new Error('Seuls les brouillons peuvent être annulés depuis cette page')
  }

  const { error } = await supabase
    .from('watch_promotion_campaigns')
    .delete()
    .eq('id', campaignId)
    .eq('site_id', siteId)

  if (error) throw new Error(error.message)
  return { success: true }
}

/**
 * Valide et active une campagne brouillon.
 * @param {string} campaignId
 */
export async function applyWatchPromotionCampaign(campaignId) {
  const siteId = getAdminSiteId()
  const campaign = await getWatchPromotionCampaignByIdForAdmin(campaignId)
  if (!campaign) throw new Error('Campagne introuvable')
  if (campaign.status !== 'draft') {
    throw new Error('Cette campagne a déjà été appliquée ou n\'est plus un brouillon')
  }
  if (!campaign.items?.length) {
    throw new Error('Aucune montre sélectionnée')
  }

  const now = new Date()
  if (campaign.endsAt && new Date(campaign.endsAt) <= now) {
    throw new Error('La date de fin est déjà passée')
  }

  for (const item of campaign.items) {
    const watch = item.watch
    if (!watch) throw new Error('Une montre sélectionnée est introuvable')
    const pricing = resolveCampaignItemPricing(watch, item, campaign.defaultDiscountPercent)
    if (!pricing.promotionPrice) {
      throw new Error(`Remise invalide pour « ${watch.name} »`)
    }
  }

  for (const item of campaign.items) {
    const watch = item.watch
    const { error: itemUpdateError } = await supabase
      .from('watch_promotion_campaign_items')
      .update({
        previous_promotion_price: watch.promotionPrice ?? null,
        previous_discount_percent: watch.discountPercent ?? null,
      })
      .eq('id', item.id)

    if (itemUpdateError) throw new Error(itemUpdateError.message)
  }

  const nextStatus = resolveItemStatusOnApply(campaign.startsAt, campaign.endsAt, now)

  if (nextStatus === 'active') {
    for (const item of campaign.items) {
      const watch = item.watch
      const pricing = resolveCampaignItemPricing(watch, item, campaign.defaultDiscountPercent)
      const { error: watchUpdateError } = await supabase
        .from('watches')
        .update({
          promotion_price: pricing.promotionPrice,
          discount_percent: pricing.discountPercent,
        })
        .eq('id', watch.id)

      if (watchUpdateError) throw new Error(watchUpdateError.message)
    }
  }

  const { error: updateError } = await supabase
    .from('watch_promotion_campaigns')
    .update({
      status: nextStatus,
      applied_at: now.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq('id', campaignId)
    .eq('site_id', siteId)
    .eq('status', 'draft')

  if (updateError) throw new Error(updateError.message)

  invalidateMenuCampaignsCache()
  return getWatchPromotionCampaignByIdForAdmin(campaignId, { includeDraft: false })
}

/**
 * @param {string} campaignId
 */
export async function endWatchPromotionCampaignEarly(campaignId) {
  const siteId = getAdminSiteId()
  const campaign = await getWatchPromotionCampaignByIdForAdmin(campaignId, { includeDraft: false })
  if (!campaign) throw new Error('Campagne introuvable')

  const liveStatus = resolveLiveCampaignStatus(campaign)
  if (liveStatus !== 'active' && liveStatus !== 'scheduled') {
    throw new Error('Cette campagne ne peut plus être terminée')
  }

  const termination = resolveEarlyCampaignTermination(campaign)
  const now = new Date().toISOString()

  for (const item of campaign.items || []) {
    const { error: watchRestoreError } = await supabase
      .from('watches')
      .update({
        promotion_price: item.previousPromotionPrice ?? null,
        discount_percent: item.previousDiscountPercent ?? null,
      })
      .eq('id', item.watchId)

    if (watchRestoreError) throw new Error(watchRestoreError.message)
  }

  const { error } = await supabase
    .from('watch_promotion_campaigns')
    .update({
      status: termination.status,
      ends_at: termination.endsAt,
      updated_at: now,
    })
    .eq('id', campaignId)
    .eq('site_id', siteId)
    .in('status', ['scheduled', 'active'])

  if (error) throw new Error(error.message)
  invalidateMenuCampaignsCache()
  return { success: true, status: termination.status }
}

/**
 * Campagnes configurables dans le menu (hors brouillons / annulées).
 * @returns {Promise<Array<object>>}
 */
export async function getWatchPromotionMenuConfigForAdmin() {
  const siteId = getAdminSiteId()
  const { data, error } = await supabase
    .from('watch_promotion_campaigns')
    .select('id, name, slug, status, starts_at, ends_at, show_in_menu, menu_label, menu_order')
    .eq('site_id', siteId)
    .not('status', 'in', '("draft","cancelled")')
    .order('menu_order', { ascending: true })
    .order('starts_at', { ascending: false })

  if (error) throw new Error(error.message)

  return (data || []).map((row) => {
    const campaign = mapCampaignRow(row)
    campaign.liveStatus = resolveLiveCampaignStatus(campaign)
    return campaign
  })
}

/**
 * @param {Array<{ id: string, showInMenu?: boolean, menuLabel?: string | null, menuOrder?: number }>} entries
 */
export async function saveWatchPromotionMenuConfig(entries) {
  const siteId = getAdminSiteId()
  if (!Array.isArray(entries) || entries.length === 0) {
    return { success: true }
  }

  const now = new Date().toISOString()

  for (const entry of entries) {
    if (!entry?.id) continue

    let showInMenu = Boolean(entry.showInMenu)
    const menuLabel = String(entry.menuLabel ?? '').trim() || null
    const menuOrder = Number.isFinite(entry.menuOrder) ? Math.floor(entry.menuOrder) : 0
    const liveStatus = entry.liveStatus || resolveLiveCampaignStatus(entry)

    if (showInMenu && liveStatus !== 'active' && liveStatus !== 'scheduled') {
      showInMenu = false
    }

    if (showInMenu && liveStatus === 'scheduled') {
      // Pré-configuration autorisée ; le lien n'apparaît qu'une fois l'événement actif.
    }

    const { error } = await supabase
      .from('watch_promotion_campaigns')
      .update({
        show_in_menu: showInMenu,
        menu_label: menuLabel,
        menu_order: menuOrder,
        updated_at: now,
      })
      .eq('id', entry.id)
      .eq('site_id', siteId)

    if (error) throw new Error(error.message)
  }

  invalidateMenuCampaignsCache()
  return { success: true }
}

/**
 * Campagnes actives pour le carrousel d'accueil.
 * @returns {Promise<Array<{ id: string, name: string, slug: string }>>}
 */
export async function getActiveWatchPromotionCampaignsForCarousel() {
  const siteId = getAdminSiteId()
  const { data, error } = await supabase
    .from('watch_promotion_campaigns')
    .select('id, name, slug, starts_at, ends_at, status')
    .eq('site_id', siteId)
    .in('status', ['scheduled', 'active'])
    .order('starts_at', { ascending: false })

  if (error) throw new Error(error.message)

  return (data || [])
    .map(mapCampaignRow)
    .filter((campaign) => resolveLiveCampaignStatus(campaign) === 'active' && campaign.slug)
    .map(({ id, name, slug }) => ({ id, name, slug }))
}

export async function getWatchPromotionDraftsForAdmin() {
  const siteId = getAdminSiteId()
  const { data, error } = await supabase
    .from('watch_promotion_campaigns')
    .select('*, watch_promotion_campaign_items(count)')
    .eq('site_id', siteId)
    .eq('status', 'draft')
    .order('updated_at', { ascending: false })

  if (error) throw new Error(error.message)

  return (data || []).map((row) => {
    const campaign = mapCampaignRow(row)
    campaign.itemCount = row.watch_promotion_campaign_items?.[0]?.count ?? 0
    return campaign
  })
}
