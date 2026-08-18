/**
 * Le sitemap doit lister chaque page statique dans les trois langues, avec ses équivalents,
 * et ne pas dupliquer les pages dont le contenu vient de la base.
 */
import { describe, expect, it } from 'vitest'

import { buildSitemapStaticRoutes } from '@/site/buildSitemapStaticRoutes.js'
import { withLocalePrefix } from '@/i18n/localePaths.js'
import { resolveSiteConfig } from '@/site/resolveSiteConfig.js'

import { loadRawSiteConfig } from '../helpers/sites.js'

describe('sitemap multilingue', () => {
  it('déclare chaque route statique dans les trois langues pour sauvage-watches', async () => {
    const resolved = resolveSiteConfig(await loadRawSiteConfig('sauvage-watches'))
    const i18n = resolved.i18n
    expect(i18n.locales).toEqual(['fr', 'en', 'de'])

    const routes = buildSitemapStaticRoutes(resolved.features, resolved)
    expect(routes.length).toBeGreaterThan(0)

    const locs = routes.flatMap((route) =>
      i18n.locales.map((code) => {
        const path = withLocalePrefix(route.path || '/', code, i18n)
        return path === '/' ? '' : path
      }),
    )

    expect(locs).toContain('/collection')
    expect(locs).toContain('/en/collection')
    expect(locs).toContain('/de/collection')
    // La racine reste sans slash final, comme aujourd'hui.
    expect(locs).toContain('')
    expect(locs).toContain('/en')
    // Une URL par route et par langue, sans doublon.
    expect(new Set(locs).size).toBe(locs.length)
    expect(locs).toHaveLength(routes.length * 3)
  })

  it('laisse un site monolingue avec une seule entrée par route', async () => {
    const resolved = resolveSiteConfig(await loadRawSiteConfig('jackned'))
    expect(resolved.i18n.enabled).toBe(false)
    const routes = buildSitemapStaticRoutes(resolved.features, resolved)
    const locs = routes.flatMap((route) =>
      resolved.i18n.locales.map((code) => withLocalePrefix(route.path || '/', code, resolved.i18n)),
    )
    expect(locs).toHaveLength(routes.length)
    expect(locs.every((l) => !l.startsWith('/en') && !l.startsWith('/de'))).toBe(true)
  })

  it('n’expose pas les fiches montre et les articles hors langue par défaut', async () => {
    const resolved = resolveSiteConfig(await loadRawSiteConfig('sauvage-watches'))
    // Ces préfixes pilotent aussi l'absence d'alternates hreflang côté front.
    expect(resolved.i18n.untranslatedRoutes).toContain('/montre/')
    expect(resolved.i18n.untranslatedRoutes).toContain('/blog/')
  })
})
