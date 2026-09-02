/**
 * Noyau de la correspondance « coup de foudre » : ce qu'une montre vaut face aux préférences
 * d'un visiteur. Une seule définition, partagée par les deux mondes qui en ont besoin.
 *
 * **Pourquoi ce fichier existe.** `watchMatchmaking.js` (le parcours front) et le backend
 * d'alerte e-mail doivent répondre exactement à la même question : « cette montre correspond-elle
 * à ces critères ? ». Deux implémentations dériveraient — et la dérive se paierait en e-mails
 * hors sujet. Mais le backend est en CommonJS et ne sait pas résoudre les alias `@/` de Vite :
 * `watchMatchmaking.js`, qui tire `@/i18n` par ses référentiels de bracelet, lui était
 * inaccessible.
 *
 * Ce module est donc l'exact sous-ensemble commun, **sans alias ni import Vue/i18n** : rien que
 * des imports relatifs vers des fichiers eux-mêmes sans alias. Le backend le charge par
 * `import()` dynamique depuis du CJS, comme `backend/sites/registry.js` charge déjà les helpers
 * i18n du socle. `watchMatchCore.test.js` vérifie que cette pureté tient dans le temps.
 *
 * Ce qui reste dans `watchMatchmaking.js` : les facettes, le classement du deck, et tout ce qui
 * ne sert qu'à l'affichage.
 */

import { WATCH_BRACELET_COLORS, normalizeBraceletColors } from '../constants/watchBraceletColors.js'
import {
  getBraceletMaterialBySlug,
  normalizeBraceletMaterials,
} from '../constants/watchBraceletMaterials.js'
import { normalizeSpecText, resolveSpecKey } from '../constants/watchSpecVocabulary.js'
import { getEffectiveWatchPrice } from './watchPricing.js'

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
 * La table vit dans le noyau, dégradés compris, plutôt que côté affichage : c'est elle qui
 * définit les couleurs *reconnaissables*, donc ce que le backend doit savoir apparier. La
 * scinder en deux (valeurs ici, dégradés ailleurs) rouvrirait la dérive que ce fichier ferme.
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
 * C'est aussi la frontière de validation du backend : le corps d'une requête publique passe
 * par ici avant d'atteindre la base, ce qui garantit par construction que l'historique de swipe
 * (`seen`, `liked`, `passed`) n'y entre jamais — seuls les champs déclarés ici survivent.
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

/* ------------------------------------------------------------------ Affinité */

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
 * Score **et** poids total réellement demandé par le visiteur. Le second sert à ramener le
 * premier sur une échelle comparable d'une personne à l'autre : un score de 3 ne dit rien tant
 * qu'on ignore si le visiteur a exprimé un critère ou cinq.
 *
 * @param {any} watch
 * @param {MatchPreferences} preferences
 * @returns {{ score: number, expressedWeight: number }}
 */
export function measureAffinity(watch, preferences) {
  let score = 0
  let expressedWeight = 0
  for (const criterion of MATCH_CRITERIA) {
    if (criterion.kind !== 'multi') continue
    const wanted = preferences?.[criterion.id]
    if (!Array.isArray(wanted) || wanted.length === 0) continue
    expressedWeight += criterion.weight
    const values = VALUES_OF[criterion.id](watch)
    if (values.length === 0) continue
    const matches = values.some((v) => wanted.includes(v))
    score += matches ? criterion.weight : -criterion.weight / 2
  }
  return { score, expressedWeight }
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
  return measureAffinity(watch, preferences).score
}

/**
 * Part du poids exprimé qu'une montre satisfait positivement, de `-0.5` (elle contredit tout)
 * à `1` (elle coche tout). `null` quand le visiteur n'a exprimé aucun critère de type liste :
 * il n'y a alors rien à rapporter, seul le budget parle.
 *
 * @param {any} watch
 * @param {MatchPreferences} preferences
 * @returns {number | null}
 */
export function affinityRatio(watch, preferences) {
  const { score, expressedWeight } = measureAffinity(watch, preferences)
  return expressedWeight === 0 ? null : score / expressedWeight
}

