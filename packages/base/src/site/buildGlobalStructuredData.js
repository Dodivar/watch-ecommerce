import { resolveSiteNap } from './siteNap.js'

/**
 * Convertit les horaires boutique (`storeMap.openingHours`) en chaîne schema.org courante.
 * @param {{ daysLabel?: string, hoursLabel?: string } | undefined} openingHours
 */
function toSchemaOpeningHours(openingHours) {
  if (!openingHours?.daysLabel || !openingHours?.hoursLabel) return undefined

  const days = openingHours.daysLabel.toLowerCase()
  let daySpec = 'Mo-Sa'
  if (days.includes('lundi') && days.includes('vendredi') && !days.includes('samedi')) {
    daySpec = 'Mo-Fr'
  }

  const match = openingHours.hoursLabel.match(/(\d{1,2})h\s*[–-]\s*(\d{1,2})h/)
  if (!match) return undefined

  const pad = (value) => String(value).padStart(2, '0')
  return `${daySpec} ${pad(match[1])}:00-${pad(match[2])}:00`
}

/**
 * URL absolue du logo, depuis le même `seo.indexHtml.ogImagePath` que la coquille HTML.
 *
 * @param {Record<string, any>} siteConfig
 * @param {string} baseUrl
 * @returns {string}
 */
function resolveLogoUrl(siteConfig, baseUrl) {
  const configured = siteConfig?.seo?.indexHtml?.ogImagePath
  if (typeof configured !== 'string' || !configured.trim() || !baseUrl) return ''
  const path = configured.trim()
  return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`
}

/**
 * `PostalAddress` avec ses composants séparés quand l'adresse a pu être découpée, sinon la
 * ligne entière — un composant inventé vaut moins que pas de composant.
 *
 * @param {ReturnType<typeof resolveSiteNap>} nap
 */
function buildPostalAddress(nap) {
  const parts = nap.postalAddress ?? {}
  const address = {
    '@type': 'PostalAddress',
    streetAddress: parts.streetAddress || nap.streetAddress,
    addressCountry: parts.addressCountry || 'FR',
  }
  if (parts.postalCode) address.postalCode = parts.postalCode
  if (parts.addressLocality) address.addressLocality = parts.addressLocality
  return address
}

/**
 * Schémas JSON-LD globaux (WebSite + LocalBusiness) injectés sur toutes les pages publiques.
 * @param {Record<string, unknown>} siteConfig
 * @param {string} baseUrl
 */
export function buildGlobalStructuredData(siteConfig, baseUrl) {
  const schemas = []
  const brand = siteConfig?.brand ?? {}
  const features = siteConfig?.features ?? {}
  const storeMap = siteConfig?.storeMap ?? {}
  const social = siteConfig?.social ?? {}
  const nap = resolveSiteNap(siteConfig)
  const siteName = brand.displayName || brand.legalName || nap.name
  const logoUrl = resolveLogoUrl(siteConfig, baseUrl)

  const organization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteName,
    url: baseUrl,
  }

  if (brand.legalName && brand.displayName && brand.legalName !== brand.displayName) {
    organization.alternateName = brand.displayName
  }
  // `logo` : ce que Google lit pour le panneau de connaissance. Même visuel que la balise de
  // partage, déclaré une seule fois dans le manifest.
  if (logoUrl) organization.logo = logoUrl
  if (nap.telephone) organization.telephone = nap.telephone
  if (nap.email) organization.email = nap.email

  const orgSameAs = [
    social?.suivezNous?.instagramUrl,
    social?.suivezNous?.facebookUrl,
    social?.suivezNous?.tiktokUrl,
    social?.footerTiktokUrl,
  ].filter(Boolean)
  if (orgSameAs.length) organization.sameAs = orgSameAs

  schemas.push(organization)

  const website = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    url: baseUrl,
    publisher: {
      '@type': 'Organization',
      name: siteName,
      url: baseUrl,
    },
  }

  if (features.collection) {
    website.potentialAction = {
      '@type': 'SearchAction',
      target: `${baseUrl}/collection/recherche?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    }
  }

  schemas.push(website)

  if (!storeMap.enabled || !nap.streetAddress) {
    return schemas
  }

  const sameAs = [
    social?.suivezNous?.instagramUrl,
    social?.suivezNous?.facebookUrl,
    social?.suivezNous?.tiktokUrl,
    social?.footerTiktokUrl,
    storeMap.googleMapsUrl,
  ].filter(Boolean)

  const localBusiness = {
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'Store'],
    name: nap.name || siteName,
    url: baseUrl,
    parentOrganization: {
      '@type': 'Organization',
      name: siteName,
      url: baseUrl,
    },
    address: buildPostalAddress(nap),
  }

  // Description : propre au client, donc au manifest. Le socle ne décrit pas le commerce
  // de quelqu'un d'autre à sa place.
  const description = storeMap.description || siteConfig?.seo?.indexHtml?.metaDescription
  if (description) localBusiness.description = description

  if (logoUrl) localBusiness.image = logoUrl

  if (nap.telephone) localBusiness.telephone = nap.telephone
  if (nap.email) localBusiness.email = nap.email

  if (storeMap.center?.lat != null && storeMap.center?.lng != null) {
    localBusiness.geo = {
      '@type': 'GeoCoordinates',
      latitude: storeMap.center.lat,
      longitude: storeMap.center.lng,
    }
  }

  const openingHours = toSchemaOpeningHours(storeMap.openingHours)
  if (openingHours) {
    localBusiness.openingHours = openingHours
  }

  if (sameAs.length) {
    localBusiness.sameAs = sameAs
  }

  if (storeMap.googleMapsUrl) {
    localBusiness.hasMap = storeMap.googleMapsUrl
  }

  schemas.push(localBusiness)
  return schemas
}
