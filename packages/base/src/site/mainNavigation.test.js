import { describe, expect, it } from 'vitest'

import {
  navigationUsesCatalogBrands,
  resolveFooterNavigation,
  resolveMainNavigation,
} from './mainNavigation.js'
import { DEFAULT_SITE_FEATURES } from './siteFeatures.js'

describe('resolveMainNavigation', () => {
  it('masque les liens dont la feature est désactivée', () => {
    const site = {
      features: { ...DEFAULT_SITE_FEATURES, blog: false, collection: true },
      navigation: {
        main: [
          { type: 'link', label: 'Blog', to: '/blog', feature: 'blog' },
          { type: 'link', label: 'Collection', to: '/collection', feature: 'collection' },
        ],
      },
    }
    const nav = resolveMainNavigation(site)
    expect(nav.map((i) => i.label)).toEqual(['Collection'])
  })

  it('exclut un group dont tous les enfants sont filtrés', () => {
    const site = {
      features: { ...DEFAULT_SITE_FEATURES, recherche: false, estimation: false },
      navigation: {
        main: [
          {
            type: 'group',
            label: 'Services',
            items: [
              { label: 'Recherche', to: '/recherche', feature: 'recherche' },
              { label: 'Estimation', to: '/estimation', feature: 'estimation' },
            ],
          },
        ],
      },
    }
    expect(resolveMainNavigation(site)).toEqual([])
  })

  it('conserve un megaMenu avec source brands', () => {
    const site = {
      features: { ...DEFAULT_SITE_FEATURES, collection: true },
      navigation: {
        main: [
          {
            type: 'megaMenu',
            label: 'Montres',
            to: '/collection',
            feature: 'collection',
            columns: [{ title: 'Marques', source: 'brands' }],
          },
        ],
      },
    }
    const nav = resolveMainNavigation(site)
    expect(nav).toHaveLength(1)
    expect(nav[0].type).toBe('megaMenu')
    expect(navigationUsesCatalogBrands(nav)).toBe(true)
  })
})

describe('resolveFooterNavigation', () => {
  it('filtre les entrées footer par feature', () => {
    const site = {
      features: { ...DEFAULT_SITE_FEATURES, blog: false },
      navigation: {
        footer: [
          { label: 'Blog', to: '/blog', feature: 'blog' },
          { label: 'Accueil', to: '/' },
        ],
      },
    }
    const footer = resolveFooterNavigation(site)
    expect(footer.map((l) => l.label)).toEqual(['Accueil'])
  })
})
