/**
 * Sert les pages dont le contenu vient de la base, avec leur tête et un contenu lisible sans
 * JavaScript : fiche montre, collection d'une marque, article de blog. Redirige aussi en 301
 * les anciennes URL `/watch/<id>` vers `/montre/<slug>`.
 *
 * Avant, ces routes recevaient `spa-fallback.html` tel quel. Voir
 * `packages/base/src/site/dynamicPageHtml.js` pour le détail de ce qui est écrit.
 *
 * Les réécritures de `vercel.json` sont partagées par toutes les vitrines. Règle de conduite :
 * au moindre doute (drapeau éteint, Supabase absent ou en erreur, ligne introuvable), on sert
 * la coquille inchangée en 200, exactement comme avant. Seule une absence **confirmée** par une
 * requête réussie donne un 404.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { createClient } from '@supabase/supabase-js'

import { resolveSiteConfig } from '../packages/base/src/site/resolveSiteConfig.js'
import {
  buildArticlePage,
  buildBrandPage,
  buildWatchPage,
  normalizeWatchRow,
  renderDynamicPage,
} from '../packages/base/src/site/dynamicPageHtml.js'
import { buildWatchPath, buildWatchSlug, isLegacyWatchIdParam } from '../packages/base/src/utils/watchSlug.js'
import { slugifyBrand } from '../packages/base/src/utils/brandSlug.js'
import { resolveBaseUrl } from './sitemap.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SHELL_FILE = 'spa-fallback.html'
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/** Cache CDN court : prix et disponibilité du JSON-LD restent proches de la base. */
const CACHE_OK = 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400'
const CACHE_NOT_FOUND = 'public, max-age=0, s-maxage=60'
const CACHE_REDIRECT = 'public, max-age=3600, s-maxage=3600'

const WATCH_LIST_COLUMNS = 'id, slug, brand, name, reference, price, promotion_price, is_available, is_sold'

let shellCache = null

async function loadShell(req) {
  if (shellCache) return shellCache
  // `includeFiles` (vercel.json) embarque le fichier ; en local, `vercel dev` part de la racine.
  for (const candidate of [
    path.join(process.cwd(), 'dist', SHELL_FILE),
    path.join(__dirname, '..', 'dist', SHELL_FILE),
  ]) {
    try {
      shellCache = fs.readFileSync(candidate, 'utf8')
      return shellCache
    } catch {
      // essai suivant
    }
  }
  // Dernier recours : le fichier statique du même déploiement.
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim()
  if (!host) return null
  try {
    const response = await fetch(`https://${host}/${SHELL_FILE}`)
    if (!response.ok) return null
    shellCache = await response.text()
    return shellCache
  } catch {
    return null
  }
}

async function loadSiteConfig() {
  const siteId = process.env.SITE_ID?.trim() || process.env.VITE_SITE_ID?.trim() || 'sauvage-watches'
  const configPath = path.join(__dirname, '..', 'sites', siteId, 'site.config.js')
  const { default: siteConfig } = await import(pathToFileURL(configPath).href)
  return siteConfig
}

function createSupabase() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

function first(value) {
  return Array.isArray(value) ? value[0] : value
}

/** Montres publiquement visibles, selon les mêmes règles que `resolveWatchIdBySlug`. */
function visibleWatchesQuery(supabase, columns, soldArchive) {
  const query = supabase.from('watches').select(columns)
  return soldArchive
    ? query.or('and(is_available.eq.true,is_sold.eq.false),is_sold.eq.true')
    : query.eq('is_available', true).eq('is_sold', false)
}

async function loadImageUrls(supabase, watchId, limit = 8) {
  const { data, error } = await supabase
    .from('watch_images')
    .select('image_url, image_path, image_order')
    .eq('watch_id', watchId)
    .order('image_order', { ascending: true })
    .limit(limit)
  if (error) return []
  return (data ?? [])
    .map(
      (record) =>
        record.image_url ||
        supabase.storage.from('watch-images').getPublicUrl(record.image_path).data?.publicUrl,
    )
    .filter(Boolean)
}

function withLocale(pathname, locale, i18n) {
  if (!locale || locale === i18n.defaultLocale) return pathname
  return `/${locale}${pathname}`
}

/**
 * @returns {Promise<{ status: number, page?: object, location?: string }>}
 *   `page` absent = coquille inchangée.
 */
