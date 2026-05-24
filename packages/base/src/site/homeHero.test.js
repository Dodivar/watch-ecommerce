import { describe, expect, it } from 'vitest'

import { isHomeHeroRenderable, resolveHomeHeroConfig } from './homeHero.js'

describe('resolveHomeHeroConfig', () => {
  it('retourne le variant parallax par défaut sans config hero', () => {
    expect(resolveHomeHeroConfig({})).toEqual({
      variant: 'parallax',
      eyebrow: null,
      title: null,
      subtitle: null,
      primaryCta: null,
      secondaryCta: null,
      image: null,
      imageAlt: null,
    })
  })

  it('normalise un hero compact avec CTAs', () => {
    expect(
      resolveHomeHeroConfig({
        home: {
          hero: {
            variant: 'compact',
            title: 'Votre montre de marque, aujourd\'hui.',
            subtitle: '3 000 modèles en stock aux Place des Halles.',
            primaryCta: { label: 'Découvrir nos montres', to: '/collection' },
            secondaryCta: { label: 'Nous contacter', to: '/contact' },
          },
        },
      }),
    ).toMatchObject({
      variant: 'compact',
      title: 'Votre montre de marque, aujourd\'hui.',
      primaryCta: { label: 'Découvrir nos montres', to: '/collection' },
      secondaryCta: { label: 'Nous contacter', to: '/contact' },
    })
  })

  it('ignore un variant inconnu et conserve parallax', () => {
    expect(
      resolveHomeHeroConfig({
        home: { hero: { variant: 'fullscreen', title: 'Test' } },
      }).variant,
    ).toBe('parallax')
  })
})

describe('isHomeHeroRenderable', () => {
  it('affiche toujours le hero parallax', () => {
    expect(isHomeHeroRenderable({ variant: 'parallax', title: null })).toBe(true)
  })

  it('exige un titre pour le hero compact', () => {
    expect(isHomeHeroRenderable({ variant: 'compact', title: null })).toBe(false)
    expect(isHomeHeroRenderable({ variant: 'compact', title: 'Titre' })).toBe(true)
  })
})
