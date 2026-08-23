import { describe, expect, it } from 'vitest'

import {
  buildServiceLandingStructuredData,
  parseOfferPrice,
} from './buildServiceLandingStructuredData.js'
import { resolveServiceLandings } from './serviceLandings.js'

const BASE_URL = 'https://www.placedesmontres.fr'

function siteConfig(overrides = {}) {
  return {
    brand: { displayName: 'Place des Montres', legalName: 'Place des Montres' },
    contact: { phoneE164: '+33388224040' },
    storeMap: { enabled: true, directionsAddress: '24 Place des Halles, 67000 Strasbourg' },
    ...overrides,
  }
}

function buildLanding(overrides = {}) {
  const [landing] = resolveServiceLandings({
    servicesPage: {
      landings: [
        {
          slug: 'changement-pile-montre',
          navLabel: 'Changement de pile',
          hero: { title: 'Changement de pile de montre', lead: 'Pile posée en quelques minutes.' },
          ...overrides,
        },
      ],
    },
  })
  return landing
}

describe('parseOfferPrice', () => {
  it('lit un montant simple en euros', () => {
    expect(parseOfferPrice('9 €')).toBe(9)
    expect(parseOfferPrice('21€')).toBe(21)
    expect(parseOfferPrice('12,50 €')).toBe(12.5)
  })

  it('renvoie null pour un prix non chiffré', () => {
    expect(parseOfferPrice('Sur devis')).toBeNull()
    expect(parseOfferPrice('Selon modèle')).toBeNull()
    expect(parseOfferPrice('Offert')).toBeNull()
    expect(parseOfferPrice(undefined)).toBeNull()
  })
})

describe('buildServiceLandingStructuredData', () => {
  it('décrit la prestation et son prestataire', () => {
    const [service] = buildServiceLandingStructuredData(
      siteConfig(),
      buildLanding(),
      BASE_URL,
      { areaServed: 'Strasbourg' },
    )

    expect(service['@type']).toBe('Service')
    expect(service.url).toBe(`${BASE_URL}/services/changement-pile-montre`)
    expect(service.description).toBe('Pile posée en quelques minutes.')
    expect(service.areaServed).toEqual({ '@type': 'City', name: 'Strasbourg' })
    expect(service.provider['@type']).toBe('LocalBusiness')
    expect(service.provider.telephone).toBe('+33388224040')
  })

  it('bascule sur Organization quand l’adresse n’est pas publique', () => {
    const [service] = buildServiceLandingStructuredData(
      siteConfig({ storeMap: { enabled: false } }),
      buildLanding(),
      BASE_URL,
    )

    expect(service.provider['@type']).toBe('Organization')
    expect(service.areaServed).toBeUndefined()
  })

  it('expose un Offer unique et ignore les prix « sur devis »', () => {
    const [service] = buildServiceLandingStructuredData(
      siteConfig(),
      buildLanding({
        pricing: {
          title: 'Tarifs',
          items: [
            { label: 'Pile RENATA', price: '9 €' },
            { label: 'Révision', price: 'Sur devis' },
          ],
        },
      }),
      BASE_URL,
    )

    expect(service.offers['@type']).toBe('Offer')
    expect(service.offers.price).toBe(9)
    expect(service.offers.priceCurrency).toBe('EUR')
  })

  it('groupe plusieurs prix dans un OfferCatalog', () => {
    const [service] = buildServiceLandingStructuredData(
      siteConfig(),
      buildLanding({
        pricing: {
          items: [
            { label: 'Pile RENATA', price: '9 €' },
            { label: 'Étanchéité', price: '21 €' },
          ],
        },
      }),
      BASE_URL,
    )

    expect(service.offers['@type']).toBe('OfferCatalog')
    expect(service.offers.itemListElement).toHaveLength(2)
  })

  it('ajoute une FAQPage quand la page porte des questions', () => {
    const schemas = buildServiceLandingStructuredData(
      siteConfig(),
      buildLanding({
        faq: [{ question: 'Faut-il un rendez-vous ?', answer: '<strong>Non</strong>, passez quand vous voulez.' }],
      }),
      BASE_URL,
    )

    expect(schemas).toHaveLength(2)
    expect(schemas[1]['@type']).toBe('FAQPage')
    expect(schemas[1].mainEntity[0].acceptedAnswer.text).toBe('Non, passez quand vous voulez.')
  })

  it('renvoie un tableau vide sans page', () => {
    expect(buildServiceLandingStructuredData(siteConfig(), null, BASE_URL)).toEqual([])
  })
})
