import { normalizeCaseSizeValue } from '../../packages/base/src/utils/caseSize.js'
import { getMappedColumn } from './parsePrestashopCsv.js'
import { parsePrestashopFeaturesStrict } from './parsePrestashopFeatures.js'

/**
 * @typedef {Object} WatchImportRecord
 * @property {string} prestashopProductId
 * @property {string} adCode
 * @property {string} name
 * @property {string} brand
 * @property {string} model
 * @property {string} reference
 * @property {number} price
 * @property {number | null} [year]
 * @property {string | null} [condition]
 * @property {string | null} [description]
 * @property {boolean} isAvailable
 * @property {string} audience
 * @property {string[]} imageUrls
 * @property {Object} details
 * @property {Array<{ name: string, included: boolean }>} accessories
 */

/**
 * @param {Record<string, string>} row
 * @param {import('./loadMapping.js').ImportMapping} mapping
 * @param {{ imageUrls?: string[] }} [context]
 * @returns {{ record?: WatchImportRecord, error?: string }}
 */
export function transformPrestashopRow(row, mapping, context = {}) {
  const cols = mapping.csv.columns

  const prestashopProductId = getMappedColumn(row, cols, 'prestashopId').trim()
  const name = getMappedColumn(row, cols, 'name').trim()
  const brand = getMappedColumn(row, cols, 'brand').trim()
  const priceRaw = getMappedColumn(row, cols, 'price').replace(',', '.').trim()

  if (!name) {
    return { error: 'Nom produit manquant' }
  }

  const price = parseFloat(priceRaw)
  if (!Number.isFinite(price) || price <= 0) {
    return { error: `Prix invalide: "${priceRaw}"` }
  }

  const referenceCol = getMappedColumn(row, cols, 'reference').trim()
  const featuresRaw = getMappedColumn(row, cols, 'features')
  const features = parsePrestashopFeaturesStrict(featuresRaw)

  /** @type {WatchImportRecord} */
  const record = {
    prestashopProductId,
    adCode: buildAdCode(row, mapping, prestashopProductId, referenceCol),
    name,
    brand: brand || mapping.defaults?.brand || 'Inconnu',
    model: '',
    reference: referenceCol,
    price,
    year: null,
    condition: mapping.defaults?.condition ?? null,
    description: null,
    isAvailable: parseActive(getMappedColumn(row, cols, 'active'), getMappedColumn(row, cols, 'quantity')),
    audience: mapping.defaults?.audience ?? 'unisexe',
    imageUrls: [...(context.imageUrls ?? [])],
    details: {
      content: null,
      movement: null,
      caseMaterial: null,
      braceletMaterial: null,
      caseSize: null,
      thickness: null,
      dialColor: null,
      crystal: null,
      waterResistance: null,
      functions: null,
      powerReserve: null,
      frequency: null,
      caseCondition: null,
      dialCondition: null,
      braceletCondition: null,
      guarantee: mapping.defaults?.['details.guarantee'] ?? null,
    },
    accessories: [],
  }

  applyFeatureMapping(record, features, mapping)
  applyDefaults(record, mapping.defaults ?? {})

  const shortDesc = getMappedColumn(row, cols, 'shortDescription').trim()
  const longDesc = getMappedColumn(row, cols, 'description').trim()
  record.description = shortDesc || longDesc || null
  if (longDesc) {
    record.details.content = longDesc
  }

  const categories = getMappedColumn(row, cols, 'categories')
  record.audience = resolveAudience(categories, mapping.audienceFromCategory ?? {}, record.audience)

  const imageUrlsCol = getMappedColumn(row, cols, 'imageUrls').trim()
  if (imageUrlsCol) {
    const urls = imageUrlsCol.split(/[,|]/).map((u) => u.trim()).filter(Boolean)
    record.imageUrls.push(...urls)
  }

  record.imageUrls = [...new Set(record.imageUrls)]

  if (!record.model) {
    record.model = inferModelFromName(record.name, record.brand)
  }
  if (!record.reference) {
    record.reference = record.adCode
  }

  return { record }
}

/**
 * @param {WatchImportRecord} record
 * @param {Record<string, string>} features
 * @param {import('./loadMapping.js').ImportMapping} mapping
 */
function applyFeatureMapping(record, features, mapping) {
  const featureMap = mapping.features ?? {}
  const accessoryFeatures = mapping.accessoryFeatures ?? {}

  for (const [featureName, targetPath] of Object.entries(featureMap)) {
    const value = features[featureName]
    if (!value) continue
    setNestedValue(record, targetPath, value)
  }

  for (const [featureName, accessoryName] of Object.entries(accessoryFeatures)) {
    const value = features[featureName]
    if (!value) continue
    record.accessories.push({
      name: accessoryName,
      included: isTruthyFeatureValue(value),
    })
  }
}

/**
 * @param {WatchImportRecord} record
 * @param {Record<string, string>} defaults
 */
function applyDefaults(record, defaults) {
  for (const [path, value] of Object.entries(defaults)) {
    if (path === 'brand' || path === 'condition' || path === 'audience') continue
    const current = getNestedValue(record, path)
    if (current == null || current === '') {
      setNestedValue(record, path, value)
    }
  }
}

