import { describe, expect, it } from 'vitest'

import {
  compareCaseSizeValues,
  formatCaseSizeDisplay,
  normalizeCaseSizeValue,
  parseCaseSizeMm,
  watchMatchesCaseSize,
} from './caseSize.js'

describe('parseCaseSizeMm', () => {
  it('extrait un nombre depuis une chaîne avec unité', () => {
    expect(parseCaseSizeMm('40 mm')).toBe(40)
    expect(parseCaseSizeMm('41mm')).toBe(41)
  })

  it('accepte la virgule décimale', () => {
    expect(parseCaseSizeMm('40,5')).toBe(40.5)
  })

  it('gère les nombres déjà numériques', () => {
    expect(parseCaseSizeMm(42)).toBe(42)
  })

  it('renvoie null pour les entrées vides ou non numériques', () => {
    expect(parseCaseSizeMm(null)).toBeNull()
    expect(parseCaseSizeMm('')).toBeNull()
    expect(parseCaseSizeMm('  ')).toBeNull()
    expect(parseCaseSizeMm('large')).toBeNull()
  })
})

describe('normalizeCaseSizeValue', () => {
  it('retire l’unité et conserve la valeur numérique', () => {
    expect(normalizeCaseSizeValue('40 mm')).toBe('40')
    expect(normalizeCaseSizeValue('40,5 mm')).toBe('40.5')
  })

  it('renvoie une chaîne vide pour les valeurs absentes', () => {
    expect(normalizeCaseSizeValue(null)).toBe('')
    expect(normalizeCaseSizeValue(undefined)).toBe('')
    expect(normalizeCaseSizeValue('   ')).toBe('')
  })

  it('garde le texte nettoyé si aucun nombre n’est présent', () => {
    expect(normalizeCaseSizeValue('mm')).toBe('')
    expect(normalizeCaseSizeValue('Grand mm')).toBe('Grand')
  })
})

describe('formatCaseSizeDisplay', () => {
  it('affiche la valeur avec l’unité mm', () => {
    expect(formatCaseSizeDisplay('40')).toBe('40 mm')
    expect(formatCaseSizeDisplay('40 mm')).toBe('40 mm')
    expect(formatCaseSizeDisplay('40,5')).toBe('40.5 mm')
  })

  it('renvoie une chaîne vide pour les valeurs absentes', () => {
    expect(formatCaseSizeDisplay(null)).toBe('')
    expect(formatCaseSizeDisplay('')).toBe('')
  })

  it('renvoie le texte normalisé si non numérique', () => {
    expect(formatCaseSizeDisplay('Grand')).toBe('Grand')
  })
})

describe('compareCaseSizeValues', () => {
  it('trie numériquement quand les deux valeurs sont des nombres', () => {
    expect(compareCaseSizeValues('40', '41')).toBeLessThan(0)
    expect(compareCaseSizeValues('42', '40')).toBeGreaterThan(0)
    expect(compareCaseSizeValues('40', '40')).toBe(0)
  })

  it('classe les valeurs numériques avant les non numériques', () => {
    expect(compareCaseSizeValues('40', 'Grand')).toBe(-1)
    expect(compareCaseSizeValues('Grand', '40')).toBe(1)
  })

  it('compare alphabétiquement deux valeurs non numériques', () => {
    expect(compareCaseSizeValues('Grand', 'Petit')).toBeLessThan(0)
  })

  it('peut trier un tableau de tailles', () => {
    const sorted = ['41', '38', '40,5'].sort(compareCaseSizeValues)
    expect(sorted).toEqual(['38', '40,5', '41'])
  })
})

describe('watchMatchesCaseSize', () => {
  it('correspond toujours sans filtre sélectionné', () => {
    expect(watchMatchesCaseSize({ details: { caseSize: '40' } }, [])).toBe(true)
    expect(watchMatchesCaseSize({ details: { caseSize: '40' } }, undefined)).toBe(true)
  })

  it('correspond quand la taille normalisée est dans la sélection', () => {
    expect(watchMatchesCaseSize({ details: { caseSize: '40 mm' } }, ['40'])).toBe(true)
  })

  it('ne correspond pas quand la taille est absente de la sélection', () => {
    expect(watchMatchesCaseSize({ details: { caseSize: '40' } }, ['41'])).toBe(false)
  })

  it('ne correspond pas si la montre n’a pas de taille', () => {
    expect(watchMatchesCaseSize({ details: {} }, ['40'])).toBe(false)
    expect(watchMatchesCaseSize({}, ['40'])).toBe(false)
  })
})
