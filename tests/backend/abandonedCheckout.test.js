import { createRequire } from 'node:module'
import { describe, expect, it, vi } from 'vitest'

const require = createRequire(import.meta.url)
const {
  runAbandonedRecovery,
  buildResumeCheckoutUrl,
  getAbandonedCartConfig,
} = require('../../backend/orders/recovery.js')
const { verifyOrderAccessToken, hashOrderAccessToken } = require('../../backend/orders/tokens.js')
const { createAbandonedCheckoutEmail } = require('../../backend/templates/abandonedCheckoutEmail.js')
const { normalizeSiteConfig } = require('../../backend/sites/normalize.js')

const SECRET = 'test-secret'

function makeSite(overrides = {}) {
  return {
    id: 'demo-store',
    secrets: { paymentCancelSecret: SECRET, emailFrom: 'shop@demo.fr' },
    config: {
      urls: { production: 'https://demo-store.fr' },
      backend: { email: { fromName: 'Demo Store', fromAddress: 'shop@demo.fr' } },
      checkout: { abandonedCart: { enabled: true, delayMinutes: 60, maxAgeHours: 48 } },
      ...overrides,
    },
  }
}

/**
 * Mock Supabase couvrant les trois requêtes du flux de relance :
 * lignes de commande, disponibilité montres, claim conditionnel sur `orders`.
 */
function mockSupabase({ lines, watches, claimResult }) {
  const orderUpdates = []
  const linesChain = {
    select: vi.fn(() => linesChain),
    eq: vi.fn(async () => ({ data: lines, error: null })),
  }
  const watchesChain = {
    select: vi.fn(() => watchesChain),
    in: vi.fn(async () => ({ data: watches, error: null })),
  }
  const ordersChain = {
    update: vi.fn((payload) => {
      orderUpdates.push(payload)
      return ordersChain
    }),
    eq: vi.fn(() => ordersChain),
    is: vi.fn(() => ordersChain),
    in: vi.fn(() => ordersChain),
    select: vi.fn(() => ordersChain),
    maybeSingle: vi.fn(async () => claimResult),
  }
  const supabase = {
    from: vi.fn((table) => {
      if (table === 'order_lines') return linesChain
      if (table === 'watches') return watchesChain
      return ordersChain
    }),
  }
  return { supabase, orderUpdates }
}

const orderLine = {
  watch_id: 'w1',
  name: 'Rolex Datejust',
  reference: '126234',
  unit_price_cents: 850000,
  quantity: 1,
  image_url: null,
}

