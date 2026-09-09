/**
 * Schémas JSON-LD globaux : ce que Google lit sur chaque page publique pour rattacher le site
 * à une organisation et, quand la boutique est publique, à un établissement local.
 */
import { describe, expect, it } from 'vitest'

import { buildGlobalStructuredData } from './buildGlobalStructuredData.js'

const BASE = 'https://exemple.fr'

const siteConfig = (overrides = {}) => ({
  brand: { displayName: 'Boutique', legalName: 'Boutique SARL' },
  features: { collection: true },
  contact: { email: 'contact@exemple.fr', phoneE164: '+33388224040' },
  seo: { indexHtml: { ogImagePath: '/logo.png', metaDescription: 'Description du manifest.' } },
  storeMap: {
    enabled: true,
    directionsAddress: '14 Place de la Cathédrale, 67000 Strasbourg, France',
  },
  ...overrides,
})

const typeOf = (schemas, type) =>
  schemas.find((s) => (Array.isArray(s['@type']) ? s['@type'].includes(type) : s['@type'] === type))

describe('buildGlobalStructuredData', () => {
  it('donne un logo absolu à l’organisation', () => {
    const org = typeOf(buildGlobalStructuredData(siteConfig(), BASE), 'Organization')
    expect(org.logo).toBe('https://exemple.fr/logo.png')
  })

  it('n’invente pas de logo quand le manifest n’en déclare pas', () => {
    const config = siteConfig({ seo: { indexHtml: {} } })
    const org = typeOf(buildGlobalStructuredData(config, BASE), 'Organization')
    expect(org.logo).toBeUndefined()
  })

  it('détaille l’adresse de l’établissement', () => {
    const business = typeOf(buildGlobalStructuredData(siteConfig(), BASE), 'LocalBusiness')
    expect(business.address).toEqual({
      '@type': 'PostalAddress',
      streetAddress: '14 Place de la Cathédrale',
      postalCode: '67000',
      addressLocality: 'Strasbourg',
      addressCountry: 'FR',
    })
  })

  it('retombe sur la ligne entière quand l’adresse n’est pas découpable', () => {
    const config = siteConfig({
      storeMap: { enabled: true, directionsAddress: 'Galerie marchande, niveau 2' },
    })
    const business = typeOf(buildGlobalStructuredData(config, BASE), 'LocalBusiness')

    expect(business.address.streetAddress).toBe('Galerie marchande, niveau 2')
    expect(business.address.postalCode).toBeUndefined()
    expect(business.address.addressLocality).toBeUndefined()
  })

  /** Le socle est multi-client : il ne décrit pas le commerce à la place du manifest. */
  it('prend la description dans le manifest', () => {
    const business = typeOf(buildGlobalStructuredData(siteConfig(), BASE), 'LocalBusiness')
    expect(business.description).toBe('Description du manifest.')
  })

  it('préfère une description propre au magasin quand elle est déclarée', () => {
    const config = siteConfig()
    config.storeMap.description = 'Horlogerie-bijouterie depuis 1995.'
    const business = typeOf(buildGlobalStructuredData(config, BASE), 'LocalBusiness')
    expect(business.description).toBe('Horlogerie-bijouterie depuis 1995.')
  })

  it('omet la description plutôt que d’en inventer une', () => {
    const config = siteConfig({ seo: { indexHtml: { ogImagePath: '/logo.png' } } })
    const business = typeOf(buildGlobalStructuredData(config, BASE), 'LocalBusiness')
    expect(business.description).toBeUndefined()
  })

  /** Visites sur rendez-vous : l'adresse ne doit pas sortir des mentions légales. */
  it('n’émet pas d’établissement quand la carte est désactivée', () => {
    const config = siteConfig({
      storeMap: { enabled: false, directionsAddress: '14 Place, 67000 Strasbourg' },
    })
    const schemas = buildGlobalStructuredData(config, BASE)

    expect(typeOf(schemas, 'LocalBusiness')).toBeUndefined()
    expect(typeOf(schemas, 'Organization')).toBeDefined()
    expect(typeOf(schemas, 'WebSite')).toBeDefined()
  })
})
