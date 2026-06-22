/**
 * Prix catalogue (hors promotion) pour filtres et plages min/max.
 * @param {{ price?: number | null }} watch
 * @returns {number}
 */
export function getCatalogWatchPrice(watch) {
  const base = parseFloat(watch?.price)
  if (!Number.isFinite(base) || base <= 0) return 0
  return base
}

/**
 * Prix effectif et affichage promotion montre.
 * @param {{ price?: number | null, promotionPrice?: number | null, promotion_price?: number | null }} watch
 * @returns {number}
 */
export function getEffectiveWatchPrice(watch) {
  const base = parseFloat(watch?.price)
  if (!Number.isFinite(base) || base <= 0) return 0

  const promoRaw = watch?.promotionPrice ?? watch?.promotion_price
  const promo = parseFloat(promoRaw)
  if (Number.isFinite(promo) && promo > 0 && promo < base) {
    return promo
  }

  return base
}

/**
 * @param {{ price?: number | null, promotionPrice?: number | null, promotion_price?: number | null }} watch
 * @returns {boolean}
 */
export function isWatchOnPromotion(watch) {
  const base = parseFloat(watch?.price)
  const promoRaw = watch?.promotionPrice ?? watch?.promotion_price
  const promo = parseFloat(promoRaw)
  return Number.isFinite(base) && base > 0 && Number.isFinite(promo) && promo > 0 && promo < base
}

/**
 * @param {{ price?: number | null, promotionPrice?: number | null, discountPercent?: number | null, discount_percent?: number | null }} watch
 * @returns {number | null}
 */
export function getDisplayDiscountPercent(watch) {
  const stored = watch?.discountPercent ?? watch?.discount_percent
  const parsed = parseInt(String(stored ?? ''), 10)
  if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 99) {
    return parsed
  }

  if (!isWatchOnPromotion(watch)) return null

  const base = parseFloat(watch?.price)
  const effective = getEffectiveWatchPrice(watch)
  if (!Number.isFinite(base) || base <= 0) return null

  return Math.max(1, Math.min(99, Math.round((1 - effective / base) * 100)))
}

/**
 * @param {number | string} price
 * @param {number | string} percent
 * @returns {number | null}
 */
export function suggestPromotionPrice(price, percent) {
  const base = parseFloat(price)
  const pct = parseInt(String(percent), 10)
  if (!Number.isFinite(base) || base <= 0) return null
  if (!Number.isFinite(pct) || pct < 1 || pct > 99) return null

  const raw = base * (1 - pct / 100)
  const rounded = Math.round(raw)
  if (rounded <= 0 || rounded >= base) return null
  return rounded
}

/**
 * @param {number | string} price
 * @param {number | string} promotionPrice
 * @returns {number | null}
 */
export function computeDiscountPercentFromPrices(price, promotionPrice) {
  const base = parseFloat(price)
  const promo = parseFloat(promotionPrice)
  if (!Number.isFinite(base) || base <= 0) return null
  if (!Number.isFinite(promo) || promo <= 0 || promo >= base) return null
  return Math.max(1, Math.min(99, Math.round((1 - promo / base) * 100)))
}
