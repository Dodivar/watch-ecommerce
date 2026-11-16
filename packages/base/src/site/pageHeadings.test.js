/**
 * Titre principal des pages pré-rendues.
 */
import { describe, expect, it } from 'vitest'

import {
  applyStaticRouteHeading,
  buildStaticRouteHeading,
  resolveHomeHeading,
} from './pageHeadings.js'

const t = (key, params) => (params?.brand ? `${key}:${params.brand}` : `«${key}»`)

const site = (overrides = {}) => ({
  brand: { displayName: 'Boutique', searchSiteName: 'Boutique Montres' },
  seo: { home: { title: 'Boutique – montres d’occasion' } },
  home: { sections: ['hero'], hero: { variant: 'vitrine', title: 'Des montres choisies.' } },
  ...overrides,
})

describe('resolveHomeHeading', () => {
  it('reprend le titre du hero piloté par la config', () => {
    expect(resolveHomeHeading({ siteConfig: site(), t })).toBe('Des montres choisies.')
  })

  it('compose le titre du hero historique comme son composant', () => {
    const config = site({ home: { sections: ['hero'] } })
    expect(resolveHomeHeading({ siteConfig: config, t })).toBe(
      '«home.heroTitleLead» montres disponibles «home.heroTitleTail»',
    )
  })

  it('retombe sur le titre SEO quand aucun hero n’est rendu', () => {
    const sansHero = site({ home: { sections: ['nouvelles'] } })
    const heroSansTitre = site({ home: { sections: ['hero'], hero: { variant: 'compact' } } })
    expect(resolveHomeHeading({ siteConfig: sansHero, t })).toBe('Boutique – montres d’occasion')
    expect(resolveHomeHeading({ siteConfig: heroSansTitre, t })).toBe(
      'Boutique – montres d’occasion',
    )
  })

  it('retombe sur le nom du site sans titre SEO', () => {
    const config = site({ seo: {}, home: { sections: [] } })
    expect(resolveHomeHeading({ siteConfig: config, t })).toBe('Boutique Montres')
  })
})

describe('buildStaticRouteHeading', () => {
  it('rend le texte du composant de la page', () => {
    expect(buildStaticRouteHeading({ routePath: '/rachat', siteConfig: site(), t })).toBe(
      '«valuation.pageTitle»',
    )
    expect(buildStaticRouteHeading({ routePath: '/a-propos', siteConfig: site(), t })).toBe(
      'about.pageTitle:Boutique',
    )
  })

  it('préfère le titre déclaré par le manifest quand la page en lit un', () => {
    const config = site({ faq: { heading: 'Vos questions' } })
    expect(buildStaticRouteHeading({ routePath: '/faq', siteConfig: config, t })).toBe(
      'Vos questions',
    )
    expect(buildStaticRouteHeading({ routePath: '/faq', siteConfig: site(), t })).toBe(
      '«faq.headingFallback»',
    )
  })

  it('reprend le titre du texte juridique fourni par le client', () => {
    const config = site({ legalDocuments: { terms: { title: 'Conditions générales de vente' } } })
    const heading = (routePath) => buildStaticRouteHeading({ routePath, siteConfig: config, t })
    expect(heading('/conditions-generales-utilisation')).toBe('Conditions générales de vente')
    expect(heading('/mentions-legales')).toBe('«legal.mentions»')
  })

  it('garde un titre pour une route inconnue ou sans contenu', () => {
    expect(buildStaticRouteHeading({ routePath: '/inconnue', siteConfig: site(), t })).toBe(
      'Boutique – montres d’occasion',
    )
    expect(buildStaticRouteHeading({ routePath: '/services', siteConfig: site(), t })).toBe(
      'Boutique – montres d’occasion',
    )
  })
})

describe('applyStaticRouteHeading', () => {
  const shell = '<body>\n    <div id="app"></div>\n    <script src="/a.js"></script>\n</body>'

  it('écrit le titre dans le conteneur de l’application, échappé', () => {
    expect(applyStaticRouteHeading(shell, 'Rachat & <reprise>')).toContain(
      '<div id="app"><h1>Rachat &amp; &lt;reprise&gt;</h1></div>',
    )
  })

  it('remplace un titre déjà écrit plutôt que d’en empiler un second', () => {
    const once = applyStaticRouteHeading(shell, 'Accueil')
    const twice = applyStaticRouteHeading(once, 'Contact')
    expect(twice.match(/<h1>/g)).toHaveLength(1)
    expect(twice).toContain('<h1>Contact</h1>')
    expect(twice).toContain('<script src="/a.js"></script>')
  })

  it('laisse intacte une coquille sans conteneur ou un titre vide', () => {
    expect(applyStaticRouteHeading('<body></body>', 'Accueil')).toBe('<body></body>')
    expect(applyStaticRouteHeading(shell, '')).toBe(shell)
  })
})
