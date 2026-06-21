import { createRequire } from 'node:module'
import { describe, expect, it, vi } from 'vitest'

const require = createRequire(import.meta.url)
const {
  buildReceiptStoragePath,
  persistOrderReceiptPdf,
  RECEIPT_BUCKET,
} = require('../../backend/orders/receiptStorage.js')

const mockSite = {
  id: 'place-des-montres',
  config: { raw: { receipt: { enabled: true } } },
}

function createSupabaseMock({ order, uploadError = null, updateError = null } = {}) {
  const uploadMock = vi.fn(async () => {
    if (uploadError) throw uploadError
    return { data: { path: 'ok' }, error: null }
  })
  const removeMock = vi.fn(async () => ({ data: [], error: null }))

  const supabase = {
    storage: {
      from(bucket) {
        expect(bucket).toBe(RECEIPT_BUCKET)
        return {
          upload: uploadMock,
          remove: removeMock,
        }
      },
    },
    from(table) {
      if (table !== 'orders') {
        throw new Error(`Unexpected table: ${table}`)
      }
      return {
        update(payload) {
          return {
            eq(_col, _val) {
              return {
                eq(_col2, _val2) {
                  return {
                    is(_col3, _val3) {
                      return (async () => {
                        if (updateError) {
                          return { error: updateError }
                        }
                        order.receipt_storage_path = payload.receipt_storage_path
                        return { error: null }
                      })()
                    },
                  }
                },
              }
            },
          }
        },
      }
    },
    _uploadMock: uploadMock,
  }

  return supabase
}

describe('receiptStorage', () => {
  it('builds a site-scoped storage path', () => {
    expect(buildReceiptStoragePath('place-des-montres', 'abc-123')).toBe(
      'place-des-montres/abc-123/receipt.pdf',
    )
  })

  it('sanitizes unsafe characters in storage paths', () => {
    expect(buildReceiptStoragePath('site/with spaces', 'order?id=1')).toBe(
      'site_with_spaces/order_id_1/receipt.pdf',
    )
  })

  it('skips upload when receipt_storage_path is already set', async () => {
    const order = {
      id: 'order-1',
      status: 'paid',
      receipt_storage_path: 'place-des-montres/order-1/receipt.pdf',
    }
    const supabase = createSupabaseMock({ order })

    const path = await persistOrderReceiptPdf(supabase, mockSite, order, [], {
      pdfBuffer: Buffer.from('pdf'),
    })

    expect(path).toBe('place-des-montres/order-1/receipt.pdf')
    expect(supabase._uploadMock).not.toHaveBeenCalled()
  })

  it('uploads and persists path when no stored receipt exists', async () => {
    const order = { id: 'order-2', status: 'paid', receipt_storage_path: null }
    const supabase = createSupabaseMock({ order })
    const pdfBuffer = Buffer.from('fake-pdf')

    const path = await persistOrderReceiptPdf(supabase, mockSite, order, [], { pdfBuffer })

    expect(path).toBe('place-des-montres/order-2/receipt.pdf')
    expect(supabase._uploadMock).toHaveBeenCalledWith(
      'place-des-montres/order-2/receipt.pdf',
      pdfBuffer,
      expect.objectContaining({ contentType: 'application/pdf', upsert: false }),
    )
    expect(order.receipt_storage_path).toBe('place-des-montres/order-2/receipt.pdf')
  })

  it('returns null when receipt is disabled for the site', async () => {
    const order = { id: 'order-3', status: 'paid', receipt_storage_path: null }
    const supabase = createSupabaseMock({ order })
    const disabledSite = {
      id: 'demo',
      config: { raw: { receipt: { enabled: false } } },
    }

    const path = await persistOrderReceiptPdf(supabase, disabledSite, order, [], {
      pdfBuffer: Buffer.from('pdf'),
    })

    expect(path).toBeNull()
    expect(supabase._uploadMock).not.toHaveBeenCalled()
  })
})
