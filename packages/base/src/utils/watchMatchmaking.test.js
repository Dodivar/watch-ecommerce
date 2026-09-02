import { describe, expect, it } from 'vitest'

import {
  MATCH_CRITERIA,
  buildBudgetSuggestions,
  buildMatchFacets,
  createEmptyPreferences,
  hasAnyPreference,
  isWatchInBudget,
  rankPool,
  sanitizePreferences,
  scoreWatch,
  watchValuesFor,
} from './watchMatchmaking.js'

/** Montre minimale dans la forme produite par `transformWatchData`. */
function makeWatch(overrides = {}) {
  const { details, ...rest } = overrides
  return {
    id: 'w',
    brand: 'Rolex',
    price: 5000,
    displayOrder: 0,
    details: {
      movement: '',
      caseMaterial: '',
      braceletMaterials: [],
      braceletColors: [],
      dialColor: '',
      ...details,
    },
    ...rest,
  }
}

/** Reflet du stock Sauvage au 2026-09-02 : 8 Rolex acier et 1 AP, mouvements en calibres. */
const SAUVAGE_LIKE_POOL = [
  makeWatch({
    id: 'ap',
    brand: 'Audemars Piguet',
    price: 58990,
    details: {
      movement: '4302',
      caseMaterial: 'Acier',
      braceletMaterials: ['steel'],
      braceletColors: ['silver'],
      dialColor: 'Bleu',
    },
  }),
  makeWatch({
    id: 'r1',
    brand: 'ROLEX',
    price: 7890,
    details: {
      movement: '3230',
      caseMaterial: 'Acier',
      braceletMaterials: ['steel'],
      braceletColors: ['silver'],
    },
  }),
  makeWatch({
    id: 'r2',
    brand: 'ROLEX',
    price: 12750,
    details: {
      movement: '3235',
      caseMaterial: 'Acier',
      braceletMaterials: ['steel'],
      braceletColors: ['silver'],
      dialColor: 'Noir',
    },
  }),
  makeWatch({
    id: 'r3',
    brand: 'Rolex',
    price: 3000,
    details: {
      movement: '1225',
      caseMaterial: 'Acier',
      braceletMaterials: ['steel'],
      braceletColors: ['silver'],
    },
  }),
]

describe('buildMatchFacets', () => {
  it('regroupe « ROLEX » et « Rolex » en une seule marque, libellée par la casse majoritaire', () => {
    const facets = buildMatchFacets(SAUVAGE_LIKE_POOL)
    expect(facets.brand.options.map((o) => o.value)).toEqual(['audemars piguet', 'rolex'])
    expect(facets.brand.options.find((o) => o.value === 'rolex').label).toBe('ROLEX')
  })

  it('désactive un critère qui ne propose pas au moins deux options', () => {
    const facets = buildMatchFacets(SAUVAGE_LIKE_POOL)
    // Tout le stock est en acier sur bracelet acier argenté : rien à demander.
    expect(facets.bracelet.active).toBe(false)
    expect(facets.caseMaterial.active).toBe(false)
    // Deux marques et une vraie dispersion de prix : ces deux écrans restent.
    expect(facets.brand.active).toBe(true)
    expect(facets.budget.active).toBe(true)
  })

  it('ignore les calibres bruts pour le mouvement (aucune option, écran masqué)', () => {
    const facets = buildMatchFacets(SAUVAGE_LIKE_POOL)
    expect(facets.movement.options).toEqual([])
    expect(facets.movement.active).toBe(false)
  })

  it('allume le mouvement dès que deux formulations reconnues coexistent', () => {
    const facets = buildMatchFacets([
      makeWatch({ id: 'a', details: { movement: 'Remontage automatique' } }),
      makeWatch({ id: 'b', details: { movement: 'Quartz' } }),
      makeWatch({ id: 'c', details: { movement: 'MT5400' } }),
    ])
    expect(facets.movement.active).toBe(true)
    expect(facets.movement.options.map((o) => o.value)).toEqual([
      'watchSpec.movement.automatic',
      'watchSpec.movement.quartz',
    ])
  })

  it('réunit couleurs de bracelet et de cadran dans une seule facette, avec dégradé', () => {
    const facets = buildMatchFacets([
      makeWatch({ id: 'a', details: { braceletColors: ['gold'], dialColor: 'Noir' } }),
      makeWatch({ id: 'b', details: { dialColor: 'Vert / Bleu' } }),
    ])
    const values = facets.color.options.map((o) => o.value)
    expect(values).toEqual(expect.arrayContaining(['gold', 'black', 'green', 'blue']))
    for (const option of facets.color.options) {
      expect(option.gradient).toMatch(/^linear-gradient/)
      expect(option.labelKey).toMatch(/^watchSpec\.color\./)
    }
  })

  it('liste les critères actifs dans l’ordre des écrans', () => {
    const facets = buildMatchFacets(SAUVAGE_LIKE_POOL)
    expect(facets.activeCriteria).toEqual(['budget', 'brand', 'color'])
    const order = MATCH_CRITERIA.map((c) => c.id)
    expect([...facets.activeCriteria].sort((a, b) => order.indexOf(a) - order.indexOf(b))).toEqual(
      facets.activeCriteria,
    )
  })

  it('arrondit les bornes du budget et propose des tranches lisibles', () => {
    const facets = buildMatchFacets(SAUVAGE_LIKE_POOL)
    expect(facets.budget.min).toBe(3000)
    expect(facets.budget.max).toBe(59000)
    for (const range of facets.budget.suggestions) {
      expect(range.min % 50).toBe(0)
      expect(range.max % 50).toBe(0)
      expect(range.min).toBeLessThan(range.max)
    }
  })

  it('reste inerte sur un pool vide', () => {
    const facets = buildMatchFacets([])
    expect(facets.pool).toBe(0)
    expect(facets.activeCriteria).toEqual([])
    expect(facets.budget.active).toBe(false)
  })
})

