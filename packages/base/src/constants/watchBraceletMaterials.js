import { t } from '@/i18n'

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
 * Le libellé n'est pas stocké ici mais désigné par une clé de catalogue : ces valeurs
 * s'affichent aussi sur les sites anglais et allemand.
 *
 * @type {Array<{ slug: string, labelKey: string }>}
 */
export const WATCH_BRACELET_MATERIALS = [
  { slug: 'steel', labelKey: 'watchSpec.material.steel' },
  { slug: 'gold', labelKey: 'watchSpec.material.gold' },
  { slug: 'leather', labelKey: 'watchSpec.material.leather' },
  { slug: 'rubber', labelKey: 'watchSpec.material.rubber' },
  { slug: 'titanium', labelKey: 'watchSpec.material.titanium' },
  { slug: 'ceramic', labelKey: 'watchSpec.material.ceramic' },
  { slug: 'fabric', labelKey: 'watchSpec.material.fabric' },
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
  'cuir de crocodile': 'leather',
  'cuir crocodile': 'leather',
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
 * @returns {{ slug: string, labelKey: string } | null}
 */
export function getBraceletMaterialBySlug(slug) {
  return BRACELET_MATERIAL_BY_SLUG.get(slug) || null
}

/**
 * Libellé traduit d'un slug (repli sur le slug brut si inconnu).
 * @param {string} slug
 * @returns {string}
 */
export function getBraceletMaterialLabel(slug) {
  const material = BRACELET_MATERIAL_BY_SLUG.get(slug)
  return material ? t(material.labelKey) : slug
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
    // Passer par le mappeur d'alias et non par la seule validation de slug : la colonne
    // accepte du texte libre, et une saisie « Acier » y était jusqu'ici silencieusement
    // effacée à la lecture — la montre s'affichait sans matière de bracelet.
    const slug = mapPrestaShopBraceletMaterial(raw)
    if (slug) seen.add(slug)
  }
  return WATCH_BRACELET_MATERIALS.filter((m) => seen.has(m.slug)).map((m) => m.slug)
}
