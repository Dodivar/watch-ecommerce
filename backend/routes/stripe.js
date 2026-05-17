const express = require('express')

const { getStripeClient, getSupabaseClient, MissingSecretsError } = require('../utils/siteClients')
const { resolveSiteFromRequest } = require('../middleware/resolveSite')
const { handlePaymentIntentSucceeded } = require('./orders')

/**
 * @param {*} registry
 */
function buildStripeRouter(registry) {
  const router = express.Router()

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

    const handledTypes = [
      'payment_intent.succeeded',
      'payment_intent.payment_failed',
      'payment_intent.canceled',
    ]
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
      if (event.type === 'payment_intent.succeeded') {
        await handlePaymentIntentSucceeded(supabase, site, event.data.object)
      } else {
        const orderId = event.data.object?.metadata?.order_id
        if (orderId) {
          await supabase
            .from('orders')
            .update({
              status: 'draft',
              updated_at: new Date().toISOString(),
            })
            .eq('id', orderId)
            .eq('site_id', site.id)
            .in('status', ['pending_payment'])
        }
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

  router.post('/webhook/:siteId', express.raw({ type: 'application/json' }), handleStripeWebhook)

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

  return router
}

module.exports = { buildStripeRouter }
