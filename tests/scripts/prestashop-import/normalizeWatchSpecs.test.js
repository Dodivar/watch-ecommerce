import { describe, expect, it } from 'vitest'

import {
  normalizeCaseSizeMm,
  normalizeConditionSlug,
  normalizeFunctionSlugs,
  normalizeMovementType,
  parseWaterResistanceM,
} from '../../../scripts/prestashop-import/normalizeWatchSpecs.js'

describe('normalizeMovementType', () => {
  it('mappe les libellés courants PrestaShop', () => {
    expect(normalizeMovementType('Automatique').movementType).toBe('automatic')
    expect(normalizeMovementType('Manuel').movementType).toBe('manual')
    expect(normalizeMovementType('Quartz').movementType).toBe('quartz')
    expect(normalizeMovementType('Solaire').movementType).toBe('solar')
    expect(normalizeMovementType('Cinétique').movementType).toBe('kinetic')
    expect(normalizeMovementType('Connectée').movementType).toBe('smart')
  })

  it('extrait un calibre si présent', () => {
    const result = normalizeMovementType('Automatique calibre ETA 2824-2')
    expect(result.movementType).toBe('automatic')
    expect(result.movementCaliber).toBe('ETA 2824-2')
  })

  it('infère manuel pour "Mécanique" sans quartz', () => {
    expect(normalizeMovementType('Mécanique').movementType).toBe('manual')
  })
})

describe('parseWaterResistanceM', () => {
  it('convertit mètres, bar et ATM', () => {
    expect(parseWaterResistanceM('300 m').meters).toBe(300)
    expect(parseWaterResistanceM('5 bar').meters).toBe(50)
    expect(parseWaterResistanceM('10 ATM').meters).toBe(100)
    expect(parseWaterResistanceM('100 mètres').meters).toBe(100)
    expect(parseWaterResistanceM('étanche 30m').meters).toBe(30)
  })
})

describe('normalizeCaseSizeMm', () => {
  it('parse les diamètres usuels', () => {
    expect(normalizeCaseSizeMm('41 mm').mm).toBe(41)
    expect(normalizeCaseSizeMm('42').mm).toBe(42)
    expect(normalizeCaseSizeMm('39.5').mm).toBe(39.5)
  })

  it('rejette les plages non parsables', () => {
    expect(normalizeCaseSizeMm('38-40 mm').ok).toBe(false)
  })
})

describe('normalizeFunctionSlugs', () => {
  it('déduit plusieurs fonctions depuis une chaîne PrestaShop', () => {
    const result = normalizeFunctionSlugs('Date, Chronographe')
    expect(result.slugs).toEqual(['date', 'chronograph'])
  })

  it('gère les séparateurs variés', () => {
    const result = normalizeFunctionSlugs('Chronographe et tachymètre')
    expect(result.slugs).toEqual(['chronograph', 'tachymeter'])
  })
})

describe('normalizeConditionSlug', () => {
  it('mappe les états resale courants', () => {
    expect(normalizeConditionSlug('Neuf').slug).toBe('neuf')
    expect(normalizeConditionSlug('Très bon').slug).toBe('tres_bon')
    expect(normalizeConditionSlug('Excellent').slug).toBe('tres_bon')
  })
})
