import { nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  formatAppointmentDateLabel,
  getAvailableAppointmentSlots,
  getMinAppointmentDate,
  isAppointmentDateEligible,
  parseDateISO,
  useRetailAppointmentSlots,
} from './useRetailAppointmentSlots.js'

// Repères : 2026-07-20 est un lundi, 2026-07-18 un samedi, 2026-07-19 un dimanche.
const MONDAY_MORNING = new Date(2026, 6, 20, 10, 0)
const MONDAY_AFTERNOON = new Date(2026, 6, 20, 14, 0)
const SATURDAY_AFTERNOON = new Date(2026, 6, 18, 15, 0)
const SUNDAY = new Date(2026, 6, 19, 9, 0)

function iso(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`
}

describe('getMinAppointmentDate', () => {
  it('jour ouvré avant midi : rendez-vous possible le jour même', () => {
    expect(iso(getMinAppointmentDate(MONDAY_MORNING))).toBe('2026-07-20')
  })

  it('jour ouvré après midi : report au jour ouvré suivant', () => {
    expect(iso(getMinAppointmentDate(MONDAY_AFTERNOON))).toBe('2026-07-21')
  })

  it('samedi après midi : report au lundi (dimanche exclu)', () => {
    expect(iso(getMinAppointmentDate(SATURDAY_AFTERNOON))).toBe('2026-07-20')
  })

  it('dimanche : report au lundi', () => {
    expect(iso(getMinAppointmentDate(SUNDAY))).toBe('2026-07-20')
  })
})

describe('isAppointmentDateEligible', () => {
  it('accepte le jour même avant midi et les jours ouvrés futurs', () => {
    expect(isAppointmentDateEligible('2026-07-20', MONDAY_MORNING)).toBe(true)
    expect(isAppointmentDateEligible('2026-07-24', MONDAY_MORNING)).toBe(true)
  })

  it('refuse le jour même après midi', () => {
    expect(isAppointmentDateEligible('2026-07-20', MONDAY_AFTERNOON)).toBe(false)
    expect(isAppointmentDateEligible('2026-07-21', MONDAY_AFTERNOON)).toBe(true)
  })

  it('refuse les dimanches et les dates passées', () => {
    expect(isAppointmentDateEligible('2026-07-26', MONDAY_MORNING)).toBe(false)
    expect(isAppointmentDateEligible('2026-07-13', MONDAY_MORNING)).toBe(false)
  })

  it('refuse les valeurs vides ou invalides', () => {
    expect(isAppointmentDateEligible('', MONDAY_MORNING)).toBe(false)
    expect(isAppointmentDateEligible('  ', MONDAY_MORNING)).toBe(false)
    expect(isAppointmentDateEligible(null, MONDAY_MORNING)).toBe(false)
    expect(isAppointmentDateEligible('pas-une-date', MONDAY_MORNING)).toBe(false)
  })
})

describe('getAvailableAppointmentSlots', () => {
  it('jour même avant midi : uniquement l’après-midi', () => {
    expect(getAvailableAppointmentSlots('2026-07-20', MONDAY_MORNING)).toEqual(['afternoon'])
  })

  it('jour même après midi : aucun créneau', () => {
    expect(getAvailableAppointmentSlots('2026-07-20', MONDAY_AFTERNOON)).toEqual([])
  })

  it('jour ouvré futur : matin et après-midi', () => {
    expect(getAvailableAppointmentSlots('2026-07-21', MONDAY_MORNING)).toEqual([
      'morning',
      'afternoon',
    ])
  })

  it('dimanche ou date invalide : aucun créneau', () => {
    expect(getAvailableAppointmentSlots('2026-07-26', MONDAY_MORNING)).toEqual([])
    expect(getAvailableAppointmentSlots('', MONDAY_MORNING)).toEqual([])
    expect(getAvailableAppointmentSlots('n/a', MONDAY_MORNING)).toEqual([])
  })
})

describe('parseDateISO / formatAppointmentDateLabel', () => {
  it('parse une date ISO en date locale', () => {
    const date = parseDateISO('2026-07-20')
    expect(date.getFullYear()).toBe(2026)
    expect(date.getMonth()).toBe(6)
    expect(date.getDate()).toBe(20)
  })

  it('formate la date en français', () => {
    expect(formatAppointmentDateLabel('2026-07-20')).toBe('lundi 20 juillet 2026')
  })

  it('retourne la chaîne brute si la date est invalide', () => {
    expect(formatAppointmentDateLabel('n/a')).toBe('n/a')
  })
})

describe('useRetailAppointmentSlots (composable)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(MONDAY_MORNING)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('expose minDate et les options de créneaux libellées', () => {
    const slots = useRetailAppointmentSlots('2026-07-21')

    expect(slots.minDate.value).toBe('2026-07-20')
    expect(slots.slotOptions.value).toEqual([
      { value: 'morning', label: 'Matin' },
      { value: 'afternoon', label: 'Après-midi' },
    ])
  })

  it('ramène une date inéligible (dimanche) à la date minimale', async () => {
    const slots = useRetailAppointmentSlots('2026-07-21')

    slots.selectedDate.value = '2026-07-26'
    await nextTick()

    expect(slots.selectedDate.value).toBe('2026-07-20')
  })
})
