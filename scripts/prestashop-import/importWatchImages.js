import { encodeImageForStorage } from '../lib/encodeImageForStorage.js'
import {
  STORAGE_IMAGE_CACHE_CONTROL,
  UPLOAD_IMAGE_MIME,
  buildUploadFileName,
} from '../../packages/base/src/utils/imageEncoding.js'

/**
 * Redimensionne et ré-encode l'image téléchargée avant l'envoi au Storage.
 *
 * Un catalogue PrestaShop se compte en milliers de références : importer les
 * visuels d'origine reconstituerait en une passe le stock d'images lourdes que
 * `scripts/reencode-storage-images.mjs` vient de résorber.
 *
 * @param {{ buffer: ArrayBuffer, contentType: string, ext: string }} downloaded
 * @returns {Promise<{ buffer: Buffer, contentType: string, fileName: string }>}
 */
async function prepareForStorage({ buffer, contentType, ext }) {
  const input = Buffer.from(buffer)

  try {
    const encoded = await encodeImageForStorage(input)
    return {
      buffer: encoded.buffer,
      contentType: UPLOAD_IMAGE_MIME,
      fileName: buildUploadFileName(),
    }
  } catch (err) {
    // Format que sharp ne sait pas lire : mieux vaut importer l'original que
    // perdre le visuel. Le script de reprise le signalera.
    console.warn(
      `[import-images] ré-encodage impossible, original conservé : ${err instanceof Error ? err.message : String(err)}`,
    )
    return { buffer: input, contentType, fileName: buildUploadFileName(ext) }
  }
}

/**
 * Télécharge une image depuis une URL avec retries.
 * @param {string} url
 * @param {{ retries?: number, timeoutMs?: number }} [options]
 * @returns {Promise<{ buffer: ArrayBuffer, contentType: string, ext: string }>}
 */
export async function downloadImage(url, options = {}) {
  const retries = options.retries ?? 3
  const timeoutMs = options.timeoutMs ?? 30000
  let lastError

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), timeoutMs)

      const response = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'watch-ecommerce-prestashop-import/1.0' },
      })
      clearTimeout(timer)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`)
      }

      const contentType = response.headers.get('content-type') || 'image/jpeg'
      const buffer = await response.arrayBuffer()
      const ext = extensionFromContentType(contentType, url)

      return { buffer, contentType, ext }
    } catch (err) {
      lastError = err
      if (attempt < retries) {
        await sleep(500 * attempt)
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError))
}

/**
 * Importe les images d'une montre vers Supabase Storage + watch_images.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} watchId
 * @param {string[]} imageUrls
 * @param {{ concurrency?: number, replaceExisting?: boolean }} [options]
 * @returns {Promise<{ imported: number, failed: number, errors: string[] }>}
 */
export async function importWatchImages(supabase, watchId, imageUrls, options = {}) {
  const concurrency = options.concurrency ?? 3
  const replaceExisting = options.replaceExisting ?? false
  /** @type {string[]} */
  const errors = []
  let imported = 0
  let failed = 0

  if (!imageUrls?.length) {
    return { imported, failed, errors }
  }

  if (replaceExisting) {
    await deleteExistingImages(supabase, watchId)
  }

  const startOrder = await getNextImageOrder(supabase, watchId)

  /** @type {Array<{ url: string, order: number }>} */
  const tasks = imageUrls.map((url, index) => ({
    url,
    order: startOrder + index,
  }))

  await runWithConcurrency(tasks, concurrency, async ({ url, order }) => {
    try {
      await uploadImageFromUrl(supabase, watchId, url, order)
      imported += 1
    } catch (err) {
      failed += 1
      errors.push(`${url}: ${err instanceof Error ? err.message : String(err)}`)
    }
  })

  return { imported, failed, errors }
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} watchId
 * @param {string} url
 * @param {number} order
 */
async function uploadImageFromUrl(supabase, watchId, url, order) {
  const downloaded = await downloadImage(url)
  const { buffer, contentType, fileName } = await prepareForStorage(downloaded)
  const filePath = `watches/${watchId}/${fileName}`

  const { error: uploadError } = await supabase.storage.from('watch-images').upload(filePath, buffer, {
    cacheControl: STORAGE_IMAGE_CACHE_CONTROL,
    upsert: false,
    contentType,
  })

  if (uploadError) {
    throw new Error(uploadError.message)
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('watch-images').getPublicUrl(filePath)

  const { error: recordError } = await supabase.from('watch_images').insert({
    watch_id: watchId,
    image_path: filePath,
    image_url: publicUrl,
    image_order: order,
  })

  if (recordError) {
    await supabase.storage.from('watch-images').remove([filePath])
    throw new Error(recordError.message)
  }
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} watchId
 */
async function deleteExistingImages(supabase, watchId) {
  const { data: images } = await supabase
    .from('watch_images')
    .select('id, image_path')
    .eq('watch_id', watchId)

  if (!images?.length) return

  const paths = images.map((img) => img.image_path).filter(Boolean)
  if (paths.length) {
    await supabase.storage.from('watch-images').remove(paths)
  }

  await supabase.from('watch_images').delete().eq('watch_id', watchId)
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} watchId
 */
async function getNextImageOrder(supabase, watchId) {
  const { data } = await supabase
    .from('watch_images')
    .select('image_order')
    .eq('watch_id', watchId)
    .order('image_order', { ascending: false })
    .limit(1)

  return data?.length ? data[0].image_order + 1 : 1
}

/**
 * @param {string} contentType
 * @param {string} url
 */
function extensionFromContentType(contentType, url) {
  if (contentType.includes('png')) return 'png'
  if (contentType.includes('webp')) return 'webp'
  if (contentType.includes('gif')) return 'gif'
  if (contentType.includes('jpeg') || contentType.includes('jpg')) return 'jpg'

  const match = url.match(/\.(jpe?g|png|webp|gif)(?:\?|$)/i)
  if (match) return match[1].toLowerCase().replace('jpeg', 'jpg')

  return 'jpg'
}

/**
 * @template T
 * @param {T[]} items
 * @param {number} concurrency
 * @param {(item: T) => Promise<void>} fn
 */
async function runWithConcurrency(items, concurrency, fn) {
  let index = 0

  async function worker() {
    while (index < items.length) {
      const i = index
      index += 1
      await fn(items[i])
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker())
  await Promise.all(workers)
}

/**
 * @param {number} ms
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
