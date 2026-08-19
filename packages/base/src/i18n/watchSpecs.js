/**
 * Traduction à l'affichage des valeurs de fiche montre venant de Supabase.
 *
 * Le socle traduit déjà les libellés (`t('watch.movement')` → « Mouvement » / « Movement » /
 * « Uhrwerk »), mais la valeur en face restait interpolée brute : un visiteur allemand lisait
 * « Uhrwerk : Remontage automatique ». Ces colonnes sont du texte libre et le resteront (la
 * saisie a besoin de pouvoir écrire un calibre ou un nom commercial), donc la traduction se
 * fait ici, en lecture, sans rien écrire en base.
 *
 * Règle unique : **ce que le vocabulaire ne reconnaît pas s'affiche tel quel**. Un calibre
 * `MT5400`, un cadran « Ice Blue » ou un « Ecrin de voyage Breitling » traversent intacts dans
 * les trois langues — c'est le comportement voulu, pas un trou de traduction.
 *
 * ```js
 * import { translateSpec, translateSpecList } from '@/i18n/watchSpecs'
 * translateSpec('material', 'Acier')                  // « Steel » en anglais
 * translateSpecList('fn', 'Heures, minutes, date')    // « Hours, minutes, date »
 * translateSpec('movement', 'MT5400')                 // « MT5400 » partout
 * ```
 *
 * Chaque fonction accepte un traducteur en dernier argument. En production c'est le singleton
 * de `@/i18n` (la langue est figée pour la durée du chargement de page) ; les tests s'en
 * servent pour vérifier les trois langues dans un même fichier.
 */

import { resolveSpecKey, normalizeSpecText } from '@/constants/watchSpecVocabulary'
import { t as defaultT, tc as defaultTc } from './index.js'

/** @typedef {{ t: (key: string, params?: Record<string, unknown>) => string, tc: (key: string, count: number, params?: Record<string, unknown>) => string }} SpecTranslator */

/** @type {SpecTranslator} */
const DEFAULT_I18N = { t: defaultT, tc: defaultTc }

/** Valeurs déjà signalées, pour n'avertir qu'une fois par formulation inconnue. */
const reportedUnknown = new Set()

/**
 * Signale en développement une valeur que le vocabulaire ne couvre pas, afin de repérer la
 * dérive de saisie sans jamais gêner l'affichage.
 *
 * @param {string} family
 * @param {string} raw
 */
function reportUnknown(family, raw) {
  if (!import.meta.env?.DEV) return
  const signature = `${family}:${raw}`
  if (reportedUnknown.has(signature)) return
  reportedUnknown.add(signature)
  console.debug(
    `[i18n] valeur « ${raw} » hors vocabulaire (${family}) — affichée telle quelle. ` +
      'Ajouter un alias dans constants/watchSpecVocabulary.js si elle doit être traduite.',
  )
}

/**
 * Traduit une valeur simple. Renvoie la valeur d'origine (espaces en trop retirés) si le
 * vocabulaire ne la connaît pas.
 *
 * @param {string} family  Famille de `WATCH_SPEC_VOCABULARY` (`material`, `condition`…).
 * @param {unknown} raw
 * @param {SpecTranslator} [i18n]
 * @returns {string}
 */
export function translateSpec(family, raw, i18n = DEFAULT_I18N) {
  const text = String(raw ?? '').trim()
  if (!text) return ''
  const key = resolveSpecKey(family, text)
  if (!key) {
    reportUnknown(family, text)
    return text
  }
  return i18n.t(key)
}

/**
 * Traduit une valeur composée, séparée par des virgules ou des barres obliques :
 * « Acier / Or jaune », « Heures, minutes, secondes, date ». Chaque terme est traité
 * indépendamment, donc un terme inconnu au milieu d'une liste ne fait pas tomber les autres.
 *
 * Les séparateurs sont réécrits proprement (`, ` et ` / `), ce qui corrige au passage les
 * saisies du type « Heures, minutes,seconde ».
 *
 * La première lettre du résultat est mise en capitale : les fonctions (`watchSpec.fn.*`) sont
 * déclarées en minuscules en français et en anglais, où seule la tête de liste s'écrit avec une
 * majuscule (« Heures, minutes, secondes »). L'allemand, qui capitalise tous ses substantifs,
 * n'est pas affecté.
 *
 * @param {string} family
 * @param {unknown} raw
 * @param {SpecTranslator} [i18n]
 * @returns {string}
 */
export function translateSpecList(family, raw, i18n = DEFAULT_I18N) {
  const text = String(raw ?? '').trim()
  if (!text) return ''
  const translated = text
    .split(/\s*([,/])\s*/)
    .map((part, index) => {
      // Les séparateurs capturés occupent les positions impaires.
      if (index % 2 === 1) return part === '/' ? ' / ' : ', '
      return translateSpec(family, part, i18n)
    })
    .join('')
  return translated.charAt(0).toUpperCase() + translated.slice(1)
}

const HOURS_PATTERN = /^(\d+(?:[.,]\d+)?)\s*(?:h|hrs?|heures?|hours?|std|stunden?)$/i
const DAYS_PATTERN = /^(\d+(?:[.,]\d+)?)\s*(?:j|jours?|days?|tage?n?)$/i

