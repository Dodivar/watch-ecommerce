/**
 * Remboursements Stripe — création, enregistrement, cache dénormalisé.
 *
 * Le mouvement d'argent reste exécuté par Stripe (c'est lui qui détient les
 * fonds et le mandat carte) mais plus personne n'ouvre son dashboard : le panel
 * déclenche, Stripe exécute, le webhook fait foi.
 *
 * Deux principes portent tout le module :
 *
 * 1. **L'état final vient du webhook, jamais de la réponse HTTP.** Un Refund
 *    Stripe naît `pending` et peut finir `failed` (solde insuffisant, réseau
 *    carte). Écrire « remboursé » depuis la réponse de `refunds.create` mentirait
 *    une fois sur mille — et ce sont les pires cas.
 * 2. **`order_refunds` est la source de vérité, `orders` un cache.** Les colonnes
 *    `refund_amount_cents` / `refunded_at` / `stripe_refund_id` ne tiennent pas
 *    au-delà d'un remboursement : elles sont recalculées à partir des lignes de
 *    détail à chaque événement.
 */

const { randomUUID } = require('node:crypto')

/** Statuts Stripe d'un Refund (`order_refunds.status`). */
const REFUND_STATUSES = ['pending', 'succeeded', 'failed', 'canceled', 'requires_action']

/** Statuts qui immobilisent une partie du total : à déduire du remboursable. */
const PENDING_REFUND_STATUSES = ['pending', 'requires_action']

/** Motifs acceptés par l'API Stripe. `null` = motif libre, stocké côté commande. */
const STRIPE_REFUND_REASONS = ['duplicate', 'fraudulent', 'requested_by_customer']

/**
 * Statut de dossier retour déduit d'un remboursement effectif. Un dossier
 * `rejected` ne redevient pas « remboursée » : c'est un retour refusé puis
 * remboursé pour un autre motif (geste commercial), l'admin tranche.
 */
const REFUNDABLE_RETURN_STATUSES = ['none', 'requested', 'received', 'refunded']

/**
 * Totaux d'un lot de remboursements d'une même commande.
 *
 * `pendingCents` n'est pas du remboursé : c'est de l'argent déjà engagé auprès
 * de Stripe. Le confondre avec du disponible autoriserait un second
 * remboursement du même montant pendant que le premier est en vol.
 *
 * @param {Array<{ amount_cents?: number|null, status?: string|null, refunded_at?: string|null }>} rows
 * @returns {{ succeededCents: number, pendingCents: number, engagedCents: number,
 *   succeededCount: number, lastRefundedAt: string|null }}
 */
function summarizeRefundRows(rows) {
  let succeededCents = 0
  let pendingCents = 0
  let succeededCount = 0
  let lastRefundedAt = null

  for (const row of rows || []) {
    const amount = Number(row?.amount_cents) || 0
    if (row?.status === 'succeeded') {
      succeededCents += amount
      succeededCount += 1
      const at = row?.refunded_at || null
      if (at && (!lastRefundedAt || new Date(at) > new Date(lastRefundedAt))) {
        lastRefundedAt = at
      }
    } else if (PENDING_REFUND_STATUSES.includes(row?.status)) {
      pendingCents += amount
    }
  }

  return {
    succeededCents,
    pendingCents,
    engagedCents: succeededCents + pendingCents,
    succeededCount,
    lastRefundedAt,
  }
}

/**
 * Montant encore remboursable sur une commande.
 * @param {{ total_cents?: number|null }} order
 * @param {Array<object>} refundRows
 * @returns {number}
 */
function refundableCents(order, refundRows) {
  const total = Number(order?.total_cents) || 0
  const { engagedCents } = summarizeRefundRows(refundRows)
  return Math.max(0, total - engagedCents)
}

/**
 * Contrôle une demande de remboursement avant tout appel à Stripe.
 *
 * Fail closed : une commande non payée, sans PaymentIntent, ou un montant qui
 * dépasse le reste à rembourser ne part pas — l'erreur Stripe équivalente
 * arriverait trop tard et serait illisible pour l'admin.
 *
 * @param {{ status?: string, total_cents?: number|null, stripe_payment_intent_id?: string|null }} order
 * @param {Array<object>} refundRows
 * @param {{ amountCents?: number|null }} request
 * @returns {{ ok: boolean, status?: number, error?: string, amountCents?: number }}
 */
function validateRefundRequest(order, refundRows, request) {
  if (!order) {
    return { ok: false, status: 404, error: 'Commande introuvable' }
  }
  if (order.status !== 'paid') {
    return { ok: false, status: 400, error: 'Seule une commande payée peut être remboursée' }
  }
  if (!order.stripe_payment_intent_id) {
    return {
      ok: false,
      status: 400,
      error: 'Aucun paiement Stripe rattaché à cette commande',
    }
  }

  const available = refundableCents(order, refundRows)
  if (available <= 0) {
    return { ok: false, status: 409, error: 'Cette commande est déjà intégralement remboursée' }
  }

  const requested = request?.amountCents == null ? available : Number(request.amountCents)
  if (!Number.isInteger(requested) || requested <= 0) {
    return { ok: false, status: 400, error: 'Montant de remboursement invalide' }
  }
  if (requested > available) {
    return {
      ok: false,
      status: 400,
      error: `Montant supérieur au reste à rembourser (${(available / 100).toFixed(2)} €)`,
    }
  }

  return { ok: true, amountCents: requested }
}

