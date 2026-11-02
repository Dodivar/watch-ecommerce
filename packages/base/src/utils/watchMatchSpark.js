/**
 * Le « coup de foudre » au sens fort : le match qui déclenche l'écran de célébration.
 *
 * Un coup de cœur se donne à volonté ; un coup de foudre, lui, doit rester **rare**, sans quoi
 * la célébration devient une formalité qu'on balaie du pouce. Deux conditions, cumulées :
 *
 * 1. **L'affinité.** La montre doit satisfaire au moins `SPARK_AFFINITY_THRESHOLD` du poids que
 *    le visiteur a exprimé (`affinityRatio`, même mesure que le deck et les alertes). Le deck
 *    étant classé par affinité, la tête de pile y prétend souvent : c'est la seconde condition
 *    qui fait la rareté.
 * 2. **Le délai.** Après un coup de foudre, il faut `SPARK_COOLDOWN_LIKES` coups de cœur
 *    ordinaires avant le suivant. Deux célébrations d'affilée en annulent une.
 *
 * Visiteur sans critère exprimé (`affinityRatio` nul) : rien ne permet de dire qu'une montre lui
 * correspond mieux qu'une autre. Seul son tout premier coup de cœur est célébré — l'accueil —,
 * jamais les suivants : prétendre une affinité qu'on ne mesure pas serait mentir.
 *
 * Aucun import Vue ni i18n : fonctions pures, testées à part (`watchMatchSpark.test.js`).
 */

import { MATCH_CRITERIA, affinityRatio, watchValuesFor } from '@/utils/watchMatchCore.js'

/** Part minimale du poids exprimé que la montre doit cocher. */
export const SPARK_AFFINITY_THRESHOLD = 0.75

/** Coups de cœur ordinaires à donner entre deux coups de foudre. */
export const SPARK_COOLDOWN_LIKES = 3

/**
 * Coups de cœur donnés depuis le dernier coup de foudre, dans l'ordre de `liked`.
 * `Infinity` quand il n'y en a encore eu aucun : rien ne retient le premier.
 *
 * @param {string[]} liked  Coups de cœur, dans l'ordre où ils ont été donnés
 * @param {string[]} sparks Coups de foudre, dans l'ordre où ils ont eu lieu
 * @returns {number}
 */
export function likesSinceLastSpark(liked, sparks) {
  const likedIds = Array.isArray(liked) ? liked : []
  const sparkIds = Array.isArray(sparks) ? sparks : []
  if (sparkIds.length === 0) return Infinity
  const sparkSet = new Set(sparkIds)
  for (let i = likedIds.length - 1; i >= 0; i -= 1) {
    if (sparkSet.has(likedIds[i])) return likedIds.length - 1 - i
  }
  // Coups de foudre tous retirés de la shortlist : plus rien ne retient le suivant.
  return Infinity
}

/**
 * Ce coup de cœur est-il un coup de foudre ? À appeler **avant** d'ajouter la montre à
 * `liked` : l'historique décrit ce qui précède la décision.
 *
 * @param {any} watch
 * @param {import('@/utils/watchMatchCore.js').MatchPreferences} preferences
 * @param {{ liked?: string[], sparks?: string[] }} [history]
 * @returns {boolean}
 */
export function isCoupDeFoudre(watch, preferences, { liked = [], sparks = [] } = {}) {
  if (!watch?.id) return false
  if (sparks.includes(watch.id)) return false
  if (likesSinceLastSpark(liked, sparks) < SPARK_COOLDOWN_LIKES) return false
  const ratio = affinityRatio(watch, preferences)
  if (ratio === null) return sparks.length === 0 && liked.length === 0
  return ratio >= SPARK_AFFINITY_THRESHOLD
}

/**
 * Ce que la montre a coché parmi les préférences : « ce qui vous a fait craquer ». Valeurs
 * brutes (slugs, clés de vocabulaire), dans l'ordre des critères ; l'affichage les résout en
 * libellés via les facettes.
 *
 * @param {any} watch
 * @param {import('@/utils/watchMatchCore.js').MatchPreferences} preferences
 * @returns {Array<{ criterionId: string, values: string[] }>}
 */
export function sparkTraits(watch, preferences) {
  const traits = []
  for (const criterion of MATCH_CRITERIA) {
    if (criterion.kind !== 'multi') continue
    const wanted = preferences?.[criterion.id]
    if (!Array.isArray(wanted) || wanted.length === 0) continue
    const values = watchValuesFor(criterion.id, watch).filter((v) => wanted.includes(v))
    if (values.length) traits.push({ criterionId: criterion.id, values })
  }
  return traits
}
