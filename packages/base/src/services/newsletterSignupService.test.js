import { afterEach, describe, expect, it, vi } from 'vitest'

import { subscribeToNewsletter } from './newsletterSignupService.js'

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('subscribeToNewsletter', () => {
  it('poste email et nom vers /api/newsletter/subscribe avec X-Site-Id', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ success: true }))
    vi.stubGlobal('fetch', fetchMock)

    const data = await subscribeToNewsletter({ email: 'client@example.com', name: 'Jean' })

    expect(data).toEqual({ success: true })
    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe('http://localhost:3000/api/newsletter/subscribe')
    expect(options.method).toBe('POST')
    expect(options.headers['X-Site-Id']).toBe('sauvage-watches')
    expect(JSON.parse(options.body)).toEqual({ email: 'client@example.com', name: 'Jean' })
  })

  it('omet le nom quand il est vide', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ success: true }))
    vi.stubGlobal('fetch', fetchMock)

    await subscribeToNewsletter({ email: 'client@example.com' })

    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      email: 'client@example.com',
    })
  })

  it('remonte le message d’erreur du backend', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ error: 'Email invalide' }, 422)),
    )

    await expect(subscribeToNewsletter({ email: 'nope' })).rejects.toThrow('Email invalide')
  })

  it('rejette aussi un 200 avec success:false', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ success: false, message: 'Déjà inscrit' })),
    )

    await expect(subscribeToNewsletter({ email: 'client@example.com' })).rejects.toThrow(
      'Déjà inscrit',
    )
  })

  it('replie sur un message générique sans détail backend', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({}, 500)))

    await expect(subscribeToNewsletter({ email: 'client@example.com' })).rejects.toThrow(
      "Échec de l'inscription",
    )
  })
})
