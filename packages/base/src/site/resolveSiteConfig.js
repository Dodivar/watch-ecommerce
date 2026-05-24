import { resolveHomeHeroConfig } from './homeHero.js'
import { resolveHomeSections } from './homeSections.js'
import { resolveHomeNouvellesConfig } from './homeNouvelles.js'
import { resolveHomeSelectionsConfig } from './homeSelections.js'
import { mergeSiteFeatures } from './siteFeatures.js'
import { resolveCheckoutShipping } from './checkoutShipping.js'
import { resolveWatchCatalogConfig } from './watchCatalogDisplay.js'

/**
 * Résout le manifest client (features, home, checkout, watchCatalog) sans cache ni import build.
 * @param {Record<string, unknown>} siteConfig
 */
export function resolveSiteConfig(siteConfig) {
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
  if (siteConfig.guidePage != null) {
    features = {
      ...features,
      guidePage: Boolean(mergedFeatures.guidePage && siteConfig.guidePage),
    }
  }
  const watchCatalog = resolveWatchCatalogConfig(siteConfig)
  features = {
    ...features,
    watchReference: watchCatalog.display.showReference,
  }
  const homeRest =
    siteConfig.home != null && typeof siteConfig.home === 'object'
      ? siteConfig.home
      : {}
  const selections = resolveHomeSelectionsConfig(siteConfig)
  const nouvelles = resolveHomeNouvellesConfig(siteConfig)
  const hero = resolveHomeHeroConfig(siteConfig)
  const checkoutRaw = siteConfig.checkout || {}
  const shippingResolved = resolveCheckoutShipping(checkoutRaw)
  return {
    ...siteConfig,
    features,
    watchCatalog,
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
      hero,
    },
  }
}
