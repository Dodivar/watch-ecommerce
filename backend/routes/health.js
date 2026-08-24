/**
 * Endpoints de supervision protégés par jeton.
 *
 *   GET /api/health/deep      → un aller-retour réel vers Supabase (base +
 *                               storage), Stripe et Mailjet, par site.
 *   GET /api/health/payments  → invariant « paiement réussi ⇒ commande payée ».
 *
 * Pourquoi un jeton : `/api/health` (public) ne dit que « Express écoute ».
 * Ces deux-là parlent aux tiers, coûtent de l'egress et décrivent l'état interne
 * de chaque site — ils ne doivent être joignables que par le monitoring.
 * Sans `HEALTH_CHECK_TOKEN`, les routes répondent 503 `disabled` : jamais
 * ouvertes par défaut.
 *
 * Codes retour pensés pour un moniteur externe (UptimeRobot, Better Stack,
 * Healthchecks.io) qui n'alerte que sur non-2xx :
 *   - dépendance dure HS, ou paiement orphelin  → 503
 *   - dépendance souple HS (`degraded`)         → 200, sauf `?strict=1`
 */

const crypto = require('crypto')
const express = require('express')
const rateLimit = require('express-rate-limit')

const { createCachedRunner } = require('../health/cache')
const { createDeepHealthChecker, runDeepCheck } = require('../health/deepCheck')
const { runPaymentsInvariant } = require('../health/paymentsInvariant')

const DEFAULT_DEEP_TTL_MS = 60 * 1000
const DEFAULT_PAYMENTS_TTL_MS = 5 * 60 * 1000
const DEFAULT_PROBE_TIMEOUT_MS = 5000

/**
 * Comparaison à temps constant de deux jetons.
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
function timingSafeEquals(a, b) {
  const bufA = Buffer.from(String(a))
  const bufB = Buffer.from(String(b))
  if (bufA.length !== bufB.length) return false
  return crypto.timingSafeEqual(bufA, bufB)
}

/**
 * Extrait le jeton de `X-Health-Token` ou `Authorization: Bearer`.
 * @param {import('express').Request} req
 * @returns {string|null}
 */
function extractHealthToken(req) {
  const header = req.headers['x-health-token']
  if (typeof header === 'string' && header.length > 0) return header
  const auth = req.headers.authorization
  if (typeof auth === 'string' && auth.startsWith('Bearer ')) return auth.slice(7).trim()
  return null
}

/**
 * @param {string|null|undefined} raw
 * @param {number} fallback
 * @returns {number}
 */
