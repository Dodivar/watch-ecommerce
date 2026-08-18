/**
 * Valeurs traduisibles d’un manifest client (`sites/<SITE_ID>/site.config.js`).
 *
 * Un texte multilingue s’écrit `t({ fr: '…', en: '…', de: '…' })` ; une chaîne simple reste
 * valide et sert alors pour toutes les langues. `localizeTree()` aplatit l’arbre une seule
 * fois au chargement, si bien que les composants continuent de lire des chaînes ordinaires
 * (`site.copy.footerTagline`) sans connaître l’i18n.
 *
 * Importé depuis Vite **et** depuis Node (tests de contrat, backend, scripts de build) :
 * pas d’alias `@`, pas de dépendance Vue, pas d’`import.meta`.
 */

import { FALLBACK_LOCALE, SUPPORTED_LOCALES } from '../i18n/locales.js'

/** Marqueur des nœuds traduisibles. Non énumérable : invisible pour `JSON.stringify` et les snapshots. */
const I18N_MARKER = Symbol.for('site.i18nValue')

/**
 * Déclare un texte traduit par langue.
 *
 * ```js
 * copy: {
 *   footerTagline: t({ fr: 'Montres d’exception.', en: 'Exceptional watches.', de: 'Außergewöhnliche Uhren.' }),
 *   copyrightLine: '© 2026 Sauvage Watches.', // identique dans les 3 langues
 * }
 * ```
 *
 * Les langues absentes retombent sur `defaultLocale` : on peut donc livrer une traduction
 * partielle sans casser l’affichage.
 *
 * @param {Partial<Record<import('../i18n/locales.js').Locale, unknown>>} values
 * @returns {Record<string, unknown>}
 */
export function t(values) {
  if (values == null || typeof values !== 'object' || Array.isArray(values)) {
    throw new TypeError('t() attend un objet { fr, en, de } (au moins une langue).')
  }

  const unknown = Object.keys(values).filter((key) => !SUPPORTED_LOCALES.includes(key))
  if (unknown.length > 0) {
    throw new TypeError(
      `t() : langue(s) inconnue(s) ${unknown.join(', ')} — attendu ${SUPPORTED_LOCALES.join(', ')}.`,
    )
  }
  if (Object.keys(values).length === 0) {
    throw new TypeError('t() attend au moins une langue.')
  }

  const node = { ...values }
  Object.defineProperty(node, I18N_MARKER, { value: true, enumerable: false })

  // Filet de sécurité : si un lecteur du manifest brut oublie `localizeTree()` (plugin Vite,
  // backend, script de build), on rend la première traduction déclarée plutôt qu’un
  // « [object Object] » dans un PDF ou un `{"fr":…}` dans du JSON-LD — en le signalant en dev.
  const first = Object.values(values)[0]
  Object.defineProperty(node, 'toString', {
    value: function toString() {
      warnUncollapsed()
      return String(first)
    },
    enumerable: false,
  })
  Object.defineProperty(node, 'toJSON', {
    value: function toJSON() {
      warnUncollapsed()
      return first
    },
    enumerable: false,
  })

  return Object.freeze(node)
}

function warnUncollapsed() {
  // Silencieux sous Vitest : les tests exercent volontairement ce repli.
  if (globalThis.process?.env?.NODE_ENV === 'test') return
  console.warn(
    '[i18n] Valeur t() lue sans localizeTree() — repli sur la première langue déclarée. ' +
      'Le lecteur de manifest concerné doit appeler localizeTree(config, locale).',
  )
}

/**
 * @param {unknown} value
 * @returns {boolean}
 */
export function isI18nValue(value) {
  return typeof value === 'object' && value !== null && value[I18N_MARKER] === true
}

/**
 * Résout un nœud traduisible pour une langue donnée.
 * Ordre : langue demandée → langue de repli → première langue déclarée (jamais `undefined`).
 *
 * @param {Record<string, unknown>} node
 * @param {string} locale
 * @param {string} [fallbackLocale]
 * @returns {unknown}
 */
export function pickI18nValue(node, locale, fallbackLocale = FALLBACK_LOCALE) {
  if (node[locale] !== undefined) return node[locale]
  if (node[fallbackLocale] !== undefined) return node[fallbackLocale]
  for (const supported of SUPPORTED_LOCALES) {
    if (node[supported] !== undefined) return node[supported]
  }
  return undefined
}

/**
 * Retourne `true` pour un objet littéral (à parcourir), `false` pour tout ce qui doit rester
 * intact : `Date`, `RegExp`, `Map`, instances de classes… Un manifest n’en contient pas
 * aujourd’hui, mais la garde évite de les recopier en objets nus si cela change.
 *
 * @param {unknown} value
 */
function isPlainObject(value) {
  if (typeof value !== 'object' || value === null) return false
  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}

/**
 * Parcourt le manifest et remplace chaque nœud `t({...})` par sa chaîne pour `locale`.
 * Les autres valeurs (couleurs, drapeaux, URLs, ids de sections) sont recopiées telles quelles :
 * l’aplatissement est explicite, il ne peut pas se déclencher tout seul sur un objet ordinaire.
 *
 * @template T
 * @param {T} node
 * @param {string} locale
 * @param {string} [fallbackLocale]
 * @returns {T}
 */
export function localizeTree(node, locale, fallbackLocale = FALLBACK_LOCALE) {
  return localizeNode(node, locale, fallbackLocale, new WeakMap())
}

/**
 * @param {unknown} node
 * @param {string} locale
 * @param {string} fallbackLocale
 * @param {WeakMap<object, unknown>} seen  Mémoïse les nœuds déjà traités : gère les références
 *   partagées (un même bloc importé à deux endroits) et les cycles éventuels.
 */
function localizeNode(node, locale, fallbackLocale, seen) {
  if (isI18nValue(node)) {
    // La valeur choisie peut elle-même contenir des nœuds traduisibles (liste, objet imbriqué).
    return localizeNode(pickI18nValue(node, locale, fallbackLocale), locale, fallbackLocale, seen)
  }

  if (Array.isArray(node)) {
    if (seen.has(node)) return seen.get(node)
    const out = []
    seen.set(node, out)
    for (const item of node) out.push(localizeNode(item, locale, fallbackLocale, seen))
    return out
  }

  if (isPlainObject(node)) {
    if (seen.has(node)) return seen.get(node)
    const out = {}
    seen.set(node, out)
    for (const [key, value] of Object.entries(node)) {
      out[key] = localizeNode(value, locale, fallbackLocale, seen)
    }
    return out
  }

  return node
}
