const { linesToRpcPayload } = require('./parseCartLines')

/**
 * Préfixe public Storage Supabase pour résoudre image_path → URL.
 * @param {string | undefined} supabaseUrl
 * @returns {string | null}
 */
function buildWatchImagesPublicPrefix(supabaseUrl) {
  if (!supabaseUrl) return null
  return `${String(supabaseUrl).replace(/\/$/, '')}/storage/v1/object/public/watch-images/`
}

/**
 * @param {unknown} error
 * @returns {{ status: number, message: string, migrationRequired?: boolean }}
 */
function mapCreateDraftOrderError(error) {
  const code = error?.code
  const message = String(error?.message || 'Impossible de créer la commande')

  if (code === '42883' || /create_draft_order/i.test(message)) {
    return {
      status: 500,
      message:
        'Migration SQL requise (create_draft_order). Voir supabase/migrations/20260618120000_create_draft_order_rpc.sql.',
      migrationRequired: true,
    }
  }

  if (code === 'P0001') {
    return { status: 400, message: 'Panier vide' }
  }
  if (code === 'P0002') {
    return { status: 400, message: 'Une ou plusieurs montres sont introuvables' }
  }
  if (code === 'P0003' || code === 'P0004') {
    return { status: 400, message }
  }
  if (code === 'P0005') {
    return { status: 409, message: 'Une ou plusieurs montres ne sont plus disponibles' }
  }

  if (/reserve_watches_for_order/i.test(message)) {
    return {
      status: 500,
      message:
        'Migration SQL requise (reserve_watches_for_order). Voir supabase/migrations.',
      migrationRequired: true,
    }
  }

  return { status: 500, message: 'Impossible de créer la commande' }
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {object} params
 * @param {string} params.siteId
 * @param {string} params.currency
 * @param {string} params.expiresAt
 * @param {number} params.reserveMinutes
 * @param {{ watchId: string, quantity: number }[]} params.lines
 * @param {string | undefined} params.supabaseUrl
 * @returns {Promise<{ order: object, lines: object[], quote: object }>}
 */
async function createDraftOrderViaRpc(supabase, params) {
  const { data, error } = await supabase.rpc('create_draft_order', {
    p_site_id: params.siteId,
    p_currency: params.currency,
    p_expires_at: params.expiresAt,
    p_reserve_minutes: params.reserveMinutes,
    p_lines: linesToRpcPayload(params.lines),
    p_storage_public_prefix: buildWatchImagesPublicPrefix(params.supabaseUrl),
  })

  if (error) {
    const mapped = mapCreateDraftOrderError(error)
    const err = new Error(mapped.message)
    err.status = mapped.status
    err.migrationRequired = mapped.migrationRequired === true
    throw err
  }

  if (!data?.order?.id) {
    const err = new Error('Impossible de créer la commande')
    err.status = 500
    throw err
  }

  return {
    order: data.order,
    lines: Array.isArray(data.lines) ? data.lines : [],
    quote: data.quote || {
      subtotalCents: data.order.subtotal_cents ?? 0,
      shippingCents: 0,
      discountCents: 0,
      totalCents: data.order.total_cents ?? 0,
    },
  }
}

module.exports = {
  buildWatchImagesPublicPrefix,
  mapCreateDraftOrderError,
  createDraftOrderViaRpc,
}
