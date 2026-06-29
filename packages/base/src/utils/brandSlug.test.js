import { describe, expect, it } from 'vitest'

import {
  resolveBrandFromSlug,
  resolveBrandTileAlt,
  resolveBrandTileImage,
  slugifyBrand,
  VENDOR_BRAND_LOGO_BY_SLUG,
} from './brandSlug.js'

describe('slugifyBrand', () => {
  it('met en minuscules et remplace les espaces par des tirets', () => {
    expect(slugifyBrand('TAG Heuer')).toBe('tag-heuer')
  })

  it('retire les accents (NFD)', () => {
    expect(slugifyBrand('Oméga')).toBe('omega')
  })

  it('supprime les caractères non alphanumériques (sans fusionner les tirets)', () => {
    // Contrairement à slugifyWatchPart, slugifyBrand ne réduit pas les tirets répétés.
    expect(slugifyBrand('A. Lange & Söhne')).toBe('a-lange--sohne')
  })

  it('renvoie une chaîne vide pour les entrées invalides', () => {
    expect(slugifyBrand('')).toBe('')
    expect(slugifyBrand(null)).toBe('')
    expect(slugifyBrand(undefined)).toBe('')
    expect(slugifyBrand(42)).toBe('')
  })
})

describe('resolveBrandFromSlug', () => {
  const watches = [
    { brand: 'Rolex' },
    { brand: 'Oméga' },
    { brand: 'Oméga' },
    { brand: null },
  ]

  it('retrouve le libellé canonique depuis un slug', () => {
    expect(resolveBrandFromSlug(watches, 'omega')).toBe('Oméga')
    expect(resolveBrandFromSlug(watches, 'rolex')).toBe('Rolex')
  })

  it('normalise le slug fourni (casse / espaces)', () => {
    expect(resolveBrandFromSlug(watches, '  ROLEX  ')).toBe('Rolex')
  })

  it('renvoie null si aucune marque ne correspond', () => {
    expect(resolveBrandFromSlug(watches, 'cartier')).toBeNull()
  })

  it('renvoie null pour des entrées vides', () => {
    expect(resolveBrandFromSlug(watches, '')).toBeNull()
    expect(resolveBrandFromSlug([], 'rolex')).toBeNull()
    expect(resolveBrandFromSlug(null, 'rolex')).toBeNull()
  })
})

describe('resolveBrandTileImage', () => {
  it('priorise brandLogos.image', () => {
    const config = { brandLogos: { Rolex: { image: '/custom/rolex.png' } } }
    expect(resolveBrandTileImage(config, 'Rolex')).toBe('/custom/rolex.png')
  })

  it('utilise brandHero.image si aucun brandLogos', () => {
    const config = { brandHero: { Rolex: { image: '/hero/rolex.jpg' } } }
    expect(resolveBrandTileImage(config, 'Rolex')).toBe('/hero/rolex.jpg')
  })

  it('retombe sur le catalogue vendor partagé', () => {
    expect(resolveBrandTileImage({}, 'Rolex')).toBe(VENDOR_BRAND_LOGO_BY_SLUG.rolex)
    expect(resolveBrandTileImage({}, 'Oméga')).toBe(VENDOR_BRAND_LOGO_BY_SLUG.omega)
  })

  it('renvoie null si rien ne correspond', () => {
    expect(resolveBrandTileImage({}, 'Marque Inconnue')).toBeNull()
    expect(resolveBrandTileImage(null, 'Rolex')).toBe(VENDOR_BRAND_LOGO_BY_SLUG.rolex)
    expect(resolveBrandTileImage({}, '')).toBeNull()
  })
})

describe('resolveBrandTileAlt', () => {
  it('priorise le texte alternatif de brandLogos', () => {
    const config = { brandLogos: { Rolex: { alt: 'Logo Rolex officiel' } } }
    expect(resolveBrandTileAlt(config, 'Rolex')).toBe('Logo Rolex officiel')
  })

  it('utilise brandHero.alt en second', () => {
    const config = { brandHero: { Rolex: { alt: 'Bannière Rolex' } } }
    expect(resolveBrandTileAlt(config, 'Rolex')).toBe('Bannière Rolex')
  })

  it('retombe sur le nom de la marque', () => {
    expect(resolveBrandTileAlt({}, 'Rolex')).toBe('Rolex')
    expect(resolveBrandTileAlt({ brandLogos: { Rolex: { alt: '' } } }, 'Rolex')).toBe('Rolex')
  })

  it('renvoie une chaîne vide sans nom de marque', () => {
    expect(resolveBrandTileAlt({}, '')).toBe('')
  })
})
