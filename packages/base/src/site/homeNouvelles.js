export const DEFAULT_HOME_NOUVELLES_TITLE = 'Nouvelles arrivées'

/**
 * @param {unknown} value
 * @returns {string | null}
 */
function resolveSubtitle(value) {
  if (value == null) return null
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed || null
}

/**
 * Valide et normalise `home.nouvelles` depuis le manifest client.
 *
 * @param {Record<string, unknown>} siteConfig
 * @returns {{ title: string, subtitle: string | null }}
 */
export function resolveHomeNouvellesConfig(siteConfig) {
  const raw = siteConfig?.home?.nouvelles
  if (!raw || typeof raw !== 'object') {
    return {
      title: DEFAULT_HOME_NOUVELLES_TITLE,
      subtitle: null,
    }
  }

  const title =
    typeof raw.title === 'string' && raw.title.trim()
      ? raw.title.trim()
      : DEFAULT_HOME_NOUVELLES_TITLE

  return {
    title,
    subtitle: resolveSubtitle(raw.subtitle),
  }
}
