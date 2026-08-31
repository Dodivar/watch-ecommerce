/**
 * Couvre le résolveur de format d'affichage (`collection.displayMode`).
 * `getResolvedCollectionPageSize` et `getMergedCollectionFilters` restent
 * couverts indirectement par les tests de contrat, pas ici.
 */
import { describe, expect, it, vi, afterEach } from 'vitest'

import {
  COLLECTION_DISPLAY_MODES,
  DEFAULT_COLLECTION_DISPLAY_MODE,
  getResolvedCollectionDisplayMode,
} from './collectionFilters.js'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('getResolvedCollectionDisplayMode', () => {
  it('retombe sur grid sans bloc collection', () => {
    expect(getResolvedCollectionDisplayMode({})).toBe('grid')
    expect(DEFAULT_COLLECTION_DISPLAY_MODE).toBe('grid')
  })

  it('retombe sur grid quand displayMode est absent', () => {
    expect(getResolvedCollectionDisplayMode({ collection: { pageSize: 24 } })).toBe('grid')
  })

  it.each(COLLECTION_DISPLAY_MODES)('accepte le format %s', (mode) => {
    expect(getResolvedCollectionDisplayMode({ collection: { displayMode: mode } })).toBe(mode)
  })

  it('retombe sur grid pour une valeur inconnue', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(getResolvedCollectionDisplayMode({ collection: { displayMode: 'mosaic' } })).toBe(
      'grid',
    )
  })

  it('avertit en dev sur une valeur inconnue', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    getResolvedCollectionDisplayMode({ collection: { displayMode: 'carousel' } })
    expect(warn).toHaveBeenCalledOnce()
    expect(warn.mock.calls[0][0]).toContain('carousel')
  })

  it('ne casse pas sur un manifest absent', () => {
    expect(getResolvedCollectionDisplayMode(undefined)).toBe('grid')
    expect(getResolvedCollectionDisplayMode(null)).toBe('grid')
  })
})
