import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'

const require = createRequire(import.meta.url)
const {
  blockingReason,
  holdsFreshReservation,
  describeBlockedWatches,
  reacquireOrderReservation,
} = require('../../backend/orders/reservation.js')

const ORDER_ID = 'order-1'
const OTHER_ORDER_ID = 'order-2'

function inMinutes(minutes) {
  return new Date(Date.now() + minutes * 60 * 1000).toISOString()
}

/**
 * @param {object[]} watches Lignes `watches` renvoyées par le select.
 * @param {object} [options]
 * @param {boolean | boolean[]} [options.reserveResult] Retour de
 *   `reserve_watches_for_order`, ou la suite des retours pour des appels successifs.
 * @param {object[]} [options.watchesAfterReserve] État relu après une prise échouée.
 */
function createSupabaseMock(watches, options = {}) {
  const calls = { rpc: [], watchSelects: 0 }
  let watchRows = watches
  let reserveCall = 0

  return {
    calls,
    from(table) {
      if (table === 'order_lines') {
        return {
          select: () => ({
            eq: async () => ({
              data: watches.map((w) => ({ watch_id: w.id, quantity: 1 })),
              error: null,
            }),
          }),
        }
      }
      if (table === 'watches') {
        return {
          select: () => ({
            in: async () => {
              calls.watchSelects += 1
              return { data: watchRows, error: null }
            },
          }),
        }
      }
      throw new Error(`Unexpected table: ${table}`)
    },
    async rpc(name, args) {
      calls.rpc.push({ name, args })
      if (name === 'reserve_watches_for_order') {
        if (options.watchesAfterReserve) {
          watchRows = options.watchesAfterReserve
        }
        const configured = options.reserveResult ?? true
        const result = Array.isArray(configured)
          ? (configured[reserveCall] ?? configured[configured.length - 1])
          : configured
        reserveCall += 1
        return { data: result, error: null }
      }
      throw new Error(`Unexpected rpc: ${name}`)
    },
  }
}

/** Montre libre, jamais réservée. */
function freeWatch(id = 'watch-1', name = 'Speedmaster') {
  return {
    id,
    name,
    is_available: true,
    is_sold: false,
    order_id: null,
    checkout_reserved_until: null,
  }
}

describe('blockingReason', () => {
  const now = Date.now()

  it('flags a watch missing from the catalogue', () => {
    expect(blockingReason(undefined, ORDER_ID, now)).toBe('missing')
  })

  it('flags a sold watch', () => {
    expect(blockingReason({ ...freeWatch(), is_sold: true }, ORDER_ID, now)).toBe('sold')
  })

  it('flags a withdrawn watch', () => {
    expect(blockingReason({ ...freeWatch(), is_available: false }, ORDER_ID, now)).toBe(
      'withdrawn',
    )
  })

  it('flags a watch held by another order', () => {
    const row = {
      ...freeWatch(),
      order_id: OTHER_ORDER_ID,
      checkout_reserved_until: inMinutes(20),
    }
    expect(blockingReason(row, ORDER_ID, now)).toBe('reserved')
  })

  it('accepts a watch whose reservation by another order has lapsed', () => {
    const row = {
      ...freeWatch(),
      order_id: OTHER_ORDER_ID,
      checkout_reserved_until: inMinutes(-1),
    }
    expect(blockingReason(row, ORDER_ID, now)).toBeNull()
  })

  it('accepts a watch this order already holds', () => {
    const row = {
      ...freeWatch(),
      order_id: ORDER_ID,
      checkout_reserved_until: inMinutes(20),
    }
    expect(blockingReason(row, ORDER_ID, now)).toBeNull()
  })

  it('ignores stock_quantity, which reserve_watches_for_order does not read', () => {
    const row = { ...freeWatch(), stock_quantity: 0 }
    expect(blockingReason(row, ORDER_ID, now)).toBeNull()
  })
})

describe('holdsFreshReservation', () => {
  const now = Date.now()

  it('is true well before expiry, for this order', () => {
    const row = { ...freeWatch(), order_id: ORDER_ID, checkout_reserved_until: inMinutes(20) }
    expect(holdsFreshReservation(row, ORDER_ID, now)).toBe(true)
  })

  it('is false within the refresh margin', () => {
    const row = { ...freeWatch(), order_id: ORDER_ID, checkout_reserved_until: inMinutes(2) }
    expect(holdsFreshReservation(row, ORDER_ID, now)).toBe(false)
  })

  it('is false for a reservation belonging to another order', () => {
    const row = {
      ...freeWatch(),
      order_id: OTHER_ORDER_ID,
      checkout_reserved_until: inMinutes(20),
    }
    expect(holdsFreshReservation(row, ORDER_ID, now)).toBe(false)
  })
})

describe('describeBlockedWatches', () => {
  it('names a sold watch', () => {
    const message = describeBlockedWatches([{ name: 'Speedmaster', reason: 'sold' }])
    expect(message).toContain('« Speedmaster »')
    expect(message).toContain("vient d'être vendue")
  })

  it('tells the customer to wait when another buyer holds the watch', () => {
    const message = describeBlockedWatches([{ name: 'Submariner', reason: 'reserved' }])
    expect(message).toContain("en cours d'achat")
  })

  it('falls back when the watch has no name left', () => {
    const message = describeBlockedWatches([{ name: null, reason: 'missing' }])
    expect(message).toContain('une montre de votre panier')
  })

  it('stays generic when reasons differ', () => {
    const message = describeBlockedWatches([
      { name: 'A', reason: 'sold' },
      { name: 'B', reason: 'reserved' },
    ])
    expect(message).toContain('« A »')
    expect(message).toContain('« B »')
    expect(message).toContain('ne sont plus disponibles')
  })
})

