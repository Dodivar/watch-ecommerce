/**
 * Healthcheck profond : agrège les sondes de `probes.js` sur tous les sites.
 *
 * Le résultat est mémoïsé (TTL par défaut 60 s) et dédoublonné (single-flight) :
 * un moniteur externe qui interroge depuis trois régions, plus le workflow
 * planifié, ne doivent pas multiplier les allers-retours Supabase/Stripe. Le
 * plan Supabase Free compte l'egress, et l'endpoint serait sinon un levier
 * d'amplification même protégé par jeton.
 *
 * Dépendances « dures » (le checkout tombe sans elles) → statut global `down`.
 * Dépendances « souples » (une commande passe, un e-mail ou un PDF manque) →
 * `degraded`.
 */

const { createCachedRunner } = require('./cache')
const {
  probeMailjet,
  probeStripe,
  probeSupabaseDb,
  probeSupabaseStorage,
} = require('./probes')

const HARD_CHECKS = ['supabaseDb', 'stripe']
const SOFT_CHECKS = ['supabaseStorage', 'mailjet']
const DEFAULT_TTL_MS = 60 * 1000

/**
 * Statut d'un site à partir de ses sondes.
 *
 * `required` (site déclaré en production via `HEALTH_REQUIRED_SITES`) change la
 * lecture d'un secret manquant : sur un site de démo c'est normal, sur un site
 * en production c'est une panne. Sans cette distinction, un
 * `SITE_X__SUPABASE_URL` effacé par erreur des variables Render ferait passer
 * toutes les sondes en `not_configured` — et le monitoring resterait vert alors
 * que la boutique est morte. C'est exactement le mensonge que ce endpoint est
 * censé supprimer.
 *
 * @param {Record<string, { status: string }>} checks
 * @param {{ required?: boolean }} [options]
 * @returns {'ok'|'degraded'|'down'|'not_configured'}
 */
function aggregateSiteStatus(checks, options = {}) {
  const entries = Object.entries(checks)
  const isBroken = (key) => checks[key]?.status === 'down'
  const isMissing = (key) => checks[key]?.status === 'not_configured'

  if (options.required) {
    if (HARD_CHECKS.some((key) => isBroken(key) || isMissing(key))) return 'down'
    if (SOFT_CHECKS.some((key) => isBroken(key) || isMissing(key))) return 'degraded'
    return 'ok'
  }

  if (entries.every(([, check]) => check.status === 'not_configured')) {
    return 'not_configured'
  }
  if (HARD_CHECKS.some(isBroken)) return 'down'
  if (SOFT_CHECKS.some(isBroken)) return 'degraded'
  return 'ok'
}

/**
 * Statut global à partir des statuts par site. Un site entièrement non
 * configuré (site de démo, gabarit) ne pèse pas sur le global.
 * @param {Record<string, { status: string }>} sites
 * @returns {'ok'|'degraded'|'down'}
 */
function aggregateGlobalStatus(sites) {
  const statuses = Object.values(sites).map((site) => site.status)
  if (statuses.includes('down')) return 'down'
  if (statuses.includes('degraded')) return 'degraded'
  return 'ok'
}

/**
 * Lance les quatre sondes d'un site en parallèle.
 * @param {object} site
 * @param {{ timeoutMs?: number, probes?: object, required?: boolean }} [options]
 */
async function checkSite(site, options = {}) {
  const probes = options.probes || {
    supabaseDb: probeSupabaseDb,
    supabaseStorage: probeSupabaseStorage,
    stripe: probeStripe,
    mailjet: probeMailjet,
  }
  const keys = Object.keys(probes)
  const results = await Promise.all(
    keys.map((key) => probes[key](site, { timeoutMs: options.timeoutMs })),
  )
  /** @type {Record<string, object>} */
  const checks = {}
  keys.forEach((key, index) => {
    checks[key] = results[index]
  })
  return {
    status: aggregateSiteStatus(checks, { required: options.required }),
    required: Boolean(options.required),
    checks,
  }
}

/**
 * Exécute le check complet (sans cache).
 * @param {{ list(): object[] }} registry
 * @param {{
 *   timeoutMs?: number,
 *   probes?: object,
 *   siteId?: string|null,
 *   requiredSiteIds?: string[],
 * }} [options]
 */
async function runDeepCheck(registry, options = {}) {
  const startedAt = Date.now()
  const all = registry.list()
  const targets = options.siteId ? all.filter((site) => site.id === options.siteId) : all
  const requiredSiteIds = options.requiredSiteIds || []
  const required = new Set(requiredSiteIds)

  const results = await Promise.all(
    targets.map((site) => checkSite(site, { ...options, required: required.has(site.id) })),
  )

  /** @type {Record<string, object>} */
  const sites = {}
  targets.forEach((site, index) => {
    sites[site.id] = results[index]
  })

  return {
    status: aggregateGlobalStatus(sites),
    checkedAt: new Date().toISOString(),
    durationMs: Date.now() - startedAt,
    // Vide = aucun site déclaré en production : les secrets manquants passent
    // alors pour normaux. Le workflow de supervision le signale.
    requiredSites: requiredSiteIds,
    sites,
  }
}

/**
 * Enveloppe `runDeepCheck` d'un cache TTL + single-flight.
 * @param {{ list(): object[] }} registry
 * @param {{ ttlMs?: number, timeoutMs?: number, probes?: object, requiredSiteIds?: string[] }} [options]
 */
function createDeepHealthChecker(registry, options = {}) {
  const ttlMs = Number.isFinite(options.ttlMs) ? options.ttlMs : DEFAULT_TTL_MS
  return createCachedRunner(() => runDeepCheck(registry, options), ttlMs)
}

module.exports = {
  DEFAULT_TTL_MS,
  HARD_CHECKS,
  SOFT_CHECKS,
  aggregateGlobalStatus,
  aggregateSiteStatus,
  checkSite,
  createDeepHealthChecker,
  runDeepCheck,
}
