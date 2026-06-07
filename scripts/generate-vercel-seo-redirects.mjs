/**
 * Génère les redirections 301 SEO (legacy /watch/:id, PrestaShop, ?marque=) dans vercel.json.
 * Exécuté pendant build:vercel si Supabase est configuré.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { createClient } from '@supabase/supabase-js'

import { buildAllSeoRedirects } from '../packages/base/src/site/buildSeoRedirects.js'
import { resolveSiteFeaturesForNode } from '../packages/base/src/site/resolveSiteFeaturesForNode.js'
import { resolveSitePaths } from '../vite/resolve-site.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.join(__dirname, '..')
const vercelJsonPath = path.join(repoRoot, 'vercel.json')

async function loadSiteConfig() {
  const { siteId, siteConfigPath } = resolveSitePaths({ requireExplicit: true })
  const { default: siteConfig } = await import(pathToFileURL(siteConfigPath).href)
  return { siteId, siteConfig }
}

async function fetchWatches(features) {
  if (!features.collection) return []

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.warn('[seo-redirects] Supabase absent — redirections /watch/:id ignorées.')
    return []
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  const { data, error } = await supabase
    .from('watches')
    .select('id, slug, brand, name, reference')
    .eq('is_available', true)
    .eq('is_sold', false)

  if (error) {
    console.warn('[seo-redirects] Erreur Supabase:', error.message)
    return []
  }

  return data ?? []
}

function mergeRedirects(existingRedirects, generatedRedirects) {
  const manual = Array.isArray(existingRedirects) ? existingRedirects : []
  const manualKeys = new Set(
    manual.map((r) => `${r.source}|${r.destination}|${JSON.stringify(r.has ?? null)}`),
  )

  const appended = generatedRedirects.filter((redirect) => {
    const key = `${redirect.source}|${redirect.destination}|${JSON.stringify(redirect.has ?? null)}`
    return !manualKeys.has(key)
  })

  return [...manual, ...appended]
}

async function main() {
  const { siteId, siteConfig } = await loadSiteConfig()
  const features = resolveSiteFeaturesForNode(siteConfig)
  const watches = await fetchWatches(features)
  const generated = buildAllSeoRedirects(siteConfig, watches)

  const vercelConfig = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf8'))
  vercelConfig.redirects = mergeRedirects(vercelConfig.redirects, generated)

  fs.writeFileSync(vercelJsonPath, `${JSON.stringify(vercelConfig, null, 4)}\n`, 'utf8')
  console.log(
    `[seo-redirects] SITE_ID=${siteId} — ${generated.length} redirection(s) SEO fusionnée(s) dans vercel.json`,
  )
}

main().catch((err) => {
  console.error('[seo-redirects]', err instanceof Error ? err.message : err)
  process.exit(1)
})
