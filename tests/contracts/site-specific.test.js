import { describe, expect, it } from 'vitest'

import { resolveSiteConfig } from '@/site/resolveSiteConfig.js'
import { navigationUsesCatalogBrands, resolveMainNavigation } from '@/site/mainNavigation.js'

import { loadRawSiteConfig } from '../helpers/sites.js'

describe('site-specific profiles', () => {
  it('jackned : catalogue retail boutique', async () => {
    const resolved = resolveSiteConfig(await loadRawSiteConfig('jackned'))
    expect(resolved.watchCatalog.mode).toBe('retail')
    expect(resolved.features.watchReference).toBe(false)
  })

  it('place-des-montres : servicesPage et mega-menu marques', async () => {
    const resolved = resolveSiteConfig(await loadRawSiteConfig('place-des-montres'))
    expect(resolved.features.servicesPage).toBe(true)
    const nav = resolveMainNavigation(resolved)
    expect(navigationUsesCatalogBrands(nav)).toBe(true)
  })

  it('demo-store : siteId cohérent', async () => {
    const raw = await loadRawSiteConfig('demo-store')
    expect(raw.siteId).toBe('demo-store')
    const resolved = resolveSiteConfig(raw)
    expect(resolved.features.collection).toBe(true)
  })
})
