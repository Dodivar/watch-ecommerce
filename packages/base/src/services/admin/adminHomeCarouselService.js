import { supabase } from '../supabase'
import { getAdminSiteId } from './adminSiteContext.js'
import { getActiveWatchPromotionCampaignsForCarousel } from './adminWatchPromotionService.js'

const BUCKET = 'home-carousel'

/**
 * @returns {Promise<Array>}
 */
export async function getHomeCarouselSlidesForAdmin() {
  const siteId = getAdminSiteId()
  const { data, error } = await supabase
    .from('home_carousel_slides')
    .select('*')
    .eq('site_id', siteId)
    .order('display_order', { ascending: true })

  if (error) throw new Error(error.message)
  return data || []
}

/**
 * Slides publiques pour le carrousel d'accueil.
 * @returns {Promise<Array>}
 */
export async function getHomeCarouselSlidesPublic() {
  const siteId = getAdminSiteId()
  const { data, error } = await supabase
    .from('home_carousel_slides')
    .select(
      'id, image_url, image_path, alt_text, brand_name, watch_id, promotion_campaign_id, display_order, watches(id, slug, brand, name, reference), watch_promotion_campaigns(id, slug, name, starts_at, ends_at, status)',
    )
    .eq('site_id', siteId)
    .order('display_order', { ascending: true })

  if (error) {
    console.warn('getHomeCarouselSlidesPublic:', error.message)
    return []
  }

  return (data || []).map((row) => ({
    ...row,
    image_url: resolveSlideImageUrl(row),
    watch: row.watches ?? null,
    watches: undefined,
    promotion_campaign: row.watch_promotion_campaigns ?? null,
    watch_promotion_campaigns: undefined,
  }))
}

/**
 * @param {{ image_path?: string, image_url?: string }} row
 * @returns {string|null}
 */
function resolveSlideImageUrl(row) {
  if (row?.image_url) return row.image_url
  if (row?.image_path) {
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(row.image_path)
    return data.publicUrl
  }
  return null
}

/**
 * @param {File} imageFile
 * @param {{ altText?: string, brandName?: string, watchId?: string | null, promotionCampaignId?: string | null }} [meta]
 */