describe('buildBudgetSuggestions', () => {
  it('ne suggère rien sous trois prix ou sans dispersion', () => {
    expect(buildBudgetSuggestions([1000, 2000])).toEqual([])
    expect(buildBudgetSuggestions([1000, 1000, 1000, 1000])).toEqual([])
  })

  it('découpe en trois tranches contiguës', () => {
    const ranges = buildBudgetSuggestions([1000, 2000, 3000, 6000, 9000, 15000])
    expect(ranges).toHaveLength(3)
    expect(ranges[0].max).toBe(ranges[1].min)
    expect(ranges[1].max).toBe(ranges[2].min)
  })
})

describe('scoreWatch — inconnu = neutre', () => {
  it('ne pénalise pas une montre dont la couleur n’est pas renseignée', () => {
    const prefs = { ...createEmptyPreferences(), color: ['black'] }
    const unknown = makeWatch({ id: 'u' })
    const wrong = makeWatch({ id: 'w', details: { dialColor: 'Bleu' } })
    const right = makeWatch({ id: 'r', details: { dialColor: 'Noir' } })

    expect(scoreWatch(unknown, prefs)).toBe(0)
    expect(scoreWatch(wrong, prefs)).toBeLessThan(0)
    expect(scoreWatch(right, prefs)).toBeGreaterThan(0)
  })

  it('traite un calibre brut comme un mouvement inconnu', () => {
    const prefs = { ...createEmptyPreferences(), movement: ['watchSpec.movement.automatic'] }
    expect(scoreWatch(makeWatch({ details: { movement: '3235' } }), prefs)).toBe(0)
    expect(scoreWatch(makeWatch({ details: { movement: 'Remontage automatique' } }), prefs)).toBe(1)
  })

  it('pèse la marque plus lourd que le mouvement', () => {
    const prefs = {
      ...createEmptyPreferences(),
      brand: ['rolex'],
      movement: ['watchSpec.movement.quartz'],
    }
    const brandOnly = makeWatch({ brand: 'Rolex', details: { movement: 'Remontage manuel' } })
    const movementOnly = makeWatch({ brand: 'Omega', details: { movement: 'Quartz' } })
    expect(scoreWatch(brandOnly, prefs)).toBeGreaterThan(scoreWatch(movementOnly, prefs))
  })
})

describe('rankPool', () => {
  it('n’exclut que sur le budget, jamais sur les autres critères', () => {
    const prefs = { ...createEmptyPreferences(), brand: ['audemars piguet'] }
    const { ranked, excludedByBudget } = rankPool(SAUVAGE_LIKE_POOL, prefs)
    expect(ranked).toHaveLength(SAUVAGE_LIKE_POOL.length)
    expect(excludedByBudget).toBe(0)
    expect(ranked[0].id).toBe('ap')
  })

  it('applique le budget en filtre dur', () => {
    const prefs = { ...createEmptyPreferences(), budget: { min: 0, max: 10000 } }
    const { ranked, excludedByBudget } = rankPool(SAUVAGE_LIKE_POOL, prefs)
    expect(ranked.map((w) => w.id).sort()).toEqual(['r1', 'r3'])
    expect(excludedByBudget).toBe(2)
  })

  it('départage les ex æquo par displayOrder décroissant puis id', () => {
    const pool = [
      makeWatch({ id: 'b', displayOrder: 1 }),
      makeWatch({ id: 'a', displayOrder: 1 }),
      makeWatch({ id: 'c', displayOrder: 9 }),
    ]
    const { ranked } = rankPool(pool, createEmptyPreferences())
    expect(ranked.map((w) => w.id)).toEqual(['c', 'a', 'b'])
  })

  it('garde une montre sans prix quand un budget est fixé (inconnu = neutre)', () => {
    const noPrice = makeWatch({ id: 'np', price: null })
    expect(isWatchInBudget(noPrice, { min: 0, max: 100 })).toBe(true)
  })
})

describe('sanitizePreferences', () => {
  it('rejette un budget incohérent et les valeurs non textuelles', () => {
    const prefs = sanitizePreferences({
      budget: { min: 500, max: 100 },
      brand: ['rolex', 42, '', 'rolex'],
      color: 'black',
      extra: true,
    })
    expect(prefs.budget).toBeNull()
    expect(prefs.brand).toEqual(['rolex'])
    expect(prefs.color).toEqual([])
    expect(prefs).not.toHaveProperty('extra')
  })

  it('accepte un budget valide', () => {
    expect(sanitizePreferences({ budget: { min: 0, max: 5000 } }).budget).toEqual({
      min: 0,
      max: 5000,
    })
  })

  it('retourne des préférences vides pour une entrée absurde', () => {
    expect(sanitizePreferences(null)).toEqual(createEmptyPreferences())
    expect(hasAnyPreference(sanitizePreferences('x'))).toBe(false)
  })
})

describe('watchValuesFor', () => {
  it('lit les matières composées du boîtier', () => {
    const watch = makeWatch({ details: { caseMaterial: 'Acier / Or jaune' } })
    expect(watchValuesFor('caseMaterial', watch)).toEqual([
      'watchSpec.material.steel',
      'watchSpec.material.yellowGold',
    ])
  })

  it('renvoie un tableau vide pour un critère inconnu', () => {
    expect(watchValuesFor('budget', makeWatch())).toEqual([])
  })
})
