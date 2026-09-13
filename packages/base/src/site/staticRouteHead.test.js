/**
 * Métadonnées de tête des routes pré-rendues.
 */
import { describe, expect, it } from 'vitest'

import {
  STATIC_ROUTES_WITHOUT_OWN_COPY,
  STATIC_ROUTE_SEO_SECTIONS,
  applyStaticRouteHead,
  buildStaticRouteHead,
  buildStaticRouteUrl,
} from './staticRouteHead.js'

const MONOLINGUE = { enabled: false, locales: ['fr'], defaultLocale: 'fr' }
const TRILINGUE = { enabled: true, locales: ['fr', 'en', 'de'], defaultLocale: 'fr' }

const siteConfig = {
  seo: {
    indexHtml: {
      title: 'Coquille',
      metaDescription: 'Description de coquille',
      ogTitle: 'OG coquille',
      ogDescription: 'OG description coquille',
      twitterTitle: 'TW coquille',
      twitterDescription: 'TW description coquille',
    },
    faq: {
      title: 'FAQ | Boutique',
      metaDescription: 'Réponses aux questions fréquentes.',
      ogTitle: 'FAQ',
      ogDescription: 'Questions fréquentes',
      twitterTitle: 'FAQ Twitter',
      twitterDescription: 'Questions Twitter',
    },
    collection: { title: 'Collection | Boutique', metaDescription: 'Nos montres.' },
  },
}

const head = (routePath, locale = 'fr', i18n = MONOLINGUE) =>
  buildStaticRouteHead({ siteConfig, routePath, locale, i18n, baseUrl: 'https://exemple.fr' })

describe('buildStaticRouteUrl', () => {
  it('rend la racine sans slash final', () => {
    expect(buildStaticRouteUrl('https://exemple.fr', '', 'fr', MONOLINGUE)).toBe(
      'https://exemple.fr',
    )
  })

  it('préfixe la langue non par défaut', () => {
    expect(buildStaticRouteUrl('https://exemple.fr', '/faq', 'de', TRILINGUE)).toBe(
      'https://exemple.fr/de/faq',
    )
    expect(buildStaticRouteUrl('https://exemple.fr', '/faq', 'fr', TRILINGUE)).toBe(
      'https://exemple.fr/faq',
    )
  })

  it('rend la racine d’une langue sans slash final', () => {
    expect(buildStaticRouteUrl('https://exemple.fr', '', 'de', TRILINGUE)).toBe(
      'https://exemple.fr/de',
    )
  })
})

describe('buildStaticRouteHead', () => {
  it('prend titre et description dans le bloc de la route', () => {
    expect(head('/faq')).toMatchObject({
      url: 'https://exemple.fr/faq',
      title: 'FAQ | Boutique',
      description: 'Réponses aux questions fréquentes.',
      ogTitle: 'FAQ',
      twitterTitle: 'FAQ Twitter',
      hasOwnCopy: true,
    })
  })

  it('complète un bloc partiel avec son propre titre plutôt qu’avec la coquille', () => {
    const collection = head('/collection')
    expect(collection.ogTitle).toBe('Collection | Boutique')
    expect(collection.ogDescription).toBe('Nos montres.')
    expect(collection.twitterTitle).toBe('Collection | Boutique')
  })

  /**
   * C'est la correction qui compte : même sans copie propre, la page ne se déclare plus
   * canonique de l'accueil.
   */
  it('corrige l’URL d’une route sans bloc dédié, en gardant la copie de la coquille', () => {
    expect(head('/contact')).toMatchObject({
      url: 'https://exemple.fr/contact',
      title: 'Coquille',
      description: 'Description de coquille',
      hasOwnCopy: false,
    })
  })

  it('retombe sur la coquille quand la vitrine n’active pas la section', () => {
    const sansFaq = buildStaticRouteHead({
      siteConfig: { seo: { indexHtml: siteConfig.seo.indexHtml } },
      routePath: '/faq',
      locale: 'fr',
      i18n: MONOLINGUE,
      baseUrl: 'https://exemple.fr',
    })
    expect(sansFaq.title).toBe('Coquille')
    expect(sansFaq.hasOwnCopy).toBe(false)
    expect(sansFaq.url).toBe('https://exemple.fr/faq')
  })
})

describe('applyStaticRouteHead', () => {
  const shell = [
    '<html><head>',
    '<title>Coquille</title>',
    '<meta name="description" content="Description de coquille" />',
    '<link rel="canonical" href="https://exemple.fr" />',
    '<meta property="og:url" content="https://exemple.fr" />',
    '<meta property="og:title" content="OG coquille" />',
    '<meta property="og:description" content="OG description coquille" />',
    '<meta property="og:image" content="https://exemple.fr/logo.png" />',
    '<meta name="twitter:url" content="https://exemple.fr" />',
    '<meta name="twitter:title" content="TW coquille" />',
    '<meta name="twitter:description" content="TW description coquille" />',
    '<script type="module" src="/main.js"></script>',
    '</head><body><div id="app"></div></body></html>',
  ].join('\n')

  it('réécrit titre, canonique et métas sociales', () => {
    const out = applyStaticRouteHead(shell, head('/faq'))

    expect(out).toContain('<title>FAQ | Boutique</title>')
    expect(out).toContain('<link rel="canonical" href="https://exemple.fr/faq" />')
    expect(out).toContain('<meta property="og:url" content="https://exemple.fr/faq" />')
    expect(out).toContain('<meta property="og:title" content="FAQ" />')
    expect(out).toContain('<meta name="twitter:url" content="https://exemple.fr/faq" />')
    expect(out).toContain(
      '<meta name="description" content="Réponses aux questions fréquentes." />',
    )
  })

  it('laisse intact ce qui ne dépend pas de la route', () => {
    const out = applyStaticRouteHead(shell, head('/faq'))

    expect(out).toContain('<meta property="og:image" content="https://exemple.fr/logo.png" />')
    expect(out).toContain('<script type="module" src="/main.js"></script>')
    expect(out).toContain('<div id="app"></div>')
  })

  it('échappe les guillemets et chevrons de la copie', () => {
    const out = applyStaticRouteHead(shell, {
      url: 'https://exemple.fr/faq',
      title: 'Montres « 5 » & <b>plus</b>',
      description: 'Guillemet " et esperluette &',
      ogTitle: 'a',
      ogDescription: 'b',
      twitterTitle: 'c',
      twitterDescription: 'd',
      hasOwnCopy: true,
    })

    expect(out).toContain('<title>Montres « 5 » &amp; &lt;b&gt;plus&lt;/b&gt;</title>')
    expect(out).toContain('content="Guillemet &quot; et esperluette &amp;"')
  })

  it('ne casse pas une coquille à laquelle il manque une balise', () => {
    const minimal = '<html><head><title>Coquille</title></head><body></body></html>'
    const out = applyStaticRouteHead(minimal, head('/faq'))
    expect(out).toBe('<html><head><title>FAQ | Boutique</title></head><body></body></html>')
  })
})

describe('couverture de la table des sections', () => {
  it('ne référence aucune section deux fois', () => {
    const sections = Object.values(STATIC_ROUTE_SEO_SECTIONS)
    expect(new Set(sections).size).toBe(sections.length)
  })

  it('ne fait pas se recouper la table et la liste des routes sans copie', () => {
    for (const route of STATIC_ROUTES_WITHOUT_OWN_COPY) {
      expect(STATIC_ROUTE_SEO_SECTIONS[route], route).toBeUndefined()
    }
  })
})
