/**
 * HTML servi pour les pages dont le contenu vient de la base : fiche montre, collection d'une
 * marque, article de blog.
 *
 * Ces routes n'ont pas de fichier pré-rendu : Vercel les sert depuis `spa-fallback.html`, la
 * coquille de l'accueil. Sans JavaScript, chaque fiche portait donc le titre, la description et
 * la canonique de l'accueil, avec une dizaine de mots de texte et aucune donnée structurée.
 * Google rattrape une partie de ces pages au rendu. Les robots des moteurs IA et les aperçus de
 * partage, qui n'exécutent pas le JavaScript, n'en voyaient rien.
 *
 * `api/render-page.js` lit la ligne en base puis appelle ce module, qui écrit dans la coquille :
 * - la tête de la page (titre, description, canonique, Open Graph) ;
 * - le JSON-LD (global, `Product` ou `Article`, fil d'Ariane), marqué `data-ssr-head` pour que
 *   le client le retire au démarrage avant de poser le sien ;
 * - un contenu minimal dans `#app` (titre, prix, description, liens), que Vue remplace au montage.
 *
 * Toutes les fonctions sont pures, et donc testables sans Supabase ni Vercel. Ce module reste
 * hors des alias `@/` : il est chargé par Node dans la fonction serverless.
 */

import { buildBreadcrumbStructuredData } from './buildBreadcrumbStructuredData.js'
import { buildGlobalStructuredData } from './buildGlobalStructuredData.js'
import { buildWatchProductStructuredData } from './buildWatchProductStructuredData.js'
import { resolveWatchSaleState } from './watchCatalogDisplay.js'
import { buildWatchPath } from '../utils/watchSlug.js'
import { buildBrandCollectionPath } from '../utils/collectionRoutes.js'
import { getEffectiveWatchPrice } from '../utils/watchPricing.js'
import { buildArticlePath } from '../utils/articleSlug.js'

/** Attribut posé sur tout ce que le serveur ajoute et que le client doit retirer au démarrage. */
export const SSR_HEAD_ATTR = 'data-ssr-head'

const LABELS = {
  fr: {
    home: 'Accueil',
    collection: 'Collection',
    blog: 'Blog',
    reference: 'Référence',
    year: 'Année',
    condition: 'État',
    sold: 'Vendue',
    pricePrefix: 'Prix :',
    genericDescription: 'Montre {brand} {reference}',
    allBrand: 'Toutes les montres {brand}',
    seeCollection: 'Voir toute la collection',
    contact: 'Nous contacter',
    sell: 'Faire estimer ou vendre votre montre',
  },
  en: {
    home: 'Home',
    collection: 'Collection',
    blog: 'Blog',
    reference: 'Reference',
    year: 'Year',
    condition: 'Condition',
    sold: 'Sold',
    pricePrefix: 'Price:',
    genericDescription: '{brand} {reference} watch',
    allBrand: 'All {brand} watches',
    seeCollection: 'See the whole collection',
    contact: 'Contact us',
    sell: 'Have your watch appraised or sell it',
  },
  de: {
    home: 'Startseite',
    collection: 'Kollektion',
    blog: 'Blog',
    reference: 'Referenz',
    year: 'Jahr',
    condition: 'Zustand',
    sold: 'Verkauft',
    pricePrefix: 'Preis:',
    genericDescription: 'Uhr {brand} {reference}',
    allBrand: 'Alle {brand}-Uhren',
    seeCollection: 'Die ganze Kollektion ansehen',
    contact: 'Kontakt',
    sell: 'Uhr schätzen lassen oder verkaufen',
  },
}

function labelsFor(locale) {
  return LABELS[locale] ?? LABELS.fr
}

