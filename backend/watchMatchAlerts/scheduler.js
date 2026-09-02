/**
 * Boucle d'envoi des alertes « coup de foudre ».
 *
 * L'admin crée les montres depuis la vitrine (`adminWatchService.js` écrit directement dans
 * Supabase) : le backend n'a aucun hook à accrocher. Il balaie donc, comme la relance des paniers
 * abandonnés (`orders/recovery.js`) et la planification newsletter, à intervalle régulier.
 *
 * ## Trois garde-fous, parce qu'un e-mail non sollicité ne se rattrape pas
 *
 * 1. **Fenêtre glissante** (`ALERT_WINDOW_HOURS`). Seules les montres créées récemment sont
 *    candidates. Sans elle, le premier balayage après activation prendrait tout le catalogue
 *    pour de la nouveauté et écrirait à chacun à propos de tout.
 * 2. **Plancher par alerte** : jamais de montre antérieure à l'inscription. C'est le garde-fou
 *    qui compte vraiment, et il tient tout seul — une alerte créée aujourd'hui ne peut pas
 *    parler d'hier, même si la fenêtre, elle, remonte à 48 h.
 * 3. **Journal `watch_match_alert_notifications`** : `unique (alert_id, watch_id)`, réclamé
 *    *avant* l'envoi. C'est la seule garantie anti-doublon ; `last_notified_at` ne dit que la
 *    date du dernier envoi, jamais son contenu.
 *
 * Volontairement pas de curseur mobile sur `watches.created_at` : une ligne qui s'insère avec un
 * horodatage antérieur au curseur (transaction longue, horloge décalée) serait sautée pour
 * toujours, et en silence. Une fenêtre plus un journal ne connaissent pas ce trou.
 */

const { getSupabaseClient, getMailjetClient, MissingSecretsError } = require('../utils/siteClients')
const { splitMailjetResults } = require('../routes/newsletter')
const { buildAlertUnsubscribeUrl, alertUnsubscribeHeaders } = require('../routes/watchMatchAlerts')
const { resolveStorefrontBase } = require('../orders/orderLinks')
const { createWatchMatchAlertEmail, MAX_WATCH_CARDS } = require('../templates/watchMatchAlertEmail')
const { loadMatchCore, isMatchAlertsEnabled } = require('./core')

const TICK_MS = 5 * 60 * 1000

/**
 * Ancienneté maximale d'une montre pour être annoncée. Large assez pour absorber une panne du
 * planificateur d'une nuit, courte assez pour qu'une remise en service ne déclenche pas une
 * salve de rattrapage.
 */
const ALERT_WINDOW_HOURS = 48

/**
 * URL publique d'une image de montre (colonne directe, sinon chemin dans le bucket).
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {{ image_url?: string | null, image_path?: string | null }} record
 * @returns {string | null}
 */
function resolveImageUrl(supabase, record) {
  if (!record) return null
  if (record.image_url) return record.image_url
  if (record.image_path) {
    const { data } = supabase.storage.from('watch-images').getPublicUrl(record.image_path)
    return data?.publicUrl || null
  }
  return null
}

/**
 * Montres nouvellement mises en ligne et encore disponibles, dans la fenêtre de balayage.
 * Retourne des objets prêts pour la correspondance (`buildMatchWatchFromRow`), enrichis de
 * l'URL de la fiche et d'une image.
 *
 * @param {object} params
 * @param {import('@supabase/supabase-js').SupabaseClient} params.supabase
 * @param {string} params.storefrontBase
 * @param {Date} [params.now]
 * @returns {Promise<object[]>}
 */
