/**
 * Libellés traduits des cibles de catalogue.
 *
 * Le référentiel lui-même (slugs, ordre, filtre) vit dans `watchAudienceSlugs.js`, sans i18n :
 * il est atteint par `resolveSiteConfig`, qui tourne aussi hors navigateur. Ce module-ci ajoute
 * la traduction et n'est donc importable que côté application.
 *
 * La table `watch_audiences` ne porte qu'une colonne `label_fr` : le libellé affiché passe par
 * `getWatchAudienceLabel()`, qui traduit le slug et ne retombe sur le français de la base que
 * pour un slug hors référentiel.
 */

import { t } from '@/i18n'

import { resolveSpecKey } from './watchSpecVocabulary.js'
import {
  STATIC_WATCH_AUDIENCE_ROWS,
  getWatchAudienceFilterRows,
} from './watchAudienceSlugs.js'

export {
  DEFAULT_WATCH_AUDIENCE_SLUG,
  STATIC_WATCH_AUDIENCE_ROWS,
  getWatchAudienceFilterRows,
  isValidCollectionPublicQuerySlug,
} from './watchAudienceSlugs.js'

/**
 * Libellé traduit d'une cible de catalogue.
 * @param {string} slug
 * @param {string} [fallbackLabel]  `label_fr` de la base, pour un slug non référencé.
 * @returns {string}
 */
export function getWatchAudienceLabel(slug, fallbackLabel = '') {
  const key = resolveSpecKey('audience', slug)
  if (key) return t(key)
  return fallbackLabel || slug
}

/** Options pour les chips du filtre collection (sans « Tous »). */
export function getStaticWatchAudienceFilterOptions() {
  return getWatchAudienceFilterRows().map((r) => ({
    id: r.slug,
    label: getWatchAudienceLabel(r.slug, r.label_fr),
  }))
}

/** Options `<select>` admin : toutes les lignes du référentiel. */
export function getStaticWatchAudienceAdminOptions() {
  return STATIC_WATCH_AUDIENCE_ROWS.slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((r) => ({ value: r.slug, label: getWatchAudienceLabel(r.slug, r.label_fr) }))
}
