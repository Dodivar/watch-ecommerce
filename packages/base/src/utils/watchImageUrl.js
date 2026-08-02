const SUPABASE_OBJECT_PUBLIC = '/storage/v1/object/public/'
const SUPABASE_RENDER_PUBLIC = '/storage/v1/render/image/public/'

/**
 * Transformations Storage (`/render/image/`) : plan Supabase Pro+.
 * Sans cette variable, les URLs d’origine (`/object/public/`) sont utilisées.
 */
export const SUPABASE_IMAGE_TRANSFORMS_ENABLED =
  import.meta.env.VITE_SUPABASE_IMAGE_TRANSFORMS === 'true'

/** Largeurs pour le srcset (uniquement si transformations activées). */
export const WATCH_CARD_SRC_WIDTHS = [320, 480, 640]

export const WATCH_CARD_IMAGE_SIZES =
  '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw'

/**
 * @param {string | null | undefined} url
 * @returns {boolean}
 */
export function isSupabaseStoragePublicUrl(url) {
  return typeof url === 'string' && url.includes(SUPABASE_OBJECT_PUBLIC)
}

/**
 * @param {string} url
 * @param {{ width?: number, height?: number, quality?: number, resize?: string }} options
 */
function appendRenderParams(url, options) {
  const { width, height, quality = 80, resize = 'cover' } = options
  const parsed = new URL(url)

  if (width) parsed.searchParams.set('width', String(width))
  if (height) parsed.searchParams.set('height', String(height))
  if (quality) parsed.searchParams.set('quality', String(quality))
  if (resize) parsed.searchParams.set('resize', resize)

  return parsed.toString()
}

/**
 * URL de rendu redimensionné (Pro+). Sinon URL inchangée.
 *
 * @param {string | null | undefined} url
 * @param {{ width?: number, height?: number, quality?: number, resize?: string }} [options]
 * @returns {string | undefined}
 */
export function toSupabaseRenderUrl(url, options = {}) {
  if (!url) return undefined
  if (!SUPABASE_IMAGE_TRANSFORMS_ENABLED) return url

  if (url.includes(SUPABASE_RENDER_PUBLIC)) {
    return appendRenderParams(url, options)
  }

  if (!isSupabaseStoragePublicUrl(url)) {
    return url
  }

  const renderBase = url.replace(SUPABASE_OBJECT_PUBLIC, SUPABASE_RENDER_PUBLIC)
  return appendRenderParams(renderBase, options)
}

/**
 * URL affichée sur une carte montre.
 *
 * @param {string | null | undefined} url
 * @param {{ width?: number, quality?: number }} [options]
 */
export function watchCardImageUrl(url, options = {}) {
  if (!url) return undefined
  if (!SUPABASE_IMAGE_TRANSFORMS_ENABLED) return url

  return toSupabaseRenderUrl(url, {
    width: options.width ?? 480,
    quality: options.quality ?? 80,
    resize: 'cover',
  })
}

/**
 * @param {string | null | undefined} url
 * @returns {string | undefined}
 */
/** Largeur cible dans la visionneuse plein écran : assez large pour le zoom pincement. */
export const WATCH_LIGHTBOX_IMAGE_WIDTH = 1600

/**
 * URL affichée dans la visionneuse plein écran.
 *
 * @param {string | null | undefined} url
 * @param {{ width?: number, quality?: number }} [options]
 */
export function watchLightboxImageUrl(url, options = {}) {
  if (!url) return undefined
  if (!SUPABASE_IMAGE_TRANSFORMS_ENABLED) return url

  return toSupabaseRenderUrl(url, {
    width: options.width ?? WATCH_LIGHTBOX_IMAGE_WIDTH,
    quality: options.quality ?? 82,
    resize: 'contain',
  })
}

/**
 * Le préchargement des images voisines n'a de sens que si une variante allégée
 * existe : sans transformations Storage, les originaux pèsent plusieurs Mo pièce
 * et précharger dégraderait la navigation mobile au lieu de l'améliorer.
 *
 * @returns {boolean}
 */
export function canPreloadWatchImages() {
  if (!SUPABASE_IMAGE_TRANSFORMS_ENABLED) return false
  if (typeof navigator === 'undefined') return false

  const connection =
    navigator.connection || navigator.mozConnection || navigator.webkitConnection
  if (!connection) return true
  if (connection.saveData) return false

  return !['slow-2g', '2g', '3g'].includes(connection.effectiveType)
}

export function buildWatchCardSrcSet(url) {
  if (!SUPABASE_IMAGE_TRANSFORMS_ENABLED || !url || !isSupabaseStoragePublicUrl(url)) {
    return undefined
  }

  return WATCH_CARD_SRC_WIDTHS.map(
    (w) => `${watchCardImageUrl(url, { width: w })} ${w}w`,
  ).join(', ')
}
