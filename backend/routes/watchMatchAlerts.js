/**
 * Alerte « coup de foudre » — routes publiques.
 *
 * Calquées sur `routes/newsletter.js` : pot de miel `website`, limiteur de débit par IP et par
 * site, consentement horodaté, et surtout la même précaution sur la désinscription — le GET
 * ne désinscrit jamais (il mène à la page de confirmation de la vitrine), le POST seul le fait.
 * Les scanners de liens des messageries suivent les GET : sans cette séparation, ils
 * désinscriraient tout le monde en silence.
 *
 * Trois montages (voir `server.js`) :
 * - `buildWatchMatchAlertsRouter` — routes appelées par la vitrine, site par `X-Site-Id` ;
 * - `buildSiteAlertUnsubscribeRouter` — liens d'e-mail et one-click, site dans le chemin ;
 * - `buildLegacyAlertUnsubscribeRouter` — liens déjà envoyés, site retrouvé par le jeton.
 *
 * Migration requise : `watch_match_alerts` + `watch_match_alert_notifications`
 * (voir supabase/migrations/README.md — « Alertes coup de foudre »).
 */

const express = require('express')

const { getSupabaseClient, MissingSecretsError } = require('../utils/siteClients')
const { isOptInTruthy } = require('../newsletter/optIn')
const { createRateLimiter } = require('../utils/simpleRateLimit')
const {
  loadMatchCore,
  isMatchAlertsEnabled,
  alertLocalePrefix,
} = require('../watchMatchAlerts/core')
const { recordMatchAlertOptIn } = require('../watchMatchAlerts/optIn')
const { resolveStorefrontBase } = require('../orders/orderLinks')

/**
 * Préfixe des routes qui portent le site **dans le chemin**. Un lien d'e-mail, ouvert depuis la
 * messagerie, n'envoie ni `Origin` ni `X-Site-Id`, et le backend est mutualisé : sans le site
 * dans l'URL, `resolveSite` répond « Unknown site ». Même raison pour le POST « one-click »
 * (RFC 8058), émis par les serveurs de Gmail ou Yahoo.
 * @param {string} siteId
 */
function siteScopedAlertsBase(siteId) {
  return `/api/sites/${encodeURIComponent(siteId)}/watch-match-alerts`
}

/**
 * URL de désinscription des en-têtes `List-Unsubscribe` : la seule qui reste sur le backend,
 * parce qu'elle doit accepter le POST one-click. Un GET dessus redirige vers la vitrine.
 *
 * @param {string} apiBase
 * @param {string} siteId
 * @param {string} token
 */
