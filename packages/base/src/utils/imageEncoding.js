/**
 * Paramètres d'encodage des images stockées dans Supabase Storage.
 *
 * Partagés entre le navigateur (compression avant upload, via `canvas`) et le
 * script Node de ré-encodage du existant (`scripts/reencode-storage-images.mjs`,
 * via `sharp`) : les deux chemins doivent produire des fichiers comparables.
 *
 * Ce module ne doit importer ni alias `@/` ni dépendance navigateur — il est
 * chargé tel quel par Node.
 */

/**
 * `cache-control` posé sur les objets Storage (secondes, ici un an).
 *
 * Sans danger malgré la durée : les noms de fichiers embarquent un timestamp et
 * un suffixe aléatoire, un objet n'est jamais réécrit sous le même chemin. À
 * l'inverse, une valeur courte fait re-télécharger tout le catalogue à chaque
 * visite — le principal poste d'egress du projet.
 */
export const STORAGE_IMAGE_CACHE_CONTROL = '31536000'

/**
 * Plus grand côté conservé à l'upload.
 *
 * Aligné sur `WATCH_LIGHTBOX_IMAGE_WIDTH` (`@/utils/watchImageUrl.js`) : c'est
 * le plus grand affichage réel d'une photo, le zoom pincement compris.
 */
export const UPLOAD_IMAGE_MAX_DIMENSION = 1600

/** Qualité WebP, entre 0 et 1. */
export const UPLOAD_IMAGE_WEBP_QUALITY = 0.8

export const UPLOAD_IMAGE_MIME = 'image/webp'
export const UPLOAD_IMAGE_EXTENSION = 'webp'

/**
 * Dimensions réduites pour tenir dans un carré de `maxDimension`, sans
 * agrandir une image déjà plus petite ni déformer le ratio.
 *
 * @param {number} width
 * @param {number} height
 * @param {number} [maxDimension]
 * @returns {{ width: number, height: number }}
 */
export function fitWithin(width, height, maxDimension = UPLOAD_IMAGE_MAX_DIMENSION) {
  if (!width || !height || width < 0 || height < 0) {
    return { width: 0, height: 0 }
  }

  const largestSide = Math.max(width, height)
  if (largestSide <= maxDimension) {
    return { width, height }
  }

  const ratio = maxDimension / largestSide
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  }
}

/**
 * Même chemin d'objet, extension `.webp`.
 *
 * @param {string} path
 * @returns {string}
 */
export function withWebpExtension(path) {
  if (typeof path !== 'string' || !path) return path

  const lastSlash = path.lastIndexOf('/')
  const lastDot = path.lastIndexOf('.')

  // Pas d'extension, ou point appartenant au dossier / à un fichier caché.
  if (lastDot <= lastSlash + 1) {
    return `${path}.${UPLOAD_IMAGE_EXTENSION}`
  }

  return `${path.slice(0, lastDot)}.${UPLOAD_IMAGE_EXTENSION}`
}

/**
 * Nom de fichier unique pour un nouvel objet Storage.
 *
 * L'unicité est ce qui autorise `STORAGE_IMAGE_CACHE_CONTROL` à valoir un an.
 *
 * @param {string} [extension]
 * @returns {string}
 */
export function buildUploadFileName(extension = UPLOAD_IMAGE_EXTENSION) {
  const random = Math.random().toString(36).substring(2, 9)
  const safeExtension = String(extension || UPLOAD_IMAGE_EXTENSION)
    .replace(/^\./, '')
    .toLowerCase()

  return `${Date.now()}-${random}.${safeExtension}`
}
