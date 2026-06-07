import { describe, expect, it } from 'vitest'

import { resolveSeoRouteRedirect } from './seoRouteGuards.js'

describe('resolveSeoRouteRedirect', () => {
  it('redirige /collection?marque= vers /collection/:slug', () => {
    expect(
      resolveSeoRouteRedirect({
        path: '/collection',
        params: {},
        query: { marque: 'rolex' },
        hash: '',
      }),
    ).toEqual({
      path: '/collection/rolex',
      query: {},
      hash: '',
    })
  })

  it('conserve les filtres additionnels en query', () => {
    expect(
      resolveSeoRouteRedirect({
        path: '/collection',
        params: {},
        query: { marque: 'rolex', public: 'homme' },
        hash: '',
      }),
    ).toBeNull()
  })

  it('redirige /watch/:slug vers /montre/:slug', () => {
    expect(
      resolveSeoRouteRedirect({
        path: '/watch/rolex-submariner',
        params: { id: 'rolex-submariner' },
        query: {},
        hash: '',
      }),
    ).toEqual({
      path: '/montre/rolex-submariner',
      query: {},
      hash: '',
    })
  })
})
