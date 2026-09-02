/**
 * Alerte « coup de foudre » — routes publiques.
 *
 * Calquées sur `routes/newsletter.js` : pot de miel `website`, limiteur de débit par IP et par
 * site, consentement horodaté, et surtout la même précaution sur la désinscription — le GET
 * n'affiche qu'une page de confirmation, le POST seul désinscrit. Les scanners de liens des
 * messageries suivent les GET : sans cette séparation, ils désinscriraient tout le monde en
 * silence.
 *
 * Migration requise : `watch_match_alerts` + `watch_match_alert_notifications`
 * (voir supabase/migrations/README.md — « Alertes coup de foudre »).
 */

const express = require('express')

const { getSupabaseClient, MissingSecretsError } = require('../utils/siteClients')
const { isOptInTruthy } = require('../newsletter/optIn')
const { createRateLimiter } = require('../utils/simpleRateLimit')
const { loadMatchCore, isMatchAlertsEnabled } = require('../watchMatchAlerts/core')
const { recordMatchAlertOptIn } = require('../watchMatchAlerts/optIn')

/**
 * @param {string} apiBase
 * @param {string} token
 */
function buildAlertUnsubscribeUrl(apiBase, token) {
  return `${apiBase}/api/watch-match-alerts/unsubscribe?token=${encodeURIComponent(token)}`
}

/**
 * En-têtes de désinscription un clic (RFC 8058) exigés par Gmail/Yahoo. Le POST « one-click »
 * est servi par `POST /unsubscribe`.
 * @param {string} unsubscribeUrl
 */
