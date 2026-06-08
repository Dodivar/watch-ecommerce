import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'

const require = createRequire(import.meta.url)
const { validateAppointmentSubmission } = require('../../backend/utils/appointmentSlots.js')

/** Lundi 25 mai 2026, 10h00 locale */
const mondayMorning = new Date(2026, 4, 25, 10, 0, 0)
/** Lundi 25 mai 2026, 14h00 locale */
const mondayAfternoon = new Date(2026, 4, 25, 14, 0, 0)
/** Dimanche 24 mai 2026, 10h00 locale */
const sundayMorning = new Date(2026, 4, 24, 10, 0, 0)

describe('validateAppointmentSubmission', () => {
  it('accepte une date seule sans créneau', () => {
    const result = validateAppointmentSubmission({ date: '2026-05-27' }, mondayMorning)
    expect(result).toEqual({ valid: true })
  })

  it('accepte un créneau matin un jour ouvré futur', () => {
    const result = validateAppointmentSubmission(
      { date: '2026-05-27', time_slot: 'morning' },
      mondayMorning,
    )
    expect(result).toEqual({ valid: true })
  })

  it('refuse le dimanche', () => {
    const result = validateAppointmentSubmission(
      { date: '2026-05-24', time_slot: 'morning' },
      sundayMorning,
    )
    expect(result.valid).toBe(false)
    expect(result.message).toBe('Date non disponible.')
  })

  it('refuse le créneau matin le jour même avant midi (après-midi seul disponible)', () => {
    const result = validateAppointmentSubmission(
      { date: '2026-05-25', time_slot: 'morning' },
      mondayMorning,
    )
    expect(result.valid).toBe(false)
    expect(result.message).toBe('Créneau non disponible pour cette date.')
  })

  it('refuse toute date le jour même après midi', () => {
    const result = validateAppointmentSubmission(
      { date: '2026-05-25', time_slot: 'afternoon' },
      mondayAfternoon,
    )
    expect(result.valid).toBe(false)
    expect(result.message).toBe('Date non disponible.')
  })

  it('accepte le créneau après-midi le jour même avant midi', () => {
    const result = validateAppointmentSubmission(
      { date: '2026-05-25', time_slot: 'afternoon' },
      mondayMorning,
    )
    expect(result).toEqual({ valid: true })
  })

  it('refuse un créneau invalide', () => {
    const result = validateAppointmentSubmission(
      { date: '2026-05-27', time_slot: 'evening' },
      mondayMorning,
    )
    expect(result.valid).toBe(false)
    expect(result.message).toBe('Créneau invalide.')
  })

  it('refuse une date antérieure au minimum autorisé', () => {
    const result = validateAppointmentSubmission(
      { date: '2026-05-24', time_slot: 'morning' },
      mondayMorning,
    )
    expect(result.valid).toBe(false)
    expect(result.message).toBe('Date non disponible.')
  })
})