/**
 * @param {Record<string, string>} row
 * @param {import('./loadMapping.js').ImportMapping} mapping
 * @param {string} prestashopProductId
 * @param {string} referenceCol
 */
function buildAdCode(row, mapping, prestashopProductId, referenceCol) {
  const adConfig = mapping.adCode ?? { from: 'reference', fallback: 'prestashopId', prefix: '' }
  const cols = mapping.csv.columns
  let value = ''

  if (adConfig.from === 'reference') {
    value = referenceCol || getMappedColumn(row, cols, 'reference').trim()
  } else if (adConfig.from === 'prestashopId') {
    value = prestashopProductId
  }

  if (!value && adConfig.fallback === 'prestashopId') {
    value = prestashopProductId
  }

  if (!value) {
    value = prestashopProductId || `import-${Date.now()}`
  }

  const prefix = adConfig.prefix ?? ''
  return prefix && !value.startsWith(prefix) ? `${prefix}${value}` : value
}

/**
 * @param {string} activeRaw
 * @param {string} quantityRaw
 */
function parseActive(activeRaw, quantityRaw) {
  const active = activeRaw.trim().toLowerCase()
  if (active === '0' || active === 'non' || active === 'no') return false
  if (active === '1' || active === 'oui' || active === 'yes') return true

  const qty = parseInt(quantityRaw, 10)
  if (Number.isFinite(qty) && qty <= 0) return false

  return true
}

/**
 * @param {string} categories
 * @param {Record<string, string>} audienceMap
 * @param {string} fallback
 */
function resolveAudience(categories, audienceMap, fallback) {
  if (!categories?.trim()) return fallback
  const lower = categories.toLowerCase()
  for (const [keyword, slug] of Object.entries(audienceMap)) {
    if (lower.includes(keyword.toLowerCase())) {
      return slug
    }
  }
  return fallback
}

/**
 * @param {string} name
 * @param {string} brand
 */
function inferModelFromName(name, brand) {
  if (!brand) return name
  const escaped = brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const withoutBrand = name.replace(new RegExp(`^${escaped}\\s*[-–]?\\s*`, 'i'), '').trim()
  return withoutBrand || name
}

/**
 * @param {string} value
 */
function isTruthyFeatureValue(value) {
  const v = value.trim().toLowerCase()
  return v === '1' || v === 'oui' || v === 'yes' || v === 'true' || v === 'inclus' || v === 'included'
}

/**
 * @param {object} obj
 * @param {string} path
 */
function getNestedValue(obj, path) {
  const parts = path.split('.')
  let current = obj
  for (const part of parts) {
    if (current == null) return undefined
    current = current[part]
  }
  return current
}

/**
 * @param {object} obj
 * @param {string} path
 * @param {unknown} value
 */
function setNestedValue(obj, path, value) {
  const parts = path.split('.')
  let current = obj
  for (let i = 0; i < parts.length - 1; i += 1) {
    const part = parts[i]
    if (current[part] == null || typeof current[part] !== 'object') {
      current[part] = {}
    }
    current = current[part]
  }
  const last = parts[parts.length - 1]
  if (path === 'details.caseSize' || last === 'caseSize') {
    current[last] = normalizeCaseSizeValue(String(value))
  } else if (path === 'year') {
    const year = parseInt(String(value), 10)
    obj.year = Number.isFinite(year) ? year : null
  } else {
    current[last] = value
  }
}

/**
 * Transforme un WatchImportRecord en payloads DB (snake_case).
 * @param {WatchImportRecord} record
 * @param {number} displayOrder
 */
export function recordToDbPayloads(record, displayOrder) {
  const watch = {
    prestashop_product_id: record.prestashopProductId || null,
    ad_code: record.adCode,
    name: record.name,
    brand: record.brand,
    model: record.model,
    reference: record.reference,
    price: record.price,
    year: record.year ?? null,
    condition: record.condition ?? null,
    description: record.description ?? null,
    is_available: record.isAvailable,
    is_sold: false,
    audience: record.audience || 'unisexe',
    display_order: displayOrder,
  }

  const details = {
    content: record.details.content ?? null,
    movement: record.details.movement ?? null,
    case_material: record.details.caseMaterial ?? null,
    bracelet_material: record.details.braceletMaterial ?? null,
    case_size: record.details.caseSize ? normalizeCaseSizeValue(record.details.caseSize) : null,
    thickness: record.details.thickness ?? null,
    dial_color: record.details.dialColor ?? null,
    crystal: record.details.crystal ?? null,
    water_resistance: record.details.waterResistance ?? null,
    functions: record.details.functions ?? null,
    power_reserve: record.details.powerReserve ?? null,
    frequency: record.details.frequency ?? null,
    case_condition: record.details.caseCondition ?? null,
    dial_condition: record.details.dialCondition ?? null,
    bracelet_condition: record.details.braceletCondition ?? null,
    guarantee: record.details.guarantee ?? null,
  }

  const accessories = (record.accessories ?? []).map((acc) => ({
    name: acc.name,
    included: acc.included ?? false,
  }))

  return { watch, details, accessories }
}
