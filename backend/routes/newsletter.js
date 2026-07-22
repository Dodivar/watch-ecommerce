const express = require('express')

const { getMailjetClient, getSupabaseClient, MissingSecretsError } = require('../utils/siteClients')
const { requireAdminAuth, requireAdminRole } = require('../admin/adminRoutes')
const { createNewsletterEmail } = require('../templates/newsletterEmail')
const { recordNewsletterOptIn } = require('../newsletter/optIn')
const { createRateLimiter } = require('../utils/simpleRateLimit')

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAILJET_BATCH_SIZE = 50

/** Jeton factice utilisé dans les emails de test (le lien affiche une page d'aperçu). */
const TEST_UNSUBSCRIBE_TOKEN = 'apercu'

function isValidEmail(value) {
  return typeof value === 'string' && EMAIL_RE.test(value.trim())
}

/**
 * Base publique du backend (pour les liens de désinscription).
 * @param {object} site
 * @param {import('express').Request} req
 */
function resolveApiBase(site, req) {
  const configured = site.config?.backend?.publicApiUrl
  if (configured) return String(configured).replace(/\/+$/, '')
  return `${req.protocol}://${req.get('host')}`
}

function buildUnsubscribeUrl(apiBase, token) {
  return `${apiBase}/api/newsletter/unsubscribe?token=${encodeURIComponent(token)}`
}

/**
 * Récupère la ligne de réglages newsletter (ou un objet vide).
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} siteId
 */
async function loadSettings(supabase, siteId) {
  const { data } = await supabase
    .from('newsletter_settings')
    .select('*')
    .eq('site_id', siteId)
    .maybeSingle()
  return data || {}
}

/**
 * Envoie un lot de messages Mailjet (max 50) et renvoie la réponse brute.
 * @param {*} mailjet
 * @param {object[]} messages
 */
async function sendMailjetBatch(mailjet, messages) {
  return mailjet.post('send', { version: 'v3.1' }).request({ Messages: messages })
}

/**
 * Résume les erreurs par message d'une réponse Mailjet v3.1.
 * @param {object} messageResult Élément de `response.body.Messages`
 * @returns {string}
 */
function summarizeMailjetErrors(messageResult) {
  const errors = messageResult?.Errors
  if (Array.isArray(errors) && errors.length > 0) {
    return errors.map((e) => e.ErrorMessage || e.ErrorCode || 'erreur').join(' ; ')
  }
  return 'Refusé par Mailjet'
}

/**
 * Ventile un lot envoyé selon les statuts par message renvoyés par Mailjet v3.1
 * (un lot accepté peut contenir des messages individuellement rejetés).
 *
 * @param {{ email: string }[]} batch Destinataires du lot, dans l'ordre d'envoi
 * @param {*} response Réponse brute de `sendMailjetBatch`
 * @returns {{ sent: string[], failed: { email: string, error: string }[] }}
 */
function splitMailjetResults(batch, response) {
  const results = response?.body?.Messages
  if (!Array.isArray(results) || results.length !== batch.length) {
    // Réponse inattendue : le lot a été accepté, on le considère envoyé.
    return { sent: batch.map((r) => r.email), failed: [] }
  }
  const sent = []
  const failed = []
  results.forEach((msg, i) => {
    if (msg && msg.Status === 'success') sent.push(batch[i].email)
    else failed.push({ email: batch[i].email, error: summarizeMailjetErrors(msg) })
  })
  return { sent, failed }
}

/**
 * En-têtes de désinscription un clic (RFC 8058) exigés par Gmail/Yahoo pour les
 * envois en masse. Le POST « one-click » est servi par `POST /unsubscribe`.
 * @param {string} unsubscribeUrl
 */
