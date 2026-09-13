/**
 * Sérialisation du sitemap, isolée de la lecture en base pour être testable.
 *
 * `api/sitemap.js` ne fait plus que rassembler les données (Supabase, manifest) et passer le
 * résultat ici.
 *
 * ## Pourquoi les pages statiques n'ont pas de `lastmod`
 *
 * `lastmod` n'a de valeur que s'il désigne la dernière modification **du contenu**. Les pages
 * statiques viennent du manifest : rien ne suit leur date de mise à jour, et y mettre la date du
 * jour ou celle du build serait faux. Google ignore purement et simplement le `lastmod` d'un site
 * dont toutes les valeurs sont constamment fraîches — ce qui décrédibiliserait aussi celles des
 * fiches montre et des articles, qui sont exactes. Elles restent donc sans `lastmod`.
 */

// Imports relatifs : ce module est chargé tel quel par la fonction serverless `api/sitemap.js`,
// hors de Vite, où l'alias `@/` n'existe pas.
import { withLocalePrefix } from '../i18n/localePaths.js'
import { slugifyBrand } from '../utils/brandSlug.js'
import { buildWatchSlug } from '../utils/watchSlug.js'

/** Visuels déclarés par fiche : au-delà, le sitemap grossit sans rien apporter au référencement. */
export const MAX_SITEMAP_IMAGES_PER_WATCH = 5

/**
 * Échappe les cinq caractères que XML réserve. Indispensable sur les URLs d'images : une URL
 * de rendu Supabase porte des paramètres séparés par `&`, qui casserait le document.
 *
 * @param {unknown} value
 * @returns {string}
 */
export function escapeXml(value) {
  if (value == null) return ''
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * Date `AAAA-MM-JJ` d'un timestamp, ou `null` s'il est absent ou illisible — plutôt que de
 * retomber sur la date du jour, qui inventerait une fraîcheur.
 *
 * @param {string | Date | null | undefined} value
 * @returns {string | null}
 */
export function toLastmod(value) {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString().split('T')[0]
}

/**
 * @param {{ loc: string, lastmod?: string | null, changefreq?: string, priority?: string,
 *   alternates?: string, images?: string[] }} entry
 * @returns {string}
 */
function renderUrl({ loc, lastmod, changefreq, priority, alternates = '', images = [] }) {
  const lines = [`    <loc>${escapeXml(loc)}</loc>`]
  if (alternates) lines.push(alternates)
  if (lastmod) lines.push(`    <lastmod>${lastmod}</lastmod>`)
  if (changefreq) lines.push(`    <changefreq>${changefreq}</changefreq>`)
  if (priority) lines.push(`    <priority>${priority}</priority>`)
  for (const image of images) {
    lines.push(
      `    <image:image>\n      <image:loc>${escapeXml(image)}</image:loc>\n    </image:image>`,
    )
  }
  return `  <url>\n${lines.join('\n')}\n  </url>\n`
}

/**
 * @param {string} baseUrl
 * @param {string} routePath
 * @param {{ enabled: boolean, locales: string[], defaultLocale: string }} i18n
 * @returns {string}
 */
function renderAlternates(baseUrl, routePath, i18n) {
  if (!i18n?.enabled) return ''
  const links = i18n.locales.map(
    (code) =>
      `    <xhtml:link rel="alternate" hreflang="${code}" href="${escapeXml(`${baseUrl}${withLocalePrefix(routePath || '/', code, i18n)}`)}"/>`,
  )
  links.push(
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(`${baseUrl}${withLocalePrefix(routePath || '/', i18n.defaultLocale, i18n)}`)}"/>`,
  )
  return links.join('\n')
}

/**
 * Dernière modification connue par marque : le maximum des `updated_at` de ses montres. Une page
 * marque n'a pas de date propre, mais son contenu **est** cette liste — la date est donc réelle,
 * contrairement à celle qu'on inventerait pour une page statique.
 *
 * @param {{ brand?: string, updated_at?: string }[]} watches
 * @returns {Map<string, string>} slug de marque → `AAAA-MM-JJ`
 */
export function buildBrandLastmods(watches) {
  const lastmods = new Map()
  for (const watch of watches) {
    const slug = slugifyBrand(watch?.brand)
    if (!slug) continue
    const lastmod = toLastmod(watch?.updated_at)
    if (!lastmod) continue
    const current = lastmods.get(slug)
    if (!current || lastmod > current) lastmods.set(slug, lastmod)
  }
  return lastmods
}

/**
 * @param {object} input
 * @param {string} input.baseUrl Origine sans slash final.
 * @param {{ path: string, priority: string, changefreq: string }[]} input.staticRoutes
 * @param {{ enabled: boolean, locales: string[], defaultLocale: string }} input.i18n
 * @param {{ id?: string, slug?: string, brand?: string, name?: string, reference?: string,
 *   updated_at?: string }[]} [input.watches]
 * @param {{ id?: string, updated_at?: string }[]} [input.articles]
 * @param {Map<string, string[]> | Record<string, string[]>} [input.imagesByWatchId]
 * @returns {string}
 */
export function buildSitemapXml({
  baseUrl,
  staticRoutes,
  i18n,
  watches = [],
  articles = [],
  imagesByWatchId = new Map(),
}) {
  const imagesFor = (watchId) => {
    const found =
      imagesByWatchId instanceof Map ? imagesByWatchId.get(watchId) : imagesByWatchId?.[watchId]
    if (!Array.isArray(found)) return []
    return found.filter(Boolean).slice(0, MAX_SITEMAP_IMAGES_PER_WATCH)
  }

  let xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"' +
    ' xmlns:xhtml="http://www.w3.org/1999/xhtml"' +
    ' xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n'

  for (const route of staticRoutes) {
    for (const code of i18n.locales) {
      const localizedPath = withLocalePrefix(route.path || '/', code, i18n)
      // `withLocalePrefix` rend « / » pour la racine ; le sitemap la veut sans slash final.
      xml += renderUrl({
        loc: `${baseUrl}${localizedPath === '/' ? '' : localizedPath}`,
        alternates: renderAlternates(baseUrl, route.path, i18n),
        changefreq: route.changefreq,
        priority: route.priority,
      })
    }
  }

  for (const watch of watches) {
    const slug = buildWatchSlug(watch)
    if (!slug) continue
    xml += renderUrl({
      loc: `${baseUrl}/montre/${slug}`,
      lastmod: toLastmod(watch.updated_at),
      changefreq: 'weekly',
      priority: '0.8',
      images: imagesFor(watch.id),
    })
  }

  const brandLastmods = buildBrandLastmods(watches)
  const brandSlugs = [
    ...new Set(watches.map((watch) => slugifyBrand(watch?.brand)).filter(Boolean)),
  ].sort()

  for (const slug of brandSlugs) {
    xml += renderUrl({
      loc: `${baseUrl}/collection/${slug}`,
      lastmod: brandLastmods.get(slug) ?? null,
      changefreq: 'weekly',
      priority: '0.75',
    })
  }

  for (const article of articles) {
    xml += renderUrl({
      loc: `${baseUrl}/blog/${article.id}`,
      lastmod: toLastmod(article.updated_at),
      changefreq: 'monthly',
      priority: '0.7',
    })
  }

  return `${xml}</urlset>`
}
