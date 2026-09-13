/**
 * NAP canonique (Name, Address, Phone) dérivé du manifest client pour footer, schema.org et GMB.
 * Priorité adresse : storeMap.directionsAddress → legal.address.
 */

function stripHtml(value) {
  if (typeof value !== 'string') return ''
  return value.replace(/<br\s*\/?>/gi, ', ').replace(/\s+/g, ' ').trim()
}

/** Pays par défaut : les vitrines actuelles sont toutes françaises. */
const DEFAULT_ADDRESS_COUNTRY = 'FR'

/**
 * Découpe une adresse française en composants schema.org.
 *
 * `PostalAddress` attend une rue, un code postal et une commune **séparés** : tout empiler dans
 * `streetAddress` prive Google du signal local, qui compte pour une boutique physique. Le
 * manifest ne stocke qu'une ligne libre (« 32 Allée de la Robertsau, 67000 Strasbourg, France »),
 * d'où ce découpage — ancré sur le code postal à cinq chiffres, seul repère fiable de la forme
 * française.
 *
 * Adresse non reconnue : `postalCode` et `addressLocality` restent vides et l'appelant retombe
 * sur la ligne entière, plutôt que de produire un composant inventé.
 *
 * @param {string} value
 * @returns {{ streetAddress: string, postalCode: string, addressLocality: string }}
 */
export function parseFrenchPostalAddress(value) {
  const line = typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : ''
  if (!line) return { streetAddress: '', postalCode: '', addressLocality: '' }

  // Code postal, puis commune jusqu'à la virgule suivante (le pays, s'il est présent, la suit).
  const match = line.match(/\b(\d{5})\b[\s,]+([^,]+)/)
  if (!match) return { streetAddress: line, postalCode: '', addressLocality: '' }

  const streetAddress = line
    .slice(0, match.index)
    .trim()
    .replace(/[,\s]+$/, '')
  const addressLocality = match[2].trim().replace(/[,\s]+$/, '')

  // Un code postal sans rue devant ne décrit rien : on préfère rendre la ligne telle quelle.
  if (!streetAddress) return { streetAddress: line, postalCode: '', addressLocality: '' }

  return { streetAddress, postalCode: match[1], addressLocality }
}

/**
 * @param {Record<string, unknown>} siteConfig
 */
export function resolveSiteNap(siteConfig) {
  const brand = siteConfig?.brand ?? {}
  const contact = siteConfig?.contact ?? {}
  const legal = siteConfig?.legal ?? {}
  const storeMap = siteConfig?.storeMap ?? {}

  const name = brand.legalName || brand.displayName || ''
  const streetAddress =
    storeMap.directionsAddress || legal.address || stripHtml(contact.footerAddressHtml) || ''
  const telephone = contact.phoneE164 || contact.whatsappE164 || ''
  const phoneDisplay = contact.phoneDisplay || contact.whatsappE164 || ''
  const email = contact.email || ''

  const parsed = parseFrenchPostalAddress(streetAddress)

  return {
    name,
    /** Ligne complète, telle qu'affichée. */
    streetAddress,
    telephone,
    phoneDisplay,
    email,
    displayAddressHtml: contact.footerAddressHtml || '',
    /**
     * Composants pour `schema.org/PostalAddress`. Le manifest peut les déclarer explicitement
     * (`storeMap.postalCode`, `storeMap.addressLocality`, `storeMap.addressCountry`) : une
     * adresse hors format français reste ainsi exploitable sans toucher au code.
     */
    postalAddress: {
      streetAddress: storeMap.streetAddress || parsed.streetAddress,
      postalCode: storeMap.postalCode || parsed.postalCode,
      addressLocality: storeMap.addressLocality || parsed.addressLocality,
      addressCountry: storeMap.addressCountry || DEFAULT_ADDRESS_COUNTRY,
    },
  }
}
