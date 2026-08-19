/**
 * Valeurs alignées sur la migration `watch_audiences` (slug + libellés).
 * Sert de repli si la table n’est pas encore migrée ou si la requête Supabase échoue.
 *
 * La table ne porte qu'une colonne `label_fr` : le libellé affiché passe donc par
 * `getWatchAudienceLabel()`, qui traduit le slug et ne retombe sur le français de la base
 * que pour un slug hors référentiel.
 */

import { t } from '@/i18n'
import { resolveSpecKey } from './watchSpecVocabulary.js'

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

/** Slug par défaut en base et formulaire admin. */
export const DEFAULT_WATCH_AUDIENCE_SLUG = 'unisexe'

/**
 * Lignes complètes (même sémantique que la table watch_audiences).
 * @type {Array<{ slug: string, label_fr: string, sort_order: number, show_in_collection_filter: boolean }>}
 */
export const STATIC_WATCH_AUDIENCE_ROWS = [
  { slug: 'unisexe', label_fr: 'Unisexe', sort_order: 5, show_in_collection_filter: false },
  { slug: 'homme', label_fr: 'Homme', sort_order: 10, show_in_collection_filter: true },
  { slug: 'femme', label_fr: 'Femme', sort_order: 20, show_in_collection_filter: true },
  { slug: 'enfant', label_fr: 'Enfant', sort_order: 30, show_in_collection_filter: true },
]

/** Options pour les chips du filtre collection (sans « Tous »). */
export function getStaticWatchAudienceFilterOptions() {
  return STATIC_WATCH_AUDIENCE_ROWS.filter((r) => r.show_in_collection_filter)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((r) => ({ id: r.slug, label: getWatchAudienceLabel(r.slug, r.label_fr) }))
}

const COLLECTION_PUBLIC_QUERY_SLUGS = new Set(
  getStaticWatchAudienceFilterOptions().map((o) => o.id),
)

/** Slug `public` valide pour `?public=` (collection, cartes home sélections). */
export function isValidCollectionPublicQuerySlug(slug) {
  return typeof slug === 'string' && COLLECTION_PUBLIC_QUERY_SLUGS.has(slug)
}

/** Options `<select>` admin : toutes les lignes du référentiel. */
export function getStaticWatchAudienceAdminOptions() {
  return STATIC_WATCH_AUDIENCE_ROWS.slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((r) => ({ value: r.slug, label: getWatchAudienceLabel(r.slug, r.label_fr) }))
}
