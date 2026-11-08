/**
 * HTML des pages issues de la base (fiche montre, marque, article), servi par
 * `api/render-page.js` aux robots qui n'exécutent pas le JavaScript.
 */
import { describe, expect, it } from 'vitest'

import {
  buildArticlePage,
  buildBrandPage,
  buildWatchMetaDescription,
  buildWatchPage,
  normalizeWatchRow,
  renderDynamicPage,
  serializeJsonLd,
  textToParagraphs,
  upsertCanonical,
  upsertMeta,
} from './dynamicPageHtml.js'
import { stripPageIdentity } from './staticRouteHead.js'

const BASE = 'https://www.exemple.fr'

/** Coquille réduite, au format de `dist/spa-fallback.html` (sans canonique ni `og:url`). */
const SHELL = `<!doctype html>
<html lang="fr">
  <head>
    <title>Accueil – Boutique</title>
    <meta name="description" content="Description de l'accueil" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="Accueil – Boutique" />
    <meta property="og:description" content="Description de l'accueil" />
    <meta property="og:image" content="https://www.exemple.fr/logo.png" />
    <meta name="twitter:title" content="Accueil – Boutique" />
    <meta name="twitter:description" content="Description de l'accueil" />
  </head>
  <body>
    <div id="app"></div>
  </body>
</html>`

const SITE = {
  brand: { displayName: 'Boutique' },
  features: { collection: true, estimation: true, contact: true },
  seo: {
    watchDetail: {
      titlePriceSuffix: ' | Boutique',
      descriptionSuffix: 'Garantie 1 an.',
      structuredDataSellerName: 'Boutique',
    },
    brandCollection: {
      title: "Montres {brand} d'occasion | Boutique",
      metaDescription: 'Montres {brand} sélectionnées.',
    },
    blog: { articleTitleBlogSuffix: '| Blog Boutique', structuredDataPublisherName: 'Boutique' },
  },
}

const row = (overrides = {}) => ({
  id: 'w1',
  slug: 'rolex-submariner-126610ln',
  brand: 'Rolex',
  name: 'Rolex Submariner',
  reference: '126610LN',
  year: 2021,
  condition: 'Très bon état',
  description: 'Boîte et papiers.\n\nRévisée en 2024.',
  price: 12500,
  promotion_price: null,
  is_available: true,
  is_sold: false,
  ...overrides,
})

const jsonLdOf = (html) =>
  [...html.matchAll(/<script type="application\/ld\+json" data-ssr-head>([\s\S]*?)<\/script>/g)].map(
    (match) => JSON.parse(match[1]),
  )

describe('upsertCanonical / upsertMeta', () => {
  it('ajoute la canonique absente de la coquille de repli', () => {
    const html = upsertCanonical(SHELL, `${BASE}/montre/x`)
    expect(html).toContain(`<link rel="canonical" href="${BASE}/montre/x" />`)
    expect(html.indexOf('rel="canonical"')).toBeLessThan(html.indexOf('</head>'))
  })

  it('remplace la canonique existante au lieu d’en ajouter une seconde', () => {
    const once = upsertCanonical(SHELL, `${BASE}/a`)
    const twice = upsertCanonical(once, `${BASE}/b`)
    expect(twice.match(/rel="canonical"/g)).toHaveLength(1)
    expect(twice).toContain(`${BASE}/b`)
  })

  it('remplace une meta existante et ajoute une meta absente', () => {
    const replaced = upsertMeta(SHELL, 'name', 'description', 'Nouvelle')
    expect(replaced.match(/name="description"/g)).toHaveLength(1)
    expect(replaced).toContain('content="Nouvelle"')
    expect(upsertMeta(SHELL, 'property', 'og:url', `${BASE}/x`)).toContain(
      `<meta property="og:url" content="${BASE}/x" />`,
    )
  })

  it('échappe les valeurs venues de la base', () => {
    expect(upsertMeta(SHELL, 'name', 'description', 'a "b" <c>')).toContain(
      'content="a &quot;b&quot; &lt;c&gt;"',
    )
  })
})