export function escapeHtmlText(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export function escapeHtmlAttr(value) {
  return escapeHtmlText(value).replace(/"/g, '&quot;')
}

/**
 * JSON-LD sûr dans un `<script>` : `</script>` ou `<!--` dans un texte venu de la base
 * fermeraient la balise.
 */
export function serializeJsonLd(value) {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}

function insertBeforeHeadEnd(html, markup) {
  if (!/<\/head>/i.test(html)) return html
  return html.replace(/<\/head>/i, `    ${markup}\n  </head>`)
}

/**
 * Remplace le `<title>`, ou l'ajoute s'il manque.
 * @param {string} html
 * @param {string} title
 */
export function upsertTitle(html, title) {
  const tag = `<title>${escapeHtmlText(title)}</title>`
  if (/<title>[\s\S]*?<\/title>/i.test(html)) {
    return html.replace(/<title>[\s\S]*?<\/title>/i, () => tag)
  }
  return insertBeforeHeadEnd(html, tag)
}

/**
 * Remplace le `content` d'une balise `<meta>`, ou l'ajoute si elle manque.
 *
 * `replaceMetaContent` (`staticRouteHead.js`) ne fait que remplacer : la coquille de repli n'a
 * plus de canonique ni de `og:url`, et une simple substitution laisserait la fiche sans elles.
 *
 * @param {string} html
 * @param {'name' | 'property'} attr
 * @param {string} key
 * @param {string} value
 */
export function upsertMeta(html, attr, key, value) {
  const pattern = new RegExp(`<meta\\s+${attr}="${escapeRegExp(key)}"\\s+content="[^"]*"\\s*/?>`, 'i')
  const tag = `<meta ${attr}="${key}" content="${escapeHtmlAttr(value)}" />`
  if (pattern.test(html)) return html.replace(pattern, () => tag)
  return insertBeforeHeadEnd(html, tag)
}

/**
 * Remplace le `href` de `<link rel="canonical">`, ou l'ajoute s'il manque.
 * @param {string} html
 * @param {string} href
 */
export function upsertCanonical(html, href) {
  const tag = `<link rel="canonical" href="${escapeHtmlAttr(href)}" />`
  const pattern = /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i
  if (pattern.test(html)) return html.replace(pattern, () => tag)
  return insertBeforeHeadEnd(html, tag)
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Applique à la coquille la tête et le contenu d'une page.
 *
 * @param {string} shell `spa-fallback.html`.
 * @param {{ title: string, description: string, canonicalUrl: string, ogType?: string,
 *   ogImage?: string, jsonLd?: Record<string, unknown>[], bodyHtml?: string }} page
 * @returns {string}
 */
export function renderDynamicPage(shell, page) {
  let html = upsertTitle(shell, page.title)
  html = upsertMeta(html, 'name', 'description', page.description)
  html = upsertCanonical(html, page.canonicalUrl)
  html = upsertMeta(html, 'property', 'og:type', page.ogType || 'website')
  html = upsertMeta(html, 'property', 'og:url', page.canonicalUrl)
  html = upsertMeta(html, 'property', 'og:title', page.title)
  html = upsertMeta(html, 'property', 'og:description', page.description)
  html = upsertMeta(html, 'name', 'twitter:url', page.canonicalUrl)
  html = upsertMeta(html, 'name', 'twitter:title', page.title)
  html = upsertMeta(html, 'name', 'twitter:description', page.description)
  if (page.ogImage) {
    html = upsertMeta(html, 'property', 'og:image', page.ogImage)
    html = upsertMeta(html, 'name', 'twitter:image', page.ogImage)
  }

  const scripts = (page.jsonLd ?? [])
    .filter(Boolean)
    .map(
      (schema) =>
        `<script type="application/ld+json" ${SSR_HEAD_ATTR}>${serializeJsonLd(schema)}</script>`,
    )
  if (scripts.length) html = insertBeforeHeadEnd(html, scripts.join('\n    '))

  if (page.bodyHtml) {
    html = html.replace(/<div id="app">\s*<\/div>/i, () => `<div id="app">${page.bodyHtml}</div>`)
  }

  return html
}

/** Description courte et lisible : texte brut, espaces normalisés, coupée sur un mot. */
export function summarize(text, max = 160) {
  const plain = stripMarkdown(text).replace(/\s+/g, ' ').trim()
  if (plain.length <= max) return plain
  const cut = plain.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > 80 ? cut.slice(0, lastSpace) : cut).trim()}…`
}

/** Markdown → texte brut (assez pour un aperçu ; le rendu riche reste celui du client). */
export function stripMarkdown(text) {
  return String(text ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^\s{0,3}(#{1,6}|>|[-*+]|\d+\.)\s+/gm, '')
    .replace(/[*_`~]+/g, '')
}

