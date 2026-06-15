/**
 * Spike — mesure la couverture de normalisation des specs techniques
 * sur un export CSV PrestaShop (avant écriture Supabase).
 *
 * Usage :
 *   node scripts/prestashop-import/spike-normalization-report.mjs \
 *     --csv ./exports/products.csv \
 *     --mapping sites/place-des-montres/prestashop-import.mapping.json
 *
 *   node scripts/prestashop-import/spike-normalization-report.mjs \
 *     --csv tests/fixtures/prestashop/products-sample.csv \
 *     --mapping sites/place-des-montres/prestashop-import.mapping.json \
 *     --report ./reports/prestashop-spike.json
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { loadMapping } from './loadMapping.js'
import { parsePrestashopCsv } from './parsePrestashopCsv.js'
import { parsePrestashopFeaturesStrict } from './parsePrestashopFeatures.js'
import { transformPrestashopRow } from './transformPrestashopRow.js'
import {
  normalizeCaseSizeMm,
  normalizeConditionSlug,
  normalizeFunctionSlugs,
  normalizeMovementType,
  parseWaterResistanceM,
} from './normalizeWatchSpecs.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const FIELD_SPECS = [
  {
    id: 'movement',
    featureKeys: ['Mouvement'],
    recordPaths: ['details.movement'],
    normalize: normalizeMovementType,
  },
  {
    id: 'waterResistance',
    featureKeys: ['Étanchéité', 'Etanchéité', 'Etancheite'],
    recordPaths: ['details.waterResistance'],
    normalize: parseWaterResistanceM,
  },
  {
    id: 'caseSize',
    featureKeys: ['Diamètre', 'Diametre'],
    recordPaths: ['details.caseSize'],
    normalize: normalizeCaseSizeMm,
  },
  {
    id: 'functions',
    featureKeys: ['Fonctions', 'Fonction'],
    recordPaths: ['details.functions'],
    normalize: normalizeFunctionSlugs,
  },
  {
    id: 'condition',
    featureKeys: ['État', 'Etat', 'Condition'],
    recordPaths: ['condition'],
    defaultPath: 'condition',
    normalize: normalizeConditionSlug,
  },
]

function parseArgs(argv) {
  /** @type {Record<string, string | number | boolean>} */
  const out = { limit: 0 }
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--csv') out.csv = argv[++i]
    else if (arg === '--mapping') out.mapping = argv[++i]
    else if (arg === '--report') out.report = argv[++i]
    else if (arg === '--limit') out.limit = Number(argv[++i]) || 0
    else if (arg === '--top') out.top = Number(argv[++i]) || 15
  }
  return out
}

/**
 * @param {Record<string, string>} features
 * @param {string[]} keys
 */
function pickFeatureValue(features, keys) {
  for (const key of keys) {
    const value = features[key]
    if (value && String(value).trim()) return String(value).trim()
  }
  return null
}

/**
 * @param {import('./transformPrestashopRow.js').WatchImportRecord} record
 * @param {string} path
 */
function getRecordPath(record, path) {
  const parts = path.split('.')
  let current = /** @type {unknown} */ (record)
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return null
    current = /** @type {Record<string, unknown>} */ (current)[part]
  }
  if (current == null || current === '') return null
  return String(current).trim()
}

/**
 * @param {string[]} values
 * @param {number} topN
 */
function topCounts(values, topN) {
  /** @type {Map<string, number>} */
  const counts = new Map()
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1)
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([value, count]) => ({ value, count }))
}

function printFieldReport(fieldReport) {
  console.log(`\n— ${fieldReport.label}`)
  console.log(`  Rempli (CSV feature)     : ${fieldReport.filledFromFeature} / ${fieldReport.totalValid} (${pct(fieldReport.filledFromFeature, fieldReport.totalValid)})`)
  console.log(`  Rempli (après transform) : ${fieldReport.filledEffective} / ${fieldReport.totalValid} (${pct(fieldReport.filledEffective, fieldReport.totalValid)})`)
  console.log(`  Normalisable             : ${fieldReport.normalized} / ${fieldReport.filledEffective} (${pct(fieldReport.normalized, fieldReport.filledEffective)})`)
  if (fieldReport.partial) {
    console.log(`  Partiel (tokens inconnus): ${fieldReport.partial}`)
  }

  if (fieldReport.topUnmapped.length > 0) {
    console.log('  Top valeurs non mappées :')
    for (const row of fieldReport.topUnmapped) {
      console.log(`    • ${row.count}× "${row.value}"`)
    }
  }

  if (fieldReport.topMapped.length > 0) {
    console.log('  Top valeurs normalisées :')
    for (const row of fieldReport.topMapped) {
      console.log(`    • ${row.count}× ${row.value}`)
    }
  }
}

function pct(n, d) {
  if (!d) return '—'
  return `${((n / d) * 100).toFixed(1)}%`
}

function formatNormalizedValue(result) {
  if (Array.isArray(result.value)) return result.value.join(', ')
  return String(result.value)
}

