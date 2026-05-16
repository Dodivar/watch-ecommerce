/** Media query pour pagination collection compacte (mobile). */
export const COLLECTION_PAGINATION_MOBILE_MQ = '(max-width: 639px)'

/**
 * Pages affichées : 1 et dernière toujours visibles.
 * — Desktop : fenêtre autour de la page courante + ellipses entre les trous.
 * — Mobile : pas d’ellipses, ensemble réduit (ex. 1, 2, 3, 337).
 *
 * @param {number} current
 * @param {number} last
 * @param {boolean} compact
 * @returns {Array<{ type: 'page'; n: number } | { type: 'ellipsis' }>}
 */
export function buildCollectionPaginationItems(current, last, compact) {
  if (last <= 1) return []

  /** @type {Set<number>} */
  const pages = new Set([1, last])

  if (last <= 5) {
    for (let p = 1; p <= last; p += 1) pages.add(p)
  } else if (compact) {
    if (current <= 2) {
      pages.add(2)
      pages.add(3)
    } else if (current >= last - 1) {
      pages.add(last - 2)
      pages.add(last - 1)
    } else {
      pages.add(current - 1)
      pages.add(current)
      pages.add(current + 1)
    }
  } else {
    for (let p = Math.max(2, current - 2); p <= Math.min(last - 1, current + 2); p += 1) {
      pages.add(p)
    }
    if (current <= 4) {
      for (let p = 2; p <= Math.min(5, last - 1); p += 1) pages.add(p)
    }
    if (current >= last - 3) {
      for (let p = Math.max(2, last - 4); p < last; p += 1) pages.add(p)
    }
  }

  const sorted = [...pages].sort((a, b) => a - b)
  /** @type {Array<{ type: 'page'; n: number } | { type: 'ellipsis' }>} */
  const items = []

  for (let i = 0; i < sorted.length; i += 1) {
    if (!compact && i > 0 && sorted[i] - sorted[i - 1] > 1) {
      items.push({ type: 'ellipsis' })
    }
    items.push({ type: 'page', n: sorted[i] })
  }

  return items
}