/**
 * Traduit une durée du type « 42 Heures », « 70h », « 5 jours » (réserve de marche).
 *
 * Uniformise au passage la casse et l'espacement, que la saisie libre laisse fluctuer
 * (« 42 Heures » et « 70h » cohabitent en base).
 *
 * @param {unknown} raw
 * @param {SpecTranslator} [i18n]
 * @returns {string}
 */
export function translateDuration(raw, i18n = DEFAULT_I18N) {
  const text = String(raw ?? '').trim()
  if (!text) return ''

  const hours = text.match(HOURS_PATTERN)
  if (hours) {
    const count = Number(hours[1].replace(',', '.'))
    return i18n.tc('watchSpec.unit.hours', count, { count: hours[1] })
  }

  const days = text.match(DAYS_PATTERN)
  if (days) {
    const count = Number(days[1].replace(',', '.'))
    return i18n.tc('watchSpec.unit.days', count, { count: days[1] })
  }

  reportUnknown('duration', text)
  return text
}

const GUARANTEE_YEARS_PATTERN = /^(\d+)\s*ans?\s+de\s+garantie$/i
const GUARANTEE_MONTHS_PATTERN = /^(\d+)\s*mois\s+de\s+garantie$/i
const GUARANTEE_DETAIL_PATTERN = /^garantie\s+(.+)$/i

/**
 * Traduit une garantie : « 1 an de garantie », « 2 ans de garantie », mais aussi
 * « Garantie Rolex 05/2027 » dont seul le mot « Garantie » se traduit — la marque et la date
 * sont recopiées telles quelles.
 *
 * @param {unknown} raw
 * @param {SpecTranslator} [i18n]
 * @returns {string}
 */
export function translateGuarantee(raw, i18n = DEFAULT_I18N) {
  const text = String(raw ?? '').trim()
  if (!text) return ''

  const years = text.match(GUARANTEE_YEARS_PATTERN)
  if (years) return i18n.tc('watchSpec.guarantee.years', Number(years[1]))

  const months = text.match(GUARANTEE_MONTHS_PATTERN)
  if (months) return i18n.tc('watchSpec.guarantee.months', Number(months[1]))

  const detail = text.match(GUARANTEE_DETAIL_PATTERN)
  if (detail) return i18n.t('watchSpec.guarantee.detail', { detail: detail[1].trim() })

  reportUnknown('guarantee', text)
  return text
}

const BRANDED_BOX_PATTERN = /^bo[iî]te\s+(.+?)\s+d['’ ]origine$/i
const BRANDED_CARD_PATTERN = /^cartes?\s+d['’ ]origine\s+(.+)$/i

/**
 * Traduit un accessoire. Au-delà du vocabulaire, reconnaît les formulations décorées d'une
 * marque — « Boîte Rolex d'origine », « Carte d'origine Oméga » — dont seule la partie
 * générique se traduit.
 *
 * @param {unknown} raw
 * @param {SpecTranslator} [i18n]
 * @returns {string}
 */
export function translateAccessory(raw, i18n = DEFAULT_I18N) {
  const text = String(raw ?? '').trim()
  if (!text) return ''

  const key = resolveSpecKey('accessory', text)
  if (key) return i18n.t(key)

  const box = text.match(BRANDED_BOX_PATTERN)
  if (box) return i18n.t('watchSpec.accessory.boxBranded', { brand: box[1].trim() })

  const card = text.match(BRANDED_CARD_PATTERN)
  if (card) return i18n.t('watchSpec.accessory.originalCardBranded', { brand: card[1].trim() })

  reportUnknown('accessory', text)
  return text
}

const WATER_RESISTANCE_PATTERN = /^(\d+(?:[.,]\d+)?)\s*(atm|bars?|m|metres?|meters?|ft)$/i

/**
 * Normalise une étanchéité. Ces valeurs (« 3 ATM », « 100m ») n'ont pas de langue : rien n'est
 * traduit, seuls l'espacement et la casse de l'unité sont uniformisés.
 *
 * @param {unknown} raw
 * @returns {string}
 */
export function formatWaterResistance(raw) {
  const text = String(raw ?? '').trim()
  if (!text) return ''

  const match = text.match(WATER_RESISTANCE_PATTERN)
  if (!match) return text

  const unit = normalizeSpecText(match[2])
  if (unit === 'atm') return `${match[1]} ATM`
  if (unit.startsWith('bar')) return `${match[1]} bar`
  if (unit === 'ft') return `${match[1]} ft`
  return `${match[1]} m`
}

/**
 * Slug d'état d'une montre, pour les usages non textuels — aujourd'hui `itemCondition` du
 * JSON-LD, qui comparait la valeur brute à la chaîne exacte « Neuf » et classait donc
 * « neuf » ou « Comme neuf » en occasion.
 *
 * @param {unknown} raw
 * @returns {'new' | 'used' | null}
 */
export function resolveConditionSchemaValue(raw) {
  const key = resolveSpecKey('condition', raw)
  if (!key) return null
  return key === 'watchSpec.condition.new' ? 'new' : 'used'
}