const args = parseArgs(process.argv.slice(2))
const topN = typeof args.top === 'number' ? args.top : 15

if (!args.csv || !args.mapping) {
  console.error(
    'Usage: node scripts/prestashop-import/spike-normalization-report.mjs --csv <file> --mapping <json> [--report out.json] [--limit N]',
  )
  process.exit(1)
}

const mapping = loadMapping(resolve(args.mapping))
const csvContent = readFileSync(resolve(args.csv), 'utf8')
const { rows } = parsePrestashopCsv(csvContent, { delimiter: mapping.csv.delimiter ?? ';' })
const limitedRows = args.limit > 0 ? rows.slice(0, args.limit) : rows

const featuresCol = mapping.csv.columns.features ?? 'Feature (Name:Value:Position:Customized)'

/** @type {import('./transformPrestashopRow.js').WatchImportRecord[]} */
const records = []
let transformErrors = 0

for (const row of limitedRows) {
  const { record, error } = transformPrestashopRow(row, mapping)
  if (error || !record) {
    transformErrors += 1
    continue
  }
  records.push(record)
}

/** @type {Record<string, {
 *   label: string,
 *   totalValid: number,
 *   filledFromFeature: number,
 *   filledEffective: number,
 *   normalized: number,
 *   partial: number,
 *   unmappedValues: string[],
 *   mappedValues: string[],
 * }>} */
const stats = {}

for (const spec of FIELD_SPECS) {
  stats[spec.id] = {
    label: spec.id,
    totalValid: records.length,
    filledFromFeature: 0,
    filledEffective: 0,
    normalized: 0,
    partial: 0,
    unmappedValues: [],
    mappedValues: [],
  }
}

for (let i = 0; i < limitedRows.length; i += 1) {
  const row = limitedRows[i]
  const record = records[i]
  if (!record) continue

  const features = parsePrestashopFeaturesStrict(row[featuresCol] ?? '')

  for (const spec of FIELD_SPECS) {
    const bucket = stats[spec.id]
    const fromFeature = pickFeatureValue(features, spec.featureKeys)
    if (fromFeature) bucket.filledFromFeature += 1

    let effective = fromFeature
    if (!effective) {
      for (const path of spec.recordPaths) {
        effective = getRecordPath(record, path)
        if (effective) break
      }
    }
    if (!effective && spec.defaultPath) {
      effective = getRecordPath(record, spec.defaultPath)
    }

    if (!effective) continue
    bucket.filledEffective += 1

    const result = spec.normalize(effective)
    if (result.ok) {
      bucket.normalized += 1
      bucket.mappedValues.push(formatNormalizedValue(result))
      if (result.reason === 'partial') bucket.partial += 1
    } else {
      bucket.unmappedValues.push(result.raw || effective)
    }
  }
}

/** @type {Record<string, unknown>} */
const report = {
  generatedAt: new Date().toISOString(),
  csv: resolve(args.csv),
  mapping: resolve(args.mapping),
  rowsTotal: limitedRows.length,
  rowsValid: records.length,
  transformErrors,
  fields: {},
}

console.log('[prestashop-spike] Rapport de normalisation')
console.log(`  CSV          : ${resolve(args.csv)}`)
console.log(`  Mapping      : ${resolve(args.mapping)}`)
console.log(`  Lignes       : ${limitedRows.length} (${records.length} valides, ${transformErrors} rejetées)`)

for (const spec of FIELD_SPECS) {
  const bucket = stats[spec.id]
  const fieldReport = {
    label: spec.id,
    totalValid: bucket.totalValid,
    filledFromFeature: bucket.filledFromFeature,
    filledEffective: bucket.filledEffective,
    normalized: bucket.normalized,
    partial: bucket.partial,
    fillFromFeatureRate: rate(bucket.filledFromFeature, bucket.totalValid),
    fillEffectiveRate: rate(bucket.filledEffective, bucket.totalValid),
    normalizeRate: rate(bucket.normalized, bucket.filledEffective),
    topUnmapped: topCounts(bucket.unmappedValues, topN),
    topMapped: topCounts(bucket.mappedValues, topN),
  }

  report.fields[spec.id] = fieldReport
  printFieldReport(fieldReport)
}

const overallFilled = Object.values(report.fields).reduce((sum, f) => sum + f.filledEffective, 0)
const overallNormalized = Object.values(report.fields).reduce((sum, f) => sum + f.normalized, 0)
const fieldCount = FIELD_SPECS.length

console.log('\n— Synthèse')
console.log(`  Champs suivis           : ${fieldCount}`)
console.log(`  Remplissage moyen       : ${pct(overallFilled, records.length * fieldCount)}`)
console.log(`  Normalisation moyenne   : ${pct(overallNormalized, overallFilled)}`)

if (args.report) {
  const outPath = resolve(args.report)
  mkdirSync(dirname(outPath), { recursive: true })
  writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8')
  console.log(`\n[prestashop-spike] Rapport JSON : ${outPath}`)
}

function rate(n, d) {
  if (!d) return null
  return Math.round((n / d) * 1000) / 1000
}
