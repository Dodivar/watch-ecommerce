import { DEFAULT_RADIUS } from './defaultVisual.js'

export const RADIUS_PRESETS = {
  rounded: DEFAULT_RADIUS,
  sharp: {
    ...DEFAULT_RADIUS,
    sm: '0',
    DEFAULT: '0',
    md: '0',
    lg: '0',
    xl: '0',
    '2xl': '0',
    '3xl': '0',
  },
}

/**
 * Résout l'échelle d'arrondis active : défauts socle + preset ou surcharge `theme.radius`.
 * @param {Record<string, unknown>} siteConfig
 */
export function resolveVisual(siteConfig = {}) {
  const radiusConfig = siteConfig.theme?.radius

  if (radiusConfig == null || radiusConfig === 'rounded') {
    return { radius: { ...DEFAULT_RADIUS } }
  }

  if (typeof radiusConfig === 'string') {
    const preset = RADIUS_PRESETS[radiusConfig]
    if (!preset) {
      throw new Error(`Unknown theme.radius preset: "${radiusConfig}".`)
    }
    return { radius: { ...preset } }
  }

  if (typeof radiusConfig === 'object') {
    return { radius: { ...DEFAULT_RADIUS, ...radiusConfig } }
  }

  throw new Error('theme.radius must be a preset string, an object, or omitted.')
}

/**
 * Nom du preset actif (`rounded` si absent ou personnalisation objet).
 * @param {Record<string, unknown>} siteConfig
 */
export function getRadiusPreset(siteConfig = {}) {
  const radiusConfig = siteConfig.theme?.radius
  if (radiusConfig == null || radiusConfig === 'rounded') return 'rounded'
  if (typeof radiusConfig === 'string') return radiusConfig
  return 'custom'
}