function unsubscribeHeaders(unsubscribeUrl) {
  return {
    'List-Unsubscribe': `<${unsubscribeUrl}>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  }
}

/**
 * Envoie une campagne à l'ensemble des abonnés opt-in.
 *
 * Cœur d'envoi partagé entre la route HTTP admin (`POST /campaigns/:id/send`) et
 * la boucle de planification (`backend/newsletter/scheduler.js`). Résout le public,
 * passe la campagne en « sending », envoie par lots de 50, journalise chaque
 * destinataire, puis fixe le statut final (`sent`/`failed`).
 *
 * @param {object} params
 * @param {object} params.site
 * @param {import('@supabase/supabase-js').SupabaseClient} params.supabase  Client service role
 * @param {*} params.mailjet
 * @param {object} params.campaign   Ligne `newsletter_campaigns`
 * @param {object} params.settings   Réglages de marque (`loadSettings`)
 * @param {string} params.apiBase    Base publique du backend (liens de désinscription)
 * @param {string|null} [params.createdBy]  Email admin déclencheur (null pour un envoi planifié)
 * @returns {Promise<{ sent: number, total: number, status: string }>}
 */
async function runCampaignSend({ site, supabase, mailjet, campaign, settings, apiBase, createdBy = null }) {
  const emailCfg = site.config.backend.email
  const fromAddress = site.secrets.emailFrom || emailCfg.fromAddress
  const fromName = settings.sender_name || emailCfg.fromName
  const campaignId = campaign.id

  // ---- Résolution du public : les abonnés opt-in, source unique de vérité ----
  const { data: subs, error: subErr } = await supabase
    .from('newsletter_subscribers')
    .select('email, unsubscribe_token')
    .eq('site_id', site.id)
    .eq('status', 'subscribed')

  if (subErr) throw subErr

  // Reprise sans doublon : une campagne retentée après un échec partiel ne
  // recontacte pas les destinataires déjà servis (journal des destinataires).
  const { data: alreadySentRows, error: sentLogErr } = await supabase
    .from('newsletter_campaign_recipients')
    .select('email')
    .eq('campaign_id', campaignId)
    .eq('status', 'sent')
  if (sentLogErr) throw sentLogErr
  const alreadySent = new Set((alreadySentRows || []).map((r) => r.email))

  const recipients = (subs || []).filter((r) => !alreadySent.has(r.email))
  const totalAudience = recipients.length + alreadySent.size

  if (totalAudience === 0) {
    // Pas d'abonné : on marque la campagne en échec pour éviter un « sending » bloqué.
    await supabase
      .from('newsletter_campaigns')
      .update({ status: 'failed', updated_at: new Date().toISOString() })
      .eq('id', campaignId)
    return { sent: 0, total: 0, status: 'failed' }
  }

  if (recipients.length === 0) {
    // Tous les abonnés ont déjà été servis lors d'une tentative précédente.
    await supabase
      .from('newsletter_campaigns')
      .update({
        status: 'sent',
        sent_count: alreadySent.size,
        updated_at: new Date().toISOString(),
      })
      .eq('id', campaignId)
    return { sent: 0, total: totalAudience, status: 'sent' }
  }

  // Marque la campagne « en cours » + journalise les destinataires.
  await supabase
    .from('newsletter_campaigns')
    .update({
      status: 'sending',
      recipient_count: totalAudience,
      created_by: createdBy || campaign.created_by || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', campaignId)

  await supabase.from('newsletter_campaign_recipients').upsert(
    recipients.map((r) => ({
      campaign_id: campaignId,
      site_id: site.id,
      email: r.email,
      status: 'pending',
    })),
    { onConflict: 'campaign_id,email', ignoreDuplicates: true },
  )

  // ---- Envoi par lots de 50 ----
  let sentCount = 0
  for (let i = 0; i < recipients.length; i += MAILJET_BATCH_SIZE) {
    const batch = recipients.slice(i, i + MAILJET_BATCH_SIZE)
    const messages = batch.map((r) => {
      const unsubscribeUrl = buildUnsubscribeUrl(apiBase, r.unsubscribe_token)
      return {
        From: { Email: fromAddress, Name: fromName },
        To: [{ Email: r.email, Name: r.email }],
        Subject: campaign.subject,
        HTMLPart: createNewsletterEmail(site, {
          subject: campaign.subject,
          bodyHtml: campaign.body_html,
          settings,
          unsubscribeUrl,
        }),
        Headers: unsubscribeHeaders(unsubscribeUrl),
        ...(settings.reply_to ? { ReplyTo: { Email: settings.reply_to } } : {}),
      }
    })

    const batchIso = new Date().toISOString()
    try {
      const response = await sendMailjetBatch(mailjet, messages)
      // Un lot accepté peut contenir des messages individuellement rejetés :
      // on ventile selon les statuts par message de la réponse v3.1.
      const { sent, failed } = splitMailjetResults(batch, response)
      sentCount += sent.length
      if (sent.length > 0) {
        await supabase
          .from('newsletter_campaign_recipients')
          .update({ status: 'sent', sent_at: batchIso })
          .eq('campaign_id', campaignId)
          .in('email', sent)
      }
      for (const f of failed) {
        console.error(`[${site.id}] newsletter destinataire refusé ${f.email}:`, f.error)
        await supabase
          .from('newsletter_campaign_recipients')
          .update({ status: 'failed', error: String(f.error).slice(0, 500) })
          .eq('campaign_id', campaignId)
          .eq('email', f.email)
      }
    } catch (batchErr) {
      console.error(`[${site.id}] newsletter batch:`, batchErr.message)
      await supabase
        .from('newsletter_campaign_recipients')
        .update({ status: 'failed', error: String(batchErr.message).slice(0, 500) })
        .eq('campaign_id', campaignId)
        .in('email', batch.map((r) => r.email))
    }
  }

  const totalSent = alreadySent.size + sentCount
  const finalStatus = totalSent === 0 ? 'failed' : 'sent'
  const nowIso = new Date().toISOString()
  await supabase
    .from('newsletter_campaigns')
    .update({
      status: finalStatus,
      sent_count: totalSent,
      updated_at: nowIso,
      ...(sentCount > 0 ? { sent_at: nowIso } : {}),
    })
    .eq('id', campaignId)

  return { sent: sentCount, total: totalAudience, status: finalStatus }
}

/**
 * @param {*} registry
 */
function buildNewsletterRouter(registry) {
  const router = express.Router()

  // Anti-abus inscription publique : 5 tentatives / 10 min par IP et par site.
  const subscribeLimiter = createRateLimiter({ windowMs: 10 * 60 * 1000, max: 5 })

  // -------------------------------------------------------------------------
  // Public — inscription depuis la vitrine
  // -------------------------------------------------------------------------
  router.post('/subscribe', async (req, res) => {
    const site = req.site
    const email = String(req.body?.email || '').trim().toLowerCase()
    const name = req.body?.name ? String(req.body.name).trim() : null

    // Pot de miel : champ invisible pour un humain. Rempli = bot ; on répond
    // comme un succès sans rien enregistrer.
    if (typeof req.body?.website === 'string' && req.body.website.trim() !== '') {
      return res.json({ success: true, message: 'Inscription confirmée' })
    }

    const clientIp = req.ip || req.socket?.remoteAddress || 'inconnue'
    if (!subscribeLimiter.check(`${site.id}:${clientIp}`)) {
      return res
        .status(429)
        .json({ success: false, error: 'Trop de tentatives, veuillez réessayer plus tard' })
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, error: 'Adresse email invalide' })
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

    const result = await recordNewsletterOptIn(supabase, site.id, { email, name })
    if (!result.ok) {
      return res.status(500).json({ success: false, error: 'Erreur serveur' })
    }
    return res.json({ success: true, message: 'Inscription confirmée' })
  })

  // -------------------------------------------------------------------------
  // Public — désinscription via jeton (RGPD)
  //
  // GET : page de confirmation SANS effet de bord (les scanners de liens des
  // messageries suivent les GET et désinscriraient silencieusement). POST :
  // désinscription effective — sert à la fois le bouton de la page de
  // confirmation et le « one-click » RFC 8058 (en-tête List-Unsubscribe-Post).
  // -------------------------------------------------------------------------
  const unsubscribePage = (title, message, extraHtml = '') =>
    `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${title}</title></head>
      <body style="font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:48px 16px;text-align:center;color:#333;">
      <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:8px;padding:32px;">
      <h1 style="font-size:20px;">${title}</h1><p style="color:#555;">${message}</p>${extraHtml}</div></body></html>`

  router.get('/unsubscribe', async (req, res) => {
    const site = req.site
    const token = String(req.query?.token || '').trim()

    if (!token) {
      return res
        .status(400)
        .send(unsubscribePage('Lien invalide', 'Ce lien de désinscription est incomplet.'))
    }

    if (token === TEST_UNSUBSCRIBE_TOKEN) {
      return res.send(
        unsubscribePage(
          'Aperçu du lien de désinscription',
          "Ceci est un email de test : le lien de désinscription est factice. Dans un envoi réel, chaque abonné reçoit son propre lien.",
        ),
      )
    }

    let supabase
    try {
      supabase = getSupabaseClient(site)
    } catch {
      return res
        .status(503)
        .send(unsubscribePage('Service indisponible', 'La désinscription est momentanément indisponible.'))
    }

    try {
      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .select('email, status')
        .eq('site_id', site.id)
        .eq('unsubscribe_token', token)
        .maybeSingle()

      if (error) throw error
      if (!data) {
        return res
          .status(404)
          .send(unsubscribePage('Lien inconnu', "Ce lien de désinscription n'est pas reconnu."))
      }
      if (data.status === 'unsubscribed') {
        return res.send(
          unsubscribePage('Déjà désinscrit(e)', 'Vous ne recevez plus notre newsletter.'),
        )
      }

      const confirmForm = `<form method="post" action="?token=${encodeURIComponent(token)}" style="margin-top:16px;">
        <button type="submit" style="background:#333;color:#fff;border:none;border-radius:6px;padding:12px 24px;font-size:15px;cursor:pointer;">
          Confirmer la désinscription
        </button></form>`
      return res.send(
        unsubscribePage(
          'Se désinscrire de la newsletter',
          'Confirmez pour ne plus recevoir nos emails.',
          confirmForm,
        ),
      )
    } catch (e) {
      console.error(`[${site.id}] newsletter unsubscribe (page):`, e.message)
      return res
        .status(500)
        .send(unsubscribePage('Erreur', 'Une erreur est survenue lors de la désinscription.'))
    }
  })

  router.post('/unsubscribe', async (req, res) => {
    const site = req.site
    const token = String(req.query?.token || '').trim()

    if (!token || token === TEST_UNSUBSCRIBE_TOKEN) {
      return res
        .status(400)
        .send(unsubscribePage('Lien invalide', 'Ce lien de désinscription est incomplet.'))
    }

    let supabase
    try {
      supabase = getSupabaseClient(site)
    } catch {
      return res
        .status(503)
        .send(unsubscribePage('Service indisponible', 'La désinscription est momentanément indisponible.'))
    }

    try {
      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .update({ status: 'unsubscribed', unsubscribed_at: new Date().toISOString() })
        .eq('site_id', site.id)
        .eq('unsubscribe_token', token)
        .select('email')
        .maybeSingle()

      if (error) throw error
      if (!data) {
        return res
          .status(404)
          .send(unsubscribePage('Lien inconnu', "Ce lien de désinscription n'est pas reconnu."))
      }

      return res.send(
        unsubscribePage('Désinscription confirmée', 'Vous ne recevrez plus notre newsletter. À bientôt !'),
      )
    } catch (e) {
      console.error(`[${site.id}] newsletter unsubscribe:`, e.message)
      return res
        .status(500)
        .send(unsubscribePage('Erreur', 'Une erreur est survenue lors de la désinscription.'))
    }
  })

  // -------------------------------------------------------------------------
  // Admin — envoi d'une campagne (ou test). Rôle visiteur exclu : la route
  // s'exécute avec le client service role (contourne la RLS), elle doit donc
  // porter elle-même la restriction d'écriture.
  // -------------------------------------------------------------------------
  router.post(
    '/campaigns/:id/send',
    requireAdminAuth(registry),
    requireAdminRole('admin', 'moderator'),
    async (req, res) => {
    const site = req.site
    const supabase = req.adminSupabase
    const campaignId = req.params.id
    const testEmail = req.body?.testEmail ? String(req.body.testEmail).trim().toLowerCase() : null

    let mailjet
    try {
      mailjet = getMailjetClient(site)
    } catch (e) {
      if (e instanceof MissingSecretsError) {
        return res.status(503).json({ success: false, error: e.message })
      }
      throw e
    }

    const emailCfg = site.config.backend.email
    const fromAddress = site.secrets.emailFrom || emailCfg.fromAddress
    if (!fromAddress) {
      return res.status(503).json({ success: false, error: 'Adresse expéditeur non configurée' })
    }

    try {
      const { data: campaign, error: campErr } = await supabase
        .from('newsletter_campaigns')
        .select('*')
        .eq('id', campaignId)
        .eq('site_id', site.id)
        .maybeSingle()

      if (campErr) throw campErr
      if (!campaign) {
        return res.status(404).json({ success: false, error: 'Campagne introuvable' })
      }

      const settings = await loadSettings(supabase, site.id)
      const apiBase = resolveApiBase(site, req)
      const fromName = settings.sender_name || emailCfg.fromName

      // ---- Envoi de test : n'affecte pas la campagne ni les destinataires ----
      if (testEmail) {
        if (!isValidEmail(testEmail)) {
          return res.status(400).json({ success: false, error: 'Adresse de test invalide' })
        }
        const testUnsubscribeUrl = buildUnsubscribeUrl(apiBase, TEST_UNSUBSCRIBE_TOKEN)
        const html = createNewsletterEmail(site, {
          subject: campaign.subject,
          bodyHtml: campaign.body_html,
          settings,
          unsubscribeUrl: testUnsubscribeUrl,
        })
        await sendMailjetBatch(mailjet, [
          {
            From: { Email: fromAddress, Name: fromName },
            To: [{ Email: testEmail, Name: testEmail }],
            Subject: `[Test] ${campaign.subject}`,
            HTMLPart: html,
            Headers: unsubscribeHeaders(testUnsubscribeUrl),
            ...(settings.reply_to ? { ReplyTo: { Email: settings.reply_to } } : {}),
          },
        ])
        return res.json({ success: true, test: true })
      }

      // Vérifie qu'il existe au moins un abonné avant de basculer la campagne.
      const { count: audienceCount, error: countErr } = await supabase
        .from('newsletter_subscribers')
        .select('*', { count: 'exact', head: true })
        .eq('site_id', site.id)
        .eq('status', 'subscribed')
      if (countErr) throw countErr
      if (!audienceCount) {
        return res.status(400).json({ success: false, error: 'Aucun abonné éligible' })
      }

      // Réclamation atomique (même mécanisme que le planificateur) : deux
      // sessions qui déclenchent l'envoi en même temps ne peuvent pas envoyer
      // deux fois — seule celle qui obtient la ligne procède.
      const { data: claimed, error: claimErr } = await supabase
        .from('newsletter_campaigns')
        .update({ status: 'sending', updated_at: new Date().toISOString() })
        .eq('id', campaignId)
        .eq('site_id', site.id)
        .in('status', ['draft', 'scheduled', 'failed', 'cancelled'])
        .select('id')
        .maybeSingle()
      if (claimErr) throw claimErr
      if (!claimed) {
        return res.status(409).json({ success: false, error: 'Campagne déjà envoyée ou en cours' })
      }

      const result = await runCampaignSend({
        site,
        supabase,
        mailjet,
        campaign,
        settings,
        apiBase,
        createdBy: req.adminUser?.email || null,
      })

      return res.json({ success: result.status === 'sent', ...result })
    } catch (e) {
      console.error(`[${site.id}] newsletter send:`, e.message)
      // Best-effort : repasse la campagne en échec pour éviter un état « sending » bloqué.
      try {
        await supabase
          .from('newsletter_campaigns')
          .update({ status: 'failed', updated_at: new Date().toISOString() })
          .eq('id', campaignId)
          .eq('site_id', site.id)
      } catch {
        /* ignore */
      }
      return res.status(500).json({ success: false, error: 'Erreur serveur' })
    }
    },
  )

  return router
}

module.exports = {
  buildNewsletterRouter,
  runCampaignSend,
  loadSettings,
  splitMailjetResults,
  unsubscribeHeaders,
}