async function findRecentWatches({ supabase, storefrontBase, now = new Date() }) {
  const { buildMatchWatchFromRow } = await loadMatchCore()
  const floorIso = new Date(now.getTime() - ALERT_WINDOW_HOURS * 60 * 60 * 1000).toISOString()

  const { data: rows, error } = await supabase
    .from('watches')
    .select('id, slug, name, brand, reference, price, promotion_price, created_at')
    .eq('is_available', true)
    .eq('is_sold', false)
    .gte('created_at', floorIso)
    .order('created_at', { ascending: false })

  if (error) throw error
  if (!rows || rows.length === 0) return []

  const ids = rows.map((r) => r.id)
  const [{ data: details }, { data: images }] = await Promise.all([
    supabase.from('watch_details').select('*').in('watch_id', ids),
    supabase
      .from('watch_images')
      .select('watch_id, image_url, image_path, image_order')
      .in('watch_id', ids)
      .order('image_order', { ascending: true }),
  ])

  const detailsByWatch = new Map((details || []).map((d) => [d.watch_id, d]))
  const imageByWatch = new Map()
  for (const image of images || []) {
    if (!imageByWatch.has(image.watch_id)) imageByWatch.set(image.watch_id, image)
  }

  return rows.map((row) => {
    const watch = buildMatchWatchFromRow(row, detailsByWatch.get(row.id))
    return {
      ...watch,
      url: `${storefrontBase}/montre/${watch.slug || watch.id}`,
      imageUrl: resolveImageUrl(supabase, imageByWatch.get(row.id)),
    }
  })
}

/**
 * Envoi de l'e-mail d'alerte à un destinataire.
 * @param {{ site: object, mailjet: *, alert: object, watches: object[], matchedCount: number,
 *   unsubscribeUrl: string, storefrontBase: string }} params
 * @returns {Promise<{ sent: boolean, error?: string, retryable?: boolean }>}
 */
async function sendMatchAlertEmail({
  site,
  mailjet,
  alert,
  watches,
  matchedCount,
  unsubscribeUrl,
  storefrontBase,
}) {
  const { buildMatchAlertEmailCopy } = await loadMatchCore()
  const emailCfg = site.config.backend.email
  const fromAddress = site.secrets.emailFrom || emailCfg.fromAddress
  if (!fromAddress) {
    return { sent: false, error: 'Adresse expéditeur non configurée', retryable: true }
  }

  const copy = buildMatchAlertEmailCopy(alert.locale, {
    count: matchedCount,
    hiddenCount: Math.max(0, matchedCount - MAX_WATCH_CARDS),
    brandName: emailCfg.fromName,
  })

  const html = createWatchMatchAlertEmail(site, {
    watches,
    copy,
    unsubscribeUrl,
    browseUrl: `${storefrontBase}/collection`,
    currency: site.config.checkout?.currency || 'EUR',
  })

  const response = await mailjet.post('send', { version: 'v3.1' }).request({
    Messages: [
      {
        From: { Email: fromAddress, Name: emailCfg.fromName },
        To: [{ Email: alert.email, Name: alert.email }],
        Subject: copy.subject,
        HTMLPart: html,
        Headers: alertUnsubscribeHeaders(unsubscribeUrl),
      },
    ],
  })

  // Un lot accepté peut contenir un message individuellement rejeté (adresse morte) : inutile
  // de retenter celui-là, contrairement à une erreur de transport.
  const { failed } = splitMailjetResults([{ email: alert.email }], response)
  if (failed.length > 0) {
    return { sent: false, error: failed[0].error, retryable: false }
  }
  return { sent: true }
}

/**
 * Rapproche les nouveautés de chaque alerte active, réclame le journal, puis envoie.
 * Isolé de la récupération des clients pour être testable (`sendFn` injectable).
 *
 * @param {object} params
 * @param {object} params.site
 * @param {object} params.supabase
 * @param {*} params.mailjet
 * @param {object[]} params.alerts   Alertes actives (`watch_match_alerts`)
 * @param {object[]} params.watches  Nouveautés candidates (`findRecentWatches`)
 * @param {string} params.apiBase
 * @param {string} params.storefrontBase
 * @param {Date} [params.now]
 * @param {Function} [params.sendFn]
 * @returns {Promise<number>} Nombre d'e-mails partis
 */
