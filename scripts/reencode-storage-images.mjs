/**
 * Ré-encode les images déjà présentes dans Supabase Storage.
 *
 * Les photos ont été uploadées telles quelles (jusqu'à 12 Mo pièce) et sont
 * servies aux navigateurs sans redimensionnement : c'est le poste principal de
 * « cached egress » du projet. Ce script les repasse en WebP redimensionné, pose
 * un `cache-control` d'un an, met à jour les lignes correspondantes puis
 * supprime les originaux.
 *
 * Le nouvel objet est écrit AVANT la mise à jour de la ligne, et l'ancien n'est
 * supprimé qu'après : à aucun moment une ligne ne pointe vers un objet absent.
 *
 * Prérequis (.env à la racine du monorepo) :
 *   VITE_SUPABASE_URL=...
 *   SUPABASE_SERVICE_ROLE_KEY=...   (obligatoire pour --apply)
 *
 * Usage :
 *   node scripts/reencode-storage-images.mjs                    # aperçu (dry-run)
 *   node scripts/reencode-storage-images.mjs --apply            # écriture
 *   node scripts/reencode-storage-images.mjs --bucket=watch-images
 *   node scripts/reencode-storage-images.mjs --concurrency=2
 *   node scripts/reencode-storage-images.mjs --limit=5 --apply  # lot de test
 */
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { encodeImageForStorage } from './lib/encodeImageForStorage.js'
import {
  STORAGE_IMAGE_CACHE_CONTROL,
  UPLOAD_IMAGE_MIME,
  withWebpExtension,
} from '../packages/base/src/utils/imageEncoding.js'

const LOG_PREFIX = '[reencode-storage-images]'

/**
 * Tables portant les chemins d'objets à ré-encoder.
 * Même forme dans les deux cas : `image_path` fait foi, `image_url` est le miroir public.
 */
const TARGETS = [
  { bucket: 'watch-images', table: 'watch_images' },
  { bucket: 'home-carousel', table: 'home_carousel_slides' },
]

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dirname, '../.env') })

const apply = process.argv.includes('--apply')
const bucketFilter = readArg('--bucket')
const concurrency = Number(readArg('--concurrency') ?? 3)
const limit = readArg('--limit') ? Number(readArg('--limit')) : null

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
// Le dry-run ne fait que lire : la clé anon suffit à estimer le gain.
const readOnlyKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
const supabaseKey = apply ? serviceRoleKey : (serviceRoleKey ?? readOnlyKey)

if (!supabaseUrl || !supabaseKey) {
  console.error(
    `${LOG_PREFIX} Définir VITE_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans .env` +
      (apply ? '' : ' (ou VITE_SUPABASE_ANON_KEY pour un simple aperçu)'),
  )
  process.exit(1)
}

if (apply && !serviceRoleKey) {
  console.error(
    `${LOG_PREFIX} --apply exige SUPABASE_SERVICE_ROLE_KEY : la clé anon ne peut ni écrire dans le Storage ni modifier les tables.`,
  )
  process.exit(1)
}

if (!Number.isInteger(concurrency) || concurrency < 1) {
  console.error(`${LOG_PREFIX} --concurrency doit être un entier positif`)
  process.exit(1)
}

if (limit !== null && (!Number.isInteger(limit) || limit < 1)) {
  console.error(`${LOG_PREFIX} --limit doit être un entier positif`)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
})

/**
 * @param {string} name
 * @returns {string | undefined}
 */
function readArg(name) {
  const found = process.argv.find((arg) => arg.startsWith(`${name}=`))
  return found?.slice(name.length + 1)
}

/**
 * @param {number} bytes
 * @returns {string}
 */
