/**
 * Middleware Express : résout `req.site` à partir de la requête entrante.
 *
 * Ordre de résolution :
 *   1. Param URL `:siteId` (utilisé par /api/stripe/webhook/:siteId)
 *   2. Header `X-Site-Id` (posé par tous les fronts, cf. packages/base/src/services/*)
 *   3. Header `Origin` → registry.byOrigin
 *   4. Header `Host` (sans schéma) → registry.byHost
 *   5. En dev, fallback `DEV_DEFAULT_SITE_ID` ou `sauvage-watches`
 *   6. Sinon → 400 Unknown site
 *
 * ## Recoupement du site déclaré avec l'Origin
 *
 * Les sources 1 et 2 sont **déclarées par l'appelant** ; l'`Origin` d'une requête navigateur
 * est posée par le navigateur, hors de portée du script de la page. Quand les deux se
 * contredisent — une page servie par la vitrine A demande à être traitée comme la vitrine B —
 * la requête est refusée plutôt qu'arbitrée.
 *
 * Sans ce recoupement, le backend étant mutualisé, une page d'un client peut agir dans le
 * contexte d'un autre sur les routes résolues par origine et sans authentification
 * (`/api/send-email`, `/api/newsletter/subscribe`, `POST /api/orders`) : e-mail parti du `From`
 * du voisin, écriture dans sa base. Les routes authentifiées ne sont pas concernées — leur
 * jeton est vérifié contre le Supabase du site résolu, donc en déclarer un autre ne fait
 * qu'invalider le jeton.
 *
 * Deux limites assumées :
 *
 * - un appelant **sans navigateur** (curl, script, serveur) n'envoie pas d'`Origin` : il reste
 *   libre de se déclarer comme il veut, et c'était déjà vrai avant la mutualisation. Aucun
 *   recoupement ne peut l'en empêcher ; seule l'authentification propre à chaque route le fait.
 * - une origine revendiquée par **plusieurs** sites ne prouve rien : les quatre manifests
 *   déclarent `http://localhost:5173` en `urls.development`. `registry.ambiguousOrigins` les
 *   recense et elles sont exclues du recoupement, sinon le dev local de trois vitrines sur
 *   quatre serait refusé.
 *
 * Le webhook Stripe (`/api/stripe/webhook/:siteId`) suit la même règle : une requête Stripe
 * légitime n'a pas d'`Origin` et passe donc toujours ; un appel navigateur qui déclare le site
 * d'un autre client est refusé, comme ailleurs.
 */

const { trimTrailingSlash } = require('../sites/normalize')

const DEV_FALLBACK_SITE_ID =
  process.env.DEV_DEFAULT_SITE_ID && process.env.DEV_DEFAULT_SITE_ID.trim()
    ? process.env.DEV_DEFAULT_SITE_ID.trim()
    : 'sauvage-watches'

/** Issues possibles de `resolveSiteResult`. */
const RESOLUTION_OK = 'ok'
const RESOLUTION_UNKNOWN = 'unknown'
const RESOLUTION_SITE_MISMATCH = 'site_mismatch'

function isProdEnv() {
  return process.env.NODE_ENV === 'production' || process.env.RENDER === 'true'
}

/**
 * Site explicitement déclaré par l'appelant : param `:siteId` puis header `X-Site-Id`.
 * Un identifiant inconnu du registre n'est pas une revendication exploitable (faute de
 * frappe, site retiré) : il retombe sur les sources suivantes, comme avant.
 * @param {import('express').Request} req
 * @param {*} registry
 * @returns {{ entry: object, source: string }|null}
 */
function declaredSiteEntry(req, registry) {
  const paramId = req.params && req.params.siteId
  if (paramId && registry.byId.has(paramId)) {
    return { entry: registry.byId.get(paramId), source: ':siteId' }
  }

  const headerId = req.headers['x-site-id']
  if (typeof headerId === 'string' && headerId.trim()) {
    const entry = registry.byId.get(headerId.trim())
    if (entry) return { entry, source: 'X-Site-Id' }
  }

  return null
}

/**
 * Clé d'origine normalisée de la requête, ou `null` si l'appelant n'en envoie pas.
 * @param {import('express').Request} req
 * @returns {string|null}
 */
function originKey(req) {
  const origin = req.headers.origin
  if (typeof origin !== 'string' || !origin.trim()) return null
  return trimTrailingSlash(origin.trim())
}

/** Conflits déjà signalés — un appelant hostile ne doit pas inonder les logs Render. */
const warnedMismatches = new Set()

