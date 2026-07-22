import { describe, expect, it } from 'vitest'

import { parseAddressComponents } from './parseGoogleAddressComponents.js'

function component(types, long_name, short_name = long_name) {
  return { types: Array.isArray(types) ? types : [types], long_name, short_name }
}

describe('parseAddressComponents', () => {
  it('mappe une adresse complète vers le schéma checkout', () => {
    const components = [
      component('street_number', '12'),
      component('route', 'Rue de la Paix'),
      component('postal_code', '75002'),
      component('locality', 'Paris'),
      component('country', 'France', 'fr'),
    ]

    expect(parseAddressComponents(components)).toEqual({
      line1: '12 Rue de la Paix',
      line2: '',
      postalCode: '75002',
      city: 'Paris',
      country: 'FR',
    })
  })

  it('replie sur formattedAddress sans composants', () => {
    const result = parseAddressComponents([], { formattedAddress: '1 rue Test, Lyon' })
    expect(result.line1).toBe('1 rue Test, Lyon')
    expect(result.city).toBe('')
    expect(parseAddressComponents(null, {}).line1).toBe('')
  })

  it('replie sur formattedAddress sans numéro ni rue', () => {
    const components = [component('locality', 'Paris')]
    const result = parseAddressComponents(components, { formattedAddress: 'Paris, France' })
    expect(result.line1).toBe('Paris, France')
    expect(result.city).toBe('Paris')
  })

  it('assemble line2 depuis subpremise, floor et premise', () => {
    const components = [
      component('route', 'Avenue Foch'),
      component('subpremise', 'Apt 4B'),
      component('floor', '3e étage'),
      component('premise', 'Bâtiment C'),
    ]
    expect(parseAddressComponents(components).line2).toBe('Apt 4B, 3e étage, Bâtiment C')
  })

  it('utilise postal_town puis administrative_area_level_2 comme ville de repli', () => {
    expect(
      parseAddressComponents([component('postal_town', 'London')]).city,
    ).toBe('London')
    expect(
      parseAddressComponents([component('administrative_area_level_2', 'Rhône')]).city,
    ).toBe('Rhône')
  })

  it('supporte le nouveau format Places (longText/shortText)', () => {
    const components = [
      { types: ['route'], longText: 'Rue Neuve' },
      { types: ['country'], shortText: 'be' },
    ]
    const result = parseAddressComponents(components)
    expect(result.line1).toBe('Rue Neuve')
    expect(result.country).toBe('BE')
  })
})
