import { slugifyBrand } from '../utils/brandSlug.js'
import { buildWatchSlug } from '../utils/watchSlug.js'

/**
 * Redirections 301 Vercel dérivées du manifest et du catalogue Supabase.
 * @param {Record<string, unknown>} siteConfig
 * @param {Array<{ id: string, slug?: string, brand?: string, name?: string, reference?: string }>} watches
 */
export function buildWatchLegacyRedirects(watches = []) {
  const redirects = []

  for (const watch of watches) {
    if (!watch?.id) continue
    const slug = buildWatchSlug(watch)
    if (!slug) continue
    redirects.push({
      source: `/watch/${watch.id}`,
      destination: `/montre/${slug}`,
      permanent: true,
    })
  }

  return redirects
}

/**
 * Motifs PrestaShop courants + redirections statiques explicites.
 * @param {Record<string, unknown>} siteConfig
 */
export function buildPrestashopLegacyRedirects(siteConfig) {
  const legacy = siteConfig?.seo?.legacyRedirects ?? {}
  const redirects = []

  const prestashop = legacy.prestashop ?? {}
  if (prestashop.productPattern && prestashop.productDestination) {
    redirects.push({
      source: prestashop.productPattern,
      destination: prestashop.productDestination,
      permanent: true,
    })
  }
  if (prestashop.categoryPattern && prestashop.categoryDestination) {
    redirects.push({
      source: prestashop.categoryPattern,
      destination: prestashop.categoryDestination,
      permanent: true,
    })
  }

  const staticRedirects = Array.isArray(legacy.static) ? legacy.static : []
  for (const entry of staticRedirects) {
    if (!entry?.source || !entry?.destination) continue
    redirects.push({
      source: entry.source,
      destination: entry.destination,
      permanent: entry.permanent !== false,
    })
  }

  return redirects
}

/**
 * /collection?marque=rolex → /collection/rolex (sans autres filtres).
 */
export function buildBrandQueryRedirects(brandSlugs = []) {
  const redirects = []

  for (const slug of brandSlugs) {
    if (!slug) continue
    redirects.push({
      source: '/collection',
      has: [
        {
          type: 'query',
          key: 'marque',
          value: slug,
        },
      ],
      destination: `/collection/${slug}`,
      permanent: true,
    })
  }

  return redirects
}

/**
 * @param {Record<string, unknown>} siteConfig
 * @param {Array<{ id: string, slug?: string, brand?: string, name?: string, reference?: string, brand?: string }>} watches
 */
export function buildAllSeoRedirects(siteConfig, watches = []) {
  const brandSlugs = [
    ...new Set(
      watches
        .map((watch) => slugifyBrand(watch.brand))
        .filter((slug) => typeof slug === 'string' && slug.length > 0),
    ),
  ]

  const merged = [
    ...buildPrestashopLegacyRedirects(siteConfig),
    ...buildBrandQueryRedirects(brandSlugs),
    ...buildWatchLegacyRedirects(watches),
  ]

  const seen = new Set()
  return merged.filter((redirect) => {
    const key = `${redirect.source}|${redirect.destination}|${JSON.stringify(redirect.has ?? null)}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
