import { describe, expect, it } from 'vitest'

import {
  buildWatchPath,
  buildWatchSlug,
  isLegacyWatchIdParam,
  slugifyWatchPart,
} from './watchSlug.js'

describe('watchSlug', () => {
  it('génère un slug lisible depuis marque, nom et référence', () => {
    expect(
      buildWatchSlug({
        brand: 'Rolex',
        name: 'Submariner Date',
        reference: '126610LN',
      }),
    ).toBe('rolex-submariner-date-126610ln')
  })

  it('ne répète ni la marque portée par le nom, ni la référence qu’il contient', () => {
    expect(
      buildWatchSlug({
        brand: 'ROLEX',
        name: 'Rolex Explorer I - 114270 - Montre seule',
        reference: '114270',
      }),
    ).toBe('rolex-explorer-i-114270-montre-seule')
    expect(buildWatchSlug({ brand: 'Oméga', name: 'Omega Seamaster', reference: '2254' })).toBe(
      'omega-seamaster-2254',
    )
    // Une référence qui n'apparaît que comme fragment d'un autre segment est gardée.
    expect(buildWatchSlug({ brand: 'Tudor', name: 'Tudor Black Bay 58', reference: '58' })).toBe(
      'tudor-black-bay-58',
    )
    expect(buildWatchSlug({ brand: 'Tudor', name: 'Black Bay 5800', reference: '58' })).toBe(
      'tudor-black-bay-5800-58',
    )
    expect(buildWatchSlug({ brand: 'Rolex', name: 'Rolex', reference: '5500' })).toBe('rolex-5500')
  })

  it('utilise le slug stocké en base si présent', () => {
    expect(buildWatchSlug({ slug: 'omega-speedmaster-moonwatch' })).toBe(
      'omega-speedmaster-moonwatch',
    )
  })

  it('construit le chemin canonique /montre/:slug', () => {
    expect(
      buildWatchPath({
        brand: 'Cartier',
        name: 'Santos',
        reference: 'WSSA0037',
      }),
    ).toBe('/montre/cartier-santos-wssa0037')
  })

  it('détecte les identifiants legacy UUID ou numériques', () => {
    expect(isLegacyWatchIdParam('42')).toBe(true)
    expect(isLegacyWatchIdParam('a1b2c3d4-e5f6-4789-a012-3456789abcde')).toBe(true)
    expect(isLegacyWatchIdParam('rolex-submariner')).toBe(false)
  })

  it('normalise les parties de slug', () => {
    expect(slugifyWatchPart('TAG Heuer')).toBe('tag-heuer')
    expect(slugifyWatchPart('Réf. 126610LN')).toBe('ref-126610ln')
  })
})
