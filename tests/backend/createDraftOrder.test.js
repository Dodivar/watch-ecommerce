import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'

const require = createRequire(import.meta.url)
const {
  buildWatchImagesPublicPrefix,
  mapCreateDraftOrderError,
  createDraftOrderViaRpc,
} = require('../../backend/orders/createDraftOrder.js')

describe('buildWatchImagesPublicPrefix', () => {
  it('builds the public storage prefix from the Supabase URL', () => {
    expect(buildWatchImagesPublicPrefix('https://abc.supabase.co/')).toBe(
      'https://abc.supabase.co/storage/v1/object/public/watch-images/',
    )
  })

  it('returns null when the URL is missing', () => {
    expect(buildWatchImagesPublicPrefix(undefined)).toBeNull()
  })
})

describe('mapCreateDraftOrderError', () => {
  it('maps stock and availability errors to 400', () => {
    expect(
      mapCreateDraftOrderError({
        code: 'P0003',
        message: 'La montre « Submariner » n\'est plus disponible',
      }),
    ).toEqual({
      status: 400,
      message: 'La montre « Submariner » n\'est plus disponible',
    })
  })

  it('maps reservation conflicts to 409', () => {
    expect(mapCreateDraftOrderError({ code: 'P0005', message: 'x' })).toEqual({
      status: 409,
      message: 'Une ou plusieurs montres ne sont plus disponibles',
    })
  })

  it('flags missing RPC migrations', () => {
    expect(mapCreateDraftOrderError({ code: '42883', message: 'function create_draft_order() does not exist' }))
      .toMatchObject({
        status: 500,
        migrationRequired: true,
      })
  })
})

describe('createDraftOrderViaRpc', () => {
  it('returns parsed order payload from the RPC', async () => {
    const supabase = {
      rpc: async () => ({
        data: {
          order: { id: 'order-1', status: 'draft', subtotal_cents: 120000, total_cents: 120000 },
          lines: [{ watch_id: 'watch-1', quantity: 1, unit_price_cents: 120000 }],
          quote: { subtotalCents: 120000, shippingCents: 0, discountCents: 0, totalCents: 120000 },
        },
        error: null,
      }),
    }

    await expect(
      createDraftOrderViaRpc(supabase, {
        siteId: 'demo',
        currency: 'EUR',
        expiresAt: '2026-06-18T12:00:00.000Z',
        reserveMinutes: 30,
        lines: [{ watchId: 'watch-1', quantity: 1 }],
        supabaseUrl: 'https://abc.supabase.co',
      }),
    ).resolves.toEqual({
      order: { id: 'order-1', status: 'draft', subtotal_cents: 120000, total_cents: 120000 },
      lines: [{ watch_id: 'watch-1', quantity: 1, unit_price_cents: 120000 }],
      quote: { subtotalCents: 120000, shippingCents: 0, discountCents: 0, totalCents: 120000 },
    })
  })

  it('throws typed errors from Supabase RPC failures', async () => {
    const supabase = {
      rpc: async () => ({
        data: null,
        error: { code: 'P0004', message: 'Stock insuffisant pour « Speedmaster »' },
      }),
    }

    await expect(
      createDraftOrderViaRpc(supabase, {
        siteId: 'demo',
        currency: 'EUR',
        expiresAt: '2026-06-18T12:00:00.000Z',
        reserveMinutes: 30,
        lines: [{ watchId: 'watch-1', quantity: 2 }],
      }),
    ).rejects.toMatchObject({
      status: 400,
      message: 'Stock insuffisant pour « Speedmaster »',
    })
  })
})
