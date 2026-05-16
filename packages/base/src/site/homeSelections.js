import { isValidCollectionPublicQuerySlug } from '@/constants/watchAudiences.js'

export const DEFAULT_HOME_SELECTIONS_TITLE = 'Nos sélections du moment'

/**
 * Entrée brute d’une carte (manifest ou `homeSelections.config.js`).
 * @typedef {Object} HomeSelectionCardInput
 * @property {string} label
 * @property {{ marque?: string, public?: string }} [filters]
 * @property {string} [image] - URL absolue, chemin public (`/home-selections/…`) ou URL Vite après `import`
 * @property {string} [imageAlt] - texte alternatif ; défaut = `label`
 */

/**
 * Construit une route Vue Router vers `/collection` avec les filtres URL supportés.
 *
 * @param {{ marque?: string, public?: string }} [filters]
 * @returns {{ path: string, query: Record<string, string> }}
 */
export function buildCollectionRouteFromFilters(filters = {}) {
  /** @type {Record<string, string>} */
  const query = {}
  if (typeof filters.marque === 'string' && filters.marque.trim()) {
    query.marque = filters.marque.trim().toLowerCase()
  }
  if (isValidCollectionPublicQuerySlug(filters.public)) {
    query.public = filters.public
  }
  return { path: '/collection', query }
}

/**
 * @param {unknown} raw
 * @returns {{ label: string, filters: { marque?: string, public?: string }, image?: string, imageAlt: string } | null}
 */
function normalizeCard(raw) {
  if (!raw || typeof raw !== 'object') return null
  const label = typeof raw.label === 'string' ? raw.label.trim() : ''
  if (!label) return null

  /** @type {{ marque?: string, public?: string }} */
  const filters = {}
  if (raw.filters && typeof raw.filters === 'object') {
    if (typeof raw.filters.marque === 'string' && raw.filters.marque.trim()) {
      filters.marque = raw.filters.marque.trim().toLowerCase()
    }
    if (isValidCollectionPublicQuerySlug(raw.filters.public)) {
      filters.public = raw.filters.public
    }
  }

  const image =
    typeof raw.image === 'string' && raw.image.trim() ? raw.image.trim() : undefined

  const imageAlt =
    typeof raw.imageAlt === 'string' && raw.imageAlt.trim()
      ? raw.imageAlt.trim()
      : label

  return {
    label,
    filters,
    imageAlt,
    ...(image ? { image } : {}),
  }
}

/**
 * Valide et normalise `home.selections` depuis le manifest client.
 *
 * @param {Record<string, unknown>} siteConfig
 * @returns {{ title: string, cards: Array<{ label: string, filters: { marque?: string, public?: string }, image?: string, imageAlt: string }> }}
 */
export function resolveHomeSelectionsConfig(siteConfig) {
  const raw = siteConfig?.home?.selections
  if (!raw || typeof raw !== 'object') {
    return { title: DEFAULT_HOME_SELECTIONS_TITLE, cards: [] }
  }

  const title =
    typeof raw.title === 'string' && raw.title.trim()
      ? raw.title.trim()
      : DEFAULT_HOME_SELECTIONS_TITLE

  const cards = []
  const cardSource = Array.isArray(raw.cards) ? raw.cards : []
  for (const item of cardSource) {
    const card = normalizeCard(item)
    if (card) cards.push(card)
  }

  return { title, cards }
}
