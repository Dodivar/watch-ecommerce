import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  applyOrderPromo,
  cancelOrder,
  createOrder,
  createOrderPayment,
  downloadOrderReceipt,
  fetchOrder,
  removeOrderPromo,
  updateOrderCustomer,
  updateOrderShipping,
  verifyOrder,
} from './orderService.js'

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

function stubFetch(response) {
  const fetchMock = vi.fn().mockResolvedValue(response)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('createOrder', () => {
  it('poste les lignes du panier avec l’en-tête X-Site-Id', async () => {
    const fetchMock = stubFetch(jsonResponse({ order: { id: 'o1' } }))
    const payload = { lines: [{ watchId: 'w1', quantity: 2 }] }

    const data = await createOrder(payload)

    expect(data.order.id).toBe('o1')
    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe('http://localhost:3000/api/orders')
    expect(options.method).toBe('POST')
    expect(options.headers['X-Site-Id']).toBe('sauvage-watches')
    expect(options.headers.Authorization).toBeUndefined()
    expect(JSON.parse(options.body)).toEqual(payload)
  })

  it('remonte l’erreur backend', async () => {
    stubFetch(jsonResponse({ error: 'Montre indisponible' }, 409))
    await expect(createOrder({ lines: [] })).rejects.toThrow('Montre indisponible')
  })

  it('affiche un message dédié en cas de rate limit (429)', async () => {
    stubFetch(jsonResponse({}, 429))
    await expect(createOrder({ lines: [] })).rejects.toThrow(
      'Trop de requêtes. Patientez quelques instants avant de réessayer.',
    )
  })

  it('replie sur "Erreur serveur" sans corps JSON exploitable', async () => {
    stubFetch(new Response('', { status: 500 }))
    await expect(createOrder({ lines: [] })).rejects.toThrow('Erreur serveur')
  })

  it('expose un corps texte brut comme message d’erreur', async () => {
    stubFetch(new Response('Service indisponible', { status: 503 }))
    await expect(createOrder({ lines: [] })).rejects.toThrow('Service indisponible')
  })
})

describe('fetchOrder / updateOrderCustomer', () => {
  it('transmet le jeton d’accès en Authorization Bearer', async () => {
    const fetchMock = stubFetch(jsonResponse({ order: { id: 'o1' } }))

    await fetchOrder('o1', 'tok-123')

    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe('http://localhost:3000/api/orders/o1')
    expect(options.headers.Authorization).toBe('Bearer tok-123')
  })

  it('PATCH les coordonnées client', async () => {
    const fetchMock = stubFetch(jsonResponse({ ok: true }))
    const body = { email: 'client@example.com' }

    await updateOrderCustomer('o1', 'tok-123', body)

    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe('http://localhost:3000/api/orders/o1/customer')
    expect(options.method).toBe('PATCH')
    expect(JSON.parse(options.body)).toEqual(body)
  })

  it('PATCH le mode de livraison', async () => {
    const fetchMock = stubFetch(jsonResponse({ ok: true }))
    const body = { methodId: 'pickup' }

    await updateOrderShipping('o1', 'tok-123', body)

    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe('http://localhost:3000/api/orders/o1/shipping')
    expect(options.method).toBe('PATCH')
    expect(JSON.parse(options.body)).toEqual(body)
  })
})

describe('codes promo', () => {
  it('applyOrderPromo poste le code saisi', async () => {
    const fetchMock = stubFetch(jsonResponse({ ok: true }))

    await applyOrderPromo('o1', 'tok', 'BIENVENUE10')

    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe('http://localhost:3000/api/orders/o1/promo')
    expect(JSON.parse(options.body)).toEqual({ code: 'BIENVENUE10' })
  })

  it('removeOrderPromo poste remove:true', async () => {
    const fetchMock = stubFetch(jsonResponse({ ok: true }))

    await removeOrderPromo('o1', 'tok')

    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ remove: true })
  })
})

describe('paiement, annulation et vérification', () => {
  it('createOrderPayment poste sur /pay', async () => {
    const fetchMock = stubFetch(jsonResponse({ clientSecret: 'cs_1' }))

    const data = await createOrderPayment('o1', 'tok')

    expect(data.clientSecret).toBe('cs_1')
    expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:3000/api/orders/o1/pay')
  })

  it('cancelOrder poste sur /cancel', async () => {
    const fetchMock = stubFetch(jsonResponse({ ok: true }))

    await cancelOrder('o1', 'tok')

    expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:3000/api/orders/o1/cancel')
  })

  it('verifyOrder passe le jeton en query string', async () => {
    const fetchMock = stubFetch(jsonResponse({ valid: true }))

    const data = await verifyOrder('o1', 'tok-123')

    expect(data.valid).toBe(true)
    expect(fetchMock.mock.calls[0][0]).toBe(
      'http://localhost:3000/api/orders/o1/verify?token=tok-123',
    )
  })

  it('downloadOrderReceipt remonte l’erreur backend sans télécharger', async () => {
    stubFetch(jsonResponse({ error: 'Commande non payée' }, 403))

    await expect(downloadOrderReceipt('o1', 'tok-123')).rejects.toThrow('Commande non payée')
  })
})
