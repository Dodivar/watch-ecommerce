import { describe, expect, it } from 'vitest'

import {
  isFaqOnHomepage,
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

  it('conserve titleLink sur une colonne de megaMenu', () => {
    const site = {
      features: { ...DEFAULT_SITE_FEATURES, collection: true },
      navigation: {
        main: [
          {
            type: 'megaMenu',
            label: 'Montres',
            to: '/collection',
            feature: 'collection',
            columns: [
              {
                title: 'Promotions',
                titleLink: '/collection?promotion=1',
                items: [{ label: 'Promotions homme', to: '/collection?promotion=1&public=homme' }],
              },
            ],
          },
        ],
      },
    }
    const nav = resolveMainNavigation(site)
    expect(nav[0].columns[0].titleLink).toBe('/collection?promotion=1')
    expect(nav[0].columns[0].items[0].to).toBe('/collection?promotion=1&public=homme')
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

  it('redirige le lien FAQ vers /#faq quand la section est sur l’accueil', () => {
    const site = {
      features: { ...DEFAULT_SITE_FEATURES, faq: true },
      home: { sections: ['hero', 'faq'] },
      navigation: {
        main: [{ type: 'link', label: 'FAQ', to: '/faq', feature: 'faq' }],
      },
    }
    const nav = resolveMainNavigation(site)
    expect(nav).toEqual([{ type: 'link', label: 'FAQ', to: '/#faq' }])
  })

  it('conserve /faq quand la section n’est pas sur l’accueil', () => {
    const site = {
      features: { ...DEFAULT_SITE_FEATURES, faq: true },
      home: { sections: ['hero'] },
      navigation: {
        main: [{ type: 'link', label: 'FAQ', to: '/faq', feature: 'faq' }],
      },
    }
    const nav = resolveMainNavigation(site)
    expect(nav).toEqual([{ type: 'link', label: 'FAQ', to: '/faq' }])
  })
})

describe('isFaqOnHomepage', () => {
  it('retourne true si faq est dans home.sections filtré', () => {
    const site = {
      features: { ...DEFAULT_SITE_FEATURES, faq: true },
      home: { sections: ['hero', 'faq'] },
    }
    expect(isFaqOnHomepage(site)).toBe(true)
  })

  it('retourne false si faq est absent de home.sections', () => {
    const site = {
      features: { ...DEFAULT_SITE_FEATURES, faq: true },
      home: { sections: ['hero'] },
    }
    expect(isFaqOnHomepage(site)).toBe(false)
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

  it('redirige le lien footer FAQ vers /#faq quand la section est sur l’accueil', () => {
    const site = {
      features: { ...DEFAULT_SITE_FEATURES, faq: true },
      home: { sections: ['faq'] },
      navigation: {
        footer: [{ label: 'FAQ', to: '/faq', feature: 'faq' }],
      },
    }
    const footer = resolveFooterNavigation(site)
    expect(footer).toEqual([{ label: 'FAQ', to: '/#faq' }])
  })
})
