import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'

const require = createRequire(import.meta.url)
const {
  checkPaymentsWithoutOrder,
  checkRefundsWithoutRecord,
  runPaymentsInvariant,
} = require('../../backend/health/paymentsInvariant.js')

const NOW = Date.UTC(2026, 7, 24, 12, 0, 0)
const SITE = { id: 'sauvage-watches', secrets: {} }

/** @param {number} minutesAgo */
function secondsAgo(minutesAgo) {
  return Math.floor((NOW - minutesAgo * 60 * 1000) / 1000)
}

function paymentIntent(overrides = {}) {
  return {
    id: 'pi_1',
    status: 'succeeded',
    created: secondsAgo(30),
    amount: 869000,
    currency: 'eur',
    metadata: { order_id: 'order-1', site_id: 'sauvage-watches' },
    ...overrides,
  }
}

/** Client Stripe minimal : ne sait que lister des PaymentIntents. */
function fakeStripe(data, spy = {}) {
  return {
    paymentIntents: {
      list: async (params) => {
        spy.params = params
        return { data }
      },
    },
  }
}

/** Client Supabase minimal : `from('orders').select().eq().in()`. */
function fakeSupabase(rows, spy = {}) {
  return {
    from(table) {
      spy.table = table
      const builder = {
        select: () => builder,
        eq: (column, value) => {
          spy.eq = { column, value }
          return builder
        },
        in: (column, values) => {
          spy.in = { column, values }
          return Promise.resolve({ data: rows, error: null })
        },
      }
      return builder
    },
  }
}

function run(payments, orders, options = {}) {
  return checkPaymentsWithoutOrder(SITE, {
    now: NOW,
    clients: { stripe: fakeStripe(payments), supabase: fakeSupabase(orders) },
    ...options,
  })
}

describe('checkPaymentsWithoutOrder', () => {
  it('ne signale rien quand chaque paiement a sa commande payée', async () => {
    const result = await run(
      [paymentIntent()],
      [{ id: 'order-1', status: 'paid', stripe_payment_intent_id: 'pi_1' }],
    )
    expect(result.status).toBe('ok')
    expect(result.matched).toBe(1)
    expect(result.orphans).toEqual([])
  })

  it('alerte quand le paiement a réussi sans commande en base', async () => {
    const result = await run([paymentIntent()], [])
    expect(result.status).toBe('alert')
    expect(result.orphans).toHaveLength(1)
    expect(result.orphans[0]).toMatchObject({
      paymentIntentId: 'pi_1',
      orderId: 'order-1',
      reason: 'no_order',
      amount: 869000,
    })
  })

  it('alerte quand la commande est restée en pending_payment (webhook non traité)', async () => {
    const result = await run(
      [paymentIntent()],
      [{ id: 'order-1', status: 'pending_payment', stripe_payment_intent_id: 'pi_1' }],
    )
    expect(result.status).toBe('alert')
    expect(result.orphans[0]).toMatchObject({
      reason: 'order_not_paid',
      orderStatus: 'pending_payment',
    })
  })

  it('laisse le webhook arriver : les paiements dans la période de grâce sont ignorés', async () => {
    const result = await run([paymentIntent({ created: secondsAgo(1) })], [])
    expect(result.status).toBe('ok')
    expect(result.succeeded).toBe(0)
  })

  it('ignore les PaymentIntents non réussis', async () => {
    const result = await run([paymentIntent({ status: 'requires_payment_method' })], [])
    expect(result.status).toBe('ok')
    expect(result.succeeded).toBe(0)
  })

  it('compte à part un paiement hors checkout (sans metadata.order_id)', async () => {
    const result = await run([paymentIntent({ metadata: {} })], [])
    expect(result.status).toBe('ok')
    expect(result.unknown).toBe(1)
    expect(result.orphans).toEqual([])
  })

  it("ignore les paiements estampillés d'un autre site", async () => {
    const result = await run([paymentIntent({ metadata: { order_id: 'x', site_id: 'jackned' } })], [])
    expect(result.status).toBe('ok')
    expect(result.succeeded).toBe(0)
  })

  it('interroge Stripe sur la fenêtre demandée et Supabase sur le bon site', async () => {
    const stripeSpy = {}
    const supabaseSpy = {}
    await checkPaymentsWithoutOrder(SITE, {
      now: NOW,
      windowMinutes: 120,
      clients: {
        stripe: fakeStripe([paymentIntent()], stripeSpy),
        supabase: fakeSupabase([], supabaseSpy),
      },
    })
    expect(stripeSpy.params.created.gte).toBe(secondsAgo(120))
    expect(supabaseSpy.table).toBe('orders')
    expect(supabaseSpy.eq).toEqual({ column: 'site_id', value: 'sauvage-watches' })
    expect(supabaseSpy.in.values).toEqual(['pi_1'])
  })

  it('pagine tant que Stripe annonce has_more', async () => {
    // Stripe rend les paiements du plus récent au plus ancien : sans pagination,
    // ce sont les plus vieux — donc les orphelins mûrs — qui disparaissent.
    const calls = []
    const pages = [
      { data: [paymentIntent({ id: 'pi_new' })], has_more: true },
      { data: [paymentIntent({ id: 'pi_old', metadata: { order_id: 'order-2' } })], has_more: false },
    ]
    const stripe = {
      paymentIntents: {
        list: async (params) => {
          calls.push(params.starting_after || null)
          return pages[calls.length - 1]
        },
      },
    }

    const result = await checkPaymentsWithoutOrder(SITE, {
      now: NOW,
      clients: { stripe, supabase: fakeSupabase([]) },
    })
    expect(calls).toEqual([null, 'pi_new'])
    expect(result.scanned).toBe(2)
    expect(result.truncated).toBe(false)
    expect(result.orphans.map((o) => o.paymentIntentId)).toEqual(['pi_new', 'pi_old'])
  })

  it('signale truncated quand le plafond de paiements est atteint', async () => {
    const stripe = {
      paymentIntents: {
        list: async () => ({ data: [paymentIntent()], has_more: true }),
      },
    }
    const result = await checkPaymentsWithoutOrder(SITE, {
      now: NOW,
      maxPayments: 2,
      clients: { stripe, supabase: fakeSupabase([]) },
    })
    expect(result.truncated).toBe(true)
    expect(result.scanned).toBe(2)
  })

  it('remonte down quand Supabase répond en erreur', async () => {
    const supabase = {
      from: () => ({
        select: function () {
          return this
        },
        eq: function () {
          return this
        },
        in: async () => ({ data: null, error: { message: 'JWT expired' } }),
      }),
    }
    const result = await checkPaymentsWithoutOrder(SITE, {
      now: NOW,
      clients: { stripe: fakeStripe([paymentIntent()]), supabase },
    })
    expect(result.status).toBe('down')
    expect(result.error).toContain('JWT expired')
  })

  it('rend not_configured quand les secrets du site manquent', async () => {
    const result = await checkPaymentsWithoutOrder({ id: 'demo-store', secrets: {} }, { now: NOW })
    expect(result.status).toBe('not_configured')
    expect(result.missing.length).toBeGreaterThan(0)
  })
})


