import { describe, expect, it } from 'vitest'

import { DEFAULT_SITE_FEATURES } from './siteFeatures.js'
import { getActiveRoutePaths } from './appRouteMeta.js'

describe('buildAppRoutes', () => {
  it('exclut checkout quand purchase est false', () => {
    const paths = getActiveRoutePaths({ ...DEFAULT_SITE_FEATURES, purchase: false })
    expect(paths).not.toContain('/checkout')
  })

  it('exclut les routes collection quand collection est false', () => {
    const paths = getActiveRoutePaths({ ...DEFAULT_SITE_FEATURES, collection: false })
    expect(paths).not.toContain('/collection')
    expect(paths).not.toContain('/watch/:id')
  })

  it('conserve toujours / et /maintenance', () => {
    const paths = getActiveRoutePaths({
      ...DEFAULT_SITE_FEATURES,
      collection: false,
      blog: false,
      purchase: false,
    })
    expect(paths).toContain('/')
    expect(paths).toContain('/maintenance')
  })

  it('inclut /guide-horloger quand guidePage est true', () => {
    const paths = getActiveRoutePaths({ ...DEFAULT_SITE_FEATURES, guidePage: true })
    expect(paths).toContain('/guide-horloger')
  })

  it('inclut /faq quand faq est true', () => {
    const paths = getActiveRoutePaths({ ...DEFAULT_SITE_FEATURES, faq: true })
    expect(paths).toContain('/faq')
  })

  it('exclut /faq quand faq est false', () => {
    const paths = getActiveRoutePaths({ ...DEFAULT_SITE_FEATURES, faq: false })
    expect(paths).not.toContain('/faq')
  })
})
