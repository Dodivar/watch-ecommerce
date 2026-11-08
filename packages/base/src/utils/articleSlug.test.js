import { describe, expect, it } from 'vitest'

import { buildArticleKey, buildArticlePath, isArticleUuid } from './articleSlug.js'

describe('articleSlug', () => {
  it('préfère le slug à l’UUID', () => {
    expect(buildArticlePath({ id: '181a281b-d439-4c4a-a28a-3575616a3ee7', slug: 'estimer-sa-rolex' })).toBe(
      '/blog/estimer-sa-rolex',
    )
  })

  it('se rabat sur l’UUID sans slug (projet non migré)', () => {
    expect(buildArticlePath({ id: '181a281b-d439-4c4a-a28a-3575616a3ee7', slug: null })).toBe(
      '/blog/181a281b-d439-4c4a-a28a-3575616a3ee7',
    )
    expect(buildArticleKey(null)).toBe('')
    expect(buildArticlePath(null)).toBe('/blog')
  })

  it('reconnaît l’ancienne adresse en UUID', () => {
    expect(isArticleUuid('181a281b-d439-4c4a-a28a-3575616a3ee7')).toBe(true)
    expect(isArticleUuid('estimer-sa-rolex')).toBe(false)
    expect(isArticleUuid(undefined)).toBe(false)
  })
})
