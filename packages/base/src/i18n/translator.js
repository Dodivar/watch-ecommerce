/**
 * Traducteur de l'interface (textes codés dans les composants, par opposition aux textes
 * déclarés par le client dans `site.config.js`).
 *
 * Volontairement minuscule, sans `vue-i18n` : la langue est figée pour la durée d'un
 * chargement de page (le changement de langue est une navigation complète), donc tout
 * l'appareillage réactif d'une bibliothèque i18n serait payé sans être utilisé. Un simple
 * `t(clé)` suffit, et reste appelable depuis un module ordinaire comme depuis un composant.
 *
 * Clés plates et pointées (`cart.empty`, `checkout.payNow`) : faciles à chercher, à comparer
 * entre langues, et à repérer quand elles ne servent plus.
 */

import { INTL_LOCALES } from './locales.js'

/**
 * Remplace les jetons `{nom}` par les valeurs fournies.
 *
 * @param {string} template
 * @param {Record<string, unknown>} [params]
 * @returns {string}
 */
function interpolate(template, params) {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    params[key] === undefined ? match : String(params[key]),
  )
}

const pluralRulesCache = new Map()

/**
 * @param {string} locale
 * @returns {Intl.PluralRules}
 */
function pluralRules(locale) {
  if (!pluralRulesCache.has(locale)) {
    pluralRulesCache.set(locale, new Intl.PluralRules(INTL_LOCALES[locale] ?? locale))
  }
  return pluralRulesCache.get(locale)
}

/**
 * Fusionne les surcharges d'un client par-dessus le catalogue du socle.
 * Un client peut ainsi renommer « Nos montres » sans dupliquer tout le catalogue.
 *
 * @param {Record<string, unknown>} base
 * @param {Record<string, string> | undefined} overrides
 * @returns {Record<string, unknown>}
 */
export function mergeMessages(base, overrides) {
  if (!overrides || typeof overrides !== 'object') return base
  return { ...base, ...overrides }
}

/**
 * Construit un traducteur pour une langue.
 *
 * @param {object} options
 * @param {string} options.locale
 * @param {string} options.fallbackLocale
 * @param {Record<string, Record<string, unknown>>} options.catalogs  Catalogues par langue.
 * @param {Record<string, Record<string, string>>} [options.overrides]  Surcharges client par langue.
 * @param {(message: string) => void} [options.onMissingKey]
 */
export function createTranslator({
  locale,
  fallbackLocale,
  catalogs,
  overrides = {},
  onMissingKey,
}) {
  const active = mergeMessages(catalogs[locale] ?? {}, overrides[locale])
  const fallback = mergeMessages(catalogs[fallbackLocale] ?? {}, overrides[fallbackLocale])

  /**
   * @param {string} key
   * @returns {unknown}
   */
  function lookup(key) {
    if (active[key] !== undefined) return active[key]
    if (fallback[key] !== undefined) {
      onMissingKey?.(`[i18n] clé « ${key} » absente en ${locale} — repli sur ${fallbackLocale}.`)
      return fallback[key]
    }
    onMissingKey?.(`[i18n] clé « ${key} » absente du catalogue.`)
    return undefined
  }

  /**
   * Texte d'interface. Renvoie la clé elle-même si elle est introuvable : une page reste
   * lisible et le trou se voit, plutôt que d'afficher un vide silencieux.
   *
   * @param {string} key
   * @param {Record<string, unknown>} [params]
   * @returns {string}
   */
  function t(key, params) {
    const value = lookup(key)
    if (value === undefined) return key
    if (typeof value === 'object') {
      // Entrée au pluriel utilisée sans `count` : la forme « other » est le choix neutre.
      return interpolate(String(value.other ?? Object.values(value)[0]), params)
    }
    return interpolate(String(value), params)
  }

  /**
   * Texte d'interface accordé en nombre.
   *
   * Passe par `Intl.PluralRules` plutôt que par un `count === 1` : le français range 0 avec
   * le singulier là où l'anglais et l'allemand le rangent avec le pluriel.
   *
   * @param {string} key
   * @param {number} count
   * @param {Record<string, unknown>} [params]
   * @returns {string}
   */
  function tc(key, count, params) {
    const value = lookup(key)
    if (value === undefined) return key
    if (typeof value !== 'object') return interpolate(String(value), { count, ...params })

    const category = pluralRules(locale).select(count)
    const form = value[category] ?? value.other ?? Object.values(value)[0]
    return interpolate(String(form), { count, ...params })
  }

  return { t, tc, locale }
}
