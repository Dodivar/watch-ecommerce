/**
 * Matières de bracelet sélectionnables (filtre collection + formulaire admin).
 *
 * Stockage côté base : tableau de slugs dans `watch_details.bracelet_materials`
 * (une montre peut combiner plusieurs matières). L'ancienne colonne
 * `bracelet_material` (singulier) reste en repli lecture legacy.
 *
 * Pour ajouter une matière : ajouter une ligne ici (slug stable) — aucune migration
 * SQL nécessaire, la colonne est un tableau de texte libre validé par cette liste.
 *
 * @type {Array<{ slug: string, label: string }>}
 */
export const WATCH_BRACELET_MATERIALS = [
  { slug: 'steel', label: 'Acier' },
  { slug: 'gold', label: 'Or' },
  { slug: 'leather', label: 'Cuir' },
  { slug: 'rubber', label: 'Caoutchouc' },
  { slug: 'titanium', label: 'Titane' },
  { slug: 'ceramic', label: 'Céramique' },
  { slug: 'fabric', label: 'Tissu / NATO' },
]

const BRACELET_MATERIAL_BY_SLUG = new Map(WATCH_BRACELET_MATERIALS.map((m) => [m.slug, m]))

/** Slugs valides (Set pour validation O(1)). */
const VALID_BRACELET_MATERIAL_SLUGS = new Set(WATCH_BRACELET_MATERIALS.map((m) => m.slug))

/**
 * Alias PrestaShop / libellés libres → slug.
 * Les clés sont normalisées (minuscules, sans accents) avant lookup.
 * @type {Record<string, string>}
 */
const PRESTASHOP_MATERIAL_ALIASES = {
  acier: 'steel',
  'acier inoxydable': 'steel',
  inox: 'steel',
  'acier inox': 'steel',
  or: 'gold',
  'or jaune': 'gold',
  'or rose': 'gold',
  'or blanc': 'gold',
  cuir: 'leather',
  'cuir veritable': 'leather',
  'cuir véritable': 'leather',
  caoutchouc: 'rubber',
  silicone: 'rubber',
  'caoutchouc silicone': 'rubber',
  titane: 'titanium',
  titanium: 'titanium',
  ceramique: 'ceramic',
  céramique: 'ceramic',
  tissu: 'fabric',
  nato: 'fabric',
  'tissu nato': 'fabric',
  nylon: 'fabric',
  steel: 'steel',
  gold: 'gold',
  leather: 'leather',
  rubber: 'rubber',
  ceramic: 'ceramic',
  fabric: 'fabric',
}

/**
 * @param {string} value
 * @returns {string}
 */
function normalizeLookupKey(value) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

/**
 * @param {unknown} slug
 * @returns {boolean}
 */
export function isValidBraceletMaterialSlug(slug) {
  return typeof slug === 'string' && VALID_BRACELET_MATERIAL_SLUGS.has(slug)
}

/**
 * @param {string} slug
 * @returns {{ slug: string, label: string } | null}
 */
export function getBraceletMaterialBySlug(slug) {
  return BRACELET_MATERIAL_BY_SLUG.get(slug) || null
}

/**
 * Libellé lisible d'un slug (repli sur le slug brut si inconnu).
 * @param {string} slug
 * @returns {string}
 */
export function getBraceletMaterialLabel(slug) {
  return BRACELET_MATERIAL_BY_SLUG.get(slug)?.label || slug
}

/**
 * Normalise une valeur brute (base ou formulaire) en slug valide ou chaîne vide.
 * @param {unknown} value
 * @returns {string}
 */
export function normalizeBraceletMaterial(value) {
  if (typeof value !== 'string' || !value.trim()) return ''
  const trimmed = value.trim()
  if (isValidBraceletMaterialSlug(trimmed)) return trimmed
  const mapped = mapPrestaShopBraceletMaterial(trimmed)
  return mapped || ''
}

/**
 * Convertit un libellé PrestaShop ou texte libre vers un slug connu.
 * @param {unknown} raw
 * @returns {string | null}
 */
export function mapPrestaShopBraceletMaterial(raw) {
  if (typeof raw !== 'string' || !raw.trim()) return null
  const key = normalizeLookupKey(raw)
  if (PRESTASHOP_MATERIAL_ALIASES[key]) return PRESTASHOP_MATERIAL_ALIASES[key]
  if (isValidBraceletMaterialSlug(key)) return key
  return null
}

/**
 * Normalise une valeur brute (base ou formulaire) en tableau de slugs valides,
 * dédupliqués et ordonnés selon `WATCH_BRACELET_MATERIALS`.
 * Accepte aussi une chaîne legacy (ancienne colonne `bracelet_material`).
 * @param {unknown} value
 * @returns {string[]}
 */
export function normalizeBraceletMaterials(value) {
  if (typeof value === 'string' && value.trim()) {
    const slug = normalizeBraceletMaterial(value)
    return slug ? [slug] : []
  }
  if (!Array.isArray(value)) return []
  const seen = new Set()
  for (const raw of value) {
    if (typeof raw === 'string' && isValidBraceletMaterialSlug(raw)) seen.add(raw)
  }
  return WATCH_BRACELET_MATERIALS.filter((m) => seen.has(m.slug)).map((m) => m.slug)
}
