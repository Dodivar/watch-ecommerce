import siteConfig from '@site-config'

import { resolveSiteConfig } from './resolveSiteConfig.js'

export { resolveSiteConfig } from './resolveSiteConfig.js'

let cached

/**
 * Returns the active site manifest. Resolved at build time from `sites/<SITE_ID>/site.config.js`.
 * `features.faq` est dérivé de `faq.enabled` et de la présence d’au moins une entrée (`faq.items`).
 * `home.sections` est la liste validée depuis `site.config` ; vide si `home` absent ou sans sections.
 */
export function getSiteConfig() {
  if (!cached) {
    cached = resolveSiteConfig(siteConfig)
  }
  return cached
}