async function runMatchAlerts({
  site,
  supabase,
  mailjet,
  alerts,
  watches,
  apiBase,
  storefrontBase,
  now = new Date(),
  sendFn = sendMatchAlertEmail,
}) {
  const { sanitizePreferences, matchesPreferences } = await loadMatchCore()
  let sent = 0

  for (const alert of alerts) {
    try {
      const preferences = sanitizePreferences(alert.criteria)
      const subscribedAt = alert.created_at ? new Date(alert.created_at).getTime() : 0

      // Toutes les correspondances sont réclamées, sans plafond. Tronquer ici laisserait les
      // montres au-delà du plafond hors du journal : au tick suivant, les premières seraient
      // déjà réclamées, la réclamation reviendrait vide, et le reste disparaîtrait en silence.
      // Le plafond est un plafond d'*affichage* — le template montre `MAX_WATCH_CARDS` cartes
      // et annonce le reste en une ligne, pour un seul e-mail quoi qu'il arrive.
      const matched = watches
        // Plancher par alerte : on ne parle jamais d'une montre arrivée avant l'inscription.
        .filter((watch) => new Date(watch.createdAt).getTime() >= subscribedAt)
        .filter((watch) => matchesPreferences(watch, preferences))

      if (matched.length === 0) continue

      // Réclamation atomique : `ignoreDuplicates` ne renvoie que les lignes réellement
      // insérées. Deux instances qui tournent en même temps ne peuvent pas réclamer la même
      // montre pour la même personne — c'est la base qui tranche, pas l'ordre des ticks.
      const { data: claimed, error: claimErr } = await supabase
        .from('watch_match_alert_notifications')
        .upsert(
          matched.map((watch) => ({
            alert_id: alert.id,
            site_id: site.id,
            watch_id: watch.id,
            status: 'pending',
          })),
          { onConflict: 'alert_id,watch_id', ignoreDuplicates: true },
        )
        .select('watch_id')

      if (claimErr) throw claimErr

      const claimedIds = new Set((claimed || []).map((r) => r.watch_id))
      if (claimedIds.size === 0) continue // Tout avait déjà été annoncé.

      const toAnnounce = matched.filter((watch) => claimedIds.has(watch.id))
      const unsubscribeUrl = buildAlertUnsubscribeUrl(apiBase, alert.unsubscribe_token)

      const result = await sendFn({
        site,
        mailjet,
        alert,
        watches: toAnnounce,
        matchedCount: toAnnounce.length,
        unsubscribeUrl,
        storefrontBase,
      })

      const nowIso = now.toISOString()
      if (result.sent) {
        sent++
        await supabase
          .from('watch_match_alert_notifications')
          .update({ status: 'sent', sent_at: nowIso })
          .eq('alert_id', alert.id)
          .in('watch_id', [...claimedIds])
        await supabase
          .from('watch_match_alerts')
          .update({ last_notified_at: nowIso, updated_at: nowIso })
          .eq('id', alert.id)
        console.log(
          `[${site.id}] ✅ Alerte coup de foudre envoyée à ${alert.email} (${toAnnounce.length} montre(s))`,
        )
      } else if (result.retryable) {
        // Rien n'est parti et le problème est transitoire : on relâche la réservation pour
        // retenter au prochain tick, comme la relance des paniers abandonnés.
        console.error(`[${site.id}] alerte coup de foudre ${alert.email}:`, result.error)
        await supabase
          .from('watch_match_alert_notifications')
          .delete()
          .eq('alert_id', alert.id)
          .in('watch_id', [...claimedIds])
      } else {
        // Refus définitif (adresse invalide) : on garde la trace pour ne pas y revenir.
        console.error(`[${site.id}] alerte coup de foudre refusée ${alert.email}:`, result.error)
        await supabase
          .from('watch_match_alert_notifications')
          .update({ status: 'failed', error: String(result.error).slice(0, 500) })
          .eq('alert_id', alert.id)
          .in('watch_id', [...claimedIds])
      }
    } catch (e) {
      console.error(`[${site.id}] alerte coup de foudre ${alert.id}:`, e.message)
    }
  }

  return sent
}

