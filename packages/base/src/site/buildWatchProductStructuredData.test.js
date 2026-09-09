/**
 * Schéma `Product` d'une fiche montre : ce que Google lit pour l'enrichissement produit.
 */
import { describe, expect, it } from 'vitest'

import { buildWatchProductStructuredData } from './buildWatchProductStructuredData.js'

const CANONIQUE = 'https://exemple.fr/montre/rolex-submariner-116610ln'

const build = (watch, price = 8500) =>
  buildWatchProductStructuredData({
    watch,
    price,
    canonicalUrl: CANONIQUE,
    baseUrl: 'https://exemple.fr',
    sellerName: 'Boutique',
    unknownBrandLabel: 'Marque inconnue',
  })

const montre = (overrides = {}) => ({
  id: 'w1',
  name: 'Rolex Submariner',
  brand: 'Rolex',
  reference: '116610LN',
  images: ['https://cdn.test/a.webp'],
  isAvailable: true,
  isSold: false,
  ...overrides,
})

describe('buildWatchProductStructuredData', () => {
  it('rend null sans montre', () => {
    expect(build(null)).toBeNull()
  })

  it('rattache le produit à sa page canonique', () => {
    expect(build(montre()).url).toBe(CANONIQUE)
  })

  it('déclare la référence en sku et en mpn', () => {
    const product = build(montre())
    expect(product.sku).toBe('116610LN')
    expect(product.mpn).toBe('116610LN')
  })

  it('retombe sur l’id en sku, sans mpn, quand la référence manque', () => {
    const product = build(montre({ reference: '' }))
    expect(product.sku).toBe('w1')
    expect(product.mpn).toBeUndefined()
  })

  it('décrit une offre disponible', () => {
    const { offers } = build(montre())
    expect(offers).toMatchObject({
      '@type': 'Offer',
      price: 8500,
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
      url: CANONIQUE,
    })
    expect(offers.seller).toEqual({
      '@type': 'Organization',
      name: 'Boutique',
      url: 'https://exemple.fr',
    })
  })

  it('passe en rupture pour une montre vendue', () => {
    expect(build(montre({ isSold: true })).offers.availability).toBe(
      'https://schema.org/OutOfStock',
    )
  })

  /**
   * `getEffectiveWatchPrice` rend `0` pour une pièce sans prix : déclarer une offre à zéro euro
   * annoncerait à Google une montre gratuite.
   */
  it('omet l’offre plutôt que d’annoncer zéro euro', () => {
    const product = build(montre(), 0)
    expect(product.offers).toBeUndefined()
    // Le reste du produit demeure : la fiche reste décrite, sans enrichissement prix.
    expect(product.name).toBe('Rolex Submariner')
    expect(product.url).toBe(CANONIQUE)
  })

  it('omet aussi l’offre pour un prix absent ou aberrant', () => {
    // `build()` a une valeur par défaut : ces cas passent donc par le constructeur directement.
    const sansPrix = (price) =>
      buildWatchProductStructuredData({
        watch: montre(),
        price,
        canonicalUrl: CANONIQUE,
        baseUrl: 'https://exemple.fr',
        sellerName: 'Boutique',
        unknownBrandLabel: 'Marque inconnue',
      })

    for (const price of [null, undefined, Number.NaN, -10, '8500']) {
      expect(sansPrix(price).offers, `prix ${String(price)}`).toBeUndefined()
    }
  })

  it('traduit l’état en vocabulaire schema.org', () => {
    expect(build(montre({ condition: 'Neuf' })).itemCondition).toBe(
      'https://schema.org/NewCondition',
    )
    expect(build(montre({ condition: 'Comme neuf' })).itemCondition).toBe(
      'https://schema.org/UsedCondition',
    )
    expect(build(montre({ condition: '' })).itemCondition).toBeUndefined()
  })

  it('nomme la marque inconnue plutôt que de laisser un vide', () => {
    expect(build(montre({ brand: '' })).brand.name).toBe('Marque inconnue')
  })

  it('compose une description de repli sans espace parasite', () => {
    expect(build(montre({ description: '' })).description).toBe('Rolex 116610LN')
    expect(build(montre({ description: '', brand: '', reference: '' })).description).toBe('')
  })
})
