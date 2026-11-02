/**
 * Le coup de foudre doit rester rare : ces tests figent les deux verrous (affinité, délai) et
 * le cas du visiteur sans critère, qui ne doit pas se voir prêter une affinité inventée.
 */
import { describe, expect, it } from 'vitest'

import { sanitizePreferences } from './watchMatchCore.js'
import {
  SPARK_COOLDOWN_LIKES,
  isCoupDeFoudre,
  likesSinceLastSpark,
  sparkTraits,
} from './watchMatchSpark.js'

function makeWatch(id, { brand = 'Rolex', braceletMaterials = [] } = {}) {
  return { id, brand, price: 5000, details: { braceletMaterials, braceletColors: [] } }
}

const rolexLover = sanitizePreferences({ brand: ['rolex'] })

describe('likesSinceLastSpark', () => {
  it('ne retient rien tant qu’aucun coup de foudre n’a eu lieu', () => {
    expect(likesSinceLastSpark(['a', 'b'], [])).toBe(Infinity)
  })

  it('compte les coups de cœur donnés après le dernier coup de foudre', () => {
    expect(likesSinceLastSpark(['a', 'b', 'c', 'd'], ['b'])).toBe(2)
    expect(likesSinceLastSpark(['a', 'b'], ['b'])).toBe(0)
  })

  it('libère le suivant quand le coup de foudre a été retiré des coups de cœur', () => {
    expect(likesSinceLastSpark(['a'], ['z'])).toBe(Infinity)
  })
})

describe('isCoupDeFoudre', () => {
  it('foudroie une montre qui coche ce que le visiteur a demandé', () => {
    expect(isCoupDeFoudre(makeWatch('a'), rolexLover)).toBe(true)
  })

  it('ne foudroie pas une montre qui contredit les préférences', () => {
    expect(isCoupDeFoudre(makeWatch('a', { brand: 'Omega' }), rolexLover)).toBe(false)
  })

  it('exige assez d’affinité : une moitié de préférences ne suffit pas', () => {
    const prefs = sanitizePreferences({ brand: ['rolex'], bracelet: ['leather'] })
    // Marque (3) cochée, bracelet (2) contredit : (3 - 1) / 5 = 0,4.
    const watch = makeWatch('a', { braceletMaterials: ['steel'] })
    expect(isCoupDeFoudre(watch, prefs)).toBe(false)
  })

  it(`attend ${SPARK_COOLDOWN_LIKES} coups de cœur ordinaires entre deux coups de foudre`, () => {
    const watch = makeWatch('e')
    expect(isCoupDeFoudre(watch, rolexLover, { liked: ['a', 'b'], sparks: ['a'] })).toBe(false)
    expect(isCoupDeFoudre(watch, rolexLover, { liked: ['a', 'b', 'c'], sparks: ['a'] })).toBe(false)
    expect(isCoupDeFoudre(watch, rolexLover, { liked: ['a', 'b', 'c', 'd'], sparks: ['a'] })).toBe(
      true,
    )
  })

  it('ne célèbre pas deux fois la même montre', () => {
    expect(isCoupDeFoudre(makeWatch('a'), rolexLover, { liked: [], sparks: ['a'] })).toBe(false)
  })

  it('sans critère exprimé, seul le tout premier coup de cœur est célébré', () => {
    const none = sanitizePreferences({})
    expect(isCoupDeFoudre(makeWatch('a'), none)).toBe(true)
    expect(isCoupDeFoudre(makeWatch('b'), none, { liked: ['x'], sparks: [] })).toBe(false)
    expect(
      isCoupDeFoudre(makeWatch('b'), none, { liked: ['a', 'x', 'y', 'z'], sparks: ['a'] }),
    ).toBe(false)
  })
})

describe('sparkTraits', () => {
  it('liste les préférences cochées par la montre, critère par critère', () => {
    const prefs = sanitizePreferences({ brand: ['rolex', 'tudor'], bracelet: ['leather'] })
    const watch = makeWatch('a', { braceletMaterials: ['leather'] })
    expect(sparkTraits(watch, prefs)).toEqual([
      { criterionId: 'brand', values: ['rolex'] },
      { criterionId: 'bracelet', values: ['leather'] },
    ])
  })
})
