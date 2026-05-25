import { describe, expect, it } from 'vitest'

import { resolveBaseUrl } from '../../api/sitemap.js'

const siteConfig = {
  urls: {
    production: 'https://example.com',
    staging: 'https://recette.example.com',
    development: 'http://localhost:5173',
  },
}

describe('resolveBaseUrl (sitemap)', () => {
  it('does not return a bare https:// when previewFallbackHost is missing', () => {
    const baseUrl = resolveBaseUrl(
      siteConfig,
      { headers: {} },
      { VERCEL_ENV: 'preview' },
    )

    expect(baseUrl).not.toBe('https://')
    expect(baseUrl).toBeTruthy()
  })

  it('uses the request host on preview when VERCEL_URL is absent', () => {
    const baseUrl = resolveBaseUrl(
      siteConfig,
      { headers: { host: 'my-branch.vercel.app' } },
      { VERCEL_ENV: 'preview' },
    )

    expect(baseUrl).toBe('https://my-branch.vercel.app')
  })

  it('falls back to staging before production in preview', () => {
    const baseUrl = resolveBaseUrl(siteConfig, { headers: {} }, { VERCEL_ENV: 'preview' })

    expect(baseUrl).toBe('https://recette.example.com')
  })
})
