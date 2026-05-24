import { describe, expect, it } from 'vitest'

import {
  buildCollectionRouteFromFilters,
  resolveHomeSelectionsConfig,
} from './homeSelections.js'

describe('buildCollectionRouteFromFilters', () => {
  it('construit path /collection avec query marque et public valides', () => {
    expect(
      buildCollectionRouteFromFilters({ marque: 'Rolex', public: 'homme' }),
    ).toEqual({
      path: '/collection',
      query: { marque: 'rolex', public: 'homme' },
    })
  })

  it('ignore public invalide', () => {
    expect(buildCollectionRouteFromFilters({ public: 'invalid' })).toEqual({
      path: '/collection',
      query: {},
    })
  })
})

describe('resolveHomeSelectionsConfig', () => {
  it('retourne titre par défaut et cartes vides si absent', () => {
    const cfg = resolveHomeSelectionsConfig({})
    expect(cfg.cards).toEqual([])
    expect(cfg.title).toBeTruthy()
  })

  it('normalise les cartes valides', () => {
    const cfg = resolveHomeSelectionsConfig({
      home: {
        selections: {
          title: 'Sélections',
          cards: [{ label: 'Homme', filters: { public: 'homme' } }],
        },
      },
    })
    expect(cfg.cards).toHaveLength(1)
    expect(cfg.cards[0].label).toBe('Homme')
  })
})
