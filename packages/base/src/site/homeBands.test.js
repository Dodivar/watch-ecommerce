import { describe, expect, it } from 'vitest'

import { homeBandClass, resolveHomeBands } from './homeBands.js'

describe('resolveHomeBands', () => {
  it('retourne un tableau vide sans sections', () => {
    expect(resolveHomeBands([])).toEqual([])
    expect(resolveHomeBands(undefined)).toEqual([])
  })

  it('alterne en partant du vert de marque', () => {
    expect(resolveHomeBands(['hero', 'trust', 'services', 'faq'])).toEqual([
      'primary',
      'light',
      'primary',
      'light',
    ])
  })

  it('donne la bande claire aux carrousels de montres de Sauvage Watches', () => {
    const sections = ['hero', 'nouvelles', 'trust', 'ventes', 'suivezNous', 'services', 'faq']
    expect(resolveHomeBands(sections)).toEqual([
      'primary',
      'light',
      'primary',
      'light',
      'primary',
      'light',
      'primary',
    ])
  })

  it('décale l’alternance plutôt que de poser un carrousel sur le vert', () => {
    // `nouvelles` tomberait sur `primary` : il bascule, et la suite se décale.
    expect(resolveHomeBands(['hero', 'trust', 'nouvelles', 'services'])).toEqual([
      'primary',
      'light',
      'light',
      'primary',
    ])
  })

  it('garde le blanc pour des carrousels consécutifs', () => {
    // Trois sections « montres » à la suite : aucune ne repasse sur le vert,
    // le filet de `theme-dark.css` sépare les bandes claires voisines.
    const bands = resolveHomeBands(['hero', 'nouvelles', 'ventes', 'collectionHighlight', 'faq'])
    expect(bands).toEqual(['primary', 'light', 'light', 'light', 'primary'])
  })
})

describe('homeBandClass', () => {
  it('compose les classes lues par theme-dark.css', () => {
    expect(homeBandClass('primary')).toBe('home-band home-band--primary')
    expect(homeBandClass('light')).toBe('home-band home-band--light')
  })

  it('retombe sur le vert de marque pour un ton inconnu', () => {
    expect(homeBandClass('nope')).toBe('home-band home-band--primary')
  })
})
