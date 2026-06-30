import { describe, expect, it } from 'vitest'

import {
  formatLeadBudget,
  formatLeadDate,
  formatLeadDateTime,
  formatLeadPrice,
  formatLeadSlot,
  getLeadSummary,
  getLeadWatchLink,
  getUnmappedPayloadKeys,
  LEAD_STATUS_LABELS,
} from './leadDisplay.js'

describe('leadDisplay', () => {
  it('formatLeadSlot traduit morning en Matin', () => {
    expect(formatLeadSlot('morning')).toBe('Matin')
    expect(formatLeadSlot('afternoon')).toBe('Après-midi')
  })

  it('formatLeadPrice formate en euros FR', () => {
    expect(formatLeadPrice('12500')).toBe('12\u202f500\u00a0€')
  })

  it('getLeadWatchLink priorise watch_url puis watchId', () => {
    expect(
      getLeadWatchLink({
        watchId: '42',
        payload: { watch_url: 'https://example.com/watch/42' },
      }),
    ).toBe('https://example.com/watch/42')

    expect(getLeadWatchLink({ watchId: '42', payload: {} })).toBe('/watch/42')
    expect(getLeadWatchLink({ payload: {} })).toBeNull()
  })

  it('LEAD_STATUS_LABELS utilise Non lu pour new', () => {
    expect(LEAD_STATUS_LABELS.new).toBe('Non lu')
  })
})

describe('formatLeadSlot (cas limites)', () => {
  it('renvoie la valeur brute pour un créneau inconnu', () => {
    expect(formatLeadSlot('evening')).toBe('evening')
  })

  it('renvoie un tiret pour une valeur absente', () => {
    expect(formatLeadSlot(null)).toBe('—')
    expect(formatLeadSlot('')).toBe('—')
  })
})

describe('formatLeadPrice (cas limites)', () => {
  it('renvoie un tiret pour une valeur absente', () => {
    expect(formatLeadPrice(null)).toBe('—')
    expect(formatLeadPrice('')).toBe('—')
  })

  it('accepte directement un nombre', () => {
    expect(formatLeadPrice(12500)).toBe('12 500 €')
  })

  it('nettoie les espaces dans les chaînes numériques', () => {
    expect(formatLeadPrice('12 500')).toBe('12 500 €')
  })

  it('renvoie la valeur suivie de € si non numérique', () => {
    expect(formatLeadPrice('abc')).toBe('abc €')
  })
})

describe('getLeadWatchLink (cas limites)', () => {
  it('ignore une watch_url vide ou composée d’espaces', () => {
    expect(getLeadWatchLink({ payload: { watch_url: '   ' } })).toBeNull()
  })

  it('rogne les espaces autour de la watch_url', () => {
    expect(getLeadWatchLink({ payload: { watch_url: '  /montre/x  ' } })).toBe('/montre/x')
  })

  it('renvoie null sans URL ni identifiant', () => {
    expect(getLeadWatchLink({})).toBeNull()
  })
})

describe('formatLeadDate', () => {
  it('formate une date valide en français', () => {
    // 2026-06-29 est un lundi
    const out = formatLeadDate('2026-06-29')
    expect(out).toMatch(/lundi/i)
    expect(out).toMatch(/juin/i)
    expect(out).toMatch(/2026/)
  })

  it('accepte un horodatage ISO complet (tronqué à la date)', () => {
    expect(formatLeadDate('2026-06-29T15:30:00.000Z')).toMatch(/29/)
  })

  it('renvoie un tiret pour une valeur absente', () => {
    expect(formatLeadDate(null)).toBe('—')
    expect(formatLeadDate('')).toBe('—')
  })
})

describe('formatLeadDateTime', () => {
  it('renvoie un tiret pour une valeur absente', () => {
    expect(formatLeadDateTime(null)).toBe('—')
  })

  it('renvoie la valeur brute pour une date invalide', () => {
    expect(formatLeadDateTime('pas-une-date')).toBe('pas-une-date')
  })

  it('formate un horodatage valide en chaîne non vide', () => {
    const out = formatLeadDateTime('2026-06-29T15:30:00.000Z')
    expect(typeof out).toBe('string')
    expect(out).not.toBe('—')
  })
})

describe('getLeadSummary', () => {
  it('résume un rendez-vous via le nom de la montre', () => {
    expect(getLeadSummary({ type: 'appointment', payload: { watch_name: 'Rolex GMT' } })).toBe(
      'Rolex GMT',
    )
    expect(getLeadSummary({ type: 'appointment', payload: {} })).toBe('—')
  })

  it('résume une estimation/recherche via marque + modèle', () => {
    expect(
      getLeadSummary({ type: 'estimation', payload: { brand: 'Omega', model: 'Speedmaster' } }),
    ).toBe('Omega Speedmaster')
    expect(getLeadSummary({ type: 'search', payload: { brand: 'Omega' } })).toBe('Omega')
    expect(getLeadSummary({ type: 'search', payload: {} })).toBe('—')
  })

  it('tronque les messages de contact à 60 caractères', () => {
    const long = 'a'.repeat(80)
    const out = getLeadSummary({ type: 'contact', payload: { message: long } })
    expect(out.endsWith('…')).toBe(true)
    expect(out).toHaveLength(61)
  })

  it('conserve un message de contact court', () => {
    expect(getLeadSummary({ type: 'contact', payload: { message: 'Bonjour' } })).toBe('Bonjour')
  })

  it('renvoie un tiret pour un contact sans message', () => {
    expect(getLeadSummary({ type: 'contact', payload: { message: '   ' } })).toBe('—')
  })

  it('renvoie un tiret pour un type inconnu ou un payload absent', () => {
    expect(getLeadSummary({ type: 'mystery', payload: {} })).toBe('—')
    expect(getLeadSummary({ type: 'appointment' })).toBe('—')
  })
})

describe('getUnmappedPayloadKeys', () => {
  it('renvoie uniquement les clés inconnues non vides', () => {
    const payload = {
      name: 'Jean',
      email: 'jean@example.com',
      custom_field: 'valeur',
      empty: '',
      missing: null,
    }
    expect(getUnmappedPayloadKeys(payload)).toEqual(['custom_field'])
  })

  it('renvoie un tableau vide si tout est connu', () => {
    expect(getUnmappedPayloadKeys({ name: 'Jean', email: 'a@b.c' })).toEqual([])
  })
})

describe('formatLeadBudget', () => {
  it('formate une fourchette min/max', () => {
    expect(formatLeadBudget(1000, 2000)).toContain('à')
  })

  it('gère un minimum seul', () => {
    expect(formatLeadBudget(1000, null)).toMatch(/^À partir de/)
  })

  it('gère un maximum seul', () => {
    expect(formatLeadBudget(null, 2000)).toMatch(/^Jusqu'à/)
  })

  it('renvoie un tiret sans bornes', () => {
    expect(formatLeadBudget(null, null)).toBe('—')
    expect(formatLeadBudget('', '')).toBe('—')
  })
})
