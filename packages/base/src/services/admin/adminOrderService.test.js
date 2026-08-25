import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../supabase', () => ({ supabase: { from: vi.fn() } }))

vi.mock('./adminSiteContext.js', () => ({
  getAdminSiteId: () => 'sauvage-watches',
}))

import { supabase } from '../supabase'
import {
  getOrderActionCountsForAdmin,
  getOrdersForAdmin,
  getReturnStatsForAdmin,
  updateOrderReturn,
} from './adminOrderService.js'

/**
 * Faux query builder PostgREST : chaque méthode se chaîne et est enregistrée,
 * l'objet lui-même est thenable pour répondre au `await` final.
 * @param {object} result - Ce que résout la requête (`{ data, error, count }`).
 */
function createQuery(result) {
  const calls = []
  const query = {
    calls,
    /** @param {(value: unknown) => unknown} resolve */
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
  }
  const methods = ['select', 'eq', 'in', 'or', 'order', 'range', 'gte', 'lt', 'not', 'update']
  for (const method of methods) {
    query[method] = vi.fn((...args) => {
      calls.push([method, ...args])
      return query
    })
  }
  return query
}

/** @param {...object} queries - Une requête par appel à `supabase.from()`, dans l'ordre. */
function stubQueries(...queries) {
  const queue = [...queries]
  supabase.from.mockImplementation(() => queue.shift())
  return queries
}

/** @param {object} query @param {string} method */
function callsTo(query, method) {
  return query.calls.filter(([name]) => name === method).map(([, ...args]) => args)
}

const orderRow = {
  id: 'order-1',
  site_id: 'sauvage-watches',
  status: 'paid',
  total_cents: 450000,
  paid_at: '2026-08-01T10:00:00.000Z',
  stripe_payment_intent_id: 'pi_3ABC123def',
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getOrdersForAdmin', () => {
  it('traite `open` comme les dossiers de retour encore ouverts', async () => {
    const [query] = stubQueries(createQuery({ data: [], error: null, count: 0 }))

    await getOrdersForAdmin({ returnStatus: 'open' })

    expect(callsTo(query, 'in')).toEqual([['return_status', ['requested', 'received']]])
    expect(callsTo(query, 'eq')).not.toContainEqual(['return_status', 'open'])
  })

  it('filtre sur un statut de retour précis', async () => {
    const [query] = stubQueries(createQuery({ data: [], error: null, count: 0 }))

    await getOrdersForAdmin({ returnStatus: 'refunded' })

    expect(callsTo(query, 'eq')).toContainEqual(['return_status', 'refunded'])
    expect(callsTo(query, 'in')).toEqual([])
  })

  it('ne filtre pas sur le retour quand aucun statut n’est demandé', async () => {
    const [query] = stubQueries(createQuery({ data: [], error: null, count: 0 }))

    await getOrdersForAdmin()

    expect(callsTo(query, 'in')).toEqual([])
    expect(callsTo(query, 'eq').map(([column]) => column)).not.toContain('return_status')
  })

  it('mappe les champs retour / remboursement d’une commande', async () => {
    stubQueries(
      createQuery({
        data: [
          {
            ...orderRow,
            delivered_at: '2026-08-05T10:00:00.000Z',
            return_status: 'refunded',
            return_requested_at: '2026-08-08T10:00:00.000Z',
            return_notes: 'Bracelet non conforme',
            refund_amount_cents: 450000,
            refunded_at: '2026-08-12T10:00:00.000Z',
            stripe_refund_id: 're_3XYZ789ghi',
          },
        ],
        error: null,
        count: 1,
      }),
    )

    const { orders } = await getOrdersForAdmin()

    expect(orders[0]).toMatchObject({
      stripePaymentIntentId: 'pi_3ABC123def',
      deliveredAt: '2026-08-05T10:00:00.000Z',
      returnStatus: 'refunded',
      returnRequestedAt: '2026-08-08T10:00:00.000Z',
      returnNotes: 'Bracelet non conforme',
      refundAmountCents: 450000,
      refundedAt: '2026-08-12T10:00:00.000Z',
      stripeRefundId: 're_3XYZ789ghi',
    })
  })

  it('donne un dossier vide aux commandes d’avant la migration', async () => {
    stubQueries(createQuery({ data: [orderRow], error: null, count: 1 }))

    const { orders } = await getOrdersForAdmin()

    expect(orders[0].returnStatus).toBe('none')
    expect(orders[0].returnNotes).toBe('')
    expect(orders[0].refundAmountCents).toBeNull()
  })

  it('conserve un remboursement de 0 € sans le confondre avec « non renseigné »', async () => {
    stubQueries(
      createQuery({ data: [{ ...orderRow, refund_amount_cents: 0 }], error: null, count: 1 }),
    )

    const { orders } = await getOrdersForAdmin()

    expect(orders[0].refundAmountCents).toBe(0)
  })
})

