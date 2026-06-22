import {
  computeDiscountPercentFromPrices,
  getDisplayDiscountPercent,
  getEffectiveWatchPrice,
  isWatchOnPromotion,
  suggestPromotionPrice,
} from '@/utils/watchPricing.js'

/**
 * @param {{ price?: number | null, promotion_price?: number | null, promotionPrice?: number | null }} watch
 * @param {{ discountPercent?: number | null, discount_percent?: number | null, promotionPrice?: number | null, promotion_price?: number | null }} item
 * @param {number | null | undefined} defaultDiscountPercent
 */
export function resolveCampaignItemPricing(watch, item, defaultDiscountPercent) {
  const basePrice = parseFloat(watch?.price)
  if (!Number.isFinite(basePrice) || basePrice <= 0) {
    return { basePrice: 0, promotionPrice: null, discountPercent: null }
  }

  const itemPctRaw = item?.discountPercent ?? item?.discount_percent
  const itemPriceRaw = item?.promotionPrice ?? item?.promotion_price
  const hasCustomPercent = itemPctRaw != null && itemPctRaw !== ''
  const hasCustomPrice = itemPriceRaw != null && itemPriceRaw !== ''

  let promotionPrice = hasCustomPrice ? parseFloat(String(itemPriceRaw)) : null
  let discountPercent = hasCustomPercent ? parseInt(String(itemPctRaw), 10) : null

  if (hasCustomPrice && Number.isFinite(promotionPrice)) {
    discountPercent = computeDiscountPercentFromPrices(basePrice, promotionPrice)
  } else if (hasCustomPercent && Number.isFinite(discountPercent)) {
    promotionPrice = suggestPromotionPrice(basePrice, discountPercent)
  } else {
    const fallbackPct = parseInt(String(defaultDiscountPercent), 10)
    discountPercent = Number.isFinite(fallbackPct) ? fallbackPct : null
    promotionPrice =
      discountPercent != null ? suggestPromotionPrice(basePrice, discountPercent) : null
  }

  if (
    !Number.isFinite(promotionPrice) ||
    promotionPrice <= 0 ||
    promotionPrice >= basePrice
  ) {
    return { basePrice, promotionPrice: null, discountPercent: null }
  }

  return {
    basePrice,
    promotionPrice,
    discountPercent: Number.isFinite(discountPercent) ? discountPercent : null,
  }
}

/**
 * Applique le tarif campagne sur une montre déjà transformée pour le listing.
 * @param {object} watch
 * @param {{ discountPercent?: number | null, discount_percent?: number | null, promotionPrice?: number | null, promotion_price?: number | null }} item
 * @param {number | null | undefined} defaultDiscountPercent
 */
export function enrichWatchWithCampaignPricing(watch, item, defaultDiscountPercent) {
  const pricing = resolveCampaignItemPricing(watch, item, defaultDiscountPercent)
  if (!pricing.promotionPrice) return watch

  const enriched = {
    ...watch,
    promotionPrice: pricing.promotionPrice,
    discountPercent: pricing.discountPercent,
  }

  return {
    ...enriched,
    effectivePrice: getEffectiveWatchPrice(enriched),
    isOnPromotion: isWatchOnPromotion(enriched),
    displayDiscountPercent: getDisplayDiscountPercent(enriched),
  }
}

/**
 * @param {object} watch
 * @param {Map<string, { item: object, defaultDiscountPercent: number }>} pricingByWatchId
 */
export function enrichWatchesWithActiveCampaignPricing(watches, pricingByWatchId) {
  if (!pricingByWatchId?.size) return watches

  return watches.map((watch) => {
    const overlay = pricingByWatchId.get(watch.id)
    if (!overlay) return watch
    return enrichWatchWithCampaignPricing(watch, overlay.item, overlay.defaultDiscountPercent)
  })
}

/**
 * @param {{ status?: string, startsAt?: string | null, starts_at?: string | null, endsAt?: string | null, ends_at?: string | null }} campaign
 * @param {Date} [now]
 */
