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

/** `watch_match_alerts.unsubscribe_token` est un `uuid` (`gen_random_uuid()`). */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * `dorian@example.fr` → `d•••@example.fr`. Assez pour que la personne reconnaisse son
 * adresse, pas assez pour qu'un lien transféré la divulgue.
 * @param {string} email
 */
function maskEmail(email) {
  const [local, domain] = String(email || '').split('@')
  if (!local || !domain) return ''
  return `${local.slice(0, 1)}•••@${domain}`
}

/**
 * Page vitrine « mes préférences ». Doit rester alignée sur `APP_ROUTE_META`
 * (`packages/base/src/site/appRouteMeta.js`) — un test y veille.
 */
const ALERT_PREFERENCES_PATH = '/coup-de-foudre/mes-preferences'

/**
 * Lien de l'e-mail vers la page « mes préférences ». Le jeton voyage dans l'**ancre** : jamais
 * envoyée aux serveurs (ni journaux d'hébergement, ni en-tête `Referer`), et retirée de l'URL
 * par la page avant toute mesure d'audience.
 *
 * @param {string} storefrontBase Origine de la vitrine, sans slash final
 * @param {string} token
 * @param {string} [localePrefix] `''` pour la langue par défaut, `/en` sinon
 */
function buildAlertPreferencesUrl(storefrontBase, token, localePrefix = '') {
  return `${storefrontBase}${localePrefix}${ALERT_PREFERENCES_PATH}#token=${encodeURIComponent(token)}`
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

  // -------------------------------------------------------------------------
  // Public — page vitrine « mes préférences » (lien de chaque e-mail d'alerte)
  //
  // Le jeton arrive par l'en-tête `X-Alert-Token`, jamais dans l'URL : la page le lit dans
  // l'ancre du lien et le garde hors de la barre d'adresse (voir `ALERT_PREFERENCES_PATH`).
  // GET lit, PUT remplace les préférences. Aucune des deux ne réactive une alerte éteinte :
  // se réinscrire demande un nouveau consentement, que seul le parcours recueille.
  // -------------------------------------------------------------------------

  const preferencesLimiter = createRateLimiter({ windowMs: 10 * 60 * 1000, max: 30 })

  /**
   * Garde commune aux deux routes. Renvoie le client Supabase et le jeton, ou `null` après
   * avoir répondu. Le format est vérifié **avant** la base : la colonne est un `uuid`, et une
   * valeur mal formée y ferait une erreur Postgres — un 500 là où il faut un 400.
   *
   * @returns {Promise<{ supabase: object, token: string } | null>}
   */
  async function guardPreferencesRequest(req, res) {
    const site = req.site
    if (!isMatchAlertsEnabled(site)) {
      res.status(404).json({ success: false, code: 'DISABLED' })
      return null
    }
    const clientIp = req.ip || req.socket?.remoteAddress || 'inconnue'
    if (!preferencesLimiter.check(`${site.id}:${clientIp}`)) {
      res.status(429).json({ success: false, code: 'RATE_LIMITED' })
      return null
    }
    const token = String(req.headers?.['x-alert-token'] || '').trim()
    if (!UUID_RE.test(token)) {
      res.status(400).json({ success: false, code: 'INVALID_TOKEN' })
      return null
    }
    try {
      return { supabase: getSupabaseClient(site), token }
    } catch (e) {
      if (e instanceof MissingSecretsError) {
        res.status(503).json({ success: false, code: 'UNAVAILABLE' })
        return null
      }
      throw e
    }
  }

  router.get('/preferences', async (req, res) => {
    const site = req.site
    try {
      const guard = await guardPreferencesRequest(req, res)
      if (!guard) return
      const { sanitizePreferences } = await loadMatchCore()
      const { data: alert, error } = await guard.supabase
        .from('watch_match_alerts')
        .select('email, status, locale, criteria')
        .eq('site_id', site.id)
        .eq('unsubscribe_token', guard.token)
        .maybeSingle()
      if (error) throw error
      if (!alert) return res.status(404).json({ success: false, code: 'UNKNOWN_TOKEN' })

      const active = alert.status === 'active'
      return res.json({
        success: true,
        status: alert.status,
        // Masquée : le lien peut être transféré, la page n'a pas à révéler l'adresse entière.
        email: maskEmail(alert.email),
        locale: alert.locale,
        // Une alerte éteinte n'a plus de préférences (voir `POST /unsubscribe`).
        criteria: active ? sanitizePreferences(alert.criteria) : null,
      })
    } catch (e) {
      console.error(`[${site.id}] watch match alert preferences (read):`, e.message)
      return res.status(500).json({ success: false, code: 'SERVER_ERROR' })
    }
  })

  router.put('/preferences', async (req, res) => {
    const site = req.site
    try {
      const guard = await guardPreferencesRequest(req, res)
      if (!guard) return
      const { sanitizePreferences } = await loadMatchCore()
      // Même frontière que l'inscription : seuls les champs de `MatchPreferences` passent,
      // `offered` compris — c'est lui qui dit ce que la page vient d'afficher.
      const criteria = sanitizePreferences(req.body?.criteria)
      const nowIso = new Date().toISOString()

      const { data: updated, error } = await guard.supabase
        .from('watch_match_alerts')
        .update({ criteria, updated_at: nowIso })
        .eq('site_id', site.id)
        .eq('unsubscribe_token', guard.token)
        // Écriture conditionnelle, comme la désinscription : une alerte éteinte entre la
        // lecture et l'enregistrement ne se rallume pas par la bande. `consent_at` n'est pas
        // touché : modifier ses goûts n'est pas redonner son accord.
        .eq('status', 'active')
        .select('id')
      if (error) throw error

      if (!updated || updated.length === 0) {
        const { data: existing, error: lookupError } = await guard.supabase
          .from('watch_match_alerts')
          .select('id')
          .eq('site_id', site.id)
          .eq('unsubscribe_token', guard.token)
          .maybeSingle()
        if (lookupError) throw lookupError
        return existing
          ? res.status(409).json({ success: false, code: 'INACTIVE' })
          : res.status(404).json({ success: false, code: 'UNKNOWN_TOKEN' })
      }

      return res.json({ success: true, criteria })
    } catch (e) {
      console.error(`[${site.id}] watch match alert preferences (update):`, e.message)
      return res.status(500).json({ success: false, code: 'SERVER_ERROR' })
    }
  })

  return router
}

module.exports = {
  buildWatchMatchAlertsRouter,
  buildAlertUnsubscribeUrl,
  buildAlertPreferencesUrl,
  ALERT_PREFERENCES_PATH,
  maskEmail,
  alertUnsubscribeHeaders,
}