/**
 * Traite les alertes d'un site (no-op si la fonctionnalité est éteinte).
 * @param {object} site
 * @param {Date} [now]
 */
async function processSiteMatchAlerts(site, now = new Date()) {
  if (!isMatchAlertsEnabled(site)) return

  // Lu dans le manifest brut, comme `features` juste au-dessus : c'est la source, et cette
  // boucle ne dépend ainsi d'aucune évolution de `normalizeSiteConfig`.
  const apiBase = String(
    site.config?.backend?.publicApiUrl || site.config?.raw?.backend?.publicApiUrl || '',
  ).replace(/\/+$/, '')
  if (!apiBase) {
    // Sans base publique, le lien de désinscription de l'e-mail serait mort : envoyer serait
    // écrire à quelqu'un sans lui laisser d'issue. On suspend, comme le planificateur newsletter.
    console.warn(
      `[${site.id}] alertes coup de foudre : backend.publicApiUrl absent du manifest — envoi suspendu (liens de désinscription impossibles).`,
    )
    return
  }

  const storefrontBase = resolveStorefrontBase(site)
  if (!storefrontBase) {
    console.warn(
      `[${site.id}] alertes coup de foudre : urls manquantes — envoi suspendu (liens de fiche impossibles).`,
    )
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

  let watches
  try {
    watches = await findRecentWatches({ supabase, storefrontBase, now })
  } catch (e) {
    if (/watch_match_alert|does not exist/i.test(String(e.message))) {
      console.error(
        `[${site.id}] Migration SQL requise (watch_match_alerts) — voir supabase/migrations/README.md « Alertes coup de foudre ».`,
      )
      return
    }
    throw e
  }
  if (watches.length === 0) return

  const { data: alerts, error } = await supabase
    .from('watch_match_alerts')
    .select('id, email, criteria, locale, unsubscribe_token, created_at')
    .eq('site_id', site.id)
    .eq('status', 'active')

  if (error) {
    if (/watch_match_alerts/i.test(String(error.message))) {
      console.error(
        `[${site.id}] Migration SQL requise (watch_match_alerts) — voir supabase/migrations/README.md « Alertes coup de foudre ».`,
      )
      return
    }
    throw error
  }
  if (!alerts || alerts.length === 0) return

  await runMatchAlerts({
    site,
    supabase,
    mailjet,
    alerts,
    watches,
    apiBase,
    storefrontBase,
    now,
  })
}

/**
 * Démarre la boucle (idempotent : un seul intervalle par process). Ne démarre pas si aucun site
 * n'a activé la fonctionnalité — le drapeau reste donc le seul interrupteur.
 *
 * @param {{ list(): object[] }} registry
 * @returns {NodeJS.Timeout | null}
 */
function startWatchMatchAlertScheduler(registry) {
  const enabledSites = registry.list().filter(isMatchAlertsEnabled)
  if (enabledSites.length === 0) return null

  let isRunning = false

  async function tick() {
    if (isRunning) return // Évite le chevauchement si un tick déborde.
    isRunning = true
    try {
      for (const site of registry.list()) {
        try {
          await processSiteMatchAlerts(site)
        } catch (e) {
          console.error(`[${site.id}] alertes coup de foudre:`, e.message)
        }
      }
    } finally {
      isRunning = false
    }
  }

  const timer = setInterval(tick, TICK_MS)
  if (typeof timer.unref === 'function') timer.unref()
  console.log(
    `💘 Alertes coup de foudre démarrées (tick ${TICK_MS / 1000}s, fenêtre ${ALERT_WINDOW_HOURS} h) : ${enabledSites
      .map((s) => s.id)
      .join(', ')}`,
  )
  return timer
}

module.exports = {
  startWatchMatchAlertScheduler,
  processSiteMatchAlerts,
  runMatchAlerts,
  findRecentWatches,
  sendMatchAlertEmail,
  isMatchAlertsEnabled,
  ALERT_WINDOW_HOURS,
  TICK_MS,
}
