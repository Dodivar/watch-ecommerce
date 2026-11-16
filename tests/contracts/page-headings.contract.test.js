/**
 * Garantie : toute page publique statique pré-rendue sort avec un `<h1>`, pour chaque vitrine
 * et chaque langue — exactement les routes que `scripts/prerender-static-routes.mjs` écrit.
 *
 * Un titre vide retomberait sur le titre de repli (`resolveHomeFallbackHeading`) ; une clé de
 * catalogue introuvable rendrait la clé elle-même (`collection.title`). Les deux trahissent une
 * table `STATIC_ROUTE_HEADINGS` qui ne suit plus le composant : on les refuse ici.
 */
import { describe, expect, it } from 'vitest'

import { buildSitemapStaticRoutes } from '@/site/buildSitemapStaticRoutes.js'
import { resolveSiteFeaturesForNode } from '@/site/resolveSiteFeaturesForNode.js'
import { resolveI18nConfig } from '@/site/resolveI18nConfig.js'
import { localizeTree } from '@/site/i18nValue.js'
import { MESSAGE_CATALOGS } from '@/i18n/messages/index.js'
import { createTranslator } from '@/i18n/translator.js'
import { STATIC_ROUTE_SEO_SECTIONS } from '@/site/staticRouteHead.js'
import {
  STATIC_ROUTE_HEADINGS,
  buildStaticRouteHeading,
  resolveHomeFallbackHeading,
} from '@/site/pageHeadings.js'
import { listBuildableSiteIds, loadRawSiteConfig } from '../helpers/sites.js'

const CATALOG_KEY = /^[a-z][A-Za-z]*(\.[A-Za-z0-9]+)+$/

describe('titres <h1> des routes statiques', () => {
  it('couvre toutes les routes dont le pré-rendu écrit la tête', () => {
    const routes = Object.keys(STATIC_ROUTE_SEO_SECTIONS).filter(Boolean)
    expect(routes.filter((route) => !STATIC_ROUTE_HEADINGS[route])).toEqual([])
  })

  for (const siteId of listBuildableSiteIds()) {
    it(`${siteId} : chaque page pré-rendue a un vrai titre, dans chaque langue`, async () => {
      const siteConfig = await loadRawSiteConfig(siteId)
      const features = resolveSiteFeaturesForNode(siteConfig)
      const routes = ['', ...buildSitemapStaticRoutes(features, siteConfig).map((r) => r.path)]
      const i18n = resolveI18nConfig(siteConfig)

      const problems = []
      for (const locale of i18n.locales) {
        const localized = localizeTree(siteConfig, locale, i18n.defaultLocale)
        const { t } = createTranslator({
          locale,
          fallbackLocale: i18n.defaultLocale,
          catalogs: MESSAGE_CATALOGS,
          overrides: i18n.messages,
        })
        const fallback = resolveHomeFallbackHeading(localized)

        for (const routePath of new Set(routes)) {
          const heading = buildStaticRouteHeading({ routePath, siteConfig: localized, t })
          const label = `${locale} ${routePath || '/'} → « ${heading} »`
          if (!heading) problems.push(`${label} (vide)`)
          else if (CATALOG_KEY.test(heading)) problems.push(`${label} (clé introuvable)`)
          // Le repli est légitime pour un accueil sans hero, jamais pour une autre page.
          else if (routePath && heading === fallback) problems.push(`${label} (repli)`)
        }
      }
      expect(problems).toEqual([])
    })
  }
})
