/**
 * Résolution des secrets par site via variables d'environnement.
 *
 * Convention : `SITE_<UPPER_SITE_ID_AVEC_UNDERSCORES>__<KEY>`.
 *   ex. SITE_SAUVAGE_WATCHES__STRIPE_SECRET_KEY
 *
 * Deux replis distincts existent sur la variable non préfixée, à ne pas confondre :
 *
 * - **Historique** (`STRIPE_SECRET_KEY`, `SUPABASE_URL`…) : dette de la migration
 *   multi-sites, réservée à `sauvage-watches` et signalée par un warning. Elle
 *   disparaîtra avec la dernière variable non préfixée du déploiement.
 * - **Partagé** (`shared: true`) : un compte fournisseur unique dessert
 *   légitimement toutes les vitrines. Valable pour tous les siteId, sans
 *   warning — ce n'est pas une dette, c'est la configuration voulue.
 *
 * Seul Mailjet est partagé aujourd'hui : les vitrines postent par un même compte,
 * où chaque adresse d'expédition est validée une fois pour toutes ; l'identité de
 * la marque tient à l'adresse `From` du site, pas à la clé d'API. Stripe et
 * Supabase restent strictement par site — l'argent et les données d'un client ne
 * doivent jamais retomber sur le compte d'un autre faute de variable déclarée.
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
 * @param {{ legacyFallback?: string|null, legacySiteId?: string|null, shared?: boolean }} [opts]
 *   - `legacyFallback` : nom de la variable d'environnement historique (sans préfixe). Si omis, vaut `key`.
 *   - `legacySiteId` : restreint le fallback à ce siteId uniquement (par défaut "sauvage-watches").
 *   - `shared` : la variable non préfixée est un défaut assumé pour tous les sites — repli sans warning.
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
  if (!legacyFallback) return null

  const fallbackValue = process.env[legacyFallback]
  if (typeof fallbackValue !== 'string' || fallbackValue.length === 0) return null

  // Défaut partagé : aucune restriction de site, et rien à signaler.
  if (opts.shared) return fallbackValue

  const legacySiteId = opts.legacySiteId === undefined ? 'sauvage-watches' : opts.legacySiteId
  if (legacySiteId && siteId !== legacySiteId) return null

  const warnKey = `${siteId}:${key}`
  if (!warnedKeys.has(warnKey)) {
    warnedKeys.add(warnKey)
    console.warn(
      `⚠️  [secrets] Site "${siteId}" utilise la variable historique "${legacyFallback}" en lieu et place de "${prefixedName}". Migrer dès que possible.`,
    )
  }
  return fallbackValue
}

/**
 * Construit le bundle de secrets pour un site.
 * @param {string} siteId
 * @returns {{
 *   stripe: { secretKey: string|null, webhookSecret: string|null, checkoutRateLimitMax: number },
 *   supabase: { url: string|null, serviceRoleKey: string|null },
 *   mailjet: { apiKey: string|null, secretKey: string|null },
 *   analytics: { ga4MeasurementId: string|null, ga4ApiSecret: string|null },
 *   googlePlaces: { apiKey: string|null },
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
    // Compte Mailjet partagé par défaut : une vitrine sans clé dédiée poste par le
    // compte commun plutôt que de perdre silencieusement ses e-mails. Voir l'en-tête.
    mailjet: {
      apiKey: getSiteSecret(siteId, 'MAILJET_API_KEY', { shared: true }),
      secretKey: getSiteSecret(siteId, 'MAILJET_SECRET_KEY', { shared: true }),
    },
    // Envoi serveur du `purchase` à GA4 (Measurement Protocol). Clés introduites après la
    // migration multi-sites : pas de repli sur une variable historique non préfixée.
    analytics: {
      ga4MeasurementId: getSiteSecret(siteId, 'GA4_MEASUREMENT_ID', { legacyFallback: null }),
      ga4ApiSecret: getSiteSecret(siteId, 'GA4_API_SECRET', { legacyFallback: null }),
    },
    // Avis Google (Places API New, côté serveur). Clé DISTINCTE de la clé front
    // `VITE_GOOGLE_PLACES_API_KEY` : celle-ci est restreinte par référent HTTP et ne peut pas
    // servir depuis Render. Créer une clé serveur restreinte par IP, limitée à Places API (New).
    googlePlaces: {
      apiKey: getSiteSecret(siteId, 'GOOGLE_PLACES_API_KEY', { legacyFallback: null }),
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
