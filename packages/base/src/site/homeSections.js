/** Identifiants de sections reconnus pour `site.config.js` → `home.sections`. */
export const KNOWN_HOME_SECTION_IDS = [
  'hero',
  'nouvelles',
  'trust',
  'ventes',
  'suivezNous',
  'services',
  'faq',
]

const KNOWN_SET = new Set(KNOWN_HOME_SECTION_IDS)

/**
 * Aucune valeur par défaut : si `home` ou `home.sections` est absent / vide, tableau vide.
 * Les ids inconnus sont ignorés ; en dev un avertissement est émis.
 *
 * @param {Record<string, unknown>} siteConfig
 * @returns {string[]}
 */
export function resolveHomeSections(siteConfig) {
  const raw = siteConfig?.home?.sections
  if (!Array.isArray(raw) || raw.length === 0) return []

  const out = []
  for (const id of raw) {
    if (typeof id !== 'string') continue
    if (KNOWN_SET.has(id)) {
      out.push(id)
    } else if (import.meta.env.DEV) {
      console.warn(`[site-config] Unknown home.sections id: "${id}"`)
    }
  }
  return out
}

/**
 * Applique les garde-fous `features` (FAQ, bloc services) sur la liste déjà résolue.
 *
 * @param {string[]} sections
 * @param {Record<string, boolean>} features
 * @returns {string[]}
 */
export function filterHomeSectionsByFeatures(sections, features) {
  return sections.filter((id) => {
    if (id === 'faq') return Boolean(features.faq)
    if (id === 'services') {
      return Boolean(
        features.recherche || features.collection || features.estimation,
      )
    }
    return true
  })
}
