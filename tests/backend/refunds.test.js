import { createRequire } from 'node:module'
import { describe, expect, it, vi } from 'vitest'

const require = createRequire(import.meta.url)
const {
  createStripeRefund,
  extractRefundsFromEvent,
  mapStripeRefund,
  recordStripeRefund,
  refundableCents,
  resolveOrderForRefund,
  summarizeRefundRows,
  validateRefundRequest,
} = require('../../backend/orders/refunds.js')

const SITE = { id: 'sauvage-watches', secrets: {} }

const PAID_ORDER = {
  id: 'order-1',
  site_id: 'sauvage-watches',
  status: 'paid',
  total_cents: 450000,
  return_status: 'requested',
  stripe_payment_intent_id: 'pi_3ABC123def',
}

/** @param {object} [overrides] */
function stripeRefund(overrides = {}) {
  return {
    id: 're_1',
    object: 'refund',
    amount: 450000,
    currency: 'eur',
    status: 'succeeded',
    created: Math.floor(Date.UTC(2026, 8, 10, 9, 0, 0) / 1000),
    payment_intent: 'pi_3ABC123def',
    metadata: {},
    ...overrides,
  }
}

/**
 * Supabase en mémoire : assez pour `orders` (lecture + update) et
 * `order_refunds` (lecture, upsert). Les filtres `eq` sont appliqués
 * réellement — c'est ce qui permet de vérifier le cloisonnement par site.
 */
function fakeSupabase({ orders = [], refunds = [] } = {}) {
  const state = { orders, refunds, updates: [] }

  function rowsOf(table) {
    return table === 'orders' ? state.orders : state.refunds
  }

  function matcher(filters) {
    return (row) => filters.every(([column, value]) => row[column] === value)
  }

  function from(table) {
    const filters = []
    const builder = {
      select: () => builder,
      order: () => builder,
      eq: (column, value) => {
        filters.push([column, value])
        return builder
      },
      maybeSingle: async () => ({
        data: rowsOf(table).find(matcher(filters)) ?? null,
        error: null,
      }),
      upsert: (row) => {
        const index = state.refunds.findIndex((r) => r.stripe_refund_id === row.stripe_refund_id)
        const saved = { id: `row-${state.refunds.length + 1}`, ...row }
        if (index >= 0) state.refunds[index] = { ...state.refunds[index], ...row }
        else state.refunds.push(saved)
        return {
          select: () => ({ maybeSingle: async () => ({ data: saved, error: null }) }),
        }
      },
      update: (payload) => {
        const updateFilters = []
        const updateBuilder = {
          eq: (column, value) => {
            updateFilters.push([column, value])
            return updateBuilder
          },
          then: (resolve, reject) => {
            const target = state.orders.find(matcher(updateFilters))
            if (target) Object.assign(target, payload)
            state.updates.push({ table, payload, filters: updateFilters })
            return Promise.resolve({ error: null }).then(resolve, reject)
          },
        }
        return updateBuilder
      },
      then: (resolve, reject) =>
        Promise.resolve({ data: rowsOf(table).filter(matcher(filters)), error: null }).then(
          resolve,
          reject,
        ),
    }
    return builder
  }

  return { from, state }
}

describe('summarizeRefundRows', () => {
  it('sépare le remboursé de l’engagé encore en vol', () => {
    const totals = summarizeRefundRows([
      { amount_cents: 30000, status: 'succeeded', refunded_at: '2026-09-01T10:00:00.000Z' },
      { amount_cents: 10000, status: 'pending' },
      { amount_cents: 5000, status: 'failed' },
    ])

    expect(totals.succeededCents).toBe(30000)
    expect(totals.pendingCents).toBe(10000)
    expect(totals.engagedCents).toBe(40000)
    expect(totals.lastRefundedAt).toBe('2026-09-01T10:00:00.000Z')
  })

  it('garde la date du remboursement le plus récent', () => {
    const totals = summarizeRefundRows([
      { amount_cents: 1000, status: 'succeeded', refunded_at: '2026-09-01T10:00:00.000Z' },
      { amount_cents: 1000, status: 'succeeded', refunded_at: '2026-09-05T10:00:00.000Z' },
      { amount_cents: 1000, status: 'succeeded', refunded_at: '2026-08-20T10:00:00.000Z' },
    ])

    expect(totals.lastRefundedAt).toBe('2026-09-05T10:00:00.000Z')
  })
})

