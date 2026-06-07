/**
 * Slug URL canonique pour une fiche produit.
 * @param {string | undefined | null} str
 */
export function slugifyWatchPart(str) {
  if (!str || typeof str !== 'string') return ''
  return str
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * @param {{ id?: string, slug?: string, brand?: string, name?: string, reference?: string }} watch
 */
export function buildWatchSlug(watch) {
  if (watch?.slug) return String(watch.slug)
  const brand = slugifyWatchPart(watch?.brand)
  const name = slugifyWatchPart(watch?.name)
  const reference = slugifyWatchPart(watch?.reference)

  const segments = [brand, name].filter(Boolean)
  if (reference) segments.push(reference)

  const base = segments.join('-')
  if (base) return base

  return watch?.id ? String(watch.id) : ''
}

/**
 * @param {{ id?: string, slug?: string, brand?: string, name?: string, reference?: string }} watch
 */
export function buildWatchPath(watch) {
  const slug = buildWatchSlug(watch)
  return slug ? `/montre/${slug}` : '/collection'
}

/**
 * Navigation vers la fiche produit canonique.
 * @param {import('vue-router').Router} router
 * @param {string | { id?: string, slug?: string, brand?: string, name?: string, reference?: string }} watchOrId
 */
export function navigateToWatch(router, watchOrId) {
  if (watchOrId == null) return
  if (typeof watchOrId === 'string' || typeof watchOrId === 'number') {
    router.push(`/watch/${watchOrId}`)
    return
  }
  router.push(buildWatchPath(watchOrId))
}

/** Identifiant Supabase UUID ou entier numérique (legacy /watch/:id). */
export function isLegacyWatchIdParam(param) {
  if (!param || typeof param !== 'string') return false
  if (/^\d+$/.test(param)) return true
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(param)
}
