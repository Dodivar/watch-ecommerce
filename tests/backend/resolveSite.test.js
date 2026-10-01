/**
 * Résolution du locataire (`backend/middleware/resolveSite.js`).
 *
 * Ce que ces tests protègent : le backend est mutualisé, et `X-Site-Id` / `:siteId` sont
 * **déclarés par l'appelant** alors que l'`Origin` est posée par le navigateur. Sans
 * recoupement, une page servie par la vitrine A obtient le contexte de la vitrine B — donc
 * son compte Mailjet et sa base — sur les routes résolues par origine et non authentifiées.
 *
 * Les deux échappatoires sont volontaires et testées comme telles :
 * 1. pas d'`Origin` (curl, Stripe) → la déclaration fait foi, comme avant ;
 * 2. `Origin` revendiquée par plusieurs sites (`http://localhost:5173` chez les quatre
 *    manifests) → elle ne prouve rien, donc elle n'infirme rien.
 */
import { createRequire } from 'node:module'

import { describe, expect, it, vi } from 'vitest'

const require = createRequire(import.meta.url)
const {
  resolveSite,
  resolveSiteResult,
  RESOLUTION_OK,
  RESOLUTION_SITE_MISMATCH,
} = require('../../backend/middleware/resolveSite.js')

const SAUVAGE = { id: 'sauvage-watches' }
const PLACE = { id: 'place-des-montres' }

/** Registre minimal : deux sites en production, une origine de dev partagée. */
function buildFakeRegistry() {
  return {
    byId: new Map([
      [SAUVAGE.id, SAUVAGE],
      [PLACE.id, PLACE],
    ]),
    byOrigin: new Map([
      ['https://www.sauvage-watches.fr', SAUVAGE],
      ['https://www.placedesmontres.fr', PLACE],
      // Premier site chargé : le registre garde l'incumbent et marque l'origine ambiguë.
      ['http://localhost:5173', SAUVAGE],
    ]),
    byHost: new Map([['www.sauvage-watches.fr', SAUVAGE]]),
    ambiguousOrigins: new Set(['http://localhost:5173']),
  }
}

function makeReq({ headers = {}, params = {} } = {}) {
  return { headers, params }
}

describe('resolveSiteResult', () => {
  const registry = buildFakeRegistry()

  it('accepte un site déclaré sans Origin (curl, appel serveur, webhook Stripe)', () => {
    const result = resolveSiteResult(
      makeReq({ headers: { 'x-site-id': 'place-des-montres' } }),
      registry,
    )

    expect(result.reason).toBe(RESOLUTION_OK)
    expect(result.site).toBe(PLACE)
  })

  it('accepte le param :siteId du webhook Stripe, qui arrive sans Origin', () => {
    const result = resolveSiteResult(
      makeReq({ params: { siteId: 'place-des-montres' } }),
      registry,
    )

    expect(result.reason).toBe(RESOLUTION_OK)
    expect(result.site).toBe(PLACE)
  })

  it('accepte un site déclaré cohérent avec son Origin', () => {
    const result = resolveSiteResult(
      makeReq({
        headers: {
          'x-site-id': 'place-des-montres',
          origin: 'https://www.placedesmontres.fr',
        },
      }),
      registry,
    )

    expect(result.reason).toBe(RESOLUTION_OK)
    expect(result.site).toBe(PLACE)
  })

  it("refuse un site déclaré qui contredit l'Origin, sans arbitrer", () => {
    const result = resolveSiteResult(
      makeReq({
        headers: {
          'x-site-id': 'place-des-montres',
          origin: 'https://www.sauvage-watches.fr',
        },
      }),
      registry,
    )

    expect(result.reason).toBe(RESOLUTION_SITE_MISMATCH)
    expect(result.site).toBeNull()
    expect(result.declaredId).toBe('place-des-montres')
    expect(result.originId).toBe('sauvage-watches')
  })

  it('refuse aussi la contradiction portée par le param :siteId du webhook', () => {
    const result = resolveSiteResult(
      makeReq({
        params: { siteId: 'place-des-montres' },
        headers: { origin: 'https://www.sauvage-watches.fr' },
      }),
      registry,
    )

    expect(result.reason).toBe(RESOLUTION_SITE_MISMATCH)
    expect(result.declaredSource).toBe(':siteId')
  })

  it("laisse passer la contradiction sur une origine ambiguë : localhost n'appartient à personne", () => {
    const result = resolveSiteResult(
      makeReq({
        headers: {
          'x-site-id': 'place-des-montres',
          origin: 'http://localhost:5173',
        },
      }),
      registry,
    )

    expect(result.reason).toBe(RESOLUTION_OK)
    expect(result.site).toBe(PLACE)
  })

  it('retombe sur l\'Origin quand le X-Site-Id déclaré est inconnu (faute de frappe)', () => {
    const result = resolveSiteResult(
      makeReq({
        headers: {
          'x-site-id': 'site-qui-nexiste-pas',
          origin: 'https://www.placedesmontres.fr',
        },
      }),
      registry,
    )

    expect(result.reason).toBe(RESOLUTION_OK)
    expect(result.site).toBe(PLACE)
  })
})

describe('middleware resolveSite', () => {
  const registry = buildFakeRegistry()

  function runMiddleware(req, opts) {
    const next = vi.fn()
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() }
    resolveSite(registry, opts)(req, res, next)
    return { next, res }
  }

  it('pose req.site quand la résolution aboutit', () => {
    const req = makeReq({ headers: { origin: 'https://www.placedesmontres.fr' } })
    const { next, res } = runMiddleware(req)

    expect(next).toHaveBeenCalledOnce()
    expect(res.status).not.toHaveBeenCalled()
    expect(req.site).toBe(PLACE)
  })

  it('répond 400 sans poser req.site sur contradiction déclaré / Origin', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const req = makeReq({
      headers: {
        'x-site-id': 'place-des-montres',
        origin: 'https://www.sauvage-watches.fr',
      },
    })

    const { next, res } = runMiddleware(req)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(next).not.toHaveBeenCalled()
    expect(req.site).toBeUndefined()
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })
})