export function resolveLiveCampaignStatus(campaign, now = new Date()) {
  const stored = campaign?.status
  if (stored === 'draft' || stored === 'cancelled' || stored === 'ended') {
    return stored
  }

  const startsAt = campaign?.startsAt ?? campaign?.starts_at
  const endsAt = campaign?.endsAt ?? campaign?.ends_at
  const start = startsAt ? new Date(startsAt) : null
  const end = endsAt ? new Date(endsAt) : null

  if (start && start > now) return 'scheduled'
  if (end && end <= now) return 'ended'
  return 'active'
}

/**
 * @param {{ startsAt?: string | null, starts_at?: string | null, endsAt?: string | null, ends_at?: string | null }} campaign
 * @param {Date} [now]
 * @returns {{ summary: string, startsLabel: string, endsLabel: string | null, isImmediate: boolean, isIndefinite: boolean }}
 */
export function describeCampaignSchedule(campaign, now = new Date()) {
  const startsAt = campaign?.startsAt ?? campaign?.starts_at
  const endsAt = campaign?.endsAt ?? campaign?.ends_at
  const start = startsAt ? new Date(startsAt) : now
  const end = endsAt ? new Date(endsAt) : null
  const isImmediate = !startsAt || start <= now
  const isIndefinite = !endsAt

  const dateTimeFmt = new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const startsLabel = isImmediate
    ? 'Dès validation de la campagne'
    : dateTimeFmt.format(start)

  const endsLabel = isIndefinite ? null : dateTimeFmt.format(end)

  let summary
  if (isImmediate && isIndefinite) {
    summary = 'Les remises seront visibles immédiatement et resteront actives jusqu\'à annulation manuelle.'
  } else if (isImmediate && end) {
    summary = `Les remises seront visibles immédiatement jusqu'au ${endsLabel}.`
  } else if (!isImmediate && isIndefinite) {
    summary = `Les remises seront visibles à partir du ${startsLabel}, sans date de fin.`
  } else {
    summary = `Les remises seront visibles du ${startsLabel} au ${endsLabel}.`
  }

  return { summary, startsLabel, endsLabel, isImmediate, isIndefinite }
}

/**
 * @param {string | Date | null | undefined} startsAt
 * @param {string | Date | null | undefined} endsAt
 * @returns {{ startsAt: string, endsAt: string | null }}
 */
export function normalizeCampaignSchedule(startsAt, endsAt) {
  const startRaw = startsAt != null && startsAt !== '' ? startsAt : new Date().toISOString()
  const start = new Date(startRaw)
  if (Number.isNaN(start.getTime())) {
    throw new Error('La date de début est invalide')
  }

  if (endsAt == null || endsAt === '') {
    return { startsAt: start.toISOString(), endsAt: null }
  }

  const end = new Date(endsAt)
  if (Number.isNaN(end.getTime())) {
    throw new Error('La date de fin est invalide')
  }

  if (end.getTime() <= start.getTime()) {
    throw new Error(
      'La date de fin doit être postérieure à la date de début (vérifiez aussi l\'heure).',
    )
  }

  return { startsAt: start.toISOString(), endsAt: end.toISOString() }
}

/**
 * @param {string | Date | null | undefined} startsAt
 * @returns {Date | undefined}
 */
export function getMinCampaignEndDate(startsAt) {
  if (startsAt == null || startsAt === '') return undefined
  const start = new Date(startsAt)
  if (Number.isNaN(start.getTime())) return undefined
  return new Date(start.getTime() + 60_000)
}

/**
 * @param {{ startsAt?: string | null, starts_at?: string | null, endsAt?: string | null, ends_at?: string | null }} campaign
 * @param {Date} [now]
 * @returns {{ status: 'cancelled' | 'ended', endsAt: string | null }}
 */
export function resolveEarlyCampaignTermination(campaign, now = new Date()) {
  const startsAt = campaign?.startsAt ?? campaign?.starts_at
  const start = startsAt ? new Date(startsAt) : null

  if (start && start > now) {
    return { status: 'cancelled', endsAt: campaign?.endsAt ?? campaign?.ends_at ?? null }
  }

  return { status: 'ended', endsAt: now.toISOString() }
}

/**
 * @param {string} status
 */
export function getCampaignStatusLabel(status) {
  const labels = {
    draft: 'Brouillon',
    scheduled: 'À venir',
    active: 'En cours',
    ended: 'Terminée',
    cancelled: 'Annulée',
  }
  return labels[status] || status
}