describe('validateRefundRequest', () => {
  it('rembourse par défaut tout le reste dû', () => {
    const result = validateRefundRequest(PAID_ORDER, [], {})
    expect(result).toEqual({ ok: true, amountCents: 450000 })
  })

  it('refuse une commande non payée', () => {
    const result = validateRefundRequest({ ...PAID_ORDER, status: 'pending_payment' }, [], {})
    expect(result.ok).toBe(false)
    expect(result.status).toBe(400)
  })

  it('refuse une commande sans PaymentIntent', () => {
    const result = validateRefundRequest(
      { ...PAID_ORDER, stripe_payment_intent_id: null },
      [],
      { amountCents: 1000 },
    )
    expect(result.ok).toBe(false)
    expect(result.error).toMatch(/Stripe/)
  })

  it('déduit les remboursements en cours du reste à rembourser', () => {
    const result = validateRefundRequest(
      PAID_ORDER,
      [
        { amount_cents: 200000, status: 'succeeded' },
        { amount_cents: 100000, status: 'pending' },
      ],
      { amountCents: 200000 },
    )

    expect(result.ok).toBe(false)
    expect(result.error).toMatch(/1500,00|1500\.00/)
  })

  it('refuse un montant nul ou non entier', () => {
    expect(validateRefundRequest(PAID_ORDER, [], { amountCents: 0 }).ok).toBe(false)
    expect(validateRefundRequest(PAID_ORDER, [], { amountCents: 12.5 }).ok).toBe(false)
  })

  it('refuse une commande déjà intégralement remboursée', () => {
    const result = validateRefundRequest(
      PAID_ORDER,
      [{ amount_cents: 450000, status: 'succeeded' }],
      {},
    )
    expect(result.status).toBe(409)
  })

  it('refundableCents ne descend pas sous zéro', () => {
    expect(
      refundableCents({ total_cents: 1000 }, [{ amount_cents: 5000, status: 'succeeded' }]),
    ).toBe(0)
  })
})

describe('mapStripeRefund', () => {
  it('déduit l’origine « dashboard » d’un remboursement non déclenché par le panel', () => {
    const row = mapStripeRefund(stripeRefund(), { siteId: SITE.id, orderId: 'order-1' })

    expect(row).toMatchObject({
      site_id: 'sauvage-watches',
      order_id: 'order-1',
      stripe_refund_id: 're_1',
      stripe_payment_intent_id: 'pi_3ABC123def',
      amount_cents: 450000,
      status: 'succeeded',
      source: 'stripe_dashboard',
    })
    expect(row.refunded_at).toBe('2026-09-10T09:00:00.000Z')
  })

  it('reconnaît un remboursement déclenché depuis le panel', () => {
    const row = mapStripeRefund(
      stripeRefund({ metadata: { refund_source: 'admin_panel', initiated_by: 'admin@x.fr' } }),
      { siteId: SITE.id, orderId: 'order-1' },
    )

    expect(row.source).toBe('admin_panel')
    expect(row.initiated_by).toBe('admin@x.fr')
  })

  it('retombe sur `pending` devant un statut inconnu', () => {
    const row = mapStripeRefund(stripeRefund({ status: 'wat' }), {
      siteId: SITE.id,
      orderId: 'order-1',
    })
    expect(row.status).toBe('pending')
  })
})