/**
 * Ligne `order_refunds` à partir d'un objet Refund Stripe.
 * @param {object} refund
 * @param {{ siteId: string, orderId: string, source?: string, initiatedBy?: string|null }} context
 */
function mapStripeRefund(refund, { siteId, orderId, source, initiatedBy }) {
  const status = REFUND_STATUSES.includes(refund?.status) ? refund.status : 'pending'
  const metaSource = refund?.metadata?.refund_source
  const resolvedSource =
    source || (metaSource === 'admin_panel' ? 'admin_panel' : 'stripe_dashboard')

  return {
    site_id: siteId,
    order_id: orderId,
    stripe_refund_id: refund.id,
    stripe_payment_intent_id:
      typeof refund?.payment_intent === 'string'
        ? refund.payment_intent
        : refund?.payment_intent?.id || null,
    amount_cents: Number(refund?.amount) || 0,
    currency: refund?.currency || 'eur',
    status,
    reason: refund?.reason || refund?.metadata?.refund_note || null,
    failure_reason: refund?.failure_reason || null,
    source: resolvedSource,
    initiated_by: initiatedBy || refund?.metadata?.initiated_by || null,
    metadata: refund?.metadata || {},
    refunded_at: refund?.created
      ? new Date(refund.created * 1000).toISOString()
      : new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

/**
 * Retrouve la commande visée par un remboursement.
 *
 * Le chemin nominal est `metadata.order_id` (posé par le panel comme par le
 * checkout). Un remboursement fait hors application n'en a pas : on retombe sur
 * le PaymentIntent, seul lien sûr entre Stripe et la commande.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} siteId
 * @param {object} refund
 * @returns {Promise<object|null>}
 */
async function resolveOrderForRefund(supabase, siteId, refund) {
  const orderId = refund?.metadata?.order_id
  if (orderId) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('site_id', siteId)
      .maybeSingle()
    if (error) throw error
    if (data) return data
  }

  const paymentIntentId =
    typeof refund?.payment_intent === 'string'
      ? refund.payment_intent
      : refund?.payment_intent?.id || null
  if (!paymentIntentId) return null

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('site_id', siteId)
    .eq('stripe_payment_intent_id', paymentIntentId)
    .maybeSingle()
  if (error) throw error
  return data || null
}

/**
 * Recalcule le cache de remboursement porté par `orders`.
 *
 * Recalcul complet (jamais d'incrément) : deux événements Stripe concurrents
 * sur la même commande convergent alors vers le même état, et une ligne
 * corrigée a posteriori se propage sans réparation manuelle.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} siteId
 * @param {object} order Ligne `orders` (au moins `id`, `total_cents`, `return_status`)
 * @returns {Promise<{ succeededCents: number, pendingCents: number, isFullyRefunded: boolean }>}
 */
async function recomputeOrderRefundCache(supabase, siteId, order) {
  const { data: rows, error } = await supabase
    .from('order_refunds')
    .select('amount_cents, status, refunded_at, stripe_refund_id')
    .eq('order_id', order.id)
    .order('refunded_at', { ascending: true })
  if (error) throw error

  const summary = summarizeRefundRows(rows || [])
  const succeeded = (rows || []).filter((row) => row.status === 'succeeded')
  const lastRefund = succeeded[succeeded.length - 1] || null

  /** @type {Record<string, unknown>} */
  const update = {
    refund_amount_cents: summary.succeededCents > 0 ? summary.succeededCents : null,
    refunded_at: summary.lastRefundedAt,
    stripe_refund_id: lastRefund?.stripe_refund_id || null,
    updated_at: new Date().toISOString(),
  }

  // Le dossier passe « remboursée » dès qu'un remboursement aboutit : c'est
  // l'information que l'admin cherche dans la liste des commandes. Les dossiers
  // clos autrement (`rejected`) ne sont pas rouverts.
  if (summary.succeededCents > 0 && REFUNDABLE_RETURN_STATUSES.includes(order.return_status)) {
    update.return_status = 'refunded'
  }

  const { error: updateError } = await supabase
    .from('orders')
    .update(update)
    .eq('id', order.id)
    .eq('site_id', siteId)
  if (updateError) throw updateError

  return {
    succeededCents: summary.succeededCents,
    pendingCents: summary.pendingCents,
    isFullyRefunded:
      summary.succeededCents > 0 && summary.succeededCents >= (Number(order.total_cents) || 0),
  }
}

/**
 * Enregistre (ou met à jour) un remboursement Stripe et rafraîchit le cache.
 *
 * Idempotent par `stripe_refund_id` : rejouer un webhook, ou recevoir
 * `charge.refunded` puis `refund.updated` pour le même remboursement, converge
 * sur la même ligne.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {object} site
 * @param {object} refund Objet Refund Stripe
 * @param {{ order?: object|null, source?: string, initiatedBy?: string|null }} [options]
 * @returns {Promise<{ recorded: boolean, order: object|null, row: object|null,
 *   statusChangedTo: string|null, totals: object|null }>}
 */
async function recordStripeRefund(supabase, site, refund, options = {}) {
  if (!refund?.id) {
    return { recorded: false, order: null, row: null, statusChangedTo: null, totals: null }
  }

  const order = options.order || (await resolveOrderForRefund(supabase, site.id, refund))
  if (!order) {
    console.warn(`[${site.id}] Remboursement ${refund.id} sans commande rattachée`)
    return { recorded: false, order: null, row: null, statusChangedTo: null, totals: null }
  }

  const { data: existing, error: existingError } = await supabase
    .from('order_refunds')
    .select('id, status')
    .eq('stripe_refund_id', refund.id)
    .maybeSingle()
  if (existingError) throw existingError

  const row = mapStripeRefund(refund, {
    siteId: site.id,
    orderId: order.id,
    source: options.source,
    initiatedBy: options.initiatedBy,
  })

  const { data: saved, error: saveError } = await supabase
    .from('order_refunds')
    .upsert(row, { onConflict: 'stripe_refund_id' })
    .select()
    .maybeSingle()
  if (saveError) throw saveError

  const totals = await recomputeOrderRefundCache(supabase, site.id, order)

  return {
    recorded: true,
    order,
    row: saved || row,
    // Transition réelle de statut : ce qui décide de l'envoi d'un email au
    // client. Un rejeu de webhook n'en déclenche pas.
    statusChangedTo: existing?.status === row.status ? null : row.status,
    totals,
  }
}

/**
 * Déclenche un remboursement Stripe pour une commande.
 *
 * La clé d'idempotence est obligatoire : sans elle, un double-clic ou un
 * réessai réseau rembourse deux fois. Elle est portée par l'appelant quand il
 * peut la dériver de l'action (bouton du panel), sinon générée ici.
 *
 * @param {object} stripe Client Stripe du site
 * @param {{ order: object, amountCents: number, reason?: string|null,
 *   initiatedBy?: string|null, idempotencyKey?: string|null }} params
 * @returns {Promise<object>} Objet Refund Stripe
 */
async function createStripeRefund(stripe, { order, amountCents, reason, initiatedBy, idempotencyKey }) {
  const normalizedReason = STRIPE_REFUND_REASONS.includes(reason) ? reason : undefined

  return stripe.refunds.create(
    {
      payment_intent: order.stripe_payment_intent_id,
      amount: amountCents,
      ...(normalizedReason ? { reason: normalizedReason } : {}),
      metadata: {
        order_id: String(order.id),
        site_id: String(order.site_id),
        refund_source: 'admin_panel',
        ...(initiatedBy ? { initiated_by: String(initiatedBy) } : {}),
        ...(reason && !normalizedReason ? { refund_note: String(reason).slice(0, 480) } : {}),
      },
    },
    { idempotencyKey: idempotencyKey || randomUUID() },
  )
}

/**
 * Lignes de remboursement d'une commande, les plus récentes d'abord.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} orderId
 */
async function listOrderRefunds(supabase, orderId) {
  const { data, error } = await supabase
    .from('order_refunds')
    .select('*')
    .eq('order_id', orderId)
    .order('refunded_at', { ascending: false })
  if (error) throw error
  return data || []
}

/**
 * Remboursements portés par un événement Stripe.
 *
 * `charge.refunded` livre une charge (dont les remboursements sont imbriqués et
 * plafonnés à dix par l'API), `refund.updated` / `charge.refund.updated` livrent
 * directement un Refund. Au-delà de dix remboursements sur une même charge — un
 * cas qui n'arrive pas en pratique mais qui perdrait silencieusement des lignes —
 * on repasse par l'API.
 *
 * @param {object} eventObject `event.data.object`
 * @param {{ stripe?: object }} [options]
 * @returns {Promise<object[]>}
 */
async function extractRefundsFromEvent(eventObject, options = {}) {
  if (!eventObject) return []
  if (eventObject.object === 'refund') return [eventObject]

  const embedded = eventObject.refunds?.data || []
  if (eventObject.refunds?.has_more && options.stripe && eventObject.id) {
    const page = await options.stripe.refunds.list({ charge: eventObject.id, limit: 100 })
    return page?.data || embedded
  }
  return embedded
}

module.exports = {
  PENDING_REFUND_STATUSES,
  REFUND_STATUSES,
  STRIPE_REFUND_REASONS,
  createStripeRefund,
  extractRefundsFromEvent,
  listOrderRefunds,
  mapStripeRefund,
  recomputeOrderRefundCache,
  recordStripeRefund,
  refundableCents,
  resolveOrderForRefund,
  summarizeRefundRows,
  validateRefundRequest,
}
