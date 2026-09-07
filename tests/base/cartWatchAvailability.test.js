/**
 * Le checkout retire du panier les montres devenues incommandables. Ce qui compte ici,
 * c'est qu'aucune ligne encore vendable ne soit retirée par erreur : le client perdrait
 * sa montre du panier sans l'avoir demandé.
 *
 * Les deux profils de catalogue ne jugent pas la disponibilité pareil — `resale` sur
 * `is_sold` (pièce unique), `retail` sur `stock_quantity` — et c'est exactement là que
 * la même montre bascule d'un verdict à l'autre.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

/** Requêtes vues par le faux client Supabase, dans l'ordre. */
let queries = []

/** @type {Array<object>} lignes de la table `watches` */
let watchRows = []

/** @type {Record<string, unknown>} manifest servi à `getSiteConfig()` */
let siteConfig = { watchCatalog: { mode: 'resale' } }

function createQueryBuilder(table) {
  const state = { table, ids: null }

  const builder = {
    select: () => builder,
    in: (column, values) => {
      state.ids = { column, values }
      return builder
    },
    then: (resolve, reject) => {
      queries.push({ table, ids: state.ids?.values ?? null })
      const wanted = new Set(state.ids?.values ?? [])
      const rows = watchRows.filter((row) => wanted.has(row.id))
      return Promise.resolve({ data: rows, error: null }).then(resolve, reject)
    },
  }

  return builder
}

vi.mock('@/services/supabase', () => ({
  supabase: {
    from: (table) => createQueryBuilder(table),
    storage: {
      from: () => ({ getPublicUrl: () => ({ data: { publicUrl: '' } }) }),
    },
  },
}))

vi.mock('@/site/getSiteConfig.js', () => ({
  getSiteConfig: () => siteConfig,
}))

const { getUnpurchasableWatchIds } = await import(
  '../../packages/base/src/services/watchService.js'
)

/** @param {Partial<{ id: string, is_available: boolean, is_sold: boolean, stock_quantity: number|null }>} overrides */
function watchRow(overrides) {
  return {
    id: 'w1',
    is_available: true,
    is_sold: false,
    stock_quantity: null,
    ...overrides,
  }
}

describe('getUnpurchasableWatchIds', () => {
  beforeEach(() => {
    queries = []
    watchRows = []
    siteConfig = { watchCatalog: { mode: 'resale' } }
  })

  it('garde les montres encore en vente', async () => {
    watchRows = [watchRow({ id: 'w1' }), watchRow({ id: 'w2' })]

    await expect(getUnpurchasableWatchIds(['w1', 'w2'])).resolves.toEqual([])
  })

  it('signale une montre vendue ou retirée de la vente', async () => {
    watchRows = [
      watchRow({ id: 'sold', is_sold: true }),
      watchRow({ id: 'withdrawn', is_available: false }),
      watchRow({ id: 'ok' }),
    ]

    await expect(
      getUnpurchasableWatchIds(['sold', 'withdrawn', 'ok']),
    ).resolves.toEqual(['sold', 'withdrawn'])
  })

  it('signale une fiche disparue du catalogue', async () => {
    watchRows = [watchRow({ id: 'ok' })]

    await expect(getUnpurchasableWatchIds(['ok', 'deleted'])).resolves.toEqual(['deleted'])
  })

  it('signale un stock épuisé en mode retail', async () => {
    siteConfig = { watchCatalog: { mode: 'retail' } }
    watchRows = [
      watchRow({ id: 'empty', stock_quantity: 0 }),
      watchRow({ id: 'left', stock_quantity: 2 }),
      watchRow({ id: 'untracked', stock_quantity: null }),
    ]

    await expect(
      getUnpurchasableWatchIds(['empty', 'left', 'untracked']),
    ).resolves.toEqual(['empty'])
  })

  it('ignore le stock en mode resale, où la pièce est unique', async () => {
    watchRows = [watchRow({ id: 'w1', stock_quantity: 0 })]

    await expect(getUnpurchasableWatchIds(['w1'])).resolves.toEqual([])
  })

  it('interroge le catalogue une seule fois, sans répéter un id', async () => {
    watchRows = [watchRow({ id: 'w1' })]

    await getUnpurchasableWatchIds(['w1', 'w1'])

    expect(queries).toEqual([{ table: 'watches', ids: ['w1'] }])
  })

  it('ne touche pas au réseau pour un panier vide', async () => {
    await expect(getUnpurchasableWatchIds([])).resolves.toEqual([])
    await expect(getUnpurchasableWatchIds(undefined)).resolves.toEqual([])

    expect(queries).toEqual([])
  })
})
