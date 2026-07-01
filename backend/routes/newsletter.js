const express = require('express')

const { getMailjetClient, getSupabaseClient, MissingSecretsError } = require('../utils/siteClients')
const { requireAdminAuth } = require('../admin/adminRoutes')
const { createNewsletterEmail } = require('../templates/newsletterEmail')

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAILJET_BATCH_SIZE = 50

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
 * @param {*} registry
 */
function buildNewsletterRouter(registry) {
  const router = express.Router()

  // -------------------------------------------------------------------------
  // Public — inscription depuis la vitrine
  // -------------------------------------------------------------------------
  router.post('/subscribe', async (req, res) => {
    const site = req.site
    const email = String(req.body?.email || '').trim().toLowerCase()
    const name = req.body?.name ? String(req.body.name).trim() : null

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

    try {
      const nowIso = new Date().toISOString()
      const { data: existing } = await supabase
        .from('newsletter_subscribers')
        .select('id, status, consent_at')
        .eq('site_id', site.id)
        .eq('email', email)
        .maybeSingle()

      if (existing) {
        // Réinscription : réactive et enregistre le consentement si absent.
        await supabase
          .from('newsletter_subscribers')
          .update({
            status: 'subscribed',
            unsubscribed_at: null,
            consent_at: existing.consent_at || nowIso,
            name: name || undefined,
            updated_at: nowIso,
          })
          .eq('id', existing.id)
      } else {
        await supabase.from('newsletter_subscribers').insert({
          site_id: site.id,
          email,
          name,
          status: 'subscribed',
          source: 'optin',
          consent_at: nowIso,
        })
      }

      return res.json({ success: true, message: 'Inscription confirmée' })
    } catch (e) {
      console.error(`[${site.id}] newsletter subscribe:`, e.message)
      return res.status(500).json({ success: false, error: 'Erreur serveur' })
    }
  })

  // -------------------------------------------------------------------------
  // Public — désinscription via jeton (RGPD, lien un clic)
  // -------------------------------------------------------------------------
  router.get('/unsubscribe', async (req, res) => {
    const site = req.site
    const token = String(req.query?.token || '').trim()

    const page = (title, message) => `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${title}</title></head>
      <body style="font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:48px 16px;text-align:center;color:#333;">
      <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:8px;padding:32px;">
      <h1 style="font-size:20px;">${title}</h1><p style="color:#555;">${message}</p></div></body></html>`

    if (!token) {
      return res.status(400).send(page('Lien invalide', 'Ce lien de désinscription est incomplet.'))
    }

    let supabase
    try {
      supabase = getSupabaseClient(site)
    } catch {
      return res.status(503).send(page('Service indisponible', "La désinscription est momentanément indisponible."))
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
        return res.status(404).send(page('Lien inconnu', "Ce lien de désinscription n'est pas reconnu."))
      }

      return res.send(
        page('Désinscription confirmée', 'Vous ne recevrez plus notre newsletter. À bientôt !'),
      )
    } catch (e) {
      console.error(`[${site.id}] newsletter unsubscribe:`, e.message)
      return res.status(500).send(page('Erreur', "Une erreur est survenue lors de la désinscription."))
    }
  })

  // -------------------------------------------------------------------------
  // Admin — import des emails clients (commandes) et leads
  // -------------------------------------------------------------------------
  router.post('/subscribers/import', requireAdminAuth(registry), async (req, res) => {
    const site = req.site
    const supabase = req.adminSupabase
    const sources = req.body?.sources || {}

    try {
      const emails = new Map() // email -> name

      if (sources.customers) {
        const { data } = await supabase
          .from('orders')
          .select('customer_email')
          .eq('site_id', site.id)
          .not('customer_email', 'is', null)
        for (const row of data || []) {
          const e = String(row.customer_email || '').trim().toLowerCase()
          if (isValidEmail(e) && !emails.has(e)) emails.set(e, null)
        }
      }

      if (sources.leads) {
        const { data } = await supabase
          .from('lead_submissions')
          .select('customer_email, customer_name')
          .eq('site_id', site.id)
          .not('customer_email', 'is', null)
        for (const row of data || []) {
          const e = String(row.customer_email || '').trim().toLowerCase()
          if (isValidEmail(e) && !emails.has(e)) emails.set(e, row.customer_name || null)
        }
      }

      if (emails.size === 0) {
        return res.json({ success: true, imported: 0, message: 'Aucune adresse à importer' })
      }

      // Insère uniquement les nouvelles adresses (les existantes gardent leur statut).
      const rows = Array.from(emails.entries()).map(([email, name]) => ({
        site_id: site.id,
        email,
        name,
        status: 'subscribed',
        source: 'import',
      }))

      const { data: inserted, error } = await supabase
        .from('newsletter_subscribers')
        .upsert(rows, { onConflict: 'site_id,email', ignoreDuplicates: true })
        .select('id')

      if (error) throw error

      return res.json({ success: true, imported: inserted?.length ?? 0 })
    } catch (e) {
      console.error(`[${site.id}] newsletter import:`, e.message)
      return res.status(500).json({ success: false, error: 'Erreur serveur' })
    }
  })

  // -------------------------------------------------------------------------
  // Admin — envoi d'une campagne (ou test)
  // -------------------------------------------------------------------------
  router.post('/campaigns/:id/send', requireAdminAuth(registry), async (req, res) => {
    const site = req.site
    const supabase = req.adminSupabase
    const campaignId = req.params.id
    const audience = req.body?.audience || {}
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
        const html = createNewsletterEmail(site, {
          subject: campaign.subject,
          bodyHtml: campaign.body_html,
          settings,
          unsubscribeUrl: buildUnsubscribeUrl(apiBase, 'apercu'),
        })
        await sendMailjetBatch(mailjet, [
          {
            From: { Email: fromAddress, Name: fromName },
            To: [{ Email: testEmail, Name: testEmail }],
            Subject: `[Test] ${campaign.subject}`,
            HTMLPart: html,
            ...(settings.reply_to ? { ReplyTo: { Email: settings.reply_to } } : {}),
          },
        ])
        return res.json({ success: true, test: true })
      }

      if (campaign.status === 'sending' || campaign.status === 'sent') {
        return res.status(409).json({ success: false, error: 'Campagne déjà envoyée ou en cours' })
      }

      // ---- Résolution du public ----
      const wantEmails = new Set()
      if (audience.customers) {
        const { data } = await supabase
          .from('orders')
          .select('customer_email')
          .eq('site_id', site.id)
          .not('customer_email', 'is', null)
        for (const r of data || []) {
          const e = String(r.customer_email || '').trim().toLowerCase()
          if (isValidEmail(e)) wantEmails.add(e)
        }
      }
      if (audience.leads) {
        const { data } = await supabase
          .from('lead_submissions')
          .select('customer_email')
          .eq('site_id', site.id)
          .not('customer_email', 'is', null)
        for (const r of data || []) {
          const e = String(r.customer_email || '').trim().toLowerCase()
          if (isValidEmail(e)) wantEmails.add(e)
        }
      }

      // Garantit un abonné (donc un jeton de désinscription) pour chaque email des
      // sources « réutilisées » ; les lignes existantes conservent leur statut.
      if (wantEmails.size > 0) {
        const importRows = Array.from(wantEmails).map((email) => ({
          site_id: site.id,
          email,
          status: 'subscribed',
          source: 'import',
        }))
        await supabase
          .from('newsletter_subscribers')
          .upsert(importRows, { onConflict: 'site_id,email', ignoreDuplicates: true })
      }

      // Charge tous les abonnés concernés (opt-in + éventuelles sources).
      let subQuery = supabase
        .from('newsletter_subscribers')
        .select('email, status, unsubscribe_token')
        .eq('site_id', site.id)

      // Si aucune source de réutilisation cochée, on ne prend que les abonnés opt-in ;
      // sinon on prend l'union (tout ce qui existe désormais en base).
      if (!audience.subscribers && wantEmails.size > 0) {
        subQuery = subQuery.in('email', Array.from(wantEmails))
      }

      const { data: subs, error: subErr } = await subQuery
      if (subErr) throw subErr

      // Suppression globale : on retire tout email désinscrit.
      const recipients = (subs || [])
        .filter((s) => s.status === 'subscribed')
        .filter((s) => audience.subscribers || wantEmails.has(s.email))

      if (recipients.length === 0) {
        return res.status(400).json({ success: false, error: 'Aucun destinataire éligible' })
      }

      // Marque la campagne « en cours » + journalise les destinataires.
      await supabase
        .from('newsletter_campaigns')
        .update({
          status: 'sending',
          recipient_count: recipients.length,
          created_by: req.adminUser?.email || null,
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
      const nowIso = new Date().toISOString()
      for (let i = 0; i < recipients.length; i += MAILJET_BATCH_SIZE) {
        const batch = recipients.slice(i, i + MAILJET_BATCH_SIZE)
        const messages = batch.map((r) => ({
          From: { Email: fromAddress, Name: fromName },
          To: [{ Email: r.email, Name: r.email }],
          Subject: campaign.subject,
          HTMLPart: createNewsletterEmail(site, {
            subject: campaign.subject,
            bodyHtml: campaign.body_html,
            settings,
            unsubscribeUrl: buildUnsubscribeUrl(apiBase, r.unsubscribe_token),
          }),
          ...(settings.reply_to ? { ReplyTo: { Email: settings.reply_to } } : {}),
        }))

        try {
          await sendMailjetBatch(mailjet, messages)
          sentCount += batch.length
          await supabase
            .from('newsletter_campaign_recipients')
            .update({ status: 'sent', sent_at: nowIso })
            .eq('campaign_id', campaignId)
            .in('email', batch.map((r) => r.email))
        } catch (batchErr) {
          console.error(`[${site.id}] newsletter batch:`, batchErr.message)
          await supabase
            .from('newsletter_campaign_recipients')
            .update({ status: 'failed', error: String(batchErr.message).slice(0, 500) })
            .eq('campaign_id', campaignId)
            .in('email', batch.map((r) => r.email))
        }
      }

      const finalStatus = sentCount === 0 ? 'failed' : 'sent'
      await supabase
        .from('newsletter_campaigns')
        .update({
          status: finalStatus,
          sent_count: sentCount,
          sent_at: sentCount > 0 ? nowIso : null,
          updated_at: nowIso,
        })
        .eq('id', campaignId)

      return res.json({
        success: sentCount > 0,
        sent: sentCount,
        total: recipients.length,
        status: finalStatus,
      })
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
  })

  return router
}

module.exports = { buildNewsletterRouter }
