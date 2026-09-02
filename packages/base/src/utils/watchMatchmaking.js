/**
 * Logique pure de l'expérience « coup de foudre » (`/coup-de-foudre`) : facettes réellement
 * présentes dans le stock, puis classement des montres par affinité avec les préférences.
 *
 * Deux règles, dictées par l'inventaire réel (une poignée de montres disponibles, des
 * caractéristiques saisies en texte libre et souvent absentes) :
 *
 * - **Le budget est le seul filtre dur.** Tout le reste est un score : une montre qui ne
 *   correspond pas à une préférence est reléguée en fin de deck, jamais retirée. « Vous avez
 *   vu tout le monde » doit vouloir dire exactement cela.
 * - **Inconnu ≠ non-correspondant.** Une caractéristique absente ou non reconnue (un calibre
 *   brut dans `movement`, un cadran « Ice Blue ») vaut 0, ni bonus ni malus. Sans cette règle,
 *   une préférence « cadran noir » éliminerait la moitié du stock pour un champ jamais rempli.
 *
 * Les écrans de préférences se déduisent des facettes : un critère qui n'offre pas au moins
 * deux options dans le pool n'a rien à demander et son écran est sauté. Quand le catalogue se
 * diversifie, les écrans s'allument d'eux-mêmes.
 *
 * Aucun import Vue ni i18n ici : les libellés sont désignés par des clés de catalogue
 * (`labelKey`) résolues à l'affichage, comme dans `constants/watchBraceletColors.js`.
 */

import { normalizeSpecText, resolveSpecKey } from '@/constants/watchSpecVocabulary'
import { WATCH_BRACELET_COLORS, getBraceletColorBySlug } from '@/constants/watchBraceletColors'
import {
  WATCH_BRACELET_MATERIALS,
  getBraceletMaterialBySlug,
} from '@/constants/watchBraceletMaterials'
import { getEffectiveWatchPrice } from '@/utils/watchPricing.js'

/**
 * @typedef {'budget' | 'brand' | 'bracelet' | 'caseMaterial' | 'color' | 'movement'} MatchCriterionId
 *
 * @typedef {object} MatchPreferences
 * @property {{ min: number, max: number } | null} budget
 * @property {string[]} brand        Clés normalisées (`normalizeSpecText`)
 * @property {string[]} bracelet     Slugs de `WATCH_BRACELET_MATERIALS`
 * @property {string[]} caseMaterial Clés `watchSpec.material.*`
 * @property {string[]} color        Slugs de couleur (voir `MATCH_COLOR_OPTIONS`)
 * @property {string[]} movement     Clés `watchSpec.movement.*`
 *
 * @typedef {object} MatchOption
 * @property {string} value
 * @property {string} [label]      Libellé brut (marques)
 * @property {string} [labelKey]   Clé de catalogue i18n
 * @property {string} [gradient]   Dégradé CSS (pastilles de couleur)
 */

/** Séparateurs des saisies composées : « Acier / Or jaune », « Noir, bleu ». */
const COMPOUND_SEPARATOR = /\s*[,/]\s*/

/**
 * Pastilles de couleur. Les six couleurs de bracelet réutilisent leur dégradé du référentiel ;
 * les couleurs de cadran qui n'y figurent pas reçoivent le leur ici, dans le même esprit
 * (reflet métallique ou finition mate).
 *
 * `value` est le slug commun aux deux sources ; `specKey` fait le pont avec le vocabulaire
 * des cadrans (`resolveSpecKey('color', …)`).
 *
 * @type {Array<MatchOption & { specKey: string }>}
 */