describe('reacquireOrderReservation', () => {
  it('reserves a free watch and reports the refresh', async () => {
    const supabase = createSupabaseMock([freeWatch()])
    const result = await reacquireOrderReservation(supabase, {
      orderId: ORDER_ID,
      reserveMinutes: 30,
    })

    expect(result).toEqual({ ok: true, refreshed: true })
    expect(supabase.calls.rpc).toHaveLength(1)
    expect(supabase.calls.rpc[0].args).toMatchObject({
      p_order_id: ORDER_ID,
      p_reserve_minutes: 30,
      p_lines: [{ watch_id: 'watch-1', quantity: 1 }],
    })
  })

  it('leaves a still-fresh reservation alone, so /pay does not slide the lock', async () => {
    const supabase = createSupabaseMock([
      { ...freeWatch(), order_id: ORDER_ID, checkout_reserved_until: inMinutes(25) },
    ])
    const result = await reacquireOrderReservation(supabase, {
      orderId: ORDER_ID,
      reserveMinutes: 30,
    })

    expect(result).toEqual({ ok: true, refreshed: false })
    expect(supabase.calls.rpc).toHaveLength(0)
  })

  it('takes over a reservation of its own that is about to lapse', async () => {
    const supabase = createSupabaseMock([
      { ...freeWatch(), order_id: ORDER_ID, checkout_reserved_until: inMinutes(1) },
    ])
    const result = await reacquireOrderReservation(supabase, {
      orderId: ORDER_ID,
      reserveMinutes: 30,
    })

    expect(result).toEqual({ ok: true, refreshed: true })
    expect(supabase.calls.rpc).toHaveLength(1)
  })

  it('refuses payment on a watch sold in the meantime, and names it', async () => {
    const supabase = createSupabaseMock([{ ...freeWatch(), is_sold: true }])
    const result = await reacquireOrderReservation(supabase, {
      orderId: ORDER_ID,
      reserveMinutes: 30,
    })

    expect(result.ok).toBe(false)
    expect(result.blocked).toEqual([
      { watchId: 'watch-1', name: 'Speedmaster', reason: 'sold' },
    ])
    expect(result.error).toContain('« Speedmaster »')
  })

  it('never calls the reserve RPC once a blocker is known', async () => {
    const supabase = createSupabaseMock([
      freeWatch('watch-1', 'Libre'),
      {
        ...freeWatch('watch-2', 'Prise'),
        order_id: OTHER_ORDER_ID,
        checkout_reserved_until: inMinutes(20),
      },
    ])
    const result = await reacquireOrderReservation(supabase, {
      orderId: ORDER_ID,
      reserveMinutes: 30,
    })

    expect(result.ok).toBe(false)
    // La boucle SQL aurait réservé « Libre » avant d'échouer sur « Prise »,
    // attachant à la commande une montre qu'elle ne peut pas payer.
    expect(supabase.calls.rpc).toHaveLength(0)
  })

  it('names the winner when the race is lost between the check and the take', async () => {
    const supabase = createSupabaseMock([freeWatch()], {
      reserveResult: false,
      watchesAfterReserve: [
        {
          ...freeWatch(),
          order_id: OTHER_ORDER_ID,
          checkout_reserved_until: inMinutes(30),
        },
      ],
    })
    const result = await reacquireOrderReservation(supabase, {
      orderId: ORDER_ID,
      reserveMinutes: 30,
    })

    expect(result.ok).toBe(false)
    expect(result.blocked).toEqual([
      { watchId: 'watch-1', name: 'Speedmaster', reason: 'reserved' },
    ])
    expect(supabase.calls.rpc).toHaveLength(1)
  })

  it('retries once rather than refusing when the re-read shows nothing blocking', async () => {
    // L'échec du RPC puis une relecture sans obstacle = la réservation adverse a
    // lapsé entre les deux. Refuser afficherait un faux « indisponible ».
    const supabase = createSupabaseMock([freeWatch()], {
      reserveResult: [false, true],
    })
    const result = await reacquireOrderReservation(supabase, {
      orderId: ORDER_ID,
      reserveMinutes: 30,
    })

    expect(result).toEqual({ ok: true, refreshed: true })
    expect(supabase.calls.rpc).toHaveLength(2)
  })

  it('gives up after the retry also fails', async () => {
    const supabase = createSupabaseMock([freeWatch()], {
      reserveResult: [false, false],
    })
    const result = await reacquireOrderReservation(supabase, {
      orderId: ORDER_ID,
      reserveMinutes: 30,
    })

    expect(result.ok).toBe(false)
    expect(result.blocked).toEqual([])
    expect(result.error).toContain('ne sont plus disponibles')
    expect(supabase.calls.rpc).toHaveLength(2)
  })

  it('repairs the state left by the stale orders sitting in production', async () => {
    // Cas le plus fréquent en base aujourd'hui : `order_id` résiduel d'une
    // vieille commande, réservation expirée depuis des mois.
    const supabase = createSupabaseMock([
      {
        ...freeWatch(),
        order_id: 'order-abandonne-en-mai',
        checkout_reserved_until: inMinutes(-60 * 24 * 90),
      },
    ])
    const result = await reacquireOrderReservation(supabase, {
      orderId: ORDER_ID,
      reserveMinutes: 30,
    })

    expect(result).toEqual({ ok: true, refreshed: true })
    expect(supabase.calls.rpc).toHaveLength(1)
  })

  it('refuses an order with no lines', async () => {
    const supabase = createSupabaseMock([])
    const result = await reacquireOrderReservation(supabase, {
      orderId: ORDER_ID,
      reserveMinutes: 30,
    })

    expect(result.ok).toBe(false)
    expect(result.blocked).toEqual([])
    expect(supabase.calls.rpc).toHaveLength(0)
  })
})
