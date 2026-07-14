import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'

const require = createRequire(import.meta.url)
const {
  classifyPaymentIntentStatus,
  paymentMatchesOrder,
  gateOrderEditOnPaymentIntent,
  syncPaymentIntentAmount,
} = require('../../backend/orders/paymentIntentSync.js')
const { handlePaymentIntentSucceeded } = require('../../backend/routes/orders.js')

function createStripeMock({ status = 'requires_payment_method', cancelError = null } = {}) {
  const calls = { retrieve: [], cancel: [], update: [] }
  const stripe = {
    paymentIntents: {
      retrieve: async (id) => {
        calls.retrieve.push(id)
        return { id, status, amount: 5000, currency: 'eur', receipt_email: null }
      },
      cancel: async (id) => {
        calls.cancel.push(id)
        if (cancelError) throw cancelError
        return { id, status: 'canceled' }
      },
      update: async (id, payload) => {
        calls.update.push([id, payload])
        return { id, status, amount: 5000, ...payload }
      },
    },
  }
  return { stripe, calls }
}

function createDetachSupabaseMock() {
  const calls = { update: [] }
  const supabase = {
    from(table) {
      if (table !== 'orders') throw new Error(`Unexpected table: ${table}`)
      return {
        update(payload) {
          calls.update.push(payload)
          return { eq: async () => ({ error: null }) }
        },
      }
    },
  }
  return { supabase, calls }
}

describe('classifyPaymentIntentStatus', () => {
  it('classe les statuts modifiables', () => {
    expect(classifyPaymentIntentStatus('requires_payment_method')).toBe('updatable')
    expect(classifyPaymentIntentStatus('requires_confirmation')).toBe('updatable')
  })

  it('classe la 3DS en cours comme annulable', () => {
    expect(classifyPaymentIntentStatus('requires_action')).toBe('cancelable')
  })

  it('classe canceled comme détaché', () => {
    expect(classifyPaymentIntentStatus('canceled')).toBe('detached')
  })

  it('verrouille processing, succeeded et les statuts inconnus', () => {
    expect(classifyPaymentIntentStatus('processing')).toBe('locked')
    expect(classifyPaymentIntentStatus('succeeded')).toBe('locked')
    expect(classifyPaymentIntentStatus('requires_capture')).toBe('locked')
    expect(classifyPaymentIntentStatus('nouveau_statut')).toBe('locked')
  })
})

describe('paymentMatchesOrder', () => {
  const order = { total_cents: 5000, currency: 'EUR' }

  it('accepte un montant et une devise identiques', () => {
    const result = paymentMatchesOrder(order, {
      amount: 5000,
      amount_received: 5000,
      currency: 'eur',
    })
    expect(result.ok).toBe(true)
  })

  it('retombe sur amount quand amount_received est absent', () => {
    expect(paymentMatchesOrder(order, { amount: 5000, currency: 'eur' }).ok).toBe(true)
  })

  it('refuse un montant encaissé différent', () => {
    const result = paymentMatchesOrder(order, { amount_received: 4000, currency: 'eur' })
    expect(result).toMatchObject({
      ok: false,
      reason: 'amount_mismatch',
      expectedCents: 5000,
      receivedCents: 4000,
    })
  })

  it('refuse (fail closed) quand les montants sont absents', () => {
    expect(paymentMatchesOrder({}, {})).toMatchObject({ ok: false, reason: 'missing_amount' })
    expect(paymentMatchesOrder(order, {})).toMatchObject({ ok: false, reason: 'missing_amount' })
  })

  it('refuse une devise différente', () => {
    const result = paymentMatchesOrder(order, { amount_received: 5000, currency: 'usd' })
    expect(result).toMatchObject({ ok: false, reason: 'currency_mismatch' })
  })
})

describe('gateOrderEditOnPaymentIntent', () => {
  it('laisse passer une commande sans PaymentIntent', async () => {
    const { stripe, calls } = createStripeMock()
    const { supabase } = createDetachSupabaseMock()
    const result = await gateOrderEditOnPaymentIntent(stripe, supabase, { id: 'order-1' })
    expect(result).toEqual({ ok: true, paymentIntent: null })
    expect(calls.retrieve).toHaveLength(0)
  })

  it('renvoie le PaymentIntent quand il est encore modifiable', async () => {
    const { stripe } = createStripeMock({ status: 'requires_payment_method' })
    const { supabase, calls } = createDetachSupabaseMock()
    const result = await gateOrderEditOnPaymentIntent(stripe, supabase, {
      id: 'order-1',
      stripe_payment_intent_id: 'pi_1',
    })
    expect(result.ok).toBe(true)
    expect(result.paymentIntent.id).toBe('pi_1')
    expect(calls.update).toHaveLength(0)
  })

  it.each(['processing', 'succeeded'])('refuse la modification quand le PI est %s', async (status) => {
    const { stripe } = createStripeMock({ status })
    const { supabase, calls } = createDetachSupabaseMock()
    const result = await gateOrderEditOnPaymentIntent(stripe, supabase, {
      id: 'order-1',
      stripe_payment_intent_id: 'pi_1',
    })
    expect(result).toMatchObject({ ok: false, status: 409 })
    expect(calls.update).toHaveLength(0)
  })

  it('annule et détache un PI en 3DS (requires_action)', async () => {
    const { stripe, calls: stripeCalls } = createStripeMock({ status: 'requires_action' })
    const { supabase, calls } = createDetachSupabaseMock()
    const result = await gateOrderEditOnPaymentIntent(stripe, supabase, {
      id: 'order-1',
      stripe_payment_intent_id: 'pi_1',
    })
    expect(result).toEqual({ ok: true, paymentIntent: null })
    expect(stripeCalls.cancel).toEqual(['pi_1'])
    expect(calls.update[0]).toMatchObject({ stripe_payment_intent_id: null })
  })

  it("refuse la modification si l'annulation échoue (course avec la 3DS)", async () => {
    const { stripe } = createStripeMock({
      status: 'requires_action',
      cancelError: new Error('PI already succeeded'),
    })
    const { supabase, calls } = createDetachSupabaseMock()
    const result = await gateOrderEditOnPaymentIntent(stripe, supabase, {
      id: 'order-1',
      stripe_payment_intent_id: 'pi_1',
    })
    expect(result).toMatchObject({ ok: false, status: 409 })
    expect(calls.update).toHaveLength(0)
  })

  it('détache un PI déjà annulé', async () => {
    const { stripe, calls: stripeCalls } = createStripeMock({ status: 'canceled' })
    const { supabase, calls } = createDetachSupabaseMock()
    const result = await gateOrderEditOnPaymentIntent(stripe, supabase, {
      id: 'order-1',
      stripe_payment_intent_id: 'pi_1',
    })
    expect(result).toEqual({ ok: true, paymentIntent: null })
    expect(stripeCalls.cancel).toHaveLength(0)
    expect(calls.update[0]).toMatchObject({ stripe_payment_intent_id: null })
  })
})

