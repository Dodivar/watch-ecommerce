import { APP_ROUTE_META } from '@/site/appRouteMeta.js'

/** Chemins toujours accessibles (sans feature ou maintenance / accueil / 404). */
export const ALWAYS_OPEN_PATHS = new Set(['/', '/maintenance', '/:pathMatch(.*)*'])

/**
 * Mappe un chemin de navigation vers la clé feature requise (si applicable).
 * Dérivé de ROUTE_DEFINITIONS + règles pour ancres accueil.
 */
export const PATH_TO_FEATURE = (() => {
  /** @type {Map<string, string | null>} */
  const map = new Map()
  for (const def of APP_ROUTE_META) {
    map.set(def.path, def.feature ?? null)
  }
  return map
})()

/**
 * Extrait le pathname d’un `to` de navigation (sans query ni hash).
 * @param {string} to
 * @returns {string}
 */
export function navPathname(to) {
  if (!to || typeof to !== 'string') return ''
  const withoutHash = to.split('#')[0]
  const pathOnly = withoutHash.split('?')[0]
  return pathOnly || '/'
}

/**
 * Indique si un lien de navigation cible une route toujours ouverte ou une route active.
 * @param {string} to
 * @param {Set<string>} activePaths — chemins retournés par getActiveRoutePaths
 * @param {Record<string, boolean>} features
 */
export function isNavTargetAllowed(to, activePaths, features) {
  const pathname = navPathname(to)

  if (pathname === '/' || pathname.startsWith('/#')) return true

  if (activePaths.has(pathname)) return true

  for (const routePath of activePaths) {
    if (routePath.includes(':') && matchParameterizedPath(pathname, routePath)) {
      return true
    }
  }

  const requiredFeature = inferFeatureForPath(pathname)
  if (requiredFeature === null) return true
  return Boolean(features[requiredFeature])
}

/**
 * @param {string} pathname
 * @param {string} pattern — ex. `/watch/:id`
 */
function matchParameterizedPath(pathname, pattern) {
  const patternParts = pattern.split('/').filter(Boolean)
  const pathParts = pathname.split('/').filter(Boolean)
  if (patternParts.length !== pathParts.length) return false
  return patternParts.every((part, i) => part.startsWith(':') || part === pathParts[i])
}

/**
 * @param {string} pathname
 * @returns {string | null}
 */
function inferFeatureForPath(pathname) {
  if (PATH_TO_FEATURE.has(pathname)) {
    return PATH_TO_FEATURE.get(pathname) ?? null
  }
  for (const [pattern, feature] of PATH_TO_FEATURE) {
    if (pattern.includes(':') && matchParameterizedPath(pathname, pattern)) {
      return feature ?? null
    }
  }
  return null
}

/**
 * Collecte récursivement les paires { feature, to } depuis navigation.main / footer.
 * @param {unknown} navRoot
 * @returns {Array<{ feature?: string, to?: string }>}
 */
export function collectRawNavLinks(navRoot) {
  /** @type {Array<{ feature?: string, to?: string }>} */
  const links = []

  function walkMain(items) {
    if (!Array.isArray(items)) return
    for (const raw of items) {
      if (!raw || typeof raw !== 'object') continue
      if (raw.feature) links.push({ feature: raw.feature, to: raw.to })
      if (raw.to) links.push({ feature: raw.feature, to: raw.to })
      if (Array.isArray(raw.items)) {
        for (const sub of raw.items) {
          if (sub?.to) links.push({ feature: sub.feature, to: sub.to })
        }
      }
      if (Array.isArray(raw.columns)) {
        for (const col of raw.columns) {
          if (Array.isArray(col.items)) {
            for (const sub of col.items) {
              if (sub?.to) links.push({ feature: sub.feature, to: sub.to })
            }
          }
          if (col.footerLink?.to) {
            links.push({ feature: undefined, to: col.footerLink.to })
          }
        }
      }
    }
  }

  function walkFooter(items) {
    if (!Array.isArray(items)) return
    for (const entry of items) {
      if (entry?.to) links.push({ feature: entry.feature, to: entry.to })
    }
  }

  if (navRoot && typeof navRoot === 'object') {
    walkMain(navRoot.main)
    walkFooter(navRoot.footer)
  }

  return links
}

/**
 * Liens plats depuis navigation résolue (main + footer).
 * @param {import('@/site/mainNavigation.js').MainNavItem[]} mainNav
 * @param {Array<{ label: string, to: string }>} footerNav
 */
export function collectResolvedNavLinks(mainNav, footerNav) {
  /** @type {Array<{ label?: string, to: string }>} */
  const out = []

  function walkMain(items) {
    for (const item of items) {
      if (item.type === 'link' && item.to) out.push({ label: item.label, to: item.to })
      if (item.type === 'group') {
        if (item.to) out.push({ label: item.label, to: item.to })
        for (const sub of item.items ?? []) {
          if (sub.to) out.push({ label: sub.label, to: sub.to })
        }
      }
      if (item.type === 'megaMenu') {
        if (item.to) out.push({ label: item.label, to: item.to })
        for (const col of item.columns ?? []) {
          for (const sub of col.items ?? []) {
            if (sub.to) out.push({ label: sub.label, to: sub.to })
          }
          if (col.footerLink?.to) {
            out.push({ label: col.footerLink.label, to: col.footerLink.to })
          }
        }
      }
    }
  }

  walkMain(mainNav)
  for (const link of footerNav) {
    if (link.to) out.push({ label: link.label, to: link.to })
  }

  return out
}