export const MATCH_COLOR_OPTIONS = [
  ...WATCH_BRACELET_COLORS.map((color) => ({
    value: color.slug,
    labelKey: color.labelKey,
    gradient: color.gradient,
    specKey: color.labelKey,
  })),
  {
    value: 'white',
    labelKey: 'watchSpec.color.white',
    specKey: 'watchSpec.color.white',
    gradient: 'linear-gradient(135deg, #ffffff 0%, #fafafa 40%, #ececec 75%, #d9d9d9 100%)',
  },
  {
    value: 'grey',
    labelKey: 'watchSpec.color.grey',
    specKey: 'watchSpec.color.grey',
    gradient: 'linear-gradient(135deg, #d4d6d9 0%, #a3a7ad 35%, #6f747b 70%, #4a4f55 100%)',
  },
  {
    value: 'green',
    labelKey: 'watchSpec.color.green',
    specKey: 'watchSpec.color.green',
    gradient: 'linear-gradient(135deg, #cfe6d3 0%, #6fa77a 35%, #2f6b45 70%, #17402a 100%)',
  },
  {
    value: 'brown',
    labelKey: 'watchSpec.color.brown',
    specKey: 'watchSpec.color.brown',
    gradient: 'linear-gradient(135deg, #e0c7ad 0%, #a97c55 35%, #6b4a2f 70%, #3d2a1a 100%)',
  },
  {
    value: 'champagne',
    labelKey: 'watchSpec.color.champagne',
    specKey: 'watchSpec.color.champagne',
    gradient: 'linear-gradient(135deg, #fbf3dc 0%, #ecd9a8 35%, #d1b87a 70%, #a58f52 100%)',
  },
  {
    value: 'salmon',
    labelKey: 'watchSpec.color.salmon',
    specKey: 'watchSpec.color.salmon',
    gradient: 'linear-gradient(135deg, #fde3d6 0%, #f3b59e 35%, #d9846a 70%, #a85a45 100%)',
  },
]

const COLOR_BY_SPEC_KEY = new Map(MATCH_COLOR_OPTIONS.map((c) => [c.specKey, c]))
const COLOR_BY_VALUE = new Map(MATCH_COLOR_OPTIONS.map((c) => [c.value, c]))

/**
 * @param {unknown} raw
 * @returns {string[]}
 */
function splitCompound(raw) {
  const text = String(raw ?? '').trim()
  if (!text) return []
  return text.split(COMPOUND_SEPARATOR).filter(Boolean)
}

/**
 * @param {unknown} value
 * @returns {string[]}
 */
function stringArray(value) {
  if (!Array.isArray(value)) return []
  return value.filter((v) => typeof v === 'string' && v.trim())
}

/* ------------------------------------------------------------------ Critères */

/**
 * Valeurs d'une montre pour chaque critère. Un tableau vide signifie « inconnu ».
 * @type {Record<Exclude<MatchCriterionId, 'budget'>, (watch: any) => string[]>}
 */
const VALUES_OF = {
  brand(watch) {
    const key = normalizeSpecText(watch?.brand)
    return key ? [key] : []
  },
  bracelet(watch) {
    return stringArray(watch?.details?.braceletMaterials).filter((slug) =>
      getBraceletMaterialBySlug(slug),
    )
  },
  caseMaterial(watch) {
    const keys = new Set()
    for (const part of splitCompound(watch?.details?.caseMaterial)) {
      const key = resolveSpecKey('material', part)
      if (key) keys.add(key)
    }
    return [...keys]
  },
  color(watch) {
    const slugs = new Set()
    for (const slug of stringArray(watch?.details?.braceletColors)) {
      if (COLOR_BY_VALUE.has(slug)) slugs.add(slug)
    }
    for (const part of splitCompound(watch?.details?.dialColor)) {
      const key = resolveSpecKey('color', part)
      const color = key ? COLOR_BY_SPEC_KEY.get(key) : null
      if (color) slugs.add(color.value)
    }
    return [...slugs]
  },
  movement(watch) {
    const key = resolveSpecKey('movement', watch?.details?.movement)
    return key ? [key] : []
  },
}

/**
 * Descripteurs des critères, dans l'ordre des écrans. Les clés de libellé sont écrites en
 * clair pour que `messages/messageUsage.test.js` les voie comme utilisées.
 *
 * `weight` pèse dans le score d'affinité ; le budget n'en a pas, c'est un filtre.
 *
 * @type {Array<{ id: MatchCriterionId, kind: 'range' | 'multi', control: 'slider' | 'chips' | 'swatches', weight: number, titleKey: string, hintKey: string }>}
 */