function buildAlertUnsubscribeUrl(apiBase, siteId, token) {
  return `${apiBase}${siteScopedAlertsBase(siteId)}/unsubscribe?token=${encodeURIComponent(token)}`
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
 * Page vitrine de désinscription. Alignée sur `MATCH_ALERT_UNSUBSCRIBE_PATH` côté socle — un
 * test y veille, comme pour `ALERT_PREFERENCES_PATH`.
 */
const ALERT_UNSUBSCRIBE_PATH = '/coup-de-foudre/desabonnement'

/**
 * Lien « Ne plus recevoir ces alertes » de l'e-mail : la page de la vitrine, jeton en ancre
 * (mêmes raisons que `buildAlertPreferencesUrl`). La personne confirme sur le site du client,
 * qui lui dit que sa décision est prise en compte.
 *
 * @param {string} storefrontBase Origine de la vitrine, sans slash final
 * @param {string} token
 * @param {string} [localePrefix] `''` pour la langue par défaut, `/en` sinon
 */
function buildAlertUnsubscribePageUrl(storefrontBase, token, localePrefix = '') {
  return `${storefrontBase}${localePrefix}${ALERT_UNSUBSCRIBE_PATH}#token=${encodeURIComponent(token)}`
}

/**
 * En-têtes de désinscription un clic (RFC 8058) exigés par Gmail/Yahoo. Le POST « one-click »
 * est servi par `buildSiteAlertUnsubscribeRouter` (`POST …/unsubscribe`).
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

/* ------------------------------------------------------- Désinscription par jeton (RGPD) */

/**
 * Alerte visée par un jeton sur un site, ou `null`. Le jeton doit avoir passé `UUID_RE` : la
 * colonne est un `uuid`, une valeur mal formée y ferait une erreur Postgres.
 *
 * @param {object} supabase
 * @param {string} siteId
 * @param {string} token
 */
async function findAlertByToken(supabase, siteId, token) {
  const { data, error } = await supabase
    .from('watch_match_alerts')
    .select('id, email, status, locale')
    .eq('site_id', siteId)
    .eq('unsubscribe_token', token)
    .maybeSingle()
  if (error) throw error
  return data || null
}

/**
 * Éteint une alerte. Rejouer n'est pas une erreur (le one-click RFC 8058 peut répéter).
 *
 * @param {object} supabase
 * @param {{ id: string, status: string }} alert
 * @returns {Promise<'done' | 'already'>}
 */
async function unsubscribeAlert(supabase, alert) {
  if (alert.status === 'unsubscribed') return 'already'
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
  return 'done'
}

/**
 * Page vitrine de désinscription pour ce site et cette alerte, ou `''` si le manifest ne
 * déclare aucune URL publique.
 *
 * @param {object} site
 * @param {string} token
 * @param {string | null | undefined} locale
 */
function storefrontUnsubscribeUrl(site, token, locale) {
  const base = resolveStorefrontBase(site)
  if (!base) return ''
  return buildAlertUnsubscribePageUrl(base, token, alertLocalePrefix(site, locale))
}

/**
 * Répond une page d'état (`done`, `already`, `unknown`…) dans la langue de l'alerte.
 * @param {import('express').Response} res
 * @param {number} status
 * @param {string | null | undefined} locale
 * @param {string} state Clé de `buildMatchAlertUnsubscribeCopy`
 * @param {string} [extraHtml]
 */
async function sendUnsubscribeState(res, status, locale, state, extraHtml = '') {
  const { buildMatchAlertUnsubscribeCopy } = await loadMatchCore()
  const copy = buildMatchAlertUnsubscribeCopy(locale)
  return res
    .status(status)
    .send(unsubscribePage(copy.lang, copy[state].title, copy[state].text, extraHtml))
}

/**
 * Câble GET et POST `/unsubscribe` sur un routeur, autour d'une fonction qui retrouve l'alerte.
 *
 * - **GET** n'a aucun effet de bord (les scanners de liens des messageries suivent les GET) :
 *   il redirige vers la page de la vitrine, qui fait confirmer. Faute d'URL vitrine, il sert
 *   la confirmation minimale du backend.
 * - **POST** désinscrit : c'est le « one-click » RFC 8058 des en-têtes `List-Unsubscribe`,
 *   envoyé par les serveurs de la messagerie, sans navigateur.
 *
 * @param {import('express').Router} router
 * @param {(req: import('express').Request, token: string) =>
 *   Promise<{ site: object | null, supabase: object | null, alert: object | null }>} locate
 *   Lève `MissingSecretsError` quand la base du site est injoignable.
 * @param {{ siteKnown?: boolean }} [opts] `siteKnown` : le site vient du chemin, pas de
 *   l'alerte. Le GET part alors vers la vitrine même si l'alerte est introuvable ou la base
 *   injoignable — la page y dira la même chose, sur le site du client.
 */
function mountTokenUnsubscribe(router, locate, { siteKnown = false } = {}) {
  router.get('/unsubscribe', async (req, res) => {
    const token = String(req.query?.token || '').trim()
    if (!UUID_RE.test(token)) return sendUnsubscribeState(res, 400, null, 'invalid')

    let found
    try {
      found = await locate(req, token)
    } catch (e) {
      if (!(e instanceof MissingSecretsError)) {
        console.error('watch match alert unsubscribe (lien):', e.message)
      }
      if (!siteKnown) return sendUnsubscribeState(res, 503, null, 'unavailable')
      found = { site: req.site, alert: null }
    }

    const { site, alert } = found
    if (site && (alert || siteKnown)) {
      const target = storefrontUnsubscribeUrl(site, token, alert?.locale)
      if (target) return res.redirect(302, target)
    }

    if (!alert) return sendUnsubscribeState(res, 404, null, 'unknown')
    if (alert.status === 'unsubscribed') {
      return sendUnsubscribeState(res, 200, alert.locale, 'already')
    }
    const { buildMatchAlertUnsubscribeCopy } = await loadMatchCore()
    const confirmForm = `<form method="post" action="?token=${encodeURIComponent(token)}" style="margin-top:16px;">
        <button type="submit" style="background:#333;color:#fff;border:none;border-radius:6px;padding:12px 24px;font-size:15px;cursor:pointer;">
          ${buildMatchAlertUnsubscribeCopy(alert.locale).confirmButton}
        </button></form>`
    return sendUnsubscribeState(res, 200, alert.locale, 'confirm', confirmForm)
  })

  router.post('/unsubscribe', async (req, res) => {
    const token = String(req.query?.token || '').trim()
    if (!UUID_RE.test(token)) return sendUnsubscribeState(res, 400, null, 'invalid')

    try {
      const { supabase, alert } = await locate(req, token)
      if (!alert) return sendUnsubscribeState(res, 404, null, 'unknown')
      const outcome = await unsubscribeAlert(supabase, alert)
      return sendUnsubscribeState(res, 200, alert.locale, outcome)
    } catch (e) {
      if (e instanceof MissingSecretsError) {
        return sendUnsubscribeState(res, 503, null, 'unavailable')
      }
      console.error('watch match alert unsubscribe:', e.message)
      return sendUnsubscribeState(res, 500, null, 'error')
    }
  })
}

/**
 * Désinscription par lien, site **dans le chemin** : à monter sur
 * `/api/sites/:siteId/watch-match-alerts` derrière `resolveSite` (voir `siteScopedAlertsBase`),
 * et **avant** le `resolveSite` générique de `/api`, qui sinon répond « Unknown site » le
 * premier. N'expose que `/unsubscribe` : les autres routes gardent `X-Site-Id`.
 */
function buildSiteAlertUnsubscribeRouter() {
  const router = express.Router()
  mountTokenUnsubscribe(
    router,
    async (req, token) => {
      const supabase = getSupabaseClient(req.site)
      const alert = await findAlertByToken(supabase, req.site.id, token)
      return { site: req.site, supabase, alert }
    },
    { siteKnown: true },
  )
  return router
}

/**
 * Liens des e-mails partis avant que le site n'entre dans le chemin
 * (`/api/watch-match-alerts/unsubscribe?token=…`) : ils restent dans les boîtes, en-têtes
 * one-click compris. Le jeton est un `uuid` aléatoire propre à une alerte : on le cherche sur
 * chaque site où l'alerte est active, et c'est lui qui désigne le site.
 *
 * À monter sur `/api/watch-match-alerts` **avant** tout `resolveSite` qui couvre ce chemin.
 * Les autres chemins passent au montage suivant.
 *
 * @param {{ list(): object[] }} registry
 */
function buildLegacyAlertUnsubscribeRouter(registry) {
  const router = express.Router()
  // Chaque appel peut interroger la base de plusieurs sites : on borne, par IP.
  const limiter = createRateLimiter({ windowMs: 10 * 60 * 1000, max: 30 })
  router.use('/unsubscribe', (req, res, next) => {
    const clientIp = req.ip || req.socket?.remoteAddress || 'inconnue'
    if (!limiter.check(`legacy-unsubscribe:${clientIp}`)) {
      return res.status(429).send('Too many requests')
    }
    return next()
  })

  mountTokenUnsubscribe(router, async (req, token) => {
    let unavailable = null
    for (const site of registry.list()) {
      if (!isMatchAlertsEnabled(site)) continue
      let supabase
      try {
        supabase = getSupabaseClient(site)
      } catch (e) {
        if (!(e instanceof MissingSecretsError)) throw e
        unavailable = e
        continue
      }
      const alert = await findAlertByToken(supabase, site.id, token)
      if (alert) return { site, supabase, alert }
    }
    // Introuvable alors qu'une base n'a pas pu être lue : c'était peut-être la sienne.
    if (unavailable) throw unavailable
    return { site: null, supabase: null, alert: null }
  })
  return router
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
  // Public — page vitrine « mes préférences » (lien de chaque e-mail d'alerte)
  //
  // Le jeton arrive par l'en-tête `X-Alert-Token`, jamais dans l'URL : la page le lit dans
  // l'ancre du lien et le garde hors de la barre d'adresse (voir `ALERT_PREFERENCES_PATH`).
  // GET lit, PUT remplace les préférences. Aucune des deux ne réactive une alerte éteinte :
  // se réinscrire demande un nouveau consentement, que seul le parcours recueille.
  // -------------------------------------------------------------------------

  const preferencesLimiter = createRateLimiter({ windowMs: 10 * 60 * 1000, max: 30 })

  /**
   * Garde commune aux routes à jeton. Renvoie le client Supabase et le jeton, ou `null` après
   * avoir répondu. Le format est vérifié **avant** la base : la colonne est un `uuid`, et une
   * valeur mal formée y ferait une erreur Postgres — un 500 là où il faut un 400.
   *
   * @returns {Promise<{ supabase: object, token: string } | null>}
   */
  async function guardPreferencesRequest(req, res, { requireEnabled = true } = {}) {
    const site = req.site
    if (requireEnabled && !isMatchAlertsEnabled(site)) {
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

  /**
   * Désinscription depuis la page vitrine (`/coup-de-foudre/desabonnement`), après un clic de
   * confirmation. Même jeton en en-tête que les préférences. La fonctionnalité éteinte ne bloque
   * pas : se désinscrire doit rester possible tant qu'un e-mail a pu partir.
   */
  router.post('/preferences/unsubscribe', async (req, res) => {
    const site = req.site
    try {
      const guard = await guardPreferencesRequest(req, res, { requireEnabled: false })
      if (!guard) return
      const alert = await findAlertByToken(guard.supabase, site.id, guard.token)
      if (!alert) return res.status(404).json({ success: false, code: 'UNKNOWN_TOKEN' })
      const outcome = await unsubscribeAlert(guard.supabase, alert)
      return res.json({
        success: true,
        status: 'unsubscribed',
        alreadyUnsubscribed: outcome === 'already',
        locale: alert.locale,
      })
    } catch (e) {
      console.error(`[${site.id}] watch match alert unsubscribe (vitrine):`, e.message)
      return res.status(500).json({ success: false, code: 'SERVER_ERROR' })
    }
  })

  return router
}

module.exports = {
  buildWatchMatchAlertsRouter,
  buildSiteAlertUnsubscribeRouter,
  buildLegacyAlertUnsubscribeRouter,
  buildAlertUnsubscribeUrl,
  buildAlertUnsubscribePageUrl,
  buildAlertPreferencesUrl,
  ALERT_PREFERENCES_PATH,
  ALERT_UNSUBSCRIBE_PATH,
  maskEmail,
  alertUnsubscribeHeaders,
}
