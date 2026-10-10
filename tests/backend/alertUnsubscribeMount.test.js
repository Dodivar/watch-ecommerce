/**
 * Liens de désinscription « coup de foudre » joués contre l'application **entière**
 * (`createApp`), avec le vrai registre des sites.
 *
 * Ce que les tests de routeur ne peuvent pas voir : l'ordre des montages. `server.js` monte
 * `app.use('/api', resolveSite(registry), …)` avant les autres, et ce `resolveSite` couvre tout
 * `/api/*`. Un lien d'e-mail — ouvert depuis la messagerie, ou POSTé par les serveurs de Gmail
 * pour le one-click — n'a ni `Origin` ni `X-Site-Id`, et l'hôte est celui du backend mutualisé :
 * il recevait « Unknown site » avant d'atteindre sa route.
 *
 * Le mode production est forcé : hors production, `resolveSite` retombe sur `sauvage-watches`
 * et masquerait exactement ce défaut.
 */
import { createRequire } from 'node:module'
import process from 'node:process'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const require = createRequire(import.meta.url)

const TOKEN = '6f1c2a4e-8b3d-4c5e-9f10-a1b2c3d4e5f6'
const SITE_ID = 'sauvage-watches'

/** Base en mémoire : une alerte Sauvage active. */
const rows = [
  {
    id: 'a1',
    site_id: SITE_ID,
    email: 'client@example.fr',
    status: 'active',
    locale: 'fr',
    criteria: { brand: ['rolex'] },
    unsubscribe_token: TOKEN,
  },
]

function fakeSupabase() {
  return {
    from() {
      const filters = []
      let update = null
      const b = {
        select: () => b,
        eq(col, val) {
          filters.push((r) => r[col] === val)
          return b
        },
        update(values) {
          update = values
          return b
        },
        maybeSingle: async () => ({
          data: rows.find((r) => filters.every((f) => f(r))) || null,
          error: null,
        }),
        then(resolve, reject) {
          const hit = rows.filter((r) => filters.every((f) => f(r)))
          if (update) hit.forEach((r) => Object.assign(r, update))
          return Promise.resolve({ data: hit, error: null }).then(resolve, reject)
        },
      }
      return b
    },
  }
}

const siteClients = require('../../backend/utils/siteClients.js')
siteClients.getSupabaseClient = () => fakeSupabase()

let server
let baseUrl
const savedEnv = { RENDER: process.env.RENDER }

beforeAll(async () => {
  process.env.RENDER = 'true'
  // Chargés APRÈS la doublure : les routes déstructurent `getSupabaseClient` à l'import.
  const { buildRegistry } = require('../../backend/sites/registry.js')
  const { createApp } = require('../../backend/server.js')
  const app = createApp(await buildRegistry())
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve)
  })
  baseUrl = `http://127.0.0.1:${server.address().port}`
})

afterAll(async () => {
  if (savedEnv.RENDER === undefined) delete process.env.RENDER
  else process.env.RENDER = savedEnv.RENDER
  await new Promise((resolve) => server.close(resolve))
})

/** Requête « hors navigateur » : ni Origin, ni X-Site-Id, hôte du backend. */
function request(method, path) {
  return fetch(`${baseUrl}${path}`, { method, redirect: 'manual' })
}

describe('liens de désinscription contre l’application montée', () => {
  it('le lien d’e-mail renvoie vers la vitrine du client, jeton en ancre', async () => {
    const res = await request(
      'GET',
      `/api/sites/${SITE_ID}/watch-match-alerts/unsubscribe?token=${TOKEN}`,
    )
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe(
      `https://www.sauvage-watches.fr/coup-de-foudre/desabonnement#token=${TOKEN}`,
    )
    expect(rows[0].status).toBe('active')
  })

  it('un lien déjà envoyé, sans site dans le chemin, y mène aussi', async () => {
    const res = await request('GET', `/api/watch-match-alerts/unsubscribe?token=${TOKEN}`)
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toContain('https://www.sauvage-watches.fr/')
  })

  it('le one-click de la messagerie désinscrit', async () => {
    const res = await request(
      'POST',
      `/api/sites/${SITE_ID}/watch-match-alerts/unsubscribe?token=${TOKEN}`,
    )
    expect(res.status).toBe(200)
    expect(rows[0].status).toBe('unsubscribed')
  })

  it('les autres routes gardent leur exigence de site déclaré', async () => {
    const res = await request('GET', '/api/watch-match-alerts/preferences')
    expect(res.status).toBe(400)
  })
})
