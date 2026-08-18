import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { createClient } from '@supabase/supabase-js'

import { buildSitemapStaticRoutes } from '../packages/base/src/site/buildSitemapStaticRoutes.js'
import { withLocalePrefix } from '../packages/base/src/i18n/localePaths.js'
import { slugifyBrand } from '../packages/base/src/utils/brandSlug.js'
import { buildWatchSlug } from '../packages/base/src/utils/watchSlug.js'
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
    // `resolveSiteConfig` expose déjà le bloc i18n normalisé.
    const i18n = resolved.i18n

    // Générer le XML
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
`

    /**
     * Les pages statiques existent dans chaque langue activée : une entrée par langue, chacune
     * déclarant ses équivalents. Les fiches montre et les articles n'apparaissent qu'en langue
     * par défaut — leur contenu vient de la base et n'est pas traduit (`i18n.untranslatedRoutes`).
     */
    const alternatesFor = (routePath) => {
      if (!i18n.enabled) return ''
      const links = i18n.locales
        .map(
          (code) =>
            `    <xhtml:link rel="alternate" hreflang="${code}" href="${baseUrl}${withLocalePrefix(routePath || '/', code, i18n)}"/>`,
        )
        .join('\n')
      const xDefault = `    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}${withLocalePrefix(routePath || '/', i18n.defaultLocale, i18n)}"/>`
      return `\n${links}\n${xDefault}`
    }

    // Ajouter les routes statiques, dans chaque langue activée
    staticRoutes.forEach((route) => {
      i18n.locales.forEach((code) => {
        const localizedPath = withLocalePrefix(route.path || '/', code, i18n)
        // `withLocalePrefix` rend « / » pour la racine ; le sitemap la veut sans slash final.
        const loc = `${baseUrl}${localizedPath === '/' ? '' : localizedPath}`
        xml += `  <url>
    <loc>${loc}</loc>${alternatesFor(route.path)}
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>
`
      })
    })

    if (watches.length > 0) {
      watches.forEach((watch) => {
        const lastmod = watch.updated_at
          ? new Date(watch.updated_at).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0]
        const watchSlug = buildWatchSlug(watch)
        xml += `  <url>
    <loc>${baseUrl}/montre/${watchSlug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`
      })

      const brandSlugs = [
        ...new Set(
          watches
            .map((watch) => slugifyBrand(watch.brand))
            .filter((slug) => typeof slug === 'string' && slug.length > 0),
        ),
      ].sort()

      brandSlugs.forEach((slug) => {
        xml += `  <url>
    <loc>${baseUrl}/collection/${slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.75</priority>
  </url>
`
      })
    }

    if (articles.length > 0) {
      articles.forEach((article) => {
        const lastmod = article.updated_at
          ? new Date(article.updated_at).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0]
        xml += `  <url>
    <loc>${baseUrl}/blog/${article.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
`
      })
    }

    xml += `</urlset>`

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