describe('updateOrderReturn', () => {
  it('écrit le dossier sur la commande du site courant', async () => {
    const [query] = stubQueries(createQuery({ error: null }))

    await updateOrderReturn(
      'order-1',
      {
        returnStatus: 'refunded',
        deliveredAt: '2026-08-05T10:00:00.000Z',
        returnRequestedAt: '2026-08-08T10:00:00.000Z',
        refundAmountCents: 450000,
        refundedAt: '2026-08-12T10:00:00.000Z',
        stripeRefundId: '  re_3XYZ789ghi  ',
        returnNotes: '  Bracelet non conforme  ',
      },
      { totalCents: 450000 },
    )

    const [payload] = callsTo(query, 'update')[0]
    expect(payload).toMatchObject({
      return_status: 'refunded',
      delivered_at: '2026-08-05T10:00:00.000Z',
      return_requested_at: '2026-08-08T10:00:00.000Z',
      refund_amount_cents: 450000,
      refunded_at: '2026-08-12T10:00:00.000Z',
      // Saisi au clavier depuis le dashboard Stripe : les espaces parasites
      // sont fréquents et casseraient la recherche par identifiant.
      stripe_refund_id: 're_3XYZ789ghi',
      return_notes: 'Bracelet non conforme',
    })
    expect(payload.updated_at).toEqual(expect.any(String))
    expect(callsTo(query, 'eq')).toEqual([
      ['id', 'order-1'],
      ['site_id', 'sauvage-watches'],
    ])
  })

  it('vide les champs non renseignés plutôt que d’écrire des chaînes vides', async () => {
    const [query] = stubQueries(createQuery({ error: null }))

    await updateOrderReturn('order-1', { returnStatus: 'none', stripeRefundId: '', returnNotes: '   ' })

    const [payload] = callsTo(query, 'update')[0]
    expect(payload.stripe_refund_id).toBeNull()
    expect(payload.return_notes).toBeNull()
    expect(payload.delivered_at).toBeNull()
    expect(payload.refund_amount_cents).toBeNull()
  })

  it('refuse un dossier remboursé sans montant, avant tout appel Supabase', async () => {
    await expect(
      updateOrderReturn('order-1', { returnStatus: 'refunded', refundAmountCents: null }),
    ).rejects.toThrow(/montant/i)

    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('refuse un remboursement supérieur au total de la commande', async () => {
    await expect(
      updateOrderReturn(
        'order-1',
        { returnStatus: 'refunded', refundAmountCents: 460000 },
        { totalCents: 450000 },
      ),
    ).rejects.toThrow(/dépasse/i)

    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('remonte l’erreur Supabase', async () => {
    stubQueries(createQuery({ error: { message: 'permission denied for table orders' } }))

    await expect(
      updateOrderReturn('order-1', { returnStatus: 'requested' }),
    ).rejects.toThrow('permission denied for table orders')
  })
})

describe('getOrderActionCountsForAdmin', () => {
  it('compte les retours en attente de remboursement', async () => {
    const [, , returnsQuery] = stubQueries(
      createQuery({ count: 2, error: null }),
      createQuery({ count: 1, error: null }),
      createQuery({ count: 3, error: null }),
    )

    const counts = await getOrderActionCountsForAdmin()

    expect(counts).toEqual({
      pendingFulfillmentCount: 2,
      pendingPaymentCount: 1,
      openReturnCount: 3,
    })
    expect(callsTo(returnsQuery, 'in')).toEqual([['return_status', ['requested', 'received']]])
  })

  it('remonte une erreur sur le comptage des retours', async () => {
    stubQueries(
      createQuery({ count: 0, error: null }),
      createQuery({ count: 0, error: null }),
      createQuery({ count: null, error: { message: 'timeout' } }),
    )

    await expect(getOrderActionCountsForAdmin()).rejects.toThrow('timeout')
  })
})

describe('getReturnStatsForAdmin', () => {
  const refundedRow = {
    total_cents: 100000,
    return_status: 'refunded',
    return_requested_at: '2026-08-01T10:00:00.000Z',
    refund_amount_cents: 90000,
    refunded_at: '2026-08-05T10:00:00.000Z',
  }

  it('agrège les colonnes retour des commandes payées', async () => {
    stubQueries(createQuery({ data: [refundedRow, { total_cents: 50000 }], error: null }))

    const stats = await getReturnStatsForAdmin()

    expect(stats.paidOrderCount).toBe(2)
    expect(stats.refundedCount).toBe(1)
    expect(stats.refundedAmountCents).toBe(90000)
    expect(stats.byStatus.none).toBe(1)
  })

  it('borne la fenêtre sur `paid_at`, comme le chiffre d’affaires', async () => {
    const [query] = stubQueries(createQuery({ data: [], error: null }))

    await getReturnStatsForAdmin({ days: 30 })

    expect(callsTo(query, 'eq')).toContainEqual(['status', 'paid'])
    expect(callsTo(query, 'gte').map(([column]) => column)).toEqual(['paid_at'])
  })

  it('ne filtre pas sur la date quand aucune période n’est demandée', async () => {
    const [query] = stubQueries(createQuery({ data: [], error: null }))

    await getReturnStatsForAdmin()

    expect(callsTo(query, 'gte')).toEqual([])
  })

  it('remonte l’erreur PostgREST', async () => {
    stubQueries(createQuery({ data: null, error: { message: 'colonne inconnue' } }))

    await expect(getReturnStatsForAdmin()).rejects.toThrow('colonne inconnue')
  })
})
