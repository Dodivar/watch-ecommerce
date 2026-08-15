import { describe, expect, it } from 'vitest'

import {
  isHomeHeroCtaVisible,
  isHomeHeroRenderable,
  resolveHomeHeroConfig,
} from './homeHero.js'

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
      highlights: [],
      pieces: [],
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

  it('normalise les pièces et les points de réassurance du hero vitrine', () => {
    const hero = resolveHomeHeroConfig({
      home: {
        hero: {
          variant: 'vitrine',
          title: 'Une sélection courte, vérifiée pièce par pièce.',
          highlights: ['Authentifiée', '  ', 'Garantie 1 an', 42],
          pieces: [
            {
              image: '/home/omega.webp',
              brand: 'Oméga',
              model: 'Speedmaster Professional',
              meta: 'Réf. 310.30.42',
            },
            { brand: 'Sans image' },
            'invalide',
          ],
        },
      },
    })

    expect(hero.variant).toBe('vitrine')
    expect(hero.highlights).toEqual(['Authentifiée', 'Garantie 1 an'])
    expect(hero.pieces).toEqual([
      {
        image: '/home/omega.webp',
        alt: null,
        brand: 'Oméga',
        model: 'Speedmaster Professional',
        meta: 'Réf. 310.30.42',
      },
    ])
  })

  it('accepte le variant editorial', () => {
    expect(
      resolveHomeHeroConfig({
        home: { hero: { variant: 'editorial', title: 'Titre' } },
      }).variant,
    ).toBe('editorial')
  })
})

describe('isHomeHeroRenderable', () => {
  it('affiche toujours le hero parallax', () => {
    expect(isHomeHeroRenderable({ variant: 'parallax', title: null })).toBe(true)
  })

  it('exige un titre pour les variants pilotés par la config', () => {
    for (const variant of ['compact', 'vitrine', 'editorial']) {
      expect(isHomeHeroRenderable({ variant, title: null })).toBe(false)
      expect(isHomeHeroRenderable({ variant, title: 'Titre' })).toBe(true)
    }
  })
})

describe('isHomeHeroCtaVisible', () => {
  const features = { collection: true, recherche: false, estimation: true }

  it('masque un CTA incomplet', () => {
    expect(isHomeHeroCtaVisible(null, features)).toBe(false)
    expect(isHomeHeroCtaVisible({ label: 'Voir', to: '' }, features)).toBe(false)
  })

  it('suit la feature de la page visée', () => {
    expect(isHomeHeroCtaVisible({ label: 'Voir', to: '/collection' }, features)).toBe(true)
    expect(isHomeHeroCtaVisible({ label: 'Chercher', to: '/recherche' }, features)).toBe(false)
    expect(isHomeHeroCtaVisible({ label: 'Estimer', to: '/estimation' }, features)).toBe(true)
  })

  it('affiche le contact sauf si la feature est explicitement coupée', () => {
    expect(isHomeHeroCtaVisible({ label: 'Contact', to: '/contact' }, features)).toBe(true)
    expect(
      isHomeHeroCtaVisible({ label: 'Contact', to: '/contact' }, { contact: false }),
    ).toBe(false)
  })

  it('laisse passer une destination libre', () => {
    expect(isHomeHeroCtaVisible({ label: 'Blog', to: '/blog' }, features)).toBe(true)
  })
})
