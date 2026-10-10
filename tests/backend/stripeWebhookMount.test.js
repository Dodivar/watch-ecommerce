/**
 * Webhook Stripe joué contre l'application **entière** (`createApp`), avec le vrai registre.
 *
 * `server.js` montait `app.use('/api', resolveSite(registry), mailjetRoutes)` avant le routeur
 * Stripe : ce `resolveSite` couvrait tout `/api/*`. Stripe n'envoie ni `Origin` ni `X-Site-Id`,
 * et l'hôte est celui du backend mutualisé : chaque webhook recevait 400 « Unknown site » avant
 * d'atteindre `/webhook/:siteId` — `stripe_processed_events` est resté vide en production.
 *
 * Les deux réponses fautive et attendue sont des 400 : seul le corps les distingue.
 *
 * Le mode production est forcé : hors production, `resolveSite` retombe sur `sauvage-watches`
 * et masquerait exactement ce défaut.
 */
import { createRequire } from 'node:module'
import process from 'node:process'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const require = createRequire(import.meta.url)

const SITE_ID = 'sauvage-watches'
const WEBHOOK_SECRET = 'whsec_test_mount'

const ENV = {
  RENDER: 'true',
  SITE_SAUVAGE_WATCHES__STRIPE_SECRET_KEY: 'sk_test_mount',
  SITE_SAUVAGE_WATCHES__STRIPE_WEBHOOK_SECRET: WEBHOOK_SECRET,
}
const savedEnv = Object.fromEntries(Object.keys(ENV).map((k) => [k, process.env[k]]))

// Aucun événement testé ici n'écrit : une base qui échoue au moindre appel le garantit.
const siteClients = require('../../backend/utils/siteClients.js')
siteClients.getSupabaseClient = () => ({
  from() {
    throw new Error('Supabase ne doit pas être appelé')
  },
})

let server
let baseUrl

beforeAll(async () => {
  Object.assign(process.env, ENV)
  // Chargés APRÈS la doublure et l'env : les routes déstructurent `getSupabaseClient` à
  // l'import, et le registre fige les secrets à sa construction.
  const { buildRegistry } = require('../../backend/sites/registry.js')
  const { createApp } = require('../../backend/server.js')
  const app = createApp(await buildRegistry())
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve)
  })
  baseUrl = `http://127.0.0.1:${server.address().port}`
})

afterAll(async () => {
  for (const [k, v] of Object.entries(savedEnv)) {
    if (v === undefined) delete process.env[k]
    else process.env[k] = v
  }
  await new Promise((resolve) => server.close(resolve))
})

/** Requête « serveur à serveur » : ni Origin, ni X-Site-Id, hôte du backend. */
function postWebhook(path, payload, signature) {
  return fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Stripe-Signature': signature },
    body: payload,
  })
}

describe('webhook Stripe contre l’application montée', () => {
  it('une signature invalide est rejetée par Stripe, pas par la résolution de site', async () => {
    const res = await postWebhook(
      `/api/stripe/webhook/${SITE_ID}`,
      JSON.stringify({ id: 'evt_bad', type: 'payment_intent.succeeded' }),
      't=1,v1=deadbeef',
    )
    const body = await res.text()
    expect(body).not.toContain('Unknown site')
    expect(res.status).toBe(400)
    expect(body).toContain('signature verification failed')
  })

  it('un événement signé arrive intact (corps brut) et est accusé', async () => {
    const Stripe = require('stripe')
    const payload = JSON.stringify({ id: 'evt_mount', object: 'event', type: 'customer.created' })
    const signature = Stripe.webhooks.generateTestHeaderString({
      payload,
      secret: WEBHOOK_SECRET,
    })
    const res = await postWebhook(`/api/stripe/webhook/${SITE_ID}`, payload, signature)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ received: true })
  })

  it('l’ancienne URL sans site atteint aussi le routeur', async () => {
    const res = await postWebhook('/api/stripe/webhook', '{}', 't=1,v1=deadbeef')
    const body = await res.text()
    expect(body).not.toContain('Unknown site')
    expect(body).toContain('signature verification failed')
  })

  it('les routes Mailjet exigent toujours un site', async () => {
    const res = await fetch(`${baseUrl}/api/send-email`, { method: 'POST' })
    expect(res.status).toBe(400)
    expect((await res.json()).error).toContain('Unknown site')
  })
})
