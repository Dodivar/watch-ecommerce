/**
 * Formate les horaires boutique depuis `site.config.js` → `storeMap.openingHours`.
 * @param {{ daysLabel?: string, hoursLabel?: string } | null | undefined} openingHours
 * @returns {{ daysLabel: string, hoursLabel: string, hasHours: boolean }}
 */
export function resolveStoreOpeningHours(openingHours) {
  const daysLabel = openingHours?.daysLabel?.trim() || ''
  const hoursLabel = openingHours?.hoursLabel?.trim() || ''
  return {
    daysLabel,
    hoursLabel,
    hasHours: Boolean(daysLabel || hoursLabel),
  }
}
