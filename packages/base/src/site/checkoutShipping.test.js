import { describe, expect, it } from 'vitest'

import {
  isCheckoutPickupEnabled,
  resolveCheckoutShipping,
  resolveCheckoutShippingMethods,
} from './checkoutShipping.js'

describe('checkoutShipping', () => {
  it('dérive pickupEnabled depuis les methods si non explicite', () => {
    const checkout = {
      shipping: {
        methods: [{ id: 'pickup', type: 'pickup', label: 'Retrait' }],
      },
    }
    expect(isCheckoutPickupEnabled(checkout)).toBe(true)
  })

  it('respecte pickupEnabled explicite à false', () => {
    const checkout = {
      shipping: {
        pickupEnabled: false,
        methods: [{ id: 'pickup', type: 'pickup', label: 'Retrait' }],
      },
    }
    expect(isCheckoutPickupEnabled(checkout)).toBe(false)
    const resolved = resolveCheckoutShipping(checkout)
    expect(resolved.methods.every((m) => m.type !== 'pickup')).toBe(true)
  })

  it('filtre les methods pickup quand retrait désactivé', () => {
    const checkout = {
      shipping: {
        pickupEnabled: false,
        methods: [
          { id: 'home', type: 'home', label: 'Domicile' },
          { id: 'pickup', type: 'pickup', label: 'Retrait' },
        ],
      },
    }
    expect(resolveCheckoutShippingMethods(checkout)).toHaveLength(1)
    expect(resolveCheckoutShippingMethods(checkout)[0].type).toBe('home')
  })
})
