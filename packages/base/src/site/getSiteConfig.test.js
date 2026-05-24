import { describe, expect, it } from 'vitest'

import { resolveSiteConfig } from './resolveSiteConfig.js'

describe('resolveSiteConfig', () => {
  it('dérive features.faq depuis faq.enabled et items', () => {
    const withFaq = resolveSiteConfig({
      faq: { enabled: true, items: [{ q: 'Q', a: 'A' }] },
    })
    expect(withFaq.features.faq).toBe(true)

    const emptyItems = resolveSiteConfig({
      faq: { enabled: true, items: [] },
    })
    expect(emptyItems.features.faq).toBe(false)
  })

  it('dérive watchReference depuis watchCatalog.mode resale', () => {
    const resale = resolveSiteConfig({ watchCatalog: { mode: 'resale' } })
    expect(resale.features.watchReference).toBe(true)
    expect(resale.watchCatalog.mode).toBe('resale')

    const retail = resolveSiteConfig({ watchCatalog: { mode: 'retail' } })
    expect(retail.features.watchReference).toBe(false)
  })

  it('active servicesPage seulement si flag et contenu servicesPage', () => {
    const on = resolveSiteConfig({
      features: { servicesPage: true },
      servicesPage: { title: 'Services' },
    })
    expect(on.features.servicesPage).toBe(true)

    const flagOnly = resolveSiteConfig({
      features: { servicesPage: true },
    })
    expect(flagOnly.features.servicesPage).toBe(true)

    const off = resolveSiteConfig({
      features: { servicesPage: true },
      servicesPage: false,
    })
    expect(off.features.servicesPage).toBe(false)
  })

  it('résout checkout.shipping.pickupEnabled et methods', () => {
    const resolved = resolveSiteConfig({
      checkout: {
        shipping: {
          pickupEnabled: false,
          methods: [
            { id: 'h', type: 'home', label: 'Home' },
            { id: 'p', type: 'pickup', label: 'Pickup' },
          ],
        },
      },
    })
    expect(resolved.checkout.shipping.pickupEnabled).toBe(false)
    expect(resolved.checkout.shipping.methods).toHaveLength(1)
  })

  it('conserve watchCatalog.guarantees après résolution', () => {
    const guarantees = {
      heading: 'Nos garanties et services',
      items: [
        { id: 'a', icon: 'payment', title: 'Paiement', text: 'Stripe.' },
        { id: 'b', icon: 'pickup', title: 'Retrait', text: 'Boutique.' },
        { id: 'c', icon: 'guarantee', title: 'Garantie', text: '2 ans.' },
      ],
    }
    const resolved = resolveSiteConfig({
      watchCatalog: { mode: 'retail', guarantees },
    })
    expect(resolved.watchCatalog.guarantees).toEqual(guarantees)
  })
})
