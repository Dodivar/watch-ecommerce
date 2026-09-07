/**
 * Résolution des secrets par site (`backend/sites/secrets.js`).
 *
 * Ce que ces tests protègent :
 * 1. Mailjet retombe sur le compte partagé pour **n'importe quelle** vitrine — sans cette
 *    règle, un site provisionné sans clé dédiée perdait tous ses e-mails en silence
 *    (`MissingSecretsError` traduite en 503, ou simple `console.warn` côté commande) ;
 * 2. le repli partagé ne rouvre rien pour Stripe ni Supabase : l'argent et les données
 *    d'un client ne doivent jamais retomber sur le compte d'un autre ;
 * 3. la variable préfixée gagne toujours, et le repli historique garde son warning.
 */
import { createRequire } from 'node:module'
import process from 'node:process'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const require = createRequire(import.meta.url)

/** Le module mémorise les warnings déjà émis : rechargé à chaque test. */
function loadSecrets() {
  const path = require.resolve('../../backend/sites/secrets.js')
  delete require.cache[path]
  return require(path)
}

const TOUCHED = [
  'MAILJET_API_KEY',
  'MAILJET_SECRET_KEY',
  'STRIPE_SECRET_KEY',
  'SUPABASE_URL',
  'SITE_JACKNED__MAILJET_API_KEY',
  'SITE_JACKNED__STRIPE_SECRET_KEY',
  'SITE_SAUVAGE_WATCHES__MAILJET_API_KEY',
  // Posée par l'environnement d'exécution des tests : sans ce nettoyage, elle
  // déclencherait son propre warning de repli historique et fausserait le compte.
  'BASE_URL',
]

let saved

beforeEach(() => {
  saved = Object.fromEntries(TOUCHED.map((key) => [key, process.env[key]]))
  for (const key of TOUCHED) delete process.env[key]
})

afterEach(() => {
  for (const [key, value] of Object.entries(saved)) {
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
  vi.restoreAllMocks()
})

describe('compte Mailjet partagé', () => {
  it('sert de défaut à une vitrine sans clé dédiée', () => {
    process.env.MAILJET_API_KEY = 'cle-partagee'
    process.env.MAILJET_SECRET_KEY = 'secret-partage'

    const { getSiteSecrets } = loadSecrets()
    expect(getSiteSecrets('jackned').mailjet).toEqual({
      apiKey: 'cle-partagee',
      secretKey: 'secret-partage',
    })
  })

  it('ne réclame pas de migration : le repli partagé est silencieux', () => {
    process.env.MAILJET_API_KEY = 'cle-partagee'
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const { getSiteSecrets } = loadSecrets()
    getSiteSecrets('place-des-montres')

    expect(warn).not.toHaveBeenCalled()
  })

  it('cède la place à la clé dédiée du site', () => {
    process.env.MAILJET_API_KEY = 'cle-partagee'
    process.env.SITE_JACKNED__MAILJET_API_KEY = 'cle-jackned'

    const { getSiteSecrets } = loadSecrets()
    expect(getSiteSecrets('jackned').mailjet.apiKey).toBe('cle-jackned')
    expect(getSiteSecrets('sauvage-watches').mailjet.apiKey).toBe('cle-partagee')
  })

  it('reste null quand aucune clé n’est déclarée', () => {
    const { getSiteSecrets } = loadSecrets()
    expect(getSiteSecrets('jackned').mailjet).toEqual({ apiKey: null, secretKey: null })
  })
})

describe('secrets non partagés', () => {
  it('ne fait jamais retomber Stripe ni Supabase sur un autre site', () => {
    process.env.STRIPE_SECRET_KEY = 'sk_historique_sauvage'
    process.env.SUPABASE_URL = 'https://sauvage.supabase.co'

    const { getSiteSecrets } = loadSecrets()
    const jackned = getSiteSecrets('jackned')

    expect(jackned.stripe.secretKey).toBeNull()
    expect(jackned.supabase.url).toBeNull()
  })

  it('garde le repli historique de sauvage-watches, warning compris', () => {
    process.env.STRIPE_SECRET_KEY = 'sk_historique_sauvage'
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const { getSiteSecrets } = loadSecrets()
    expect(getSiteSecrets('sauvage-watches').stripe.secretKey).toBe('sk_historique_sauvage')
    const stripeWarnings = warn.mock.calls.filter((call) =>
      /variable historique "STRIPE_SECRET_KEY"/.test(String(call[0])),
    )
    expect(stripeWarnings).toHaveLength(1)
  })
})

describe('siteIdToEnvSegment', () => {
  it('convertit un siteId kebab-case en segment de variable', () => {
    const { siteIdToEnvSegment } = loadSecrets()
    expect(siteIdToEnvSegment('place-des-montres')).toBe('PLACE_DES_MONTRES')
    expect(siteIdToEnvSegment('jackned')).toBe('JACKNED')
  })
})
