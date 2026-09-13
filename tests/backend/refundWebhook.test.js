/**
 * Webhook de remboursement : `charge.refunded`, `refund.created/updated`.
 *
 * C'est le chemin qui rattrape TOUS les remboursements, y compris ceux que
 * l'application n'a pas déclenchés (dashboard Stripe, litige). Les tests
 * vérifient donc surtout qu'il converge : rejeu d'événement, deux événements
 * pour un même remboursement, remboursements multiples sur une charge.
 */
import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'

const require = createRequire(import.meta.url)
const { handleRefundEvent } = require('../../backend/routes/orders.js')

// Sans secrets Mailjet, l'envoi d'e-mail est ignoré avec un avertissement :
// exactement ce qu'on veut ici, le webhook ne doit dépendre d'aucun tiers.
const SITE = { id: 'sauvage-watches', secrets: {}, config: { backend: { email: {} } } }

const ORDER = {
  id: 'order-1',
  site_id: 'sauvage-watches',
  status: 'paid',
  total_cents: 450000,
  return_status: 'requested',
  customer_email: 'client@exemple.fr',
  stripe_payment_intent_id: 'pi_3ABC123def',
}

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

function fakeSupabase({ orders = [], refunds = [] } = {}) {
  const state = { orders, refunds }
  const rowsOf = (table) => (table === 'orders' ? state.orders : state.refunds)
  const matcher = (filters) => (row) => filters.every(([column, value]) => row[column] === value)

  return {
    state,
    from(table) {
      const filters = []
      const builder = {
        select: () => builder,
        order: () => builder,
        eq: (column, value) => {
          filters.push([column, value])
          return builder
        },
        maybeSingle: async () => ({ data: rowsOf(table).find(matcher(filters)) ?? null, error: null }),
        upsert: (row) => {
          const index = state.refunds.findIndex(
            (r) => r.stripe_refund_id === row.stripe_refund_id,
          )
          if (index >= 0) state.refunds[index] = { ...state.refunds[index], ...row }
          else state.refunds.push({ id: `row-${state.refunds.length + 1}`, ...row })
          return { select: () => ({ maybeSingle: async () => ({ data: row, error: null }) }) }
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
    },
  }
}

describe('handleRefundEvent', () => {
  it('enregistre un remboursement fait hors application (dashboard Stripe)', async () => {
    const supabase = fakeSupabase({ orders: [{ ...ORDER }] })

    await handleRefundEvent(supabase, SITE, {
      type: 'charge.refunded',
      data: { object: { object: 'charge', id: 'ch_1', refunds: { data: [stripeRefund()] } } },
    })

    expect(supabase.state.refunds).toHaveLength(1)
    expect(supabase.state.refunds[0]).toMatchObject({
      stripe_refund_id: 're_1',
      source: 'stripe_dashboard',
      status: 'succeeded',
    })
    expect(supabase.state.orders[0].refund_amount_cents).toBe(450000)
    expect(supabase.state.orders[0].return_status).toBe('refunded')
  })

  it('enregistre chaque remboursement d’une charge qui en porte plusieurs', async () => {
    const supabase = fakeSupabase({ orders: [{ ...ORDER }] })

    await handleRefundEvent(supabase, SITE, {
      type: 'charge.refunded',
      data: {
        object: {
          object: 'charge',
          id: 'ch_1',
          refunds: {
            data: [
              stripeRefund({ id: 're_1', amount: 200000 }),
              stripeRefund({ id: 're_2', amount: 100000 }),
            ],
          },
        },
      },
    })

    expect(supabase.state.refunds.map((r) => r.stripe_refund_id)).toEqual(['re_1', 're_2'])
    expect(supabase.state.orders[0].refund_amount_cents).toBe(300000)
  })

  it('converge quand `charge.refunded` et `refund.updated` parlent du même remboursement', async () => {
    const supabase = fakeSupabase({ orders: [{ ...ORDER }] })

    await handleRefundEvent(supabase, SITE, {
      type: 'charge.refunded',
      data: {
        object: { object: 'charge', id: 'ch_1', refunds: { data: [stripeRefund({ status: 'pending' })] } },
      },
    })
    await handleRefundEvent(supabase, SITE, {
      type: 'refund.updated',
      data: { object: stripeRefund({ status: 'succeeded' }) },
    })

    expect(supabase.state.refunds).toHaveLength(1)
    expect(supabase.state.refunds[0].status).toBe('succeeded')
    expect(supabase.state.orders[0].refund_amount_cents).toBe(450000)
  })

  it('encaisse un rejeu d’événement sans rien dupliquer', async () => {
    const supabase = fakeSupabase({ orders: [{ ...ORDER }] })
    const event = { type: 'refund.updated', data: { object: stripeRefund() } }

    await handleRefundEvent(supabase, SITE, event)
    await handleRefundEvent(supabase, SITE, event)

    expect(supabase.state.refunds).toHaveLength(1)
    expect(supabase.state.orders[0].refund_amount_cents).toBe(450000)
  })

  it('n’explose pas sur un remboursement sans commande rattachable', async () => {
    const supabase = fakeSupabase({ orders: [] })

    await expect(
      handleRefundEvent(supabase, SITE, {
        type: 'refund.updated',
        data: { object: stripeRefund() },
      }),
    ).resolves.toBeUndefined()

    expect(supabase.state.refunds).toHaveLength(0)
  })

  it('ignore un événement sans remboursement exploitable', async () => {
    const supabase = fakeSupabase({ orders: [{ ...ORDER }] })

    await handleRefundEvent(supabase, SITE, {
      type: 'charge.refunded',
      data: { object: { object: 'charge', id: 'ch_1', refunds: { data: [] } } },
    })

    expect(supabase.state.refunds).toHaveLength(0)
  })
})
