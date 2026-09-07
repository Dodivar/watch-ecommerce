import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../supabase', () => ({
  supabase: { from: vi.fn() },
}))

vi.mock('./adminSiteContext.js', () => ({
  getAdminSiteId: () => 'site-test',
}))

vi.mock('./adminWatchService.js', () => ({
  getWatchesByIdsForAdmin: vi.fn(),
}))

vi.mock('@/composables/useMenuCampaigns.js', () => ({
  invalidateMenuCampaignsCache: vi.fn(),
}))

import { supabase } from '../supabase'
import {
  getActiveCampaignMembershipsForAdmin,
  getCampaignByWatchIdForAdmin,
  getPromotedWatchesForAdmin,
} from './adminWatchPromotionService.js'

/** Faux query builder PostgREST : chaînable et thenable. */
function createQuery(result) {
  const query = {
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
  }
  for (const method of ['select', 'eq', 'in', 'not', 'order']) {
    query[method] = vi.fn(() => query)
  }
  return query
}

const PAST = '2020-01-01T00:00:00.000Z'
const FUTURE = '2099-01-01T00:00:00.000Z'

function watchRow(id, overrides = {}) {
  return {
    id,
    ad_code: `AD-${id}`,
    name: `Montre ${id}`,
    brand: 'ROLEX',
    model: 'Datejust',
    reference: `ref-${id}`,
    price: 10000,
    promotion_price: null,
    discount_percent: null,
    is_available: true,
    is_sold: false,
    stock_quantity: 1,
    ...overrides,
  }
}

function campaignRow(overrides = {}) {
  return {
    id: 'camp-1',
    site_id: 'site-test',
    name: 'Soldes été',
    slug: 'soldes-ete',
    status: 'active',
    default_discount_percent: 20,
    starts_at: PAST,
    ends_at: null,
    watch_promotion_campaign_items: [],
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getActiveCampaignMembershipsForAdmin', () => {
  it('rattache chaque montre à sa campagne en cours ou à venir', async () => {
    supabase.from.mockReturnValueOnce(
      createQuery({
        data: [
          campaignRow({
            watch_promotion_campaign_items: [
              { id: 'i1', watch_id: 'w1', discount_percent: 30, promotion_price: null, watches: watchRow('w1') },
            ],
          }),
        ],
        error: null,
      }),
    )

    const memberships = await getActiveCampaignMembershipsForAdmin()

    expect(memberships).toHaveLength(1)
    expect(memberships[0].watchId).toBe('w1')
    expect(memberships[0].campaign.name).toBe('Soldes été')
    expect(memberships[0].item.discountPercent).toBe(30)
    expect(memberships[0].watch.id).toBe('w1')
  })

  it('écarte une campagne restée « active » en base alors que sa date de fin est passée', async () => {
    supabase.from.mockReturnValueOnce(
      createQuery({
        data: [
          campaignRow({
            ends_at: PAST,
            watch_promotion_campaign_items: [
              { id: 'i1', watch_id: 'w1', discount_percent: null, promotion_price: null, watches: watchRow('w1') },
            ],
          }),
        ],
        error: null,
      }),
    )

    expect(await getActiveCampaignMembershipsForAdmin()).toEqual([])
  })

  it('remonte l’erreur PostgREST', async () => {
    supabase.from.mockReturnValueOnce(createQuery({ data: null, error: { message: 'boom' } }))

    await expect(getActiveCampaignMembershipsForAdmin()).rejects.toThrow('boom')
  })
})

describe('getCampaignByWatchIdForAdmin', () => {
  it('préfère la campagne en cours quand une montre est engagée dans plusieurs événements', async () => {
    const byWatchId = await getCampaignByWatchIdForAdmin([
      { watchId: 'w1', campaign: { id: 'c-future', status: 'scheduled', startsAt: FUTURE, endsAt: null } },
      { watchId: 'w1', campaign: { id: 'c-now', status: 'active', startsAt: PAST, endsAt: null } },
    ])

    expect(byWatchId.get('w1').id).toBe('c-now')
  })
})

describe('getPromotedWatchesForAdmin', () => {
  it('réunit les remises de campagne et les promotions directes', async () => {
    supabase.from
      // 1. campagnes en cours / à venir
      .mockReturnValueOnce(
        createQuery({
          data: [
            campaignRow({
              watch_promotion_campaign_items: [
                {
                  id: 'i1',
                  watch_id: 'w-campagne',
                  discount_percent: 20,
                  promotion_price: null,
                  watches: watchRow('w-campagne', { promotion_price: 8000, discount_percent: 20 }),
                },
              ],
            }),
          ],
          error: null,
        }),
      )
      // 2. montres portant un prix promo
      .mockReturnValueOnce(
        createQuery({
          data: [
            watchRow('w-campagne', { promotion_price: 8000, discount_percent: 20 }),
            watchRow('w-directe', { brand: 'OMEGA', promotion_price: 4000, discount_percent: 20 }),
          ],
          error: null,
        }),
      )

    const rows = await getPromotedWatchesForAdmin()

    expect(rows).toHaveLength(2)
    const byId = new Map(rows.map((row) => [row.watch.id, row]))
    expect(byId.get('w-campagne').campaign.name).toBe('Soldes été')
    expect(byId.get('w-directe').campaign).toBeNull()
  })

  it('ajoute les montres d’une campagne à venir, encore au prix catalogue', async () => {
    supabase.from
      .mockReturnValueOnce(
        createQuery({
          data: [
            campaignRow({
              id: 'camp-2',
              name: 'Black Friday',
              status: 'scheduled',
              starts_at: FUTURE,
              watch_promotion_campaign_items: [
                {
                  id: 'i2',
                  watch_id: 'w-programmee',
                  discount_percent: 25,
                  promotion_price: null,
                  watches: watchRow('w-programmee'),
                },
              ],
            }),
          ],
          error: null,
        }),
      )
      // Aucune montre remisée en base : la campagne n'a pas encore touché aux prix.
      .mockReturnValueOnce(createQuery({ data: [], error: null }))

    const rows = await getPromotedWatchesForAdmin()

    expect(rows).toHaveLength(1)
    expect(rows[0].watch.id).toBe('w-programmee')
    expect(rows[0].watch.promotion_price).toBeNull()
    expect(rows[0].campaign.name).toBe('Black Friday')
  })

  it('trie par marque puis par nom', async () => {
    supabase.from
      .mockReturnValueOnce(createQuery({ data: [], error: null }))
      .mockReturnValueOnce(
        createQuery({
          data: [
            watchRow('w2', { brand: 'TUDOR', name: 'Black Bay', promotion_price: 2000 }),
            watchRow('w1', { brand: 'OMEGA', name: 'Speedmaster', promotion_price: 3000 }),
          ],
          error: null,
        }),
      )

    const rows = await getPromotedWatchesForAdmin()

    expect(rows.map((row) => row.watch.brand)).toEqual(['OMEGA', 'TUDOR'])
  })
})
