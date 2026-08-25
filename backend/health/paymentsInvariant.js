/**
 * Invariant métier : « tout PaymentIntent Stripe réussi a sa commande payée ».
 *
 * C'est l'alerte à plus forte valeur du dispositif : elle attrape en une requête
 * tous les modes de panne silencieux où le client est débité sans que la
 * commande existe côté Supabase — endpoint webhook désactivé par Stripe après
 * échecs répétés, `STRIPE_WEBHOOK_SECRET` tourné, régression CORS, RLS modifiée,
 * cold start Render qui dépasse le timeout de livraison. Aucune page d'état
 * fournisseur ne remonte ça : tous les tiers sont « operational » pendant ce
 * temps-là.
 *
 * Deux garde-fous contre le faux positif :
 *   - `graceMinutes` ignore les paiements trop récents (le webhook a le droit
 *     d'arriver quelques secondes après le succès du PaymentIntent) ;
 *   - un PaymentIntent sans `metadata.order_id` n'a pas été créé par le checkout
 *     (paiement manuel depuis le dashboard, Payment Link) : il est compté à part
 *     dans `unknown`, jamais en alerte.
 */

const { getStripeClient, getSupabaseClient, MissingSecretsError } = require('../utils/siteClients')
const { truncateError, withTimeout } = require('./probes')

const DEFAULT_WINDOW_MINUTES = 90
const DEFAULT_GRACE_MINUTES = 5
const DEFAULT_LIMIT = 100
const DEFAULT_MAX_PAYMENTS = 300
const PAID_STATUS = 'paid'

/**
 * @param {object} site
 * @param {{
 *   windowMinutes?: number,
 *   graceMinutes?: number,
 *   limit?: number,
 *   maxPayments?: number,
 *   timeoutMs?: number,
 *   now?: number,
 *   clients?: { stripe?: object, supabase?: object },
 * }} [options]
 * @returns {Promise<object>}
 */
