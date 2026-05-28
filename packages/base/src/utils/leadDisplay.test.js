import { describe, expect, it } from 'vitest'

import {
  formatLeadSlot,
  formatLeadPrice,
  getLeadWatchLink,
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
