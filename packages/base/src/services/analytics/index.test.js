// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest'

const consent = vi.hoisted(() => ({ analytics: false, marketing: false }))
const loaders = vi.hoisted(() => ({
  ensureGoogleAnalytics: vi.fn(),
  ensureMetaPixel: vi.fn(),
}))

vi.mock('@/config.js', () => ({
  GA_MEASUREMENT_ID: 'G-TEST123',
  GOOGLE_ADS_ID: 'AW-999999',
  GOOGLE_ADS_PURCHASE_LABEL: 'AbCdEf_gh12',
  META_PIXEL_ID: '1234567890',
}))

vi.mock('@/services/cookieConsent', () => ({
  isAnalyticsAllowed: () => consent.analytics,
  isMarketingAllowed: () => consent.marketing,
}))

vi.mock('@/services/googleAnalytics', () => ({
  ensureGoogleAnalytics: loaders.ensureGoogleAnalytics,
}))

vi.mock('@/services/metaPixel', async (importOriginal) => ({
  ...(await importOriginal()),
  ensureMetaPixel: loaders.ensureMetaPixel,
}))

import {
  applyConsent,
  getGaIdentifiers,
  initAnalytics,
  trackAddPaymentInfo,
  trackAddToCart,
  trackBeginCheckout,
  trackPageView,
  trackPurchase,
  trackViewCart,
  trackViewItem,
} from './index.js'

const WATCH = {
  id: 'watch-uuid',
  name: 'Rolex Submariner Date',
  brand: 'Rolex',
  model: 'Submariner',
  reference: '16610',
  price: 8690,
}

const CART = [{ watchId: 'watch-uuid', name: 'Rolex Submariner Date', reference: '16610', brand: 'Rolex', price: 8690, quantity: 1 }]

const ORDER = {
  orderId: 'order-42',
  totalCents: 874900,
  shippingCents: 5900,
  lines: [{ watch_id: 'watch-uuid', name: 'Rolex Submariner Date', reference: '16610', unit_price_cents: 869000, quantity: 1 }],
}

/** Événements GA4 réellement envoyés (les commandes `config` / `consent` sont écartées). */
function gtagEvents() {
  return window.gtag.mock.calls.filter((call) => call[0] === 'event')
}

function eventNamed(name) {
  return gtagEvents().find((call) => call[1] === name)
}

beforeEach(() => {
  consent.analytics = false
  consent.marketing = false
  loaders.ensureGoogleAnalytics.mockClear()
  loaders.ensureMetaPixel.mockClear()
  sessionStorage.clear()
  window.dataLayer = []
  window.gtag = vi.fn()
  window.fbq = vi.fn()
})

describe('consentement', () => {
  it('sans choix : aucun script chargé, seuls les signaux Consent Mode partent', () => {
    initAnalytics()

    expect(loaders.ensureGoogleAnalytics).not.toHaveBeenCalled()
    expect(loaders.ensureMetaPixel).not.toHaveBeenCalled()

    const consentCalls = window.gtag.mock.calls.filter((call) => call[0] === 'consent')
    expect(consentCalls[0][1]).toBe('default')
    expect(consentCalls[0][2]).toMatchObject({
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied',
    })
  })

  it('mesure d’audience seule : gtag.js chargé sans identifiant Ads, pas de pixel Meta', () => {
    applyConsent({ analytics: true, marketing: false })

    expect(loaders.ensureGoogleAnalytics).toHaveBeenCalledWith('G-TEST123', '')
    expect(loaders.ensureMetaPixel).not.toHaveBeenCalled()

    const update = window.gtag.mock.calls.find((call) => call[1] === 'update')
    expect(update[2]).toMatchObject({ analytics_storage: 'granted', ad_storage: 'denied' })
  })

  it('publicité seule : gtag.js chargé pour Ads et pixel Meta initialisé', () => {
    applyConsent({ analytics: false, marketing: true })

    expect(loaders.ensureGoogleAnalytics).toHaveBeenCalledWith('G-TEST123', 'AW-999999')
    expect(loaders.ensureMetaPixel).toHaveBeenCalledWith('1234567890')

    const update = window.gtag.mock.calls.find((call) => call[1] === 'update')
    expect(update[2]).toMatchObject({ analytics_storage: 'denied', ad_personalization: 'granted' })
  })
})

describe('événements du tunnel sans consentement', () => {
  it('n’envoient rien, ni à GA4 ni à Meta', () => {
    trackViewItem(WATCH)
    trackAddToCart(CART[0])
    trackViewCart(CART, 8690)
    trackBeginCheckout(CART, 8690)
    trackAddPaymentInfo({ lines: ORDER.lines, totalCents: ORDER.totalCents })
    trackPurchase(ORDER)
    trackPageView('/collection')

    expect(gtagEvents()).toHaveLength(0)
    expect(window.fbq).not.toHaveBeenCalled()
    expect(window.gtag.mock.calls.filter((call) => call[0] === 'config')).toHaveLength(0)
  })
})

