import { describe, expect, it } from 'vitest'

import {
  describeWatchPromotion,
  pickPrimaryCampaign,
  summarizePromotedWatches,
} from './watchPromotionSummary.js'

const NOW = new Date('2026-06-15T12:00:00.000Z')

/** Campagne en cours : démarrée hier, sans date de fin. */
const activeCampaign = {
  id: 'camp-active',
  name: 'Soldes d\'été',
  status: 'active',
  startsAt: '2026-06-14T00:00:00.000Z',
  endsAt: null,
}

/** Campagne à venir : les prix des montres n'ont pas encore bougé. */
const scheduledCampaign = {
  id: 'camp-scheduled',
  name: 'Black Friday',
  status: 'scheduled',
  startsAt: '2026-11-27T00:00:00.000Z',
  endsAt: '2026-11-30T23:00:00.000Z',
}

describe('describeWatchPromotion', () => {
  it('rattache une remise appliquée à la campagne en cours', () => {
    const promotion = describeWatchPromotion(
      { price: 10000, promotion_price: 8000, discount_percent: 20 },
      activeCampaign,
      NOW,
    )

    expect(promotion.source).toBe('campaign')
    expect(promotion.label).toBe('Campagne · Soldes d\'été')
    expect(promotion.promotionPrice).toBe(8000)
    expect(promotion.discountPercent).toBe(20)
    expect(promotion.savings).toBe(2000)
  })

  it('classe en promo directe une remise sans campagne', () => {
    const promotion = describeWatchPromotion(
      { price: 5000, promotion_price: 4000 },
      null,
      NOW,
    )

    expect(promotion.source).toBe('direct')
    expect(promotion.label).toBe('Promo directe')
    // Pourcentage déduit des prix quand `discount_percent` n'est pas renseigné.
    expect(promotion.discountPercent).toBe(20)
    expect(promotion.campaign).toBeNull()
  })

  it('classe en promo directe une remise portée par une montre engagée dans un événement à venir', () => {
    // La campagne n'a pas encore appliqué ses prix : la remise visible aujourd'hui
    // ne peut venir que de la fiche montre.
    const promotion = describeWatchPromotion(
      { price: 5000, promotion_price: 4500 },
      scheduledCampaign,
      NOW,
    )

    expect(promotion.source).toBe('direct')
    expect(promotion.campaign).toBeNull()
  })

  it('signale une montre engagée dans un événement à venir mais encore au prix catalogue', () => {
    const promotion = describeWatchPromotion({ price: 5000 }, scheduledCampaign, NOW)

    expect(promotion.source).toBe('scheduled')
    expect(promotion.label).toBe('Campagne à venir · Black Friday')
    expect(promotion.isOnPromotion).toBe(false)
    expect(promotion.promotionPrice).toBeNull()
    expect(promotion.savings).toBe(0)
    expect(promotion.campaign).toBe(scheduledCampaign)
  })

  it('ne voit aucune promotion sur une montre au prix catalogue', () => {
    expect(describeWatchPromotion({ price: 5000 }, null, NOW).source).toBeNull()
  })

  it('ignore un prix promo supérieur ou égal au prix catalogue', () => {
    expect(describeWatchPromotion({ price: 5000, promotion_price: 5200 }, null, NOW).source).toBeNull()
    expect(describeWatchPromotion({ price: 5000, promotion_price: 5000 }, null, NOW).source).toBeNull()
  })

  it('rend son statut réel à une campagne restée « active » après sa date de fin', () => {
    const expired = { ...activeCampaign, endsAt: '2026-06-01T00:00:00.000Z' }
    const promotion = describeWatchPromotion(
      { price: 10000, promotion_price: 9000 },
      expired,
      NOW,
    )

    expect(promotion.campaignStatus).toBe('ended')
    expect(promotion.source).toBe('direct')
  })
})

describe('pickPrimaryCampaign', () => {
  it('préfère la campagne en cours à la campagne à venir', () => {
    const picked = pickPrimaryCampaign(
      [{ campaign: scheduledCampaign }, { campaign: activeCampaign }],
      NOW,
    )
    expect(picked.id).toBe('camp-active')
  })

  it('départage deux campagnes en cours par la date de fin la plus proche', () => {
    const endsSoon = { ...activeCampaign, id: 'camp-soon', endsAt: '2026-06-20T00:00:00.000Z' }
    const endsLater = { ...activeCampaign, id: 'camp-later', endsAt: '2026-07-20T00:00:00.000Z' }

    expect(pickPrimaryCampaign([endsLater, endsSoon], NOW).id).toBe('camp-soon')
  })

  it('renvoie null sans rattachement', () => {
    expect(pickPrimaryCampaign([], NOW)).toBeNull()
    expect(pickPrimaryCampaign(null, NOW)).toBeNull()
  })
})

describe('summarizePromotedWatches', () => {
  const rows = [
    { promotion: describeWatchPromotion({ price: 10000, promotion_price: 8000 }, activeCampaign, NOW) },
    { promotion: describeWatchPromotion({ price: 5000, promotion_price: 4000 }, null, NOW) },
    { promotion: describeWatchPromotion({ price: 3000 }, scheduledCampaign, NOW) },
    { promotion: describeWatchPromotion({ price: 3000 }, null, NOW) },
  ]

  it('compte les montres par origine de remise', () => {
    const summary = summarizePromotedWatches(rows)

    expect(summary.total).toBe(3)
    expect(summary.campaignCount).toBe(1)
    expect(summary.directCount).toBe(1)
    expect(summary.scheduledCount).toBe(1)
  })

  it('chiffre l\'effort commercial sur les seules remises déjà appliquées', () => {
    const summary = summarizePromotedWatches(rows)

    // La montre programmée est encore au prix catalogue : elle ne pèse pas dans les montants.
    expect(summary.catalogValue).toBe(15000)
    expect(summary.totalSavings).toBe(3000)
    expect(summary.promotedValue).toBe(12000)
    expect(summary.averageDiscount).toBe(20)
  })

  it('renvoie une synthèse vide sans promotion', () => {
    const summary = summarizePromotedWatches([])

    expect(summary.total).toBe(0)
    expect(summary.averageDiscount).toBeNull()
    expect(summary.totalSavings).toBe(0)
  })
})
