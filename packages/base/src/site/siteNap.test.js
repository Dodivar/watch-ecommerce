import { describe, expect, it } from 'vitest'

import { resolveSiteNap } from './siteNap.js'

describe('resolveSiteNap', () => {
  it('priorise directionsAddress pour l’adresse schema', () => {
    const nap = resolveSiteNap({
      brand: { legalName: 'Place des Montres' },
      contact: {
        email: 'service.client@placedesmontres.fr',
        phoneE164: '+33388224040',
        footerAddressHtml: '24 Place des Halles<br />67000 Strasbourg, France',
      },
      legal: { address: 'Centre commercial Place des Halles 67000 Strasbourg' },
      storeMap: {
        directionsAddress: '24 Place des Halles, Centre Commercial, 67000 Strasbourg, France',
      },
    })

    expect(nap.name).toBe('Place des Montres')
    expect(nap.streetAddress).toBe(
      '24 Place des Halles, Centre Commercial, 67000 Strasbourg, France',
    )
    expect(nap.telephone).toBe('+33388224040')
    expect(nap.email).toBe('service.client@placedesmontres.fr')
  })
})
