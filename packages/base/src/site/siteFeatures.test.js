import { describe, expect, it } from 'vitest'

import {
  DEFAULT_SITE_FEATURES,
  getBrowsePath,
  mergeSiteFeatures,
} from './siteFeatures.js'

describe('mergeSiteFeatures', () => {
  it('applique les défauts quand partial est vide', () => {
    expect(mergeSiteFeatures({})).toEqual(DEFAULT_SITE_FEATURES)
  })

  it('surcharge partiellement les flags', () => {
    const merged = mergeSiteFeatures({ collection: false, blog: false })
    expect(merged.collection).toBe(false)
    expect(merged.blog).toBe(false)
    expect(merged.recherche).toBe(true)
  })

  it('désactive estimationProcess quand estimation est false', () => {
    const merged = mergeSiteFeatures({ estimation: false })
    expect(merged.estimation).toBe(false)
    expect(merged.estimationProcess).toBe(false)
  })

  it('désactive soldArchive quand collection est false', () => {
    const merged = mergeSiteFeatures({ collection: false, soldArchive: true })
    expect(merged.soldArchive).toBe(false)
  })

  it('active soldArchive sur opt-in explicite avec collection', () => {
    expect(DEFAULT_SITE_FEATURES.soldArchive).toBe(false)
    const merged = mergeSiteFeatures({ soldArchive: true })
    expect(merged.soldArchive).toBe(true)
  })

  it('laisse le coup de foudre éteint par défaut', () => {
    expect(DEFAULT_SITE_FEATURES.watchMatchmaking).toBe(false)
    expect(DEFAULT_SITE_FEATURES.watchMatchAlerts).toBe(false)
  })

  it('désactive watchMatchmaking quand collection est false', () => {
    const merged = mergeSiteFeatures({ collection: false, watchMatchmaking: true })
    expect(merged.watchMatchmaking).toBe(false)
  })

  it('désactive watchMatchAlerts sans watchMatchmaking', () => {
    expect(mergeSiteFeatures({ watchMatchAlerts: true }).watchMatchAlerts).toBe(false)
    const merged = mergeSiteFeatures({ watchMatchmaking: true, watchMatchAlerts: true })
    expect(merged.watchMatchAlerts).toBe(true)
  })
})

describe('getBrowsePath', () => {
  it('retourne /collection quand collection est activée', () => {
    expect(getBrowsePath({ collection: true })).toBe('/collection')
  })

  it('retourne / quand collection est désactivée', () => {
    expect(getBrowsePath({ collection: false })).toBe('/')
  })
})
