import { resolveSpecKey } from './watchSpecVocabulary.js'

/**
 * Couleurs de cadran sélectionnables (formulaire admin + fiche montre), pendant de
 * `watchBraceletColors.js`.
 *
 * Différence de stockage avec le bracelet : `watch_details.dial_color` reste une colonne de
 * texte libre, déjà remplie en français (« Noir », « Bleu / Blanc », « Ice Blue »…) et lue
 * telle quelle par la traduction à l'affichage (`translateSpecList('color', …)`) comme par
 * l'appariement des alertes (`utils/watchMatchCore.js`). Plutôt qu'une migration vers des
 * slugs, chaque pastille écrit sa `value` française, et la lecture reconnaît une pastille en
 * passant par le vocabulaire (`resolveSpecKey('color', …)`). Les anciennes saisies retrouvent
 * donc leur pastille sans réécriture, et ce qui n'est pas reconnu reste du texte (« Autre »).
 *
 * `value` est volontairement figée en français, indépendamment de la langue du site : c'est
 * elle que le vocabulaire sait relire. Chaque `value` doit résoudre vers le `labelKey` de sa
 * ligne (vérifié par `watchDialColors.test.js`).
 *
 * Données pures, imports relatifs : ce fichier doit rester chargeable hors Vite, comme les
 * autres référentiels lus par le backend.
 *
 * @type {Array<{ slug: string, value: string, labelKey: string, gradient: string }>}
 */
export const WATCH_DIAL_COLORS = [
  {
    slug: 'black',
    value: 'Noir',
    labelKey: 'watchSpec.color.black',
    gradient:
      'linear-gradient(135deg, #5c5c5c 0%, #3d3d3d 25%, #262626 55%, #141414 80%, #050505 100%)',
  },
  {
    slug: 'white',
    value: 'Blanc',
    labelKey: 'watchSpec.color.white',
    gradient: 'linear-gradient(135deg, #ffffff 0%, #fafafa 40%, #ececec 75%, #d9d9d9 100%)',
  },
  {
    slug: 'silver',
    value: 'Argenté',
    labelKey: 'watchSpec.color.silver',
    gradient:
      'linear-gradient(135deg, #ffffff 0%, #e6e8ea 28%, #b7bcc1 55%, #8a9096 80%, #5f656b 100%)',
  },
  {
    slug: 'grey',
    value: 'Gris',
    labelKey: 'watchSpec.color.grey',
    gradient: 'linear-gradient(135deg, #d4d6d9 0%, #a3a7ad 35%, #6f747b 70%, #4a4f55 100%)',
  },
  {
    slug: 'blue',
    value: 'Bleu',
    labelKey: 'watchSpec.color.blue',
    gradient:
      'linear-gradient(135deg, #dce8f5 0%, #8eb4d9 28%, #4a7eb5 55%, #2d5a8a 80%, #1a3d5c 100%)',
  },
  {
    slug: 'green',
    value: 'Vert',
    labelKey: 'watchSpec.color.green',
    gradient: 'linear-gradient(135deg, #cfe6d3 0%, #6fa77a 35%, #2f6b45 70%, #17402a 100%)',
  },
  {
    slug: 'red',
    value: 'Rouge',
    labelKey: 'watchSpec.color.red',
    gradient: 'linear-gradient(135deg, #f7c9c4 0%, #e0685c 35%, #b8281e 70%, #7a130d 100%)',
  },
  {
    slug: 'burgundy',
    value: 'Bordeaux',
    labelKey: 'watchSpec.color.burgundy',
    gradient: 'linear-gradient(135deg, #d9a3ad 0%, #9c3b4e 35%, #6b1a2c 70%, #3f0a17 100%)',
  },
  {
    slug: 'brown',
    value: 'Marron',
    labelKey: 'watchSpec.color.brown',
    gradient: 'linear-gradient(135deg, #e0c7ad 0%, #a97c55 35%, #6b4a2f 70%, #3d2a1a 100%)',
  },
  {
    slug: 'champagne',
    value: 'Champagne',
    labelKey: 'watchSpec.color.champagne',
    gradient: 'linear-gradient(135deg, #fbf3dc 0%, #ecd9a8 35%, #d1b87a 70%, #a58f52 100%)',
  },
  {
    slug: 'gold',
    value: 'Doré',
    labelKey: 'watchSpec.color.gold',
    gradient:
      'linear-gradient(135deg, #fdf3c4 0%, #f4d97b 28%, #d9a83a 55%, #a9781c 80%, #7c5510 100%)',
  },
  {
    slug: 'pink',
    value: 'Rose',
    labelKey: 'watchSpec.color.pink',
    gradient: 'linear-gradient(135deg, #fdebf1 0%, #f5b8cc 35%, #e27fa1 70%, #b44d73 100%)',
  },
  {
    slug: 'purple',
    value: 'Violet',
    labelKey: 'watchSpec.color.purple',
    gradient: 'linear-gradient(135deg, #e3d4f2 0%, #a57fd0 35%, #6a3fa0 70%, #3d1f63 100%)',
  },
  {
    slug: 'turquoise',
    value: 'Turquoise',
    labelKey: 'watchSpec.color.turquoise',
    gradient: 'linear-gradient(135deg, #d4f5f2 0%, #7fdcd3 35%, #2fb3a8 70%, #17756e 100%)',
  },
  {
    slug: 'beige',
    value: 'Beige',
    labelKey: 'watchSpec.color.beige',
    gradient: 'linear-gradient(135deg, #faf4ea 0%, #ebdcc3 35%, #d4bf9c 70%, #a8916c 100%)',
  },
  {
    slug: 'orange',
    value: 'Orange',
    labelKey: 'watchSpec.color.orange',
    gradient: 'linear-gradient(135deg, #fde0c2 0%, #f6a55a 35%, #e0741f 70%, #a14b0c 100%)',
  },
  {
    slug: 'yellow',
    value: 'Jaune',
    labelKey: 'watchSpec.color.yellow',
    gradient: 'linear-gradient(135deg, #fff9d1 0%, #fde776 35%, #f2c81f 70%, #b8910a 100%)',
  },
  {
    slug: 'bronze',
    value: 'Bronze',
    labelKey: 'watchSpec.color.bronze',
    gradient:
      'linear-gradient(135deg, #e8c9a8 0%, #c9956a 28%, #a87340 55%, #7a5228 80%, #4a3218 100%)',
  },
  {
    slug: 'copper',
    value: 'Cuivre',
    labelKey: 'watchSpec.color.copper',
    gradient: 'linear-gradient(135deg, #f6d3bd 0%, #df9467 35%, #b8622f 70%, #7c3c17 100%)',
  },
]

