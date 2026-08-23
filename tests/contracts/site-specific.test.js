import { describe, expect, it } from 'vitest'

import { resolveSiteConfig } from '@/site/resolveSiteConfig.js'
import { navigationUsesCatalogBrands, resolveMainNavigation } from '@/site/mainNavigation.js'
import { buildSitemapStaticRoutes } from '@/site/buildSitemapStaticRoutes.js'
import { getActiveRoutePaths } from '@/site/appRouteMeta.js'

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

  it('place-des-montres : atelier — formulaire de devis et pages prestation', async () => {
    const resolved = resolveSiteConfig(await loadRawSiteConfig('place-des-montres'))

    expect(resolved.features.repairRequest).toBe(true)
    expect(resolved.servicesPage.repairRequest.services.length).toBeGreaterThan(0)

    expect(resolved.features.serviceLandings).toBe(true)
    expect(getActiveRoutePaths(resolved.features)).toContain('/services/:serviceSlug')

    // Chaque page prestation doit être indexable : sans entrée sitemap, elle n'existe pas
    // pour la recherche locale, qui est toute la raison d'être de ces pages.
    const sitemapPaths = buildSitemapStaticRoutes(resolved.features, resolved).map((r) => r.path)
    for (const landing of resolved.servicesPage.landings) {
      expect(sitemapPaths).toContain(landing.path)
    }
    expect(resolved.servicesPage.landings.map((l) => l.slug)).toContain(
      'reparation-montre-strasbourg',
    )
  })

  it('demo-store : siteId cohérent', async () => {
    const raw = await loadRawSiteConfig('demo-store')
    expect(raw.siteId).toBe('demo-store')
    const resolved = resolveSiteConfig(raw)
    expect(resolved.features.collection).toBe(true)
  })
})
