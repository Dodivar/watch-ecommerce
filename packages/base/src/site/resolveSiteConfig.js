import { resolveHomeHeroConfig } from './homeHero.js'
import { resolveHomeSections } from './homeSections.js'
import { resolveHomeNouvellesConfig } from './homeNouvelles.js'
import { resolveHomeSelectionsConfig } from './homeSelections.js'
import { mergeSiteFeatures } from './siteFeatures.js'
import { resolveCheckoutShipping } from './checkoutShipping.js'
import { resolveWatchCatalogConfig } from './watchCatalogDisplay.js'
import { localizeTree } from './i18nValue.js'
import { resolveI18nConfig } from './resolveI18nConfig.js'

/**
 * Résout le manifest client (features, home, checkout, watchCatalog) sans cache ni import build.
 *
 * Les textes déclarés via `t({ fr, en, de })` sont aplatis **en premier**, pour `locale`, afin que
 * les résolveurs en aval (et les ~60 composants qui lisent le manifest) ne manipulent que des
 * chaînes ordinaires. `locale` est facultatif : sans lui, la langue par défaut du site est utilisée.
 *
 * @param {Record<string, unknown>} rawSiteConfig
 * @param {string} [locale]
 */
export function resolveSiteConfig(rawSiteConfig, locale) {
  const i18n = resolveI18nConfig(rawSiteConfig)
  const activeLocale = i18n.locales.includes(locale) ? locale : i18n.defaultLocale
  const siteConfig = localizeTree(rawSiteConfig, activeLocale, i18n.defaultLocale)

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
  const homeSections = resolveHomeSections(siteConfig)
  const selections = resolveHomeSelectionsConfig(siteConfig)
  const nouvelles = resolveHomeNouvellesConfig(siteConfig)
  const hero = resolveHomeHeroConfig(siteConfig)
  features = {
    ...features,
    homeNouvelles: homeSections.includes('nouvelles'),
  }
  const checkoutRaw = siteConfig.checkout || {}
  const shippingResolved = resolveCheckoutShipping(checkoutRaw)
  return {
    ...siteConfig,
    i18n: { ...i18n, activeLocale },
    locale: activeLocale,
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
      sections: homeSections,
      selections,
      nouvelles,
      hero,
    },
  }
}
