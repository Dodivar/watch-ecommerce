import { createRequire } from 'node:module'
import http from 'node:http'
import { describe, expect, it } from 'vitest'

const require = createRequire(import.meta.url)
const {
  aggregateGlobalStatus,
  aggregateSiteStatus,
  runDeepCheck,
} = require('../../backend/health/deepCheck.js')
const { createCachedRunner } = require('../../backend/health/cache.js')
const { buildHealthRouter, parseRequiredSites } = require('../../backend/routes/health.js')
// `express` du workspace racine : la CI n'installe que les dépendances racine
// (`npm ci` à la racine), donc `backend/node_modules` n'existe pas sur le runner.
const express = require('express')

function fakeRegistry(sites) {
  const byId = new Map(sites.map((site) => [site.id, site]))
  return { byId, list: () => sites }
}

const OK = () => Promise.resolve({ status: 'ok', durationMs: 1 })
const DOWN = () => Promise.resolve({ status: 'down', durationMs: 1, error: 'boom' })
const NOT_CONFIGURED = () =>
  Promise.resolve({ status: 'not_configured', durationMs: 0, missing: ['X'] })

/**
 * Démarre l'app Express sur un port éphémère et renvoie l'URL de base.
 */
async function startServer(router) {
  const app = express()
  app.use('/api/health', router)
  const server = http.createServer(app)
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address()
  return {
    url: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve) => server.close(resolve)),
  }
}

describe('agrégation des statuts', () => {
  it('une dépendance dure HS met le site down', () => {
    expect(
      aggregateSiteStatus({
        supabaseDb: { status: 'down' },
        supabaseStorage: { status: 'ok' },
        stripe: { status: 'ok' },
        mailjet: { status: 'ok' },
      }),
    ).toBe('down')
  })

  it('une dépendance souple HS met le site degraded', () => {
    expect(
      aggregateSiteStatus({
        supabaseDb: { status: 'ok' },
        supabaseStorage: { status: 'ok' },
        stripe: { status: 'ok' },
        mailjet: { status: 'down' },
      }),
    ).toBe('degraded')
  })

  it('un secret manquant ne vaut pas panne', () => {
    expect(
      aggregateSiteStatus({
        supabaseDb: { status: 'ok' },
        supabaseStorage: { status: 'ok' },
        stripe: { status: 'not_configured' },
        mailjet: { status: 'not_configured' },
      }),
    ).toBe('ok')
  })

  it('un site entièrement non configuré est neutre pour le global', () => {
    expect(
      aggregateGlobalStatus({
        'demo-store': { status: 'not_configured' },
        'sauvage-watches': { status: 'ok' },
      }),
    ).toBe('ok')
  })

  it('sur un site déclaré en production, un secret manquant vaut panne', () => {
    // Cas réel visé : SITE_X__SUPABASE_URL effacé des variables Render. Sans
    // cette règle, toutes les sondes passent `not_configured` et le monitoring
    // reste vert pendant que la boutique est morte.
    expect(
      aggregateSiteStatus(
        {
          supabaseDb: { status: 'not_configured' },
          supabaseStorage: { status: 'not_configured' },
          stripe: { status: 'ok' },
          mailjet: { status: 'ok' },
        },
        { required: true },
      ),
    ).toBe('down')
  })

  it('sur un site en production, un tiers souple non configuré dégrade', () => {
    expect(
      aggregateSiteStatus(
        {
          supabaseDb: { status: 'ok' },
          supabaseStorage: { status: 'ok' },
          stripe: { status: 'ok' },
          mailjet: { status: 'not_configured' },
        },
        { required: true },
      ),
    ).toBe('degraded')
  })

  it('le global suit le pire site', () => {
    expect(
      aggregateGlobalStatus({
        a: { status: 'ok' },
        b: { status: 'degraded' },
        c: { status: 'down' },
      }),
    ).toBe('down')
  })
})

describe('runDeepCheck', () => {
  const registry = fakeRegistry([{ id: 'site-a' }, { id: 'site-b' }])

  it('sonde chaque site et rapporte le détail', async () => {
    const payload = await runDeepCheck(registry, {
      probes: { supabaseDb: OK, supabaseStorage: OK, stripe: DOWN, mailjet: NOT_CONFIGURED },
    })
    expect(payload.status).toBe('down')
    expect(Object.keys(payload.sites)).toEqual(['site-a', 'site-b'])
    expect(payload.sites['site-a'].checks.stripe.status).toBe('down')
    expect(payload.sites['site-a'].checks.mailjet.missing).toEqual(['X'])
  })

  it('applique la sévérité « production » aux seuls sites listés', async () => {
    const payload = await runDeepCheck(registry, {
      requiredSiteIds: ['site-a'],
      probes: {
        supabaseDb: NOT_CONFIGURED,
        supabaseStorage: NOT_CONFIGURED,
        stripe: NOT_CONFIGURED,
        mailjet: NOT_CONFIGURED,
      },
    })
    expect(payload.requiredSites).toEqual(['site-a'])
    expect(payload.sites['site-a'].status).toBe('down')
    expect(payload.sites['site-b'].status).toBe('not_configured')
    expect(payload.status).toBe('down')
  })

  it('restreint à un site avec siteId', async () => {
    const payload = await runDeepCheck(registry, {
      siteId: 'site-b',
      probes: { supabaseDb: OK, stripe: OK },
    })
    expect(Object.keys(payload.sites)).toEqual(['site-b'])
  })
})

