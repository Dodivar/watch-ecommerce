import { DEFAULT_TYPOGRAPHY } from './defaultTypography.js'

function quoteFontFamily(family) {
  return family.includes(' ') ? `'${family}'` : family
}

function buildFontStack(family, fallbacks) {
  return [quoteFontFamily(family), ...fallbacks].join(', ')
}

function resolveFaceSrc(face, fontsPath) {
  if (face.src) return face.src
  if (face.file) return `${fontsPath}${face.file}`
  throw new Error('Each typography face must define `file` or `src`.')
}

function normalizeRole(role, fontsPath) {
  const fallbacks = role.fallbacks ?? DEFAULT_TYPOGRAPHY.sans.fallbacks
  const faces = (role.faces ?? []).map((face) => ({
    weight: face.weight ?? 400,
    style: face.style ?? 'normal',
    src: resolveFaceSrc(face, fontsPath),
  }))

  return {
    family: role.family,
    fallbacks,
    stack: buildFontStack(role.family, fallbacks),
    faces,
  }
}

function mergeRole(defaultRole, overrideRole, fontsPath) {
  if (!overrideRole) return normalizeRole(defaultRole, fontsPath)
  return normalizeRole({ ...defaultRole, ...overrideRole }, fontsPath)
}

/**
 * Résout la typographie active : défauts Sauvage + surcharge `theme.typography` du manifest site.
 * @param {Record<string, unknown>} siteConfig
 */
export function resolveTypography(siteConfig = {}) {
  const override = siteConfig.theme?.typography ?? {}
  const fontsPath = override.fontsPath ?? DEFAULT_TYPOGRAPHY.fontsPath

  const sans = mergeRole(DEFAULT_TYPOGRAPHY.sans, override.sans, fontsPath)
  const heading = mergeRole(DEFAULT_TYPOGRAPHY.heading, override.heading, fontsPath)

  const subheadingOverride = override.subheading ?? {}
  const subheadingRole = subheadingOverride.role ?? DEFAULT_TYPOGRAPHY.subheading.role
  const subheadingSource = subheadingRole === 'heading' ? heading : sans

  return {
    fontsPath,
    sans,
    heading,
    subheading: {
      stack: subheadingSource.stack,
      weight: subheadingOverride.weight ?? DEFAULT_TYPOGRAPHY.subheading.weight,
    },
    headingWeight: override.headingWeight ?? DEFAULT_TYPOGRAPHY.headingWeight,
  }
}
