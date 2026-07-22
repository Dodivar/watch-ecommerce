import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'

const require = createRequire(import.meta.url)
const { splitMailjetResults, unsubscribeHeaders } = require('../../backend/routes/newsletter.js')
const { createRateLimiter } = require('../../backend/utils/simpleRateLimit.js')

describe('splitMailjetResults', () => {
  const batch = [{ email: 'a@x.fr' }, { email: 'b@x.fr' }, { email: 'c@x.fr' }]

  it('ventile envoyés et refusés selon les statuts par message', () => {
    const response = {
      body: {
        Messages: [
          { Status: 'success' },
          { Status: 'error', Errors: [{ ErrorMessage: 'destinataire invalide' }] },
          { Status: 'success' },
        ],
      },
    }
    const { sent, failed } = splitMailjetResults(batch, response)
    expect(sent).toEqual(['a@x.fr', 'c@x.fr'])
    expect(failed).toEqual([{ email: 'b@x.fr', error: 'destinataire invalide' }])
  })

  it('considère le lot envoyé si la réponse est inexploitable (comportement historique)', () => {
    const { sent, failed } = splitMailjetResults(batch, { body: {} })
    expect(sent).toEqual(['a@x.fr', 'b@x.fr', 'c@x.fr'])
    expect(failed).toEqual([])
  })

  it('replie sur un message générique quand Mailjet ne détaille pas l’erreur', () => {
    const response = { body: { Messages: [{ Status: 'error' }] } }
    const { failed } = splitMailjetResults([{ email: 'a@x.fr' }], response)
    expect(failed[0].error).toBe('Refusé par Mailjet')
  })
})

describe('unsubscribeHeaders', () => {
  it('produit les en-têtes one-click RFC 8058 attendus par Gmail/Yahoo', () => {
    const headers = unsubscribeHeaders('https://api.x.fr/api/newsletter/unsubscribe?token=t1')
    expect(headers['List-Unsubscribe']).toBe(
      '<https://api.x.fr/api/newsletter/unsubscribe?token=t1>',
    )
    expect(headers['List-Unsubscribe-Post']).toBe('List-Unsubscribe=One-Click')
  })
})

describe('createRateLimiter', () => {
  it('autorise jusqu’à max requêtes dans la fenêtre puis refuse', () => {
    const limiter = createRateLimiter({ windowMs: 60_000, max: 3 })
    const t0 = 1_000_000
    expect(limiter.check('k', t0)).toBe(true)
    expect(limiter.check('k', t0 + 1)).toBe(true)
    expect(limiter.check('k', t0 + 2)).toBe(true)
    expect(limiter.check('k', t0 + 3)).toBe(false)
  })

  it('réautorise une fois la fenêtre glissée', () => {
    const limiter = createRateLimiter({ windowMs: 60_000, max: 1 })
    const t0 = 1_000_000
    expect(limiter.check('k', t0)).toBe(true)
    expect(limiter.check('k', t0 + 30_000)).toBe(false)
    expect(limiter.check('k', t0 + 60_001)).toBe(true)
  })

  it('isole les clés (sites / IP) entre elles', () => {
    const limiter = createRateLimiter({ windowMs: 60_000, max: 1 })
    expect(limiter.check('site-a:ip1', 1000)).toBe(true)
    expect(limiter.check('site-b:ip1', 1001)).toBe(true)
    expect(limiter.check('site-a:ip2', 1002)).toBe(true)
  })
})
