import { isHomeHeroRenderable } from './homeHero.js'
import { resolveHomeSelectionsConfig } from './homeSelections.js'

/** Identifiants de sections reconnus pour `site.config.js` → `home.sections`. */
export const KNOWN_HOME_SECTION_IDS = [
  'homeCarousel',
  'hero',
  'nouvelles',
  'selections',
  'collectionHighlight',
  'stats',
  'aboutPreview',
  'trust',
  'ventes',
  'suivezNous',
  'avisGoogle',
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
 * @param {Record<string, unknown>} [siteConfig]
 * @returns {string[]}
 */
export function filterHomeSectionsByFeatures(sections, features, siteConfig) {
  const resolvedCards = siteConfig?.home?.selections?.cards
  const selectionsCards =
    Array.isArray(resolvedCards)
      ? resolvedCards.length
      : siteConfig
        ? resolveHomeSelectionsConfig(siteConfig).cards.length
        : 0

  return sections.filter((id) => {
    if (id === 'homeCarousel') return Boolean(features.homeCarousel)
    if (id === 'hero') {
      return isHomeHeroRenderable(siteConfig?.home?.hero)
    }
    if (id === 'faq') return Boolean(features.faq)
    if (id === 'selections') {
      return Boolean(features.collection && selectionsCards > 0)
    }
    if (id === 'collectionHighlight') {
      return Boolean(features.collection)
    }
    if (id === 'avisGoogle') return Boolean(features.googleReviews)
    if (id === 'services') {
      return Boolean(
        features.recherche || features.collection || features.estimation,
      )
    }
    return true
  })
}