describe('serializeJsonLd', () => {
  it('ne laisse pas un texte fermer la balise script', () => {
    const out = serializeJsonLd({ name: '</script><script>alert(1)</script>' })
    expect(out).not.toContain('</script>')
    expect(JSON.parse(out).name).toBe('</script><script>alert(1)</script>')
  })
})

describe('textToParagraphs', () => {
  it('découpe en paragraphes échappés et retire la syntaxe Markdown', () => {
    expect(textToParagraphs('## Titre\n\n**Gras** et [lien](https://x.fr) <b>')).toBe(
      '<p>Titre</p><p>Gras et lien</p>',
    )
  })
})

describe('buildWatchPage', () => {
  const page = buildWatchPage({
    watch: normalizeWatchRow(row(), ['https://cdn.test/a.webp']),
    siteConfig: SITE,
    baseUrl: BASE,
    locale: 'fr',
  })

  it('reprend titre, description et canonique de WatchDetail.vue', () => {
    expect(page.title).toBe('Rolex Submariner - 12 500 € | Boutique')
    expect(page.description).toBe(
      'Boîte et papiers. Révisée en 2024. Garantie 1 an. Prix : 12 500 €',
    )
    expect(page.canonicalUrl).toBe(`${BASE}/montre/rolex-submariner-126610ln`)
  })

  it('écrit la page complète dans la coquille', () => {
    const html = renderDynamicPage(SHELL, page)
    expect(html).toContain('<title>Rolex Submariner - 12')
    expect(html).toContain(`<link rel="canonical" href="${BASE}/montre/rolex-submariner-126610ln" />`)
    expect(html).toContain(`<meta property="og:url" content="${BASE}/montre/rolex-submariner-126610ln" />`)
    expect(html).toContain('<meta property="og:type" content="product" />')
    expect(html).toContain('<meta property="og:image" content="https://cdn.test/a.webp" />')
    expect(html).toContain('<h1>Rolex Submariner</h1>')
    expect(html).toContain('<a href="/collection/rolex">Rolex</a>')
    expect(html).toContain('<a href="/rachat">')
    expect(html).not.toContain("Description de l'accueil")
    expect(html.match(/<title>/g)).toHaveLength(1)
  })

  it('déclare Product (en stock) et le fil d’Ariane', () => {
    const schemas = jsonLdOf(renderDynamicPage(SHELL, page))
    const product = schemas.find((s) => s['@type'] === 'Product')
    expect(product.offers.price).toBe(12500)
    expect(product.offers.availability).toBe('https://schema.org/InStock')
    expect(product.url).toBe(page.canonicalUrl)
    const crumbs = schemas.find((s) => s['@type'] === 'BreadcrumbList')
    expect(crumbs.itemListElement.map((i) => i.item)).toEqual([
      `${BASE}/`,
      `${BASE}/collection/rolex`,
      `${BASE}/montre/rolex-submariner-126610ln`,
    ])
    expect(schemas.some((s) => s['@type'] === 'Organization')).toBe(true)
  })

  it('annonce une montre vendue comme vendue, hors stock', () => {
    const sold = buildWatchPage({
      watch: normalizeWatchRow(row({ is_sold: true, is_available: false })),
      siteConfig: SITE,
      baseUrl: BASE,
      locale: 'fr',
    })
    expect(sold.bodyHtml).toContain('<p>Vendue</p>')
    const product = sold.jsonLd.find((s) => s?.['@type'] === 'Product')
    expect(product.offers.availability).toBe('https://schema.org/OutOfStock')
  })

  it('n’affiche ni prix ni offre pour une pièce sans prix', () => {
    const noPrice = buildWatchPage({
      watch: normalizeWatchRow(row({ price: null })),
      siteConfig: SITE,
      baseUrl: BASE,
      locale: 'fr',
    })
    expect(noPrice.title).toBe('Rolex Submariner | Boutique')
    expect(noPrice.jsonLd.find((s) => s?.['@type'] === 'Product').offers).toBeUndefined()
  })

  it('échappe le contenu venu de la base', () => {
    const evil = buildWatchPage({
      watch: normalizeWatchRow(row({ name: '<img src=x onerror=alert(1)>' })),
      siteConfig: SITE,
      baseUrl: BASE,
      locale: 'fr',
    })
    expect(evil.bodyHtml).not.toContain('<img src=x')
    expect(renderDynamicPage(SHELL, evil)).not.toContain('<img src=x onerror')
  })
})

