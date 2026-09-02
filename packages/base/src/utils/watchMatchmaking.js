/**
 * Expérience « coup de foudre » (`/coup-de-foudre`), versant affichage : facettes réellement
 * présentes dans le stock, puis deck ordonné par affinité avec les préférences.
 *
 * La définition de la correspondance elle-même — critères, poids, extraction des
 * caractéristiques, budget, score — vit dans `watchMatchCore.js`, sans alias ni i18n, pour que
 * le backend d'alerte e-mail travaille sur exactement les mêmes règles. Ce module la
 * réexporte : les composants continuent d'importer `@/utils/watchMatchmaking.js`.
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

import { WATCH_BRACELET_MATERIALS } from '@/constants/watchBraceletMaterials'
import { normalizeSpecText } from '@/constants/watchSpecVocabulary'
import { getEffectiveWatchPrice } from '@/utils/watchPricing.js'
import {
  MATCH_COLOR_OPTIONS,
  MATCH_CRITERIA,
  createEmptyPreferences,
  isWatchInBudget,
  scoreWatch,
  watchValuesFor,
} from '@/utils/watchMatchCore.js'

export {
  MATCH_ALERT_THRESHOLD,
  MATCH_COLOR_OPTIONS,
  MATCH_CRITERIA,
  affinityRatio,
  createEmptyPreferences,
  getMatchColorOption,
  getMatchCriterion,
  hasAnyPreference,
  isWatchInBudget,
  matchesPreferences,
  measureAffinity,
  sanitizePreferences,
  scoreWatch,
  watchValuesFor,
} from '@/utils/watchMatchCore.js'

/**
 * @typedef {import('@/utils/watchMatchCore.js').MatchCriterionId} MatchCriterionId
 * @typedef {import('@/utils/watchMatchCore.js').MatchPreferences} MatchPreferences
 * @typedef {import('@/utils/watchMatchCore.js').MatchOption} MatchOption
 */

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
    for (const watch of watches) for (const v of watchValuesFor(id, watch)) set.add(v)
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
