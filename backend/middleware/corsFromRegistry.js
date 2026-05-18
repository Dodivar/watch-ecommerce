/**
 * CORS dynamique adossé au registry des sites.
 *
 * - Toute origine listée dans `registry.allOrigins` est autorisée.
 * - La variable d'env `BACKEND_CORS_ORIGINS` (CSV) ajoute des origines globales
 *   (rétrocompatibilité avec la configuration legacy).
 * - En dev (NODE_ENV != production && RENDER != true), localhost est ajouté
 *   par défaut pour faciliter le travail local.
 */

const cors = require('cors')

const { trimTrailingSlash } = require('../sites/normalize')

const DEV_DEFAULT_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
]

function readGlobalExtraOrigins() {
  const raw = process.env.BACKEND_CORS_ORIGINS
  if (!raw || !String(raw).trim()) return []
  return String(raw)
    .split(',')
    .map((s) => trimTrailingSlash(s.trim()))
    .filter(Boolean)
}

function isProdEnv() {
  return process.env.NODE_ENV === 'production' || process.env.RENDER === 'true'
}

/**
 * @param {*} registry Sortie de `buildRegistry()`.
 * @returns {{ middleware: import('express').RequestHandler, options: import('cors').CorsOptions, allowed: Set<string> }}
 */
function corsFromRegistry(registry) {
  const allowed = new Set()
  for (const origin of registry.allOrigins) {
    allowed.add(trimTrailingSlash(origin))
  }
  for (const extra of readGlobalExtraOrigins()) {
    allowed.add(extra)
  }
  if (!isProdEnv()) {
    for (const dev of DEV_DEFAULT_ORIGINS) allowed.add(dev)
  }

  /** @type {import('cors').CorsOptions} */
  const options = {
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true)
      }
      const key = trimTrailingSlash(origin)
      if (allowed.has(key)) return callback(null, true)
      return callback(new Error(`CORS: origin "${origin}" non autorisée`))
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Accept',
      'Authorization',
      'X-Requested-With',
      'Origin',
      'X-Site-Id',
    ],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  }

  return {
    middleware: cors(options),
    options,
    allowed,
  }
}

module.exports = {
  corsFromRegistry,
  readGlobalExtraOrigins,
}
