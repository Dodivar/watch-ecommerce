import { describe, expect, it } from 'vitest'

import {
  MATCH_CRITERIA,
  MATCH_ROUND_SIZE,
  buildBudgetSuggestions,
  buildMatchFacets,
  createEmptyPreferences,
  hasAnyPreference,
  isWatchInBudget,
  rankPool,
  sanitizePreferences,
  scoreWatch,
  selectMatchRound,
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

  it('compte les scores non négatifs en tête du classement', () => {
    const prefs = { ...createEmptyPreferences(), brand: ['audemars piguet'] }
    const { ranked, positiveCount } = rankPool(SAUVAGE_LIKE_POOL, prefs)
    // Une seule AP : les Rolex contredisent la marque demandée.
    expect(positiveCount).toBe(1)
    expect(ranked[0].id).toBe('ap')
  })
})

describe('selectMatchRound', () => {
  /** Catalogue trop grand pour être parcouru d'une traite, tel qu'il motive la manche. */
  const BIG_POOL = Array.from({ length: 250 }, (_, i) =>
    makeWatch({ id: `w${String(i).padStart(3, '0')}`, displayOrder: 250 - i }),
  )

  it('borne la manche même quand tout le catalogue correspond', () => {
    const { ranked, positiveCount } = rankPool(BIG_POOL, createEmptyPreferences())
    const deck = selectMatchRound(ranked, {
      seen: [],
      allowance: MATCH_ROUND_SIZE,
      positiveCount,
    })
    expect(deck).toHaveLength(MATCH_ROUND_SIZE)
    expect(deck[0].id).toBe('w000')
  })

  it('reprend la suite du classement à la manche suivante, sans rien perdre', () => {
    const { ranked, positiveCount } = rankPool(BIG_POOL, createEmptyPreferences())
    const first = selectMatchRound(ranked, { seen: [], allowance: MATCH_ROUND_SIZE, positiveCount })
    const seen = first.map((w) => w.id)
    const second = selectMatchRound(ranked, {
      seen,
      allowance: MATCH_ROUND_SIZE,
      positiveCount,
    })
    expect(second).toHaveLength(MATCH_ROUND_SIZE)
    expect(second.map((w) => w.id)).not.toContain(first[0].id)
    expect(second[0].id).toBe(`w0${String(MATCH_ROUND_SIZE).padStart(2, '0')}`)
  })

  it('rend un deck vide quand l’allocation est épuisée', () => {
    const { ranked, positiveCount } = rankPool(BIG_POOL, createEmptyPreferences())
    expect(selectMatchRound(ranked, { seen: [], allowance: 0, positiveCount })).toEqual([])
  })

  it('écarte les montres qui contredisent tant qu’il reste de quoi remplir', () => {
    const prefs = { ...createEmptyPreferences(), brand: ['rolex'] }
    // 10 Rolex (score positif) et 10 AP (score négatif) : les AP n'ont pas à être présentées.
    const pool = [
      ...Array.from({ length: 10 }, (_, i) => makeWatch({ id: `rx${i}`, brand: 'Rolex' })),
      ...Array.from({ length: 10 }, (_, i) =>
        makeWatch({ id: `ap${i}`, brand: 'Audemars Piguet' }),
      ),
    ]
    const { ranked, positiveCount } = rankPool(pool, prefs)
    const deck = selectMatchRound(ranked, {
      seen: [],
      allowance: MATCH_ROUND_SIZE,
      positiveCount,
    })
    expect(deck).toHaveLength(10)
    expect(deck.every((w) => w.brand === 'Rolex')).toBe(true)
  })

  it('abandonne l’écrémage plutôt que de rétrécir la manche quand tout contredit', () => {
    const prefs = { ...createEmptyPreferences(), brand: ['rolex'] }
    const pool = Array.from({ length: 30 }, (_, i) =>
      makeWatch({ id: `ap${String(i).padStart(2, '0')}`, brand: 'Audemars Piguet' }),
    )
    const { ranked, positiveCount } = rankPool(pool, prefs)
    expect(positiveCount).toBe(0)
    const deck = selectMatchRound(ranked, {
      seen: [],
      allowance: MATCH_ROUND_SIZE,
      positiveCount,
    })
    // Un deck de `MATCH_DECK_MIN` serait le plancher pris pour un plafond : la manche reste
    // pleine, la moins mauvaise montre devant.
    expect(deck).toHaveLength(MATCH_ROUND_SIZE)
  })

  it('n’écrème que si la coupe laisse de quoi remplir', () => {
    const prefs = { ...createEmptyPreferences(), brand: ['rolex'] }
    // 3 Rolex seulement : écarter les 27 autres laisserait moins que `MATCH_DECK_MIN`.
    const pool = [
      ...Array.from({ length: 3 }, (_, i) => makeWatch({ id: `rx${i}`, brand: 'Rolex' })),
      ...Array.from({ length: 27 }, (_, i) =>
        makeWatch({ id: `ap${String(i).padStart(2, '0')}`, brand: 'Audemars Piguet' }),
      ),
    ]
    const { ranked, positiveCount } = rankPool(pool, prefs)
    expect(positiveCount).toBe(3)
    const deck = selectMatchRound(ranked, {
      seen: [],
      allowance: MATCH_ROUND_SIZE,
      positiveCount,
    })
    expect(deck).toHaveLength(MATCH_ROUND_SIZE)
    expect(deck.slice(0, 3).every((w) => w.brand === 'Rolex')).toBe(true)
  })

  it('épuise le catalogue manche après manche, sans jamais rien perdre', () => {
    const prefs = { ...createEmptyPreferences(), brand: ['rolex'] }
    // 50 Rolex correspondent, 200 contredisent : le visiteur qui insiste doit pouvoir tout voir.
    const pool = BIG_POOL.map((watch, i) => ({
      ...watch,
      brand: i % 5 === 0 ? 'Rolex' : 'Omega',
    }))
    const { ranked, positiveCount } = rankPool(pool, prefs)
    const seen = new Set()
    const rounds = []
    for (let guard = 0; guard < 100 && rounds.length < 40; guard += 1) {
      const deck = selectMatchRound(ranked, {
        seen,
        allowance: MATCH_ROUND_SIZE,
        positiveCount,
      })
      if (deck.length === 0) break
      rounds.push(deck.length)
      deck.forEach((w) => seen.add(w.id))
    }
    // Les 50 Rolex d'abord, deux manches et demie, puis le reste du catalogue.
    expect(rounds.slice(0, 3)).toEqual([MATCH_ROUND_SIZE, MATCH_ROUND_SIZE, 10])
    expect(seen.size).toBe(ranked.length)
  })

  it('ne présente jamais plus que ce que le catalogue contient', () => {
    const { ranked, positiveCount } = rankPool(SAUVAGE_LIKE_POOL, createEmptyPreferences())
    const deck = selectMatchRound(ranked, {
      seen: [],
      allowance: MATCH_ROUND_SIZE,
      positiveCount,
    })
    expect(deck).toHaveLength(SAUVAGE_LIKE_POOL.length)
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
