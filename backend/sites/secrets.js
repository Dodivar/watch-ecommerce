/**
 * Résolution des secrets par site via variables d'environnement.
 *
 * Convention : `SITE_<UPPER_SITE_ID_AVEC_UNDERSCORES>__<KEY>`.
 *   ex. SITE_SAUVAGE_WATCHES__STRIPE_SECRET_KEY
 *
 * Rétrocompatibilité : si la variable préfixée n'est pas définie, on retombe
 * sur la variable historique (ex. `STRIPE_SECRET_KEY`) en émettant un warning
 * une seule fois par couple (siteId, key) afin de ne pas casser le déploiement
 * Sauvage existant.
 */

const warnedKeys = new Set()

/**
 * Convertit un siteId (kebab-case) en segment d'env var (UPPER_SNAKE_CASE).
 * @param {string} siteId
 * @returns {string}
 */
function siteIdToEnvSegment(siteId) {
  return String(siteId).trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_')
}

/**
 * Récupère un secret pour un site donné.
 * @param {string} siteId
 * @param {string} key Nom de la clé (ex. "STRIPE_SECRET_KEY")
 * @param {{ legacyFallback?: string|null, legacySiteId?: string|null }} [opts]
 *   - `legacyFallback` : nom de la variable d'environnement historique (sans préfixe). Si omis, vaut `key`.
 *   - `legacySiteId` : restreint le fallback à ce siteId uniquement (par défaut "sauvage-watches").
 * @returns {string|null}
 */
function getSiteSecret(siteId, key, opts = {}) {
  const segment = siteIdToEnvSegment(siteId)
  const prefixedName = `SITE_${segment}__${key}`
  const prefixed = process.env[prefixedName]
  if (typeof prefixed === 'string' && prefixed.length > 0) {
    return prefixed
  }

  const legacyFallback = opts.legacyFallback === undefined ? key : opts.legacyFallback
  const legacySiteId = opts.legacySiteId === undefined ? 'sauvage-watches' : opts.legacySiteId
  if (legacyFallback && (!legacySiteId || siteId === legacySiteId)) {
    const legacy = process.env[legacyFallback]
    if (typeof legacy === 'string' && legacy.length > 0) {
      const warnKey = `${siteId}:${key}`
      if (!warnedKeys.has(warnKey)) {
        warnedKeys.add(warnKey)
        console.warn(
          `⚠️  [secrets] Site "${siteId}" utilise la variable historique "${legacyFallback}" en lieu et place de "${prefixedName}". Migrer dès que possible.`,
        )
      }
      return legacy
    }
  }
  return null
}

/**
 * Construit le bundle de secrets pour un site.
 * @param {string} siteId
 * @returns {{
 *   stripe: { secretKey: string|null, webhookSecret: string|null, checkoutRateLimitMax: number },
 *   supabase: { url: string|null, serviceRoleKey: string|null },
 *   mailjet: { apiKey: string|null, secretKey: string|null },
 *   analytics: { ga4MeasurementId: string|null, ga4ApiSecret: string|null },
 *   paymentCancelSecret: string|null,
 *   baseUrlOverride: string|null,
 *   emailFrom: string|null
 * }}
 */
function getSiteSecrets(siteId) {
  const rawRateLimit = getSiteSecret(siteId, 'STRIPE_CHECKOUT_RATE_LIMIT_MAX')
  const parsedRate = rawRateLimit ? parseInt(rawRateLimit, 10) : NaN

  return {
    stripe: {
      secretKey: getSiteSecret(siteId, 'STRIPE_SECRET_KEY'),
      webhookSecret: getSiteSecret(siteId, 'STRIPE_WEBHOOK_SECRET'),
      checkoutRateLimitMax: Number.isFinite(parsedRate) && parsedRate > 0 ? parsedRate : 30,
    },
    supabase: {
      url: getSiteSecret(siteId, 'SUPABASE_URL'),
      serviceRoleKey: getSiteSecret(siteId, 'SUPABASE_SERVICE_ROLE_KEY'),
    },
    mailjet: {
      apiKey: getSiteSecret(siteId, 'MAILJET_API_KEY'),
      secretKey: getSiteSecret(siteId, 'MAILJET_SECRET_KEY'),
    },
    // Envoi serveur du `purchase` à GA4 (Measurement Protocol). Clés introduites après la
    // migration multi-sites : pas de repli sur une variable historique non préfixée.
    analytics: {
      ga4MeasurementId: getSiteSecret(siteId, 'GA4_MEASUREMENT_ID', { legacyFallback: null }),
      ga4ApiSecret: getSiteSecret(siteId, 'GA4_API_SECRET', { legacyFallback: null }),
    },
    paymentCancelSecret: getSiteSecret(siteId, 'PAYMENT_CANCEL_SECRET'),
    baseUrlOverride: getSiteSecret(siteId, 'BASE_URL'),
    emailFrom: getSiteSecret(siteId, 'EMAIL_FROM'),
  }
}

module.exports = {
  siteIdToEnvSegment,
  getSiteSecret,
  getSiteSecrets,
}