describe('mesure d’audience accordée', () => {
  beforeEach(() => {
    consent.analytics = true
  })

  it('add_to_cart porte la marque et le prix en euros', () => {
    trackAddToCart(CART[0])

    const [, , params] = eventNamed('add_to_cart')
    expect(params.currency).toBe('EUR')
    expect(params.value).toBe(8690)
    expect(params.items[0]).toMatchObject({ item_id: '16610', item_brand: 'Rolex', quantity: 1 })
    expect(window.fbq).not.toHaveBeenCalled()
  })

  it('begin_checkout reprend le total du panier', () => {
    trackBeginCheckout(CART, 8690)
    expect(eventNamed('begin_checkout')[2].value).toBe(8690)
  })

  it('view_cart n’est pas envoyé pour un panier vide', () => {
    trackViewCart([], 0)
    expect(eventNamed('view_cart')).toBeUndefined()
  })

  it('add_payment_info convertit les centimes de la commande', () => {
    trackAddPaymentInfo({ lines: ORDER.lines, totalCents: ORDER.totalCents })
    expect(eventNamed('add_payment_info')[2].value).toBe(8749)
  })

  it('purchase porte le transaction_id, la valeur et les frais de port en euros', () => {
    trackPurchase(ORDER)

    const params = eventNamed('purchase')[2]
    expect(params.transaction_id).toBe('order-42')
    expect(params.value).toBe(8749)
    expect(params.shipping).toBe(59)
    expect(params.items[0].price).toBe(8690)
  })

  it('la page vue passe par une commande config sur l’identifiant GA4', () => {
    trackPageView('/en/collection')
    expect(window.gtag).toHaveBeenCalledWith('config', 'G-TEST123', { page_path: '/en/collection' })
  })
})

describe('publicité accordée', () => {
  beforeEach(() => {
    consent.marketing = true
  })

  it('AddToCart part vers Meta, sans événement GA4', () => {
    trackAddToCart(CART[0])

    expect(window.fbq).toHaveBeenCalledWith(
      'track',
      'AddToCart',
      expect.objectContaining({ content_ids: ['16610'], value: 8690, currency: 'EUR' }),
    )
    expect(gtagEvents()).toHaveLength(0)
  })

  it('l’achat déclenche la conversion Ads et le Purchase Meta dédoublonnable', () => {
    trackPurchase(ORDER)

    const conversion = eventNamed('conversion')[2]
    expect(conversion.send_to).toBe('AW-999999/AbCdEf_gh12')
    expect(conversion.value).toBe(8749)
    expect(conversion.transaction_id).toBe('order-42')

    expect(window.fbq).toHaveBeenCalledWith(
      'track',
      'Purchase',
      expect.objectContaining({ value: 8749 }),
      { eventID: 'order-42' },
    )
  })

  it('view_cart reste réservé à la mesure d’audience', () => {
    trackViewCart(CART, 8690)
    expect(gtagEvents()).toHaveLength(0)
    expect(window.fbq).not.toHaveBeenCalled()
  })
})

describe('garde anti-doublon de purchase', () => {
  beforeEach(() => {
    consent.analytics = true
  })

  it('n’envoie qu’une fois pour une même commande', () => {
    trackPurchase(ORDER)
    trackPurchase(ORDER)

    expect(gtagEvents().filter((call) => call[1] === 'purchase')).toHaveLength(1)
  })

  it('ne pose pas la garde quand rien n’a été envoyé faute de consentement', () => {
    consent.analytics = false
    trackPurchase(ORDER)
    expect(gtagEvents()).toHaveLength(0)

    consent.analytics = true
    trackPurchase(ORDER)
    expect(eventNamed('purchase')).toBeDefined()
  })

  it('ignore un appel sans identifiant de commande', () => {
    trackPurchase({ ...ORDER, orderId: '' })
    expect(gtagEvents()).toHaveLength(0)
  })
})

describe('robustesse', () => {
  it('ne lève pas quand gtag et fbq sont absents (traceurs bloqués)', () => {
    consent.analytics = true
    consent.marketing = true
    delete window.gtag
    delete window.fbq

    expect(() => {
      trackViewItem(WATCH)
      trackAddToCart(CART[0])
      trackBeginCheckout(CART, 8690)
      trackPurchase(ORDER)
      trackPageView('/')
    }).not.toThrow()
  })

  it('ne lève pas quand gtag jette', () => {
    consent.analytics = true
    window.gtag = vi.fn(() => {
      throw new Error('bloqué par une extension')
    })

    expect(() => trackAddToCart(CART[0])).not.toThrow()
  })
})

describe('getGaIdentifiers', () => {
  it('renvoie null sans consentement : c’est ce qui coupe l’envoi serveur', async () => {
    await expect(getGaIdentifiers()).resolves.toEqual({ clientId: null, sessionId: null })
  })

  it('lit client_id et session_id via le callback gtag', async () => {
    consent.analytics = true
    window.gtag = vi.fn((command, id, field, callback) => {
      if (command !== 'get') return
      callback(field === 'client_id' ? '123.456' : '1700000000')
    })

    await expect(getGaIdentifiers()).resolves.toEqual({
      clientId: '123.456',
      sessionId: '1700000000',
    })
  })

  it('abandonne après le délai de garde si gtag ne rappelle jamais', async () => {
    vi.useFakeTimers()
    consent.analytics = true
    window.gtag = vi.fn()

    const pending = getGaIdentifiers({ timeoutMs: 50 })
    await vi.advanceTimersByTimeAsync(60)

    await expect(pending).resolves.toEqual({ clientId: null, sessionId: null })
    vi.useRealTimers()
  })
})
