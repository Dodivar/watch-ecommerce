import { describe, expect, it } from 'vitest'

import { DEFAULT_SITE_FEATURES } from './siteFeatures.js'
import { buildSitemapStaticRoutes } from './buildSitemapStaticRoutes.js'

describe('buildSitemapStaticRoutes', () => {
  it('inclut les pages légales et à propos par défaut', () => {
    const routes = buildSitemapStaticRoutes(DEFAULT_SITE_FEATURES)
    const paths = routes.map((route) => route.path)

    expect(paths).toContain('/a-propos')
    expect(paths).toContain('/politique-confidentialite')
    expect(paths).toContain('/mentions-legales')
    expect(paths).toContain('/conditions-generales-utilisation')
  })

  it('exclut blog et collection quand les features sont désactivées', () => {
    const routes = buildSitemapStaticRoutes({
      ...DEFAULT_SITE_FEATURES,
      collection: false,
      blog: false,
    })
    const paths = routes.map((route) => route.path)

    expect(paths).not.toContain('/collection')
    expect(paths).not.toContain('/blog')
    expect(paths).toContain('')
  })

  it('exclut /services sans contenu servicesPage dans le manifest', () => {
    const routes = buildSitemapStaticRoutes(
      { ...DEFAULT_SITE_FEATURES, servicesPage: true },
      {},
    )
    expect(routes.map((route) => route.path)).not.toContain('/services')
  })

  it('inclut /services quand feature et contenu sont actifs', () => {
    const routes = buildSitemapStaticRoutes(
      { ...DEFAULT_SITE_FEATURES, servicesPage: true },
      { servicesPage: { title: 'Services' } },
    )
    expect(routes.map((route) => route.path)).toContain('/services')
  })

  it('reflète le profil place-des-montres (pas de blog ni estimation)', () => {
    const routes = buildSitemapStaticRoutes(
      {
        ...DEFAULT_SITE_FEATURES,
        blog: false,
        recherche: false,
        estimation: false,
        estimationProcess: false,
        servicesPage: true,
        guidePage: true,
        faq: true,
      },
      { servicesPage: {}, guidePage: {} },
    )
    const paths = routes.map((route) => route.path)

    expect(paths).not.toContain('/blog')
    expect(paths).not.toContain('/recherche')
    expect(paths).not.toContain('/estimation')
    expect(paths).toContain('/services')
    expect(paths).toContain('/guide-horloger')
    expect(paths).toContain('/faq')
  })
})