function alertUnsubscribeHeaders(unsubscribeUrl) {
  return {
    'List-Unsubscribe': `<${unsubscribeUrl}>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  }
}

/**
 * Page HTML minimale des états de désinscription, dans la langue de l'alerte.
 * @param {string} lang
 * @param {string} title
 * @param {string} message
 * @param {string} [extraHtml]
 */
function unsubscribePage(lang, title, message, extraHtml = '') {
  return `<!DOCTYPE html><html lang="${lang}"><head><meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${title}</title></head>
    <body style="font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:48px 16px;text-align:center;color:#333;">
    <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:8px;padding:32px;">
    <h1 style="font-size:20px;">${title}</h1><p style="color:#555;">${message}</p>${extraHtml}</div></body></html>`
}

/**
 * Aucun registre en paramètre, contrairement à `buildNewsletterRouter` : ces routes sont toutes
 * publiques, il n'y a pas d'authentification admin à câbler.
 */
function buildWatchMatchAlertsRouter() {
  const router = express.Router()

  // Anti-abus inscription publique : 5 tentatives / 10 min par IP et par site (comme la
  // newsletter — c'est le même formulaire public de collecte d'adresse).
  const subscribeLimiter = createRateLimiter({ windowMs: 10 * 60 * 1000, max: 5 })

  // -------------------------------------------------------------------------
  // Public — enregistrement d'une alerte depuis `/coup-de-foudre`
  // -------------------------------------------------------------------------
  router.post('/subscribe', async (req, res) => {
    const site = req.site

    // Pot de miel : champ invisible pour un humain. Rempli = bot ; on répond comme un succès
    // sans rien enregistrer, pour ne pas renseigner le robot sur sa détection.
    if (typeof req.body?.website === 'string' && req.body.website.trim() !== '') {
      return res.json({ success: true, message: 'Alerte enregistrée' })
    }

    const clientIp = req.ip || req.socket?.remoteAddress || 'inconnue'
    if (!subscribeLimiter.check(`${site.id}:${clientIp}`)) {
      return res
        .status(429)
        .json({ success: false, error: 'Trop de tentatives, veuillez réessayer plus tard' })
    }

    if (!isMatchAlertsEnabled(site)) {
      return res.status(404).json({ success: false, error: 'Alerte non disponible sur ce site' })
    }

    // Consentement explicite : la case est décochée par défaut côté vitrine, et son absence
    // arrête la requête ici. Une adresse enregistrée sans accord serait le point de départ d'un
    // e-mail non sollicité.
    if (!isOptInTruthy(req.body?.consent)) {
      return res.status(400).json({ success: false, error: 'Consentement requis' })
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
      const result = await recordMatchAlertOptIn(supabase, site.id, {
        email: req.body?.email,
        criteria: req.body?.criteria,
        locale: req.body?.locale,
      })
      if (!result.ok) {
        return res.status(400).json({ success: false, error: result.error || 'Requête invalide' })
      }
      return res.json({ success: true, message: 'Alerte enregistrée' })
    } catch (e) {
      console.error(`[${site.id}] watch match alert subscribe:`, e.message)
      return res.status(500).json({ success: false, error: 'Erreur serveur' })
    }
  })

  // -------------------------------------------------------------------------
  // Public — désinscription via jeton (RGPD)
  //
  // GET : page de confirmation SANS effet de bord. POST : désinscription effective — sert le
  // bouton de la page comme le « one-click » RFC 8058.
  // -------------------------------------------------------------------------

  /**
   * Charge l'alerte visée par un jeton et les textes dans sa langue. Les textes sont résolus
   * même quand l'alerte est introuvable (repli sur la langue par défaut du socle) : une page
   * d'erreur reste une page à afficher.
   *
   * @param {object} site
   * @param {string} token
   */
  async function resolveAlertByToken(site, token) {
    const { buildMatchAlertUnsubscribeCopy } = await loadMatchCore()
    const supabase = getSupabaseClient(site)
    const { data, error } = await supabase
      .from('watch_match_alerts')
      .select('id, email, status, locale')
      .eq('site_id', site.id)
      .eq('unsubscribe_token', token)
      .maybeSingle()
    if (error) throw error
    return { alert: data || null, copy: buildMatchAlertUnsubscribeCopy(data?.locale) }
  }

  /** Textes de repli quand on ne sait pas (encore) de quelle alerte il s'agit. */
  async function defaultCopy() {
    const { buildMatchAlertUnsubscribeCopy } = await loadMatchCore()
    return buildMatchAlertUnsubscribeCopy(null)
  }

  router.get('/unsubscribe', async (req, res) => {
    const site = req.site
    const token = String(req.query?.token || '').trim()

    if (!token) {
      const copy = await defaultCopy()
      return res.status(400).send(unsubscribePage(copy.lang, copy.invalid.title, copy.invalid.text))
    }

    try {
      const { alert, copy } = await resolveAlertByToken(site, token)
      if (!alert) {
        return res
          .status(404)
          .send(unsubscribePage(copy.lang, copy.unknown.title, copy.unknown.text))
      }
      if (alert.status === 'unsubscribed') {
        return res.send(unsubscribePage(copy.lang, copy.already.title, copy.already.text))
      }

      const confirmForm = `<form method="post" action="?token=${encodeURIComponent(token)}" style="margin-top:16px;">
        <button type="submit" style="background:#333;color:#fff;border:none;border-radius:6px;padding:12px 24px;font-size:15px;cursor:pointer;">
          ${copy.confirmButton}
        </button></form>`
      return res.send(
        unsubscribePage(copy.lang, copy.confirm.title, copy.confirm.text, confirmForm),
      )
    } catch (e) {
      const copy = await defaultCopy()
      if (e instanceof MissingSecretsError) {
        return res
          .status(503)
          .send(unsubscribePage(copy.lang, copy.unavailable.title, copy.unavailable.text))
      }
      console.error(`[${site.id}] watch match alert unsubscribe (page):`, e.message)
      return res.status(500).send(unsubscribePage(copy.lang, copy.error.title, copy.error.text))
    }
  })

  router.post('/unsubscribe', async (req, res) => {
    const site = req.site
    const token = String(req.query?.token || '').trim()

    if (!token) {
      const copy = await defaultCopy()
      return res.status(400).send(unsubscribePage(copy.lang, copy.invalid.title, copy.invalid.text))
    }

    try {
      const { alert, copy } = await resolveAlertByToken(site, token)
      if (!alert) {
        return res
          .status(404)
          .send(unsubscribePage(copy.lang, copy.unknown.title, copy.unknown.text))
      }
      if (alert.status === 'unsubscribed') {
        // Le one-click RFC 8058 peut rejouer : on ne traite pas une répétition en erreur.
        return res.send(unsubscribePage(copy.lang, copy.already.title, copy.already.text))
      }

      const supabase = getSupabaseClient(site)
      const nowIso = new Date().toISOString()
      const { error } = await supabase
        .from('watch_match_alerts')
        .update({
          status: 'unsubscribed',
          unsubscribed_at: nowIso,
          updated_at: nowIso,
          // Les préférences n'ont plus d'objet une fois l'alerte éteinte : les garder serait
          // conserver un profil de goûts sans finalité. La ligne survit pour prouver la
          // désinscription, pas pour décrire quelqu'un.
          criteria: {},
        })
        .eq('id', alert.id)
        // Réclamation conditionnelle : entre la lecture et cette écriture, la personne a pu
        // refaire le parcours et se réinscrire. Sans ce garde, la désinscription en vol
        // effacerait des préférences toutes fraîches et rendrait muette une alerte voulue.
        .eq('status', 'active')
      if (error) throw error

      return res.send(unsubscribePage(copy.lang, copy.done.title, copy.done.text))
    } catch (e) {
      const copy = await defaultCopy()
      if (e instanceof MissingSecretsError) {
        return res
          .status(503)
          .send(unsubscribePage(copy.lang, copy.unavailable.title, copy.unavailable.text))
      }
      console.error(`[${site.id}] watch match alert unsubscribe:`, e.message)
      return res.status(500).send(unsubscribePage(copy.lang, copy.error.title, copy.error.text))
    }
  })

  return router
}

module.exports = {
  buildWatchMatchAlertsRouter,
  buildAlertUnsubscribeUrl,
  alertUnsubscribeHeaders,
}
