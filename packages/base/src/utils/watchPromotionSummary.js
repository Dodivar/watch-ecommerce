import {
  getDisplayDiscountPercent,
  getEffectiveWatchPrice,
  isWatchOnPromotion,
} from '@/utils/watchPricing.js'
import { resolveLiveCampaignStatus } from '@/utils/watchPromotionCampaign.js'

/**
 * Origine d'une remise, telle qu'affichée dans le back-office.
 *
 * - `campaign`  : la remise appliquée vient d'une campagne de promotion en cours.
 * - `direct`    : la remise est portée par la fiche montre (case « En promotion »).
 * - `scheduled` : la montre est engagée dans une campagne à venir ; son prix n'a pas
 *                 encore bougé (les prix ne sont écrits qu'au démarrage de la campagne,
 *                 voir `applyWatchPromotionCampaign`).
 */
export const PROMOTION_SOURCES = ['campaign', 'direct', 'scheduled']

export const PROMOTION_SOURCE_LABELS = {
  campaign: 'Campagne',
  direct: 'Promo directe',
  scheduled: 'Campagne à venir',
}

/**
 * Classe binaire (fond + texte) du badge d'origine, alignée sur les couleurs de
 * statut de `AdminWatchPromotionList`.
 * @param {string | null} source
 * @returns {string}
 */
export function getPromotionSourceClass(source) {
  const map = {
    campaign: 'bg-green-50 text-green-800',
    direct: 'bg-blue-50 text-blue-800',
    scheduled: 'bg-amber-50 text-amber-800',
  }
  return map[source] || 'bg-gray-100 text-gray-700'
}

/**
 * Décrit la promotion d'une montre pour l'affichage admin.
 *
 * `campaign` est la campagne active ou à venir qui contient la montre, si elle existe.
 * Une montre remisée sans campagne active porte une promotion directe : c'est le seul
 * moyen d'avoir un `promotion_price` hors campagne appliquée.
 *
 * @param {{ price?: number|string|null, promotion_price?: number|string|null, promotionPrice?: number|string|null, discount_percent?: number|null, discountPercent?: number|null }} watch
 * @param {{ id?: string, name?: string, slug?: string|null, status?: string, startsAt?: string|null, endsAt?: string|null } | null} [campaign]
 * @param {Date} [now]
 * @returns {{
 *   source: 'campaign' | 'direct' | 'scheduled' | null,
 *   label: string | null,
 *   isOnPromotion: boolean,
 *   price: number,
 *   promotionPrice: number | null,
 *   discountPercent: number | null,
 *   savings: number,
 *   campaign: object | null,
 *   campaignStatus: string | null,
 * }}
 */
export function describeWatchPromotion(watch, campaign = null, now = new Date()) {
  const price = parseFloat(watch?.price)
  const basePrice = Number.isFinite(price) && price > 0 ? price : 0
  const onPromotion = isWatchOnPromotion(watch)
  const effective = onPromotion ? getEffectiveWatchPrice(watch) : basePrice
  const campaignStatus = campaign ? resolveLiveCampaignStatus(campaign, now) : null

  let source = null
  if (onPromotion) {
    source = campaignStatus === 'active' ? 'campaign' : 'direct'
  } else if (campaignStatus === 'scheduled') {
    source = 'scheduled'
  }

  let label = source ? PROMOTION_SOURCE_LABELS[source] : null
  if (source === 'campaign' || source === 'scheduled') {
    label = campaign?.name ? `${label} · ${campaign.name}` : label
  }

  return {
    source,
    label,
    isOnPromotion: onPromotion,
    price: basePrice,
    promotionPrice: onPromotion ? effective : null,
    discountPercent: onPromotion ? getDisplayDiscountPercent(watch) : null,
    savings: onPromotion ? Math.max(0, basePrice - effective) : 0,
    campaign: source === 'campaign' || source === 'scheduled' ? campaign : null,
    campaignStatus,
  }
}

/**
 * Choisit la campagne à afficher quand une montre appartient à plusieurs campagnes :
 * celle en cours l'emporte sur celle à venir (c'est elle qui fixe le prix affiché),
 * puis la plus proche de sa fin.
 * @param {Array<object>} memberships lignes `{ campaign }` ou campagnes directement
 * @param {Date} [now]
 * @returns {object | null}
 */
export function pickPrimaryCampaign(memberships, now = new Date()) {
  const campaigns = (memberships || []).map((entry) => entry?.campaign ?? entry).filter(Boolean)
  if (campaigns.length === 0) return null

  const rank = (campaign) => (resolveLiveCampaignStatus(campaign, now) === 'active' ? 0 : 1)
  const endTime = (campaign) => {
    const endsAt = campaign?.endsAt ?? campaign?.ends_at
    const time = endsAt ? new Date(endsAt).getTime() : Number.POSITIVE_INFINITY
    return Number.isNaN(time) ? Number.POSITIVE_INFINITY : time
  }

  return [...campaigns].sort((a, b) => rank(a) - rank(b) || endTime(a) - endTime(b))[0]
}

/**
 * Agrège les lignes de l'écran « Montres en promotion ».
 * @param {Array<{ promotion: ReturnType<typeof describeWatchPromotion> }>} rows
 * @returns {{ total: number, campaignCount: number, directCount: number, scheduledCount: number, totalSavings: number, catalogValue: number, promotedValue: number, averageDiscount: number | null }}
 */
export function summarizePromotedWatches(rows) {
  const list = (rows || []).filter((row) => row?.promotion?.source)
  const discounted = list.filter((row) => row.promotion.isOnPromotion)

  const totalSavings = discounted.reduce((sum, row) => sum + row.promotion.savings, 0)
  const catalogValue = discounted.reduce((sum, row) => sum + row.promotion.price, 0)
  const discounts = discounted
    .map((row) => row.promotion.discountPercent)
    .filter((percent) => Number.isFinite(percent))

  return {
    total: list.length,
    campaignCount: list.filter((row) => row.promotion.source === 'campaign').length,
    directCount: list.filter((row) => row.promotion.source === 'direct').length,
    scheduledCount: list.filter((row) => row.promotion.source === 'scheduled').length,
    totalSavings,
    catalogValue,
    promotedValue: catalogValue - totalSavings,
    averageDiscount: discounts.length
      ? Math.round(discounts.reduce((sum, percent) => sum + percent, 0) / discounts.length)
      : null,
  }
}