describe('runAbandonedRecovery', () => {
  it('claims an abandoned order and sends the recovery email', async () => {
    const site = makeSite()
    const { supabase, orderUpdates } = mockSupabase({
      lines: [orderLine],
      watches: [{ id: 'w1', is_sold: false }],
      claimResult: { data: { id: 'o1' }, error: null },
    })
    const sendFn = vi.fn(async () => true)
    const order = { id: 'o1', customer_email: 'client@x.fr', status: 'draft' }

    const sent = await runAbandonedRecovery({ site, supabase, mailjet: {}, orders: [order], sendFn })

    expect(sent).toBe(1)
    expect(sendFn).toHaveBeenCalledTimes(1)

    // Le claim stocke l'horodatage et le hash du token de reprise.
    expect(orderUpdates[0].recovery_email_sent_at).toBeTruthy()
    expect(orderUpdates[0].recovery_token_hash).toBeTruthy()

    // Le lien de reprise contient un token valide dont le hash correspond au claim.
    const resumeUrl = sendFn.mock.calls[0][0].resumeUrl
    const url = new URL(resumeUrl)
    expect(url.origin + url.pathname).toBe('https://demo-store.fr/checkout')
    expect(url.searchParams.get('order')).toBe('o1')
    const token = url.searchParams.get('token')
    expect(verifyOrderAccessToken(SECRET, token, 'o1')).toBe(true)
    expect(hashOrderAccessToken(token)).toBe(orderUpdates[0].recovery_token_hash)
  })

  it('skips an order whose claim was already taken (paid / another tick)', async () => {
    const site = makeSite()
    const { supabase } = mockSupabase({
      lines: [orderLine],
      watches: [{ id: 'w1', is_sold: false }],
      claimResult: { data: null, error: null },
    })
    const sendFn = vi.fn(async () => true)

    const sent = await runAbandonedRecovery({
      site,
      supabase,
      mailjet: {},
      orders: [{ id: 'o1', customer_email: 'client@x.fr' }],
      sendFn,
    })

    expect(sent).toBe(0)
    expect(sendFn).not.toHaveBeenCalled()
  })

  it('never recovers an order whose watch was sold in the meantime', async () => {
    const site = makeSite()
    const { supabase, orderUpdates } = mockSupabase({
      lines: [orderLine],
      watches: [{ id: 'w1', is_sold: true }],
      claimResult: { data: { id: 'o1' }, error: null },
    })
    const sendFn = vi.fn(async () => true)

    const sent = await runAbandonedRecovery({
      site,
      supabase,
      mailjet: {},
      orders: [{ id: 'o1', customer_email: 'client@x.fr' }],
      sendFn,
    })

    expect(sent).toBe(0)
    expect(sendFn).not.toHaveBeenCalled()
    expect(orderUpdates).toHaveLength(0) // Pas de claim : la commande reste intacte.
  })

  it('releases the claim when sending fails so the next tick retries', async () => {
    const site = makeSite()
    const { supabase, orderUpdates } = mockSupabase({
      lines: [orderLine],
      watches: [{ id: 'w1', is_sold: false }],
      claimResult: { data: { id: 'o1' }, error: null },
    })
    const sendFn = vi.fn(async () => {
      throw new Error('mailjet down')
    })

    const sent = await runAbandonedRecovery({
      site,
      supabase,
      mailjet: {},
      orders: [{ id: 'o1', customer_email: 'client@x.fr' }],
      sendFn,
    })

    expect(sent).toBe(0)
    // Deuxième update : remise à null du claim.
    expect(orderUpdates).toHaveLength(2)
    expect(orderUpdates[1]).toEqual({ recovery_email_sent_at: null, recovery_token_hash: null })
  })
})

describe('buildResumeCheckoutUrl', () => {
  it('builds the checkout resume link on the storefront origin', () => {
    const site = makeSite()
    const url = buildResumeCheckoutUrl(site, 'o42', 'tok.sig')
    expect(url).toBe('https://demo-store.fr/checkout?order=o42&token=tok.sig')
  })
})

describe('createAbandonedCheckoutEmail', () => {
  it('renders the order lines and the resume CTA', () => {
    const site = makeSite()
    const html = createAbandonedCheckoutEmail(
      site,
      { id: 'o1', customer_email: 'client@x.fr' },
      [orderLine],
      'https://demo-store.fr/checkout?order=o1&token=t',
    )
    expect(html).toContain('Rolex Datejust')
    expect(html).toContain('8 500,00')
    expect(html).toContain('https://demo-store.fr/checkout?order=o1&amp;token=t')
    expect(html).toContain('Reprendre ma commande')
  })
})

describe('normalizeSiteConfig — checkout.abandonedCart', () => {
  const baseManifest = { siteId: 'demo-store', urls: { production: 'https://demo-store.fr' } }

  it('defaults to disabled with 60 min / 48 h windows', () => {
    const normalized = normalizeSiteConfig(baseManifest)
    expect(normalized.checkout.abandonedCart).toEqual({
      enabled: false,
      delayMinutes: 60,
      maxAgeHours: 48,
    })
  })

  it('keeps explicit settings and coerces invalid numbers to defaults', () => {
    const normalized = normalizeSiteConfig({
      ...baseManifest,
      checkout: { abandonedCart: { enabled: true, delayMinutes: 30, maxAgeHours: -1 } },
    })
    expect(normalized.checkout.abandonedCart).toEqual({
      enabled: true,
      delayMinutes: 30,
      maxAgeHours: 48,
    })
  })
})

describe('getAbandonedCartConfig', () => {
  it('falls back to disabled when the checkout block is missing', () => {
    expect(getAbandonedCartConfig({ config: {} })).toMatchObject({ enabled: false })
  })
})
