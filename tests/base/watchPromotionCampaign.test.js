import { describe, it, expect } from 'vitest'
import {
  describeCampaignSchedule,
  enrichWatchWithCampaignPricing,
  enrichWatchesWithActiveCampaignPricing,
  getCampaignStatusLabel,
  getMinCampaignEndDate,
  normalizeCampaignSchedule,
  resolveCampaignItemPricing,
  resolveEarlyCampaignTermination,
  resolveLiveCampaignStatus,
} from '../../packages/base/src/utils/watchPromotionCampaign.js'

describe('watchPromotionCampaign utils', () => {
  it('resolveCampaignItemPricing applies default percent', () => {
    const result = resolveCampaignItemPricing({ price: 1000 }, {}, 20)
    expect(result.promotionPrice).toBe(800)
    expect(result.discountPercent).toBe(20)
  })

  it('resolveCampaignItemPricing respects custom price override', () => {
    const result = resolveCampaignItemPricing({ price: 1000 }, { promotionPrice: 750 }, 20)
    expect(result.promotionPrice).toBe(750)
    expect(result.discountPercent).toBe(25)
  })

  it('resolveCampaignItemPricing accepts snake_case item fields', () => {
    const result = resolveCampaignItemPricing({ price: 2000 }, { discount_percent: 15 }, 20)
    expect(result.promotionPrice).toBe(1700)
    expect(result.discountPercent).toBe(15)
  })

  it('resolveCampaignItemPricing applies custom percent override', () => {
    const result = resolveCampaignItemPricing({ price: 1000 }, { discountPercent: 30 }, 20)
    expect(result.promotionPrice).toBe(700)
    expect(result.discountPercent).toBe(30)
  })

  it('resolveCampaignItemPricing rejects invalid watch price', () => {
    expect(resolveCampaignItemPricing({ price: 0 }, {}, 20)).toEqual({
      basePrice: 0,
      promotionPrice: null,
      discountPercent: null,
    })
    expect(resolveCampaignItemPricing({}, {}, 20)).toEqual({
      basePrice: 0,
      promotionPrice: null,
      discountPercent: null,
    })
  })

  it('resolveCampaignItemPricing rejects promotion price not below base', () => {
    const result = resolveCampaignItemPricing({ price: 1000 }, { promotionPrice: 1000 }, 20)
    expect(result.promotionPrice).toBeNull()
    expect(result.discountPercent).toBeNull()
  })

  it('enrichWatchWithCampaignPricing sets listing promo fields', () => {
    const watch = {
      id: 'w1',
      price: 1000,
      promotionPrice: null,
      discountPercent: null,
      effectivePrice: 1000,
      isOnPromotion: false,
      displayDiscountPercent: null,
    }

    const enriched = enrichWatchWithCampaignPricing(watch, {}, 20)

    expect(enriched.promotionPrice).toBe(800)
    expect(enriched.discountPercent).toBe(20)
    expect(enriched.isOnPromotion).toBe(true)
    expect(enriched.effectivePrice).toBe(800)
    expect(enriched.displayDiscountPercent).toBe(20)
  })

  it('enrichWatchesWithActiveCampaignPricing only updates watches in the map', () => {
    const watches = [
      { id: 'w1', price: 1000, promotionPrice: null, discountPercent: null },
      { id: 'w2', price: 2000, promotionPrice: null, discountPercent: null },
    ]
    const pricing = new Map([
      ['w1', { item: { discountPercent: 10 }, defaultDiscountPercent: 20 }],
    ])

    const result = enrichWatchesWithActiveCampaignPricing(watches, pricing)

    expect(result[0].isOnPromotion).toBe(true)
    expect(result[0].promotionPrice).toBe(900)
    expect(result[1].isOnPromotion).toBeUndefined()
  })

  it('describeCampaignSchedule for immediate indefinite promo', () => {
    const now = new Date('2026-06-22T10:00:00Z')
    const text = describeCampaignSchedule({ startsAt: null, endsAt: null }, now)
    expect(text.isImmediate).toBe(true)
    expect(text.isIndefinite).toBe(true)
    expect(text.summary).toMatch(/immédiatement/)
  })

  it('resolveLiveCampaignStatus returns scheduled before start', () => {
    const now = new Date('2026-06-22T10:00:00Z')
    const status = resolveLiveCampaignStatus(
      { status: 'active', startsAt: '2026-12-01T00:00:00Z', endsAt: null },
      now,
    )
    expect(status).toBe('scheduled')
  })

  it('normalizeCampaignSchedule rejects end before start', () => {
    expect(() =>
      normalizeCampaignSchedule('2026-12-01T12:00:00Z', '2026-12-01T10:00:00Z'),
    ).toThrow(/postérieure/)
  })

  it('normalizeCampaignSchedule allows null end', () => {
    const result = normalizeCampaignSchedule('2026-12-01T12:00:00Z', null)
    expect(result.endsAt).toBeNull()
    expect(result.startsAt).toBe('2026-12-01T12:00:00.000Z')
  })

  it('resolveEarlyCampaignTermination cancels scheduled campaigns without moving ends_at before start', () => {
    const now = new Date('2026-06-22T10:00:00Z')
    const result = resolveEarlyCampaignTermination(
      { startsAt: '2026-06-23T23:03:00Z', endsAt: '2026-06-24T23:03:00Z' },
      now,
    )
    expect(result.status).toBe('cancelled')
    expect(result.endsAt).toBe('2026-06-24T23:03:00Z')
  })

  it('resolveEarlyCampaignTermination ends active campaigns at now', () => {
    const now = new Date('2026-06-23T12:00:00Z')
    const result = resolveEarlyCampaignTermination(
      { startsAt: '2026-06-23T10:00:00Z', endsAt: '2026-06-24T23:03:00Z' },
      now,
    )
    expect(result.status).toBe('ended')
    expect(result.endsAt).toBe(now.toISOString())
  })

  it('resolveLiveCampaignStatus preserves terminal stored statuses', () => {
    const now = new Date('2026-06-22T10:00:00Z')
    expect(resolveLiveCampaignStatus({ status: 'draft' }, now)).toBe('draft')
    expect(resolveLiveCampaignStatus({ status: 'cancelled' }, now)).toBe('cancelled')
    expect(resolveLiveCampaignStatus({ status: 'ended' }, now)).toBe('ended')
  })

  it('resolveLiveCampaignStatus returns active when within schedule window', () => {
    const now = new Date('2026-06-22T10:00:00Z')
    expect(
      resolveLiveCampaignStatus(
        { status: 'active', startsAt: '2026-06-01T00:00:00Z', endsAt: '2026-12-31T23:59:59Z' },
        now,
      ),
    ).toBe('active')
  })

  it('resolveLiveCampaignStatus returns ended after end date', () => {
    const now = new Date('2026-06-22T10:00:00Z')
    expect(
      resolveLiveCampaignStatus(
        { status: 'active', startsAt: '2026-01-01T00:00:00Z', endsAt: '2026-06-01T00:00:00Z' },
        now,
      ),
    ).toBe('ended')
  })

  it('resolveLiveCampaignStatus accepts snake_case schedule fields', () => {
    const now = new Date('2026-06-22T10:00:00Z')
    expect(
      resolveLiveCampaignStatus({ status: 'active', starts_at: '2026-12-01T00:00:00Z' }, now),
    ).toBe('scheduled')
  })

  it('describeCampaignSchedule for scheduled campaign with end date', () => {
    const now = new Date('2026-06-22T10:00:00Z')
    const text = describeCampaignSchedule(
      { startsAt: '2026-07-01T12:00:00Z', endsAt: '2026-07-31T23:59:59Z' },
      now,
    )
    expect(text.isImmediate).toBe(false)
    expect(text.isIndefinite).toBe(false)
    expect(text.summary).toMatch(/du .* au/)
    expect(text.endsLabel).toBeTruthy()
  })

  it('describeCampaignSchedule for immediate campaign with end date', () => {
    const now = new Date('2026-06-22T10:00:00Z')
    const text = describeCampaignSchedule({ startsAt: null, endsAt: '2026-07-31T23:59:59Z' }, now)
    expect(text.isImmediate).toBe(true)
    expect(text.isIndefinite).toBe(false)
    expect(text.summary).toMatch(/immédiatement jusqu'au/)
  })

  it('normalizeCampaignSchedule rejects invalid start date', () => {
    expect(() => normalizeCampaignSchedule('not-a-date', null)).toThrow(/début est invalide/)
  })

  it('normalizeCampaignSchedule rejects invalid end date', () => {
    expect(() => normalizeCampaignSchedule('2026-12-01T12:00:00Z', 'invalid')).toThrow(
      /fin est invalide/,
    )
  })

  it('normalizeCampaignSchedule defaults missing start to now', () => {
    const before = Date.now()
    const result = normalizeCampaignSchedule(null, null)
    const after = Date.now()
    const startMs = new Date(result.startsAt).getTime()
    expect(startMs).toBeGreaterThanOrEqual(before)
    expect(startMs).toBeLessThanOrEqual(after)
    expect(result.endsAt).toBeNull()
  })

  it('getMinCampaignEndDate returns one minute after start', () => {
    const start = '2026-12-01T12:00:00.000Z'
    const minEnd = getMinCampaignEndDate(start)
    expect(minEnd?.toISOString()).toBe('2026-12-01T12:01:00.000Z')
  })

  it('getMinCampaignEndDate returns undefined for invalid start', () => {
    expect(getMinCampaignEndDate('')).toBeUndefined()
    expect(getMinCampaignEndDate('bad-date')).toBeUndefined()
  })

  it('getCampaignStatusLabel maps known statuses to French labels', () => {
    expect(getCampaignStatusLabel('draft')).toBe('Brouillon')
    expect(getCampaignStatusLabel('scheduled')).toBe('À venir')
    expect(getCampaignStatusLabel('active')).toBe('En cours')
    expect(getCampaignStatusLabel('ended')).toBe('Terminée')
    expect(getCampaignStatusLabel('cancelled')).toBe('Annulée')
  })

  it('getCampaignStatusLabel returns raw status when unknown', () => {
    expect(getCampaignStatusLabel('custom')).toBe('custom')
  })
})
