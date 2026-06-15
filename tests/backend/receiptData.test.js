import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'

const require = createRequire(import.meta.url)
const { buildReceiptData, computeVatBreakdown, formatAddressLines } = require('../../backend/orders/receiptData.js')
const { resolveReceiptBranding } = require('../../backend/orders/receiptBranding.js')

function mockSite(overrides = {}) {
  return {
    id: 'place-des-montres',
    config: {
      raw: {
        locale: 'fr',
        brand: { displayName: 'Place des Montres', legalName: 'Place des Montres' },
        legal: {
          companyName: 'Place des Montres',
          address: '24 Place des Halles, 67000 Strasbourg',
          siret: '000 000 000 00000',
        },
        contact: { email: 'service.client@placedesmontres.fr' },
        copy: { copyrightLine: '© 2026 Place des Montres.' },
        theme: { colors: { primary: '#7c6300', textMain: '#000', cream: '#f7f3e8' } },
        checkout: { currency: 'EUR', vatRate: 20 },
        receipt: {
          enabled: true,
          documentTitle: 'Reçu de paiement',
          logoPath: '/brand-logo.jpg',
        },
        ...overrides.raw,
      },
      urls: { production: 'https://www.placedesmontres.fr' },
      checkout: {
        currency: 'EUR',
        legal: { cgvUrl: '/conditions-generales-utilisation' },
      },
      backend: {
        email: { template: { accentColor: '#7c6300' } },
      },
      contact: { email: 'service.client@placedesmontres.fr' },
    },
  }
}

describe('computeVatBreakdown', () => {
  it('computes VAT-inclusive breakdown at 20%', () => {
    const result = computeVatBreakdown(12000, 20)
    expect(result.netCents).toBe(10000)
    expect(result.vatCents).toBe(2000)
    expect(result.vatRate).toBe(20)
  })

  it('returns zero amounts for zero total', () => {
    const result = computeVatBreakdown(0, 20)
    expect(result.netCents).toBe(0)
    expect(result.vatCents).toBe(0)
  })
})

describe('formatAddressLines', () => {
  it('formats a full billing address', () => {
    const lines = formatAddressLines({
      firstName: 'Jean',
      lastName: 'Dupont',
      line1: '1 rue Example',
      postalCode: '67000',
      city: 'Strasbourg',
      country: 'FR',
    })
    expect(lines).toEqual(['Jean Dupont', '1 rue Example', '67000 Strasbourg', 'FR'])
  })
})

describe('resolveReceiptBranding', () => {
  it('derives branding from site config', () => {
    const branding = resolveReceiptBranding(mockSite())
    expect(branding.brandName).toBe('Place des Montres')
    expect(branding.accentColor).toBe('#7c6300')
    expect(branding.vatRate).toBe(20)
    expect(branding.enabled).toBe(true)
    expect(branding.logoPath).toContain('brand-logo.jpg')
  })

  it('respects receipt.enabled = false', () => {
    const branding = resolveReceiptBranding(
      mockSite({ raw: { receipt: { enabled: false } } }),
    )
    expect(branding.enabled).toBe(false)
  })
})

describe('buildReceiptData', () => {
  it('maps order, lines, shipping and discount into a receipt DTO', () => {
    const site = mockSite()
    const order = {
      id: 'order-abc',
      status: 'paid',
      currency: 'EUR',
      customer_email: 'client@example.com',
      customer_phone: '+33600000000',
      billing_address: {
        firstName: 'Marie',
        lastName: 'Martin',
        line1: '2 avenue Test',
        postalCode: '75001',
        city: 'Paris',
        country: 'FR',
      },
      shipping_address: {
        firstName: 'Marie',
        lastName: 'Martin',
        line1: '2 avenue Test',
        postalCode: '75001',
        city: 'Paris',
        country: 'FR',
      },
      subtotal_cents: 500000,
      shipping_cents: 0,
      discount_cents: 5000,
      total_cents: 495000,
      paid_at: '2026-06-15T10:30:00.000Z',
      stripe_payment_intent_id: 'pi_test_1234567890',
    }
    const lines = [
      {
        name: 'Omega Seamaster',
        reference: 'REF-001',
        quantity: 1,
        unit_price_cents: 500000,
        image_url: 'https://example.com/watch.jpg',
      },
    ]
    const receipt = buildReceiptData(site, order, lines, {
      shipping: {
        method_label: 'Colissimo suivi',
        method_type: 'home',
        fee_cents: 0,
      },
      discount: {
        promo_code: 'BIENVENUE',
        discount_type: 'fixed',
        discount_cents: 5000,
      },
    })

    expect(receipt.order.id).toBe('order-abc')
    expect(receipt.lines).toHaveLength(1)
    expect(receipt.lines[0].lineTotalCents).toBe(500000)
    expect(receipt.totals.totalCents).toBe(495000)
    expect(receipt.totals.vatCents).toBeGreaterThan(0)
    expect(receipt.discount?.code).toBe('BIENVENUE')
    expect(receipt.shipping?.methodLabel).toBe('Colissimo suivi')
    expect(receipt.showHeroImage).toBe(true)
    expect(receipt.formatMoney(495000)).toMatch(/4[\s\u00a0]?950/)
  })
})
