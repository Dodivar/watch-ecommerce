import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * @typedef {Object} ImportMapping
 * @property {{ delimiter?: string, columns: Record<string, string> }} csv
 * @property {Record<string, string>} [features]
 * @property {Record<string, string>} [accessoryFeatures]
 * @property {Record<string, string>} [audienceFromCategory]
 * @property {Record<string, string>} [defaults]
 * @property {{ from?: string, fallback?: string, prefix?: string }} [adCode]
 */

/**
 * @param {string} mappingPath
 * @returns {ImportMapping}
 */
export function loadMapping(mappingPath) {
  const absolute = resolve(mappingPath)
  const raw = readFileSync(absolute, 'utf8')
  /** @type {ImportMapping} */
  const mapping = JSON.parse(raw)

  if (!mapping.csv?.columns) {
    throw new Error(`Mapping invalide (${absolute}) : csv.columns requis`)
  }

  return mapping
}
