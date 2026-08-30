import { createRequire } from 'node:module'
import http from 'node:http'
import { describe, expect, it, vi } from 'vitest'

const require = createRequire(import.meta.url)
const {
  buildReviewsRouter,
  mapPlaceDetailsToPayload,
  resolveLanguageCode,
} = require('../../backend/routes/reviews.js')
const { normalizeGoogleReviews } = require('../../backend/sites/normalize.js')
// `express` du workspace racine : la CI n'installe que les dépendances racine
// (`npm ci` à la racine), donc `backend/node_modules` n'existe pas sur le runner.
const express = require('express')

function fakeRegistry(sites) {
  const byId = new Map(sites.map((site) => [site.id, site]))
  return { byId, list: () => sites }
}

/**
 * Site minimal tel que `buildRegistry()` le produit : `config` normalisé + `secrets`.
 */
function fakeSite({ placeId = 'ChIJtest', apiKey = 'server-key', maxReviews = 5 } = {}) {
  return {
    id: 'place-des-montres',
    config: { googleReviews: normalizeGoogleReviews({ placeId, maxReviews }) },
    secrets: { googlePlaces: { apiKey } },
  }
}

/** Démarre l'app Express sur un port éphémère, avec le site injecté comme `resolveSite` le ferait. */
async function startServer(router, site) {
  const app = express()
  app.use(
    '/api/reviews',
    (req, _res, next) => {
      req.site = site
      next()
    },
    router,
  )
  const server = http.createServer(app)
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address()
  return {
    url: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve) => server.close(resolve)),
  }
}

function placeResponse(reviews) {
  return {
    id: 'ChIJtest',
    rating: 4.7,
    userRatingCount: 128,
    googleMapsUri: 'https://maps.google.com/?cid=42',
    reviews,
  }
}

function review({ name, rating = 5, text = 'Très bon accueil.', publishTime, author = 'Alice' }) {
  return {
    name,
    rating,
    text: { text, languageCode: 'fr' },
    publishTime,
    relativePublishTimeDescription: 'il y a un mois',
    authorAttribution: {
      displayName: author,
      photoUri: 'https://lh3.googleusercontent.com/a/photo',
      uri: 'https://www.google.com/maps/contrib/1',
    },
  }
}

describe('mapPlaceDetailsToPayload', () => {
  it('trie du plus récent au plus ancien et tronque à maxReviews', () => {
    const payload = mapPlaceDetailsToPayload(
      placeResponse([
        review({ name: 'r/ancien', publishTime: '2024-01-01T10:00:00Z' }),
        review({ name: 'r/recent', publishTime: '2026-05-01T10:00:00Z' }),
        review({ name: 'r/milieu', publishTime: '2025-03-01T10:00:00Z' }),
      ]),
      2,
    )

    expect(payload.reviews.map((r) => r.id)).toEqual(['r/recent', 'r/milieu'])
    expect(payload.rating).toBe(4.7)
    expect(payload.userRatingCount).toBe(128)
    expect(payload.googleMapsUri).toBe('https://maps.google.com/?cid=42')
  })

  it('ne conserve que les champs affichés', () => {
    const payload = mapPlaceDetailsToPayload(
      placeResponse([review({ name: 'r/1', publishTime: '2026-05-01T10:00:00Z' })]),
      5,
    )

    expect(Object.keys(payload.reviews[0]).sort()).toEqual([
      'authorName',
      'authorPhotoUrl',
      'authorUri',
      'id',
      'publishTime',
      'rating',
      'relativeTime',
      'text',
    ])
  })

  it('ignore les avis sans note et les dates illisibles sans planter', () => {
    const payload = mapPlaceDetailsToPayload(
      placeResponse([
        { name: 'r/vide', text: { text: 'coucou' } },
        review({ name: 'r/sansDate', publishTime: 'pas-une-date' }),
        review({ name: 'r/ok', publishTime: '2026-05-01T10:00:00Z' }),
      ]),
      5,
    )

    expect(payload.reviews.map((r) => r.id)).toEqual(['r/ok', 'r/sansDate'])
  })

  it('renvoie une charge utile vide pour une réponse inattendue', () => {
    expect(mapPlaceDetailsToPayload(null, 5)).toEqual({
      rating: null,
      userRatingCount: 0,
      googleMapsUri: '',
      reviews: [],
    })
  })
})

describe('resolveLanguageCode', () => {
  it('accepte un code BCP 47 simple', () => {
    expect(resolveLanguageCode('de', 'fr')).toBe('de')
    expect(resolveLanguageCode('pt-BR', 'fr')).toBe('pt-BR')
  })

  it('retombe sur la config puis sur le français', () => {
    expect(resolveLanguageCode('<script>', 'de')).toBe('de')
    expect(resolveLanguageCode(undefined, '')).toBe('fr')
  })
})

