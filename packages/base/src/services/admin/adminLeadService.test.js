import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../supabase', () => ({ supabase: { from: vi.fn() } }))

vi.mock('./adminSiteContext.js', () => ({
  getAdminSiteId: () => 'place-des-montres',
}))

import { supabase } from '../supabase'
import { getLeadStatsByDay } from './adminLeadService.js'

/**
 * Faux query builder PostgREST : chaque méthode se chaîne et est enregistrée,
 * l'objet lui-même est thenable pour répondre au `await` final.
 * @param {object} result - Ce que résout la requête (`{ data, error }`).
 */
function createQuery(result) {
  const calls = []
  const query = {
    calls,
    /** @param {(value: unknown) => unknown} resolve */
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
  }
  for (const method of ['select', 'eq', 'gte', 'order']) {
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

const leadRows = [
  { type: 'contact', created_at: '2026-08-01T09:00:00.000Z' },
  { type: 'repair', created_at: '2026-08-01T18:00:00.000Z' },
  { type: 'repair', created_at: '2026-08-03T11:00:00.000Z' },
  { type: 'appointment', created_at: '2026-08-03T12:00:00.000Z' },
]

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getLeadStatsByDay', () => {
  it('groupe les demandes par jour et par type', async () => {
    supabase.from.mockReturnValue(createQuery({ data: leadRows, error: null }))

    const stats = await getLeadStatsByDay()

    expect(stats.daily.map((d) => d.date)).toEqual(['2026-08-01', '2026-08-03'])
    expect(stats.daily[0].byType.contact).toBe(1)
    expect(stats.daily[0].byType.repair).toBe(1)
    expect(stats.daily[0].total).toBe(2)
    expect(stats.byType).toEqual({
      contact: 1,
      appointment: 1,
      estimation: 0,
      search: 0,
      repair: 2,
    })
    expect(stats.total).toBe(4)
  })

  it('ignore les types hors référentiel plutôt que de créer une série fantôme', async () => {
    supabase.from.mockReturnValue(
      createQuery({
        data: [...leadRows, { type: 'bidon', created_at: '2026-08-04T09:00:00.000Z' }],
        error: null,
      }),
    )

    const stats = await getLeadStatsByDay()

    expect(stats.total).toBe(4)
    expect(stats.daily.map((d) => d.date)).not.toContain('2026-08-04')
    expect(stats.byType.bidon).toBeUndefined()
  })

  it('borne la fenêtre sur `created_at` quand une période est demandée', async () => {
    const query = createQuery({ data: [], error: null })
    supabase.from.mockReturnValue(query)

    await getLeadStatsByDay({ days: 30 })

    expect(callsTo(query, 'eq')).toEqual([['site_id', 'place-des-montres']])
    expect(callsTo(query, 'gte').map(([column]) => column)).toEqual(['created_at'])
  })

  it('ne filtre pas sur la date sans période', async () => {
    const query = createQuery({ data: [], error: null })
    supabase.from.mockReturnValue(query)

    const stats = await getLeadStatsByDay()

    expect(callsTo(query, 'gte')).toEqual([])
    expect(stats).toEqual({ daily: [], byType: expect.any(Object), total: 0 })
  })

  it('remonte l’erreur PostgREST', async () => {
    supabase.from.mockReturnValue(createQuery({ data: null, error: { message: 'RLS refusée' } }))

    await expect(getLeadStatsByDay()).rejects.toThrow('RLS refusée')
  })
})
