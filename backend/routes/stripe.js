const express = require('express')
const rateLimit = require('express-rate-limit')

const { getBaseUrl } = require('../utils/getBaseUrl')
const {
  signPaymentCancelToken,
  verifyPaymentCancelToken,
  signPaymentCancelCartToken,
  verifyPaymentCancelCartToken,
} = require('../utils/paymentCancelToken')
const {
  getStripeClient,
  getSupabaseClient,
  MissingSecretsError,
} = require('../utils/siteClients')
const { resolveSite, resolveSiteFromRequest } = require('../middleware/resolveSite')

const RESERVE_MINUTES = 30
/** Nombre max de références différentes par commande panier. */
const MAX_CART_CHECKOUT_LINES = 10
/** Nombre max d’unités (somme des quantités) par commande panier. */
const MAX_CART_CHECKOUT_UNITS = 10

/**
 * Normalise le corps de requête panier : `lines` [{ watchId, quantity }] ou legacy `watchIds` (quantité 1 par id, répétitions additionnées).
 * @param {unknown} body
 * @returns {{ watchId: string, quantity: number }[]}
 */
function parseCartCheckoutLines(body) {
  const linesRaw = body?.lines
  if (Array.isArray(linesRaw) && linesRaw.length > 0) {
    const acc = new Map()
    for (const row of linesRaw) {
      const wid = String(row?.watchId ?? '').trim()
      if (!wid) continue
      const q = Math.min(99, Math.max(1, parseInt(String(row?.quantity), 10) || 1))
      acc.set(wid, (acc.get(wid) || 0) + q)
    }
    return [...acc.entries()].map(([watchId, quantity]) => ({ watchId, quantity }))
  }
  const rawIds = body?.watchIds
  if (!Array.isArray(rawIds)) {
    return []
  }
  const acc = new Map()
  for (const x of rawIds) {
    const wid = String(x).trim()
    if (!wid) continue
    acc.set(wid, (acc.get(wid) || 0) + 1)
  }
  return [...acc.entries()].map(([watchId, quantity]) => ({ watchId, quantity }))
}

/**
 * @param {Record<string, unknown>} session
 * @returns {string[]}
 */
function parseWatchIdsFromSessionMetadata(session) {
  const m = session.metadata || {}
  if (m.watch_ids != null && String(m.watch_ids).trim() !== '') {
    return String(m.watch_ids)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  }
  if (m.watch_id != null && String(m.watch_id).trim() !== '') {
    return [String(m.watch_id).trim()]
  }
  return []
}

/**
 * @param {*} registry Registry des sites (pour permettre la résolution par :siteId dans le webhook).
 */
