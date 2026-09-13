import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { createClient } from '@supabase/supabase-js'

import { buildSitemapStaticRoutes } from '../packages/base/src/site/buildSitemapStaticRoutes.js'
import {
  MAX_SITEMAP_IMAGES_PER_WATCH,
  buildSitemapXml,
} from '../packages/base/src/site/buildSitemapXml.js'
import { resolveSiteConfig } from '../packages/base/src/site/resolveSiteConfig.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function loadSiteConfig() {
  const siteId =
    process.env.SITE_ID?.trim() ||
    process.env.VITE_SITE_ID?.trim() ||
    'sauvage-watches'
  const configPath = path.join(__dirname, '..', 'sites', siteId, 'site.config.js')
  const { default: siteConfig } = await import(pathToFileURL(configPath).href)
  return { siteId, siteConfig }
}

function stripTrailingSlash(value) {
  if (typeof value !== 'string' || !value.trim()) return ''
  return value.trim().replace(/\/$/, '')
}

function resolveBaseUrl(siteConfig, req, env = process.env) {
  const explicit = env.VITE_BASE_URL || env.BASE_URL
  if (explicit) return stripTrailingSlash(explicit)

  const urls = siteConfig?.urls ?? {}
  const urlProduction = stripTrailingSlash(urls.production)
  const urlStaging = stripTrailingSlash(urls.staging)
  const urlDevelopment = stripTrailingSlash(urls.development)
  const previewFallbackHost = stripTrailingSlash(urls.previewFallbackHost)
  const vercelPreviewUrl = env.VERCEL_URL
    ? `https://${stripTrailingSlash(env.VERCEL_URL)}`
    : ''

  if (env.VERCEL_ENV === 'production') {
    return urlProduction || vercelPreviewUrl || urlDevelopment
  }

  if (env.VERCEL_ENV === 'preview' || env.VERCEL_URL) {
    if (
      env.VERCEL_URL?.includes('recette') ||
      req.headers.host?.includes('recette')
    ) {
      return urlStaging || vercelPreviewUrl || urlProduction || urlDevelopment
    }
    if (vercelPreviewUrl) return vercelPreviewUrl
    const requestHost = stripTrailingSlash(req.headers.host?.split(',')[0])
    if (requestHost) return `https://${requestHost}`
    if (previewFallbackHost) return `https://${previewFallbackHost}`
    return urlStaging || urlProduction || urlDevelopment
  }

  return urlProduction || urlDevelopment || vercelPreviewUrl
}

export { resolveBaseUrl }

/**
 * Visuels par fiche montre, pour l'extension `image:` du sitemap : le catalogue est entièrement
 * visuel, et Google Images est un canal d'acquisition à part entière pour de l'horlogerie.
 *
 * Une lecture ratée n'est pas bloquante — le sitemap sort alors sans visuels plutôt que pas
 * du tout.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {{ id?: string }[]} watches
 * @returns {Promise<Map<string, string[]>>}
 */
async function loadWatchImages(supabase, watches) {
  const byWatchId = new Map()
  const watchIds = watches.map((watch) => watch?.id).filter(Boolean)
  if (watchIds.length === 0) return byWatchId

  const { data, error } = await supabase
    .from('watch_images')
    .select('watch_id, image_url, image_path, image_order')
    .in('watch_id', watchIds)
    .order('watch_id', { ascending: true })
    .order('image_order', { ascending: true })

  if (error) {
    console.error('Erreur lors de la récupération des visuels du sitemap:', error)
    return byWatchId
  }

  for (const record of data ?? []) {
    const list = byWatchId.get(record.watch_id) ?? []
    if (list.length >= MAX_SITEMAP_IMAGES_PER_WATCH) continue

    // `image_url` quand il est stocké, URL publique du Storage sinon — même règle que
    // `resolveImageRecordUrl` dans `watchService.js`.
    const url =
      record.image_url ||
      supabase.storage.from('watch-images').getPublicUrl(record.image_path).data?.publicUrl
    if (!url) continue

    list.push(url)
    byWatchId.set(record.watch_id, list)
  }

  return byWatchId
}

export default async function handler(req, res) {
  // Gérer les requêtes OPTIONS pour CORS
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  // Seulement GET est autorisé
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }
  try {
    const { siteConfig } = await loadSiteConfig()
    const resolved = resolveSiteConfig(siteConfig)
    const { features } = resolved
    const baseUrl = resolveBaseUrl(siteConfig, req)

    if (!baseUrl) {
      return res.status(500).json({
        error: 'Configuration manquante',
        message:
          'Impossible de déterminer l\'URL de base du sitemap. Renseignez urls.production dans site.config.js ou BASE_URL / VITE_BASE_URL.',
      })
    }

    // Récupération des variables d'environnement
    // Note: Les variables VITE_* ne sont pas disponibles dans les fonctions serverless Vercel
    // Il faut utiliser les variables sans préfixe VITE_ dans Vercel
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error('Variables d\'environnement manquantes:', {
        hasSupabaseUrl: !!supabaseUrl,
        hasSupabaseKey: !!supabaseKey,
        envKeys: Object.keys(process.env).filter(k => k.includes('SUPABASE'))
      })
      return res.status(500).json({ 
        error: 'Configuration manquante',
        message: 'Les variables d\'environnement Supabase ne sont pas configurées. Veuillez ajouter SUPABASE_URL et SUPABASE_ANON_KEY dans les paramètres Vercel.'
      })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    let watches = []
    if (features.collection) {
      const { data, error: watchesError } = await supabase
        .from('watches')
        .select('id, slug, brand, name, reference, updated_at')
        .eq('is_available', true)
        .eq('is_sold', false)

      if (watchesError) {
        console.error('Erreur lors de la récupération des montres:', watchesError)
      } else {
        watches = data || []
      }
    }

    let articles = []
    if (features.blog) {
      const { data, error: articlesError } = await supabase
        .from('articles')
        .select('id, updated_at')
        .eq('is_visible', true)
        .order('created_at', { ascending: false })

      if (articlesError) {
        console.error('Erreur lors de la récupération des articles:', articlesError)
      } else {
        articles = data || []
      }
    }

    const staticRoutes = buildSitemapStaticRoutes(features, resolved)
    const imagesByWatchId = await loadWatchImages(supabase, watches)

    const xml = buildSitemapXml({
      baseUrl,
      staticRoutes,
      // `resolveSiteConfig` expose déjà le bloc i18n normalisé.
      i18n: resolved.i18n,
      watches,
      articles,
      imagesByWatchId,
    })

    // Définir les en-têtes de réponse
    res.setHeader('Content-Type', 'application/xml')
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
    res.status(200).send(xml)
  } catch (error) {
    console.error('Erreur lors de la génération du sitemap:', error)
    res.status(500).json({ 
      error: 'Erreur lors de la génération du sitemap',
      message: error.message 
    })
  }
}

