import { recordToDbPayloads } from './transformPrestashopRow.js'

/**
 * @typedef {import('./transformPrestashopRow.js').WatchImportRecord} WatchImportRecord
 * @typedef {import('./report.js').ImportReport} ImportReport
 */

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @returns {Promise<number>}
 */
export async function getMaxDisplayOrder(supabase) {
  const { data } = await supabase
    .from('watches')
    .select('display_order')
    .order('display_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  return data?.display_order ?? 0
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} prestashopProductId
 */
export async function findWatchByPrestashopId(supabase, prestashopProductId) {
  if (!prestashopProductId) return null

  const { data, error } = await supabase
    .from('watches')
    .select('id, ad_code, prestashop_product_id')
    .eq('prestashop_product_id', prestashopProductId)
    .maybeSingle()

  if (error && !isMissingColumnError(error)) {
    throw new Error(error.message)
  }

  return data ?? null
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} adCode
 */
export async function findWatchByAdCode(supabase, adCode) {
  const { data } = await supabase
    .from('watches')
    .select('id, ad_code, prestashop_product_id')
    .eq('ad_code', adCode)
    .maybeSingle()

  return data ?? null
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @returns {Promise<boolean>}
 */
export async function hasPrestashopProductIdColumn(supabase) {
  const { error } = await supabase.from('watches').select('prestashop_product_id').limit(1)
  return !error || !isMissingColumnError(error)
}

/**
 * @param {{ message?: string }} error
 */
function isMissingColumnError(error) {
  const msg = error.message?.toLowerCase() ?? ''
  return msg.includes('prestashop_product_id') && (msg.includes('column') || msg.includes('does not exist'))
}

/**
 * Charge une montre (insert ou update) + détails + accessoires.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {WatchImportRecord} record
 * @param {{ displayOrder: number, onConflict: 'update' | 'skip', usePrestashopId: boolean }} options
 * @returns {Promise<{ action: 'created' | 'updated' | 'skipped', watchId: string }>}
 */
export async function loadWatchRecord(supabase, record, options) {
  let existing = null

  if (options.usePrestashopId && record.prestashopProductId) {
    existing = await findWatchByPrestashopId(supabase, record.prestashopProductId)
  }

  if (!existing) {
    existing = await findWatchByAdCode(supabase, record.adCode)
  }

  if (existing && options.onConflict === 'skip') {
    return { action: 'skipped', watchId: existing.id }
  }

  const { watch, details, accessories } = recordToDbPayloads(record, options.displayOrder)

  if (existing) {
    const watchId = existing.id
    const { display_order: _drop, ...updatePayload } = watch

    const { error: updateError } = await supabase.from('watches').update(updatePayload).eq('id', watchId)
    if (updateError) {
      throw new Error(`Mise à jour montre: ${updateError.message}`)
    }

    await upsertDetails(supabase, watchId, details)
    await replaceAccessories(supabase, watchId, accessories)

    return { action: 'updated', watchId }
  }

  const { data: inserted, error: insertError } = await supabase
    .from('watches')
    .insert(watch)
    .select('id')
    .single()

  if (insertError) {
    throw new Error(`Insertion montre: ${insertError.message}`)
  }

  const watchId = inserted.id
  await upsertDetails(supabase, watchId, details)
  await replaceAccessories(supabase, watchId, accessories)

  return { action: 'created', watchId }
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} watchId
 * @param {Record<string, unknown>} details
 */
async function upsertDetails(supabase, watchId, details) {
  const payload = { ...details, watch_id: watchId }
  const { error } = await supabase.from('watch_details').upsert(payload, { onConflict: 'watch_id' })
  if (error) {
    const { error: insertError } = await supabase.from('watch_details').insert(payload)
    if (insertError) {
      throw new Error(`Détails: ${insertError.message}`)
    }
  }
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} watchId
 * @param {Array<{ name: string, included: boolean }>} accessories
 */
async function replaceAccessories(supabase, watchId, accessories) {
  await supabase.from('watch_accessories').delete().eq('watch_id', watchId)

  if (!accessories.length) return

  const rows = accessories.map((acc) => ({
    watch_id: watchId,
    name: acc.name,
    included: acc.included,
  }))

  const { error } = await supabase.from('watch_accessories').insert(rows)
  if (error) {
    throw new Error(`Accessoires: ${error.message}`)
  }
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {WatchImportRecord[]} records
 * @param {ImportReport} report
 * @param {{
 *   apply: boolean,
 *   onConflict: 'update' | 'skip',
 *   skipImages: boolean,
 *   imageConcurrency: number,
 *   importImages: (watchId: string, urls: string[], replace: boolean) => Promise<{ imported: number, failed: number, errors: string[] }>,
 * }} options
 */
export async function loadWatchBatch(supabase, records, report, options) {
  let displayOrder = options.apply && supabase ? await getMaxDisplayOrder(supabase) : 0
  const usePrestashopId =
    options.apply && supabase ? await hasPrestashopProductIdColumn(supabase) : false

  if (options.apply && supabase && !usePrestashopId && records.some((r) => r.prestashopProductId)) {
    console.warn(
      '[prestashop-import] Colonne watches.prestashop_product_id absente — déduplication par ad_code uniquement.',
    )
    console.warn('[prestashop-import] Appliquer scripts/prestashop-import/prestashop_product_id.sql.example')
  }

  for (const record of records) {
    displayOrder += 1

    if (!options.apply) {
      report.add({
        prestashopProductId: record.prestashopProductId,
        adCode: record.adCode,
        name: record.name,
        status: 'created',
        message: `[dry-run] ${record.imageUrls.length} image(s)`,
      })
      continue
    }

    try {
      const { action, watchId } = await loadWatchRecord(supabase, record, {
        displayOrder,
        onConflict: options.onConflict,
        usePrestashopId,
      })

      if (action === 'skipped') {
        report.add({
          prestashopProductId: record.prestashopProductId,
          adCode: record.adCode,
          name: record.name,
          status: 'skipped',
          watchId,
          message: 'Produit déjà importé',
        })
        continue
      }

      let imagesImported = 0
      let imagesFailed = 0

      if (!options.skipImages && record.imageUrls.length > 0) {
        const imageResult = await options.importImages(
          watchId,
          record.imageUrls,
          action === 'updated',
        )
        imagesImported = imageResult.imported
        imagesFailed = imageResult.failed
      }

      report.add({
        prestashopProductId: record.prestashopProductId,
        adCode: record.adCode,
        name: record.name,
        status: action,
        watchId,
        imagesImported,
        imagesFailed,
        message: imagesFailed > 0 ? `${imagesFailed} image(s) en échec` : undefined,
      })
    } catch (err) {
      report.add({
        prestashopProductId: record.prestashopProductId,
        adCode: record.adCode,
        name: record.name,
        status: 'error',
        message: err instanceof Error ? err.message : String(err),
      })
    }
  }
}