export const MATCH_CRITERIA = [
  {
    id: 'budget',
    kind: 'range',
    control: 'slider',
    weight: 0,
    titleKey: 'matchmaking.step.budget.title',
    hintKey: 'matchmaking.step.budget.hint',
  },
  {
    id: 'brand',
    kind: 'multi',
    control: 'chips',
    weight: 3,
    titleKey: 'matchmaking.step.brand.title',
    hintKey: 'matchmaking.step.brand.hint',
  },
  {
    id: 'bracelet',
    kind: 'multi',
    control: 'chips',
    weight: 2,
    titleKey: 'matchmaking.step.bracelet.title',
    hintKey: 'matchmaking.step.bracelet.hint',
  },
  {
    id: 'caseMaterial',
    kind: 'multi',
    control: 'chips',
    weight: 2,
    titleKey: 'matchmaking.step.caseMaterial.title',
    hintKey: 'matchmaking.step.caseMaterial.hint',
  },
  {
    id: 'color',
    kind: 'multi',
    control: 'swatches',
    weight: 2,
    titleKey: 'matchmaking.step.color.title',
    hintKey: 'matchmaking.step.color.hint',
  },
  {
    id: 'movement',
    kind: 'multi',
    control: 'chips',
    weight: 1,
    titleKey: 'matchmaking.step.movement.title',
    hintKey: 'matchmaking.step.movement.hint',
  },
]

const CRITERION_BY_ID = new Map(MATCH_CRITERIA.map((c) => [c.id, c]))

/** @returns {MatchPreferences} */
export function createEmptyPreferences() {
  return {
    budget: null,
    brand: [],
    bracelet: [],
    caseMaterial: [],
    color: [],
    movement: [],
  }
}

/**
 * Remet des préférences lues du stockage (ou d'une URL) dans une forme sûre : toute valeur
 * inattendue est ignorée plutôt que de faire planter le parcours.
 *
 * @param {unknown} raw
 * @returns {MatchPreferences}
 */
export function sanitizePreferences(raw) {
  const prefs = createEmptyPreferences()
  if (!raw || typeof raw !== 'object') return prefs

  const budget = /** @type {any} */ (raw).budget
  if (budget && typeof budget === 'object') {
    const min = Number(budget.min)
    const max = Number(budget.max)
    if (Number.isFinite(min) && Number.isFinite(max) && min >= 0 && max >= min) {
      prefs.budget = { min, max }
    }
  }

  for (const criterion of MATCH_CRITERIA) {
    if (criterion.kind !== 'multi') continue
    const values = /** @type {any} */ (raw)[criterion.id]
    prefs[criterion.id] = [...new Set(stringArray(values))]
  }

  return prefs
}

/**
 * @param {MatchPreferences} preferences
 * @returns {boolean} Vrai si au moins une préférence est exprimée.
 */
export function hasAnyPreference(preferences) {
  if (!preferences) return false
  if (preferences.budget) return true
  return MATCH_CRITERIA.some(
    (c) => c.kind === 'multi' && Array.isArray(preferences[c.id]) && preferences[c.id].length > 0,
  )
}

/* ------------------------------------------------------------------ Facettes */

/**
 * Arrondit une borne de budget à un pas lisible (50 € sous 1 000, 100 € sous 10 000,
 * 500 € au-delà) pour que les tranches suggérées ne disent pas « 12 750 € ».
 * @param {number} value
 * @param {'floor' | 'ceil'} mode
 */
function roundBudgetBound(value, mode) {
  const step = value < 1000 ? 50 : value < 10000 ? 100 : 500
  const rounded =
    mode === 'floor' ? Math.floor(value / step) * step : Math.ceil(value / step) * step
  return Math.max(0, rounded)
}