async function resolvePage({ route, key, locale, site, supabase, baseUrl, logoUrl }) {
  const { features } = site
  const soldArchive = Boolean(features.soldArchive)

  if (route === 'watch-legacy') {
    if (!features.collection || !isLegacyWatchIdParam(key)) return { status: 200 }
    const { data, error } = await supabase
      .from('watches')
      .select('id, slug, brand, name, reference')
      .eq('id', key)
      .maybeSingle()
    if (error) return { status: 200 }
    if (!data) return { status: 404 }
    const target = buildWatchPath(data)
    if (!target.startsWith('/montre/')) return { status: 200 }
    return { status: 301, location: withLocale(target, locale, site.i18n) }
  }

  if (route === 'montre') {
    if (!features.collection) return { status: 200 }
    const { data, error } = await visibleWatchesQuery(supabase, 'id, slug, brand, name, reference', soldArchive)
    if (error) return { status: 200 }
    const normalized = String(key).toLowerCase().trim()
    // Le client compare aussi au slug recalculé quand la colonne est vide.
    const match = (data ?? []).find((row) => (row.slug || buildWatchSlug(row)) === normalized)
    if (!match) return { status: 404 }

    const [{ data: row, error: rowError }, imageUrls] = await Promise.all([
      supabase.from('watches').select('*').eq('id', match.id).maybeSingle(),
      loadImageUrls(supabase, match.id),
    ])
    if (rowError || !row) return { status: 200 }
    const watch = normalizeWatchRow(row, imageUrls)
    return { status: 200, page: buildWatchPage({ watch, siteConfig: site, baseUrl, locale }) }
  }

  if (route === 'collection') {
    if (!features.collection) return { status: 200 }
    const { data, error } = await supabase
      .from('watches')
      .select(WATCH_LIST_COLUMNS)
      .eq('is_available', true)
      .eq('is_sold', false)
      .order('display_order', { ascending: true, nullsFirst: false })
    if (error) return { status: 200 }
    const watches = (data ?? []).map((row) => normalizeWatchRow(row))
    const brand = [...new Set(watches.map((w) => w.brand).filter(Boolean))].find(
      (name) => slugifyBrand(name) === String(key).toLowerCase().trim(),
    )
    // Segment réservé (`recherche`…) ou marque sans stock : la page appartient au client.
    if (!brand) return { status: 200 }
    return {
      status: 200,
      page: buildBrandPage({
        brand,
        watches: watches.filter((w) => w.brand === brand),
        siteConfig: site,
        baseUrl,
        locale,
      }),
    }
  }

  if (route === 'blog') {
    if (!features.blog || !UUID_RE.test(key)) return { status: 200 }
    const { data, error } = await supabase
      .from('articles')
      .select('id, title, text, categories, created_at, updated_at, is_visible')
      .eq('id', key)
      .eq('is_visible', true)
      .maybeSingle()
    if (error) return { status: 200 }
    if (!data) return { status: 404 }
    return {
      status: 200,
      page: buildArticlePage({ article: data, siteConfig: site, baseUrl, locale, logoUrl }),
    }
  }

  return { status: 200 }
}

function send(res, status, html, cacheControl) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', cacheControl)
  res.status(status).send(html)
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD')
    res.status(405).end()
    return
  }

  const shell = await loadShell(req)
  if (!shell) {
    // Sans coquille, aucune page ne peut être servie : c'est une erreur de déploiement.
    console.error('[render-page] coquille introuvable')
    res.setHeader('Retry-After', '30')
    res.status(503).send('Service temporairement indisponible')
    return
  }

  const route = String(first(req.query.__route) ?? '')
  const key = String(first(req.query.__key) ?? '')
  const rawLocale = String(first(req.query.__lc) ?? '')

  try {
    const rawConfig = await loadSiteConfig()
    const probe = resolveSiteConfig(rawConfig)
    const locale = probe.i18n.locales.includes(rawLocale) ? rawLocale : probe.i18n.defaultLocale
    // Préfixe inconnu (`/xx/montre/…`) : le routeur client décidera, on ne s'en mêle pas.
    if (rawLocale && !probe.i18n.locales.includes(rawLocale)) {
      send(res, 200, shell, CACHE_OK)
      return
    }
    const site = resolveSiteConfig(rawConfig, locale)
    const supabase = createSupabase()
    const baseUrl = resolveBaseUrl(rawConfig, req)
    if (!supabase || !baseUrl || !key) {
      send(res, 200, shell, CACHE_OK)
      return
    }

    const logoUrl = (shell.match(/<meta\s+property="og:image"\s+content="([^"]*)"/i) ?? [])[1] ?? ''
    const result = await resolvePage({ route, key, locale, site, supabase, baseUrl, logoUrl })

    if (result.status === 301 && result.location) {
      const search = new URLSearchParams()
      for (const [name, value] of Object.entries(req.query)) {
        if (name.startsWith('__')) continue
        for (const item of Array.isArray(value) ? value : [value]) search.append(name, item)
      }
      const query = search.toString()
      res.setHeader('Cache-Control', CACHE_REDIRECT)
      res.setHeader('Location', query ? `${result.location}?${query}` : result.location)
      res.status(301).end()
      return
    }

    if (result.status === 404) {
      send(res, 404, shell, CACHE_NOT_FOUND)
      return
    }

    send(res, 200, result.page ? renderDynamicPage(shell, result.page) : shell, CACHE_OK)
  } catch (error) {
    console.error('[render-page]', route, key, error instanceof Error ? error.message : error)
    send(res, 200, shell, CACHE_OK)
  }
}
