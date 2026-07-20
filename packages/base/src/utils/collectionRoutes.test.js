import { describe, expect, it } from 'vitest'

import {
  buildBrandCollectionPath,
  buildBrandCollectionUrl,
  resolveBrandSlugFromRoute,
} from './collectionRoutes.js'

describe('buildBrandCollectionPath', () => {
  it('construit un chemin slugifié depuis le libellé marque', () => {
    expect(buildBrandCollectionPath('Oméga')).toBe('/collection/omega')
    expect(buildBrandCollectionPath('Audemars Piguet')).toBe('/collection/audemars-piguet')
  })

  it('replie sur /collection sans marque exploitable', () => {
    expect(buildBrandCollectionPath('')).toBe('/collection')
    expect(buildBrandCollectionPath('   ')).toBe('/collection')
  })
})

describe('buildBrandCollectionUrl', () => {
  it('concatène origine et chemin sans double slash', () => {
    expect(buildBrandCollectionUrl('https://example.com/', 'Rolex')).toBe(
      'https://example.com/collection/rolex',
    )
    expect(buildBrandCollectionUrl('https://example.com', 'Rolex')).toBe(
      'https://example.com/collection/rolex',
    )
  })
})

describe('resolveBrandSlugFromRoute', () => {
  it('privilégie le paramètre de route brandSlug', () => {
    const route = { params: { brandSlug: 'Rolex' }, query: { marque: 'omega' } }
    expect(resolveBrandSlugFromRoute(route)).toBe('rolex')
  })

  it('replie sur la query ?marque=', () => {
    expect(resolveBrandSlugFromRoute({ query: { marque: ' Omega ' } })).toBe('omega')
  })

  it('prend la première valeur si la query est répétée', () => {
    expect(resolveBrandSlugFromRoute({ query: { marque: ['cartier', 'rolex'] } })).toBe('cartier')
  })

  it('retourne une chaîne vide sans marque', () => {
    expect(resolveBrandSlugFromRoute({})).toBe('')
    expect(resolveBrandSlugFromRoute(null)).toBe('')
    expect(resolveBrandSlugFromRoute({ query: {} })).toBe('')
  })
})
