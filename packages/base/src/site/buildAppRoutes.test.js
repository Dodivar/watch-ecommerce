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
    expect(paths).not.toContain('/montre/:slug')
    expect(paths).not.toContain('/collection/:brandSlug')
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

  it('inclut les routes SEO collection quand collection est true', () => {
    const paths = getActiveRoutePaths({ ...DEFAULT_SITE_FEATURES, collection: true })
    expect(paths).toContain('/montre/:slug')
    expect(paths).toContain('/collection/:brandSlug')
    expect(paths).toContain('/watch/:id')
  })

  it('inclut /faq quand faq est true', () => {
    const paths = getActiveRoutePaths({ ...DEFAULT_SITE_FEATURES, faq: true })
    expect(paths).toContain('/faq')
  })

  it('exclut /faq quand faq est false', () => {
    const paths = getActiveRoutePaths({ ...DEFAULT_SITE_FEATURES, faq: false })
    expect(paths).not.toContain('/faq')
  })

  it('newsletter est désactivée par défaut', () => {
    expect(DEFAULT_SITE_FEATURES.newsletter).toBe(false)
  })

  it('exclut les routes newsletter quand newsletter est false', () => {
    const paths = getActiveRoutePaths({ ...DEFAULT_SITE_FEATURES, newsletter: false })
    expect(paths).not.toContain('/admin/newsletter')
    expect(paths).not.toContain('/admin/newsletter/compose')
    expect(paths).not.toContain('/admin/newsletter/:id/edit')
  })

  it('inclut toutes les routes newsletter quand admin et newsletter sont true', () => {
    const paths = getActiveRoutePaths({
      ...DEFAULT_SITE_FEATURES,
      admin: true,
      newsletter: true,
    })
    expect(paths).toContain('/admin/newsletter')
    expect(paths).toContain('/admin/newsletter/compose')
    expect(paths).toContain('/admin/newsletter/subscribers')
    expect(paths).toContain('/admin/newsletter/settings')
    expect(paths).toContain('/admin/newsletter/:id/edit')
  })

  it('exclut les routes newsletter quand admin est false même si newsletter est true', () => {
    const paths = getActiveRoutePaths({
      ...DEFAULT_SITE_FEATURES,
      admin: false,
      newsletter: true,
    })
    expect(paths).not.toContain('/admin/newsletter')
  })
})
