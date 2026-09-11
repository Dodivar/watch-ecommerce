/**
 * Pré-génère des index.html pour les routes publiques statiques (shell SPA).
 * Améliore la première réponse HTML des crawlers sur les pages sans données dynamiques.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { buildSitemapStaticRoutes } from '../packages/base/src/site/buildSitemapStaticRoutes.js'
import { resolveSiteFeaturesForNode } from '../packages/base/src/site/resolveSiteFeaturesForNode.js'
import { resolveI18nConfig } from '../packages/base/src/site/resolveI18nConfig.js'
import { localizeTree } from '../packages/base/src/site/i18nValue.js'
import {
  applyStaticRouteHead,
  buildStaticRouteHead,
} from '../packages/base/src/site/staticRouteHead.js'
import { localePrefix } from '../packages/base/src/i18n/localePaths.js'
import { resolveSitePaths } from '../vite/resolve-site.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.join(__dirname, '..', 'dist')

async function main() {
  const indexPath = path.join(distDir, 'index.html')
  if (!fs.existsSync(indexPath)) {
    console.warn('[prerender] dist/index.html introuvable — étape ignorée.')
    return
  }

  const { siteConfigPath } = resolveSitePaths({ requireExplicit: true })
  const { default: siteConfig } = await import(pathToFileURL(siteConfigPath).href)
  const features = resolveSiteFeaturesForNode(siteConfig)
  const routes = buildSitemapStaticRoutes(features, siteConfig)

  const i18n = resolveI18nConfig(siteConfig)
  const baseUrl = String(siteConfig?.urls?.production ?? '').replace(/\/$/, '')
  if (!baseUrl) {
    console.warn('[prerender] urls.production absent — canoniques laissées telles quelles.')
  }
  let written = 0
  let withOwnCopy = 0

  // Chaque langue part de sa propre coquille (`dist/en/index.html`), écrite au build par
  // `vite/site-from-config.mjs` : c'est elle qui porte le bon `lang`, le bon titre et la
  // bonne canonique. Sans coquille de langue, la langue est simplement ignorée.
  for (const locale of i18n.locales) {
    const prefix = localePrefix(locale, i18n)
    const shellPath = prefix ? path.join(distDir, prefix.slice(1), 'index.html') : indexPath
    if (!fs.existsSync(shellPath)) {
      console.warn(`[prerender] coquille absente pour « ${locale} » — langue ignorée.`)
      continue
    }
    const html = fs.readFileSync(shellPath, 'utf8')
    // Manifest aplati une fois par langue : `seo.<section>.title` peut être un `t({ fr, en, de })`.
    const localizedConfig = localizeTree(siteConfig, locale, i18n.defaultLocale)

    for (const route of routes) {
      if (!route.path || route.path === '') continue
      const targetDir = path.join(distDir, prefix.slice(1), route.path.replace(/^\//, ''))
      fs.mkdirSync(targetDir, { recursive: true })

      // Sans cette réécriture, chaque page servait le titre, la description et surtout la
      // canonique de l'accueil : invisible pour Google (qui rend le JS), déterminant pour les
      // robots sociaux, qui ne le rendent pas.
      const head = buildStaticRouteHead({
        siteConfig: localizedConfig,
        routePath: route.path,
        locale,
        i18n,
        baseUrl,
      })
      const routeHtml = baseUrl ? applyStaticRouteHead(html, head) : html
      if (head.hasOwnCopy) withOwnCopy += 1

      fs.writeFileSync(path.join(targetDir, 'index.html'), routeHtml, 'utf8')
      written += 1
    }
  }

  console.log(
    `[prerender] ${written} route(s) statique(s) pré-rendue(s) dans dist/ (${i18n.locales.join(', ')}) — ` +
      `dont ${withOwnCopy} avec titre et description propres.`,
  )
}

main().catch((err) => {
  console.error('[prerender]', err instanceof Error ? err.message : err)
  process.exit(1)
})
