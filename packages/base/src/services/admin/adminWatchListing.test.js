import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../supabase', () => ({
  supabase: { from: vi.fn(), rpc: vi.fn(), storage: { from: vi.fn() } },
}))

import { supabase } from '../supabase'
import {
  listWatchesForAdmin,
  getAdminWatchStatusCounts,
  getAdminWatchBrands,
  moveWatchToCatalogEdge,
  reorderWatches,
} from './adminWatchService.js'

/**
 * Faux query builder PostgREST : chaque méthode se chaîne et est enregistrée,
 * l'objet lui-même est thenable pour répondre au `await` final.
 * @param {object} result - Ce que résout la requête (`{ data, error, count }`).
 */
function createQuery(result) {
  const calls = []
  const query = {
    calls,
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
  }
  for (const method of ['select', 'order', 'range', 'or', 'eq', 'is', 'not', 'in']) {
    query[method] = vi.fn((...args) => {
      calls.push([method, ...args])
      return query
    })
  }
  return query
}

/** @param {object} query @param {string} method */
function callsTo(query, method) {
  return query.calls.filter(([name]) => name === method).map(([, ...args]) => args)
}

/**
 * Enchaîne les réponses de `supabase.from` : la requête sur `watches`, puis celle que
 * `attachFirstImagesToWatches` envoie sur `watch_images`.
 */
function stubList(rows, count) {
  const watchesQuery = createQuery({ data: rows, error: null, count })
  const imagesQuery = createQuery({ data: [], error: null })
  supabase.from.mockReturnValueOnce(watchesQuery).mockReturnValueOnce(imagesQuery)
  return watchesQuery
}

const row = { id: 'w1', brand: 'ROLEX', display_order: 12 }

beforeEach(() => {
  vi.clearAllMocks()
})

describe('listWatchesForAdmin', () => {
  it('ne demande que la tranche voulue et renvoie le total de la base', async () => {
    const query = stubList([row], 3000)

    const result = await listWatchesForAdmin({ page: 3, pageSize: 25 })

    expect(callsTo(query, 'range')).toEqual([[50, 74]])
    expect(query.select.mock.calls[0][1]).toEqual({ count: 'exact' })
    expect(result.total).toBe(3000)
    expect(result.watches).toHaveLength(1)
  })

  it('ne sélectionne pas la description, la colonne la plus lourde de la table', async () => {
    const query = stubList([row], 1)

    await listWatchesForAdmin()

    const columns = query.select.mock.calls[0][0]
    expect(columns).not.toContain('description')
    expect(columns).toContain('display_order')
  })

  it('trie par ordre de catalogue décroissant, vendues en dernier, `id` en départage', async () => {
    const query = stubList([row], 1)

    await listWatchesForAdmin()

    expect(callsTo(query, 'order')).toEqual([
      ['display_order', { ascending: false, nullsFirst: false }],
      ['id', { ascending: true }],
    ])
  })

  it('ajoute le départage par `id` aussi sur un tri de colonne', async () => {
    const query = stubList([row], 1)

    await listWatchesForAdmin({ sortColumn: 'price', sortDirection: 'asc' })

    expect(callsTo(query, 'order')).toEqual([
      ['price', { ascending: true, nullsFirst: false }],
      ['id', { ascending: true }],
    ])
  })

  it('borne la taille de page pour ne pas rouvrir la porte au chargement complet', async () => {
    const query = stubList([row], 3000)

    await listWatchesForAdmin({ page: 1, pageSize: 5000 })

    expect(callsTo(query, 'range')).toEqual([[0, 99]])
  })

  it('exclut les vendues de l’onglet « en stock », NULL compris', async () => {
    const query = stubList([row], 1)

    await listWatchesForAdmin({ status: 'available' })

    expect(callsTo(query, 'not')).toEqual([
      ['is_available', 'is', false],
      ['is_sold', 'is', true],
    ])
  })

  it('filtre l’onglet « vendues » sur is_sold', async () => {
    const query = stubList([row], 1)

    await listWatchesForAdmin({ status: 'sold' })

    expect(callsTo(query, 'is')).toEqual([['is_sold', true]])
  })

  it('ne filtre rien sur l’onglet « toutes »', async () => {
    const query = stubList([row], 1)

    await listWatchesForAdmin({ status: 'all' })

    expect(callsTo(query, 'is')).toEqual([])
    expect(callsTo(query, 'not')).toEqual([])
  })

  it('cherche côté base sur les cinq colonnes du champ de recherche', async () => {
    const query = stubList([row], 1)

    await listWatchesForAdmin({ search: '  daytona ' })

    const [filter] = callsTo(query, 'or')[0]
    expect(filter).toBe(
      'name.ilike.%daytona%,brand.ilike.%daytona%,model.ilike.%daytona%,' +
        'reference.ilike.%daytona%,ad_code.ilike.%daytona%',
    )
  })

  it('retire les caractères qui casseraient la syntaxe du filtre `or`', async () => {
    const query = stubList([row], 1)

    await listWatchesForAdmin({ search: 'sea_dweller (50%),x' })

    const [filter] = callsTo(query, 'or')[0]
    expect(filter.startsWith('name.ilike.%seadweller 50x%')).toBe(true)
  })

  it('remonte l’erreur PostgREST plutôt que de rendre une liste vide', async () => {
    supabase.from.mockReturnValueOnce(createQuery({ data: null, error: { message: 'boom' }, count: null }))

    await expect(listWatchesForAdmin()).rejects.toThrow('boom')
  })
})

