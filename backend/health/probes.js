/**
 * Sondes « dépendance vivante » du healthcheck profond.
 *
 * `/api/health` ne prouve qu'une chose : Express écoute. Ces sondes font, pour
 * chaque site du registre, le plus petit aller-retour réel possible vers chaque
 * tiers (Supabase base + storage, Stripe, Mailjet) afin qu'une panne côté
 * fournisseur — ou un projet Supabase mis en pause, une clé révoquée, un quota
 * atteint — ressorte en rouge au lieu de passer pour un serveur en bonne santé.
 *
 * Règles :
 *   - aucune sonde n'écrit et aucune ne scanne (coût egress Supabase compté) ;
 *   - un secret absent n'est pas une panne : `not_configured` (déjà signalé au
 *     boot par `logBootWarnings`), sinon tout site de démo alerterait en boucle ;
 *   - chaque sonde est bornée dans le temps : un tiers qui ne répond jamais doit
 *     échouer vite, pas retenir la requête de monitoring.
 */

const {
  getStripeClient,
  getSupabaseClient,
  getMailjetClient,
  MissingSecretsError,
} = require('../utils/siteClients')
const { RECEIPT_BUCKET } = require('../orders/receiptStorage')

const DEFAULT_TIMEOUT_MS = 5000
const MAX_ERROR_LENGTH = 200

/** Table sondée pour la base : présente sur tous les sites (migrations communes). */
const PROBE_TABLE = 'watches'

/**
 * @param {unknown} message
 * @returns {string}
 */
function truncateError(message) {
  const text = String(message ?? 'Erreur inconnue')
  return text.length > MAX_ERROR_LENGTH ? `${text.slice(0, MAX_ERROR_LENGTH)}…` : text
}

/**
 * Borne une promesse dans le temps.
 * @template T
 * @param {Promise<T>} promise
 * @param {number} ms
 * @param {string} label
 * @returns {Promise<T>}
 */
function withTimeout(promise, ms, label) {
  let timer = null
  const timeout = new Promise((_resolve, reject) => {
    timer = setTimeout(() => reject(new Error(`Timeout ${label} après ${ms} ms`)), ms)
  })
  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer)
  })
}

/**
 * Exécute une sonde et normalise son résultat.
 * @param {string} label
 * @param {() => Promise<unknown>} fn
 * @param {{ timeoutMs?: number }} [options]
 * @returns {Promise<{ status: 'ok'|'down'|'not_configured', durationMs: number, error?: string, missing?: string[] }>}
 */
async function runProbe(label, fn, options = {}) {
  const timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS
  const startedAt = Date.now()
  try {
    await withTimeout(Promise.resolve().then(fn), timeoutMs, label)
    return { status: 'ok', durationMs: Date.now() - startedAt }
  } catch (err) {
    const durationMs = Date.now() - startedAt
    if (err instanceof MissingSecretsError || err?.code === 'MISSING_SECRETS') {
      return { status: 'not_configured', durationMs, missing: err.missing || [] }
    }
    return { status: 'down', durationMs, error: truncateError(err?.message) }
  }
}

/**
 * Base Supabase : un `select id limit 1`, l'aller-retour authentifié le moins cher.
 * @param {object} site
 * @param {{ timeoutMs?: number }} [options]
 */
function probeSupabaseDb(site, options = {}) {
  return runProbe(
    'supabaseDb',
    async () => {
      const supabase = getSupabaseClient(site)
      const { error } = await supabase.from(PROBE_TABLE).select('id').limit(1)
      if (error) throw new Error(error.message)
    },
    options,
  )
}

/**
 * Storage Supabase : liste d'un seul objet du bucket des reçus (aucun téléchargement).
 * @param {object} site
 * @param {{ timeoutMs?: number }} [options]
 */
function probeSupabaseStorage(site, options = {}) {
  return runProbe(
    'supabaseStorage',
    async () => {
      const supabase = getSupabaseClient(site)
      const { error } = await supabase.storage.from(RECEIPT_BUCKET).list('', { limit: 1 })
      if (error) throw new Error(error.message)
    },
    options,
  )
}

/**
 * Stripe : `balance.retrieve()` — lecture pure, sans effet de bord, qui échoue
 * dès que la clé est révoquée ou le compte restreint.
 * @param {object} site
 * @param {{ timeoutMs?: number }} [options]
 */
function probeStripe(site, options = {}) {
  return runProbe(
    'stripe',
    async () => {
      const stripe = getStripeClient(site)
      await stripe.balance.retrieve()
    },
    options,
  )
}

/**
 * Mailjet : `GET /user` — même sonde que `/api/test-mailjet`, sans envoi.
 * @param {object} site
 * @param {{ timeoutMs?: number }} [options]
 */
function probeMailjet(site, options = {}) {
  return runProbe(
    'mailjet',
    async () => {
      const mailjet = getMailjetClient(site)
      await mailjet.get('user').request()
    },
    options,
  )
}

module.exports = {
  DEFAULT_TIMEOUT_MS,
  PROBE_TABLE,
  probeMailjet,
  probeStripe,
  probeSupabaseDb,
  probeSupabaseStorage,
  runProbe,
  truncateError,
  withTimeout,
}
