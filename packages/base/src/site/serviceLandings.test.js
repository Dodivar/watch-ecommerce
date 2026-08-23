import { describe, expect, it } from 'vitest'

import {
  findServiceLanding,
  listRelatedServiceLandings,
  resolveServiceLandings,
} from './serviceLandings.js'

function landing(overrides = {}) {
  return {
    slug: 'changement-pile-montre',
    hero: { title: 'Changement de pile' },
    ...overrides,
  }
}

describe('resolveServiceLandings', () => {
  it('renvoie un tableau vide sans bloc landings', () => {
    expect(resolveServiceLandings({})).toEqual([])
    expect(resolveServiceLandings({ servicesPage: {} })).toEqual([])
    expect(resolveServiceLandings({ servicesPage: { landings: 'oui' } })).toEqual([])
  })

  it('normalise une page et calcule son chemin', () => {
    const [page] = resolveServiceLandings({
      servicesPage: { landings: [landing({ sectionId: 'piles' })] },
    })

    expect(page.path).toBe('/services/changement-pile-montre')
    expect(page.navLabel).toBe('Changement de pile')
    expect(page.icon).toBe('piles')
    expect(page.highlights).toEqual([])
    expect(page.pricing).toBeNull()
    expect(page.faq).toEqual([])
  })

  it('écarte une page sans slug valide ou sans titre', () => {
    const pages = resolveServiceLandings({
      servicesPage: {
        landings: [
          landing({ slug: 'Pile Montre' }),
          landing({ slug: '/pile' }),
          landing({ slug: 'pile', hero: {} }),
          null,
          landing(),
        ],
      },
    })

    expect(pages.map((page) => page.slug)).toEqual(['changement-pile-montre'])
  })

  it('ignore un slug déjà pris — la seconde page serait inatteignable', () => {
    const pages = resolveServiceLandings({
      servicesPage: {
        landings: [
          landing({ hero: { title: 'Première' } }),
          landing({ hero: { title: 'Doublon' } }),
        ],
      },
    })

    expect(pages).toHaveLength(1)
    expect(pages[0].hero.title).toBe('Première')
  })

  it('ne garde que les entrées FAQ complètes', () => {
    const [page] = resolveServiceLandings({
      servicesPage: {
        landings: [
          landing({
            faq: [
              { question: 'Combien ?', answer: '9 €' },
              { question: 'Sans réponse' },
              { answer: 'Sans question' },
            ],
          }),
        ],
      },
    })

    expect(page.faq).toEqual([{ question: 'Combien ?', answer: '9 €' }])
  })
})

describe('findServiceLanding', () => {
  const pages = resolveServiceLandings({
    servicesPage: { landings: [landing(), landing({ slug: 'bracelets' })] },
  })

  it('retrouve une page par son slug', () => {
    expect(findServiceLanding(pages, 'bracelets').slug).toBe('bracelets')
  })

  it('renvoie null pour un slug inconnu ou vide', () => {
    expect(findServiceLanding(pages, 'inconnu')).toBeNull()
    expect(findServiceLanding(pages, '')).toBeNull()
    expect(findServiceLanding(pages, undefined)).toBeNull()
  })
})

describe('listRelatedServiceLandings', () => {
  it('exclut la page courante', () => {
    const pages = resolveServiceLandings({
      servicesPage: { landings: [landing(), landing({ slug: 'bracelets' })] },
    })

    expect(listRelatedServiceLandings(pages, 'bracelets').map((p) => p.slug)).toEqual([
      'changement-pile-montre',
    ])
  })
})
