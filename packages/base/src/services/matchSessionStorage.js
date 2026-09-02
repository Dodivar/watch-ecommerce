/**
 * Session locale de l'expérience « coup de foudre » (`localStorage`).
 *
 * Même patron que `cookieConsent.js` : payload versionné, durée de vie, garde SSR et rejet
 * silencieux de tout ce qui n'a pas la forme attendue — un stockage corrompu ou périmé
 * redonne simplement une session neuve, jamais une erreur visible.
 *
 * Seuls des **identifiants** de montre sont conservés : prix, visuels et disponibilité
 * viennent du réseau à chaque visite, et `reconcileMatchSession` rapproche la session du stock
 * du moment. C'est tout le contrat de la demande : l'historique de swipe ne quitte jamais le
 * navigateur (voir `watchMatchAlertService.js` pour la seule donnée qui pourra partir en base).
 */

import { getSiteConfig } from '@/site/getSiteConfig.js'
import { createEmptyPreferences, sanitizePreferences } from '@/utils/watchMatchmaking.js'

export const MATCH_SESSION_VERSION = 1

/** Une session oubliée un mois est une session à recommencer : le stock aura changé. */
export const MATCH_SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000

/** @type {ReadonlyArray<MatchStep>} */
export const MATCH_STEPS = ['onboarding', 'swipe', 'end', 'shortlist']

/**
 * @typedef {'onboarding' | 'swipe' | 'end' | 'shortlist'} MatchStep
 *
 * @typedef {object} MatchSession
 * @property {number} version
 * @property {string | null} savedAt   ISO 8601
 * @property {import('@/utils/watchMatchmaking.js').MatchPreferences} preferences
 * @property {MatchStep} step
 * @property {number} stepIndex        Écran de préférences courant (reprise de l'onboarding)
 * @property {string[]} seen           Ids déjà présentés, dans l'ordre
 * @property {string[]} liked          Ids aimés, dans l'ordre du coup de cœur
 * @property {string[]} passed         Ids passés
 */

/** Clé par site, comme `watch-ecommerce:catalog-brands:${siteId}` dans `watchService.js`. */
export function getMatchSessionStorageKey() {
  const siteId = getSiteConfig().siteId || 'default'
  return `watch-ecommerce:matchmaking:${siteId}`
}

/** @returns {MatchSession} */
export function createEmptyMatchSession() {
  return {
    version: MATCH_SESSION_VERSION,
    savedAt: null,
    preferences: createEmptyPreferences(),
    step: 'onboarding',
    stepIndex: 0,
    seen: [],
    liked: [],
    passed: [],
  }
}

/**
 * @param {unknown} value
 * @returns {string[]}
 */
function idList(value) {
  if (!Array.isArray(value)) return []
  const out = []
  const seen = new Set()
  for (const id of value) {
    if (typeof id !== 'string' || !id || seen.has(id)) continue
    seen.add(id)
    out.push(id)
  }
  return out
}

/**
 * Valide et normalise un payload brut. Renvoie `null` si la version ou la forme ne
 * correspondent pas, ou si la session est périmée.
 *
 * @param {unknown} raw
 * @param {number} [now]
 * @returns {MatchSession | null}
 */
export function parseMatchSession(raw, now = Date.now()) {
  if (!raw || typeof raw !== 'object') return null
  const data = /** @type {any} */ (raw)
  if (data.version !== MATCH_SESSION_VERSION) return null
  if (typeof data.savedAt !== 'string') return null

  const saved = new Date(data.savedAt).getTime()
  if (Number.isNaN(saved)) return null
  if (now - saved > MATCH_SESSION_TTL_MS) return null

  const step = MATCH_STEPS.includes(data.step) ? data.step : 'onboarding'
  const stepIndex = Number.isInteger(data.stepIndex) && data.stepIndex >= 0 ? data.stepIndex : 0

  return {
    version: MATCH_SESSION_VERSION,
    savedAt: data.savedAt,
    preferences: sanitizePreferences(data.preferences),
    step,
    stepIndex,
    seen: idList(data.seen),
    liked: idList(data.liked),
    passed: idList(data.passed),
  }
}

/**
 * @returns {MatchSession | null}
 */
export function loadMatchSession() {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(getMatchSessionStorageKey())
    if (!raw) return null
    return parseMatchSession(JSON.parse(raw))
  } catch {
    return null
  }
}

/**
 * Écrit la session (horodatée). Les échecs (quota, navigation privée) sont ignorés :
 * l'expérience continue en mémoire.
 *
 * @param {MatchSession} session
 * @returns {MatchSession} La session telle qu'écrite (avec `savedAt`).
 */
export function saveMatchSession(session) {
  const payload = {
    version: MATCH_SESSION_VERSION,
    savedAt: new Date().toISOString(),
    preferences: sanitizePreferences(session?.preferences),
    step: MATCH_STEPS.includes(session?.step) ? session.step : 'onboarding',
    stepIndex: Number.isInteger(session?.stepIndex) ? Math.max(0, session.stepIndex) : 0,
    seen: idList(session?.seen),
    liked: idList(session?.liked),
    passed: idList(session?.passed),
  }
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(getMatchSessionStorageKey(), JSON.stringify(payload))
    } catch {
      /* quota ou stockage indisponible : la session reste en mémoire */
    }
  }
  return payload
}

export function clearMatchSession() {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.removeItem(getMatchSessionStorageKey())
  } catch {
    /* ignoré */
  }
}

/**
 * Rapproche une session du stock courant. Les montres vues ou passées qui ont disparu sont
 * oubliées sans bruit ; les coups de cœur disparus sont **conservés** et signalés, pour que
 * la shortlist puisse dire « plus disponible » plutôt que de faire disparaître une montre
 * qu'on avait choisie.
 *
 * @param {MatchSession} session
 * @param {Array<{ id: string }>} pool
 * @returns {{ session: MatchSession, unavailableLikedIds: string[] }}
 */
export function reconcileMatchSession(session, pool) {
  const available = new Set((Array.isArray(pool) ? pool : []).map((w) => w?.id).filter(Boolean))
  const liked = idList(session?.liked)
  return {
    session: {
      ...createEmptyMatchSession(),
      ...session,
      seen: idList(session?.seen).filter((id) => available.has(id)),
      passed: idList(session?.passed).filter((id) => available.has(id)),
      liked,
    },
    unavailableLikedIds: liked.filter((id) => !available.has(id)),
  }
}
