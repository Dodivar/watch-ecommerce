/**
 * Point d'entrée CLI — import catalogue PrestaShop vers Supabase.
 *
 * Prérequis (.env à la racine) :
 *   VITE_SUPABASE_URL=...
 *   SUPABASE_SERVICE_ROLE_KEY=...
 *
 * Usage :
 *   node scripts/prestashop-import/import-prestashop-catalog.mjs \
 *     --csv ./exports/products.csv \
 *     --mapping sites/place-des-montres/prestashop-import.mapping.json \
 *     [--images-csv ./exports/images.csv] \
 *     [--apply] [--limit 10] [--skip-images]
 */
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { importWatchImages } from './importWatchImages.js'
import { loadMapping } from './loadMapping.js'
import { loadWatchBatch } from './loadWatchBatch.js'
import { parseImagesCsv } from './parseImagesCsv.js'
import { parsePrestashopCsv } from './parsePrestashopCsv.js'
import { ImportReport } from './report.js'
import { transformPrestashopRow } from './transformPrestashopRow.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dirname, '../../.env') })

const args = parseArgs(process.argv.slice(2))

if (!args.csv || !args.mapping) {
  printUsage()
  process.exit(1)
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (args.apply && (!supabaseUrl || !serviceRoleKey)) {
  console.error(
    '[prestashop-import] Mode --apply : définir VITE_SUPABASE_URL (ou SUPABASE_URL) et SUPABASE_SERVICE_ROLE_KEY dans .env',
  )
  process.exit(1)
}

/** @type {import('@supabase/supabase-js').SupabaseClient | null} */
const supabase = args.apply ? createClient(supabaseUrl, serviceRoleKey) : null

const mapping = loadMapping(resolve(args.mapping))
const csvContent = readFileSync(resolve(args.csv), 'utf8')
const { headers, rows } = parsePrestashopCsv(csvContent, { delimiter: mapping.csv.delimiter ?? ';' })

console.log(`[prestashop-import] CSV : ${rows.length} ligne(s), ${headers.length} colonne(s)`)
console.log(`[prestashop-import] Mode : ${args.apply ? 'ÉCRITURE (--apply)' : 'aperçu (dry-run)'}`)

/** @type {Map<string, Array<{ url: string, position: number }>>} */
let imagesByProductId = new Map()

if (args.imagesCsv) {
  const imagesContent = readFileSync(resolve(args.imagesCsv), 'utf8')
  imagesByProductId = parseImagesCsv(imagesContent, { delimiter: mapping.csv.delimiter ?? ';' })
  console.log(`[prestashop-import] Images CSV : ${imagesByProductId.size} produit(s) avec images`)
}

/** @type {import('./transformPrestashopRow.js').WatchImportRecord[]} */
const records = []
let transformErrors = 0

const limitedRows = args.limit > 0 ? rows.slice(0, args.limit) : rows

for (const row of limitedRows) {
  const prestashopId = row[mapping.csv.columns.prestashopId ?? 'ID'] ?? ''
  const imageEntries = imagesByProductId.get(String(prestashopId).trim()) ?? []
  const imageUrls = imageEntries.map((e) => e.url)

  const { record, error } = transformPrestashopRow(row, mapping, { imageUrls })

  if (error || !record) {
    transformErrors += 1
    console.warn(`[prestashop-import] Ligne ignorée (${prestashopId || '?'}): ${error}`)
    continue
  }

  records.push(record)
}

console.log(`[prestashop-import] ${records.length} montre(s) transformée(s), ${transformErrors} rejet(s)`)

const report = new ImportReport()

await loadWatchBatch(supabase, records, report, {
  apply: args.apply,
  onConflict: args.onConflict,
  skipImages: args.skipImages,
  imageConcurrency: args.imageConcurrency,
  importImages: async (watchId, urls, replaceExisting) => {
    if (!supabase) return { imported: 0, failed: 0, errors: [] }
    return importWatchImages(supabase, watchId, urls, {
      concurrency: args.imageConcurrency,
      replaceExisting,
    })
  },
})

report.printConsole(args.report ? resolve(args.report) : undefined)

const summary = report.summary()
process.exit(summary.error > 0 ? 1 : 0)

/**
 * @param {string[]} argv
 */
function parseArgs(argv) {
  /** @type {Record<string, string | boolean | number>} */
  const result = {
    apply: false,
    skipImages: false,
    limit: 0,
    batchSize: 50,
    onConflict: 'update',
    imageConcurrency: 3,
  }

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    switch (arg) {
      case '--csv':
        result.csv = argv[++i]
        break
      case '--mapping':
        result.mapping = argv[++i]
        break
      case '--images-csv':
        result.imagesCsv = argv[++i]
        break
      case '--report':
        result.report = argv[++i]
        break
      case '--limit':
        result.limit = parseInt(argv[++i], 10) || 0
        break
      case '--batch-size':
        result.batchSize = parseInt(argv[++i], 10) || 50
        break
      case '--on-conflict':
        result.onConflict = argv[++i] === 'skip' ? 'skip' : 'update'
        break
      case '--image-concurrency':
        result.imageConcurrency = parseInt(argv[++i], 10) || 3
        break
      case '--prestashop-base-url':
        result.prestashopBaseUrl = argv[++i]
        break
      case '--apply':
        result.apply = true
        break
      case '--skip-images':
        result.skipImages = true
        break
      default:
        break
    }
  }

  return result
}

function printUsage() {
  console.log(`Usage:
  node scripts/prestashop-import/import-prestashop-catalog.mjs \\
    --csv <products.csv> \\
    --mapping <mapping.json> \\
    [--images-csv <images.csv>] \\
    [--apply] [--limit N] [--skip-images] \\
    [--on-conflict update|skip] [--report report.json]`)
}
