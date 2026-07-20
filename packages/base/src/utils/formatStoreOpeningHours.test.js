import { describe, expect, it } from 'vitest'

import { resolveStoreOpeningHours } from './formatStoreOpeningHours.js'

describe('resolveStoreOpeningHours', () => {
  it('retourne les libellés nettoyés et hasHours=true', () => {
    const result = resolveStoreOpeningHours({
      daysLabel: '  Mardi – Samedi  ',
      hoursLabel: ' 10h – 19h ',
    })
    expect(result).toEqual({
      daysLabel: 'Mardi – Samedi',
      hoursLabel: '10h – 19h',
      hasHours: true,
    })
  })

  it('hasHours=true dès qu’un des deux libellés est présent', () => {
    expect(resolveStoreOpeningHours({ daysLabel: 'Lundi' }).hasHours).toBe(true)
    expect(resolveStoreOpeningHours({ hoursLabel: '9h-12h' }).hasHours).toBe(true)
  })

  it('hasHours=false sans horaires exploitables', () => {
    expect(resolveStoreOpeningHours(null)).toEqual({
      daysLabel: '',
      hoursLabel: '',
      hasHours: false,
    })
    expect(resolveStoreOpeningHours({ daysLabel: '   ', hoursLabel: '' }).hasHours).toBe(false)
    expect(resolveStoreOpeningHours(undefined).hasHours).toBe(false)
  })
})
