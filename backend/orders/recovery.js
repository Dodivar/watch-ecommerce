/**
 * Relance des paniers abandonnés (checkout).
 *
 * Toutes les `TICK_MS`, parcourt les sites dont `checkout.abandonedCart.enabled`
 * est vrai et relance par email les commandes draft / pending_payment avec un
 * email client, sans activité depuis `delayMinutes` et créées il y a moins de
 * `maxAgeHours`. Une seule relance par commande.
 *
 * Sécurité anti-doublon : chaque commande est « réclamée » via un update
 * conditionnel `recovery_email_sent_at = now where recovery_email_sent_at is null`
 * (même mécanique que le planificateur newsletter). Le lien de reprise est un
 * token HMAC signé (voir `tokens.js`) dont le hash est stocké dans
 * `orders.recovery_token_hash` — accepté par le checkout en plus du token
 * d'origine, sans invalider ce dernier.
 *
 * Migration requise : `orders.recovery_email_sent_at` / `orders.recovery_token_hash`
 * (voir supabase/migrations/README.md — « Relance panier abandonné »).
 */

const { getSupabaseClient, getMailjetClient, MissingSecretsError } = require('../utils/siteClients')
const { signOrderAccessToken, hashOrderAccessToken } = require('./tokens')
const { createAbandonedCheckoutEmail } = require('../templates/abandonedCheckoutEmail')

const TICK_MS = 5 * 60 * 1000
/** Durée de validité du lien de reprise (cohérente avec le texte de l'email). */
const RECOVERY_TOKEN_TTL_SECONDS = 60 * 60 * 48

const RECOVERABLE_STATUSES = ['draft', 'pending_payment']

/**
 * @param {object} site
 * @returns {{ enabled: boolean, delayMinutes: number, maxAgeHours: number }}
 */
function getAbandonedCartConfig(site) {
  const cfg = site.config?.checkout?.abandonedCart
  return cfg && typeof cfg === 'object'
    ? cfg
    : { enabled: false, delayMinutes: 60, maxAgeHours: 48 }
}

/**
 * Base publique de la vitrine pour le lien de reprise (pas de `req` ici).
 * @param {object} site
 * @returns {string}
 */
function resolveStorefrontBase(site) {
  const urls = site.config?.urls || {}
  const base = urls.production || urls.staging || urls.development || ''
  return String(base).replace(/\/+$/, '')
}

/**
 * @param {object} site
 * @param {string} orderId
 * @param {string} token
 * @returns {string}
 */
function buildResumeCheckoutUrl(site, orderId, token) {
  const params = new URLSearchParams({ order: String(orderId), token })
  return `${resolveStorefrontBase(site)}/checkout?${params.toString()}`
}

/**
 * Commandes abandonnées candidates à la relance pour un site.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {object} site
 * @param {Date} [now]
 */