describe('resolveOrderForRefund', () => {
  it('retrouve la commande par metadata.order_id', async () => {
    const supabase = fakeSupabase({ orders: [{ ...PAID_ORDER }] })

    const order = await resolveOrderForRefund(
      supabase,
      SITE.id,
      stripeRefund({ metadata: { order_id: 'order-1' } }),
    )

    expect(order.id).toBe('order-1')
  })

  it('retombe sur le PaymentIntent quand le remboursement vient de Stripe', async () => {
    const supabase = fakeSupabase({ orders: [{ ...PAID_ORDER }] })

    const order = await resolveOrderForRefund(supabase, SITE.id, stripeRefund())

    expect(order.id).toBe('order-1')
  })

  it('ne traverse pas les sites', async () => {
    const supabase = fakeSupabase({ orders: [{ ...PAID_ORDER, site_id: 'jackned' }] })

    expect(await resolveOrderForRefund(supabase, SITE.id, stripeRefund())).toBeNull()
  })
})

describe('recordStripeRefund', () => {
  it('écrit la ligne, recalcule le cache et passe le dossier en « remboursée »', async () => {
    const supabase = fakeSupabase({ orders: [{ ...PAID_ORDER }] })

    const result = await recordStripeRefund(supabase, SITE, stripeRefund())

    expect(result.recorded).toBe(true)
    expect(result.statusChangedTo).toBe('succeeded')
    expect(result.totals).toMatchObject({ succeededCents: 450000, isFullyRefunded: true })

    const order = supabase.state.orders[0]
    expect(order.refund_amount_cents).toBe(450000)
    expect(order.stripe_refund_id).toBe('re_1')
    expect(order.return_status).toBe('refunded')
  })

  it('additionne les remboursements partiels sans écraser le précédent', async () => {
    const supabase = fakeSupabase({ orders: [{ ...PAID_ORDER }] })

    await recordStripeRefund(supabase, SITE, stripeRefund({ id: 're_1', amount: 200000 }))
    const second = await recordStripeRefund(
      supabase,
      SITE,
      stripeRefund({ id: 're_2', amount: 100000 }),
    )

    expect(supabase.state.refunds).toHaveLength(2)
    expect(second.totals.succeededCents).toBe(300000)
    expect(second.totals.isFullyRefunded).toBe(false)
    expect(supabase.state.orders[0].refund_amount_cents).toBe(300000)
  })

  it('est idempotent : un rejeu de webhook ne recrée rien ni ne renotifie', async () => {
    const supabase = fakeSupabase({ orders: [{ ...PAID_ORDER }] })

    await recordStripeRefund(supabase, SITE, stripeRefund())
    const replay = await recordStripeRefund(supabase, SITE, stripeRefund())

    expect(supabase.state.refunds).toHaveLength(1)
    expect(replay.statusChangedTo).toBeNull()
    expect(supabase.state.orders[0].refund_amount_cents).toBe(450000)
  })

  it('signale la transition pending → succeeded, qui déclenche l’e-mail client', async () => {
    const supabase = fakeSupabase({ orders: [{ ...PAID_ORDER }] })

    const pending = await recordStripeRefund(supabase, SITE, stripeRefund({ status: 'pending' }))
    expect(pending.statusChangedTo).toBe('pending')
    expect(supabase.state.orders[0].refund_amount_cents).toBeNull()

    const settled = await recordStripeRefund(supabase, SITE, stripeRefund({ status: 'succeeded' }))
    expect(settled.statusChangedTo).toBe('succeeded')
    expect(supabase.state.orders[0].refund_amount_cents).toBe(450000)
  })

  it('ne compte pas un remboursement échoué dans le total remboursé', async () => {
    const supabase = fakeSupabase({ orders: [{ ...PAID_ORDER }] })

    await recordStripeRefund(
      supabase,
      SITE,
      stripeRefund({ status: 'failed', failure_reason: 'insufficient_funds' }),
    )

    expect(supabase.state.orders[0].refund_amount_cents).toBeNull()
    expect(supabase.state.orders[0].return_status).toBe('requested')
  })

  it('ne rouvre pas un dossier refusé par le commerçant', async () => {
    const supabase = fakeSupabase({ orders: [{ ...PAID_ORDER, return_status: 'rejected' }] })

    await recordStripeRefund(supabase, SITE, stripeRefund())

    expect(supabase.state.orders[0].return_status).toBe('rejected')
    expect(supabase.state.orders[0].refund_amount_cents).toBe(450000)
  })

  it('ignore un remboursement sans commande rattachable', async () => {
    const supabase = fakeSupabase({ orders: [] })

    const result = await recordStripeRefund(supabase, SITE, stripeRefund())

    expect(result.recorded).toBe(false)
    expect(supabase.state.refunds).toHaveLength(0)
  })
})

