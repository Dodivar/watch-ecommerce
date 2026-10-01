import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../supabase', () => ({
  supabase: { from: vi.fn(), rpc: vi.fn(), storage: { from: vi.fn() } },
}))

vi.mock('@/i18n', () => ({
  getI18nConfig: () => ({ enabled: true, defaultLocale: 'fr', locales: ['fr', 'en', 'de'] }),
}))

import { supabase } from '../supabase'
import { saveWatchTranslations } from './adminWatchService.js'

/**
 * Faux query builder PostgREST : chaque méthode se chaîne, l'objet est thenable.
 * @param {object} result - Ce que résout la requête (`{ data, error }`).
 */
function createQuery(result) {
  const query = { then: (resolve, reject) => Promise.resolve(result).then(resolve, reject) }
  for (const method of ['upsert', 'delete', 'eq', 'in']) {
    query[method] = vi.fn(() => query)
  }
  return query
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('saveWatchTranslations', () => {
  it('upsert les langues renseignées et supprime celles vidées', async () => {
    const upsertQuery = createQuery({ error: null })
    const deleteQuery = createQuery({ error: null })
    supabase.from.mockReturnValueOnce(upsertQuery).mockReturnValueOnce(deleteQuery)

    const result = await saveWatchTranslations('w1', { en: '  Nice watch ', de: '' })

    expect(result).toBeNull()
    expect(upsertQuery.upsert).toHaveBeenCalledWith(
      [{ watch_id: 'w1', locale: 'en', description: 'Nice watch' }],
      { onConflict: 'watch_id,locale' },
    )
    expect(deleteQuery.in).toHaveBeenCalledWith('locale', ['de'])
  })

  it('remonte un message explicite quand la table est absente', async () => {
    supabase.from.mockReturnValueOnce(
      createQuery({ error: { code: 'PGRST205', message: 'Could not find the table' } }),
    )

    const result = await saveWatchTranslations('w1', { en: 'Nice watch', de: 'Schöne Uhr' })

    expect(result).toContain('EN/DE')
    expect(result).toContain('watch_translations')
  })

  it('remonte le message PostgREST pour tout autre refus (RLS…)', async () => {
    supabase.from.mockReturnValueOnce(
      createQuery({ error: { code: '42501', message: 'new row violates row-level security' } }),
    )

    const result = await saveWatchTranslations('w1', { en: 'Nice watch', de: 'Schöne Uhr' })

    expect(result).toContain('row-level security')
  })
})
