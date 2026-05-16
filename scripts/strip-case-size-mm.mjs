/**
 * Retire l'unité « mm » des valeurs `watch_details.case_size` en base.
 *
 * Prérequis (.env à la racine du monorepo) :
 *   VITE_SUPABASE_URL=...
 *   SUPABASE_SERVICE_ROLE_KEY=...
 *
 * Usage :
 *   node scripts/strip-case-size-mm.mjs          # aperçu (dry-run)
 *   node scripts/strip-case-size-mm.mjs --apply  # écriture en base
 */
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

import { normalizeCaseSizeValue } from '../packages/base/src/utils/caseSize.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dirname, '../.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    '[strip-case-size-mm] Définir VITE_SUPABASE_URL (ou SUPABASE_URL) et SUPABASE_SERVICE_ROLE_KEY dans .env',
  )
  process.exit(1)
}

const apply = process.argv.includes('--apply')
const supabase = createClient(supabaseUrl, serviceRoleKey)

const { data: rows, error } = await supabase
  .from('watch_details')
  .select('watch_id, case_size')
  .not('case_size', 'is', null)

if (error) {
  console.error('[strip-case-size-mm] Lecture impossible:', error.message)
  process.exit(1)
}

/** @type {Array<{ watch_id: string, before: string, after: string }>} */
const toUpdate = []

for (const row of rows ?? []) {
  const before = String(row.case_size ?? '').trim()
  if (!before) continue
  const after = normalizeCaseSizeValue(before)
  if (after !== before) {
    toUpdate.push({ watch_id: row.watch_id, before, after })
  }
}

console.log(`[strip-case-size-mm] ${rows?.length ?? 0} ligne(s) avec case_size renseigné`)
console.log(`[strip-case-size-mm] ${toUpdate.length} ligne(s) à normaliser`)

if (toUpdate.length > 0) {
  const preview = toUpdate.slice(0, 15)
  for (const { watch_id, before, after } of preview) {
    console.log(`  • ${watch_id}: "${before}" → "${after}"`)
  }
  if (toUpdate.length > preview.length) {
    console.log(`  … et ${toUpdate.length - preview.length} autre(s)`)
  }
}

if (!apply) {
  if (toUpdate.length > 0) {
    console.log('\n[strip-case-size-mm] Mode aperçu. Relancer avec --apply pour écrire en base.')
  }
  process.exit(0)
}

let updated = 0
let failed = 0

for (const { watch_id, after } of toUpdate) {
  const { error: updateError } = await supabase
    .from('watch_details')
    .update({ case_size: after || null })
    .eq('watch_id', watch_id)

  if (updateError) {
    failed += 1
    console.error(`  ✗ ${watch_id}: ${updateError.message}`)
  } else {
    updated += 1
  }
}

console.log(`\n[strip-case-size-mm] Terminé : ${updated} mis à jour, ${failed} erreur(s).`)
process.exit(failed > 0 ? 1 : 0)
