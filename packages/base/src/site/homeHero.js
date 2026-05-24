/** @typedef {'parallax' | 'compact'} HomeHeroVariant */

/**
 * @param {unknown} raw
 * @returns {{ label: string, to: string } | null}
 */
function resolveCta(raw) {
  if (!raw || typeof raw !== 'object') return null
  const label = typeof raw.label === 'string' ? raw.label.trim() : ''
  const to = typeof raw.to === 'string' ? raw.to.trim() : ''
  if (!label || !to) return null
  return { label, to }
}

/**
 * @param {unknown} value
 * @returns {string | null}
 */
function resolveOptionalString(value) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed || null
}

/**
 * Valide et normalise `home.hero` depuis le manifest client.
 * Sans config ou sans `variant: 'compact'`, le socle conserve le hero parallax par défaut.
 *
 * @param {Record<string, unknown>} siteConfig
 * @returns {{
 *   variant: HomeHeroVariant,
 *   eyebrow: string | null,
 *   title: string | null,
 *   subtitle: string | null,
 *   primaryCta: { label: string, to: string } | null,
 *   secondaryCta: { label: string, to: string } | null,
 *   image: string | null,
 *   imageAlt: string | null,
 * }}
 */
export function resolveHomeHeroConfig(siteConfig) {
  const raw = siteConfig?.home?.hero
  if (!raw || typeof raw !== 'object') {
    return {
      variant: 'parallax',
      eyebrow: null,
      title: null,
      subtitle: null,
      primaryCta: null,
      secondaryCta: null,
      image: null,
      imageAlt: null,
    }
  }

  const variant = raw.variant === 'compact' ? 'compact' : 'parallax'

  return {
    variant,
    eyebrow: resolveOptionalString(raw.eyebrow),
    title: resolveOptionalString(raw.title),
    subtitle: resolveOptionalString(raw.subtitle),
    primaryCta: resolveCta(raw.primaryCta),
    secondaryCta: resolveCta(raw.secondaryCta),
    image: resolveOptionalString(raw.image),
    imageAlt: resolveOptionalString(raw.imageAlt),
  }
}

/**
 * @param {ReturnType<typeof resolveHomeHeroConfig>} hero
 */
export function isHomeHeroRenderable(hero) {
  if (!hero || hero.variant !== 'compact') return true
  return Boolean(hero.title)
}
