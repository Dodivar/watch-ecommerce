import { describe, expect, it } from 'vitest'

import {
  SEARCH_QUERY_MAX_LENGTH,
  normalizeSearchText,
  parseSearchQuery,
  watchMatchesSearchQuery,
} from './watchSearch.js'

describe('normalizeSearchText', () => {
  it('met en minuscules et retire les accents', () => {
    expect(normalizeSearchText('Édition Été')).toBe('edition ete')
    expect(normalizeSearchText('Frédérique Constant')).toBe('frederique constant')
  })

  it('retourne une chaîne vide pour les entrées non textuelles', () => {
    expect(normalizeSearchText(null)).toBe('')
    expect(normalizeSearchText(undefined)).toBe('')
    expect(normalizeSearchText(42)).toBe('')
    expect(normalizeSearchText('')).toBe('')
  })
})

describe('parseSearchQuery', () => {
  it('retourne null pour une valeur absente ou vide', () => {
    expect(parseSearchQuery(null)).toBeNull()
    expect(parseSearchQuery(undefined)).toBeNull()
    expect(parseSearchQuery('   ')).toBeNull()
    expect(parseSearchQuery([])).toBeNull()
  })

  it('prend la première valeur d’un tableau (query répétée)', () => {
    expect(parseSearchQuery(['rolex', 'omega'])).toBe('rolex')
  })

  it('trim et tronque à la longueur maximale', () => {
    expect(parseSearchQuery('  submariner  ')).toBe('submariner')

    const long = 'a'.repeat(SEARCH_QUERY_MAX_LENGTH + 20)
    expect(parseSearchQuery(long)).toHaveLength(SEARCH_QUERY_MAX_LENGTH)
  })
})

describe('watchMatchesSearchQuery', () => {
  const watch = {
    name: 'Speedmaster Moonwatch',
    brand: 'Oméga',
    model: 'Speedmaster',
    reference: '310.30.42.50.01.001',
    ad_code: 'AD-123',
  }

  it('matche sur chaque champ, sans tenir compte de la casse ni des accents', () => {
    expect(watchMatchesSearchQuery(watch, 'moonwatch')).toBe(true)
    expect(watchMatchesSearchQuery(watch, 'omega')).toBe(true)
    expect(watchMatchesSearchQuery(watch, 'SPEEDMASTER')).toBe(true)
    expect(watchMatchesSearchQuery(watch, '310.30.42')).toBe(true)
    expect(watchMatchesSearchQuery(watch, 'ad-123')).toBe(true)
  })

  it('ne matche pas un terme absent', () => {
    expect(watchMatchesSearchQuery(watch, 'rolex')).toBe(false)
  })

  it('retourne false sans requête ou sans montre', () => {
    expect(watchMatchesSearchQuery(watch, null)).toBe(false)
    expect(watchMatchesSearchQuery(watch, '')).toBe(false)
    expect(watchMatchesSearchQuery(null, 'omega')).toBe(false)
  })

  it('tolère une montre aux champs manquants', () => {
    expect(watchMatchesSearchQuery({}, 'omega')).toBe(false)
    expect(watchMatchesSearchQuery({ brand: 'Oméga' }, 'omega')).toBe(true)
  })
})