describe('parseRequiredSites', () => {
  const registry = fakeRegistry([{ id: 'site-a' }, { id: 'site-b' }])

  it('ne retient que les sites connus du registre', () => {
    expect(parseRequiredSites('site-a, inconnu ,site-b', registry)).toEqual(['site-a', 'site-b'])
  })

  it('rend une liste vide sans configuration', () => {
    expect(parseRequiredSites('', registry)).toEqual([])
    expect(parseRequiredSites(undefined, registry)).toEqual([])
  })
})

describe('cache TTL + single-flight', () => {
  it('ne relance pas le check tant que le TTL court', async () => {
    let calls = 0
    const runner = createCachedRunner(async () => {
      calls += 1
      return { status: 'ok' }
    }, 60000)

    const first = await runner.run()
    const second = await runner.run()
    expect(calls).toBe(1)
    expect(first.cached).toBe(false)
    expect(second.cached).toBe(true)
  })

  it('dédoublonne les appels concurrents', async () => {
    let calls = 0
    const runner = createCachedRunner(async () => {
      calls += 1
      await new Promise((resolve) => setTimeout(resolve, 10))
      return { status: 'ok' }
    }, 60000)

    await Promise.all([runner.run(), runner.run(), runner.run()])
    expect(calls).toBe(1)
  })

  it('force relance le check', async () => {
    let calls = 0
    const runner = createCachedRunner(async () => {
      calls += 1
      return { status: 'ok' }
    }, 60000)

    await runner.run()
    await runner.run({ force: true })
    expect(calls).toBe(2)
  })

  it('expire après le TTL', async () => {
    let calls = 0
    const runner = createCachedRunner(async () => {
      calls += 1
      return { status: 'ok' }
    }, 5)

    await runner.run()
    await new Promise((resolve) => setTimeout(resolve, 15))
    await runner.run()
    expect(calls).toBe(2)
  })
})

describe('routes de supervision', () => {
  const registry = fakeRegistry([{ id: 'site-a' }])

  it('répond 503 disabled sans HEALTH_CHECK_TOKEN', async () => {
    const server = await startServer(buildHealthRouter(registry, { token: null }))
    try {
      const res = await fetch(`${server.url}/api/health/deep`)
      expect(res.status).toBe(503)
      expect((await res.json()).status).toBe('disabled')
    } finally {
      await server.close()
    }
  })

  it('répond 401 sur mauvais jeton, sans rien divulguer', async () => {
    const server = await startServer(
      buildHealthRouter(registry, {
        token: 'secret-token',
        deepRunner: async () => ({ status: 'ok', sites: {} }),
      }),
    )
    try {
      const res = await fetch(`${server.url}/api/health/deep`, {
        headers: { 'X-Health-Token': 'wrong' },
      })
      expect(res.status).toBe(401)
      expect(await res.json()).toEqual({ status: 'unauthorized' })
    } finally {
      await server.close()
    }
  })

  it('renvoie 503 quand une dépendance dure est HS, 200 sinon', async () => {
    let status = 'ok'
    const server = await startServer(
      buildHealthRouter(registry, {
        token: 'secret-token',
        deepTtlMs: 1,
        deepRunner: async () => ({ status, sites: {} }),
      }),
    )
    try {
      const okRes = await fetch(`${server.url}/api/health/deep`, {
        headers: { authorization: 'Bearer secret-token' },
      })
      expect(okRes.status).toBe(200)

      status = 'down'
      const downRes = await fetch(`${server.url}/api/health/deep?force=1`, {
        headers: { authorization: 'Bearer secret-token' },
      })
      expect(downRes.status).toBe(503)
    } finally {
      await server.close()
    }
  })

  it('degraded reste 200 sauf en strict', async () => {
    const server = await startServer(
      buildHealthRouter(registry, {
        token: 'secret-token',
        deepTtlMs: 1,
        deepRunner: async () => ({ status: 'degraded', sites: {} }),
      }),
    )
    try {
      const lax = await fetch(`${server.url}/api/health/deep`, {
        headers: { 'X-Health-Token': 'secret-token' },
      })
      expect(lax.status).toBe(200)

      const strict = await fetch(`${server.url}/api/health/deep?strict=1`, {
        headers: { 'X-Health-Token': 'secret-token' },
      })
      expect(strict.status).toBe(503)
    } finally {
      await server.close()
    }
  })

  it('renvoie 404 sur un site inconnu', async () => {
    const server = await startServer(
      buildHealthRouter(registry, {
        token: 'secret-token',
        deepRunner: async () => ({ status: 'ok', sites: {} }),
      }),
    )
    try {
      const res = await fetch(`${server.url}/api/health/deep?site=nope`, {
        headers: { 'X-Health-Token': 'secret-token' },
      })
      expect(res.status).toBe(404)
    } finally {
      await server.close()
    }
  })

  it('/payments alerte en 503 dès un paiement orphelin', async () => {
    const server = await startServer(
      buildHealthRouter(registry, {
        token: 'secret-token',
        paymentsRunner: async () => ({
          status: 'alert',
          sites: { 'site-a': { status: 'alert', orphans: [{ paymentIntentId: 'pi_1' }] } },
        }),
      }),
    )
    try {
      const res = await fetch(`${server.url}/api/health/payments`, {
        headers: { 'X-Health-Token': 'secret-token' },
      })
      expect(res.status).toBe(503)
      expect((await res.json()).sites['site-a'].orphans).toHaveLength(1)
    } finally {
      await server.close()
    }
  })
})