function warnMismatch({ declaredId, declaredSource, originId, origin }) {
  const key = `${declaredSource}:${declaredId}->${origin}`
  if (warnedMismatches.has(key)) return
  // La clé dépend de l'appelant : sans purge, un flux d'origines fabriquées ferait grossir
  // l'ensemble indéfiniment. Fenêtre glissante grossière, suffisante pour du journal.
  if (warnedMismatches.size >= 100) warnedMismatches.clear()
  warnedMismatches.add(key)
  console.warn(
    `⚠️  [resolveSite] Site déclaré "${declaredId}" (${declaredSource}) incompatible avec l'Origin ${origin} (site "${originId}") — requête refusée.`,
  )
}

/**
 * Résout le site sans envoyer de réponse HTTP, en distinguant « introuvable » de « refusé ».
 * @param {import('express').Request} req
 * @param {*} registry
 * @returns {{ site: object|null, reason: string, declaredId?: string, declaredSource?: string,
 *   originId?: string, origin?: string }}
 */
function resolveSiteResult(req, registry) {
  const declared = declaredSiteEntry(req, registry)
  const key = originKey(req)
  const originEntry = key ? registry.byOrigin.get(key) || null : null
  const originIsAmbiguous = Boolean(
    key && registry.ambiguousOrigins && registry.ambiguousOrigins.has(key),
  )

  if (declared && originEntry && !originIsAmbiguous && originEntry.id !== declared.entry.id) {
    return {
      site: null,
      reason: RESOLUTION_SITE_MISMATCH,
      declaredId: declared.entry.id,
      declaredSource: declared.source,
      originId: originEntry.id,
      origin: key,
    }
  }

  if (declared) return { site: declared.entry, reason: RESOLUTION_OK }
  if (originEntry) return { site: originEntry, reason: RESOLUTION_OK }

  const host = req.headers.host
  if (typeof host === 'string' && host.trim()) {
    const entry = registry.byHost.get(host.trim().toLowerCase())
    if (entry) return { site: entry, reason: RESOLUTION_OK }
  }

  if (!isProdEnv()) {
    const fallback = registry.byId.get(DEV_FALLBACK_SITE_ID)
    if (fallback) return { site: fallback, reason: RESOLUTION_OK }
  }

  return { site: null, reason: RESOLUTION_UNKNOWN }
}

/**
 * Tente de résoudre un site sans envoyer de réponse HTTP. Pratique pour le webhook
 * Stripe qui doit répondre proprement même si le site n'est pas trouvé. Un conflit
 * déclaré/Origin y ressort comme un échec : les appelants qui doivent le distinguer d'un
 * site introuvable passent par `resolveSiteResult`.
 * @param {import('express').Request} req
 * @param {ReturnType<import('../sites/registry').buildRegistry> extends Promise<infer R> ? R : never} registry
 * @returns {object|null}
 */
function resolveSiteFromRequest(req, registry) {
  return resolveSiteResult(req, registry).site
}

/**
 * Construit un middleware Express qui pose `req.site` ou répond 400.
 * @param {*} registry
 * @param {{ optional?: boolean }} [opts] Si optional=true, n'écrit pas de réponse en cas d'échec
 *   (le handler peut décider). Aucune route n'en use aujourd'hui ; celle qui le fera doit
 *   traiter l'absence de `req.site` comme un **refus** et non comme une simple absence —
 *   un conflit déclaré/Origin passe par ce chemin, et le rattraper par un site par défaut
 *   rouvrirait exactement la brèche que ce recoupement ferme.
 */
function resolveSite(registry, opts = {}) {
  return function resolveSiteMiddleware(req, res, next) {
    const result = resolveSiteResult(req, registry)

    if (result.reason === RESOLUTION_SITE_MISMATCH) {
      warnMismatch(result)
      if (opts.optional) return next()
      return res.status(400).json({
        success: false,
        error: "Site déclaré incompatible avec l'Origin de la requête",
      })
    }

    if (!result.site) {
      if (opts.optional) return next()
      return res.status(400).json({
        success: false,
        error: 'Unknown site (Origin / X-Site-Id / :siteId non reconnu)',
      })
    }

    req.site = result.site
    next()
  }
}

module.exports = {
  resolveSite,
  resolveSiteFromRequest,
  resolveSiteResult,
  DEV_FALLBACK_SITE_ID,
  RESOLUTION_OK,
  RESOLUTION_UNKNOWN,
  RESOLUTION_SITE_MISMATCH,
}
