/**
 * Formatage des prix, nombres et dates dans la langue active.
 *
 * Remplace les `Intl.NumberFormat('fr-FR', …)` et `toLocaleDateString('fr-FR', …)` que chaque
 * composant redéfinissait pour son compte : un visiteur allemand doit lire « 1.234 € » et
 * « 3. März 2026 », pas la forme française.
 *
 * La devise vient du manifest client (`checkout.currency`) plutôt que d'être écrite en dur.
 *
 * Le back-office reste volontairement en français et conserve ses propres formats.
 */

import { getActiveLocale } from '@/i18n/activeLocale.js'
import { INTL_LOCALES } from '@/i18n/locales.js'
import { getSiteConfig } from '@/site/getSiteConfig.js'

/** @returns {string} Étiquette `Intl` de la langue active (`fr-FR`, `en-GB`, `de-DE`). */
function intlLocale() {
  return INTL_LOCALES[getActiveLocale()] ?? INTL_LOCALES.fr
}

/** @returns {string} Devise du site (`EUR` par défaut). */
function currency() {
  return getSiteConfig().checkout?.currency || 'EUR'
}

// `Intl.NumberFormat` est coûteux à instancier : les formats sont réutilisés d'un appel à l'autre.
const cache = new Map()

/**
 * @param {string} key
 * @param {() => Intl.NumberFormat | Intl.DateTimeFormat} create
 */
function cached(key, create) {
  if (!cache.has(key)) cache.set(key, create())
  return cache.get(key)
}

/**
 * Prix formaté dans la langue et la devise du site.
 *
 * @param {number | string} value
 * @param {{ decimals?: boolean }} [options] `decimals: true` pour afficher les centimes.
 * @returns {string} Chaîne vide si la valeur n'est pas un nombre.
 */
export function formatPrice(value, { decimals = false } = {}) {
  // `Number(null)` vaut 0 : sans cette garde, une montre sans prix afficherait « 0 € »
  // au lieu de rien. Un vrai zéro (livraison offerte) reste formaté normalement.
  if (value === null || value === undefined || value === '') return ''
  const amount = Number(value)
  if (!Number.isFinite(amount)) return ''

  const locale = intlLocale()
  const code = currency()
  const formatter = cached(`price|${locale}|${code}|${decimals}`, () =>
    new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: code,
      ...(decimals ? {} : { minimumFractionDigits: 0 }),
    }),
  )
  return formatter.format(amount)
}

/**
 * Nombre formaté dans la langue active (séparateurs de milliers).
 *
 * @param {number | string} value
 * @returns {string}
 */
export function formatNumber(value) {
  if (value === null || value === undefined || value === '') return ''
  const amount = Number(value)
  if (!Number.isFinite(amount)) return ''
  const locale = intlLocale()
  return cached(`number|${locale}`, () => new Intl.NumberFormat(locale)).format(amount)
}

/**
 * Note sur 5 avec une décimale, dans la langue active (« 4,7 » en français, « 4.7 » en anglais).
 *
 * @param {number | string} value
 * @returns {string} Chaîne vide si la valeur n'est pas un nombre.
 */
export function formatRating(value) {
  if (value === null || value === undefined || value === '') return ''
  const amount = Number(value)
  if (!Number.isFinite(amount)) return ''
  const locale = intlLocale()
  return cached(`rating|${locale}`, () =>
    new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
  ).format(amount)
}

/**
 * Date longue (« 3 mars 2026 », « 3 March 2026 », « 3. März 2026 »).
 *
 * @param {string | Date | null | undefined} value
 * @returns {string} Chaîne vide si la date est absente ou invalide.
 */
export function formatDate(value) {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const locale = intlLocale()
  const formatter = cached(`date|${locale}`, () =>
    new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' }),
  )
  return formatter.format(date)
}

/**
 * Date avec le jour de la semaine (« lundi 20 juillet 2026 »), pour les créneaux de rendez-vous.
 *
 * @param {string | Date | null | undefined} value
 * @returns {string}
 */
export function formatWeekdayDate(value) {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const locale = intlLocale()
  const formatter = cached(`weekday|${locale}`, () =>
    new Intl.DateTimeFormat(locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
  )
  return formatter.format(date)
}

/** Vide le cache de formats. **Tests uniquement.** */
export function __resetFormatterCacheForTests() {
  cache.clear()
}
