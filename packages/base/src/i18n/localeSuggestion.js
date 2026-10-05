/**
 * Suggestion de changement de langue.
 *
 * Un visiteur dont le navigateur parle une langue du site, arrivé sur une URL sans préfixe,
 * se voit **proposer** la version correspondante. Rien n'est jamais redirigé ni traduit
 * d'office : l'URL sans préfixe reste déterministe (toujours la langue par défaut), donc
 * indexable et cohérente avec sa canonique. Voir `activeLocale.js`.
 *
 * Le choix — accepter ou écarter — est mémorisé comme un choix explicite : la suggestion ne
 * revient pas.
 */

import {
  getActiveLocale,
  getI18nConfig,
  getStoredLocale,
  localeFromNavigator,
  localeFromUrl,
} from './activeLocale.js'
import { isExcludedPath } from './localePaths.js'
import { MESSAGE_CATALOGS } from './messages/index.js'
import { createTranslator } from './translator.js'

/**
 * Langue à suggérer, ou `null` s'il n'y a rien à proposer.
 *
 * @param {string} pathname  Chemin applicatif courant (débarrassé de la base Vite).
 * @returns {string | null}
 */
export function getSuggestedLocale(pathname) {
  const i18n = getI18nConfig()
  if (!i18n.enabled || i18n.detect.navigator !== 'suggest') return null
  if (isExcludedPath(pathname, i18n)) return null
  // Un préfixe ou un choix mémorisé est déjà une décision : on ne la remet pas en cause.
  if (localeFromUrl() || getStoredLocale()) return null

  const suggested = localeFromNavigator()
  return suggested && suggested !== getActiveLocale() ? suggested : null
}

/**
 * Traducteur d'une langue donnée, indépendamment de la langue active : la suggestion
 * s'adresse au visiteur dans **sa** langue, pas dans celle de la page qu'il quitte.
 *
 * @param {string} locale
 */
export function createSuggestionTranslator(locale) {
  const i18n = getI18nConfig()
  return createTranslator({
    locale,
    fallbackLocale: i18n.defaultLocale,
    catalogs: MESSAGE_CATALOGS,
    overrides: i18n.messages,
  })
}
