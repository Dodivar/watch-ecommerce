import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'

const require = createRequire(import.meta.url)
const { applyRetailStockDecrement } = require('../../backend/orders/fulfillment.js')

function createSupabaseMock({ updateError = null } = {}) {
  return {
    from(table) {
      if (table === 'order_lines') {
        return {
          select() {
            return {
              eq: async () => ({
                data: [{ watch_id: 'watch-1', quantity: 1 }],
                error: null,
              }),
            }
          },
        }
      }

      if (table === 'watches') {
        return {
          select() {
            return {
              eq: () => ({
                maybeSingle: async () => ({
                  data: { stock_quantity: 3, is_sold: false },
                  error: null,
                }),
              }),
            }
          },
          update() {
            return {
              eq: async () => ({ error: updateError }),
            }
          },
        }
      }

      throw new Error(`Unexpected table: ${table}`)
    },
  }
}

describe('applyRetailStockDecrement', () => {
  it('throws when the stock update fails', async () => {
    const dbError = { message: 'update failed', code: '42501' }
    const supabase = createSupabaseMock({ updateError: dbError })

    await expect(applyRetailStockDecrement(supabase, 'order-1')).rejects.toEqual(dbError)
  })

  it('completes when the stock update succeeds', async () => {
    const supabase = createSupabaseMock()

    await expect(applyRetailStockDecrement(supabase, 'order-1')).resolves.toBeUndefined()
  })
})
