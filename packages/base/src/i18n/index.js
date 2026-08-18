/**
 * Point d'entrée i18n des composants.
 *
 * ```js
 * import { t } from '@/i18n'
 * t('cart.empty')
 * t('collection.resultCount', { count: 3 })   // via tc() pour l'accord
 * ```
 *
 * `t` est une fonction ordinaire, utilisable hors composant (services, utilitaires). La langue
 * étant figée pour la durée d'un chargement de page, il n'y a rien de réactif à installer :
 * `useI18n()` n'existe que pour la lisibilité dans un `<script setup>`.
 */

import { getActiveLocale, getI18nConfig } from './activeLocale.js'
import { MESSAGE_CATALOGS } from './messages/index.js'
import { createTranslator } from './translator.js'

const i18n = getI18nConfig()

const translator = createTranslator({
  locale: getActiveLocale(),
  fallbackLocale: i18n.defaultLocale,
  catalogs: MESSAGE_CATALOGS,
  // Surcharges par client, déclarées dans `site.config.js` sous `i18n.messages`.
  overrides: i18n.messages,
  onMissingKey: import.meta.env?.DEV ? (message) => console.warn(message) : undefined,
})

/** Texte d'interface. @type {(key: string, params?: Record<string, unknown>) => string} */
export const t = translator.t

/** Texte d'interface accordé en nombre. @type {(key: string, count: number, params?: Record<string, unknown>) => string} */
export const tc = translator.tc

/** @returns {{ t: typeof t, tc: typeof tc, locale: string }} */
export function useI18n() {
  return translator
}

export { getActiveLocale, getI18nConfig } from './activeLocale.js'
