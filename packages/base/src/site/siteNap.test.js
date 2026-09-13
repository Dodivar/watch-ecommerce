import { describe, expect, it } from 'vitest'

import { parseFrenchPostalAddress, resolveSiteNap } from './siteNap.js'

describe('resolveSiteNap', () => {
  it('priorise directionsAddress pour l’adresse schema', () => {
    const nap = resolveSiteNap({
      brand: { legalName: 'Place des Montres' },
      contact: {
        email: 'service.client@placedesmontres.fr',
        phoneE164: '+33388224040',
        footerAddressHtml: '24 Place des Halles<br />67000 Strasbourg, France',
      },
      legal: { address: 'Centre commercial Place des Halles 67000 Strasbourg' },
      storeMap: {
        directionsAddress: '24 Place des Halles, Centre Commercial, 67000 Strasbourg, France',
      },
    })

    expect(nap.name).toBe('Place des Montres')
    expect(nap.streetAddress).toBe(
      '24 Place des Halles, Centre Commercial, 67000 Strasbourg, France',
    )
    expect(nap.telephone).toBe('+33388224040')
    expect(nap.email).toBe('service.client@placedesmontres.fr')
  })
})

describe('parseFrenchPostalAddress', () => {
  it('sépare rue, code postal et commune', () => {
    expect(parseFrenchPostalAddress('32 Allée de la Robertsau, 67000 Strasbourg, France')).toEqual({
      streetAddress: '32 Allée de la Robertsau',
      postalCode: '67000',
      addressLocality: 'Strasbourg',
    })
  })

  it('garde les compléments de rue devant le code postal', () => {
    expect(
      parseFrenchPostalAddress('24 Place des Halles, Centre Commercial, 67000 Strasbourg, France'),
    ).toEqual({
      streetAddress: '24 Place des Halles, Centre Commercial',
      postalCode: '67000',
      addressLocality: 'Strasbourg',
    })
  })

  it('accepte une adresse sans virgule avant le code postal', () => {
    expect(parseFrenchPostalAddress('14 Place de la Cathédrale 67000 Strasbourg')).toEqual({
      streetAddress: '14 Place de la Cathédrale',
      postalCode: '67000',
      addressLocality: 'Strasbourg',
    })
  })

  /** Composant inventé = signal local faux : mieux vaut la ligne entière. */
  it('rend la ligne entière quand aucun code postal n’est reconnu', () => {
    expect(parseFrenchPostalAddress('Sur rendez-vous, Strasbourg')).toEqual({
      streetAddress: 'Sur rendez-vous, Strasbourg',
      postalCode: '',
      addressLocality: '',
    })
  })

  it('ne découpe pas une adresse réduite au code postal et à la ville', () => {
    expect(parseFrenchPostalAddress('67000 Strasbourg')).toEqual({
      streetAddress: '67000 Strasbourg',
      postalCode: '',
      addressLocality: '',
    })
  })

  it('tolère une valeur vide ou non textuelle', () => {
    const vide = { streetAddress: '', postalCode: '', addressLocality: '' }
    expect(parseFrenchPostalAddress('')).toEqual(vide)
    expect(parseFrenchPostalAddress(null)).toEqual(vide)
    expect(parseFrenchPostalAddress(42)).toEqual(vide)
  })
})

describe('resolveSiteNap — composants d’adresse', () => {
  it('expose les composants découpés', () => {
    const nap = resolveSiteNap({
      brand: { legalName: "Jack'N'Ed" },
      storeMap: { directionsAddress: '14 Place de la Cathédrale, 67000 Strasbourg, France' },
    })

    expect(nap.postalAddress).toEqual({
      streetAddress: '14 Place de la Cathédrale',
      postalCode: '67000',
      addressLocality: 'Strasbourg',
      addressCountry: 'FR',
    })
    // La ligne complète reste disponible pour l'affichage.
    expect(nap.streetAddress).toBe('14 Place de la Cathédrale, 67000 Strasbourg, France')
  })

  it('laisse le manifest imposer ses composants', () => {
    const nap = resolveSiteNap({
      storeMap: {
        directionsAddress: 'Une adresse hors format',
        streetAddress: '1 Hauptstrasse',
        postalCode: '10115',
        addressLocality: 'Berlin',
        addressCountry: 'DE',
      },
    })

    expect(nap.postalAddress).toEqual({
      streetAddress: '1 Hauptstrasse',
      postalCode: '10115',
      addressLocality: 'Berlin',
      addressCountry: 'DE',
    })
  })
})
