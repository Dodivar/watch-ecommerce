/**
 * Marque une commande comme payée et les montres comme vendues (idempotent via RPC).
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} orderId
 * @param {string|null} paymentIntentId
 */
async function fulfillOrderPayment(supabase, orderId, paymentIntentId) {
  const { data, error } = await supabase.rpc('fulfill_order_payment', {
    p_order_id: orderId,
    p_stripe_payment_intent_id: paymentIntentId || null,
  })
  if (error) {
    throw error
  }
  return data === true
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} orderId
 */
async function releaseOrderReservation(supabase, orderId) {
  const { error } = await supabase.rpc('release_order_reservation', {
    p_order_id: orderId,
  })
  if (error) {
    throw error
  }
}

/**
 * Décrémente stock_quantity pour les catalogues retail après paiement.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} orderId
 */
async function applyRetailStockDecrement(supabase, orderId) {
  const { data: lines, error: linesError } = await supabase
    .from('order_lines')
    .select('watch_id, quantity')
    .eq('order_id', orderId)

  if (linesError) throw linesError
  if (!lines?.length) return

  for (const line of lines) {
    const { data: watch, error: watchError } = await supabase
      .from('watches')
      .select('stock_quantity, is_sold')
      .eq('id', line.watch_id)
      .maybeSingle()

    if (watchError || !watch || watch.stock_quantity == null) continue

    const newStock = Math.max(0, watch.stock_quantity - line.quantity)
    await supabase
      .from('watches')
      .update({
        stock_quantity: newStock,
        is_available: newStock > 0 && !watch.is_sold,
      })
      .eq('id', line.watch_id)
  }
}

module.exports = {
  fulfillOrderPayment,
  releaseOrderReservation,
  applyRetailStockDecrement,
}