export async function uploadHomeCarouselSlide(imageFile, meta = {}) {
  const siteId = getAdminSiteId()
  const fileExt = imageFile.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
  const filePath = `${siteId}/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, imageFile, {
      cacheControl: '3600',
      upsert: false,
    })

  if (uploadError) {
    throw new Error(`Erreur lors de l'upload : ${uploadError.message}`)
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(filePath)

  const { data: maxRow } = await supabase
    .from('home_carousel_slides')
    .select('display_order')
    .eq('site_id', siteId)
    .order('display_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  const displayOrder = (maxRow?.display_order ?? -1) + 1

  const { data, error } = await supabase
    .from('home_carousel_slides')
    .insert({
      site_id: siteId,
      image_path: filePath,
      image_url: publicUrl,
      alt_text: meta.altText?.trim() || null,
      brand_name: meta.brandName?.trim() || null,
      watch_id: meta.watchId?.trim() || null,
      promotion_campaign_id: meta.promotionCampaignId?.trim() || null,
      display_order: displayOrder,
    })
    .select()
    .single()

  if (error) {
    await supabase.storage.from(BUCKET).remove([filePath])
    throw new Error(error.message)
  }

  return { success: true, data }
}

/**
 * @param {string} slideId
 * @param {{ altText?: string, brandName?: string | null, watchId?: string | null, promotionCampaignId?: string | null }} patch
 */
export async function updateHomeCarouselSlide(slideId, patch) {
  const siteId = getAdminSiteId()
  const updates = { updated_at: new Date().toISOString() }

  if (patch.altText !== undefined) {
    updates.alt_text = patch.altText?.trim() || null
  }
  if (patch.brandName !== undefined) {
    updates.brand_name = patch.brandName?.trim() || null
  }
  if (patch.watchId !== undefined) {
    updates.watch_id = patch.watchId?.trim() || null
  }
  if (patch.promotionCampaignId !== undefined) {
    updates.promotion_campaign_id = patch.promotionCampaignId?.trim() || null
  }

  const { error } = await supabase
    .from('home_carousel_slides')
    .update(updates)
    .eq('id', slideId)
    .eq('site_id', siteId)

  if (error) throw new Error(error.message)
  return { success: true }
}

/**
 * @param {string} slideId
 */
export async function deleteHomeCarouselSlide(slideId) {
  const siteId = getAdminSiteId()

  const { data: row, error: fetchError } = await supabase
    .from('home_carousel_slides')
    .select('image_path')
    .eq('id', slideId)
    .eq('site_id', siteId)
    .single()

  if (fetchError) throw new Error(fetchError.message)

  const { error } = await supabase
    .from('home_carousel_slides')
    .delete()
    .eq('id', slideId)
    .eq('site_id', siteId)

  if (error) throw new Error(error.message)

  if (row?.image_path) {
    await supabase.storage.from(BUCKET).remove([row.image_path])
  }

  return { success: true }
}

/**
 * @param {Array<{ id: string, display_order: number }>} slideOrders
 */
export async function reorderHomeCarouselSlides(slideOrders) {
  const siteId = getAdminSiteId()
  const results = await Promise.all(
    slideOrders.map(({ id, display_order }) =>
      supabase
        .from('home_carousel_slides')
        .update({ display_order, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('site_id', siteId),
    ),
  )

  const failed = results.find((r) => r.error)
  if (failed?.error) throw new Error(failed.error.message)
  return { success: true }
}

/**
 * Publie en une fois toutes les modifications du brouillon admin.
 *
 * @param {{
 *   slideIdsToDelete?: string[],
 *   newSlides?: Array<{ localId: string, file: File, alt_text?: string, brand_name?: string, watch_id?: string, promotion_campaign_id?: string }>,
 *   slideUpdates?: Array<{ id: string, alt_text?: string, brand_name?: string, watch_id?: string, promotion_campaign_id?: string }>,
 *   orderedRefs?: Array<{ id?: string, localId?: string }>,
 * }} payload
 */
/**
 * @param {Array<{ promotion_campaign_id?: string }>} slides
 */
async function assertActiveCarouselCampaignLinks(slides) {
  const campaignIds = [
    ...new Set(
      slides
        .map((slide) => slide.promotion_campaign_id?.trim?.() || slide.promotion_campaign_id)
        .filter(Boolean),
    ),
  ]

  if (campaignIds.length === 0) return

  const activeCampaigns = await getActiveWatchPromotionCampaignsForCarousel()
  const activeIds = new Set(activeCampaigns.map((campaign) => campaign.id))
  const invalidId = campaignIds.find((id) => !activeIds.has(id))

  if (invalidId) {
    throw new Error(
      'Une slide pointe vers un événement promotionnel inactif ou expiré. Choisissez un événement en cours ou retirez le lien.',
    )
  }
}

export async function saveHomeCarouselChanges(payload) {
  const {
    slideIdsToDelete = [],
    newSlides = [],
    slideUpdates = [],
    orderedRefs = [],
  } = payload

  await assertActiveCarouselCampaignLinks([...newSlides, ...slideUpdates])

  for (const slideId of slideIdsToDelete) {
    await deleteHomeCarouselSlide(slideId)
  }

  const localIdToRealId = new Map()

  for (const slide of newSlides) {
    const result = await uploadHomeCarouselSlide(slide.file, {
      altText: slide.alt_text,
      brandName: slide.brand_name || null,
      watchId: slide.watch_id || null,
      promotionCampaignId: slide.promotion_campaign_id || null,
    })
    if (result.data?.id) {
      localIdToRealId.set(slide.localId, result.data.id)
    }
  }

  for (const update of slideUpdates) {
    await updateHomeCarouselSlide(update.id, {
      altText: update.alt_text,
      brandName: update.brand_name,
      watchId: update.watch_id,
      promotionCampaignId: update.promotion_campaign_id,
    })
  }

  const resolvedOrder = orderedRefs
    .map((ref, index) => {
      const id = ref.id ?? localIdToRealId.get(ref.localId)
      return id ? { id, display_order: index } : null
    })
    .filter(Boolean)

  if (resolvedOrder.length > 0) {
    await reorderHomeCarouselSlides(resolvedOrder)
  }

  return { success: true }
}
