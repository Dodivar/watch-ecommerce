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
import {
  MATCH_ROUND_SIZE,
  createEmptyPreferences,
  sanitizePreferences,
} from '@/utils/watchMatchmaking.js'

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
 * @property {string[]} sparks         Ids des coups de foudre (sous-ensemble de `liked`), dans l'ordre
 * @property {number} deckLimit        Montres présentables au total, manches cumulées
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
    sparks: [],
    deckLimit: MATCH_ROUND_SIZE,
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
 * Coups de foudre : toujours un sous-ensemble des coups de cœur. Un coup de cœur retiré
 * emporte son coup de foudre ; un identifiant orphelin ne survit donc pas à une relecture.
 *
 * @param {unknown} sparks
 * @param {string[]} liked
 * @returns {string[]}
 */
function sparkList(sparks, liked) {
  const likedSet = new Set(liked)
  return idList(sparks).filter((id) => likedSet.has(id))
}

/**
 * Une limite de deck absente, absurde ou rognée sous une manche redonne la manche par défaut :
 * une session reprise doit toujours avoir de quoi présenter quelque chose.
 *
 * @param {unknown} value
 * @returns {number}
 */
function deckLimit(value) {
  return Number.isInteger(value) && value >= MATCH_ROUND_SIZE ? value : MATCH_ROUND_SIZE
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
  const liked = idList(data.liked)

  return {
    version: MATCH_SESSION_VERSION,
    savedAt: data.savedAt,
    preferences: sanitizePreferences(data.preferences),
    step,
    stepIndex,
    seen: idList(data.seen),
    liked,
    passed: idList(data.passed),
    // Champs ajoutés après coup (`sparks`, `deckLimit`) : une session écrite avant eux reprend
    // le défaut plutôt que d'être jetée.
    sparks: sparkList(data.sparks, liked),
    // Champ ajouté après coup : une session écrite avant lui reprend le défaut plutôt que
    // d'être jetée. Pas de bump de version, la reprise est exactement celle qu'on veut.
    deckLimit: deckLimit(data.deckLimit),
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
  const liked = idList(session?.liked)
  const payload = {
    version: MATCH_SESSION_VERSION,
    savedAt: new Date().toISOString(),
    preferences: sanitizePreferences(session?.preferences),
    step: MATCH_STEPS.includes(session?.step) ? session.step : 'onboarding',
    stepIndex: Number.isInteger(session?.stepIndex) ? Math.max(0, session.stepIndex) : 0,
    seen: idList(session?.seen),
    liked,
    passed: idList(session?.passed),
    sparks: sparkList(session?.sparks, liked),
    deckLimit: deckLimit(session?.deckLimit),
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
      sparks: sparkList(session?.sparks, liked),
    },
    unavailableLikedIds: liked.filter((id) => !available.has(id)),
  }
}
