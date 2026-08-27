import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  getMaxDisplayOrder,
  loadWatchBatch,
  loadWatchRecord,
} from '../../../scripts/prestashop-import/loadWatchBatch.js'
import { ImportReport } from '../../../scripts/prestashop-import/report.js'

/**
 * Faux query builder PostgREST : chaque méthode se chaîne et est enregistrée,
 * l'objet lui-même est thenable pour répondre au `await` final — certains appels
 * (`hasPrestashopProductIdColumn`) attendent le builder sans terminateur.
 * @param {object} result - Ce que résout la requête (`{ data, error }`).
 */
function createQuery(result = { data: null, error: null }) {
  const calls = []
  const query = {
    calls,
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
  }
  const methods = ['select', 'order', 'limit', 'maybeSingle', 'single', 'eq', 'insert', 'update', 'upsert', 'delete']
  for (const method of methods) {
    query[method] = vi.fn((...args) => {
      calls.push([method, ...args])
      return query
    })
  }
  return query
}

/** Erreur PostgREST renvoyée tant que la migration optionnelle n'est pas appliquée. */
const MISSING_COLUMN_ERROR = {
  code: 'PGRST204',
  message: "Could not find the 'prestashop_product_id' column of 'watches' in the schema cache",
}

/**
 * Client Supabase stubbé : `queue` associe un nom de table à la file des réponses
 * successives attendues sur cette table, dans l'ordre des appels `from()`.
 * @param {Record<string, object[]>} queue
 */
function createSupabase(queue) {
  const issued = []
  const pending = Object.fromEntries(
    Object.entries(queue).map(([table, results]) => [table, [...results]]),
  )

  const supabase = {
    issued,
    from: vi.fn((table) => {
      const results = pending[table] ?? []
      const query = createQuery(results.shift() ?? { data: null, error: null })
      issued.push({ table, query })
      return query
    }),
  }

  /** Tous les arguments passés à `method` sur `table`, requêtes confondues. */
  supabase.argsFor = (table, method) =>
    issued
      .filter((entry) => entry.table === table)
      .flatMap((entry) => entry.query.calls.filter(([name]) => name === method))
      .map(([, ...args]) => args)

  /** Charge utile du premier `insert`/`update` envoyé sur `watches`. */
  supabase.watchPayload = (method) => supabase.argsFor('watches', method)[0]?.[0]

  return supabase
}

/** @returns {import('../../../scripts/prestashop-import/transformPrestashopRow.js').WatchImportRecord} */
function makeRecord(overrides = {}) {
  return {
    prestashopProductId: '10526',
    adCode: 'S30M0CA-AREIRO',
    name: 'Orient Bambino',
    brand: 'ORIENT',
    model: 'Bambino',
    reference: 'RA-AC0M03S',
    price: 250,
    year: null,
    condition: null,
    description: null,
    isAvailable: true,
    audience: 'homme',
    details: {},
    accessories: [],
    imageUrls: [],
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getMaxDisplayOrder', () => {
  it('exclut les NULL du tri décroissant, sinon le rang repart à 1', async () => {
    const supabase = createSupabase({ watches: [{ data: { display_order: 42 }, error: null }] })

    const max = await getMaxDisplayOrder(supabase)

    // Postgres place les NULL en tête en tri décroissant, et la moitié du catalogue
    // a un `display_order` nul : sans `nullsFirst: false` la requête ramène une
    // ligne NULL et `?? 0` fait repartir le lot importé à 1.
    expect(supabase.argsFor('watches', 'order')).toEqual([
      ['display_order', { ascending: false, nullsFirst: false }],
    ])
    expect(max).toBe(42)
  })

  it('retombe à 0 sur un catalogue vide', async () => {
    const supabase = createSupabase({ watches: [{ data: null, error: null }] })

    expect(await getMaxDisplayOrder(supabase)).toBe(0)
  })
})

