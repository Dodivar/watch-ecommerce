import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { createClient } from '@supabase/supabase-js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function slugifyBrand(str) {
  if (!str) return ''
  return String(str)
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

async function loadSiteConfig() {
  const siteId =
    process.env.SITE_ID?.trim() ||
    process.env.VITE_SITE_ID?.trim() ||
    'sauvage-watches'
  const configPath = path.join(__dirname, '..', 'sites', siteId, 'site.config.js')
  const { default: siteConfig } = await import(pathToFileURL(configPath).href)
  return { siteId, siteConfig }
}

function resolveBaseUrl(siteConfig, req) {
  const explicit = process.env.VITE_BASE_URL || process.env.BASE_URL
  if (explicit) return explicit.replace(/\/$/, '')

  const urlProduction = siteConfig.urls.production.replace(/\/$/, '')
  const urlStaging = siteConfig.urls.staging.replace(/\/$/, '')
  const previewFallbackHost = siteConfig.urls.previewFallbackHost?.replace(/\/$/, '') ?? ''

  if (process.env.VERCEL_ENV === 'production') {
    return urlProduction
  }

  if (process.env.VERCEL_ENV === 'preview' || process.env.VERCEL_URL) {
    if (
      process.env.VERCEL_URL?.includes('recette') ||
      req.headers.host?.includes('recette')
    ) {
      return urlStaging
    }
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`
    }
    return `https://${previewFallbackHost}`
  }

  return urlProduction
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
    const baseUrl = resolveBaseUrl(siteConfig, req)

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

    // Récupérer toutes les montres disponibles
    const { data: watches, error: watchesError } = await supabase
      .from('watches')
      .select('id, brand, updated_at')
      .eq('is_available', true)
      .eq('is_sold', false)

    if (watchesError) {
      console.error('Erreur lors de la récupération des montres:', watchesError)
    }

    // Récupérer uniquement les articles visibles
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select('id, updated_at')
      .eq('is_visible', true)
      .order('created_at', { ascending: false })

    if (articlesError) {
      console.error('Erreur lors de la récupération des articles:', articlesError)
    }

    // Routes statiques
    const staticRoutes = [
      { path: '', priority: '1.0', changefreq: 'daily' },
      { path: '/collection', priority: '0.9', changefreq: 'weekly' },
      { path: '/collection/marques', priority: '0.85', changefreq: 'weekly' },
      { path: '/blog', priority: '0.8', changefreq: 'weekly' },
      { path: '/recherche', priority: '0.7', changefreq: 'monthly' },
      { path: '/estimation', priority: '0.7', changefreq: 'monthly' },
    ]

    // Générer le XML
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`

    // Ajouter les routes statiques
    staticRoutes.forEach((route) => {
      xml += `  <url>
    <loc>${baseUrl}${route.path}</loc>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>
`
    })

    // Ajouter les montres
    if (watches && watches.length > 0) {
      watches.forEach((watch) => {
        const lastmod = watch.updated_at
          ? new Date(watch.updated_at).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0]
        xml += `  <url>
    <loc>${baseUrl}/watch/${watch.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`
      })
    }

    // Pages collection par marque (slug dérivé du libellé brand)
    if (watches && watches.length > 0) {
      const brandBestTs = new Map()
      for (const w of watches) {
        const slug = slugifyBrand(w.brand)
        if (!slug) continue
        const ts = w.updated_at ? new Date(w.updated_at).getTime() : 0
        const prev = brandBestTs.get(slug) ?? -1
        if (ts >= prev) brandBestTs.set(slug, ts)
      }
      for (const [slug, ts] of brandBestTs) {
        const lastmod =
          ts > 0 ? new Date(ts).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        xml += `  <url>
    <loc>${baseUrl}/collection/marque/${slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.75</priority>
  </url>
`
      }
    }

    // Ajouter les articles de blog
    if (articles && articles.length > 0) {
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

