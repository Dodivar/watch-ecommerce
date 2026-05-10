/**
 * Slug URL pour une marque (aligné sur le libellé exact en base).
 */
export function slugifyBrand(str) {
  if (!str || typeof str !== 'string') return ''
  return str
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

/**
 * Trouve le nom de marque canonique dont le slug correspond à brandSlug.
 * @param {Array<{ brand: string }>} watches
 * @param {string} brandSlug
 * @returns {string|null}
 */
export function resolveBrandFromSlug(watches, brandSlug) {
  if (!brandSlug || !watches?.length) return null
  const normalizedSlug = String(brandSlug).toLowerCase().trim()
  const brands = [...new Set(watches.map((w) => w.brand).filter(Boolean))]
  return brands.find((b) => slugifyBrand(b) === normalizedSlug) ?? null
}

/**
 * Logos marques fournis par le template (packages/base/public/brands/vendor), servis en
 * `/brands/vendor/*`. Clés = résultat de {@link slugifyBrand} (ex. Oméga → omega).
 * Les sites peuvent toujours surcharger via `brandLogos` ou `brandHero` dans site.config.js.
 *
 * @type {Readonly<Record<string, string>>}
 */
export const VENDOR_BRAND_LOGO_BY_SLUG = Object.freeze({
  breitling: '/brands/vendor/breitling.png',
  cartier: '/brands/vendor/cartier.svg',
  hamilton: '/brands/vendor/hamilton.svg',
  omega: '/brands/vendor/omega.svg',
  rolex: '/brands/vendor/rolex.svg',
})

/**
 * URL image pour la grille « toutes les marques » : `brandLogos`, puis bandeau `brandHero`,
 * puis catalogue partagé {@link VENDOR_BRAND_LOGO_BY_SLUG}.
 * @param {Record<string, unknown>} siteConfig
 * @param {string} brandName - libellé exact `brand` en base
 * @returns {string|null}
 */
export function resolveBrandTileImage(siteConfig, brandName) {
  if (!brandName) return null
  const logo = siteConfig?.brandLogos?.[brandName]
  if (logo?.image) return logo.image
  const hero = siteConfig?.brandHero?.[brandName]
  if (hero?.image) return hero.image
  const slug = slugifyBrand(brandName)
  const vendor = VENDOR_BRAND_LOGO_BY_SLUG[slug]
  return vendor ?? null
}

/**
 * Texte alternatif pour la tuile marque.
 * @param {Record<string, unknown>} siteConfig
 * @param {string} brandName
 * @returns {string}
 */
export function resolveBrandTileAlt(siteConfig, brandName) {
  if (!brandName) return ''
  const logo = siteConfig?.brandLogos?.[brandName]
  if (logo?.alt != null && String(logo.alt).length > 0) return String(logo.alt)
  const hero = siteConfig?.brandHero?.[brandName]
  if (hero?.alt != null && String(hero.alt).length > 0) return String(hero.alt)
  return brandName
}