/** Paragraphes HTML échappés depuis un texte libre ou du Markdown. */
export function textToParagraphs(text) {
  return String(text ?? '')
    .split(/\n\s*\n/)
    .map((block) => stripMarkdown(block).replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .map((block) => `<p>${escapeHtmlText(block)}</p>`)
    .join('')
}

function fill(template, values) {
  return String(template ?? '').replace(/\{(\w+)\}/g, (_, key) => values[key] ?? '')
}

function formatEuro(amount) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
  }).format(amount)
}

function breadcrumbHtml(crumbs) {
  const items = crumbs
    .map(({ name, path }) => `<a href="${escapeHtmlAttr(path)}">${escapeHtmlText(name)}</a>`)
    .join(' › ')
  return `<nav aria-label="Breadcrumb">${items}</nav>`
}

function linkList(links) {
  return `<ul>${links
    .map(({ href, label }) => `<li><a href="${escapeHtmlAttr(href)}">${escapeHtmlText(label)}</a></li>`)
    .join('')}</ul>`
}

/**
 * Méta-description d'une fiche, partagée avec `WatchDetail.vue` pour que la page ne change pas
 * de description une fois le JavaScript exécuté.
 *
 * La description en base est du Markdown long : copiée telle quelle, elle donnait dans Google
 * un extrait commençant par `**Rolex …**`, coupé avant l'argument et le prix. On en garde un
 * résumé en texte brut, assez court pour que la garantie et le prix tiennent dans ~160 signes.
 *
 * @param {object} input
 * @param {{ description?: string }} input.watch
 * @param {number} input.price Prix effectif ; `0` = pas de prix.
 * @param {string} [input.descriptionSuffix] `seo.watchDetail.descriptionSuffix`.
 * @param {string} input.pricePrefix Libellé « Prix : ».
 * @param {string} input.genericDescription Repli quand la montre n'a pas de description.
 * @param {(amount: number) => string} input.formatPrice
 * @returns {string}
 */
export function buildWatchMetaDescription({
  watch,
  price,
  descriptionSuffix = '',
  pricePrefix,
  genericDescription,
  formatPrice,
}) {
  const hasPrice = Number.isFinite(price) && price > 0
  const claim = descriptionSuffix ? ` ${descriptionSuffix}` : ''
  const priceText = hasPrice ? ` ${pricePrefix} ${formatPrice(price)}` : ''
  const room = Math.max(70, 160 - claim.length - priceText.length)
  const summary = summarize(watch?.description, room)
  // Texte coupé : les points de suspension le disent, un point final ferait lire « … est un. ».
  const base = summary.endsWith('…')
    ? summary
    : `${(summary || genericDescription).replace(/[.\s]+$/, '')}.`
  return `${base}${claim}${priceText}`.trim()
}

/**
 * Ligne `watches` (colonnes snake_case) → forme normalisée qu'attendent les constructeurs
 * partagés avec `WatchDetail.vue`.
 */
export function normalizeWatchRow(row, imageUrls = []) {
  return {
    id: row.id,
    slug: row.slug,
    brand: row.brand,
    name: row.name,
    reference: row.reference,
    year: row.year,
    condition: row.condition,
    description: row.description,
    price: row.price,
    promotionPrice: row.promotion_price ?? null,
    isAvailable: row.is_available !== false,
    isSold: row.is_sold === true,
    isIncoming: row.is_incoming === true,
    stockQuantity: row.stock_quantity ?? null,
    images: imageUrls,
  }
}

/**
 * Fiche montre. Titre, description et canonique sont ceux que `WatchDetail.vue` pose au rendu,
 * pour que Google ne voie pas deux versions de la même page.
 *
 * @param {object} input
 * @param {ReturnType<typeof normalizeWatchRow>} input.watch
 * @param {Record<string, any>} input.siteConfig Manifest aplati dans la langue de la page.
 * @param {string} input.baseUrl
 * @param {string} input.locale
 * @param {'new' | 'used' | null} [input.conditionSchema]
 */
