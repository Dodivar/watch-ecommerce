/**
 * Comparateur pour tri « récent » (createdAt desc, puis displayOrder desc).
 * @param {{ createdAt?: string, displayOrder?: number }} a
 * @param {{ createdAt?: string, displayOrder?: number }} b
 * @returns {number}
 */
export function compareWatchesByRecent(a, b) {
  const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
  const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
  if (dateA === 0 && dateB === 0) {
    return (b.displayOrder || 0) - (a.displayOrder || 0)
  }
  return dateB - dateA
}
