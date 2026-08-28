import { describe, expect, it, vi } from 'vitest'

import {
  filterHomeSectionsByFeatures,
  KNOWN_HOME_SECTION_IDS,
  resolveHomeSections,
} from './homeSections.js'

describe('resolveHomeSections', () => {
  it('retourne un tableau vide si home.sections est absent', () => {
    expect(resolveHomeSections({})).toEqual([])
  })

  it('conserve les ids connus et ignore les inconnus', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const sections = resolveHomeSections({
      home: { sections: ['hero', 'unknown-id', 'faq'] },
    })
    expect(sections).toEqual(['hero', 'faq'])
    warn.mockRestore()
  })

  it('couvre tous les ids documentés', () => {
    expect(KNOWN_HOME_SECTION_IDS).toContain('selections')
    expect(KNOWN_HOME_SECTION_IDS).toContain('stats')
    expect(KNOWN_HOME_SECTION_IDS).toContain('aboutPreview')
    expect(KNOWN_HOME_SECTION_IDS).toContain('services')
    expect(KNOWN_HOME_SECTION_IDS).toContain('avisGoogle')
  })
})

describe('filterHomeSectionsByFeatures', () => {
  const baseFeatures = {
    collection: true,
    recherche: true,
    estimation: true,
    faq: true,
  }

  it('retire avisGoogle si features.googleReviews est false', () => {
    const out = filterHomeSectionsByFeatures(['hero', 'avisGoogle'], {
      ...baseFeatures,
      googleReviews: false,
    })
    expect(out).toEqual(['hero'])
  })

  it('conserve avisGoogle si features.googleReviews est true', () => {
    const out = filterHomeSectionsByFeatures(['hero', 'avisGoogle'], {
      ...baseFeatures,
      googleReviews: true,
    })
    expect(out).toEqual(['hero', 'avisGoogle'])
  })

  it('retire faq si features.faq est false', () => {
    const out = filterHomeSectionsByFeatures(['hero', 'faq'], { ...baseFeatures, faq: false })
    expect(out).toEqual(['hero'])
  })

  it('retire hero compact sans titre', () => {
    const out = filterHomeSectionsByFeatures(
      ['hero', 'stats'],
      baseFeatures,
      { home: { hero: { variant: 'compact', title: null } } },
    )
    expect(out).toEqual(['stats'])
  })

  it('conserve hero parallax sans config compact', () => {
    const out = filterHomeSectionsByFeatures(
      ['hero', 'stats'],
      baseFeatures,
      { home: { hero: { variant: 'parallax' } } },
    )
    expect(out).toEqual(['hero', 'stats'])
  })

  it('retire selections sans cartes ou sans collection', () => {
    const noCards = filterHomeSectionsByFeatures(
      ['selections'],
      baseFeatures,
      { home: { selections: { cards: [] } } },
    )
    expect(noCards).toEqual([])

    const noCollection = filterHomeSectionsByFeatures(
      ['selections'],
      { ...baseFeatures, collection: false },
      { home: { selections: { cards: [{ label: 'Test', filters: {} }] } } },
    )
    expect(noCollection).toEqual([])
  })

  it('retire services si recherche, collection et estimation sont off', () => {
    const out = filterHomeSectionsByFeatures(
      ['services'],
      { collection: false, recherche: false, estimation: false, faq: false },
    )
    expect(out).toEqual([])
  })
})