export function buildWatchPage({ watch, siteConfig, baseUrl, locale, conditionSchema = null }) {
  const seo = siteConfig?.seo?.watchDetail ?? {}
  const labels = labelsFor(locale)
  const price = getEffectiveWatchPrice(watch)
  const hasPrice = Number.isFinite(price) && price > 0
  const path = buildWatchPath(watch)
  // Sans préfixe de langue, comme au rendu : le contenu vient de la base et n'est pas traduit.
  const canonicalUrl = `${baseUrl}${path}`

  const title = `${watch.name}${hasPrice ? ` - ${formatEuro(price)}` : ''}${seo.titlePriceSuffix ?? ''}`
  const description = buildWatchMetaDescription({
    watch,
    price,
    descriptionSuffix: seo.descriptionSuffix,
    pricePrefix: labels.pricePrefix,
    genericDescription: fill(labels.genericDescription, {
      brand: watch.brand ?? '',
      reference: watch.reference ?? '',
    }).trim(),
    formatPrice: formatEuro,
  })

  const saleState = resolveWatchSaleState(siteConfig, watch)
  const crumbs = [{ name: labels.home, path: '/' }]
  if (watch.brand) crumbs.push({ name: watch.brand, path: buildBrandCollectionPath(watch.brand) })
  crumbs.push({ name: watch.name, path })

  const facts = [
    watch.brand,
    watch.reference ? `${labels.reference} ${watch.reference}` : '',
    watch.year ? `${labels.year} ${watch.year}` : '',
    watch.condition ? `${labels.condition} : ${watch.condition}` : '',
  ].filter(Boolean)

  const image = watch.images?.[0]
  const bodyHtml = [
    '<main>',
    breadcrumbHtml(crumbs),
    `<h1>${escapeHtmlText(watch.name)}</h1>`,
    facts.length ? `<p>${escapeHtmlText(facts.join(' · '))}</p>` : '',
    saleState === 'sold'
      ? `<p>${escapeHtmlText(labels.sold)}</p>`
      : hasPrice
        ? `<p>${escapeHtmlText(formatEuro(price))}</p>`
        : '',
    image ? `<img src="${escapeHtmlAttr(image)}" alt="${escapeHtmlAttr(watch.name)}" width="600" />` : '',
    textToParagraphs(watch.description),
    linkList(
      [
        watch.brand && { href: buildBrandCollectionPath(watch.brand), label: fill(labels.allBrand, { brand: watch.brand }) },
        { href: '/collection', label: labels.seeCollection },
        siteConfig?.features?.estimation && { href: '/rachat', label: labels.sell },
        siteConfig?.features?.contact && { href: '/contact', label: labels.contact },
      ].filter(Boolean),
    ),
    '</main>',
  ].join('')

  return {
    title,
    description,
    canonicalUrl,
    ogType: 'product',
    ogImage: image,
    bodyHtml,
    jsonLd: [
      ...buildGlobalStructuredData(siteConfig, baseUrl),
      buildWatchProductStructuredData({
        watch,
        price,
        canonicalUrl,
        baseUrl,
        sellerName: seo.structuredDataSellerName,
        unknownBrandLabel: watch.brand || '',
        saleState,
        conditionSchema,
      }),
      buildBreadcrumbStructuredData(baseUrl, crumbs),
    ],
  }
}

/**
 * Collection d'une marque : titre et description du bloc `seo.brandCollection`, comme
 * `WatchesCollection.vue`, et la liste des montres en lien direct.
 *
 * @param {object} input
 * @param {string} input.brand Libellé exact en base.
 * @param {ReturnType<typeof normalizeWatchRow>[]} input.watches Montres disponibles de la marque.
 * @param {Record<string, any>} input.siteConfig Manifest aplati.
 * @param {string} input.baseUrl
 * @param {string} input.locale
 */
