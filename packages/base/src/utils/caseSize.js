/**
 * Diamètre du boîtier : valeur stockée sans unité (ex. "40"), affichage "40 mm" côté UI.
 */

/**
 * @param {unknown} value
 * @returns {number | null}
 */
export function parseCaseSizeMm(value) {
  if (value == null || value === '') return null
  const s = String(value).trim().replace(',', '.')
  const match = s.match(/(\d+(?:\.\d+)?)/)
  if (!match) return null
  const n = parseFloat(match[1])
  return Number.isFinite(n) ? n : null
}

/**
 * Valeur normalisée pour stockage (sans "mm").
 * @param {unknown} value
 * @returns {string}
 */
export function normalizeCaseSizeValue(value) {
  if (value == null) return ''
  const trimmed = String(value).trim()
  if (!trimmed) return ''

  const mm = parseCaseSizeMm(trimmed)
  if (mm === null) {
    return trimmed.replace(/\s*mm\s*/gi, '').trim()
  }

  return String(mm)
}

/**
 * @param {unknown} value
 * @returns {string}
 */
export function formatCaseSizeDisplay(value) {
  const normalized = normalizeCaseSizeValue(value)
  if (!normalized) return ''
  const mm = parseCaseSizeMm(normalized)
  if (mm === null) return normalized
  return `${String(mm)} mm`
}

/**
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
export function compareCaseSizeValues(a, b) {
  const na = parseCaseSizeMm(a)
  const nb = parseCaseSizeMm(b)
  if (na !== null && nb !== null) return na - nb
  if (na !== null) return -1
  if (nb !== null) return 1
  return String(a).localeCompare(String(b), 'fr')
}

/**
 * @param {{ details?: { caseSize?: string } }} watch
 * @param {string[]} selectedNormalizedSizes
 */
export function watchMatchesCaseSize(watch, selectedNormalizedSizes) {
  if (!selectedNormalizedSizes?.length) return true
  const watchSize = normalizeCaseSizeValue(watch.details?.caseSize)
  if (!watchSize) return false
  return selectedNormalizedSizes.includes(watchSize)
}