describe('createStripeRefund', () => {
  it('porte une clé d’idempotence et les metadata de rattachement', async () => {
    const create = vi.fn().mockResolvedValue(stripeRefund())
    const stripe = { refunds: { create } }

    await createStripeRefund(stripe, {
      order: PAID_ORDER,
      amountCents: 120000,
      reason: 'requested_by_customer',
      initiatedBy: 'admin@exemple.fr',
      idempotencyKey: 'clic-1',
    })

    const [payload, options] = create.mock.calls[0]
    expect(payload).toMatchObject({
      payment_intent: 'pi_3ABC123def',
      amount: 120000,
      reason: 'requested_by_customer',
    })
    expect(payload.metadata).toMatchObject({
      order_id: 'order-1',
      site_id: 'sauvage-watches',
      refund_source: 'admin_panel',
      initiated_by: 'admin@exemple.fr',
    })
    expect(options.idempotencyKey).toBe('clic-1')
  })

  it('génère une clé d’idempotence quand l’appelant n’en fournit pas', async () => {
    const create = vi.fn().mockResolvedValue(stripeRefund())

    await createStripeRefund({ refunds: { create } }, { order: PAID_ORDER, amountCents: 1000 })

    expect(create.mock.calls[0][1].idempotencyKey).toEqual(expect.any(String))
  })

  it('range un motif libre dans les metadata plutôt que dans `reason`', async () => {
    const create = vi.fn().mockResolvedValue(stripeRefund())

    await createStripeRefund(
      { refunds: { create } },
      { order: PAID_ORDER, amountCents: 1000, reason: 'Geste commercial' },
    )

    const [payload] = create.mock.calls[0]
    expect(payload.reason).toBeUndefined()
    expect(payload.metadata.refund_note).toBe('Geste commercial')
  })
})

describe('extractRefundsFromEvent', () => {
  it('rend le Refund tel quel pour un événement refund.*', async () => {
    const refunds = await extractRefundsFromEvent(stripeRefund())
    expect(refunds).toHaveLength(1)
  })

  it('déplie les remboursements imbriqués d’une charge', async () => {
    const refunds = await extractRefundsFromEvent({
      object: 'charge',
      id: 'ch_1',
      refunds: { data: [stripeRefund(), stripeRefund({ id: 're_2' })], has_more: false },
    })

    expect(refunds.map((r) => r.id)).toEqual(['re_1', 're_2'])
  })

  it('repasse par l’API quand la charge en annonce davantage', async () => {
    const list = vi.fn().mockResolvedValue({ data: [stripeRefund({ id: 're_11' })] })

    const refunds = await extractRefundsFromEvent(
      { object: 'charge', id: 'ch_1', refunds: { data: [stripeRefund()], has_more: true } },
      { stripe: { refunds: { list } } },
    )

    expect(list).toHaveBeenCalledWith({ charge: 'ch_1', limit: 100 })
    expect(refunds.map((r) => r.id)).toEqual(['re_11'])
  })
})
