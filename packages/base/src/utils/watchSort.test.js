import { describe, expect, it } from 'vitest'

import { compareWatchesByRecent } from './watchSort.js'

describe('compareWatchesByRecent', () => {
  it('trie par createdAt décroissant', () => {
    const rows = [
      { id: 'ancien', createdAt: '2025-01-01T00:00:00Z' },
      { id: 'recent', createdAt: '2026-06-01T00:00:00Z' },
      { id: 'moyen', createdAt: '2025-12-01T00:00:00Z' },
    ]
    const sorted = [...rows].sort(compareWatchesByRecent)
    expect(sorted.map((r) => r.id)).toEqual(['recent', 'moyen', 'ancien'])
  })

  it('replie sur displayOrder décroissant quand aucune date', () => {
    const rows = [
      { id: 'bas', displayOrder: 1 },
      { id: 'haut', displayOrder: 9 },
      { id: 'sans-ordre' },
    ]
    const sorted = [...rows].sort(compareWatchesByRecent)
    expect(sorted.map((r) => r.id)).toEqual(['haut', 'bas', 'sans-ordre'])
  })

  it('place les montres datées avant celles sans date', () => {
    const dated = { id: 'date', createdAt: '2026-01-01T00:00:00Z' }
    const undated = { id: 'sans-date', displayOrder: 99 }

    expect(compareWatchesByRecent(dated, undated)).toBeLessThan(0)
    expect(compareWatchesByRecent(undated, dated)).toBeGreaterThan(0)
  })
})
