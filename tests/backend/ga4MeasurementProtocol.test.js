import { createRequire } from 'node:module'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const require = createRequire(import.meta.url)
const {
  buildPurchasePayload,
  sendPurchase,
} = require('../../backend/analytics/ga4MeasurementProtocol.js')

const LINES = [
  {
    watch_id: 'watch-1',
    name: 'Rolex Submariner Date',
    reference: '16610',
    unit_price_cents: 869000,
    quantity: 1,
  },
  {
    watch_id: 'watch-2',
    name: 'Omega Speedmaster',
    reference: null,
    unit_price_cents: 450000,
    quantity: 2,
  },
]

function mockSite(analytics = { ga4MeasurementId: 'G-TEST123', ga4ApiSecret: 'secret-abc' }) {
  return { id: 'place-des-montres', secrets: { analytics } }
}

function purchaseArgs(overrides = {}) {
  return {
    site: mockSite(),
    orderId: 'order-42',
    currency: 'EUR',
    totalCents: 1774900,
    shippingCents: 5900,
    lines: LINES,
    clientId: '123.456',
    sessionId: '1700000000',
    ...overrides,
  }
}

describe('buildPurchasePayload', () => {
  it('convertit les centimes et reprend l’identifiant de commande comme transaction_id', () => {
    const payload = buildPurchasePayload(purchaseArgs())

    expect(payload.client_id).toBe('123.456')
    expect(payload.events).toHaveLength(1)

    const { name, params } = payload.events[0]
    expect(name).toBe('purchase')
    expect(params.transaction_id).toBe('order-42')
    expect(params.value).toBe(17749)
    expect(params.shipping).toBe(59)
    expect(params.currency).toBe('EUR')
    expect(params.session_id).toBe('1700000000')
    expect(params.engagement_time_msec).toBe(1)
  })

  it('mappe les lignes en items GA4, référence en priorité', () => {
    const { items } = buildPurchasePayload(purchaseArgs()).events[0].params

    expect(items).toEqual([
      { item_id: '16610', item_name: 'Rolex Submariner Date', price: 8690, quantity: 1, index: 0 },
      { item_id: 'watch-2', item_name: 'Omega Speedmaster', price: 4500, quantity: 2, index: 1 },
    ])
  })

  it('omet session_id quand il est absent', () => {
    const { params } = buildPurchasePayload(purchaseArgs({ sessionId: null })).events[0]
    expect(params).not.toHaveProperty('session_id')
  })

  it('normalise la devise en majuscules et retombe sur EUR', () => {
    expect(buildPurchasePayload(purchaseArgs({ currency: 'eur' })).events[0].params.currency).toBe('EUR')
    expect(buildPurchasePayload(purchaseArgs({ currency: null })).events[0].params.currency).toBe('EUR')
  })
})

describe('sendPurchase', () => {
  /** @type {import('vitest').Mock} */
  let fetchMock

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 204 })
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('appelle le Measurement Protocol avec les identifiants du site', async () => {
    await expect(sendPurchase(purchaseArgs())).resolves.toEqual({ sent: true })

    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toContain('https://www.google-analytics.com/mp/collect?')
    expect(url).toContain('measurement_id=G-TEST123')
    expect(url).toContain('api_secret=secret-abc')
    expect(options.method).toBe('POST')
    expect(JSON.parse(options.body).events[0].name).toBe('purchase')
  })

  it('n’envoie rien sans client_id : le visiteur n’a pas consenti', async () => {
    await expect(sendPurchase(purchaseArgs({ clientId: null }))).resolves.toEqual({
      sent: false,
      reason: 'no_client_id',
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('n’envoie rien quand le site n’a pas de secret Measurement Protocol', async () => {
    const site = mockSite({ ga4MeasurementId: 'G-TEST123', ga4ApiSecret: null })

    await expect(sendPurchase(purchaseArgs({ site }))).resolves.toEqual({
      sent: false,
      reason: 'not_configured',
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('n’envoie rien sans identifiant de commande', async () => {
    await expect(sendPurchase(purchaseArgs({ orderId: '' }))).resolves.toEqual({
      sent: false,
      reason: 'no_order_id',
    })
  })

  it('signale une réponse HTTP en erreur sans lever', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 401 })

    await expect(sendPurchase(purchaseArgs())).resolves.toEqual({ sent: false, reason: 'http_401' })
  })

  it('avale une panne réseau : le webhook Stripe ne doit jamais échouer pour de la mesure', async () => {
    fetchMock.mockRejectedValue(new Error('ECONNRESET'))

    await expect(sendPurchase(purchaseArgs())).resolves.toEqual({
      sent: false,
      reason: 'network_error',
    })
  })

  it('vise l’endpoint /debug quand on le demande', async () => {
    await sendPurchase(purchaseArgs({ debug: true }))
    expect(fetchMock.mock.calls[0][0]).toContain('/mp/collect/debug?')
  })
})
