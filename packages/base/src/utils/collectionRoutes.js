import { slugifyBrand } from './brandSlug.js'

/**
 * Chemin indexable pour une collection filtrée par marque.
 * @param {string} brandName — libellé exact `brand` en base
 */
export function buildBrandCollectionPath(brandName) {
  const slug = slugifyBrand(brandName)
  return slug ? `/collection/${slug}` : '/collection'
}

/**
 * @param {string} baseUrl
 * @param {string} brandName
 */
export function buildBrandCollectionUrl(baseUrl, brandName) {
  const origin = baseUrl.replace(/\/$/, '')
  return `${origin}${buildBrandCollectionPath(brandName)}`
}

/**
 * Slug marque depuis la route ou la query (?marque=).
 * @param {{ params?: Record<string, string>, query?: Record<string, unknown> }} route
 */
export function resolveBrandSlugFromRoute(route) {
  const fromParam = route?.params?.brandSlug
  if (fromParam) return String(fromParam).toLowerCase().trim()

  const q = route?.query?.marque
  const raw = Array.isArray(q) ? q[0] : q
  return raw ? String(raw).toLowerCase().trim() : ''
}