function buildStripeRouter(registry) {
  const router = express.Router()

  const checkoutRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    // Le max est calculé par requête à partir des secrets du site.
    max: (req) => {
      const site = req.site
      return (site && site.secrets?.stripe?.checkoutRateLimitMax) || 30
    },
    standardHeaders: true,
    legacyHeaders: false,
  })

  async function tryClaimStripeEvent(supabase, event) {
    const { error } = await supabase.from('stripe_processed_events').insert({
      event_id: event.id,
      event_type: event.type,
    })
    if (!error) {
      return { duplicate: false }
    }
    if (error.code === '23505') {
      return { duplicate: true }
    }
    throw error
  }

  async function releaseStripeEventClaim(supabase, eventId) {
    await supabase.from('stripe_processed_events').delete().eq('event_id', eventId)
  }

  async function rollbackReservation(supabase, watchId) {
    await supabase
      .from('watches')
      .update({
        checkout_reserved_until: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', watchId)
  }

  /** @param {import('@supabase/supabase-js').SupabaseClient} supabase */
  async function rollbackReservationsBulk(supabase, watchIds) {
    if (!Array.isArray(watchIds) || watchIds.length === 0) {
      return
    }
    await supabase
      .from('watches')
      .update({
        checkout_reserved_until: null,
        updated_at: new Date().toISOString(),
      })
      .in('id', watchIds)
  }

  /** Libère réservation + lien session (annulation utilisateur ou post-vérification token). */
  async function releaseCheckoutReservationsForWatchIds(supabase, watchIds) {
    if (!Array.isArray(watchIds) || watchIds.length === 0) {
      return
    }
    const { error } = await supabase
      .from('watches')
      .update({
        checkout_reserved_until: null,
        stripe_checkout_session_id: null,
        updated_at: new Date().toISOString(),
      })
      .in('id', watchIds)
      .eq('is_sold', false)

    if (error) {
      throw error
    }
  }

  async function handleCheckoutSessionCompleted(supabase, session) {
    const watchIds = parseWatchIdsFromSessionMetadata(session)
    if (watchIds.length === 0) {
      throw new Error('watch_id(s) manquants dans les métadonnées de la session')
    }

    const nowIso = new Date().toISOString()
    for (const watchId of watchIds) {
      const { error: updateError } = await supabase
        .from('watches')
        .update({
          is_sold: true,
          is_available: false,
          sale_date: nowIso,
          checkout_reserved_until: null,
          stripe_checkout_session_id: session.id,
          updated_at: nowIso,
        })
        .eq('id', watchId)

      if (updateError) {
        throw updateError
      }
    }

    console.log(
      `✅ ${watchIds.length} montre(s) marquée(s) comme vendue(s) (session ${session.id})`,
    )
    console.log(
      `💰 Montant payé: ${session.amount_total != null ? session.amount_total / 100 : '?'} ${(
        session.currency || ''
      ).toUpperCase()}`,
    )
    console.log(`📧 Email client: ${session.customer_details?.email || 'Non fourni'}`)
  }

  async function handleCheckoutSessionExpired(supabase, session) {
    const { error } = await supabase
      .from('watches')
      .update({
        checkout_reserved_until: null,
        stripe_checkout_session_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_checkout_session_id', session.id)
      .eq('is_sold', false)

    if (error) {
      throw error
    }
    console.log(`ℹ️  Réservations libérées pour session expirée ${session.id}`)
  }

  router.post(
    '/create-checkout-session',
    resolveSite(registry),
    checkoutRateLimiter,
    async (req, res) => {
      const site = req.site
      try {
        const { watchId } = req.body

        if (!watchId) {
          return res.status(400).json({
            success: false,
            error: 'ID de montre manquant',
          })
        }

        if (!site.secrets.paymentCancelSecret) {
          console.error(`[${site.id}] ❌ PAYMENT_CANCEL_SECRET non configuré`)
          return res.status(500).json({
            success: false,
            error: 'Configuration serveur incomplète (paiement)',
          })
        }

        let supabase
        let stripe
        try {
          supabase = getSupabaseClient(site)
          stripe = getStripeClient(site)
        } catch (e) {
          if (e instanceof MissingSecretsError) {
            return res.status(503).json({ success: false, error: e.message })
          }
          throw e
        }

        const { data: watch, error: watchError } = await supabase
          .from('watches')
          .select('id, name, reference, price, is_available, is_sold')
          .eq('id', watchId)
          .single()

        if (watchError || !watch) {
          return res.status(404).json({
            success: false,
            error: 'Montre non trouvée',
          })
        }

        if (!watch.is_available || watch.is_sold) {
          return res.status(400).json({
            success: false,
            error: "Cette montre n'est plus disponible à la vente",
          })
        }

        const { data: reserved, error: rpcError } = await supabase.rpc(
          'reserve_watch_for_checkout',
          {
            p_watch_id: watchId,
            p_reserve_minutes: RESERVE_MINUTES,
          },
        )

        if (rpcError) {
          console.error(`[${site.id}] ❌ reserve_watch_for_checkout:`, rpcError)
          return res.status(500).json({
            success: false,
            error:
              rpcError.message?.includes('function') || rpcError.code === '42883'
                ? 'Migration SQL requise (reserve_watch_for_checkout). Voir supabase/migrations.'
                : 'Impossible de réserver la montre',
          })
        }

        if (reserved !== true) {
          return res.status(409).json({
            success: false,
            error: 'Montre non disponible ou réservation en cours pour un autre acheteur',
          })
        }

        const { data: firstImage } = await supabase
          .from('watch_images')
          .select('image_url, image_path')
          .eq('watch_id', watchId)
          .order('image_order', { ascending: true })
          .limit(1)
          .single()

        let watchImageUrl = null
        if (firstImage) {
          if (firstImage.image_url) {
            watchImageUrl = firstImage.image_url
          } else if (firstImage.image_path) {
            const { data } = supabase.storage.from('watch-images').getPublicUrl(firstImage.image_path)
            watchImageUrl = data.publicUrl
          }
        }

        const baseUrl = getBaseUrl(site)

        let cancelToken
        try {
          cancelToken = signPaymentCancelToken(site.secrets.paymentCancelSecret, watchId)
        } catch (e) {
          await rollbackReservation(supabase, watchId)
          console.error(`[${site.id}] ❌ Token annulation:`, e)
          return res.status(500).json({
            success: false,
            error: e.message || 'Erreur configuration paiement',
          })
        }

        const successUrl = `${baseUrl}/paiement-succes?session_id={CHECKOUT_SESSION_ID}&watch_id=${watchId}`
        const cancelUrl = `${baseUrl}/paiement-annule?watch_id=${watchId}&token=${encodeURIComponent(cancelToken)}`

        const productData = {
          name: watch.name,
          description: `Réf. ${watch.reference}`,
        }
        if (watchImageUrl) {
          productData.images = [watchImageUrl]
        }

        let session
        try {
          session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
              {
                price_data: {
                  currency: 'eur',
                  product_data: productData,
                  unit_amount: Math.round(watch.price * 100),
                },
                quantity: 1,
              },
            ],
            mode: 'payment',
            success_url: successUrl,
            cancel_url: cancelUrl,
            metadata: {
              watch_id: watch.id,
              watch_name: watch.name,
              watch_reference: watch.reference || '',
              site_id: site.id,
            },
          })
        } catch (stripeErr) {
          await rollbackReservation(supabase, watchId)
          console.error(`[${site.id}] ❌ Erreur Stripe create session:`, stripeErr)
          return res.status(500).json({
            success: false,
            error:
              stripeErr.message || 'Erreur lors de la création de la session de paiement',
          })
        }

        const { error: sidErr } = await supabase
          .from('watches')
          .update({
            stripe_checkout_session_id: session.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', watchId)

        if (sidErr) {
          console.error(
            `[${site.id}] ❌ Impossible d'enregistrer stripe_checkout_session_id:`,
            sidErr,
          )
        }

        console.log(
          `[${site.id}] ✅ Session Stripe créée pour la montre ${watch.name} (${watch.id}): ${session.id}`,
        )
        if (watchImageUrl) {
          console.log(`[${site.id}] 📸 Image ajoutée à la session: ${watchImageUrl}`)
        }

        res.json({
          success: true,
          sessionId: session.id,
          url: session.url,
        })
      } catch (error) {
        console.error(
          `[${site && site.id}] ❌ Erreur lors de la création de la session Stripe:`,
          error,
        )
        res.status(500).json({
          success: false,
          error:
            error.message ||
            'Une erreur est survenue lors de la création de la session de paiement',
        })
      }
    },
  )

  router.post(
    '/create-checkout-session-cart',
    resolveSite(registry),
    checkoutRateLimiter,
    async (req, res) => {
      const site = req.site
      try {
        const lines = parseCartCheckoutLines(req.body)
        const watchIds = [...new Set(lines.map((l) => l.watchId))].sort()
        const totalUnits = lines.reduce((s, l) => s + l.quantity, 0)

        if (lines.length === 0 || watchIds.length === 0) {
          return res.status(400).json({
            success: false,
            error: 'Panier vide',
          })
        }

        if (watchIds.length > MAX_CART_CHECKOUT_LINES) {
          return res.status(400).json({
            success: false,
            error: `Maximum ${MAX_CART_CHECKOUT_LINES} références différentes par commande`,
          })
        }

        if (totalUnits > MAX_CART_CHECKOUT_UNITS) {
          return res.status(400).json({
            success: false,
            error: `Maximum ${MAX_CART_CHECKOUT_UNITS} articles par commande`,
          })
        }

        const qtyByWatchId = new Map(lines.map((l) => [l.watchId, l.quantity]))

        if (!site.secrets.paymentCancelSecret) {
          console.error(`[${site.id}] ❌ PAYMENT_CANCEL_SECRET non configuré`)
          return res.status(500).json({
            success: false,
            error: 'Configuration serveur incomplète (paiement)',
          })
        }

        let supabase
        let stripe
        try {
          supabase = getSupabaseClient(site)
          stripe = getStripeClient(site)
        } catch (e) {
          if (e instanceof MissingSecretsError) {
            return res.status(503).json({ success: false, error: e.message })
          }
          throw e
        }

        const { data: watches, error: watchesError } = await supabase
          .from('watches')
          .select('id, name, reference, price, is_available, is_sold')
          .in('id', watchIds)

        if (watchesError || !watches || watches.length !== watchIds.length) {
          return res.status(400).json({
            success: false,
            error: 'Une ou plusieurs montres sont introuvables',
          })
        }

        const byId = new Map(watches.map((w) => [String(w.id), w]))
        const ordered = watchIds.map((id) => byId.get(String(id)))
        const qtyOrOne = (id) => qtyByWatchId.get(String(id)) || 1

        for (const w of ordered) {
          if (!w || !w.is_available || w.is_sold) {
            return res.status(400).json({
              success: false,
              error: w
                ? `La montre « ${w.name} » n'est plus disponible à la vente`
                : 'Montre introuvable',
            })
          }
        }

        const { data: reserved, error: rpcError } = await supabase.rpc(
          'reserve_watches_for_checkout',
          {
            p_watch_ids: watchIds,
            p_reserve_minutes: RESERVE_MINUTES,
          },
        )

        if (rpcError) {
          console.error(`[${site.id}] ❌ reserve_watches_for_checkout:`, rpcError)
          return res.status(500).json({
            success: false,
            error:
              rpcError.message?.includes('function') || rpcError.code === '42883'
                ? 'Migration SQL requise (reserve_watches_for_checkout). Voir supabase/migrations.'
                : 'Impossible de réserver les montres',
          })
        }

        if (reserved !== true) {
          return res.status(409).json({
            success: false,
            error: 'Une ou plusieurs montres ne sont plus disponibles',
          })
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
            if (imageByWatch.get(wid) != null) {
              continue
            }
            let url = null
            if (row.image_url) {
              url = row.image_url
            } else if (row.image_path) {
              const { data } = supabase.storage.from('watch-images').getPublicUrl(row.image_path)
              url = data.publicUrl
            }
            imageByWatch.set(wid, url)
          }
        }

        const baseUrl = getBaseUrl(site)

        let cancelToken
        try {
          cancelToken = signPaymentCancelCartToken(site.secrets.paymentCancelSecret, watchIds)
        } catch (e) {
          await rollbackReservationsBulk(supabase, watchIds)
          console.error(`[${site.id}] ❌ Token annulation panier:`, e)
          return res.status(500).json({
            success: false,
            error: e.message || 'Erreur configuration paiement',
          })
        }

        const watchIdsMeta = watchIds.join(',')
        if (watchIdsMeta.length > 450) {
          await rollbackReservationsBulk(supabase, watchIds)
          return res.status(400).json({
            success: false,
            error: 'Trop de montres pour une session (limite métadonnées Stripe)',
          })
        }

        const successUrl = `${baseUrl}/paiement-succes?session_id={CHECKOUT_SESSION_ID}`
        const cancelUrl = `${baseUrl}/paiement-annule?token=${encodeURIComponent(cancelToken)}&watch_ids=${encodeURIComponent(watchIdsMeta)}`

        const line_items = ordered.map((w) => {
          const productData = {
            name: w.name,
            description: `Réf. ${w.reference || ''}`,
          }
          const img = imageByWatch.get(String(w.id))
          if (img) {
            productData.images = [img]
          }
          return {
            price_data: {
              currency: 'eur',
              product_data: productData,
              unit_amount: Math.round(w.price * 100),
            },
            quantity: qtyOrOne(w.id),
          }
        })

        let session
        try {
          session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items,
            mode: 'payment',
            success_url: successUrl,
            cancel_url: cancelUrl,
            metadata: {
              watch_ids: watchIdsMeta,
              site_id: site.id,
            },
          })
        } catch (stripeErr) {
          await rollbackReservationsBulk(supabase, watchIds)
          console.error(`[${site.id}] ❌ Erreur Stripe create session (panier):`, stripeErr)
          return res.status(500).json({
            success: false,
            error:
              stripeErr.message || 'Erreur lors de la création de la session de paiement',
          })
        }

        const { error: sidErr } = await supabase
          .from('watches')
          .update({
            stripe_checkout_session_id: session.id,
            updated_at: new Date().toISOString(),
          })
          .in('id', watchIds)

        if (sidErr) {
          console.error(
            `[${site.id}] ❌ Impossible d'enregistrer stripe_checkout_session_id (panier):`,
            sidErr,
          )
        }

        console.log(
          `[${site.id}] ✅ Session Stripe panier (${totalUnits} article(s), ${watchIds.length} réf.): ${session.id}`,
        )

        res.json({
          success: true,
          sessionId: session.id,
          url: session.url,
        })
      } catch (error) {
        console.error(
          `[${site && site.id}] ❌ Erreur lors de la création de la session Stripe (panier):`,
          error,
        )
        res.status(500).json({
          success: false,
          error:
            error.message ||
            'Une erreur est survenue lors de la création de la session de paiement',
        })
      }
    },
  )

  /**
   * Handler partagé pour les deux URLs de webhook (legacy `/webhook` et nouveau `/webhook/:siteId`).
   * Stripe n'envoie pas d'Origin → on ne peut pas s'appuyer dessus. La résolution se fait via
   * `req.params.siteId` ou un fallback `sauvage-watches` pour la rétrocompat.
   */
  async function handleStripeWebhook(req, res) {
    const site = resolveSiteFromRequest(req, registry) || registry.byId.get('sauvage-watches')
    if (!site) {
      console.error('❌ Webhook Stripe : site introuvable')
      return res.status(400).send('Unknown site')
    }

    const webhookSecret = site.secrets?.stripe?.webhookSecret
    if (!webhookSecret) {
      console.error(`[${site.id}] ❌ STRIPE_WEBHOOK_SECRET non configuré`)
      return res.status(503).json({ error: 'Webhook secret not configured' })
    }

    let stripe
    let supabase
    try {
      stripe = getStripeClient(site)
      supabase = getSupabaseClient(site)
    } catch (e) {
      if (e instanceof MissingSecretsError) {
        console.error(`[${site.id}] ❌ Secrets manquants pour webhook:`, e.message)
        return res.status(503).json({ error: e.message })
      }
      throw e
    }

    const sig = req.headers['stripe-signature']
    let event

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret)
    } catch (err) {
      console.error(`[${site.id}] ❌ Validation webhook Stripe:`, err.message)
      return res.status(400).send(`Webhook signature verification failed: ${err.message}`)
    }

    const handledTypes = ['checkout.session.completed', 'checkout.session.expired']
    if (!handledTypes.includes(event.type)) {
      console.log(`[${site.id}] ℹ️  Événement Stripe ignoré: ${event.type}`)
      return res.status(200).json({ received: true })
    }

    let claimResult
    try {
      claimResult = await tryClaimStripeEvent(supabase, event)
    } catch (e) {
      console.error(`[${site.id}] ❌ Erreur claim événement Stripe:`, e)
      return res.status(500).json({ error: 'Could not record event' })
    }

    if (claimResult.duplicate) {
      return res.status(200).json({ received: true, duplicate: true })
    }

    try {
      if (event.type === 'checkout.session.completed') {
        await handleCheckoutSessionCompleted(supabase, event.data.object)
      } else {
        await handleCheckoutSessionExpired(supabase, event.data.object)
      }
      return res.status(200).json({ received: true })
    } catch (err) {
      console.error(`[${site.id}] ❌ Erreur traitement webhook:`, err)
      try {
        await releaseStripeEventClaim(supabase, event.id)
      } catch (releaseErr) {
        console.error(`[${site.id}] ❌ Erreur suppression claim webhook:`, releaseErr)
      }
      return res.status(500).json({ error: 'Webhook processing failed' })
    }
  }

  router.post(
    '/webhook/:siteId',
    express.raw({ type: 'application/json' }),
    handleStripeWebhook,
  )

  // Alias rétrocompatible : l'URL historique reste branchée sur `sauvage-watches` afin
  // de ne pas casser le webhook actuellement configuré dans le dashboard Stripe.
  router.post(
    '/webhook',
    express.raw({ type: 'application/json' }),
    (req, res, next) => {
      req.params = req.params || {}
      req.params.siteId = req.params.siteId || 'sauvage-watches'
      next()
    },
    handleStripeWebhook,
  )

  router.get('/verify-session', resolveSite(registry), async (req, res) => {
    const site = req.site
    try {
      const session_id = req.query.session_id
      const watch_id = req.query.watch_id
      const token = req.query.token

      // --- Annulation : token panier (sans watch_id) ou token unitaire + watch_id ---
      if (token && !session_id) {
        if (!site.secrets.paymentCancelSecret) {
          return res.status(503).json({
            valid: false,
            reason: 'PAYMENT_CANCEL_SECRET non configuré pour ce site',
          })
        }

        const cartIds = verifyPaymentCancelCartToken(site.secrets.paymentCancelSecret, token)
        if (cartIds && cartIds.length > 0) {
          let supabase
          try {
            supabase = getSupabaseClient(site)
          } catch (e) {
            if (e instanceof MissingSecretsError) {
              return res.status(503).json({ valid: false, reason: e.message })
            }
            throw e
          }
          try {
            await releaseCheckoutReservationsForWatchIds(supabase, cartIds)
          } catch (relErr) {
            console.error(`[${site.id}] ❌ Libération réservations panier:`, relErr)
            return res.status(500).json({
              valid: false,
              reason: 'Erreur lors de la libération des réservations',
            })
          }
          console.log(`[${site.id}] ✅ Annulation panier vérifiée (${cartIds.length} montres)`)
          return res.status(200).json({
            valid: true,
            mode: 'cart_cancel',
            watchIds: cartIds,
          })
        }

        if (watch_id && verifyPaymentCancelToken(site.secrets.paymentCancelSecret, token, watch_id)) {
          let supabase
          try {
            supabase = getSupabaseClient(site)
          } catch (e) {
            if (e instanceof MissingSecretsError) {
              return res.status(503).json({ valid: false, reason: e.message })
            }
            throw e
          }
          try {
            await releaseCheckoutReservationsForWatchIds(supabase, [String(watch_id)])
          } catch (relErr) {
            console.error(`[${site.id}] ❌ Libération réservation unitaire:`, relErr)
            return res.status(500).json({
              valid: false,
              reason: 'Erreur lors de la libération de la réservation',
            })
          }
          console.log(`[${site.id}] ✅ Token annulation vérifié pour watch_id: ${watch_id}`)
          return res.status(200).json({
            valid: true,
            mode: 'single_cancel',
          })
        }

        console.warn(`[${site.id}] ⚠️  Tentative d'accès avec token annulation invalide ou expiré`)
        return res.status(200).json({
          valid: false,
          reason: 'Token invalide ou expiré',
        })
      }

      // --- Succès : session_id + watch_id (historique) ou session_id seul (panier) ---
      if (session_id) {
        let stripe
        try {
          stripe = getStripeClient(site)
        } catch (e) {
          if (e instanceof MissingSecretsError) {
            return res.status(503).json({ valid: false, reason: e.message })
          }
          throw e
        }

        try {
          const session = await stripe.checkout.sessions.retrieve(session_id)

          if (!session) {
            console.warn(
              `[${site.id}] ⚠️  Tentative d'accès avec session_id invalide: ${session_id}`,
            )
            return res.status(200).json({
              valid: false,
              reason: 'Session Stripe invalide',
            })
          }

          if (session.payment_status !== 'paid') {
            console.warn(
              `[${site.id}] ⚠️  Tentative d'accès avec session non payée: ${session_id}`,
            )
            return res.status(200).json({
              valid: false,
              reason: 'Paiement non complété',
            })
          }

          const metaIds = parseWatchIdsFromSessionMetadata(session)
          if (metaIds.length === 0) {
            return res.status(200).json({
              valid: false,
              reason: 'Métadonnées de session invalides',
            })
          }

          if (watch_id) {
            if (!metaIds.some((id) => String(id) === String(watch_id))) {
              console.warn(
                `[${site.id}] ⚠️  Tentative d'accès avec watch_id incorrect: session=${session_id}, watch_id=${watch_id}`,
              )
              return res.status(200).json({
                valid: false,
                reason: 'watch_id ne correspond pas à la session',
              })
            }
          }

          console.log(`[${site.id}] ✅ Session vérifiée avec succès: ${session_id}`)
          return res.status(200).json({
            valid: true,
            mode: watch_id ? 'single_success' : 'cart_success',
            watchIds: metaIds,
            session: {
              id: session.id,
              payment_status: session.payment_status,
              amount_total: session.amount_total,
              currency: session.currency,
            },
          })
        } catch (error) {
          console.error(
            `[${site.id}] ❌ Erreur lors de la vérification de la session Stripe:`,
            error,
          )
          return res.status(200).json({
            valid: false,
            reason: 'Erreur lors de la vérification de la session',
          })
        }
      }

      return res.status(400).json({
        valid: false,
        reason: 'session_id ou token requis',
      })
    } catch (error) {
      console.error(`[${site && site.id}] ❌ Erreur lors de la vérification:`, error)
      return res.status(500).json({
        valid: false,
        reason: 'Erreur serveur lors de la vérification',
      })
    }
  })

  return router
}

module.exports = { buildStripeRouter }
