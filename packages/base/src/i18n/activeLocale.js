/**
 * Langue active de la page, résolue une fois puis figée.
 *
 * Ordre de résolution : **préfixe d’URL → choix explicite mémorisé → `navigator.languages`
 * → `i18n.defaultLocale`**.
 *
 * Le préfixe gagne toujours : c’est lui qui rend une URL partageable et indexable. La détection
 * navigateur, elle, ne fait que **choisir la langue rendue** ; elle ne redirige jamais (voir
 * `localeSuggestion.js`). Rediriger sur `Accept-Language` rendrait `/collection` non déterministe
 * pour un crawler et contredirait la balise `canonical` que la page vient d’émettre.
 *
 * Le module lit le manifest **brut** (`@site-config`) et non `getSiteConfig()` : c’est
 * précisément `getSiteConfig()` qui a besoin de la langue pour aplatir le manifest.
 */

import rawSiteConfig from '@site-config'

import { resolveI18nConfig } from '../site/resolveI18nConfig.js'
import { normalizeLocaleTag } from './locales.js'
import { isExcludedPath, localePrefix, stripLocalePrefix, withLocalePrefix } from './localePaths.js'

const i18n = resolveI18nConfig(rawSiteConfig)

/** @returns {string} Base publique servie par Vite (`'/'` sauf déploiement en sous-chemin). */
function viteBase() {
  return import.meta.env?.BASE_URL || '/'
}

/**
 * Chemin applicatif courant, débarrassé de la base Vite.
 * @returns {string}
 */
function currentPathname() {
  if (typeof window === 'undefined') return '/'
  const base = viteBase()
  const pathname = window.location.pathname
  if (base !== '/' && pathname.startsWith(base)) {
    return `/${pathname.slice(base.length)}`.replace(/\/{2,}/g, '/')
  }
  return pathname
}

/**
 * Langue lue dans l’URL courante, si elle en porte une.
 * @returns {string | null}
 */
export function localeFromUrl() {
  if (!i18n.enabled || typeof window === 'undefined') return null
  return stripLocalePrefix(currentPathname(), i18n).locale
}

/**
 * Choix explicite mémorisé par l’utilisateur (sélecteur de langue).
 * @returns {string | null}
 */
export function getStoredLocale() {
  if (!i18n.enabled || !i18n.detect.storage || typeof localStorage === 'undefined') return null
  try {
    const stored = localStorage.getItem(i18n.storageKey)
    return i18n.locales.includes(stored) ? stored : null
  } catch {
    // Navigation privée ou stockage refusé : la langue reste celle de l’URL.
    return null
  }
}

/**
 * Mémorise un choix explicite. N’est appelé que depuis le sélecteur de langue :
 * une langue simplement déduite du navigateur ne doit pas être enregistrée comme un choix.
 *
 * @param {string} locale
 */
export function setStoredLocale(locale) {
  if (!i18n.enabled || typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(i18n.storageKey, locale)
  } catch {
    // Sans stockage, le préfixe d’URL suffit à porter la langue.
  }
}

/**
 * Première langue du navigateur qui fait partie des langues activées par le site.
 * @returns {string | null}
 */
export function localeFromNavigator() {
  if (!i18n.enabled || typeof navigator === 'undefined') return null
  const tags = navigator.languages?.length ? navigator.languages : [navigator.language]
  for (const tag of tags) {
    const code = normalizeLocaleTag(tag)
    if (code && i18n.locales.includes(code)) return code
  }
  return null
}

let cachedLocale

/**
 * Langue active de la page. Figée au premier appel : tout le rendu d’un chargement de page
 * parle une seule langue (le changement de langue passe par une navigation complète).
 *
 * @returns {string}
 */
export function getActiveLocale() {
  if (cachedLocale) return cachedLocale
  if (!i18n.enabled) {
    cachedLocale = i18n.defaultLocale
    return cachedLocale
  }
  // Le back-office reste en français : jamais préfixé, jamais traduit.
  if (typeof window !== 'undefined' && isExcludedPath(currentPathname(), i18n)) {
    cachedLocale = i18n.defaultLocale
    return cachedLocale
  }
  cachedLocale =
    localeFromUrl() ||
    getStoredLocale() ||
    (i18n.detect.navigator !== 'off' ? localeFromNavigator() : null) ||
    i18n.defaultLocale
  return cachedLocale
}

/** @returns {import('../site/resolveI18nConfig.js').ResolvedI18nConfig} */
export function getI18nConfig() {
  return i18n
}

/** Préfixe d’URL de la langue active : `''` ou `/en`. @returns {string} */
export function getActiveLocalePrefix() {
  return localePrefix(getActiveLocale(), i18n)
}

/**
 * Préfixe un chemin applicatif pour une langue donnée (langue active par défaut).
 * `route.path` étant toujours dépréfixé, c’est le passage obligé pour construire une URL absolue.
 *
 * @param {string} path
 * @param {string} [locale]
 * @returns {string}
 */
export function localizedPath(path, locale = getActiveLocale()) {
  return withLocalePrefix(path, locale, i18n)
}

/**
 * Réinitialise la langue figée. **Tests uniquement.**
 * @param {string} [locale]
 */
export function __resetActiveLocaleForTests(locale) {
  cachedLocale = locale
}
