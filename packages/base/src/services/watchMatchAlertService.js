/**
 * Alerte « nouvelle montre » — phase 2 de l'expérience « coup de foudre ».
 *
 * Seule donnée du parcours autorisée à quitter le navigateur : l'e-mail et les **préférences**
 * (`MatchPreferences`, y compris `offered` — les options affichées, qui ne disent rien de la
 * personne), rien d'autre. L'historique de swipe (`seen`, `liked`, `passed`) reste
 * dans `matchSessionStorage.js` et n'entre jamais dans ce payload — c'est une règle de la
 * fonctionnalité, pas un oubli. `buildMatchAlertPayload` est exporté pour que le test puisse le
 * vérifier sur pièce, et `sanitizePreferences` est rejoué côté backend : un client n'est pas
 * une frontière de validation.
 *
 * Calqué sur `newsletterSignupService.js` : même en-tête `X-Site-Id`, même pot de miel
 * `website`, même désinscription par jeton.
 */

import { getActiveLocale } from '@/i18n'
import { sanitizePreferences } from '@/utils/watchMatchmaking.js'

import { getBackendApiUrl, readApiResponseBody } from './backendApiUrl.js'

/** Chemin backend Express, dans la famille de `/api/newsletter/subscribe`. */
export const MATCH_ALERT_ENDPOINT = '/api/watch-match-alerts/subscribe'

/** Site actif (build Vite) — cohérent avec `newsletterSignupService.js`. */
const SITE_ID = import.meta.env.VITE_SITE_ID || 'sauvage-watches'

/**
 * Le backend répond 503 quand ses secrets manquent (site non configuré). Ce n'est pas une
 * erreur de saisie : le CTA le dit autrement (« cette option arrive bientôt ») plutôt que
 * d'exposer une panne au visiteur.
 */
export class MatchAlertUnavailableError extends Error {
  constructor(message) {
    super(message || "L'alerte coup de foudre est momentanément indisponible.")
    this.name = 'MatchAlertUnavailableError'
    this.code = 'UNAVAILABLE'
  }
}

/**
 * Corps de requête tel qu'il part vers le backend. Exposé pour verrouiller par test que seules
 * les préférences voyagent.
 *
 * @param {{ email: string, criteria: unknown, website?: string, consent?: boolean }} input
 */
export function buildMatchAlertPayload({ email, criteria, website, consent }) {
  return {
    email: String(email ?? '')
      .trim()
      .toLowerCase(),
    criteria: sanitizePreferences(criteria),
    website: website || undefined,
    // Consentement explicite (case décochée par défaut) : le backend l'horodate.
    consent: consent === true,
    locale: getActiveLocale(),
  }
}

/**
 * @param {{ email: string, criteria: unknown, website?: string, consent?: boolean }} input
 *   `website` est le pot de miel anti-bot : vide pour un humain.
 * @returns {Promise<object>}
 */
