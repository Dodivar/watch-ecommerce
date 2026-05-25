/**
 * Parse un fichier CSV PrestaShop (séparateur ;, UTF-8, guillemets, BOM).
 * @param {string} content
 * @param {{ delimiter?: string }} [options]
 * @returns {{ headers: string[], rows: Record<string, string>[] }}
 */
export function parsePrestashopCsv(content, options = {}) {
  const delimiter = options.delimiter ?? ';'
  const text = content.replace(/^\uFEFF/, '')
  const records = parseCsvRecords(text, delimiter)

  if (records.length === 0) {
    return { headers: [], rows: [] }
  }

  const headers = records[0].map((h) => h.trim())
  const rows = records.slice(1).map((cells) => {
    /** @type {Record<string, string>} */
    const row = {}
    for (let i = 0; i < headers.length; i += 1) {
      row[headers[i]] = (cells[i] ?? '').trim()
    }
    return row
  })

  return { headers, rows }
}

/**
 * @param {string} text
 * @param {string} delimiter
 * @returns {string[][]}
 */
function parseCsvRecords(text, delimiter) {
  /** @type {string[][]} */
  const records = []
  /** @type {string[]} */
  let current = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    const next = text[i + 1]

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"'
        i += 1
      } else if (char === '"') {
        inQuotes = false
      } else {
        field += char
      }
      continue
    }

    if (char === '"') {
      inQuotes = true
      continue
    }

    if (char === delimiter) {
      current.push(field)
      field = ''
      continue
    }

    if (char === '\n' || (char === '\r' && next === '\n')) {
      current.push(field)
      field = ''
      if (current.some((c) => c.length > 0)) {
        records.push(current)
      }
      current = []
      if (char === '\r') i += 1
      continue
    }

    if (char === '\r') {
      current.push(field)
      field = ''
      if (current.some((c) => c.length > 0)) {
        records.push(current)
      }
      current = []
      continue
    }

    field += char
  }

  current.push(field)
  if (current.some((c) => c.length > 0)) {
    records.push(current)
  }

  return records
}

/**
 * Lit une valeur de colonne selon le mapping (nom logique → en-tête CSV).
 * @param {Record<string, string>} row
 * @param {Record<string, string>} columns
 * @param {string} key
 * @returns {string}
 */
export function getMappedColumn(row, columns, key) {
  const header = columns[key]
  if (!header) return ''
  return row[header] ?? ''
}
