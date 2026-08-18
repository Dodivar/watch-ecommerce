/**
 * Arithmétique des chemins préfixés par la langue.
 *
 * Stratégie : la langue par défaut garde des URLs propres (`/collection`), les autres sont
 * préfixées (`/en/collection`, `/de/collection`). Le préfixe est porté par la `base` de
 * l’historique vue-router, donc `route.path` est **toujours** dépréfixé côté application ;
 * ces helpers servent aux frontières où l’URL absolue compte (canoniques, hreflang, sitemap,
 * sélecteur de langue, pré-rendu).
 *
 * Module pur : partagé par le navigateur, Node et les scripts de build.
 */

import { isSupportedLocale } from './locales.js'

/**
 * Préfixe d’URL d’une langue : `''` pour la langue par défaut, `/en` sinon.
 *
 * @param {string} locale
 * @param {{ defaultLocale: string, enabled: boolean }} i18n
 * @returns {string}
 */
export function localePrefix(locale, i18n) {
  if (!i18n?.enabled) return ''
  if (!locale || locale === i18n.defaultLocale) return ''
  return `/${locale}`
}

/**
 * `/collection` + `en` → `/en/collection`. Idempotent : ne double jamais un préfixe déjà posé.
 *
 * @param {string} path  Chemin applicatif dépréfixé (peut porter query et hash).
 * @param {string} locale
 * @param {{ defaultLocale: string, enabled: boolean, locales: string[], excludePathPrefixes?: string[] }} i18n
 * @returns {string}
 */
export function withLocalePrefix(path, locale, i18n) {
  const normalized = path?.startsWith('/') ? path : `/${path || ''}`
  if (isExcludedPath(normalized, i18n)) return normalized

  const { rest } = stripLocalePrefix(normalized, i18n)
  const prefix = localePrefix(locale, i18n)
  if (!prefix) return rest
  return rest === '/' ? prefix : `${prefix}${rest}`
}

/**
 * Sépare un préfixe de langue d’un chemin. `/en/collection` → `{ locale: 'en', rest: '/collection' }`.
 * Un chemin sans préfixe connu ressort inchangé avec `locale: null`.
 *
 * Le découpage est **par segment** : `/entretien` n’est pas confondu avec la langue `en`.
 *
 * @param {string} path
 * @param {{ enabled: boolean, locales: string[] }} i18n
 * @returns {{ locale: string | null, rest: string }}
 */
export function stripLocalePrefix(path, i18n) {
  const normalized = path?.startsWith('/') ? path : `/${path || ''}`
  if (!i18n?.enabled) return { locale: null, rest: normalized }

  const match = /^\/([^/?#]+)(.*)$/.exec(normalized)
  if (!match) return { locale: null, rest: normalized }

  const [, head, tail] = match
  if (!isSupportedLocale(head) || !i18n.locales.includes(head)) {
    return { locale: null, rest: normalized }
  }
  return { locale: head, rest: tail === '' ? '/' : tail }
}

/**
 * Chemins servis sans préfixe de langue (back-office).
 *
 * @param {string} path
 * @param {{ excludePathPrefixes?: string[] }} i18n
 * @returns {boolean}
 */
export function isExcludedPath(path, i18n) {
  const prefixes = i18n?.excludePathPrefixes
  if (!Array.isArray(prefixes) || prefixes.length === 0) return false
  return prefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))
}

/**
 * Base d’historique vue-router pour une langue : `createWebHistory(localeHistoryBase(...))`.
 * vue-router retire cette base des URLs entrantes et la remet sur chaque `RouterLink`,
 * si bien que la table de routes reste identique dans les trois langues.
 *
 * @param {string} locale
 * @param {{ defaultLocale: string, enabled: boolean }} i18n
 * @param {string} [viteBase]  `import.meta.env.BASE_URL` (`'/'` par défaut).
 * @returns {string}
 */
export function localeHistoryBase(locale, i18n, viteBase = '/') {
  const base = viteBase.endsWith('/') ? viteBase : `${viteBase}/`
  const prefix = localePrefix(locale, i18n)
  return prefix ? `${base}${prefix.slice(1)}/` : base
}
