/** Longueur max d'une requête catalogue dans l'URL. */
export const SEARCH_QUERY_MAX_LENGTH = 80

/**
 * Texte comparé en recherche : minuscules, sans accents (é → e, etc.).
 * @param {string | null | undefined} str
 * @returns {string}
 */
export function normalizeSearchText(str) {
  if (!str || typeof str !== 'string') return ''
  return str
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
}

/**
 * Normalise `route.query.q` (string ou tableau) en terme de recherche ou `null`.
 * @param {string | string[] | null | undefined} raw
 * @returns {string | null}
 */
export function parseSearchQuery(raw) {
  const value = Array.isArray(raw) ? raw[0] : raw
  if (value == null) return null
  const trimmed = String(value).trim()
  if (!trimmed) return null
  return trimmed.slice(0, SEARCH_QUERY_MAX_LENGTH)
}

/**
 * Indique si une montre correspond au terme de recherche (casse et accents ignorés).
 * @param {{ name?: string, brand?: string, model?: string, reference?: string, ad_code?: string }} watch
 * @param {string | null} query - terme déjà parsé (non vide)
 * @returns {boolean}
 */
export function watchMatchesSearchQuery(watch, query) {
  if (!query || !watch) return false
  const q = normalizeSearchText(query)
  if (!q) return false

  const fieldMatches = (value) => normalizeSearchText(value).includes(q)

  return (
    fieldMatches(watch.name) ||
    fieldMatches(watch.brand) ||
    fieldMatches(watch.model) ||
    fieldMatches(watch.reference) ||
    fieldMatches(watch.ad_code)
  )
}