export async function saveMatchAlert(input) {
  const apiUrl = getBackendApiUrl()
  const response = await fetch(`${apiUrl}${MATCH_ALERT_ENDPOINT}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Site-Id': SITE_ID,
    },
    body: JSON.stringify(buildMatchAlertPayload(input)),
  })

  const data = await readApiResponseBody(response)
  if (response.status === 503) {
    throw new MatchAlertUnavailableError(data.error)
  }
  if (!response.ok || data.success === false) {
    throw new Error(data.error || data.message || "Échec de l'enregistrement")
  }
  return data
}

/* ------------------------------------------------- Page « mes préférences » */

/** Chemin de la page — le même que construit le backend (`ALERT_PREFERENCES_PATH`). */
export const MATCH_ALERT_PREFERENCES_PATH = '/coup-de-foudre/mes-preferences'

/**
 * Page de désinscription, cible du lien « Ne plus recevoir ces alertes » des e-mails — le même
 * chemin que construit le backend (`ALERT_UNSUBSCRIBE_PATH`).
 */
export const MATCH_ALERT_UNSUBSCRIBE_PATH = '/coup-de-foudre/desabonnement'

/** Pages qui reçoivent le jeton dans l'ancre de leur lien d'e-mail. */
const TOKEN_PAGE_PATHS = [MATCH_ALERT_PREFERENCES_PATH, MATCH_ALERT_UNSUBSCRIBE_PATH]

/** Endpoint des préférences d'une alerte (jeton en en-tête `X-Alert-Token`). */
export const MATCH_ALERT_PREFERENCES_ENDPOINT = '/api/watch-match-alerts/preferences'

/**
 * Clé de session du jeton. `sessionStorage` et non `localStorage` : le jeton vaut accès à
 * l'alerte, il n'a pas à survivre à l'onglet. Il y est posé pour qu'un rechargement de la page
 * — dont l'URL ne le porte plus — ne tombe pas sur « lien invalide ».
 */
const TOKEN_STORAGE_KEY = `watch-ecommerce:match-alert-token:${SITE_ID}`

/**
 * Jeton porté par l'ancre du lien d'e-mail (`#token=…`).
 * @param {string} hash `location.hash` ou `route.hash`
 * @returns {string}
 */
export function readAlertTokenFromHash(hash) {
  const params = new URLSearchParams(String(hash || '').replace(/^#/, ''))
  return (params.get('token') || '').trim()
}

/** @param {string} token */
export function rememberAlertToken(token) {
  try {
    sessionStorage.setItem(TOKEN_STORAGE_KEY, token)
  } catch {
    // Stockage indisponible (navigation privée stricte) : la page fonctionne jusqu'au
    // prochain rechargement, qui demandera de rouvrir le lien.
  }
}

/**
 * Retire le jeton de l'URL **au démarrage**, avant `initAnalytics()` (`main.js`).
 *
 * Le garde de route de la page ne suffit pas au premier chargement : le pixel Meta met sa
 * page vue en file dès l'initialisation, et GA envoie la sienne à la fin du chargement de son
 * script — tous deux lisent l'URL courante, ancre comprise. Ce nettoyage synchrone passe avant
 * eux. Limité aux pages des alertes (préférences, désinscription) : une ancre ailleurs ne
 * regarde pas les alertes.
 *
 * @param {Pick<Location, 'hash' | 'pathname' | 'search'>} [loc]
 * @param {Pick<History, 'state' | 'replaceState'>} [hist]
 * @returns {string} Le jeton retiré, ou `''`
 */
export function consumeAlertTokenFromLocation(loc = window.location, hist = window.history) {
  const path = String(loc?.pathname || '').replace(/\/+$/, '')
  if (!TOKEN_PAGE_PATHS.some((page) => path.endsWith(page))) return ''
  const token = readAlertTokenFromHash(loc.hash)
  if (!token) return ''
  rememberAlertToken(token)
  hist.replaceState(hist.state, '', `${loc.pathname}${loc.search}`)
  return token
}

/** @returns {string} */
export function recallAlertToken() {
  try {
    return sessionStorage.getItem(TOKEN_STORAGE_KEY) || ''
  } catch {
    return ''
  }
}

/**
 * Erreur d'une requête « préférences », porteuse du code rendu par le backend
 * (`INVALID_TOKEN`, `UNKNOWN_TOKEN`, `INACTIVE`, `UNAVAILABLE`…) : la page choisit son écran
 * sur ce code, pas sur un message.
 */
export class MatchAlertPreferencesError extends Error {
  /** @param {string} code */
  constructor(code) {
    super(code)
    this.name = 'MatchAlertPreferencesError'
    this.code = code
  }
}

/**
 * @param {string} token
 * @param {{ method?: string, body?: unknown }} [init]
 */
async function requestPreferences(token, { method = 'GET', body, path = '' } = {}) {
  const response = await fetch(`${getBackendApiUrl()}${MATCH_ALERT_PREFERENCES_ENDPOINT}${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      'X-Site-Id': SITE_ID,
      'X-Alert-Token': token,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await readApiResponseBody(response)
  if (!response.ok || data.success === false) {
    const fallback = response.status === 503 ? 'UNAVAILABLE' : 'SERVER_ERROR'
    throw new MatchAlertPreferencesError(data.code || fallback)
  }
  return data
}

/**
 * @param {string} token
 * @returns {Promise<{ status: string, email: string, locale: string, criteria: object | null }>}
 */
export function fetchMatchAlertPreferences(token) {
  return requestPreferences(token)
}

/**
 * Remplace les préférences de l'alerte. Même frontière que l'inscription : seules les
 * préférences partent, `offered` compris (les options que la page vient d'afficher).
 *
 * @param {string} token
 * @param {unknown} criteria
 */
export function updateMatchAlertPreferences(token, criteria) {
  return requestPreferences(token, {
    method: 'PUT',
    body: { criteria: sanitizePreferences(criteria) },
  })
}

/**
 * Éteint l'alerte — après le clic de confirmation de la page de désinscription, jamais au
 * chargement : certains scanners de liens exécutent le JavaScript des pages qu'ils visitent.
 *
 * @param {string} token
 * @returns {Promise<{ status: 'unsubscribed', alreadyUnsubscribed: boolean }>}
 */
export function unsubscribeMatchAlert(token) {
  return requestPreferences(token, { method: 'POST', path: '/unsubscribe' })
}
