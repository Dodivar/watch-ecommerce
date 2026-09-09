/**
 * Sérialisation du sitemap : `lastmod`, visuels et échappement XML.
 *
 * Le handler lui-même a besoin de Supabase ; c'est `buildSitemapXml` qui porte toute la logique
 * et se teste sans réseau.
 */
import { describe, expect, it } from 'vitest'

import {
  MAX_SITEMAP_IMAGES_PER_WATCH,
  buildBrandLastmods,
  buildSitemapXml,
  escapeXml,
  toLastmod,
} from '@/site/buildSitemapXml.js'

const MONOLINGUE = { enabled: false, locales: ['fr'], defaultLocale: 'fr' }
const TRILINGUE = { enabled: true, locales: ['fr', 'en', 'de'], defaultLocale: 'fr' }

const ROUTES = [
  { path: '', priority: '1.0', changefreq: 'daily' },
  { path: '/collection', priority: '0.9', changefreq: 'weekly' },
]

const base = (overrides = {}) => ({
  baseUrl: 'https://exemple.fr',
  staticRoutes: ROUTES,
  i18n: MONOLINGUE,
  ...overrides,
})

describe('escapeXml', () => {
  it('échappe les cinq caractères réservés', () => {
    expect(escapeXml(`a&b<c>d"e'f`)).toBe('a&amp;b&lt;c&gt;d&quot;e&apos;f')
  })

  it('rend une chaîne vide pour null et undefined', () => {
    expect(escapeXml(null)).toBe('')
    expect(escapeXml(undefined)).toBe('')
  })
})

describe('toLastmod', () => {
  it('réduit un timestamp à sa date', () => {
    expect(toLastmod('2026-03-04T15:22:01.000Z')).toBe('2026-03-04')
  })

  it('rend null plutôt que d’inventer une fraîcheur', () => {
    expect(toLastmod(null)).toBeNull()
    expect(toLastmod('')).toBeNull()
    expect(toLastmod('pas une date')).toBeNull()
  })
})

describe('buildBrandLastmods', () => {
  it('retient la montre la plus récemment modifiée de chaque marque', () => {
    const lastmods = buildBrandLastmods([
      { brand: 'Rolex', updated_at: '2026-01-05T00:00:00Z' },
      { brand: 'Rolex', updated_at: '2026-04-02T00:00:00Z' },
      { brand: 'Omega', updated_at: '2026-02-01T00:00:00Z' },
      { brand: '', updated_at: '2026-09-09T00:00:00Z' },
    ])

    expect(lastmods.get('rolex')).toBe('2026-04-02')
    expect(lastmods.get('omega')).toBe('2026-02-01')
    expect(lastmods.size).toBe(2)
  })
})

