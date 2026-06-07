/**
 * NAP canonique (Name, Address, Phone) dérivé du manifest client pour footer, schema.org et GMB.
 * Priorité adresse : storeMap.directionsAddress → legal.address.
 */

function stripHtml(value) {
  if (typeof value !== 'string') return ''
  return value.replace(/<br\s*\/?>/gi, ', ').replace(/\s+/g, ' ').trim()
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
    storeMap.directionsAddress ||
    legal.address ||
    stripHtml(contact.footerAddressHtml) ||
    ''
  const telephone = contact.phoneE164 || contact.whatsappE164 || ''
  const phoneDisplay = contact.phoneDisplay || contact.whatsappE164 || ''
  const email = contact.email || ''

  return {
    name,
    streetAddress,
    telephone,
    phoneDisplay,
    email,
    displayAddressHtml: contact.footerAddressHtml || '',
  }
}
