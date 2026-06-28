/**
 * Couleurs de bracelet sélectionnables (filtre collection + formulaire admin).
 *
 * Chaque couleur expose un `gradient` CSS pour le rendu des pastilles rondes
 * (aspect métallique ou finition mate pour le noir). Stockage côté base : un tableau de `slug` dans
 * `watch_details.bracelet_colors` (une montre peut être bicolore).
 *
 * Pour ajouter une couleur : ajouter une ligne ici (slug stable) puis la rendre
 * disponible en base — aucune migration n'est nécessaire, la colonne est un
 * tableau de texte libre validé par cette liste.
 *
 * @type {Array<{ slug: string, label: string, gradient: string }>}
 */
export const WATCH_BRACELET_COLORS = [
  {
    slug: 'gold',
    label: 'Or',
    gradient:
      'linear-gradient(135deg, #fdf3c4 0%, #f4d97b 28%, #d9a83a 55%, #a9781c 80%, #7c5510 100%)',
  },
  {
    slug: 'silver',
    label: 'Argenté',
    gradient:
      'linear-gradient(135deg, #ffffff 0%, #e6e8ea 28%, #b7bcc1 55%, #8a9096 80%, #5f656b 100%)',
  },
  {
    slug: 'black',
    label: 'Noir',
    gradient:
      'linear-gradient(135deg, #5c5c5c 0%, #3d3d3d 25%, #262626 55%, #141414 80%, #050505 100%)',
  },
  {
    slug: 'rose_gold',
    label: 'Or rose',
    gradient:
      'linear-gradient(135deg, #fde8e0 0%, #e8b4a8 28%, #d4897a 55%, #b86b5c 80%, #8f4f45 100%)',
  },
  {
    slug: 'bronze',
    label: 'Bronze',
    gradient:
      'linear-gradient(135deg, #e8c9a8 0%, #c9956a 28%, #a87340 55%, #7a5228 80%, #4a3218 100%)',
  },
  {
    slug: 'blue',
    label: 'Bleu',
    gradient:
      'linear-gradient(135deg, #dce8f5 0%, #8eb4d9 28%, #4a7eb5 55%, #2d5a8a 80%, #1a3d5c 100%)',
  },
]

const BRACELET_COLOR_BY_SLUG = new Map(WATCH_BRACELET_COLORS.map((c) => [c.slug, c]))

/** Slugs valides (Set pour validation O(1)). */
const VALID_BRACELET_COLOR_SLUGS = new Set(WATCH_BRACELET_COLORS.map((c) => c.slug))

/**
 * @param {unknown} slug
 * @returns {boolean}
 */
export function isValidBraceletColorSlug(slug) {
  return typeof slug === 'string' && VALID_BRACELET_COLOR_SLUGS.has(slug)
}

/**
 * Définition complète d'une couleur (label + gradient) depuis son slug.
 * @param {string} slug
 * @returns {{ slug: string, label: string, gradient: string } | null}
 */
export function getBraceletColorBySlug(slug) {
  return BRACELET_COLOR_BY_SLUG.get(slug) || null
}

/**
 * Libellé lisible d'un slug (repli sur le slug brut si inconnu).
 * @param {string} slug
 * @returns {string}
 */
export function getBraceletColorLabel(slug) {
  return BRACELET_COLOR_BY_SLUG.get(slug)?.label || slug
}

/**
 * Normalise une valeur brute (base ou formulaire) en tableau de slugs valides,
 * dédupliqués et ordonnés selon `WATCH_BRACELET_COLORS`.
 * @param {unknown} value
 * @returns {string[]}
 */
export function normalizeBraceletColors(value) {
  if (!Array.isArray(value)) return []
  const seen = new Set()
  for (const raw of value) {
    if (isValidBraceletColorSlug(raw)) seen.add(raw)
  }
  return WATCH_BRACELET_COLORS.filter((c) => seen.has(c.slug)).map((c) => c.slug)
}
