import {
  UPLOAD_IMAGE_EXTENSION,
  UPLOAD_IMAGE_MAX_DIMENSION,
  UPLOAD_IMAGE_MIME,
  UPLOAD_IMAGE_WEBP_QUALITY,
  buildUploadFileName,
  fitWithin,
} from '@/utils/imageEncoding.js'

/**
 * Compression des photos avant envoi dans Supabase Storage.
 *
 * Une photo de téléphone pèse 2 à 12 Mo et n'est jamais affichée au-delà de
 * 1600 px : la stocker telle quelle fait payer ce poids à chaque visiteur.
 *
 * Aucune fonction d'ici ne lève : un format exotique doit continuer à s'uploader
 * tel quel plutôt que de faire échouer l'enregistrement d'une montre.
 */

/** Repli quand le navigateur ne sait pas encoder en WebP (Safari < 16.4). */
const FALLBACK_MIME = 'image/jpeg'
const FALLBACK_EXTENSION = 'jpg'
const FALLBACK_QUALITY = 0.82

/**
 * @param {File | Blob} file
 * @returns {boolean}
 */
export function isHeicFile(file) {
  const name = typeof file?.name === 'string' ? file.name.toLowerCase() : ''
  const type = String(file?.type ?? '').toLowerCase()

  return (
    name.endsWith('.heic') ||
    name.endsWith('.heif') ||
    type === 'image/heic' ||
    type === 'image/heif'
  )
}

/**
 * Le HEIC n'est décodable par `createImageBitmap` que sur Safari : on repasse
 * systématiquement par heic2any pour obtenir un JPEG intermédiaire.
 *
 * Import dynamique à double titre : heic2any embarque libheif (près d'un Mo,
 * inutile à qui n'envoie pas de photo iPhone) et touche `window` dès son
 * évaluation, ce qui casserait tout import de ce module hors navigateur.
 *
 * @param {File | Blob} file
 * @returns {Promise<Blob>}
 */
async function decodeHeic(file) {
  const { default: heic2any } = await import('heic2any')
  const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 })
  return Array.isArray(converted) ? converted[0] : converted
}

/**
 * @param {Blob} blob
 * @returns {Promise<ImageBitmap | HTMLImageElement>}
 */
async function decodeImage(blob) {
  if (typeof createImageBitmap === 'function') {
    try {
      // `from-image` applique l'orientation EXIF : sans elle, les photos prises
      // en portrait ressortent couchées une fois redessinées sur le canvas.
      return await createImageBitmap(blob, { imageOrientation: 'from-image' })
    } catch {
      // Option non supportée : on retente sans, puis on tombe sur <img>.
      try {
        return await createImageBitmap(blob)
      } catch {
        /* repli <img> ci-dessous */
      }
    }
  }

  const objectUrl = URL.createObjectURL(blob)
  try {
    return await new Promise((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = () => reject(new Error('image illisible'))
      image.src = objectUrl
    })
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {string} type
 * @param {number} quality
 * @returns {Promise<Blob | null>}
 */
function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, type, quality)
  })
}

/**
 * @param {ImageBitmap | HTMLImageElement} source
 * @returns {Promise<{ blob: Blob, mime: string, extension: string } | null>}
 */
async function drawAndEncode(source) {
  const sourceWidth = source.width || source.naturalWidth
  const sourceHeight = source.height || source.naturalHeight
  const target = fitWithin(sourceWidth, sourceHeight, UPLOAD_IMAGE_MAX_DIMENSION)

  if (!target.width || !target.height) return null

  const canvas = document.createElement('canvas')
  canvas.width = target.width
  canvas.height = target.height

  const context = canvas.getContext('2d')
  if (!context) return null

  context.drawImage(source, 0, 0, target.width, target.height)

  const encoded = await canvasToBlob(canvas, UPLOAD_IMAGE_MIME, UPLOAD_IMAGE_WEBP_QUALITY)

  // `toBlob` retombe silencieusement sur du PNG quand le type demandé n'est pas
  // supporté — et un PNG de photo est plus lourd que l'original.
  if (encoded && encoded.type === UPLOAD_IMAGE_MIME) {
    return { blob: encoded, mime: UPLOAD_IMAGE_MIME, extension: UPLOAD_IMAGE_EXTENSION }
  }

  const fallback = await canvasToBlob(canvas, FALLBACK_MIME, FALLBACK_QUALITY)
  if (fallback && fallback.type === FALLBACK_MIME) {
    return { blob: fallback, mime: FALLBACK_MIME, extension: FALLBACK_EXTENSION }
  }

  return null
}

/**
 * @typedef {object} CompressedUpload
 * @property {Blob} blob      Contenu à envoyer au Storage.
 * @property {string} fileName Nom de fichier unique, extension cohérente avec `contentType`.
 * @property {string} contentType
 * @property {boolean} compressed `false` si le fichier d'origine est renvoyé tel quel.
 */

/**
 * Redimensionne (1600 px max) et ré-encode en WebP une image destinée au Storage.
 *
 * @param {File | Blob} file
 * @returns {Promise<CompressedUpload>}
 */
export async function compressImageForUpload(file) {
  const original = {
    blob: file,
    fileName: buildUploadFileName(extensionOf(file)),
    contentType: file?.type || 'application/octet-stream',
    compressed: false,
  }

  const isImage = String(file?.type ?? '').startsWith('image/') || isHeicFile(file)
  // Le SVG est déjà minuscule et le rastériser lui ferait perdre son intérêt.
  if (!isImage || file?.type === 'image/svg+xml') {
    return original
  }

  try {
    const decodable = isHeicFile(file) ? await decodeHeic(file) : file
    const source = await decodeImage(decodable)
    const encoded = await drawAndEncode(source)

    if (typeof source.close === 'function') source.close()
    if (!encoded) return original

    // Une image déjà légère ne gagne rien : on garde l'originale.
    if (encoded.blob.size >= file.size && !isHeicFile(file)) {
      return original
    }

    return {
      blob: encoded.blob,
      fileName: buildUploadFileName(encoded.extension),
      contentType: encoded.mime,
      compressed: true,
    }
  } catch (error) {
    console.warn('compressImageForUpload: envoi du fichier original', error)
    return original
  }
}

/**
 * @param {File | Blob} file
 * @returns {string}
 */
function extensionOf(file) {
  const name = typeof file?.name === 'string' ? file.name : ''
  const lastDot = name.lastIndexOf('.')

  if (lastDot > 0 && lastDot < name.length - 1) {
    return name.slice(lastDot + 1)
  }

  return UPLOAD_IMAGE_EXTENSION
}
