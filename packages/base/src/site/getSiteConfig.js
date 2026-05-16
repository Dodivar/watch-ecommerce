import siteConfig from '@site-config'

import { resolveHomeSections } from './homeSections.js'
import { resolveHomeSelectionsConfig } from './homeSelections.js'
import { mergeSiteFeatures } from './siteFeatures.js'

let cached

/**
 * Returns the active site manifest. Resolved at build time from `sites/<SITE_ID>/site.config.js`.
 * `features.faq` est dérivé de `faq.enabled` et de la présence d’au moins une entrée (`faq.items`).
 * `home.sections` est la liste validée depuis `site.config` ; vide si `home` absent ou sans sections.
 */
export function getSiteConfig() {
  if (!cached) {
    const mergedFeatures = mergeSiteFeatures(siteConfig.features)
    let features = mergedFeatures
    if (siteConfig.faq != null) {
      const hasItems =
        Array.isArray(siteConfig.faq.items) && siteConfig.faq.items.length > 0
      features = {
        ...mergedFeatures,
        faq: Boolean(siteConfig.faq.enabled && hasItems),
      }
    }
    const homeRest =
      siteConfig.home != null && typeof siteConfig.home === 'object'
        ? siteConfig.home
        : {}
    const selections = resolveHomeSelectionsConfig(siteConfig)
    cached = {
      ...siteConfig,
      features,
      home: {
        ...homeRest,
        sections: resolveHomeSections(siteConfig),
        selections,
      },
    }
  }
  return cached
}