function parsePositiveInt(raw, fallback) {
  const parsed = parseInt(String(raw ?? ''), 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function isTruthyFlag(value) {
  return value === '1' || value === 'true' || value === 'yes'
}

/**
 * Sites déclarés « en production » : pour eux, un secret manquant vaut panne.
 * @param {string|null|undefined} raw CSV
 * @param {{ byId: Map<string, object> }} registry
 * @returns {string[]}
 */
function parseRequiredSites(raw, registry) {
  if (!raw) return []
  const ids = String(raw)
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
  const known = ids.filter((id) => registry.byId.has(id))
  const unknown = ids.filter((id) => !registry.byId.has(id))
  if (unknown.length > 0) {
    console.warn(
      `⚠️  [health] HEALTH_REQUIRED_SITES cite des sites inconnus, ignorés : ${unknown.join(', ')}`,
    )
  }
  return known
}

/**
 * @param {{ byId: Map<string, object>, list(): object[] }} registry
 * @param {{
 *   token?: string|null,
 *   deepTtlMs?: number,
 *   paymentsTtlMs?: number,
 *   probeTimeoutMs?: number,
 *   paymentsWindowMinutes?: number,
 *   requiredSiteIds?: string[],
 *   deepRunner?: Function,
 *   paymentsRunner?: Function,
 * }} [options]
 *   `deepRunner` / `paymentsRunner` : points d'injection pour les tests, afin de
 *   vérifier les codes retour sans toucher aux API tierces.
 */
function buildHealthRouter(registry, options = {}) {
  const router = express.Router()

  const token =
    options.token !== undefined ? options.token : process.env.HEALTH_CHECK_TOKEN || null
  const deepTtlMs = options.deepTtlMs ?? parsePositiveInt(process.env.HEALTH_CACHE_TTL_MS, DEFAULT_DEEP_TTL_MS)
  const paymentsTtlMs =
    options.paymentsTtlMs ?? parsePositiveInt(process.env.HEALTH_PAYMENTS_TTL_MS, DEFAULT_PAYMENTS_TTL_MS)
  const probeTimeoutMs =
    options.probeTimeoutMs ?? parsePositiveInt(process.env.HEALTH_PROBE_TIMEOUT_MS, DEFAULT_PROBE_TIMEOUT_MS)
  const paymentsWindowMinutes =
    options.paymentsWindowMinutes ?? parsePositiveInt(process.env.HEALTH_PAYMENTS_WINDOW_MINUTES, 90)

  const requiredSiteIds =
    options.requiredSiteIds ?? parseRequiredSites(process.env.HEALTH_REQUIRED_SITES, registry)

  const deepRunner = options.deepRunner || runDeepCheck
  const paymentsRunner = options.paymentsRunner || runPaymentsInvariant

  const deepChecker = options.deepRunner
    ? createCachedRunner(() => deepRunner(registry, { timeoutMs: probeTimeoutMs }), deepTtlMs)
    : createDeepHealthChecker(registry, {
        ttlMs: deepTtlMs,
        timeoutMs: probeTimeoutMs,
        requiredSiteIds,
      })
  const paymentsChecker = createCachedRunner(
    () => paymentsRunner(registry, { windowMinutes: paymentsWindowMinutes }),
    paymentsTtlMs,
  )

  const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: parsePositiveInt(process.env.HEALTH_RATE_LIMIT_MAX, 30),
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, _next, opts) => {
      res.status(opts.statusCode).json({ status: 'rate_limited' })
    },
  })

  /** Jeton obligatoire ; aucun détail d'implémentation en cas d'échec. */
  function requireHealthToken(req, res, next) {
    if (!token) {
      return res.status(503).json({
        status: 'disabled',
        error: 'HEALTH_CHECK_TOKEN non configuré : endpoints de supervision désactivés.',
      })
    }
    const provided = extractHealthToken(req)
    if (!provided || !timingSafeEquals(provided, token)) {
      return res.status(401).json({ status: 'unauthorized' })
    }
    return next()
  }

  /**
   * Restreint la réponse à un site si `?site=` est fourni.
   * @param {import('express').Request} req
   */
  function resolveSiteFilter(req, res) {
    const siteId = typeof req.query.site === 'string' ? req.query.site : null
    if (siteId && !registry.byId.has(siteId)) {
      res.status(404).json({ status: 'unknown_site' })
      return { handled: true, siteId: null }
    }
    return { handled: false, siteId }
  }

  router.get('/deep', limiter, requireHealthToken, async (req, res) => {
    const { handled, siteId } = resolveSiteFilter(req, res)
    if (handled) return undefined

    const strict = isTruthyFlag(req.query.strict)
    try {
      const payload = siteId
        ? {
            ...(await deepRunner(registry, {
              siteId,
              timeoutMs: probeTimeoutMs,
              requiredSiteIds,
            })),
            cached: false,
          }
        : await deepChecker.run({ force: isTruthyFlag(req.query.force) })

      const failing = payload.status === 'down' || (strict && payload.status === 'degraded')
      return res.status(failing ? 503 : 200).json(payload)
    } catch (err) {
      console.error('[health] /deep:', err)
      return res.status(503).json({ status: 'down', error: 'health check failed' })
    }
  })

  router.get('/payments', limiter, requireHealthToken, async (req, res) => {
    const { handled, siteId } = resolveSiteFilter(req, res)
    if (handled) return undefined

    const windowMinutes = parsePositiveInt(req.query.windowMinutes, paymentsWindowMinutes)
    // Le cache ne couvre que les paramètres par défaut : une requête sur mesure
    // (site ciblé, autre fenêtre) déclenche un passage frais.
    const custom = Boolean(siteId) || windowMinutes !== paymentsWindowMinutes

    try {
      const payload = custom
        ? { ...(await paymentsRunner(registry, { siteId, windowMinutes })), cached: false }
        : await paymentsChecker.run({ force: isTruthyFlag(req.query.force) })

      return res.status(payload.status === 'ok' ? 200 : 503).json(payload)
    } catch (err) {
      console.error('[health] /payments:', err)
      return res.status(503).json({ status: 'down', error: 'payments check failed' })
    }
  })

  return router
}

module.exports = {
  buildHealthRouter,
  parseRequiredSites,
  extractHealthToken,
  timingSafeEquals,
}
