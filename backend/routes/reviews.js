/**
 * Avis Google publics d'une fiche d'établissement (Places API New), mis en cache côté serveur.
 *
 * Pourquoi passer par le backend plutôt que d'appeler Google depuis le navigateur :
 *  - le champ `reviews` relève du SKU « Place Details Enterprise + Atmosphere », facturé à
 *    l'appel : un appel par visiteur coûterait cher, un cache partagé ramène la consommation
 *    à quelques appels par jour et par site ;
 *  - la clé front (`VITE_GOOGLE_PLACES_API_KEY`) est restreinte par référent HTTP et ne peut
 *    pas servir ici ; la clé serveur ne doit jamais atteindre le navigateur.
 *
 * Les CGU Google limitent la mise en cache du contenu Places à 30 jours : le TTL par défaut
 * (6 h) est très en deçà, et rien n'est persisté sur disque ni en base.
 */

const express = require('express')
const rateLimit = require('express-rate-limit')

const { createCachedRunner } = require('../health/cache')

const PLACES_ENDPOINT = 'https://places.googleapis.com/v1/places'
const FIELD_MASK = 'id,rating,userRatingCount,googleMapsUri,reviews'

const DEFAULT_TTL_MS = 6 * 60 * 60 * 1000
const DEFAULT_TIMEOUT_MS = 5000
/** Codes BCP 47 simples acceptés depuis la query (`fr`, `en`, `de`, `pt-BR`). */
const LANGUAGE_CODE_RE = /^[a-z]{2}(-[A-Za-z]{2})?$/

/**
 * @param {unknown} raw
 * @param {number} fallback
 * @returns {number}
 */