describe('loadWatchRecord — colonne prestashop_product_id absente', () => {
  it("n'écrit pas la clé à l'insertion", async () => {
    const supabase = createSupabase({
      watches: [
        { data: null, error: null }, // findWatchByAdCode
        { data: { id: 'w1' }, error: null }, // insert().select().single()
      ],
      watch_details: [{ data: null, error: null }],
      watch_accessories: [{ data: null, error: null }],
    })

    const result = await loadWatchRecord(supabase, makeRecord(), {
      displayOrder: 43,
      onConflict: 'update',
      usePrestashopId: false,
    })

    expect(result).toEqual({ action: 'created', watchId: 'w1' })
    const payload = supabase.watchPayload('insert')
    // Clé absente, pas seulement à `null` : PostgREST rejette la présence d'une
    // colonne inconnue quelle que soit sa valeur.
    expect(payload).not.toHaveProperty('prestashop_product_id')
    expect(payload.ad_code).toBe('S30M0CA-AREIRO')
    expect(payload.display_order).toBe(43)
  })

  it("n'écrit pas la clé à la mise à jour", async () => {
    const supabase = createSupabase({
      watches: [
        { data: { id: 'w1', ad_code: 'S30M0CA-AREIRO' }, error: null }, // findWatchByAdCode
        { data: null, error: null }, // update
      ],
      watch_details: [{ data: null, error: null }],
      watch_accessories: [{ data: null, error: null }],
    })

    const result = await loadWatchRecord(supabase, makeRecord(), {
      displayOrder: 43,
      onConflict: 'update',
      usePrestashopId: false,
    })

    expect(result).toEqual({ action: 'updated', watchId: 'w1' })
    const payload = supabase.watchPayload('update')
    expect(payload).not.toHaveProperty('prestashop_product_id')
    expect(payload).not.toHaveProperty('display_order')
  })

  it("n'écrit pas la clé non plus quand le record n'en porte pas", async () => {
    const supabase = createSupabase({
      watches: [
        { data: null, error: null },
        { data: { id: 'w1' }, error: null },
      ],
      watch_details: [{ data: null, error: null }],
      watch_accessories: [{ data: null, error: null }],
    })

    await loadWatchRecord(supabase, makeRecord({ prestashopProductId: '' }), {
      displayOrder: 1,
      onConflict: 'update',
      usePrestashopId: false,
    })

    expect(supabase.watchPayload('insert')).not.toHaveProperty('prestashop_product_id')
  })
})

describe('loadWatchRecord — colonne prestashop_product_id présente', () => {
  it('écrit la clé PrestaShop quand la migration a été appliquée', async () => {
    const supabase = createSupabase({
      watches: [
        { data: null, error: null }, // findWatchByPrestashopId
        { data: null, error: null }, // findWatchByAdCode
        { data: { id: 'w1' }, error: null }, // insert
      ],
      watch_details: [{ data: null, error: null }],
      watch_accessories: [{ data: null, error: null }],
    })

    await loadWatchRecord(supabase, makeRecord(), {
      displayOrder: 43,
      onConflict: 'update',
      usePrestashopId: true,
    })

    expect(supabase.watchPayload('insert').prestashop_product_id).toBe('10526')
    expect(supabase.argsFor('watches', 'eq')).toContainEqual(['prestashop_product_id', '10526'])
  })
})

describe('loadWatchBatch', () => {
  it('importe malgré la colonne absente et numérote après le dernier rang', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const supabase = createSupabase({
      watches: [
        { data: { display_order: 42 }, error: null }, // getMaxDisplayOrder
        { data: null, error: MISSING_COLUMN_ERROR }, // hasPrestashopProductIdColumn
        { data: null, error: null }, // findWatchByAdCode
        { data: { id: 'w1' }, error: null }, // insert
      ],
      watch_details: [{ data: null, error: null }],
      watch_accessories: [{ data: null, error: null }],
    })
    const report = new ImportReport()

    await loadWatchBatch(supabase, [makeRecord()], report, {
      apply: true,
      onConflict: 'update',
      skipImages: true,
      imageConcurrency: 1,
      importImages: async () => ({ imported: 0, failed: 0, errors: [] }),
    })

    expect(report.summary()).toMatchObject({ created: 1, error: 0 })
    const payload = supabase.watchPayload('insert')
    expect(payload).not.toHaveProperty('prestashop_product_id')
    expect(payload.display_order).toBe(43)
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })
})
