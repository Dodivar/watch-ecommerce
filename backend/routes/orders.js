const express = require('express')
const rateLimit = require('express-rate-limit')

const { resolveSite } = require('../middleware/resolveSite')
const { getSupabaseClient, getStripeClient, MissingSecretsError } = require('../utils/siteClients')
const {
  parseCartCheckoutLines,
  validateCartLines,
  linesToRpcPayload,
} = require('../orders/parseCartLines')
const {
  hashOrderAccessToken,
  signOrderAccessToken,
  verifyOrderAccessToken,
} = require('../orders/tokens')
const { buildOrderQuote } = require('../orders/pricing')
const { findShippingMethod, validateHomeAddress } = require('../orders/shipping')
const { loadPromoCode, computeDiscountCents, validatePromoEligibility } = require('../orders/promo')
const { fulfillOrderPayment, releaseOrderReservation, applyRetailStockDecrement } = require('../orders/fulfillment')
const { sendOrderConfirmationEmails } = require('../orders/email')

/**
 * @param {*} registry
 */
function buildOrdersRouter(registry) {
  const router = express.Router()

  const checkoutRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: (req) => (req.site && req.site.secrets?.stripe?.checkoutRateLimitMax) || 30,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, _next, options) => {
      res.status(options.statusCode).json({
        error: 'Trop de requêtes. Réessayez dans quelques instants.',
      })
    },
  })

  function getCheckoutConfig(site) {
    return site.config.checkout || {}
  }

  function getReserveMinutes(site) {
    const n = Number(site.config.checkout?.reserveMinutes)
    return Number.isFinite(n) && n > 0 ? n : 30
  }

  function extractAccessToken(req) {
    const auth = req.headers.authorization
    if (typeof auth === 'string' && auth.startsWith('Bearer ')) {
      return auth.slice(7).trim()
    }
    if (req.query.token) {
      return String(req.query.token)
    }
    return null
  }

  async function loadOrderForSite(supabase, siteId, orderId) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('site_id', siteId)
      .maybeSingle()
    if (error) throw error
    return data
  }

  async function loadOrderLines(supabase, orderId) {
    const { data, error } = await supabase.from('order_lines').select('*').eq('order_id', orderId)
    if (error) throw error
    return data || []
  }

  async function persistQuote(supabase, orderId, quote) {
    const { error } = await supabase
      .from('orders')
      .update({
        subtotal_cents: quote.subtotalCents,
        shipping_cents: quote.shippingCents,
        discount_cents: quote.discountCents,
        total_cents: quote.totalCents,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    if (error) throw error

    if (quote.shippingSnapshot) {
      await supabase.from('order_shipping').upsert({
        order_id: orderId,
        ...quote.shippingSnapshot,
        updated_at: new Date().toISOString(),
      })
    } else {
      await supabase.from('order_shipping').delete().eq('order_id', orderId)
    }

    if (quote.discountSnapshot) {
      await supabase.from('order_discounts').upsert({
        order_id: orderId,
        ...quote.discountSnapshot,
      })
    } else {
      await supabase.from('order_discounts').delete().eq('order_id', orderId)
    }
  }

  async function recalculateAndPersist(supabase, site, order, extra = {}) {
    const lines = await loadOrderLines(supabase, order.id)
    const { data: shippingRow } = await supabase
      .from('order_shipping')
      .select('method_id')
      .eq('order_id', order.id)
      .maybeSingle()
    const { data: discountRow } = await supabase
      .from('order_discounts')
      .select('promo_code')
      .eq('order_id', order.id)
      .maybeSingle()

    const quote = await buildOrderQuote(supabase, {
      siteId: site.id,
      checkoutConfig: getCheckoutConfig(site),
      orderLines: lines,
      shippingMethodId: extra.shippingMethodId ?? shippingRow?.method_id ?? null,
      promoCode: extra.promoCode ?? discountRow?.promo_code ?? null,
      customerEmail: extra.customerEmail ?? order.customer_email,
      country: extra.country,
    })
    await persistQuote(supabase, order.id, quote)
    return { quote, lines }
  }

  function requireOrderAccess(site, order, token) {
    if (!site.secrets.paymentCancelSecret) {
      return { ok: false, status: 503, error: 'Configuration serveur incomplète' }
    }
    if (!token || !verifyOrderAccessToken(site.secrets.paymentCancelSecret, token, order.id)) {
      return { ok: false, status: 403, error: 'Accès refusé' }
    }
    if (order.access_token_hash && hashOrderAccessToken(token) !== order.access_token_hash) {
      return { ok: false, status: 403, error: 'Accès refusé' }
    }
    return { ok: true }
  }

  function orderToResponse(order, lines, quote, accessToken = null) {
    return {
      success: true,
      order: {
        id: order.id,
        status: order.status,
        currency: order.currency,
        customerEmail: order.customer_email,
        customerPhone: order.customer_phone,
        billingAddress: order.billing_address,
        shippingAddress: order.shipping_address,
        expiresAt: order.expires_at,
        paidAt: order.paid_at,
        lines: lines.map((l) => ({
          watchId: l.watch_id,
          name: l.name,
          reference: l.reference,
          unitPriceCents: l.unit_price_cents,
          quantity: l.quantity,
          imageUrl: l.image_url,
        })),
        quote: {
          subtotalCents: quote.subtotalCents,
          shippingCents: quote.shippingCents,
          discountCents: quote.discountCents,
          totalCents: quote.totalCents,
        },
      },
      accessToken,
    }
  }

  router.post('/', resolveSite(registry), checkoutRateLimiter, async (req, res) => {
    const site = req.site
    try {
      const parsed = parseCartCheckoutLines(req.body)
      const validation = validateCartLines(parsed)
      if (!validation.ok) {
        return res.status(validation.status).json({ success: false, error: validation.error })
      }
      const lines = validation.lines
      const watchIds = [...new Set(lines.map((l) => l.watchId))]

      if (!site.secrets.paymentCancelSecret) {
        return res.status(500).json({ success: false, error: 'Configuration serveur incomplète' })
      }

      let supabase
      try {
        supabase = getSupabaseClient(site)
      } catch (e) {
        if (e instanceof MissingSecretsError) {
          return res.status(503).json({ success: false, error: e.message })
        }
        throw e
      }

      const { data: watches, error: watchesError } = await supabase
        .from('watches')
        .select('id, name, reference, price, is_available, is_sold, stock_quantity')
        .in('id', watchIds)

      if (watchesError || !watches || watches.length !== watchIds.length) {
        return res.status(400).json({ success: false, error: 'Une ou plusieurs montres sont introuvables' })
      }

      const byId = new Map(watches.map((w) => [String(w.id), w]))
      for (const line of lines) {
        const w = byId.get(line.watchId)
        if (!w || !w.is_available || w.is_sold) {
          return res.status(400).json({
            success: false,
            error: w ? `La montre « ${w.name} » n'est plus disponible` : 'Montre introuvable',
          })
        }
        if (w.stock_quantity != null && line.quantity > w.stock_quantity) {
          return res.status(400).json({
            success: false,
            error: `Stock insuffisant pour « ${w.name} »`,
          })
        }
      }

      const reserveMinutes = getReserveMinutes(site)
      const expiresAt = new Date(Date.now() + reserveMinutes * 60 * 1000).toISOString()
      const checkoutConfig = getCheckoutConfig(site)
      const currency = (checkoutConfig.currency || 'EUR').toUpperCase()

      const { data: orderRow, error: orderErr } = await supabase
        .from('orders')
        .insert({
          site_id: site.id,
          status: 'draft',
          currency,
          expires_at: expiresAt,
        })
        .select('id')
        .single()

      if (orderErr || !orderRow) {
        console.error(`[${site.id}] create order:`, orderErr)
        return res.status(500).json({ success: false, error: 'Impossible de créer la commande' })
      }

      const orderId = orderRow.id

      const { data: reserved, error: rpcError } = await supabase.rpc('reserve_watches_for_order', {
        p_order_id: orderId,
        p_lines: linesToRpcPayload(lines),
        p_reserve_minutes: reserveMinutes,
      })

      if (rpcError || reserved !== true) {
        await supabase.from('orders').delete().eq('id', orderId)
        const msg =
          rpcError?.message?.includes('function') || rpcError?.code === '42883'
            ? 'Migration SQL requise (reserve_watches_for_order). Voir supabase/migrations.'
            : 'Une ou plusieurs montres ne sont plus disponibles'
        return res.status(rpcError ? 500 : 409).json({ success: false, error: msg })
      }

      const { data: allImages } = await supabase
        .from('watch_images')
        .select('watch_id, image_url, image_path, image_order')
        .in('watch_id', watchIds)
        .order('image_order', { ascending: true })

      const imageByWatch = new Map(watchIds.map((id) => [String(id), null]))
      if (allImages) {
        for (const row of allImages) {
          const wid = String(row.watch_id)
          if (imageByWatch.get(wid) != null) continue
          let url = null
          if (row.image_url) url = row.image_url
          else if (row.image_path) {
            const { data } = supabase.storage.from('watch-images').getPublicUrl(row.image_path)
            url = data.publicUrl
          }
          imageByWatch.set(wid, url)
        }
      }

      const lineRows = lines.map((l) => {
        const w = byId.get(l.watchId)
        return {
          order_id: orderId,
          watch_id: l.watchId,
          name: w.name,
          reference: w.reference || null,
          unit_price_cents: Math.round(w.price * 100),
          quantity: l.quantity,
          image_url: imageByWatch.get(l.watchId),
        }
      })

      const { error: linesErr } = await supabase.from('order_lines').insert(lineRows)
      if (linesErr) {
        await releaseOrderReservation(supabase, orderId)
        await supabase.from('orders').delete().eq('id', orderId)
        return res.status(500).json({ success: false, error: "Impossible d'enregistrer les lignes" })
      }

      const accessToken = signOrderAccessToken(site.secrets.paymentCancelSecret, orderId)
      const tokenHash = hashOrderAccessToken(accessToken)
      await supabase
        .from('orders')
        .update({ access_token_hash: tokenHash })
        .eq('id', orderId)

      const order = await loadOrderForSite(supabase, site.id, orderId)
      const { quote, lines: savedLines } = await recalculateAndPersist(supabase, site, order)

      console.log(`[${site.id}] ✅ Commande draft ${orderId} (${lines.length} ligne(s))`)

      res.status(201).json({
        ...orderToResponse(order, savedLines, quote),
        orderId,
        accessToken,
        expiresAt,
      })
    } catch (err) {
      console.error(`[${site?.id}] POST /orders:`, err)
      res.status(500).json({ success: false, error: err.message || 'Erreur serveur' })
    }
  })

  router.get('/:orderId', resolveSite(registry), async (req, res) => {
    const site = req.site
    const orderId = req.params.orderId
    const token = extractAccessToken(req)
    try {
      const supabase = getSupabaseClient(site)
      const order = await loadOrderForSite(supabase, site.id, orderId)
      if (!order) {
        return res.status(404).json({ success: false, error: 'Commande introuvable' })
      }
      const access = requireOrderAccess(site, order, token)
      if (!access.ok) {
        return res.status(access.status).json({ success: false, error: access.error })
      }
      const { quote, lines } = await recalculateAndPersist(supabase, site, order)
      res.json(orderToResponse(order, lines, quote))
    } catch (e) {
      if (e instanceof MissingSecretsError) {
        return res.status(503).json({ success: false, error: e.message })
      }
      console.error(`[${site.id}] GET order:`, e)
      res.status(500).json({ success: false, error: 'Erreur serveur' })
    }
  })

  router.get('/:orderId/verify', resolveSite(registry), async (req, res) => {
    const site = req.site
    const orderId = req.params.orderId
    const token = extractAccessToken(req)
    try {
      const supabase = getSupabaseClient(site)
      const order = await loadOrderForSite(supabase, site.id, orderId)
      if (!order) {
        return res.json({ valid: false, reason: 'Commande introuvable' })
      }
      const access = requireOrderAccess(site, order, token)
      if (!access.ok) {
        return res.json({ valid: false, reason: access.error })
      }

      // Réconciliation : au retour de Stripe, le webhook payment_intent.succeeded
      // peut ne pas encore être arrivé (latence) voire être indisponible (dev
      // local sans `stripe listen`). On interroge directement le PaymentIntent
      // et on bascule la commande en paid sans attendre le webhook. Idempotent :
      // fulfillOrderPayment ne déclenche les effets de bord que pour l'appelant
      // qui effectue réellement la transition.
      let currentOrder = order
      if (currentOrder.status !== 'paid' && currentOrder.stripe_payment_intent_id) {
        try {
          const stripe = getStripeClient(site)
          const paymentIntent = await stripe.paymentIntents.retrieve(
            currentOrder.stripe_payment_intent_id,
          )
          if (paymentIntent.status === 'succeeded') {
            await handlePaymentIntentSucceeded(supabase, site, paymentIntent)
            currentOrder = await loadOrderForSite(supabase, site.id, orderId)
          }
        } catch (reconcileErr) {
          console.error(`[${site.id}] Réconciliation paiement ${orderId}:`, reconcileErr)
        }
      }

      if (!currentOrder || currentOrder.status !== 'paid') {
        return res.json({ valid: false, reason: 'Paiement non complété' })
      }
      const lines = await loadOrderLines(supabase, orderId)
      const { data: shippingRow } = await supabase
        .from('order_shipping')
        .select('method_type, method_label, metadata')
        .eq('order_id', orderId)
        .maybeSingle()
      res.json({
        valid: true,
        order: {
          id: currentOrder.id,
          status: currentOrder.status,
          totalCents: currentOrder.total_cents,
          customerEmail: currentOrder.customer_email,
          shippingMethodType: shippingRow?.method_type || null,
          shippingMethodLabel: shippingRow?.method_label || null,
          pickupLocation: shippingRow?.metadata?.pickupLocation || null,
        },
        lines,
      })
    } catch (e) {
      console.error(`[${site.id}] verify order:`, e)
      res.json({ valid: false, reason: 'Erreur serveur' })
    }
  })

  router.patch('/:orderId/customer', resolveSite(registry), checkoutRateLimiter, async (req, res) => {
    const site = req.site
    const orderId = req.params.orderId
    const token = extractAccessToken(req)
    const { email, phone, billingAddress } = req.body || {}
    try {
      const supabase = getSupabaseClient(site)
      const order = await loadOrderForSite(supabase, site.id, orderId)
      if (!order) {
        return res.status(404).json({ success: false, error: 'Commande introuvable' })
      }
      const access = requireOrderAccess(site, order, token)
      if (!access.ok) {
        return res.status(access.status).json({ success: false, error: access.error })
      }
      if (!['draft', 'pending_payment'].includes(order.status)) {
        return res.status(400).json({ success: false, error: 'Commande non modifiable' })
      }

      const customerEmail = String(email || '').trim()
      if (!customerEmail) {
        return res.status(400).json({ success: false, error: 'Email requis' })
      }

      await supabase
        .from('orders')
        .update({
          customer_email: customerEmail,
          customer_phone: phone ? String(phone).trim() : null,
          billing_address: billingAddress || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)

      const updated = await loadOrderForSite(supabase, site.id, orderId)
      const { quote, lines } = await recalculateAndPersist(supabase, site, updated, {
        customerEmail,
      })
      res.json(orderToResponse(updated, lines, quote))
    } catch (e) {
      console.error(`[${site.id}] PATCH customer:`, e)
      res.status(500).json({ success: false, error: 'Erreur serveur' })
    }
  })

  router.patch('/:orderId/shipping', resolveSite(registry), checkoutRateLimiter, async (req, res) => {
    const site = req.site
    const orderId = req.params.orderId
    const token = extractAccessToken(req)
    const { methodId, shippingAddress } = req.body || {}
    try {
      const supabase = getSupabaseClient(site)
      const order = await loadOrderForSite(supabase, site.id, orderId)
      if (!order) {
        return res.status(404).json({ success: false, error: 'Commande introuvable' })
      }
      const access = requireOrderAccess(site, order, token)
      if (!access.ok) {
        return res.status(access.status).json({ success: false, error: access.error })
      }
      if (order.status !== 'draft' && order.status !== 'pending_payment') {
        return res.status(400).json({ success: false, error: 'Commande non modifiable' })
      }

      const checkoutConfig = getCheckoutConfig(site)
      const method = findShippingMethod(checkoutConfig, methodId)
      if (!method) {
        return res.status(400).json({ success: false, error: 'Mode de livraison invalide' })
      }

      let addressUpdate = {}
      if (method.type === 'home') {
        const valid = validateHomeAddress(shippingAddress)
        if (!valid.ok) {
          return res.status(400).json({ success: false, error: valid.error })
        }
        addressUpdate = { shipping_address: shippingAddress }
      } else {
        addressUpdate = { shipping_address: null }
      }

      await supabase
        .from('orders')
        .update({ ...addressUpdate, updated_at: new Date().toISOString() })
        .eq('id', orderId)

      const country =
        method.type === 'home'
          ? shippingAddress?.country
          : checkoutConfig.shipping?.defaultCountry

      const updated = await loadOrderForSite(supabase, site.id, orderId)
      const { quote, lines } = await recalculateAndPersist(supabase, site, updated, {
        shippingMethodId: methodId,
        country,
      })
      res.json(orderToResponse(updated, lines, quote))
    } catch (e) {
      console.error(`[${site.id}] PATCH shipping:`, e)
      res.status(500).json({ success: false, error: 'Erreur serveur' })
    }
  })

  router.post('/:orderId/promo', resolveSite(registry), checkoutRateLimiter, async (req, res) => {
    const site = req.site
    const orderId = req.params.orderId
    const token = extractAccessToken(req)
    const { code, remove } = req.body || {}
    try {
      const checkoutConfig = getCheckoutConfig(site)
      if (checkoutConfig.promo?.enabled === false) {
        return res.status(400).json({ success: false, error: 'Codes promo non disponibles' })
      }

      const supabase = getSupabaseClient(site)
      const order = await loadOrderForSite(supabase, site.id, orderId)
      if (!order) {
        return res.status(404).json({ success: false, error: 'Commande introuvable' })
      }
      const access = requireOrderAccess(site, order, token)
      if (!access.ok) {
        return res.status(access.status).json({ success: false, error: access.error })
      }

      if (remove) {
        await supabase.from('order_discounts').delete().eq('order_id', orderId)
      } else {
        const loaded = await loadPromoCode(supabase, site.id, code)
        if (!loaded.ok) {
          return res.status(400).json({ success: false, error: loaded.error })
        }
        const lines = await loadOrderLines(supabase, orderId)
        const subtotal = lines.reduce((s, l) => s + l.unit_price_cents * l.quantity, 0)
        const eligible = await validatePromoEligibility(
          supabase,
          loaded.promo,
          subtotal,
          order.customer_email,
        )
        if (!eligible.ok) {
          return res.status(400).json({ success: false, error: eligible.error })
        }
      }

      const updated = await loadOrderForSite(supabase, site.id, orderId)
      const { quote, lines } = await recalculateAndPersist(supabase, site, updated, {
        promoCode: remove ? null : code,
      })
      res.json(orderToResponse(updated, lines, quote))
    } catch (e) {
      console.error(`[${site.id}] POST promo:`, e)
      res.status(500).json({ success: false, error: 'Erreur serveur' })
    }
  })

  router.post('/:orderId/pay', resolveSite(registry), checkoutRateLimiter, async (req, res) => {
    const site = req.site
    const orderId = req.params.orderId
    const token = extractAccessToken(req)
    try {
      const supabase = getSupabaseClient(site)
      const stripe = getStripeClient(site)
      const order = await loadOrderForSite(supabase, site.id, orderId)
      if (!order) {
        return res.status(404).json({ success: false, error: 'Commande introuvable' })
      }
      const access = requireOrderAccess(site, order, token)
      if (!access.ok) {
        return res.status(access.status).json({ success: false, error: access.error })
      }
      if (!['draft', 'pending_payment'].includes(order.status)) {
        return res.status(400).json({ success: false, error: 'Commande non payable' })
      }

      const { quote, lines } = await recalculateAndPersist(supabase, site, order)
      if (quote.totalCents < 50) {
        return res.status(400).json({ success: false, error: 'Montant invalide' })
      }

      const currency = (order.currency || 'eur').toLowerCase()
      const receiptEmail = order.customer_email ? String(order.customer_email).trim() : null

      let paymentIntent
      if (order.stripe_payment_intent_id) {
        paymentIntent = await stripe.paymentIntents.retrieve(order.stripe_payment_intent_id)
        if (
          paymentIntent.status === 'requires_payment_method' ||
          paymentIntent.status === 'requires_confirmation'
        ) {
          const updatePayload = { amount: quote.totalCents }
          if (receiptEmail) {
            updatePayload.receipt_email = receiptEmail
          }
          paymentIntent = await stripe.paymentIntents.update(
            order.stripe_payment_intent_id,
            updatePayload,
          )
        }
      } else {
        const createPayload = {
          amount: quote.totalCents,
          currency,
          automatic_payment_methods: { enabled: true },
          metadata: {
            order_id: orderId,
            site_id: site.id,
          },
        }
        if (receiptEmail) {
          createPayload.receipt_email = receiptEmail
        }
        paymentIntent = await stripe.paymentIntents.create(createPayload)
      }

      await supabase
        .from('orders')
        .update({
          status: 'pending_payment',
          stripe_payment_intent_id: paymentIntent.id,
          subtotal_cents: quote.subtotalCents,
          shipping_cents: quote.shippingCents,
          discount_cents: quote.discountCents,
          total_cents: quote.totalCents,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)

      res.json({
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        totalCents: quote.totalCents,
      })
    } catch (e) {
      if (e instanceof MissingSecretsError) {
        return res.status(503).json({ success: false, error: e.message })
      }
      console.error(`[${site.id}] POST pay:`, e)
      res.status(500).json({ success: false, error: e.message || 'Erreur paiement' })
    }
  })

  router.post('/:orderId/cancel', resolveSite(registry), checkoutRateLimiter, async (req, res) => {
    const site = req.site
    const orderId = req.params.orderId
    const token = extractAccessToken(req)
    try {
      const supabase = getSupabaseClient(site)
      const order = await loadOrderForSite(supabase, site.id, orderId)
      if (!order) {
        return res.status(404).json({ success: false, error: 'Commande introuvable' })
      }
      const access = requireOrderAccess(site, order, token)
      if (!access.ok) {
        return res.status(access.status).json({ success: false, error: access.error })
      }
      if (order.status === 'paid') {
        return res.status(400).json({ success: false, error: 'Commande déjà payée' })
      }

      await releaseOrderReservation(supabase, orderId)
      await supabase
        .from('orders')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', orderId)

      res.json({ success: true })
    } catch (e) {
      console.error(`[${site.id}] POST cancel:`, e)
      res.status(500).json({ success: false, error: 'Erreur serveur' })
    }
  })

  return router
}

/**
 * Traite payment_intent.succeeded pour une commande (appelé depuis stripe webhook).
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {object} site Registry entry
 * @param {object} paymentIntent
 */
async function handlePaymentIntentSucceeded(supabase, site, paymentIntent) {
  const orderId = paymentIntent.metadata?.order_id
  if (!orderId) {
    console.warn(`[${site.id}] PI sans order_id: ${paymentIntent.id}`)
    return
  }

  const order = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .eq('site_id', site.id)
    .maybeSingle()

  if (order.error) throw order.error
  if (!order.data) {
    throw new Error(`Commande ${orderId} introuvable`)
  }

  if (order.data.status === 'paid') {
    return
  }

  const expected = order.data.total_cents
  if (paymentIntent.amount_received && paymentIntent.amount_received !== expected) {
    console.warn(
      `[${site.id}] Montant PI (${paymentIntent.amount_received}) != commande (${expected})`,
    )
  }

  // fulfillOrderPayment ne renvoie true que pour l'appelant qui effectue
  // réellement la transition -> paid (verrou de ligne atomique). Si false,
  // une autre source (webhook ou réconciliation /verify) a déjà traité la
  // commande : on évite de rejouer les effets de bord non-idempotents.
  const transitioned = await fulfillOrderPayment(supabase, orderId, paymentIntent.id)
  if (!transitioned) {
    return
  }

  await applyRetailStockDecrement(supabase, orderId)

  const { data: discountRow } = await supabase
    .from('order_discounts')
    .select('metadata')
    .eq('order_id', orderId)
    .maybeSingle()

  if (discountRow?.metadata?.promo_code_id) {
    const { data: promo } = await supabase
      .from('promo_codes')
      .select('id, used_count')
      .eq('id', discountRow.metadata.promo_code_id)
      .maybeSingle()
    if (promo) {
      await supabase
        .from('promo_codes')
        .update({ used_count: (promo.used_count || 0) + 1 })
        .eq('id', promo.id)
      await supabase.from('promo_redemptions').insert({
        promo_code_id: promo.id,
        order_id: orderId,
        customer_email: order.data.customer_email,
      })
    }
  }

  const { data: lineRows, error: linesError } = await supabase
    .from('order_lines')
    .select('*')
    .eq('order_id', orderId)

  const { data: refreshedOrder, error: refreshedError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .maybeSingle()

  if (linesError) {
    console.error(`[${site.id}] Erreur chargement lignes commande ${orderId}:`, linesError)
  }
  if (refreshedError) {
    console.error(`[${site.id}] Erreur rechargement commande ${orderId}:`, refreshedError)
  }

  const orderForEmail = refreshedOrder ?? { ...order.data, status: 'paid' }

  try {
    await sendOrderConfirmationEmails(site, orderForEmail, lineRows || [])
  } catch (mailErr) {
    console.error(`[${site.id}] Email commande:`, mailErr)
  }

  console.log(`[${site.id}] ✅ Commande ${orderId} payée (PI ${paymentIntent.id})`)
}

module.exports = {
  buildOrdersRouter,
  handlePaymentIntentSucceeded,
}
