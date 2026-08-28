import { describe, expect, it } from 'vitest'

import { MAX_GOOGLE_REVIEWS, resolveGoogleReviewsConfig } from './googleReviews.js'

describe('resolveGoogleReviewsConfig', () => {
  it('reste éteint sans bloc googleReviews', () => {
    expect(resolveGoogleReviewsConfig({})).toMatchObject({ enabled: false, placeId: '' })
    expect(resolveGoogleReviewsConfig(undefined).enabled).toBe(false)
  })

  it('reste éteint avec un placeId vide — c’est le placeholder livré aux clients', () => {
    expect(resolveGoogleReviewsConfig({ googleReviews: { enabled: true, placeId: '' } }).enabled).toBe(
      false,
    )
    expect(
      resolveGoogleReviewsConfig({ googleReviews: { enabled: true, placeId: '   ' } }).enabled,
    ).toBe(false)
  })

  it('s’active avec un placeId renseigné', () => {
    const resolved = resolveGoogleReviewsConfig({
      googleReviews: { enabled: true, placeId: '  ChIJabc  ' },
    })
    expect(resolved.enabled).toBe(true)
    expect(resolved.placeId).toBe('ChIJabc')
  })

  it('respecte un enabled explicitement faux', () => {
    expect(
      resolveGoogleReviewsConfig({ googleReviews: { enabled: false, placeId: 'ChIJabc' } }).enabled,
    ).toBe(false)
  })

  it('borne maxReviews au plafond de l’API Places', () => {
    const cfg = (maxReviews) =>
      resolveGoogleReviewsConfig({ googleReviews: { placeId: 'ChIJabc', maxReviews } }).maxReviews

    expect(cfg(42)).toBe(MAX_GOOGLE_REVIEWS)
    expect(cfg(3)).toBe(3)
    expect(cfg(0)).toBe(MAX_GOOGLE_REVIEWS)
    expect(cfg('deux')).toBe(MAX_GOOGLE_REVIEWS)
  })

  it('retombe sur l’URL de la carte boutique pour le lien vers la fiche', () => {
    const resolved = resolveGoogleReviewsConfig({
      googleReviews: { placeId: 'ChIJabc' },
      storeMap: { googleMapsUrl: 'https://maps.google.com/place' },
    })
    expect(resolved.profileUrl).toBe('https://maps.google.com/place')
  })

  it('privilégie profileUrl quand le manifest le déclare', () => {
    const resolved = resolveGoogleReviewsConfig({
      googleReviews: { placeId: 'ChIJabc', profileUrl: 'https://g.page/boutique' },
      storeMap: { googleMapsUrl: 'https://maps.google.com/place' },
    })
    expect(resolved.profileUrl).toBe('https://g.page/boutique')
  })
})