/**
 * Seuil à partir duquel une montre justifie un e-mail : elle doit satisfaire positivement au
 * moins la moitié du poids que le visiteur a exprimé.
 *
 * Le deck se contente de classer — une montre tiède finit en fin de pile, sans conséquence.
 * Une alerte, elle, écrit à quelqu'un : il faut une décision, et c'est la seule règle du
 * parcours qui transforme le score en oui/non. La moitié parce qu'« inconnu vaut 0 » (voir
 * `measureAffinity`) : sur un catalogue aux fiches inégalement remplies, exiger davantage
 * reviendrait à n'écrire que pour les montres exhaustivement décrites, et exiger moins à
 * écrire pour une montre dont on ne sait presque rien.
 */
export const MATCH_ALERT_THRESHOLD = 0.5

/**
 * Cette montre correspond-elle assez à ces préférences pour mériter un e-mail ?
 *
 * Le budget reste le seul filtre dur, comme dans le deck. Ensuite :
 * - aucun critère de liste exprimé → le budget suffit (le visiteur a demandé à être prévenu
 *   des nouveautés : lui écrire répond à sa demande, ce n'est pas un envoi non sollicité) ;
 * - sinon, il faut atteindre `threshold` du poids exprimé.
 *
 * Les deux cas limites sont des branches écrites, pas des effets de bord d'une comparaison :
 * une alerte « budget seul » ne peut pas rester muette à jamais (son score vaudrait toujours 0),
 * et une alerte sans aucun critère ne se déclenche pas *par accident*.
 *
 * @param {any} watch
 * @param {MatchPreferences} preferences
 * @param {number} [threshold]
 * @returns {boolean}
 */
export function matchesPreferences(watch, preferences, threshold = MATCH_ALERT_THRESHOLD) {
  const prefs = preferences ?? createEmptyPreferences()
  if (!isWatchInBudget(watch, prefs.budget)) return false
  const ratio = affinityRatio(watch, prefs)
  if (ratio === null) return true
  return ratio >= threshold
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
 * @param {MatchCriterionId} id
 */
export function getMatchCriterion(id) {
  return CRITERION_BY_ID.get(id) ?? null
}

/**
 * Définition d'une couleur depuis son slug (libellé + pastille). `null` si le slug est inconnu.
 * @param {string} slug
 * @returns {(MatchOption & { specKey: string }) | null}
 */
export function getMatchColorOption(slug) {
  return COLOR_BY_VALUE.get(slug) ?? null
}

/* ------------------------------------------------------------------ Lignes brutes */

/**
 * Montre minimale lisible par `VALUES_OF`, construite depuis les lignes Supabase brutes
 * (`watches` + `watch_details`). Le front passe par `transformWatchData`
 * (`services/watchService.js`), qui a besoin de bien plus — images, traductions, promotions ;
 * le backend, lui, n'a que la correspondance à faire.
 *
 * Les deux doivent nommer les mêmes champs. C'est ce que verrouille le test « produit les
 * champs que lit la correspondance » : si un critère se met à lire une caractéristique de plus,
 * l'oublier ici rendrait toutes les montres « inconnues » de ce côté — un silence, pas une
 * erreur.
 *
 * @param {Record<string, any>} row       Ligne `watches`
 * @param {Record<string, any>} [details] Ligne `watch_details` associée
 * @returns {any}
 */
export function buildMatchWatchFromRow(row, details = {}) {
  const d = details || {}
  return {
    id: row?.id,
    slug: row?.slug || null,
    name: row?.name || '',
    brand: row?.brand || '',
    reference: row?.reference || null,
    price: row?.price ?? null,
    promotionPrice: row?.promotion_price ?? null,
    createdAt: row?.created_at || null,
    details: {
      movement: d.movement || '',
      caseMaterial: d.case_material || '',
      braceletMaterials: normalizeBraceletMaterials(
        d.bracelet_materials?.length ? d.bracelet_materials : d.bracelet_material,
      ),
      braceletColors: normalizeBraceletColors(d.bracelet_colors),
      dialColor: d.dial_color || '',
    },
  }
}