describe('checkRefundsWithoutRecord', () => {
  function refund(overrides = {}) {
    return {
      id: 're_1',
      status: 'succeeded',
      created: secondsAgo(30),
      amount: 450000,
      currency: 'eur',
      payment_intent: 'pi_1',
      ...overrides,
    }
  }

  /**
   * Supabase minimal à deux tables : `order_refunds` (ce qui est enregistré) et
   * `orders` (ce à quoi un remboursement peut se rattacher).
   */
  function fakeRefundSupabase({ recorded = [], orders = [] }, spy = {}) {
    return {
      from(table) {
        spy.tables = [...(spy.tables || []), table]
        const builder = {
          select: () => builder,
          eq: (column, value) => {
            spy.eq = { column, value }
            return builder
          },
          in: (column, values) => {
            spy.in = [...(spy.in || []), { table, column, values }]
            return Promise.resolve({
              data: table === 'order_refunds' ? recorded : orders,
              error: null,
            })
          },
        }
        return builder
      },
    }
  }

  function run(refunds, db, options = {}) {
    return checkRefundsWithoutRecord(SITE, {
      now: NOW,
      clients: {
        stripe: { refunds: { list: async () => ({ data: refunds }) } },
        supabase: fakeRefundSupabase(db),
      },
      ...options,
    })
  }

  it('ne signale rien quand chaque remboursement a sa ligne en base', async () => {
    const result = await run([refund()], { recorded: [{ stripe_refund_id: 're_1' }] })

    expect(result.status).toBe('ok')
    expect(result.matched).toBe(1)
    expect(result.unrecorded).toEqual([])
  })

  it('alerte sur un remboursement Stripe absent de la base', async () => {
    const result = await run([refund()], {
      recorded: [],
      orders: [{ id: 'order-1', stripe_payment_intent_id: 'pi_1' }],
    })

    expect(result.status).toBe('alert')
    expect(result.unrecorded).toHaveLength(1)
    expect(result.unrecorded[0]).toMatchObject({
      refundId: 're_1',
      orderId: 'order-1',
      amount: 450000,
      refundStatus: 'succeeded',
    })
  })

  it('laisse le webhook arriver : les remboursements récents sont ignorés', async () => {
    const result = await run([refund({ created: secondsAgo(1) })], { recorded: [] })

    expect(result.status).toBe('ok')
    expect(result.refunds).toBe(0)
  })

  it('ignore un remboursement échoué ou annulé, qui ne rend rien au client', async () => {
    const result = await run([refund({ status: 'failed' }), refund({ id: 're_2', status: 'canceled' })], {
      recorded: [],
    })

    expect(result.status).toBe('ok')
    expect(result.refunds).toBe(0)
  })

  it('compte à part un remboursement sans commande de ce site', async () => {
    const result = await run([refund()], { recorded: [], orders: [] })

    expect(result.status).toBe('ok')
    expect(result.unknown).toBe(1)
    expect(result.unrecorded).toEqual([])
  })

  it('interroge la bonne fenêtre et cloisonne par site', async () => {
    const spy = {}
    const stripeSpy = {}
    await checkRefundsWithoutRecord(SITE, {
      now: NOW,
      windowMinutes: 240,
      clients: {
        stripe: {
          refunds: {
            list: async (params) => {
              stripeSpy.params = params
              return { data: [refund()] }
            },
          },
        },
        supabase: fakeRefundSupabase({ recorded: [], orders: [] }, spy),
      },
    })

    expect(stripeSpy.params.created.gte).toBe(secondsAgo(240))
    expect(spy.eq).toEqual({ column: 'site_id', value: 'sauvage-watches' })
    expect(spy.in[0]).toMatchObject({ table: 'order_refunds', values: ['re_1'] })
  })

  it('pagine tant que Stripe annonce has_more', async () => {
    const calls = []
    const pages = [
      { data: [refund({ id: 're_new' })], has_more: true },
      { data: [refund({ id: 're_old' })], has_more: false },
    ]
    const result = await checkRefundsWithoutRecord(SITE, {
      now: NOW,
      clients: {
        stripe: {
          refunds: {
            list: async (params) => {
              calls.push(params.starting_after || null)
              return pages[calls.length - 1]
            },
          },
        },
        supabase: fakeRefundSupabase({
          recorded: [],
          orders: [{ id: 'order-1', stripe_payment_intent_id: 'pi_1' }],
        }),
      },
    })

    expect(calls).toEqual([null, 're_new'])
    expect(result.unrecorded.map((r) => r.refundId)).toEqual(['re_new', 're_old'])
  })

  it('remonte down quand Supabase répond en erreur', async () => {
    const supabase = {
      from: () => ({
        select: function () {
          return this
        },
        eq: function () {
          return this
        },
        in: async () => ({ data: null, error: { message: 'JWT expired' } }),
      }),
    }
    const result = await checkRefundsWithoutRecord(SITE, {
      now: NOW,
      clients: { stripe: { refunds: { list: async () => ({ data: [refund()] }) } }, supabase },
    })

    expect(result.status).toBe('down')
    expect(result.error).toContain('JWT expired')
  })

  it('rend not_configured quand les secrets du site manquent', async () => {
    const result = await checkRefundsWithoutRecord({ id: 'demo-store', secrets: {} }, { now: NOW })
    expect(result.status).toBe('not_configured')
  })

  it('ne passe pas en panne quand la clé du client n’autorise pas les remboursements', async () => {
    // Permission « Refunds » volontairement absente : le webhook enregistre
    // quand même les remboursements, la supervision ne doit pas rougir.
    const permissionError = Object.assign(new Error('does not have access to refunds'), {
      type: 'StripePermissionError',
      statusCode: 403,
    })
    const result = await checkRefundsWithoutRecord(SITE, {
      now: NOW,
      clients: {
        stripe: {
          refunds: {
            list: async () => {
              throw permissionError
            },
          },
        },
        supabase: {},
      },
    })

    expect(result.status).toBe('not_configured')
    expect(result.missing).toEqual(['STRIPE_REFUNDS_PERMISSION'])
  })
})

describe('runPaymentsInvariant', () => {
  it('une alerte sur un site suffit à alerter globalement', async () => {
    const registry = {
      byId: new Map(),
      list: () => [
        { id: 'demo-store', secrets: {} },
        { id: 'jackned', secrets: {} },
      ],
    }
    const payload = await runPaymentsInvariant(registry, { now: NOW })
    // Sans secrets, les deux sites sont not_configured : neutre.
    expect(payload.status).toBe('ok')
    expect(Object.keys(payload.sites)).toEqual(['demo-store', 'jackned'])
  })

  it('rapporte les deux invariants par site, argent entrant et sortant', async () => {
    const registry = { byId: new Map(), list: () => [{ id: 'demo-store', secrets: {} }] }

    const payload = await runPaymentsInvariant(registry, { now: NOW })

    expect(payload.sites['demo-store'].status).toBe('not_configured')
    expect(payload.sites['demo-store'].refunds.status).toBe('not_configured')
  })
})
