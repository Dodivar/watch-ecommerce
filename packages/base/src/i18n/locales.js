/**
 * Langues supportées par le socle (`packages/base`).
 *
 * Un client active les siennes via le bloc `i18n` de `sites/<SITE_ID>/site.config.js` :
 * seules les valeurs listées ici y sont acceptées.
 *
 * Ce module est importé aussi bien par Vite que par Node (tests de contrat, backend,
 * scripts de build) : il ne doit contenir que des données, sans dépendance Vue ni `import.meta`.
 */

/** @typedef {'fr' | 'en' | 'de'} Locale */

/** Codes de langue reconnus, dans l’ordre d’affichage du sélecteur. */
export const SUPPORTED_LOCALES = /** @type {const} */ (['fr', 'en', 'de'])

/** Langue de repli du socle quand un manifest ne déclare rien. */
export const FALLBACK_LOCALE = 'fr'

/** Libellés natifs (jamais traduits : un germanophone cherche « Deutsch », pas « Allemand »). */
export const LOCALE_LABELS = {
  fr: 'Français',
  en: 'English',
  de: 'Deutsch',
}

/** Libellés courts pour le sélecteur compact (header mobile). */
export const LOCALE_SHORT_LABELS = {
  fr: 'FR',
  en: 'EN',
  de: 'DE',
}

/** Locales `Intl` utilisées par `formatPrice` / `formatDate` (formats de nombre et de date). */
export const INTL_LOCALES = {
  fr: 'fr-FR',
  en: 'en-GB',
  de: 'de-DE',
}

/** Valeurs `og:locale` (Open Graph attend `xx_XX`). */
export const OG_LOCALES = {
  fr: 'fr_FR',
  en: 'en_GB',
  de: 'de_DE',
}

/**
 * @param {unknown} value
 * @returns {value is Locale}
 */
export function isSupportedLocale(value) {
  return typeof value === 'string' && SUPPORTED_LOCALES.includes(/** @type {Locale} */ (value))
}

/**
 * Normalise une étiquette de langue (`fr-FR`, `de-CH`, `EN`) vers un code supporté.
 * Renvoie `null` si la langue n’est pas gérée par le socle.
 *
 * @param {unknown} tag
 * @returns {Locale | null}
 */
export function normalizeLocaleTag(tag) {
  if (typeof tag !== 'string') return null
  const base = tag.trim().toLowerCase().split(/[-_]/)[0]
  return isSupportedLocale(base) ? base : null
}
