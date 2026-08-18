/**
 * Bloc `i18n` du manifest client (`sites/<SITE_ID>/site.config.js`).
 *
 * ```js
 * i18n: {
 *   enabled: true,
 *   defaultLocale: 'fr',         // langue servie quand le navigateur ne dit rien d’exploitable
 *   locales: ['fr', 'en', 'de'],
 * },
 * ```
 *
 * Le client ne déclare que des **codes** : libellés, formats `Intl` et `og:locale` vivent dans
 * `packages/base/src/i18n/locales.js`, donc ajouter une langue à un site tient en un mot.
 *
 * Le bloc est facultatif : un manifest qui ne déclare que l’ancien champ `locale: 'fr'` reste
 * monolingue et se comporte exactement comme avant.
 *
 * Module pur (aucune dépendance Vue ni `import.meta`) : utilisable depuis Vite, Node et les scripts.
 */

import { FALLBACK_LOCALE, isSupportedLocale, normalizeLocaleTag } from '../i18n/locales.js'

/** Jamais préfixé par une langue : le back-office reste en français (voir `router.js`). */
const DEFAULT_EXCLUDED_PATH_PREFIXES = ['/admin']

/**
 * @typedef {object} ResolvedI18nConfig
 * @property {boolean} enabled            Vrai si le site propose plus d’une langue.
 * @property {import('../i18n/locales.js').Locale} defaultLocale
 * @property {import('../i18n/locales.js').Locale[]} locales  Non vide, `defaultLocale` en tête.
 * @property {string[]} excludePathPrefixes  Chemins servis sans préfixe de langue.
 * @property {{ storage: boolean, navigator: 'suggest' | 'redirect' | 'off' }} detect
 * @property {string} storageKey          Clé `localStorage` du choix explicite de l’utilisateur.
 * @property {Record<string, Record<string, string>>} messages  Surcharges du catalogue UI par langue.
 */

/**
 * @param {Record<string, unknown>} siteConfig
 * @returns {ResolvedI18nConfig}
 */
export function resolveI18nConfig(siteConfig) {
  const raw = siteConfig?.i18n
  // Repli historique : `locale: 'fr'` seul ⇒ site monolingue.
  const legacyLocale = normalizeLocaleTag(siteConfig?.locale) || FALLBACK_LOCALE
  const siteId = typeof siteConfig?.siteId === 'string' ? siteConfig.siteId : 'site'

  if (raw == null || typeof raw !== 'object') {
    return monolingual(legacyLocale, siteId)
  }

  if (raw.defaultLocale != null && !isSupportedLocale(raw.defaultLocale)) {
    throw new Error(
      `i18n.defaultLocale « ${String(raw.defaultLocale)} » n’est pas une langue supportée (fr, en, de).`,
    )
  }
  const defaultLocale = normalizeLocaleTag(raw.defaultLocale) || legacyLocale

  let locales = [defaultLocale]
  if (raw.locales != null) {
    if (!Array.isArray(raw.locales)) {
      throw new Error("i18n.locales doit être un tableau de codes langue (ex. ['fr', 'en', 'de']).")
    }
    const unknown = raw.locales.filter((code) => !isSupportedLocale(code))
    if (unknown.length > 0) {
      throw new Error(
        `i18n.locales : langue(s) non supportée(s) ${unknown.join(', ')} — attendu fr, en, de.`,
      )
    }
    // `defaultLocale` d’abord, puis les autres dans l’ordre déclaré, sans doublon.
    locales = [defaultLocale, ...raw.locales.filter((code) => code !== defaultLocale)]
  }

  // `enabled: false` explicite ⇒ une seule langue, quoi que déclare `locales`.
  const enabled = raw.enabled !== false && locales.length > 1
  if (!enabled) return monolingual(defaultLocale, siteId)

  const detectRaw = raw.detect != null && typeof raw.detect === 'object' ? raw.detect : {}
  const navigatorMode = ['suggest', 'redirect', 'off'].includes(detectRaw.navigator)
    ? detectRaw.navigator
    : 'suggest'

  return {
    enabled: true,
    defaultLocale,
    locales,
    excludePathPrefixes: Array.isArray(raw.excludePathPrefixes)
      ? raw.excludePathPrefixes.filter((p) => typeof p === 'string' && p.startsWith('/'))
      : DEFAULT_EXCLUDED_PATH_PREFIXES,
    detect: { storage: detectRaw.storage !== false, navigator: navigatorMode },
    storageKey: typeof raw.storageKey === 'string' ? raw.storageKey : `${siteId}_locale_v1`,
    messages: raw.messages != null && typeof raw.messages === 'object' ? raw.messages : {},
  }
}

/**
 * @param {import('../i18n/locales.js').Locale} locale
 * @param {string} siteId
 * @returns {ResolvedI18nConfig}
 */
function monolingual(locale, siteId) {
  return {
    enabled: false,
    defaultLocale: locale,
    locales: [locale],
    excludePathPrefixes: DEFAULT_EXCLUDED_PATH_PREFIXES,
    detect: { storage: false, navigator: 'off' },
    storageKey: `${siteId}_locale_v1`,
    messages: {},
  }
}
