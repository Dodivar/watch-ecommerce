/**
 * Extrait une valeur d'un tableau address_components Google Places.
 * @param {Array<{ long_name: string, short_name: string, types: string[] }>} components
 * @param {string} type
 * @param {'long_name' | 'short_name'} nameType
 */
function getComponent(components, type, nameType = 'long_name') {
  const found = components.find((c) => c.types?.includes(type))
  if (!found) return ''
  if (nameType === 'short_name') {
    return String(found.short_name || found.shortText || '').trim()
  }
  return String(found.long_name || found.longText || '').trim()
}

/**
 * Mappe les address_components Google Places vers le schéma checkout.
 * @param {Array<{ long_name: string, short_name: string, types: string[] }>} components
 * @param {{ formattedAddress?: string }} [fallback]
 * @returns {{ line1: string, line2: string, postalCode: string, city: string, country: string }}
 */
export function parseAddressComponents(components, fallback = {}) {
  if (!Array.isArray(components) || components.length === 0) {
    return {
      line1: fallback.formattedAddress || '',
      line2: '',
      postalCode: '',
      city: '',
      country: '',
    }
  }

  const streetNumber = getComponent(components, 'street_number')
  const route = getComponent(components, 'route')
  let line1 = [streetNumber, route].filter(Boolean).join(' ').trim()
  if (!line1) {
    line1 = route || fallback.formattedAddress || ''
  }

  const line2Parts = [
    getComponent(components, 'subpremise'),
    getComponent(components, 'floor'),
    getComponent(components, 'premise'),
  ].filter(Boolean)

  const city =
    getComponent(components, 'locality') ||
    getComponent(components, 'postal_town') ||
    getComponent(components, 'administrative_area_level_2')

  return {
    line1,
    line2: line2Parts.join(', '),
    postalCode: getComponent(components, 'postal_code'),
    city,
    country: getComponent(components, 'country', 'short_name').toUpperCase(),
  }
}
