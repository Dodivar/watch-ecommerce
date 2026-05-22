import siteConfig from '@site-config'

import { resolveHomeSections } from './homeSections.js'
import { resolveHomeNouvellesConfig } from './homeNouvelles.js'
import { resolveHomeSelectionsConfig } from './homeSelections.js'
import { mergeSiteFeatures } from './siteFeatures.js'
import { resolveCheckoutShipping } from './checkoutShipping.js'

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
    if (siteConfig.servicesPage != null) {
      features = {
        ...features,
        servicesPage: Boolean(mergedFeatures.servicesPage && siteConfig.servicesPage),
      }
    }
    const homeRest =
      siteConfig.home != null && typeof siteConfig.home === 'object'
        ? siteConfig.home
        : {}
    const selections = resolveHomeSelectionsConfig(siteConfig)
    const nouvelles = resolveHomeNouvellesConfig(siteConfig)
    const checkoutRaw = siteConfig.checkout || {}
    const shippingResolved = resolveCheckoutShipping(checkoutRaw)
    cached = {
      ...siteConfig,
      features,
      checkout: {
        ...checkoutRaw,
        shipping: {
          ...(checkoutRaw.shipping || {}),
          pickupEnabled: shippingResolved.pickupEnabled,
          methods: shippingResolved.methods,
        },
      },
      home: {
        ...homeRest,
        sections: resolveHomeSections(siteConfig),
        selections,
        nouvelles,
      },
    }
  }
  return cached
}