/**
 * Tranches de budget suggérées (terciles du pool, bornes arrondies), pour proposer trois
 * raccourcis au-dessus du curseur. Retourne un tableau vide si le pool ne s'y prête pas.
 *
 * @param {number[]} sortedPrices Prix croissants, strictement positifs
 * @returns {Array<{ min: number, max: number }>}
 */
export function buildBudgetSuggestions(sortedPrices) {
  const n = sortedPrices.length
  if (n < 3) return []
  const min = roundBudgetBound(sortedPrices[0], 'floor')
  const max = roundBudgetBound(sortedPrices[n - 1], 'ceil')
  const t1 = roundBudgetBound(sortedPrices[Math.floor(n / 3)], 'ceil')
  const t2 = roundBudgetBound(sortedPrices[Math.floor((2 * n) / 3)], 'ceil')
  if (!(min < t1 && t1 < t2 && t2 < max)) return []
  return [
    { min, max: t1 },
    { min: t1, max: t2 },
    { min: t2, max },
  ]
}

/**
 * Facettes réellement présentes dans le pool, critère par critère. `active` vaut vrai quand
 * le critère a quelque chose à demander (au moins deux options ; pour le budget, une vraie
 * dispersion des prix).
 *
 * @param {any[]} pool
 * @returns {{
 *   pool: number,
 *   budget: { id: 'budget', active: boolean, min: number, max: number, suggestions: Array<{ min: number, max: number }> },
 *   brand: { id: 'brand', active: boolean, options: MatchOption[] },
 *   bracelet: { id: 'bracelet', active: boolean, options: MatchOption[] },
 *   caseMaterial: { id: 'caseMaterial', active: boolean, options: MatchOption[] },
 *   color: { id: 'color', active: boolean, options: MatchOption[] },
 *   movement: { id: 'movement', active: boolean, options: MatchOption[] },
 *   activeCriteria: MatchCriterionId[],
 * }}
 */
export function buildMatchFacets(pool) {
  const watches = Array.isArray(pool) ? pool : []

  const prices = watches
    .map((w) => getEffectiveWatchPrice(w))
    .filter((p) => Number.isFinite(p) && p > 0)
    .sort((a, b) => a - b)
  const budget = {
    id: /** @type {const} */ ('budget'),
    active: prices.length >= 2 && prices[0] < prices[prices.length - 1],
    min: prices.length ? roundBudgetBound(prices[0], 'floor') : 0,
    max: prices.length ? roundBudgetBound(prices[prices.length - 1], 'ceil') : 0,
    suggestions: buildBudgetSuggestions(prices),
  }

  // Marques : regroupées par forme normalisée, libellé = casse la plus fréquente en base
  // (« ROLEX » ×8 et « Rolex » ×1 ne font qu'une option).
  const brandCounts = new Map()
  for (const watch of watches) {
    const key = normalizeSpecText(watch?.brand)
    if (!key) continue
    const raw = String(watch.brand).trim()
    const entry = brandCounts.get(key) ?? { counts: new Map(), first: raw }
    entry.counts.set(raw, (entry.counts.get(raw) ?? 0) + 1)
    brandCounts.set(key, entry)
  }
  const brandOptions = [...brandCounts.entries()]
    .map(([value, { counts, first }]) => {
      let label = first
      let best = 0
      for (const [raw, count] of counts) {
        if (count > best) {
          best = count
          label = raw
        }
      }
      return { value, label }
    })
    .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }))

  const present = (id) => {
    const set = new Set()
    for (const watch of watches) for (const v of VALUES_OF[id](watch)) set.add(v)
    return set
  }

  const braceletPresent = present('bracelet')
  const braceletOptions = WATCH_BRACELET_MATERIALS.filter((m) => braceletPresent.has(m.slug)).map(
    (m) => ({ value: m.slug, labelKey: m.labelKey }),
  )

  const materialPresent = present('caseMaterial')
  const caseMaterialOptions = [...materialPresent]
    .sort()
    .map((key) => ({ value: key, labelKey: key }))

  const colorPresent = present('color')
  const colorOptions = MATCH_COLOR_OPTIONS.filter((c) => colorPresent.has(c.value)).map((c) => ({
    value: c.value,
    labelKey: c.labelKey,
    gradient: c.gradient,
  }))

  const movementPresent = present('movement')
  const movementOptions = [...movementPresent].sort().map((key) => ({ value: key, labelKey: key }))

  const multi = (id, options) => ({ id, active: options.length >= 2, options })

  const facets = {
    pool: watches.length,
    budget,
    brand: multi('brand', brandOptions),
    bracelet: multi('bracelet', braceletOptions),
    caseMaterial: multi('caseMaterial', caseMaterialOptions),
    color: multi('color', colorOptions),
    movement: multi('movement', movementOptions),
  }

  return {
    ...facets,
    activeCriteria: MATCH_CRITERIA.filter((c) => facets[c.id].active).map((c) => c.id),
  }
}