describe('getAdminWatchStatusCounts', () => {
  it('compte sans transporter de lignes', async () => {
    const queries = [1200, 4, 12, 1216].map((count) =>
      createQuery({ data: null, error: null, count }),
    )
    queries.forEach((query) => supabase.from.mockReturnValueOnce(query))

    const counts = await getAdminWatchStatusCounts()

    expect(counts).toEqual({ available: 1200, unavailable: 4, sold: 12, all: 1216 })
    for (const query of queries) {
      expect(query.select.mock.calls[0]).toEqual(['id', { count: 'exact', head: true }])
    }
  })
})

describe('getAdminWatchBrands', () => {
  it('passe par la fonction SQL, PostgREST ne sachant pas faire de DISTINCT', async () => {
    supabase.rpc.mockResolvedValue({ data: [{ brand: 'OMEGA' }, { brand: 'ROLEX' }], error: null })

    await expect(getAdminWatchBrands()).resolves.toEqual(['OMEGA', 'ROLEX'])
    expect(supabase.rpc).toHaveBeenCalledWith('admin_watch_brands')
  })
})

describe('reorderWatches', () => {
  it('envoie tout le lot en un seul appel', async () => {
    supabase.rpc.mockResolvedValue({ data: 2, error: null })

    const result = await reorderWatches([
      { id: 'w1', display_order: 8 },
      { id: 'w2', display_order: 7 },
    ])

    expect(result.success).toBe(true)
    expect(supabase.rpc).toHaveBeenCalledTimes(1)
    expect(supabase.rpc).toHaveBeenCalledWith('admin_reorder_watches', {
      p_orders: [
        { id: 'w1', display_order: 8 },
        { id: 'w2', display_order: 7 },
      ],
    })
  })

  it('n’appelle pas la base pour un lot vide', async () => {
    const result = await reorderWatches([])

    expect(result.success).toBe(true)
    expect(supabase.rpc).not.toHaveBeenCalled()
  })

  it('signale l’échec sans lever', async () => {
    supabase.rpc.mockResolvedValue({ data: null, error: { message: 'RLS' } })

    await expect(reorderWatches([{ id: 'w1', display_order: 1 }])).resolves.toEqual({
      success: false,
      error: 'Erreur lors de la réorganisation: RLS',
    })
  })
})

describe('moveWatchToCatalogEdge', () => {
  it('délègue le calcul de la position à la base', async () => {
    supabase.rpc.mockResolvedValue({ data: 3001, error: null })

    const result = await moveWatchToCatalogEdge('w1', 'top')

    expect(result).toEqual({ success: true, displayOrder: 3001 })
    expect(supabase.rpc).toHaveBeenCalledWith('admin_move_watch_to_catalog_edge', {
      p_watch_id: 'w1',
      p_edge: 'top',
    })
  })
})
