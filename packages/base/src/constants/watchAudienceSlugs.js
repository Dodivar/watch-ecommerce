/**
 * Référentiel brut des cibles de catalogue — **sans i18n**.
 *
 * Séparé de `watchAudiences.js` parce que celui-ci importe `t()`, donc tout le runtime i18n,
 * donc `@site-config` : un module virtuel que seul Vite sait résoudre. Or `resolveSiteConfig`
 * atteint ce référentiel (via `homeSelections.js`) et tourne aussi dans la fonction serverless
 * `api/sitemap.js`, hors de Vite. Valider un slug ne demande que des données — pas de libellé,
 * donc pas de traduction, donc pas de site actif.
 *
 * `watchAudiences.js` réexporte tout ce qui suit : les appelants qui ont besoin des libellés
 * continuent de n'importer que lui.
 */

/** Slug par défaut en base et dans le formulaire admin. */
export const DEFAULT_WATCH_AUDIENCE_SLUG = 'unisexe'

/**
 * Lignes complètes (même sémantique que la table `watch_audiences`).
 * @type {Array<{ slug: string, label_fr: string, sort_order: number, show_in_collection_filter: boolean }>}
 */
export const STATIC_WATCH_AUDIENCE_ROWS = [
  { slug: 'unisexe', label_fr: 'Unisexe', sort_order: 5, show_in_collection_filter: false },
  { slug: 'homme', label_fr: 'Homme', sort_order: 10, show_in_collection_filter: true },
  { slug: 'femme', label_fr: 'Femme', sort_order: 20, show_in_collection_filter: true },
  { slug: 'enfant', label_fr: 'Enfant', sort_order: 30, show_in_collection_filter: true },
]

/** Lignes du filtre collection, dans l'ordre d'affichage (sans « Tous »). */
export function getWatchAudienceFilterRows() {
  return STATIC_WATCH_AUDIENCE_ROWS.filter((row) => row.show_in_collection_filter).sort(
    (a, b) => a.sort_order - b.sort_order,
  )
}

const COLLECTION_PUBLIC_QUERY_SLUGS = new Set(getWatchAudienceFilterRows().map((row) => row.slug))

/** Slug `public` valide pour `?public=` (collection, cartes home sélections). */
export function isValidCollectionPublicQuerySlug(slug) {
  return typeof slug === 'string' && COLLECTION_PUBLIC_QUERY_SLUGS.has(slug)
}