/* ------------------------------------------------------------------ Classement */

/**
 * @param {any} watch
 * @param {{ min: number, max: number } | null | undefined} budget
 * @returns {boolean} Une montre sans prix reste neutre : elle n'est pas écartée.
 */
export function isWatchInBudget(watch, budget) {
  if (!budget) return true
  const price = getEffectiveWatchPrice(watch)
  if (!(price > 0)) return true
  return price >= budget.min && price <= budget.max
}

/**
 * Score d'affinité d'une montre. Par critère renseigné : `+poids` si elle correspond,
 * `-poids/2` si elle contredit, `0` si la caractéristique est inconnue.
 *
 * @param {any} watch
 * @param {MatchPreferences} preferences
 * @returns {number}
 */
export function scoreWatch(watch, preferences) {
  let score = 0
  for (const criterion of MATCH_CRITERIA) {
    if (criterion.kind !== 'multi') continue
    const wanted = preferences?.[criterion.id]
    if (!Array.isArray(wanted) || wanted.length === 0) continue
    const values = VALUES_OF[criterion.id](watch)
    if (values.length === 0) continue
    const matches = values.some((v) => wanted.includes(v))
    score += matches ? criterion.weight : -criterion.weight / 2
  }
  return score
}

/**
 * Valeurs d'une montre pour un critère (exposé pour l'affichage des « points communs »).
 * @param {Exclude<MatchCriterionId, 'budget'>} criterionId
 * @param {any} watch
 * @returns {string[]}
 */
export function watchValuesFor(criterionId, watch) {
  const extract = VALUES_OF[criterionId]
  return extract ? extract(watch) : []
}

/**
 * Deck ordonné : budget appliqué en filtre, puis tri par score décroissant, puis
 * `displayOrder` décroissant (les nouveautés d'abord), puis id pour la stabilité.
 *
 * @param {any[]} pool
 * @param {MatchPreferences} preferences
 * @returns {{ ranked: any[], excludedByBudget: number }}
 */
export function rankPool(pool, preferences) {
  const watches = Array.isArray(pool) ? pool : []
  const prefs = preferences ?? createEmptyPreferences()

  const eligible = watches.filter((w) => isWatchInBudget(w, prefs.budget))
  const scored = eligible.map((watch) => ({ watch, score: scoreWatch(watch, prefs) }))

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    const orderDiff = (b.watch?.displayOrder ?? 0) - (a.watch?.displayOrder ?? 0)
    if (orderDiff !== 0) return orderDiff
    return String(a.watch?.id ?? '').localeCompare(String(b.watch?.id ?? ''))
  })

  return {
    ranked: scored.map((s) => s.watch),
    excludedByBudget: watches.length - eligible.length,
  }
}

/**
 * @param {MatchCriterionId} id
 */
export function getMatchCriterion(id) {
  return CRITERION_BY_ID.get(id) ?? null
}

/**
 * Libellé d'une valeur de couleur (pastille) depuis son slug, pour la shortlist et la
 * lightbox. Renvoie `null` si le slug est inconnu.
 * @param {string} slug
 */
export function getMatchColorOption(slug) {
  return COLOR_BY_VALUE.get(slug) ?? getBraceletColorBySlug(slug) ?? null
}
