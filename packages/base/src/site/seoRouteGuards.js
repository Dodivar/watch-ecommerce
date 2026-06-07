import { slugifyBrand } from '@/utils/brandSlug.js'
import { isLegacyWatchIdParam } from '@/utils/watchSlug.js'

/**
 * Redirections SEO côté client (complétées par les 301 Vercel au build).
 * @param {import('vue-router').RouteLocationNormalized} to
 * @returns {import('vue-router').RouteLocationRaw | null}
 */
export function resolveSeoRouteRedirect(to) {
  if (to.path === '/collection' && to.query.marque && !to.params.brandSlug) {
    const marque = String(Array.isArray(to.query.marque) ? to.query.marque[0] : to.query.marque)
      .toLowerCase()
      .trim()
    if (!marque) return null

    const otherQuery = { ...to.query }
    delete otherQuery.marque

    const hasExtraFilters = Object.keys(otherQuery).some(
      (key) => key !== 'page' && otherQuery[key] != null && otherQuery[key] !== '',
    )

    if (!hasExtraFilters) {
      return {
        path: `/collection/${marque}`,
        query: otherQuery.page ? { page: otherQuery.page } : {},
        hash: to.hash,
      }
    }
  }

  if (to.path.startsWith('/collection/') && to.params.brandSlug) {
    const normalized = slugifyBrand(String(to.params.brandSlug))
    if (normalized && normalized !== to.params.brandSlug) {
      return {
        path: `/collection/${normalized}`,
        query: to.query,
        hash: to.hash,
      }
    }
  }

  if (to.path.startsWith('/watch/') && to.params.id && !isLegacyWatchIdParam(String(to.params.id))) {
    return {
      path: `/montre/${to.params.id}`,
      query: to.query,
      hash: to.hash,
    }
  }

  return null
}