describe('syncPaymentIntentAmount', () => {
  it('ne fait rien quand le montant est déjà aligné', async () => {
    const { stripe, calls } = createStripeMock()
    const paymentIntent = { id: 'pi_1', amount: 5000, receipt_email: null }
    const result = await syncPaymentIntentAmount(stripe, paymentIntent, 5000)
    expect(result).toBe(paymentIntent)
    expect(calls.update).toHaveLength(0)
  })

  it('aligne le montant du PI sur le nouveau total', async () => {
    const { stripe, calls } = createStripeMock()
    await syncPaymentIntentAmount(stripe, { id: 'pi_1', amount: 5000 }, 6500)
    expect(calls.update).toEqual([['pi_1', { amount: 6500 }]])
  })

  it("met aussi à jour l'email de reçu quand il change", async () => {
    const { stripe, calls } = createStripeMock()
    await syncPaymentIntentAmount(
      stripe,
      { id: 'pi_1', amount: 5000, receipt_email: null },
      5000,
      'client@example.com',
    )
    expect(calls.update).toEqual([['pi_1', { receipt_email: 'client@example.com' }]])
  })
})

describe('handlePaymentIntentSucceeded — garde-fou de montant', () => {
  const site = { id: 'test-site' }

  function createOrderSupabaseMock({ order, rpcResult = false }) {
    const calls = { rpc: [] }
    const supabase = {
      from(table) {
        if (table !== 'orders') throw new Error(`Unexpected table: ${table}`)
        return {
          select() {
            return {
              eq: () => ({
                eq: () => ({
                  maybeSingle: async () => ({ data: order, error: null }),
                }),
              }),
            }
          },
        }
      },
      rpc: async (name, args) => {
        calls.rpc.push([name, args])
        return { data: rpcResult, error: null }
      },
    }
    return { supabase, calls }
  }

  it('refuse le fulfillment quand le montant encaissé diffère du total', async () => {
    const order = { id: 'order-1', status: 'pending_payment', total_cents: 6500, currency: 'EUR' }
    const { supabase, calls } = createOrderSupabaseMock({ order })
    const paymentIntent = {
      id: 'pi_1',
      amount: 5000,
      amount_received: 5000,
      currency: 'eur',
      metadata: { order_id: 'order-1' },
    }

    await expect(handlePaymentIntentSucceeded(supabase, site, paymentIntent)).rejects.toThrow(
      /Fulfillment refusé/,
    )
    expect(calls.rpc).toHaveLength(0)
  })

  it('poursuit le fulfillment quand montant et devise correspondent', async () => {
    const order = { id: 'order-1', status: 'pending_payment', total_cents: 5000, currency: 'EUR' }
    // rpcResult=false : une autre source a déjà traité la transition → le
    // handler s'arrête juste après le garde-fou, sans autres effets de bord.
    const { supabase, calls } = createOrderSupabaseMock({ order, rpcResult: false })
    const paymentIntent = {
      id: 'pi_1',
      amount: 5000,
      amount_received: 5000,
      currency: 'eur',
      metadata: { order_id: 'order-1' },
    }

    await expect(
      handlePaymentIntentSucceeded(supabase, site, paymentIntent),
    ).resolves.toBeUndefined()
    expect(calls.rpc).toEqual([
      ['fulfill_order_payment', { p_order_id: 'order-1', p_stripe_payment_intent_id: 'pi_1' }],
    ])
  })

  it('reste idempotent : une commande déjà payée est ignorée sans vérification', async () => {
    const order = { id: 'order-1', status: 'paid', total_cents: 6500, currency: 'EUR' }
    const { supabase, calls } = createOrderSupabaseMock({ order })
    const paymentIntent = {
      id: 'pi_1',
      amount_received: 5000,
      currency: 'eur',
      metadata: { order_id: 'order-1' },
    }

    await expect(
      handlePaymentIntentSucceeded(supabase, site, paymentIntent),
    ).resolves.toBeUndefined()
    expect(calls.rpc).toHaveLength(0)
  })
})
