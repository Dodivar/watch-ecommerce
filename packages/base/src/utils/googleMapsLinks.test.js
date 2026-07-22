import { describe, expect, it } from 'vitest'

import {
  buildGoogleMapsDirectionsUrl,
  buildGoogleMapsPlaceUrl,
} from './googleMapsLinks.js'

describe('buildGoogleMapsPlaceUrl', () => {
  it('privilégie l’URL explicite puis googleMapsUri', () => {
    expect(
      buildGoogleMapsPlaceUrl({ url: ' https://maps.app.goo.gl/xyz ', placeId: 'p1' }),
    ).toBe('https://maps.app.goo.gl/xyz')
    expect(
      buildGoogleMapsPlaceUrl({ googleMapsUri: 'https://maps.google.com/?cid=1', placeId: 'p1' }),
    ).toBe('https://maps.google.com/?cid=1')
  })

  it('construit une recherche par placeId', () => {
    expect(buildGoogleMapsPlaceUrl({ placeId: 'ChIJ abc' })).toBe(
      'https://www.google.com/maps/search/?api=1&query_place_id=ChIJ%20abc',
    )
  })

  it('replie sur les coordonnées puis la requête texte', () => {
    expect(buildGoogleMapsPlaceUrl({ lat: 48.87, lng: 2.33 })).toBe(
      'https://www.google.com/maps/search/?api=1&query=48.87%2C2.33',
    )
    expect(buildGoogleMapsPlaceUrl({ query: 'Sauvage Watches Paris' })).toBe(
      'https://www.google.com/maps/search/?api=1&query=Sauvage%20Watches%20Paris',
    )
  })

  it('ignore des coordonnées non finies', () => {
    expect(buildGoogleMapsPlaceUrl({ lat: Number.NaN, lng: 2.33, query: 'Paris' })).toBe(
      'https://www.google.com/maps/search/?api=1&query=Paris',
    )
  })

  it('retourne null sans aucune donnée', () => {
    expect(buildGoogleMapsPlaceUrl({})).toBeNull()
    expect(buildGoogleMapsPlaceUrl({ url: '  ', query: '' })).toBeNull()
  })
})

describe('buildGoogleMapsDirectionsUrl', () => {
  it('privilégie l’adresse postale', () => {
    expect(
      buildGoogleMapsDirectionsUrl({ address: '12 Rue de la Paix, Paris', placeId: 'p1' }),
    ).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=12%20Rue%20de%20la%20Paix%2C%20Paris',
    )
  })

  it('replie sur placeId, coordonnées puis requête', () => {
    expect(buildGoogleMapsDirectionsUrl({ placeId: 'p1' })).toBe(
      'https://www.google.com/maps/dir/?api=1&destination_place_id=p1',
    )
    expect(buildGoogleMapsDirectionsUrl({ lat: 45.76, lng: 4.83 })).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=45.76%2C4.83',
    )
    expect(buildGoogleMapsDirectionsUrl({ query: 'Lyon' })).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=Lyon',
    )
  })

  it('retourne null sans destination', () => {
    expect(buildGoogleMapsDirectionsUrl({})).toBeNull()
  })
})
