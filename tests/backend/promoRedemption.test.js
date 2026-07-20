import { createRequire } from 'node:module'
import { describe, expect, it, vi } from 'vitest'

const require = createRequire(import.meta.url)
const { redeemPromoCode } = require('../../backend/orders/promo.js')

const params = {
  promoCodeId: 'promo-1',
  orderId: 'order-1',
  customerEmail: 'client@example.com',
}

function createRpcSupabaseMock({ rpcData = true, rpcError = null } = {}) {
  const calls = { rpc: [], update: [], insert: [] }
  const supabase = {
    rpc: async (name, args) => {
      calls.rpc.push([name, args])
      return { data: rpcError ? null : rpcData, error: rpcError }
    },
    from(table) {
      if (table === 'promo_codes') {
        return {
          select() {
            return {
              eq: () => ({
                maybeSingle: async () => ({
                  data: { id: 'promo-1', used_count: 3 },
                  error: null,
                }),
              }),
            }
          },
          update(payload) {
            calls.update.push(payload)
            return { eq: async () => ({ error: null }) }
          },
        }
      }
      if (table === 'promo_redemptions') {
        return {
          insert: async (payload) => {
            calls.insert.push(payload)
            return { error: null }
          },
        }
      }
      throw new Error(`Unexpected table: ${table}`)
    },
  }
  return { supabase, calls }
}

describe('redeemPromoCode', () => {
  it('passe par la RPC atomique et renvoie true quand elle comptabilise', async () => {
    const { supabase, calls } = createRpcSupabaseMock({ rpcData: true })
    await expect(redeemPromoCode(supabase, params)).resolves.toBe(true)
    expect(calls.rpc).toEqual([
      [
        'redeem_promo_code',
        {
          p_promo_code_id: 'promo-1',
          p_order_id: 'order-1',
          p_customer_email: 'client@example.com',
        },
      ],
    ])
    // Pas de repli legacy quand la RPC répond.
    expect(calls.update).toHaveLength(0)
    expect(calls.insert).toHaveLength(0)
  })

  it('renvoie false quand la commande est déjà comptabilisée (rejeu webhook)', async () => {
    const { supabase } = createRpcSupabaseMock({ rpcData: false })
    await expect(redeemPromoCode(supabase, params)).resolves.toBe(false)
  })

  it('propage les erreurs RPC autres que « fonction absente »', async () => {
    const rpcError = { code: '42501', message: 'permission denied' }
    const { supabase } = createRpcSupabaseMock({ rpcError })
    await expect(redeemPromoCode(supabase, params)).rejects.toEqual(rpcError)
  })

  it('retombe sur le chemin legacy quand la RPC est absente (PGRST202)', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const rpcError = { code: 'PGRST202', message: 'function not found' }
      const { supabase, calls } = createRpcSupabaseMock({ rpcError })

      await expect(redeemPromoCode(supabase, params)).resolves.toBe(true)
      expect(calls.update).toEqual([{ used_count: 4 }])
      expect(calls.insert).toEqual([
        {
          promo_code_id: 'promo-1',
          order_id: 'order-1',
          customer_email: 'client@example.com',
        },
      ])
      expect(warnSpy).toHaveBeenCalled()
    } finally {
      warnSpy.mockRestore()
    }
  })
})