describe('GET /api/reviews', () => {
  it('répond 503 sans placeId configuré', async () => {
    const site = fakeSite({ placeId: '' })
    const server = await startServer(buildReviewsRouter(fakeRegistry([site])), site)
    try {
      const res = await fetch(`${server.url}/api/reviews`)
      expect(res.status).toBe(503)
      expect((await res.json()).success).toBe(false)
    } finally {
      await server.close()
    }
  })

  it('répond 503 sans clé serveur', async () => {
    const site = fakeSite({ apiKey: null })
    const server = await startServer(buildReviewsRouter(fakeRegistry([site])), site)
    try {
      const res = await fetch(`${server.url}/api/reviews`)
      expect(res.status).toBe(503)
      expect((await res.json()).error).toMatch(/GOOGLE_PLACES_API_KEY/)
    } finally {
      await server.close()
    }
  })

  it('signale la clé absente dans le log serveur, une seule fois', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const site = fakeSite({ apiKey: null })
    const server = await startServer(buildReviewsRouter(fakeRegistry([site])), site)
    try {
      await fetch(`${server.url}/api/reviews`)
      await fetch(`${server.url}/api/reviews`)

      // Sans trace, un 503 permanent est invisible : la section disparaît et rien ne l'explique.
      expect(warn).toHaveBeenCalledTimes(1)
      expect(warn.mock.calls[0].join(' ')).toMatch(
        /SITE_PLACE_DES_MONTRES__GOOGLE_PLACES_API_KEY/,
      )
    } finally {
      await server.close()
      warn.mockRestore()
    }
  })

  it('renvoie les avis et transmet placeId, clé et langue au fetcher', async () => {
    const site = fakeSite()
    const fetcher = vi
      .fn()
      .mockResolvedValue(placeResponse([review({ name: 'r/1', publishTime: '2026-05-01T10:00:00Z' })]))
    const server = await startServer(buildReviewsRouter(fakeRegistry([site]), { fetcher }), site)

    try {
      const res = await fetch(`${server.url}/api/reviews?lang=de`)
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body.success).toBe(true)
      expect(body.data.reviews).toHaveLength(1)
      expect(body.cached).toBe(false)
      expect(fetcher).toHaveBeenCalledWith(
        expect.objectContaining({ placeId: 'ChIJtest', apiKey: 'server-key', languageCode: 'de' }),
      )
    } finally {
      await server.close()
    }
  })

  it('sert le cache au second appel et n’appelle Google qu’une fois', async () => {
    const site = fakeSite()
    const fetcher = vi
      .fn()
      .mockResolvedValue(placeResponse([review({ name: 'r/1', publishTime: '2026-05-01T10:00:00Z' })]))
    const server = await startServer(buildReviewsRouter(fakeRegistry([site]), { fetcher }), site)

    try {
      await fetch(`${server.url}/api/reviews`)
      const second = await (await fetch(`${server.url}/api/reviews`)).json()

      expect(second.cached).toBe(true)
      expect(fetcher).toHaveBeenCalledTimes(1)
    } finally {
      await server.close()
    }
  })

  it('cloisonne le cache par langue', async () => {
    const site = fakeSite()
    const fetcher = vi
      .fn()
      .mockResolvedValue(placeResponse([review({ name: 'r/1', publishTime: '2026-05-01T10:00:00Z' })]))
    const server = await startServer(buildReviewsRouter(fakeRegistry([site]), { fetcher }), site)

    try {
      await fetch(`${server.url}/api/reviews?lang=fr`)
      await fetch(`${server.url}/api/reviews?lang=en`)
      expect(fetcher).toHaveBeenCalledTimes(2)
    } finally {
      await server.close()
    }
  })

  it('rappelle Google une fois le TTL expiré', async () => {
    const site = fakeSite()
    const fetcher = vi
      .fn()
      .mockResolvedValue(placeResponse([review({ name: 'r/1', publishTime: '2026-05-01T10:00:00Z' })]))
    const server = await startServer(
      buildReviewsRouter(fakeRegistry([site]), { fetcher, ttlMs: 1 }),
      site,
    )

    try {
      await fetch(`${server.url}/api/reviews`)
      await new Promise((resolve) => setTimeout(resolve, 5))
      await fetch(`${server.url}/api/reviews`)
      expect(fetcher).toHaveBeenCalledTimes(2)
    } finally {
      await server.close()
    }
  })

  it('resert le dernier payload connu si Google tombe', async () => {
    const site = fakeSite()
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        placeResponse([review({ name: 'r/1', publishTime: '2026-05-01T10:00:00Z' })]),
      )
      .mockRejectedValue(new Error('Places API a répondu 500'))
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const server = await startServer(
      buildReviewsRouter(fakeRegistry([site]), { fetcher, ttlMs: 1 }),
      site,
    )

    try {
      await fetch(`${server.url}/api/reviews`)
      await new Promise((resolve) => setTimeout(resolve, 5))
      const res = await fetch(`${server.url}/api/reviews`)
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body.stale).toBe(true)
      expect(body.data.reviews).toHaveLength(1)
    } finally {
      error.mockRestore()
      await server.close()
    }
  })

  it('répond 502 si Google échoue sans cache disponible', async () => {
    const site = fakeSite()
    const fetcher = vi.fn().mockRejectedValue(new Error('timeout'))
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const server = await startServer(buildReviewsRouter(fakeRegistry([site]), { fetcher }), site)

    try {
      const res = await fetch(`${server.url}/api/reviews`)
      expect(res.status).toBe(502)
      expect((await res.json()).success).toBe(false)
    } finally {
      error.mockRestore()
      await server.close()
    }
  })
})

describe('normalizeGoogleReviews', () => {
  it('reste éteint sans placeId', () => {
    expect(normalizeGoogleReviews({ enabled: true })).toMatchObject({ enabled: false, placeId: '' })
    expect(normalizeGoogleReviews(undefined).enabled).toBe(false)
  })

  it('borne maxReviews au plafond de l’API', () => {
    expect(normalizeGoogleReviews({ placeId: 'ChIJ', maxReviews: 42 }).maxReviews).toBe(5)
    expect(normalizeGoogleReviews({ placeId: 'ChIJ', maxReviews: 3 }).maxReviews).toBe(3)
    expect(normalizeGoogleReviews({ placeId: 'ChIJ', maxReviews: 0 }).maxReviews).toBe(5)
  })

  it('respecte un enabled explicitement faux', () => {
    expect(normalizeGoogleReviews({ enabled: false, placeId: 'ChIJ' }).enabled).toBe(false)
  })
})