function parsePositiveInt(raw, fallback) {
  const parsed = parseInt(String(raw ?? ''), 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

/**
 * Langue demandée par le front, validée. Une valeur inconnue retombe sur la config du site
 * puis sur `fr` : jamais d'erreur, la langue n'est pas une donnée critique.
 * @param {unknown} requested
 * @param {string} configured
 * @returns {string}
 */
function resolveLanguageCode(requested, configured) {
  const candidate = typeof requested === 'string' ? requested.trim() : ''
  if (LANGUAGE_CODE_RE.test(candidate)) return candidate
  if (LANGUAGE_CODE_RE.test(configured)) return configured
  return 'fr'
}

/**
 * Réduit la réponse Places au strict nécessaire pour l'affichage, et trie du plus récent au
 * plus ancien : l'API classe par pertinence, alors que la page annonce « les derniers avis ».
 *
 * Fonction pure, exportée pour les tests.
 *
 * @param {Record<string, unknown>} place Réponse `places.googleapis.com/v1/places/{id}`.
 * @param {number} maxReviews
 * @returns {{ rating: number|null, userRatingCount: number, googleMapsUri: string, reviews: object[] }}
 */
function mapPlaceDetailsToPayload(place, maxReviews) {
  const source = place && typeof place === 'object' ? place : {}
  const rawReviews = Array.isArray(source.reviews) ? source.reviews : []

  const reviews = rawReviews
    .map((review) => {
      const author = review?.authorAttribution || {}
      const text = review?.originalText?.text || review?.text?.text || ''
      return {
        id: typeof review?.name === 'string' ? review.name : '',
        rating: Number.isFinite(Number(review?.rating)) ? Number(review.rating) : null,
        text: typeof text === 'string' ? text.trim() : '',
        publishTime: typeof review?.publishTime === 'string' ? review.publishTime : '',
        relativeTime:
          typeof review?.relativePublishTimeDescription === 'string'
            ? review.relativePublishTimeDescription
            : '',
        authorName: typeof author.displayName === 'string' ? author.displayName : '',
        authorPhotoUrl: typeof author.photoUri === 'string' ? author.photoUri : '',
        authorUri: typeof author.uri === 'string' ? author.uri : '',
      }
    })
    .filter((review) => review.rating != null && (review.text || review.authorName))
    .sort((a, b) => {
      const left = Date.parse(a.publishTime)
      const right = Date.parse(b.publishTime)
      if (Number.isNaN(left) && Number.isNaN(right)) return 0
      if (Number.isNaN(left)) return 1
      if (Number.isNaN(right)) return -1
      return right - left
    })
    .slice(0, maxReviews)

  const rating = Number.isFinite(Number(source.rating)) ? Number(source.rating) : null
  const userRatingCount = Number.isFinite(Number(source.userRatingCount))
    ? Number(source.userRatingCount)
    : 0

  return {
    rating,
    userRatingCount,
    googleMapsUri: typeof source.googleMapsUri === 'string' ? source.googleMapsUri : '',
    reviews,
  }
}

/**
 * Appel réel à Places API (New). Lève en cas d'échec : c'est l'appelant qui décide de
 * resservir un cache périmé ou de répondre 502.
 *
 * @param {{ placeId: string, apiKey: string, languageCode: string, timeoutMs: number }} params
 * @returns {Promise<Record<string, unknown>>}
 */
async function fetchPlaceDetails({ placeId, apiKey, languageCode, timeoutMs }) {
  const query = new URLSearchParams({ languageCode })
  const url = `${PLACES_ENDPOINT}/${encodeURIComponent(placeId)}?${query.toString()}`

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': FIELD_MASK,
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(timeoutMs),
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    const error = new Error(`Places API a répondu ${response.status}${detail ? ` : ${detail}` : ''}`)
    error.status = response.status
    throw error
  }

  return response.json()
}

/**
 * Routeur `/api/reviews`. Monté derrière `resolveSite`, il lit `req.site`.
 *
 * @param {{ byId: Map<string, object> }} registry
 * @param {{ ttlMs?: number, timeoutMs?: number, fetcher?: typeof fetchPlaceDetails, rateLimitMax?: number }} [options]
 *   `fetcher` est le point d'injection des tests (aucun appel réseau réel).
 * @returns {import('express').Router}
 */
function buildReviewsRouter(registry, options = {}) {
  const router = express.Router()

  const ttlMs = options.ttlMs ?? parsePositiveInt(process.env.REVIEWS_CACHE_TTL_MS, DEFAULT_TTL_MS)
  const timeoutMs =
    options.timeoutMs ?? parsePositiveInt(process.env.REVIEWS_TIMEOUT_MS, DEFAULT_TIMEOUT_MS)
  const fetcher = options.fetcher || fetchPlaceDetails

  /**
   * Un runner de cache par couple site + langue : `createCachedRunner` est mono-clé, et les
   * textes renvoyés par Google dépendent de `languageCode`. Même motif de `Map` par site que
   * `utils/siteClients.js`.
   * @type {Map<string, ReturnType<typeof createCachedRunner>>}
   */
  const runners = new Map()
  /**
   * Dernier payload valide par clé, resservi si Google tombe : sans lui, une panne amont vide
   * la section d'avis alors qu'on vient d'afficher les mêmes données cinq minutes plus tôt.
   * @type {Map<string, object>}
   */
  const lastGood = new Map()

  function getRunner(cacheKey, params) {
    const existing = runners.get(cacheKey)
    if (existing) return existing

    const runner = createCachedRunner(async () => {
      const place = await fetcher({ ...params, timeoutMs })
      const payload = mapPlaceDetailsToPayload(place, params.maxReviews)
      lastGood.set(cacheKey, payload)
      return payload
    }, ttlMs)

    runners.set(cacheKey, runner)
    return runner
  }

  const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: parsePositiveInt(process.env.REVIEWS_RATE_LIMIT_MAX, 60),
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, _next, opts) => {
      res
        .status(opts.statusCode)
        .json({ success: false, error: 'Trop de requêtes. Réessayez dans quelques instants.' })
    },
  })

  router.get('/', limiter, async (req, res) => {
    const site = req.site
    const config = site?.config?.googleReviews || {}
    const apiKey = site?.secrets?.googlePlaces?.apiKey

    if (!config.enabled || !config.placeId) {
      return res.status(503).json({
        success: false,
        error: `Avis Google non configurés pour le site "${site?.id}" : renseigner googleReviews.placeId dans son site.config.js.`,
      })
    }

    if (!apiKey) {
      return res.status(503).json({
        success: false,
        error: `Avis Google non configurés pour le site "${site.id}" : secret SITE_<ID>__GOOGLE_PLACES_API_KEY absent.`,
      })
    }

    const languageCode = resolveLanguageCode(req.query.lang, config.languageCode)
    const cacheKey = `${site.id}:${languageCode}`

    try {
      const payload = await getRunner(cacheKey, {
        placeId: config.placeId,
        apiKey,
        languageCode,
        maxReviews: config.maxReviews,
      }).run()

      const { cached, ...data } = payload
      return res.json({ success: true, data, cached })
    } catch (err) {
      console.error(`[${site.id}] reviews : échec de l'appel Places —`, err.message)

      const stale = lastGood.get(cacheKey)
      if (stale) {
        return res.json({ success: true, data: stale, cached: true, stale: true })
      }

      return res.status(502).json({
        success: false,
        error: 'Avis Google momentanément indisponibles.',
      })
    }
  })

  return router
}

module.exports = {
  buildReviewsRouter,
  mapPlaceDetailsToPayload,
  resolveLanguageCode,
  fetchPlaceDetails,
  DEFAULT_TTL_MS,
}