async function findAbandonedOrders(supabase, site, now = new Date()) {
  const cfg = getAbandonedCartConfig(site)
  const cutoffIso = new Date(now.getTime() - cfg.delayMinutes * 60 * 1000).toISOString()
  const oldestIso = new Date(now.getTime() - cfg.maxAgeHours * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from('orders')
    .select('id, status, currency, customer_email, subtotal_cents, total_cents, created_at, updated_at')
    .eq('site_id', site.id)
    .in('status', RECOVERABLE_STATUSES)
    .not('customer_email', 'is', null)
    .is('recovery_email_sent_at', null)
    .lte('updated_at', cutoffIso)
    .gte('created_at', oldestIso)

  if (error) throw error
  return data || []
}

/**
 * Lignes de la commande + vérification qu'aucune montre n'a été vendue
 * entre-temps (jamais de relance pour une montre partie à un autre client).
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} orderId
 * @returns {Promise<{ recoverable: boolean, lines: object[] }>}
 */
async function loadRecoverableLines(supabase, orderId) {
  const { data: lines, error } = await supabase
    .from('order_lines')
    .select('watch_id, name, reference, unit_price_cents, quantity, image_url')
    .eq('order_id', orderId)
  if (error) throw error
  if (!lines || lines.length === 0) {
    return { recoverable: false, lines: [] }
  }

  const watchIds = lines.map((l) => l.watch_id).filter(Boolean)
  if (watchIds.length > 0) {
    const { data: watches, error: watchesError } = await supabase
      .from('watches')
      .select('id, is_sold')
      .in('id', watchIds)
    if (watchesError) throw watchesError
    if ((watches || []).some((w) => w.is_sold === true)) {
      return { recoverable: false, lines }
    }
  }

  return { recoverable: true, lines }
}

/**
 * Envoi de l'email de relance au client.
 * @param {{ site: object, mailjet: *, order: object, lines: object[], resumeUrl: string }} params
 * @returns {Promise<boolean>} true si un email est parti
 */
async function sendAbandonedCheckoutEmail({ site, mailjet, order, lines, resumeUrl }) {
  const emailCfg = site.config.backend.email
  const fromAddress = site.secrets.emailFrom || emailCfg.fromAddress
  if (!fromAddress) {
    console.warn(`[${site.id}] Email from manquant — relance panier ignorée`)
    return false
  }

  const html = createAbandonedCheckoutEmail(site, order, lines, resumeUrl)
  await mailjet.post('send', { version: 'v3.1' }).request({
    Messages: [
      {
        From: { Email: fromAddress, Name: emailCfg.fromName },
        To: [{ Email: order.customer_email, Name: order.customer_email }],
        Subject: `Votre commande vous attend — ${emailCfg.fromName}`,
        HTMLPart: html,
      },
    ],
  })
  return true
}

/**
 * Réclame puis relance une liste de commandes abandonnées. Isolé pour être
 * testable sans dépendre des clients réels (injectable via `sendFn`).
 *
 * @param {object} params
 * @param {object} params.site
 * @param {object} params.supabase
 * @param {*} params.mailjet
 * @param {object[]} params.orders Commandes candidates (voir findAbandonedOrders)
 * @param {Date} [params.now]
 * @param {Function} [params.sendFn] Cœur d'envoi (défaut : `sendAbandonedCheckoutEmail`)
 * @returns {Promise<number>} Nombre d'emails envoyés
 */
async function runAbandonedRecovery({
  site,
  supabase,
  mailjet,
  orders,
  now = new Date(),
  sendFn = sendAbandonedCheckoutEmail,
}) {
  let sent = 0
  for (const order of orders) {
    try {
      const { recoverable, lines } = await loadRecoverableLines(supabase, order.id)
      if (!recoverable) continue

      const token = signOrderAccessToken(
        site.secrets.paymentCancelSecret,
        order.id,
        RECOVERY_TOKEN_TTL_SECONDS,
      )

      // Réclamation atomique : seule la ligne encore non relancée est traitée,
      // et uniquement si la commande est toujours draft / pending_payment.
      const { data: claimed, error: claimErr } = await supabase
        .from('orders')
        .update({
          recovery_email_sent_at: now.toISOString(),
          recovery_token_hash: hashOrderAccessToken(token),
          updated_at: now.toISOString(),
        })
        .eq('id', order.id)
        .is('recovery_email_sent_at', null)
        .in('status', RECOVERABLE_STATUSES)
        .select('id')
        .maybeSingle()

      if (claimErr) throw claimErr
      if (!claimed) continue // Déjà relancée / payée entre-temps (autre tick).

      try {
        const ok = await sendFn({
          site,
          mailjet,
          order,
          lines,
          resumeUrl: buildResumeCheckoutUrl(site, order.id, token),
        })
        if (ok) {
          sent++
          console.log(`[${site.id}] ✅ Relance panier abandonné envoyée (commande ${order.id})`)
        }
      } catch (sendErr) {
        // Best-effort : libérer le claim pour retenter au prochain tick.
        console.error(`[${site.id}] relance panier ${order.id}:`, sendErr.message)
        try {
          await supabase
            .from('orders')
            .update({ recovery_email_sent_at: null, recovery_token_hash: null })
            .eq('id', order.id)
        } catch {
          /* ignore */
        }
      }
    } catch (e) {
      console.error(`[${site.id}] relance panier ${order.id}:`, e.message)
    }
  }
  return sent
}

/**
 * Traite les paniers abandonnés d'un site (no-op si la relance est désactivée).
 * @param {object} site
 */
async function processSiteAbandonedCheckouts(site) {
  const cfg = getAbandonedCartConfig(site)
  if (cfg.enabled !== true) return
  if (!site.secrets.paymentCancelSecret) return // Tokens impossibles à signer.
  if (!resolveStorefrontBase(site)) {
    console.warn(`[${site.id}] urls manquantes — relance panier abandonné ignorée`)
    return
  }

  let supabase
  let mailjet
  try {
    supabase = getSupabaseClient(site)
    mailjet = getMailjetClient(site)
  } catch (e) {
    if (e instanceof MissingSecretsError) return // Site non configuré : on ignore.
    throw e
  }

  let orders
  try {
    orders = await findAbandonedOrders(supabase, site)
  } catch (e) {
    if (/recovery_email_sent_at/i.test(String(e.message))) {
      console.error(
        `[${site.id}] Migration SQL requise (orders.recovery_email_sent_at) — voir supabase/migrations/README.md « Relance panier abandonné ».`,
      )
      return
    }
    throw e
  }
  if (orders.length === 0) return

  await runAbandonedRecovery({ site, supabase, mailjet, orders })
}

/**
 * Démarre la boucle de relance (idempotent : un seul intervalle par process).
 * Ne démarre pas si aucun site n'a activé `checkout.abandonedCart.enabled`.
 * @param {{ list(): object[] }} registry
 * @returns {NodeJS.Timeout | null}
 */
function startAbandonedCheckoutScheduler(registry) {
  const enabledSites = registry.list().filter((site) => getAbandonedCartConfig(site).enabled === true)
  if (enabledSites.length === 0) {
    return null
  }

  let isRunning = false

  async function tick() {
    if (isRunning) return // Évite le chevauchement si un tick déborde.
    isRunning = true
    try {
      for (const site of registry.list()) {
        try {
          await processSiteAbandonedCheckouts(site)
        } catch (e) {
          console.error(`[${site.id}] relance paniers abandonnés:`, e.message)
        }
      }
    } finally {
      isRunning = false
    }
  }

  const timer = setInterval(tick, TICK_MS)
  if (typeof timer.unref === 'function') timer.unref()
  console.log(
    `🛒 Relance paniers abandonnés démarrée (tick ${TICK_MS / 1000}s) : ${enabledSites
      .map((s) => s.id)
      .join(', ')}`,
  )
  return timer
}

module.exports = {
  startAbandonedCheckoutScheduler,
  processSiteAbandonedCheckouts,
  runAbandonedRecovery,
  findAbandonedOrders,
  loadRecoverableLines,
  sendAbandonedCheckoutEmail,
  buildResumeCheckoutUrl,
  getAbandonedCartConfig,
  RECOVERY_TOKEN_TTL_SECONDS,
}
