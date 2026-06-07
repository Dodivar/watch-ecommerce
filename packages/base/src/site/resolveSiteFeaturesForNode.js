import { DEFAULT_SITE_FEATURES } from './siteFeatures.js'

/**
 * Résolution légère des feature flags pour scripts Node (build, sitemap, redirects).
 * Évite `resolveSiteConfig` et les imports `@/` non résolus hors Vite.
 * @param {Record<string, unknown>} siteConfig
 */
export function resolveSiteFeaturesForNode(siteConfig) {
  const features = { ...DEFAULT_SITE_FEATURES, ...(siteConfig?.features ?? {}) }

  const faq = siteConfig?.faq
  if (faq != null) {
    const hasItems = Array.isArray(faq.items) && faq.items.length > 0
    features.faq = Boolean(faq.enabled && hasItems)
  }

  if (!features.estimation) {
    features.estimationProcess = false
  }

  return features
}