describe('buildSitemapXml', () => {
  it('déclare les espaces de noms xhtml et image', () => {
    const xml = buildSitemapXml(base())
    expect(xml).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"')
    expect(xml).toContain('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"')
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true)
    expect(xml.endsWith('</urlset>')).toBe(true)
  })

  it('rend la racine sans slash final', () => {
    expect(buildSitemapXml(base())).toContain('<loc>https://exemple.fr</loc>')
  })

  /**
   * Voir l'en-tête de `buildSitemapXml.js` : un `lastmod` constamment frais sur les pages
   * statiques ferait ignorer par Google celui des fiches montre, qui est exact.
   */
  it('ne met pas de lastmod sur les pages statiques', () => {
    const xml = buildSitemapXml(base())
    expect(xml).not.toContain('<lastmod>')
  })

  it('date les fiches montre et les articles depuis la base', () => {
    const xml = buildSitemapXml(
      base({
        watches: [
          { id: 'w1', slug: 'rolex-sub', brand: 'Rolex', updated_at: '2026-05-06T10:00:00Z' },
        ],
        articles: [{ id: 'a1', updated_at: '2026-06-07T10:00:00Z' }],
      }),
    )

    expect(xml).toContain('<loc>https://exemple.fr/montre/rolex-sub</loc>')
    expect(xml).toContain('<lastmod>2026-05-06</lastmod>')
    expect(xml).toContain('<loc>https://exemple.fr/blog/a1</loc>')
    expect(xml).toContain('<lastmod>2026-06-07</lastmod>')
  })

  it('date la page marque avec sa montre la plus récente', () => {
    const xml = buildSitemapXml(
      base({
        watches: [
          { id: 'w1', slug: 'rolex-a', brand: 'Rolex', updated_at: '2026-01-01T00:00:00Z' },
          { id: 'w2', slug: 'rolex-b', brand: 'Rolex', updated_at: '2026-07-08T00:00:00Z' },
        ],
      }),
    )

    const brandBlock = xml.slice(xml.indexOf('<loc>https://exemple.fr/collection/rolex</loc>'))
    expect(brandBlock).toContain('<lastmod>2026-07-08</lastmod>')
  })

  it('omet le lastmod quand la date est absente ou illisible', () => {
    const xml = buildSitemapXml(
      base({ watches: [{ id: 'w1', slug: 'sans-date', brand: 'Rolex' }] }),
    )
    const watchBlock = xml.slice(
      xml.indexOf('<loc>https://exemple.fr/montre/sans-date</loc>'),
      xml.indexOf('</url>', xml.indexOf('sans-date')),
    )
    expect(watchBlock).not.toContain('<lastmod>')
  })

  it('joint ses visuels à chaque fiche montre', () => {
    const xml = buildSitemapXml(
      base({
        watches: [{ id: 'w1', slug: 'rolex-sub', brand: 'Rolex' }],
        imagesByWatchId: new Map([['w1', ['https://cdn.test/a.webp', 'https://cdn.test/b.webp']]]),
      }),
    )

    expect(xml).toContain('<image:loc>https://cdn.test/a.webp</image:loc>')
    expect(xml).toContain('<image:loc>https://cdn.test/b.webp</image:loc>')
  })

  it('échappe les paramètres d’une URL de rendu, qui casseraient le document', () => {
    const xml = buildSitemapXml(
      base({
        watches: [{ id: 'w1', slug: 'rolex-sub', brand: 'Rolex' }],
        imagesByWatchId: { w1: ['https://cdn.test/a.webp?width=640&quality=80'] },
      }),
    )

    expect(xml).toContain('<image:loc>https://cdn.test/a.webp?width=640&amp;quality=80</image:loc>')
    // Aucune esperluette nue ne subsiste dans le document : c'est ce qui le rendrait illisible.
    expect(/&(?!amp;|lt;|gt;|quot;|apos;)/.test(xml)).toBe(false)
  })

  it('plafonne le nombre de visuels par fiche', () => {
    const trop = Array.from({ length: 12 }, (_, i) => `https://cdn.test/${i}.webp`)
    const xml = buildSitemapXml(
      base({ watches: [{ id: 'w1', slug: 'rolex-sub' }], imagesByWatchId: { w1: trop } }),
    )

    expect(xml.match(/<image:image>/g)).toHaveLength(MAX_SITEMAP_IMAGES_PER_WATCH)
  })

  it('retombe sur l’id quand la montre n’a ni slug ni libellé', () => {
    // `buildWatchSlug` garde l'id comme dernier recours ; la route `/montre/:slug` l'accepte.
    const xml = buildSitemapXml(base({ watches: [{ id: 'w1' }] }))
    expect(xml).toContain('<loc>https://exemple.fr/montre/w1</loc>')
  })

  it('ignore une montre dont aucun slug ne peut être construit', () => {
    const xml = buildSitemapXml(base({ watches: [{ brand: '', name: '', reference: '' }] }))
    expect(xml).not.toContain('/montre/')
  })

  it('déclare les alternates hreflang des pages statiques en multilingue', () => {
    const xml = buildSitemapXml(base({ i18n: TRILINGUE }))

    expect(xml).toContain('hreflang="fr" href="https://exemple.fr/collection"')
    expect(xml).toContain('hreflang="en" href="https://exemple.fr/en/collection"')
    expect(xml).toContain('hreflang="de" href="https://exemple.fr/de/collection"')
    expect(xml).toContain('hreflang="x-default" href="https://exemple.fr/collection"')
  })

  /** Contenu venu de la base, non traduit : une seule URL, sans alternates. */
  it('n’expose les fiches montre que dans la langue par défaut', () => {
    const xml = buildSitemapXml(
      base({ i18n: TRILINGUE, watches: [{ id: 'w1', slug: 'rolex-sub', brand: 'Rolex' }] }),
    )

    expect(xml).toContain('<loc>https://exemple.fr/montre/rolex-sub</loc>')
    expect(xml).not.toContain('/en/montre/')
    expect(xml).not.toContain('/de/montre/')
  })
})
