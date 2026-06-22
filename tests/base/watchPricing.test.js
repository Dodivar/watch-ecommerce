import { describe, it, expect } from 'vitest'
import {
  computeDiscountPercentFromPrices,
  getCatalogWatchPrice,
  getDisplayDiscountPercent,
  getEffectiveWatchPrice,
  isWatchOnPromotion,
  suggestPromotionPrice,
} from '../../packages/base/src/utils/watchPricing.js'

describe('watchPricing', () => {
  it('returns base price when no promotion', () => {
    expect(getEffectiveWatchPrice({ price: 2000 })).toBe(2000)
    expect(isWatchOnPromotion({ price: 2000 })).toBe(false)
  })

  it('uses promotion price when valid', () => {
    const watch = { price: 2000, promotionPrice: 1600 }
    expect(getEffectiveWatchPrice(watch)).toBe(1600)
    expect(isWatchOnPromotion(watch)).toBe(true)
  })

  it('returns catalog price regardless of promotion', () => {
    const watch = { price: 2000, promotionPrice: 1600 }
    expect(getCatalogWatchPrice(watch)).toBe(2000)
    expect(getCatalogWatchPrice({ price: 2000 })).toBe(2000)
  })

  it('suggests rounded promotion price from percent', () => {
    expect(suggestPromotionPrice(2000, 15)).toBe(1700)
  })

  it('prefers stored discount percent for display badge', () => {
    const watch = { price: 2000, promotionPrice: 1650, discountPercent: 20 }
    expect(getDisplayDiscountPercent(watch)).toBe(20)
  })

  it('computes discount percent from prices', () => {
    expect(computeDiscountPercentFromPrices(2000, 1600)).toBe(20)
  })
})
