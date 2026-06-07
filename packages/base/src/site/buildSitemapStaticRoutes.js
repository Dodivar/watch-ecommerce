import { isRouteActiveForFeatures } from './routeFeatures.js'

/**
 * Routes statiques indexables pour le sitemap (hors pages transactionnelles, admin, recherche dynamique).
 * Les entrées avec `feature` suivent les mêmes drapeaux que `appRouteMeta.js`.
 */
export const SITEMAP_STATIC_ROUTE_DEFS = [
  { path: '', priority: '1.0', changefreq: 'daily' },
  { path: '/collection', feature: 'collection', priority: '0.9', changefreq: 'weekly' },
  { path: '/collection/marques', feature: 'collection', priority: '0.85', changefreq: 'weekly' },
  { path: '/blog', feature: 'blog', priority: '0.8', changefreq: 'weekly' },
  { path: '/recherche', feature: 'recherche', priority: '0.7', changefreq: 'monthly' },
  { path: '/estimation', feature: 'estimation', priority: '0.7', changefreq: 'monthly' },
  {
    path: '/estimation/processus',
    feature: 'estimationProcess',
    priority: '0.65',
    changefreq: 'monthly',
  },
  { path: '/a-propos', feature: 'about', priority: '0.75', changefreq: 'monthly' },
  { path: '/contact', feature: 'contact', priority: '0.75', changefreq: 'monthly' },
  { path: '/faq', feature: 'faq', priority: '0.7', changefreq: 'monthly' },
  {
    path: '/services',
    feature: 'servicesPage',
    requiresConfig: 'servicesPage',
    priority: '0.8',
    changefreq: 'monthly',
  },
  {
    path: '/guide-horloger',
    feature: 'guidePage',
    requiresConfig: 'guidePage',
    priority: '0.75',
    changefreq: 'monthly',
  },
  {
    path: '/politique-confidentialite',
    feature: 'legal',
    priority: '0.3',
    changefreq: 'yearly',
  },
  { path: '/mentions-legales', feature: 'legal', priority: '0.3', changefreq: 'yearly' },
  {
    path: '/conditions-generales-utilisation',
    feature: 'legal',
    priority: '0.3',
    changefreq: 'yearly',
  },
]

/**
 * @param {{ feature?: string, requiresConfig?: string }} def
 * @param {Record<string, boolean>} features
 * @param {Record<string, unknown>} siteConfig
 */
export function isSitemapRouteActive(def, features, siteConfig) {
  if (!isRouteActiveForFeatures(def, features)) {
    return false
  }
  if (def.requiresConfig && !siteConfig?.[def.requiresConfig]) {
    return false
  }
  return true
}

/**
 * @param {Record<string, boolean>} features
 * @param {Record<string, unknown>} [siteConfig]
 * @returns {{ path: string, priority: string, changefreq: string }[]}
 */
export function buildSitemapStaticRoutes(features, siteConfig = {}) {
  return SITEMAP_STATIC_ROUTE_DEFS.filter((def) =>
    isSitemapRouteActive(def, features, siteConfig),
  ).map(({ path, priority, changefreq }) => ({ path, priority, changefreq }))
}
