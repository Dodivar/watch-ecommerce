/**
 * Schémas schema.org d'une page prestation (`/services/:slug`) : `Service` + `FAQPage`.
 *
 * Le `Service` porte le prestataire (LocalBusiness quand l'adresse est publique, Organization
 * sinon) et la grille tarifaire : c'est ce qui permet à une recherche locale d'afficher le prix
 * et la zone desservie sans ouvrir la page.
 */

import { resolveSiteNap } from './siteNap.js'

/** @param {unknown} value */
function stripHtml(value) {
  if (typeof value !== 'string') return ''
  return value
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * « 21 € », « 21€ », « à partir de 21 € » → 21. Renvoie null si le prix n'est pas un montant
 * simple (« sur devis », « selon modèle ») : un `Offer` sans montant exploitable vaut mieux
 * absent que faux.
 * @param {string} value
 */
export function parseOfferPrice(value) {
  if (typeof value !== 'string') return null
  // Espaces insécables des prix du manifest (« 21 € ») : les retirer avant de lire.
  const match = value.replace(/[\s\u00a0\u202f]/g, '').match(/(\d+(?:[.,]\d{1,2})?)\u20ac/)
  if (!match) return null
  const amount = Number(match[1].replace(',', '.'))
  return Number.isFinite(amount) ? amount : null
}

/**
 * @param {Record<string, any>} siteConfig
 * @param {Record<string, any>} landing — page normalisée par `resolveServiceLandings`
 * @param {string} baseUrl — sans slash final
 * @param {{ areaServed?: string }} [options]
 */
export function buildServiceLandingStructuredData(siteConfig, landing, baseUrl, options = {}) {
  if (!landing) return []

  const origin = String(baseUrl || '').replace(/\/$/, '')
  const brand = siteConfig?.brand ?? {}
  const storeMap = siteConfig?.storeMap ?? {}
  const nap = resolveSiteNap(siteConfig)
  const siteName = brand.displayName || brand.legalName || nap.name

  const provider =
    storeMap.enabled && nap.streetAddress
      ? {
          '@type': 'LocalBusiness',
          name: nap.name || siteName,
          url: origin,
          address: {
            '@type': 'PostalAddress',
            streetAddress: nap.streetAddress,
            addressCountry: 'FR',
          },
        }
      : {
          '@type': 'Organization',
          name: siteName,
          url: origin,
        }

  if (nap.telephone) provider.telephone = nap.telephone

  const service = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: landing.hero.title,
    serviceType: landing.navLabel || landing.hero.title,
    url: `${origin}${landing.path}`,
    provider,
  }

  const description = stripHtml(landing.hero.lead)
  if (description) service.description = description

  const areaServed = typeof options.areaServed === 'string' ? options.areaServed.trim() : ''
  if (areaServed) {
    service.areaServed = { '@type': 'City', name: areaServed }
  }

  const offers = (landing.pricing?.items ?? [])
    .map((item) => {
      const price = parseOfferPrice(item.price)
      if (price == null || !item.label) return null
      return {
        '@type': 'Offer',
        name: item.label,
        price,
        priceCurrency: 'EUR',
        url: `${origin}${landing.path}`,
      }
    })
    .filter(Boolean)

  if (offers.length === 1) {
    service.offers = offers[0]
  } else if (offers.length > 1) {
    service.offers = {
      '@type': 'OfferCatalog',
      name: landing.pricing?.title || landing.hero.title,
      itemListElement: offers,
    }
  }

  const schemas = [service]

  if (landing.faq?.length) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      url: `${origin}${landing.path}`,
      mainEntity: landing.faq.map((entry) => ({
        '@type': 'Question',
        name: stripHtml(entry.question),
        acceptedAnswer: { '@type': 'Answer', text: stripHtml(entry.answer) },
      })),
    })
  }

  return schemas
}
