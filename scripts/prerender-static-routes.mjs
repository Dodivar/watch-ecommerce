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
  let written = 0

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

    for (const route of routes) {
      if (!route.path || route.path === '') continue
      const targetDir = path.join(distDir, prefix.slice(1), route.path.replace(/^\//, ''))
      fs.mkdirSync(targetDir, { recursive: true })
      fs.writeFileSync(path.join(targetDir, 'index.html'), html, 'utf8')
      written += 1
    }
  }

  console.log(
    `[prerender] ${written} route(s) statique(s) pré-rendue(s) dans dist/ (${i18n.locales.join(', ')}).`,
  )
}

main().catch((err) => {
  console.error('[prerender]', err instanceof Error ? err.message : err)
  process.exit(1)
})
