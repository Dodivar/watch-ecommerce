/**
 * Parse la colonne Features PrestaShop : feature:value:position:customized
 * (plusieurs features séparées par des virgules).
 *
 * @param {string} raw
 * @returns {Record<string, string>}
 */
export function parsePrestashopFeatures(raw) {
  return parsePrestashopFeaturesStrict(raw)
}

/**
 * @param {string} raw
 * @returns {Record<string, string>}
 */
export function parsePrestashopFeaturesStrict(raw) {
  /** @type {Record<string, string>} */
  const features = {}
  if (!raw?.trim()) return features

  for (const bundle of splitFeatureBundles(raw)) {
    const parsed = parseFeatureBundle(bundle)
    if (parsed) {
      features[parsed.name] = parsed.value
    }
  }

  return features
}

/**
 * @param {string} bundle
 * @returns {{ name: string, value: string } | null}
 */
export function parseFeatureBundle(bundle) {
  const trimmed = bundle.trim()
  if (!trimmed) return null

  const parts = trimmed.split(':')
  if (parts.length < 2) return null

  if (parts.length >= 4) {
    const name = parts[0].trim()
    const value = parts.slice(1, -2).join(':').trim()
    return name && value ? { name, value } : null
  }

  const name = parts[0].trim()
  const value = parts[1]?.trim() ?? ''
  return name && value ? { name, value } : null
}

/**
 * @param {string} raw
 * @returns {string[]}
 */
function splitFeatureBundles(raw) {
  /** @type {string[]} */
  const bundles = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < raw.length; i += 1) {
    const char = raw[i]
    if (char === '"') {
      inQuotes = !inQuotes
      continue
    }
    if (char === ',' && !inQuotes) {
      if (current.trim()) bundles.push(current.trim())
      current = ''
      continue
    }
    current += char
  }

  if (current.trim()) bundles.push(current.trim())
  return bundles
}
