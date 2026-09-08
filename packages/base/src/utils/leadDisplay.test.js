import { describe, expect, it } from 'vitest'

import {
  formatLeadBudget,
  formatLeadHandling,
  formatLeadDate,
  formatLeadDateTime,
  formatLeadPrice,
  formatLeadSlot,
  getLeadSummary,
  getLeadWatchLink,
  getLeadTypePresentation,
  getUnmappedPayloadKeys,
  groupLeadsByDay,
  formatLeadDayLabel,
  matchesLeadSearch,
  organizeAppointmentsByDate,
  LEAD_STATUS_LABELS,
  LEAD_TYPE_LABELS,
  LEAD_TYPE_PRESENTATION,
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

  it('résume une demande atelier via la prestation et la montre', () => {
    expect(
      getLeadSummary({
        type: 'repair',
        payload: { service_type: 'Changement de pile', brand: 'Tissot', model: 'PRX' },
      }),
    ).toBe('Changement de pile — Tissot PRX')
    expect(getLeadSummary({ type: 'repair', payload: { service_type: 'Révision' } })).toBe(
      'Révision',
    )
    expect(getLeadSummary({ type: 'repair', payload: {} })).toBe('—')
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

describe('formatLeadHandling', () => {
  it('traduit les modes de prise en charge', () => {
    expect(formatLeadHandling('dropoff')).toBe('Dépôt en boutique')
    expect(formatLeadHandling('shipping')).toBe('Envoi postal')
    expect(formatLeadHandling('unsure')).toBe('Non décidé')
  })

  it('renvoie la valeur brute pour un mode inconnu et un tiret si absent', () => {
    expect(formatLeadHandling('pigeon')).toBe('pigeon')
    expect(formatLeadHandling(null)).toBe('—')
  })
})

describe('getLeadTypePresentation', () => {
  it('donne libellé, icône et teinte pour un type connu', () => {
    const presentation = getLeadTypePresentation('appointment')
    expect(presentation.label).toBe('RDV')
    expect(presentation.icon).toBe('CalendarClock')
    expect(presentation.chip).toContain('amber')
  })

  it('reste affichable pour un type inconnu', () => {
    const presentation = getLeadTypePresentation('carrier-pigeon')
    expect(presentation.label).toBe('carrier-pigeon')
    expect(presentation.icon).toBe('MessageSquare')
  })

  it('LEAD_TYPE_LABELS dérive de la table de présentation', () => {
    expect(LEAD_TYPE_LABELS.estimation).toBe(LEAD_TYPE_PRESENTATION.estimation.label)
    expect(Object.keys(LEAD_TYPE_LABELS)).toEqual(Object.keys(LEAD_TYPE_PRESENTATION))
  })
})

describe('formatLeadDayLabel / groupLeadsByDay', () => {
  const now = new Date(2026, 8, 8, 10, 0, 0) // mardi 8 septembre 2026

  it("nomme aujourd'hui et hier", () => {
    expect(formatLeadDayLabel(new Date(2026, 8, 8, 23, 30).toISOString(), now)).toBe("Aujourd'hui")
    expect(formatLeadDayLabel(new Date(2026, 8, 7, 8, 0).toISOString(), now)).toBe('Hier')
  })

  it('affiche la date longue au-delà', () => {
    expect(formatLeadDayLabel(new Date(2026, 8, 4, 8, 0).toISOString(), now)).toContain('septembre')
  })

  it('regroupe les messages consécutifs du même jour', () => {
    const leads = [
      { id: 'a', createdAt: new Date(2026, 8, 8, 18, 0).toISOString() },
      { id: 'b', createdAt: new Date(2026, 8, 8, 9, 0).toISOString() },
      { id: 'c', createdAt: new Date(2026, 8, 7, 9, 0).toISOString() },
    ]
    const groups = groupLeadsByDay(leads, now)
    expect(groups).toHaveLength(2)
    expect(groups[0].label).toBe("Aujourd'hui")
    expect(groups[0].leads.map((l) => l.id)).toEqual(['a', 'b'])
    expect(groups[1].label).toBe('Hier')
  })

  it('range un message reçu en soirée dans le jour local, pas la veille UTC', () => {
    // 22 h à Paris = le lendemain 20 h UTC en hiver : `toISOString()` ferait
    // basculer ce message dans le mauvais groupe.
    const evening = new Date(2026, 8, 8, 22, 30)
    expect(formatLeadDayLabel(evening.toISOString(), now)).toBe("Aujourd'hui")
  })

  it('ne casse pas sur une date absente', () => {
    expect(formatLeadDayLabel(null, now)).toBe('Date inconnue')
    expect(groupLeadsByDay([])).toEqual([])
  })
})

describe('matchesLeadSearch', () => {
  const lead = {
    customerName: 'Jérôme Dupont',
    customerEmail: 'jerome@example.com',
    type: 'estimation',
    payload: { brand: 'Rolex', model: 'Submariner', tel: '0612345678' },
  }

  it('accepte tout si la recherche est vide', () => {
    expect(matchesLeadSearch(lead, '')).toBe(true)
    expect(matchesLeadSearch(lead, '   ')).toBe(true)
  })

  it('ignore accents et casse', () => {
    expect(matchesLeadSearch(lead, 'jerome')).toBe(true)
    expect(matchesLeadSearch(lead, 'JÉRÔME')).toBe(true)
  })

  it('cherche dans le contenu du formulaire et le téléphone', () => {
    expect(matchesLeadSearch(lead, 'submariner')).toBe(true)
    expect(matchesLeadSearch(lead, '0612')).toBe(true)
  })

  it('exige que tous les mots soient présents', () => {
    expect(matchesLeadSearch(lead, 'rolex dupont')).toBe(true)
    expect(matchesLeadSearch(lead, 'rolex omega')).toBe(false)
  })
})

describe('organizeAppointmentsByDate', () => {
  const now = new Date(2026, 8, 8, 10, 0, 0)

  const byDate = {
    '2026-09-04': [{ id: 'past', payload: { time_slot: 'morning' } }],
    '2026-09-12': [{ id: 'later', payload: { time_slot: 'morning' } }],
    '2026-09-08': [
      { id: 'today-pm', customerName: 'Zoé', payload: { time_slot: 'afternoon' } },
      { id: 'today-am', customerName: 'Alice', payload: { time_slot: 'morning' } },
    ],
  }

  it('sépare les jours à venir du passé', () => {
    const { upcoming, past } = organizeAppointmentsByDate(byDate, now)
    expect(upcoming.map((d) => d.date)).toEqual(['2026-09-08', '2026-09-12'])
    expect(past.map((d) => d.date)).toEqual(['2026-09-04'])
  })

  it('garde le jour même dans les RDV à venir', () => {
    const { upcoming } = organizeAppointmentsByDate(byDate, now)
    expect(upcoming[0].label).toContain('8 septembre')
  })

  it('trie chaque journée par créneau puis par nom', () => {
    const { upcoming } = organizeAppointmentsByDate(byDate, now)
    expect(upcoming[0].items.map((a) => a.id)).toEqual(['today-am', 'today-pm'])
  })

  it('accepte une entrée vide', () => {
    expect(organizeAppointmentsByDate(null, now)).toEqual({ upcoming: [], past: [] })
  })
})