function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return '?'
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(2)} Mo`
}

/**
 * @param {{ table: string }} target
 * @returns {Promise<Array<{ id: string, image_path: string, image_url: string | null }>>}
 */
async function loadRows({ table }) {
  const { data, error } = await supabase
    .from(table)
    .select('id, image_path, image_url')
    .not('image_path', 'is', null)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`lecture de ${table} impossible : ${error.message}`)
  }

  const rows = (data ?? []).filter((row) => {
    const path = String(row.image_path ?? '').trim()
    // Supabase crée un objet fantôme pour matérialiser un dossier vide.
    return path && !path.endsWith('.emptyFolderPlaceholder')
  })

  return limit ? rows.slice(0, limit) : rows
}

/**
 * @param {{ bucket: string, table: string }} target
 * @param {{ id: string, image_path: string }} row
 */
async function processRow({ bucket, table }, row) {
  const sourcePath = row.image_path

  const { data: blob, error: downloadError } = await supabase.storage
    .from(bucket)
    .download(sourcePath)

  if (downloadError || !blob) {
    throw new Error(`téléchargement impossible : ${downloadError?.message ?? 'objet absent'}`)
  }

  const input = Buffer.from(await blob.arrayBuffer())
  const output = await encodeImageForStorage(input)

  // Une image déjà légère ne gagne rien à être réécrite : la remplacer casserait
  // son URL (et donc les caches) pour rien.
  if (output.buffer.length >= input.length) {
    return {
      skipped: true,
      sourcePath,
      beforeBytes: input.length,
      afterBytes: output.buffer.length,
    }
  }

  const targetPath = withWebpExtension(sourcePath)

  const result = {
    skipped: false,
    sourcePath,
    targetPath,
    beforeBytes: input.length,
    afterBytes: output.buffer.length,
    dimensions: `${output.sourceWidth}×${output.sourceHeight} → ${output.width}×${output.height}`,
  }

  if (!apply) return result

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(targetPath, output.buffer, {
      cacheControl: STORAGE_IMAGE_CACHE_CONTROL,
      contentType: UPLOAD_IMAGE_MIME,
      // Rejouer le script après une interruption doit pouvoir réécrire un objet
      // déjà converti mais dont la ligne n'avait pas été mise à jour.
      upsert: true,
    })

  if (uploadError) {
    throw new Error(`upload de ${targetPath} impossible : ${uploadError.message}`)
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(targetPath)

  const { error: updateError } = await supabase
    .from(table)
    .update({ image_path: targetPath, image_url: publicUrl })
    .eq('id', row.id)

  if (updateError) {
    // La ligne pointe toujours vers l'original : on retire le nouvel objet pour
    // ne pas laisser d'orphelin derrière nous.
    if (targetPath !== sourcePath) {
      await supabase.storage.from(bucket).remove([targetPath])
    }
    throw new Error(`mise à jour de ${table} impossible : ${updateError.message}`)
  }

  if (targetPath !== sourcePath) {
    const { error: removeError } = await supabase.storage.from(bucket).remove([sourcePath])
    if (removeError) {
      // Non bloquant : la ligne est à jour, il reste juste un original à nettoyer.
      console.warn(`${LOG_PREFIX} original conservé (${sourcePath}) : ${removeError.message}`)
    }
  }

  return result
}

/**
 * @template T
 * @param {T[]} items
 * @param {number} workerCount
 * @param {(item: T) => Promise<void>} fn
 */
async function runWithConcurrency(items, workerCount, fn) {
  let index = 0

  async function worker() {
    while (index < items.length) {
      const current = index
      index += 1
      await fn(items[current])
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(workerCount, items.length) }, () => worker()),
  )
}

const targets = bucketFilter
  ? TARGETS.filter((target) => target.bucket === bucketFilter)
  : TARGETS

if (targets.length === 0) {
  console.error(
    `${LOG_PREFIX} bucket inconnu : ${bucketFilter} (attendu : ${TARGETS.map((t) => t.bucket).join(', ')})`,
  )
  process.exit(1)
}

console.log(`${LOG_PREFIX} mode ${apply ? 'ÉCRITURE (--apply)' : 'aperçu (dry-run)'}`)

let totalBefore = 0
let totalAfter = 0
let converted = 0
let skipped = 0
/** @type {string[]} */
const failures = []

for (const target of targets) {
  const rows = await loadRows(target)
  console.log(`\n${LOG_PREFIX} ${target.bucket} : ${rows.length} image(s) référencée(s)`)

  await runWithConcurrency(rows, concurrency, async (row) => {
    try {
      const result = await processRow(target, row)

      totalBefore += result.beforeBytes
      totalAfter += result.skipped ? result.beforeBytes : result.afterBytes

      if (result.skipped) {
        skipped += 1
        console.log(`  = ${result.sourcePath} (${formatBytes(result.beforeBytes)}, déjà optimale)`)
        return
      }

      converted += 1
      const gain = Math.round((1 - result.afterBytes / result.beforeBytes) * 100)
      console.log(
        `  ${apply ? '✓' : '·'} ${result.sourcePath}` +
          ` ${formatBytes(result.beforeBytes)} → ${formatBytes(result.afterBytes)}` +
          ` (-${gain} %, ${result.dimensions})`,
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      failures.push(`${target.bucket}/${row.image_path} : ${message}`)
      console.error(`  ✗ ${row.image_path} : ${message}`)
    }
  })
}

console.log(`\n${LOG_PREFIX} ${converted} image(s) ré-encodée(s), ${skipped} inchangée(s)`)
console.log(
  `${LOG_PREFIX} ${formatBytes(totalBefore)} → ${formatBytes(totalAfter)}` +
    (totalBefore > 0
      ? ` (-${Math.round((1 - totalAfter / totalBefore) * 100)} % d'egress par page vue)`
      : ''),
)

if (failures.length > 0) {
  console.error(`${LOG_PREFIX} ${failures.length} échec(s) :`)
  for (const failure of failures) console.error(`  - ${failure}`)
}

if (!apply) {
  console.log(`\n${LOG_PREFIX} aperçu uniquement — relancer avec --apply pour écrire.`)
}

process.exit(failures.length > 0 ? 1 : 0)