async function checkPaymentsWithoutOrder(site, options = {}) {
  const windowMinutes = options.windowMinutes || DEFAULT_WINDOW_MINUTES
  const graceMinutes = Number.isFinite(options.graceMinutes)
    ? options.graceMinutes
    : DEFAULT_GRACE_MINUTES
  const limit = options.limit || DEFAULT_LIMIT
  const maxPayments = options.maxPayments || DEFAULT_MAX_PAYMENTS
  const now = options.now || Date.now()
  const startedAt = Date.now()

  const windowStart = Math.floor((now - windowMinutes * 60 * 1000) / 1000)
  const graceCutoff = Math.floor((now - graceMinutes * 60 * 1000) / 1000)

  const base = {
    windowMinutes,
    graceMinutes,
    succeeded: 0,
    matched: 0,
    unknown: 0,
    scanned: 0,
    truncated: false,
    orphans: [],
  }

  let stripe
  let supabase
  try {
    // `clients` : injection de test, pour vérifier la logique d'invariant sans
    // toucher aux API tierces.
    stripe = options.clients?.stripe || getStripeClient(site)
    supabase = options.clients?.supabase || getSupabaseClient(site)
  } catch (err) {
    if (err instanceof MissingSecretsError || err?.code === 'MISSING_SECRETS') {
      return { ...base, status: 'not_configured', missing: err.missing || [] }
    }
    return { ...base, status: 'down', error: truncateError(err?.message) }
  }

  try {
    const run = async () => {
      // Stripe renvoie les PaymentIntents du plus récent au plus ancien : sans
      // pagination, une fenêtre chargée tronquerait justement les plus vieux,
      // c'est-à-dire ceux sortis de la période de grâce — les orphelins qu'on
      // cherche. On pagine, et si le plafond est atteint on le dit (`truncated`)
      // plutôt que de laisser croire à une fenêtre complète.
      const pageSize = Math.min(limit, 100)
      const payments = []
      let startingAfter = null
      let truncated = false

      while (true) {
        const params = { created: { gte: windowStart }, limit: pageSize }
        if (startingAfter) params.starting_after = startingAfter
        const page = await stripe.paymentIntents.list(params)
        const rows = page.data || []
        payments.push(...rows)

        if (!page.has_more || rows.length === 0) break
        if (payments.length >= maxPayments) {
          truncated = true
          break
        }
        startingAfter = rows[rows.length - 1].id
      }

      const candidates = payments.filter((pi) => {
        if (pi.status !== 'succeeded') return false
        if (pi.created > graceCutoff) return false
        // Un site ne partage pas sa clé Stripe, mais si cela devait arriver on ne
        // veut pas alerter sur les paiements d'un autre tenant.
        const metaSiteId = pi.metadata?.site_id
        return !metaSiteId || metaSiteId === site.id
      })

      const withOrderId = candidates.filter((pi) => pi.metadata?.order_id)
      const unknown = candidates.length - withOrderId.length

      if (withOrderId.length === 0) {
        return {
          ...base,
          status: 'ok',
          succeeded: candidates.length,
          unknown,
          scanned: payments.length,
          truncated,
        }
      }

      const { data, error } = await supabase
        .from('orders')
        .select('id, status, stripe_payment_intent_id')
        .eq('site_id', site.id)
        .in(
          'stripe_payment_intent_id',
          withOrderId.map((pi) => pi.id),
        )
      if (error) throw new Error(error.message)

      const byPaymentIntent = new Map(
        (data || []).map((order) => [order.stripe_payment_intent_id, order]),
      )

      const orphans = []
      let matched = 0
      for (const pi of withOrderId) {
        const order = byPaymentIntent.get(pi.id)
        if (order && order.status === PAID_STATUS) {
          matched += 1
          continue
        }
        orphans.push({
          paymentIntentId: pi.id,
          createdAt: new Date(pi.created * 1000).toISOString(),
          amount: pi.amount,
          currency: pi.currency,
          orderId: order?.id ?? pi.metadata?.order_id ?? null,
          orderStatus: order?.status ?? null,
          reason: order ? 'order_not_paid' : 'no_order',
        })
      }

      return {
        ...base,
        status: orphans.length > 0 ? 'alert' : 'ok',
        succeeded: candidates.length,
        matched,
        unknown,
        scanned: payments.length,
        truncated,
        orphans,
      }
    }

    const result = await withTimeout(
      run(),
      options.timeoutMs || 10000,
      `paymentsInvariant:${site.id}`,
    )
    return { ...result, durationMs: Date.now() - startedAt }
  } catch (err) {
    return {
      ...base,
      status: 'down',
      error: truncateError(err?.message),
      durationMs: Date.now() - startedAt,
    }
  }
}

/**
 * Statut global : une alerte sur un site suffit à alerter.
 * @param {Record<string, { status: string }>} sites
 * @returns {'ok'|'alert'|'down'}
 */
function aggregatePaymentsStatus(sites) {
  const statuses = Object.values(sites).map((site) => site.status)
  if (statuses.includes('alert')) return 'alert'
  if (statuses.includes('down')) return 'down'
  return 'ok'
}

/**
 * Passe l'invariant sur tous les sites du registre.
 * @param {{ list(): object[] }} registry
 * @param {object} [options] Voir `checkPaymentsWithoutOrder`, plus `siteId`.
 */
async function runPaymentsInvariant(registry, options = {}) {
  const all = registry.list()
  const targets = options.siteId ? all.filter((site) => site.id === options.siteId) : all
  const results = await Promise.all(
    targets.map((site) => checkPaymentsWithoutOrder(site, options)),
  )

  /** @type {Record<string, object>} */
  const sites = {}
  targets.forEach((site, index) => {
    sites[site.id] = results[index]
  })

  return {
    status: aggregatePaymentsStatus(sites),
    checkedAt: new Date().toISOString(),
    sites,
  }
}

module.exports = {
  DEFAULT_GRACE_MINUTES,
  DEFAULT_MAX_PAYMENTS,
  DEFAULT_LIMIT,
  DEFAULT_WINDOW_MINUTES,
  aggregatePaymentsStatus,
  checkPaymentsWithoutOrder,
  runPaymentsInvariant,
}