describe('buildWatchMetaDescription', () => {
  const build = (description, price = 12500) =>
    buildWatchMetaDescription({
      watch: { description },
      price,
      descriptionSuffix: 'Garantie 1 an.',
      pricePrefix: 'Prix :',
      genericDescription: 'Montre Rolex 126610LN',
      formatPrice: (n) => `${n} €`,
    })

  it('résume une longue description Markdown et garde argument et prix', () => {
    const out = build(`**Rolex Submariner – Réf. 126610LN**

${'Une icône de la plongée. '.repeat(20)}`)
    expect(out).not.toContain('**')
    expect(out.length).toBeLessThanOrEqual(165)
    expect(out.endsWith('Garantie 1 an. Prix : 12500 €')).toBe(true)
  })

  it('se rabat sur le libellé générique sans description, et omet un prix nul', () => {
    expect(build('', 0)).toBe('Montre Rolex 126610LN. Garantie 1 an.')
  })
})

describe('buildBrandPage', () => {
  it('liste les montres de la marque en liens directs', () => {
    const page = buildBrandPage({
      brand: 'Rolex',
      watches: [normalizeWatchRow(row())],
      siteConfig: SITE,
      baseUrl: BASE,
      locale: 'fr',
    })
    expect(page.title).toBe("Montres Rolex d'occasion | Boutique")
    expect(page.canonicalUrl).toBe(`${BASE}/collection/rolex`)
    expect(page.bodyHtml).toContain("<h1>Montres Rolex d'occasion</h1>")
    expect(page.bodyHtml).toContain('<a href="/montre/rolex-submariner-126610ln">Rolex Submariner — 12')
  })
})

describe('buildArticlePage', () => {
  it('reprend titre, canonique et Article JSON-LD de BlogDetail.vue', () => {
    const page = buildArticlePage({
      article: {
        id: '181a281b-d439-4c4a-a28a-3575616a3ee7',
        title: 'Estimer sa Rolex',
        text: '# Intro\n\nUne Rolex se revend bien.',
        categories: ['Conseils'],
        created_at: '2026-10-01T10:00:00Z',
      },
      siteConfig: SITE,
      baseUrl: BASE,
      locale: 'fr',
      logoUrl: `${BASE}/logo.png`,
    })
    expect(page.title).toBe('Estimer sa Rolex | Blog Boutique')
    expect(page.description).toBe('Intro')
    expect(page.canonicalUrl).toBe(`${BASE}/blog/181a281b-d439-4c4a-a28a-3575616a3ee7`)
    const article = page.jsonLd.find((s) => s?.['@type'] === 'Article')
    expect(article.datePublished).toBe('2026-10-01T10:00:00.000Z')
    expect(article.keywords).toBe('Conseils')
    expect(page.bodyHtml).toContain('<p>Une Rolex se revend bien.</p>')
  })
})

describe('stripPageIdentity', () => {
  it('retire canonique, hreflang, og:url et twitter:url du repli SPA', () => {
    const shell = `<head>
    <link rel="canonical" href="${BASE}" />
    <link rel="alternate" hreflang="en" href="${BASE}/en" />
    <meta property="og:url" content="${BASE}" />
    <meta name="twitter:url" content="${BASE}" />
    <meta property="og:title" content="Accueil" />
  </head>`
    const out = stripPageIdentity(shell)
    expect(out).not.toMatch(/canonical|hreflang|og:url|twitter:url/)
    expect(out).toContain('og:title')
  })
})
