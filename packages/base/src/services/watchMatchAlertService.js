/**
 * Alerte « nouvelle montre » — phase 2 de l'expérience « coup de foudre ».
 *
 * Seule donnée du parcours autorisée à quitter le navigateur : l'e-mail et les **préférences**
 * (`MatchPreferences`), rien d'autre. L'historique de swipe (`seen`, `liked`, `passed`) reste
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
