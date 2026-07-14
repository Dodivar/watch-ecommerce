/**
 * Synchronisation PaymentIntent ↔ commande pendant le checkout.
 *
 * Une commande reste modifiable (email, livraison, promo) en statut `draft` ou
 * `pending_payment`. Or le montant du PaymentIntent Stripe est figé au moment de
 * POST /pay : sans synchronisation, une modification postérieure crée un écart
 * entre le total en base et le montant réellement encaissé (fenêtre de
 * sous-paiement). Ces helpers ferment cette fenêtre :
 *
 *   1. `gateOrderEditOnPaymentIntent` — avant toute modification : refuse si le
 *      paiement est verrouillé (processing/succeeded), annule/détache un PI
 *      abandonné (3DS en cours, annulé), sinon renvoie le PI à resynchroniser.
 *   2. `syncPaymentIntentAmount` — après recalcul : aligne le montant du PI sur
 *      le nouveau total.
 *   3. `paymentMatchesOrder` — au webhook : vérification stricte (fail closed)
 *      montant encaissé == total commande avant tout fulfillment.
 */

// Statuts Stripe où le montant du PI peut encore être modifié.
const UPDATABLE_STATUSES = ['requires_payment_method', 'requires_confirmation']
// 3DS en cours : montant non modifiable, mais le PI peut être annulé puis recréé.
const CANCELABLE_STATUSES = ['requires_action']

/**
 * Classifie le statut d'un PaymentIntent vis-à-vis d'une modification de commande.
 * @param {string} status
 * @returns {'updatable'|'cancelable'|'detached'|'locked'}
 */
function classifyPaymentIntentStatus(status) {
  if (UPDATABLE_STATUSES.includes(status)) return 'updatable'
  if (CANCELABLE_STATUSES.includes(status)) return 'cancelable'
  if (status === 'canceled') return 'detached'
  // processing, succeeded, requires_capture, statut inconnu : prudence.
  return 'locked'
}

/**
 * Vérifie que le montant encaissé (et la devise) correspond au total de la
 * commande. Fail closed : un montant absent des deux côtés est un mismatch.
 * @param {{ total_cents?: number|null, currency?: string|null }} order
 * @param {{ amount?: number, amount_received?: number, currency?: string }} paymentIntent
 * @returns {{ ok: boolean, reason?: string, expectedCents: number|null, receivedCents: number|null }}
 */
function paymentMatchesOrder(order, paymentIntent) {
  const expectedCents = typeof order?.total_cents === 'number' ? order.total_cents : null
  const rawReceived = paymentIntent?.amount_received ?? paymentIntent?.amount
  const receivedCents = typeof rawReceived === 'number' ? rawReceived : null

  if (expectedCents === null || receivedCents === null) {
    return { ok: false, reason: 'missing_amount', expectedCents, receivedCents }
  }
  if (receivedCents !== expectedCents) {
    return { ok: false, reason: 'amount_mismatch', expectedCents, receivedCents }
  }

  const orderCurrency = order?.currency ? String(order.currency).toLowerCase() : null
  const piCurrency = paymentIntent?.currency ? String(paymentIntent.currency).toLowerCase() : null
  if (orderCurrency && piCurrency && orderCurrency !== piCurrency) {
    return { ok: false, reason: 'currency_mismatch', expectedCents, receivedCents }
  }

  return { ok: true, expectedCents, receivedCents }
}

/**
 * Détache le PaymentIntent de la commande (le prochain POST /pay en recréera un).
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {{ id: string }} order
 */
async function detachPaymentIntentFromOrder(supabase, order) {
  const { error } = await supabase
    .from('orders')
    .update({ stripe_payment_intent_id: null, updated_at: new Date().toISOString() })
    .eq('id', order.id)
  if (error) throw error
}

/**
 * À appeler AVANT de modifier une commande liée à un PaymentIntent.
 *
 * - Pas de PI → ok, rien à synchroniser.
 * - PI modifiable → ok, renvoie le PI pour aligner son montant après recalcul.
 * - PI en 3DS (requires_action) → annulation du PI + détachement ; ok.
 * - PI annulé → détachement ; ok.
 * - PI verrouillé (processing/succeeded) → refus : la commande n'est plus modifiable.
 *
 * @param {import('stripe').Stripe} stripe
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {{ id: string, stripe_payment_intent_id?: string|null }} order
 * @returns {Promise<{ ok: true, paymentIntent: object|null } | { ok: false, status: number, error: string }>}
 */
async function gateOrderEditOnPaymentIntent(stripe, supabase, order) {
  if (!order?.stripe_payment_intent_id) {
    return { ok: true, paymentIntent: null }
  }

  const paymentIntent = await stripe.paymentIntents.retrieve(order.stripe_payment_intent_id)
  const kind = classifyPaymentIntentStatus(paymentIntent.status)

  if (kind === 'locked') {
    return {
      ok: false,
      status: 409,
      error: 'Paiement en cours ou terminé : commande non modifiable',
    }
  }

  if (kind === 'updatable') {
    return { ok: true, paymentIntent }
  }

  if (kind === 'cancelable') {
    try {
      await stripe.paymentIntents.cancel(paymentIntent.id)
    } catch {
      // Course possible : le client vient de terminer sa 3DS → PI verrouillé.
      return {
        ok: false,
        status: 409,
        error: 'Paiement en cours ou terminé : commande non modifiable',
      }
    }
  }

  // PI annulé (ici ou en amont) : on le détache pour que /pay en recrée un propre.
  await detachPaymentIntentFromOrder(supabase, order)
  return { ok: true, paymentIntent: null }
}

/**
 * Aligne le montant (et l'email de reçu) d'un PaymentIntent modifiable sur le
 * total recalculé de la commande. No-op si tout est déjà à jour.
 * @param {import('stripe').Stripe} stripe
 * @param {{ id: string, amount: number, receipt_email?: string|null }} paymentIntent
 * @param {number} totalCents
 * @param {string|null} [receiptEmail]
 */
async function syncPaymentIntentAmount(stripe, paymentIntent, totalCents, receiptEmail = null) {
  const payload = {}
  if (paymentIntent.amount !== totalCents) {
    payload.amount = totalCents
  }
  if (receiptEmail && paymentIntent.receipt_email !== receiptEmail) {
    payload.receipt_email = receiptEmail
  }
  if (Object.keys(payload).length === 0) {
    return paymentIntent
  }
  return stripe.paymentIntents.update(paymentIntent.id, payload)
}

module.exports = {
  classifyPaymentIntentStatus,
  paymentMatchesOrder,
  gateOrderEditOnPaymentIntent,
  syncPaymentIntentAmount,
}
