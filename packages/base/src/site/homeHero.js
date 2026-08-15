/** @typedef {'parallax' | 'compact' | 'vitrine' | 'editorial'} HomeHeroVariant */

/**
 * Variants pilotés par `home.hero.variant` dans le manifest client.
 * - `parallax`  : hero historique (texte + cadran animé), aucune config requise.
 * - `compact`   : bandeau titre + CTAs, entièrement piloté par la config.
 * - `vitrine`   : texte à gauche, pièce photographiée dans un panneau blanc à droite.
 * - `editorial` : composition centrée typographique + planche de pièces alignées.
 */
export const HOME_HERO_VARIANTS = ['parallax', 'compact', 'vitrine', 'editorial']

const KNOWN_VARIANTS = new Set(HOME_HERO_VARIANTS)

/** Variants dont tout le contenu vient de la config : sans titre, rien à afficher. */
const CONFIG_DRIVEN_VARIANTS = new Set(['compact', 'vitrine', 'editorial'])

/** CTA pointant vers une page optionnelle : masqué si la feature est coupée. */
const CTA_FEATURE_BY_PATH = {
  '/collection': 'collection',
  '/recherche': 'recherche',
  '/estimation': 'estimation',
}

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
 * Une pièce mise en avant dans le hero (photo détourée + cartel).
 *
 * @param {unknown} raw
 * @returns {{
 *   image: string,
 *   alt: string | null,
 *   brand: string | null,
 *   model: string | null,
 *   meta: string | null,
 * } | null}
 */
function resolvePiece(raw) {
  if (!raw || typeof raw !== 'object') return null
  const image = resolveOptionalString(raw.image)
  if (!image) return null
  return {
    image,
    alt: resolveOptionalString(raw.alt),
    brand: resolveOptionalString(raw.brand),
    model: resolveOptionalString(raw.model),
    meta: resolveOptionalString(raw.meta),
  }
}

/**
 * @param {unknown} raw
 * @returns {string[]}
 */
function resolveStringList(raw) {
  if (!Array.isArray(raw)) return []
  const out = []
  for (const value of raw) {
    const resolved = resolveOptionalString(value)
    if (resolved) out.push(resolved)
  }
  return out
}

/**
 * Valide et normalise `home.hero` depuis le manifest client.
 * Sans config ou sans variant connu, le socle conserve le hero parallax par défaut.
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
 *   highlights: string[],
 *   pieces: ReturnType<typeof resolvePiece>[],
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
      highlights: [],
      pieces: [],
    }
  }

  const variant = KNOWN_VARIANTS.has(raw.variant) ? raw.variant : 'parallax'
  const pieces = Array.isArray(raw.pieces)
    ? raw.pieces.map(resolvePiece).filter(Boolean)
    : []

  return {
    variant,
    eyebrow: resolveOptionalString(raw.eyebrow),
    title: resolveOptionalString(raw.title),
    subtitle: resolveOptionalString(raw.subtitle),
    primaryCta: resolveCta(raw.primaryCta),
    secondaryCta: resolveCta(raw.secondaryCta),
    image: resolveOptionalString(raw.image),
    imageAlt: resolveOptionalString(raw.imageAlt),
    highlights: resolveStringList(raw.highlights),
    pieces,
  }
}

/**
 * @param {ReturnType<typeof resolveHomeHeroConfig>} hero
 */
export function isHomeHeroRenderable(hero) {
  if (!hero || !CONFIG_DRIVEN_VARIANTS.has(hero.variant)) return true
  return Boolean(hero.title)
}

/**
 * Un CTA de hero n'est affiché que si la page qu'il vise est active.
 *
 * @param {{ label: string, to: string } | null | undefined} cta
 * @param {Record<string, boolean> | undefined} features
 * @returns {boolean}
 */
export function isHomeHeroCtaVisible(cta, features) {
  if (!cta?.label || !cta?.to) return false
  const feature = CTA_FEATURE_BY_PATH[cta.to]
  if (feature) return Boolean(features?.[feature])
  if (cta.to === '/contact') return features?.contact !== false
  return true
}
