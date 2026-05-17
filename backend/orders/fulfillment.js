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

module.exports = {
  fulfillOrderPayment,
  releaseOrderReservation,
}
