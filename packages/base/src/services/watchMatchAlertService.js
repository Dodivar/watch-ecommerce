/**
 * Alerte « nouvelle montre » — contrat front de la phase 2 de l'expérience « coup de foudre ».
 *
 * Seule donnée du parcours autorisée à quitter le navigateur : l'e-mail et les **préférences**
 * (`MatchPreferences`), rien d'autre. L'historique de swipe (`seen`, `liked`, `passed`) reste
 * dans `matchSessionStorage.js` et n'entre jamais dans ce payload — c'est une règle de la
 * demande, pas un oubli.
 *
 * La route backend n'existe pas encore (voir `supabase/migrations/README.md`, section
 * « Alertes coup de foudre », pour la table cible et la policy RLS). Ce module fixe la forme
 * de l'appel pour que le composant puisse être écrit et testé dès maintenant ; il lève
 * `NOT_IMPLEMENTED` tant que `features.watchMatchAlerts` reste éteint. Le jour venu :
 * dérouler `subscribeToNewsletter` (`newsletterSignupService.js`) — même en-tête `X-Site-Id`,
 * même pot de miel `website`, même confirmation par jeton.
 */

import { getActiveLocale } from '@/i18n'
import { sanitizePreferences } from '@/utils/watchMatchmaking.js'

/** Chemin prévu côté backend Express, dans la famille de `/api/newsletter/subscribe`. */
export const MATCH_ALERT_ENDPOINT = '/api/watch-match-alerts/subscribe'

export class MatchAlertNotImplementedError extends Error {
  constructor() {
    super("L'alerte coup de foudre n'est pas encore raccordée au backend.")
    this.name = 'MatchAlertNotImplementedError'
    this.code = 'NOT_IMPLEMENTED'
  }
}

/**
 * Corps de requête tel qu'il partira vers le backend. Exposé pour verrouiller par test que
 * seules les préférences voyagent.
 *
 * @param {{ email: string, criteria: unknown, website?: string }} input
 */
export function buildMatchAlertPayload({ email, criteria, website }) {
  return {
    email: String(email ?? '')
      .trim()
      .toLowerCase(),
    criteria: sanitizePreferences(criteria),
    website: website || undefined,
    locale: getActiveLocale(),
  }
}

/**
 * @param {{ email: string, criteria: unknown, website?: string }} input
 *   `website` est le pot de miel anti-bot : vide pour un humain.
 * @returns {Promise<never>}
 */
export async function saveMatchAlert(input) {
  // Le payload est construit pour que la validation d'entrée soit exercée dès aujourd'hui.
  buildMatchAlertPayload(input)
  throw new MatchAlertNotImplementedError()
}