const DIAL_COLOR_BY_SLUG = new Map(WATCH_DIAL_COLORS.map((c) => [c.slug, c]))
const DIAL_COLOR_BY_SPEC_KEY = new Map(WATCH_DIAL_COLORS.map((c) => [c.labelKey, c]))

/** Séparateurs des saisies composées, comme `translateSpecList` : « Noir / Blanc ». */
const COMPOUND_SEPARATOR = /\s*[,/]\s*/

/**
 * Définition complète d'une couleur de cadran depuis son slug.
 * @param {string} slug
 * @returns {{ slug: string, value: string, labelKey: string, gradient: string } | null}
 */
export function getDialColorBySlug(slug) {
  return DIAL_COLOR_BY_SLUG.get(slug) || null
}

/**
 * Couleur de cadran correspondant à un terme saisi (« noir », « Argentée », « Doré »…), via
 * le vocabulaire. `null` si le terme n'est pas l'une des pastilles.
 * @param {unknown} text
 * @returns {{ slug: string, value: string, labelKey: string, gradient: string } | null}
 */
export function getDialColorByText(text) {
  const key = resolveSpecKey('color', text)
  return key ? DIAL_COLOR_BY_SPEC_KEY.get(key) || null : null
}

/**
 * Découpe une valeur brute de `dial_color` en termes, dans l'ordre de saisie.
 * @param {unknown} raw
 * @returns {string[]}
 */
export function splitDialColor(raw) {
  const text = String(raw ?? '').trim()
  if (!text) return []
  return text.split(COMPOUND_SEPARATOR).filter(Boolean)
}

/**
 * Sépare une valeur brute de `dial_color` en pastilles reconnues et en texte libre (« Autre »).
 * Les pastilles gardent l'ordre de saisie (un cadran « Blanc / Noir » n'est pas un « Noir /
 * Blanc »), sans doublon.
 *
 * @param {unknown} raw
 * @returns {{ slugs: string[], other: string }}
 */
export function parseDialColor(raw) {
  const slugs = []
  const others = []
  for (const part of splitDialColor(raw)) {
    const color = getDialColorByText(part)
    if (!color) others.push(part)
    else if (!slugs.includes(color.slug)) slugs.push(color.slug)
  }
  return { slugs, other: others.join(', ') }
}

/**
 * Inverse de `parseDialColor` : la valeur texte à écrire en base (`''` si rien).
 * @param {string[]} slugs
 * @param {string} [other]
 * @returns {string}
 */
export function serializeDialColor(slugs, other = '') {
  const parts = (Array.isArray(slugs) ? slugs : [])
    .map((slug) => getDialColorBySlug(slug)?.value)
    .filter(Boolean)
  const free = String(other ?? '').trim()
  if (free) parts.push(free)
  return parts.join(' / ')
}
