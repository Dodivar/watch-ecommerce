/**
 * Boucle de planification des newsletters.
 *
 * Toutes les `TICK_MS`, parcourt chaque site du registre et déclenche l'envoi des
 * campagnes dont la programmation (`scheduled_at`) est arrivée à échéance. Réutilise
 * le cœur d'envoi de `routes/newsletter.js` (`runCampaignSend`) : un seul chemin de
 * code pour l'envoi manuel et l'envoi planifié.
 *
 * Sécurité anti-doublon : chaque campagne due est d'abord « réclamée » via un update
 * conditionnel `status = 'sending' where status = 'scheduled'`. Seule l'instance qui
 * obtient la ligne procède à l'envoi ; un tick lent ne peut donc pas ré-envoyer.
 */

const { getSupabaseClient, getMailjetClient, MissingSecretsError } = require('../utils/siteClients')
const { runCampaignSend, loadSettings } = require('../routes/newsletter')

const TICK_MS = 60 * 1000

/**
 * Base publique du backend pour les liens de désinscription (pas de `req` ici).
 * @param {object} site
 */
function resolveApiBaseForSite(site) {
  const configured = site.config?.backend?.publicApiUrl
  return configured ? String(configured).replace(/\/+$/, '') : ''
}

/**
 * Traite les campagnes arrivées à échéance pour un site donné.
 * @param {object} site
 */
async function processSite(site) {
  let supabase
  let mailjet
  try {
    supabase = getSupabaseClient(site)
    mailjet = getMailjetClient(site)
  } catch (e) {
    if (e instanceof MissingSecretsError) return // Site non configuré : on ignore.
    throw e
  }

  const nowIso = new Date().toISOString()
  const { data: due, error } = await supabase
    .from('newsletter_campaigns')
    .select('*')
    .eq('site_id', site.id)
    .eq('status', 'scheduled')
    .lte('scheduled_at', nowIso)

  if (error) {
    console.error(`[${site.id}] newsletter scheduler query:`, error.message)
    return
  }
  if (!due || due.length === 0) return

  const apiBase = resolveApiBaseForSite(site)
  const settings = await loadSettings(supabase, site.id)

  await runDueCampaigns({ site, supabase, mailjet, settings, apiBase, campaigns: due })
}

/**
 * Réclame puis envoie une liste de campagnes arrivées à échéance. Isolé pour être
 * testable sans dépendre des clients réels (injectable via `sendFn`).
 *
 * @param {object} params
 * @param {object} params.site
 * @param {object} params.supabase
 * @param {*} params.mailjet
 * @param {object} params.settings
 * @param {string} params.apiBase
 * @param {object[]} params.campaigns  Campagnes candidates (statut `scheduled`, dues)
 * @param {Function} [params.sendFn]   Cœur d'envoi (défaut : `runCampaignSend`)
 */
async function runDueCampaigns({ site, supabase, mailjet, settings, apiBase, campaigns, sendFn = runCampaignSend }) {
  for (const campaign of campaigns) {
    try {
      // Réclamation atomique : seule la ligne encore « scheduled » est traitée.
      const { data: claimed, error: claimErr } = await supabase
        .from('newsletter_campaigns')
        .update({ status: 'sending', updated_at: new Date().toISOString() })
        .eq('id', campaign.id)
        .eq('status', 'scheduled')
        .select('id')
        .maybeSingle()

      if (claimErr) throw claimErr
      if (!claimed) continue // Déjà réclamée (annulée / autre tick).

      const result = await sendFn({
        site,
        supabase,
        mailjet,
        campaign,
        settings,
        apiBase,
        createdBy: campaign.created_by || null,
      })
      console.log(
        `[${site.id}] newsletter planifiée « ${campaign.subject} » envoyée : ${result.sent}/${result.total} (${result.status})`,
      )
    } catch (e) {
      console.error(`[${site.id}] newsletter scheduler send ${campaign.id}:`, e.message)
      // Best-effort : évite un état « sending » bloqué.
      try {
        await supabase
          .from('newsletter_campaigns')
          .update({ status: 'failed', updated_at: new Date().toISOString() })
          .eq('id', campaign.id)
          .eq('site_id', site.id)
      } catch {
        /* ignore */
      }
    }
  }
}

/**
 * Démarre la boucle de planification (idempotent : un seul intervalle par process).
 * @param {{ list(): object[] }} registry
 * @returns {NodeJS.Timeout}
 */
function startNewsletterScheduler(registry) {
  let isRunning = false

  async function tick() {
    if (isRunning) return // Évite le chevauchement si un tick déborde.
    isRunning = true
    try {
      for (const site of registry.list()) {
        try {
          await processSite(site)
        } catch (e) {
          console.error(`[${site.id}] newsletter scheduler:`, e.message)
        }
      }
    } finally {
      isRunning = false
    }
  }

  const timer = setInterval(tick, TICK_MS)
  if (typeof timer.unref === 'function') timer.unref()
  console.log(`📮 Planificateur newsletter démarré (tick ${TICK_MS / 1000}s).`)
  return timer
}

module.exports = { startNewsletterScheduler, processSite, runDueCampaigns }
