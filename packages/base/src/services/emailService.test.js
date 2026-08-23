// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  prepareAppointmentFormData,
  prepareRepairFormData,
  sendEmailWithRetry,
} from './emailService.js'

function buildAppointmentForm(fields = {}) {
  const form = document.createElement('form')
  const defaults = {
    name: 'Jean Dupont',
    email: 'jean@example.com',
    tel: '0612345678',
    date: '2026-05-27',
    time_slot: 'morning',
  }
  for (const [name, value] of Object.entries({ ...defaults, ...fields })) {
    const input = document.createElement('input')
    input.name = name
    input.value = value
    form.appendChild(input)
  }
  return form
}

describe('prepareAppointmentFormData', () => {
  it('ajoute type appointment et le contexte montre', () => {
    const form = buildAppointmentForm()
    const watchContext = {
      id: 42,
      name: 'Rolex Submariner',
      price: 12500,
      url: 'http://localhost:5173/watch/42',
    }

    const formData = prepareAppointmentFormData(form, watchContext)

    expect(formData.get('type')).toBe('appointment')
    expect(formData.get('watch_id')).toBe('42')
    expect(formData.get('watch_name')).toBe('Rolex Submariner')
    expect(formData.get('watch_price')).toBe('12500')
    expect(formData.get('watch_url')).toBe('http://localhost:5173/watch/42')
    expect(formData.get('name')).toBe('Jean Dupont')
    expect(formData.get('email')).toBe('jean@example.com')
    expect(formData.get('date')).toBe('2026-05-27')
    expect(formData.get('time_slot')).toBe('morning')
  })

  it('omet watch_price et watch_url si absents', () => {
    const form = buildAppointmentForm()
    const formData = prepareAppointmentFormData(form, { id: 1, name: 'Omega' })

    expect(formData.get('watch_price')).toBeNull()
    expect(formData.get('watch_url')).toBeNull()
  })
})

describe('prepareRepairFormData', () => {
  function buildRepairForm() {
    const form = document.createElement('form')
    const fields = {
      name: 'Dupont',
      email: 'jean@example.com',
      service_type: 'Changement de pile',
      brand: 'Tissot',
      message: 'La montre est arrêtée.',
    }
    for (const [name, value] of Object.entries(fields)) {
      const input = document.createElement('input')
      input.name = name
      input.value = value
      form.appendChild(input)
    }
    return form
  }

  it('ajoute le type repair et la page d’origine', () => {
    const formData = prepareRepairFormData(buildRepairForm(), { source: 'changement-pile-montre' })

    expect(formData.get('type')).toBe('repair')
    expect(formData.get('source')).toBe('changement-pile-montre')
    expect(formData.get('service_type')).toBe('Changement de pile')
    expect(formData.get('message')).toBe('La montre est arrêtée.')
  })

  it('omet la source quand elle n’est pas fournie', () => {
    expect(prepareRepairFormData(buildRepairForm()).get('source')).toBeNull()
  })
})

describe('sendEmailWithRetry', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('envoie le header X-Site-Id sur chaque requête', async () => {
    fetch.mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ success: true }),
    })

    const formData = new FormData()
    formData.append('type', 'appointment')

    await sendEmailWithRetry('/api/send-email', formData, 1)

    expect(fetch).toHaveBeenCalledOnce()
    const [, options] = fetch.mock.calls[0]
    expect(options.headers['X-Site-Id']).toBeTruthy()
    expect(options.headers.Accept).toBe('application/json')
  })
})
