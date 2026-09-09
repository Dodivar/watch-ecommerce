/**
 * Indices de ressources de la coquille `index.html`.
 *
 * Ce sont des détails d'une ligne qui ne se voient pas à l'œil et se perdent en silence : un
 * `crossorigin` manquant fait télécharger la police deux fois, une URL Supabase mal formée
 * ferait échouer le build si elle n'était pas gardée.
 */
import { describe, expect, it } from 'vitest'

import { buildIndexHtml } from '../../vite/site-from-config.mjs'

const HTML =
  '<!doctype html>\n<html lang="__SITE_LANG__">\n  <head>\n  </head>\n  <body></body>\n</html>'

const siteConfig = (overrides = {}) => ({
  siteId: 'test',
  urls: { production: 'https://exemple.fr' },
  theme: {
    colors: {
      primary: '#000',
      primaryHover: '#111',
      cream: '#fff',
      cream100: '#fff',
      cream200: '#fff',
      cream300: '#fff',
      textMain: '#000',
    },
  },
  seo: {
    indexHtml: {
      title: 'Titre',
      metaDescription: 'Description',
      keywords: 'a, b',
      author: 'Auteur',
      ogTitle: 'Titre',
      ogDescription: 'Description',
      twitterCard: 'summary_large_image',
      ogSiteName: 'Exemple',
      appleMobileWebAppTitle: 'Exemple',
      ogImagePath: '/logo.png',
    },
  },
  ...overrides,
})

const build = (options, overrides) => buildIndexHtml(HTML, siteConfig(overrides), 'fr', options)

describe('indices de ressources de la coquille', () => {
  it('précharge le corps de texte et les titres, et rien d’autre', () => {
    const html = build({})
    const preloads = html.match(/<link rel="preload"[^>]*>/g) ?? []

    // Deux polices : la régulière de `sans` et la graisse de titre. Les italiques et
    // extra-bold restent découverts par la feuille de style.
    expect(preloads).toHaveLength(2)
    expect(html).toContain('href="/fonts/HK Grotesk Regular.woff2"')
    expect(html).toContain('href="/fonts/Poppins Bold.woff2"')
  })

  /** Sans `crossorigin`, le navigateur télécharge la police une deuxième fois. */
  it('marque chaque préchargement de police en crossorigin', () => {
    const preloads = build({}).match(/<link rel="preload"[^>]*>/g) ?? []
    expect(preloads).not.toHaveLength(0)
    for (const link of preloads) {
      expect(link, link).toContain('as="font"')
      expect(link, link).toContain('type="font/woff2"')
      expect(link, link).toContain('crossorigin')
    }
  })

  it('ouvre la connexion vers le Storage Supabase', () => {
    const html = build({ supabaseUrl: 'https://abcdefgh.supabase.co' })
    expect(html).toContain(
      '<link rel="preconnect" href="https://abcdefgh.supabase.co" crossorigin />',
    )
  })

  it('ne garde que l’origine, pas le chemin', () => {
    const html = build({ supabaseUrl: 'https://abcdefgh.supabase.co/storage/v1/object/public/' })
    expect(html).toContain('href="https://abcdefgh.supabase.co"')
    expect(html).not.toContain('/storage/v1/object')
  })

  it('n’émet pas de preconnect sans URL, ni sur une URL illisible', () => {
    for (const supabaseUrl of [undefined, '', '   ', 'pas-une-url']) {
      expect(build({ supabaseUrl }), String(supabaseUrl)).not.toContain('rel="preconnect"')
    }
  })

  it('insère les indices dans le head', () => {
    const html = build({ supabaseUrl: 'https://abcdefgh.supabase.co' })
    const head = html.slice(html.indexOf('<head>'), html.indexOf('</head>'))
    expect(head).toContain('rel="preconnect"')
    expect(head).toContain('rel="preload"')
  })

  it('ne précharge qu’une fois une police partagée par les deux rôles', () => {
    const html = build(
      {},
      {
        theme: {
          colors: {
            primary: '#000',
            primaryHover: '#111',
            cream: '#fff',
            cream100: '#fff',
            cream200: '#fff',
            cream300: '#fff',
            textMain: '#000',
          },
          typography: {
            sans: { family: 'Une', faces: [{ weight: 400, style: 'normal', file: 'Une.woff2' }] },
            heading: {
              family: 'Une',
              faces: [{ weight: 400, style: 'normal', file: 'Une.woff2' }],
            },
          },
        },
      },
    )

    expect(html.match(/<link rel="preload"[^>]*>/g)).toHaveLength(1)
  })
})
