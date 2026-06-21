const { resolveReceiptConfig } = require('./receiptBranding')
const { generateOrderReceiptPdf } = require('./receiptPdf')

const RECEIPT_BUCKET = 'order-receipts'

/**
 * @param {string} siteId
 * @param {string} orderId
 * @returns {string}
 */
function buildReceiptStoragePath(siteId, orderId) {
  const safeSiteId = String(siteId).replace(/[^\w-]+/g, '_')
  const safeOrderId = String(orderId).replace(/[^\w-]+/g, '_')
  return `${safeSiteId}/${safeOrderId}/receipt.pdf`
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} storagePath
 * @param {Buffer} pdfBuffer
 */
async function uploadOrderReceiptPdf(supabase, storagePath, pdfBuffer) {
  const { error } = await supabase.storage.from(RECEIPT_BUCKET).upload(storagePath, pdfBuffer, {
    contentType: 'application/pdf',
    cacheControl: '31536000',
    upsert: false,
  })
  if (error) {
    throw error
  }
  return storagePath
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} storagePath
 * @returns {Promise<Buffer|null>}
 */
async function downloadOrderReceiptPdf(supabase, storagePath) {
  const { data, error } = await supabase.storage.from(RECEIPT_BUCKET).download(storagePath)
  if (error || !data) {
    return null
  }
  const arrayBuffer = await data.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

/**
 * Persists a receipt PDF to Storage and updates orders.receipt_storage_path.
 * Idempotent: skips if path already set on the order row.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {object} site Registry entry
 * @param {object} order
 * @param {object[]} lines
 * @param {{ shipping?: object|null, discount?: object|null, pdfBuffer?: Buffer|null }} [extras]
 * @returns {Promise<string|null>} storage path or null
 */
async function persistOrderReceiptPdf(supabase, site, order, lines, extras = {}) {
  if (!resolveReceiptConfig(site).enabled) {
    return null
  }
  if (order.status !== 'paid') {
    return null
  }
  if (order.receipt_storage_path) {
    return order.receipt_storage_path
  }

  const pdfBuffer = extras.pdfBuffer ?? (await generateOrderReceiptPdf(site, order, lines, extras))
  if (!pdfBuffer) {
    return null
  }

  const storagePath = buildReceiptStoragePath(site.id, order.id)
  await uploadOrderReceiptPdf(supabase, storagePath, pdfBuffer)

  const { error: updateError } = await supabase
    .from('orders')
    .update({
      receipt_storage_path: storagePath,
      updated_at: new Date().toISOString(),
    })
    .eq('id', order.id)
    .eq('site_id', site.id)
    .is('receipt_storage_path', null)

  if (updateError) {
    await supabase.storage.from(RECEIPT_BUCKET).remove([storagePath]).catch(() => {})
    throw updateError
  }

  return storagePath
}

/**
 * Loads a stored receipt or generates, persists, and returns a buffer.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {object} site
 * @param {object} order
 * @param {object[]} lines
 * @param {{ shipping?: object|null, discount?: object|null }} [extras]
 * @returns {Promise<Buffer|null>}
 */
async function resolveOrderReceiptPdfBuffer(supabase, site, order, lines, extras = {}) {
  if (!resolveReceiptConfig(site).enabled || order.status !== 'paid') {
    return null
  }

  if (order.receipt_storage_path) {
    const stored = await downloadOrderReceiptPdf(supabase, order.receipt_storage_path)
    if (stored) {
      return stored
    }
  }

  const pdfBuffer = await generateOrderReceiptPdf(site, order, lines, extras)
  if (!pdfBuffer) {
    return null
  }

  try {
    await persistOrderReceiptPdf(supabase, site, order, lines, { ...extras, pdfBuffer })
  } catch (err) {
    console.error(`[${site.id}] persistOrderReceiptPdf ${order.id}:`, err)
  }

  return pdfBuffer
}

module.exports = {
  RECEIPT_BUCKET,
  buildReceiptStoragePath,
  uploadOrderReceiptPdf,
  downloadOrderReceiptPdf,
  persistOrderReceiptPdf,
  resolveOrderReceiptPdfBuffer,
}
