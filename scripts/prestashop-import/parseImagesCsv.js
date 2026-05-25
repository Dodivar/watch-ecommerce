import { parsePrestashopCsv } from './parsePrestashopCsv.js'

/**
 * Parse un CSV images : id_product;image_url;position
 * En-têtes flexibles (ID, id_product, Image URL, position, etc.)
 *
 * @param {string} content
 * @param {{ delimiter?: string }} [options]
 * @returns {Map<string, Array<{ url: string, position: number }>>}
 */
export function parseImagesCsv(content, options = {}) {
  const { headers, rows } = parsePrestashopCsv(content, options)
  /** @type {Map<string, Array<{ url: string, position: number }>>} */
  const byProductId = new Map()

  const idHeader = findHeader(headers, ['id_product', 'id product', 'id', 'product id'])
  const urlHeader = findHeader(headers, ['image_url', 'image url', 'url', 'image'])
  const positionHeader = findHeader(headers, ['position', 'image_order', 'order'])

  if (!idHeader || !urlHeader) {
    return byProductId
  }

  for (const row of rows) {
    const productId = (row[idHeader] ?? '').trim()
    const url = (row[urlHeader] ?? '').trim()
    if (!productId || !url) continue

    const positionRaw = positionHeader ? row[positionHeader] : ''
    const position = parseInt(String(positionRaw || '1'), 10) || 1

    if (!byProductId.has(productId)) {
      byProductId.set(productId, [])
    }
    byProductId.get(productId).push({ url, position })
  }

  for (const images of byProductId.values()) {
    images.sort((a, b) => a.position - b.position)
  }

  return byProductId
}

/**
 * @param {string[]} headers
 * @param {string[]} candidates
 * @returns {string | undefined}
 */
function findHeader(headers, candidates) {
  const normalized = headers.map((h) => h.toLowerCase().trim())
  for (const candidate of candidates) {
    const idx = normalized.indexOf(candidate.toLowerCase())
    if (idx >= 0) return headers[idx]
  }
  return undefined
}
