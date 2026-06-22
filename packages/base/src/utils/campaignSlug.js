/**
 * Slug URL pour une campagne promotionnelle (?event=slug).
 * @param {string} name
 */
export function slugifyCampaignName(name) {
  if (!name || typeof name !== 'string') return ''
  return name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * @param {string} baseSlug
 * @param {number} [attempt]
 */
export function appendCampaignSlugSuffix(baseSlug, attempt = 2) {
  const safe = baseSlug || 'evenement'
  return attempt <= 1 ? safe : `${safe}-${attempt}`
}

/**
 * @param {string} slug
 */
export function isValidCampaignSlug(slug) {
  return typeof slug === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
}