export function buildBrandPage({ brand, watches, siteConfig, baseUrl, locale }) {
  const seo = siteConfig?.seo?.brandCollection ?? {}
  const labels = labelsFor(locale)
  const path = buildBrandCollectionPath(brand)
  const canonicalUrl = `${baseUrl}${path}`
  const title = fill(seo.title || '{brand} | Collection', { brand })
  const description = fill(seo.metaDescription || 'Montres {brand} disponibles.', { brand })
  const heading = title.split(' | ')[0]
  const crumbs = [
    { name: labels.home, path: '/' },
    { name: labels.collection, path: '/collection' },
    { name: brand, path },
  ]

  const items = watches.map((watch) => {
    const price = getEffectiveWatchPrice(watch)
    const suffix = Number.isFinite(price) && price > 0 ? ` — ${formatEuro(price)}` : ''
    return { href: buildWatchPath(watch), label: `${watch.name}${suffix}` }
  })

  const bodyHtml = [
    '<main>',
    breadcrumbHtml(crumbs),
    `<h1>${escapeHtmlText(heading)}</h1>`,
    `<p>${escapeHtmlText(description)}</p>`,
    items.length ? linkList(items) : '',
    linkList([{ href: '/collection', label: labels.seeCollection }]),
    '</main>',
  ].join('')

  return {
    title,
    description,
    canonicalUrl,
    ogType: 'website',
    bodyHtml,
    jsonLd: [
      ...buildGlobalStructuredData(siteConfig, baseUrl),
      buildBreadcrumbStructuredData(baseUrl, crumbs),
    ],
  }
}

/**
 * Article de blog : mêmes titre, description et `Article` JSON-LD que `BlogDetail.vue`.
 *
 * @param {object} input
 * @param {{ id: string, title: string, text?: string, categories?: string[],
 *   created_at?: string, updated_at?: string }} input.article
 * @param {Record<string, any>} input.siteConfig Manifest aplati.
 * @param {string} input.baseUrl
 * @param {string} input.locale
 * @param {string} [input.logoUrl] Visuel de l'éditeur (`og:image` de la coquille).
 */
export function buildArticlePage({ article, siteConfig, baseUrl, locale, logoUrl = '' }) {
  const seo = siteConfig?.seo?.blog ?? {}
  const labels = labelsFor(locale)
  const path = buildArticlePath(article)
  const canonicalUrl = `${baseUrl}${path}`
  const title = `${article.title} ${seo.articleTitleBlogSuffix ?? ''}`.trim()
  const firstParagraph = String(article.text ?? '').split('\n\n')[0]?.replace(/[#*]/g, '').trim() || ''
  const description = firstParagraph.substring(0, 160) || summarize(article.text)
  const published = article.created_at ? new Date(article.created_at).toISOString() : undefined
  const modified = article.updated_at ? new Date(article.updated_at).toISOString() : published
  const publisherName = seo.structuredDataPublisherName || siteConfig?.brand?.displayName || ''
  const crumbs = [
    { name: labels.home, path: '/' },
    { name: labels.blog, path: '/blog' },
    { name: article.title, path },
  ]

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description,
    ...(published ? { datePublished: published } : {}),
    ...(modified ? { dateModified: modified } : {}),
    author: { '@type': 'Organization', name: publisherName, url: baseUrl },
    publisher: {
      '@type': 'Organization',
      name: publisherName,
      url: baseUrl,
      ...(logoUrl ? { logo: { '@type': 'ImageObject', url: logoUrl } } : {}),
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
    ...(logoUrl ? { image: logoUrl } : {}),
    ...(Array.isArray(article.categories) && article.categories.length
      ? { keywords: article.categories.join(', ') }
      : {}),
  }

  const bodyHtml = [
    '<main><article>',
    breadcrumbHtml(crumbs),
    `<h1>${escapeHtmlText(article.title)}</h1>`,
    published ? `<p><time datetime="${escapeHtmlAttr(published)}">${escapeHtmlText(published.slice(0, 10))}</time></p>` : '',
    textToParagraphs(article.text),
    '</article></main>',
  ].join('')

  return {
    title,
    description,
    canonicalUrl,
    ogType: 'article',
    bodyHtml,
    jsonLd: [
      ...buildGlobalStructuredData(siteConfig, baseUrl),
      articleSchema,
      buildBreadcrumbStructuredData(baseUrl, crumbs),
    ],
  }
}
