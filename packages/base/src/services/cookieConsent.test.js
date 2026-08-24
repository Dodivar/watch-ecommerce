// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/site/getSiteConfig.js', () => ({
  getSiteConfig: () => ({
    integrations: { cookieConsentStorageKey: 'test_cookie_consent' },
  }),
}))

import {
  COOKIE_CONSENT_STORAGE_KEY,
  COOKIE_CONSENT_TTL_MS,
  COOKIE_CONSENT_VERSION,
  getConsentState,
  hasValidConsent,
  isAnalyticsAllowed,
  isMarketingAllowed,
  saveConsent,
  shouldShowBanner,
} from './cookieConsent.js'

function writeRawConsent({
  version = COOKIE_CONSENT_VERSION,
  analytics = true,
  marketing = false,
  savedAt,
}) {
  localStorage.setItem(
    COOKIE_CONSENT_STORAGE_KEY,
    JSON.stringify({ version, analytics, marketing, savedAt }),
  )
}

beforeEach(() => {
  localStorage.clear()
})

describe('cookieConsent', () => {
  it('utilise la clé de stockage du site.config', () => {
    expect(COOKIE_CONSENT_STORAGE_KEY).toBe('test_cookie_consent')
  })

  it('sans choix enregistré : bandeau affiché, rien d’autorisé', () => {
    expect(getConsentState()).toBeNull()
    expect(shouldShowBanner()).toBe(true)
    expect(hasValidConsent()).toBe(false)
    expect(isAnalyticsAllowed()).toBe(false)
    expect(isMarketingAllowed()).toBe(false)
  })

  it('saveConsent({analytics:true}) autorise la mesure d’audience', () => {
    saveConsent({ analytics: true, marketing: false })

    const state = getConsentState()
    expect(state).toMatchObject({ analytics: true, marketing: false, expired: false })
    expect(hasValidConsent()).toBe(true)
    expect(isAnalyticsAllowed()).toBe(true)
    expect(shouldShowBanner()).toBe(false)
  })

  it('saveConsent({analytics:false}) mémorise le refus sans réafficher le bandeau', () => {
    saveConsent({ analytics: false, marketing: false })

    expect(hasValidConsent()).toBe(true)
    expect(isAnalyticsAllowed()).toBe(false)
    expect(shouldShowBanner()).toBe(false)
  })

  it('la publicité est une finalité distincte de la mesure d’audience', () => {
    saveConsent({ analytics: true, marketing: false })
    expect(isAnalyticsAllowed()).toBe(true)
    expect(isMarketingAllowed()).toBe(false)

    saveConsent({ analytics: false, marketing: true })
    expect(isAnalyticsAllowed()).toBe(false)
    expect(isMarketingAllowed()).toBe(true)

    saveConsent({ analytics: true, marketing: true })
    expect(isAnalyticsAllowed()).toBe(true)
    expect(isMarketingAllowed()).toBe(true)
  })

  it('`marketing` omis vaut refus', () => {
    saveConsent({ analytics: true })
    expect(getConsentState()).toMatchObject({ analytics: true, marketing: false })
    expect(isMarketingAllowed()).toBe(false)
  })

  it('un consentement expiré (au-delà du TTL) réaffiche le bandeau', () => {
    const savedAt = new Date(Date.now() - COOKIE_CONSENT_TTL_MS - 1000).toISOString()
    writeRawConsent({ analytics: true, marketing: true, savedAt })

    const state = getConsentState()
    expect(state.expired).toBe(true)
    expect(hasValidConsent()).toBe(false)
    expect(isAnalyticsAllowed()).toBe(false)
    expect(isMarketingAllowed()).toBe(false)
    expect(shouldShowBanner()).toBe(true)
  })

  it('ignore une version de schéma différente', () => {
    writeRawConsent({ version: 999, analytics: true, savedAt: new Date().toISOString() })
    expect(getConsentState()).toBeNull()
    expect(shouldShowBanner()).toBe(true)
  })

  it('rejette un consentement v1 : la publicité est une finalité non couverte', () => {
    localStorage.setItem(
      COOKIE_CONSENT_STORAGE_KEY,
      JSON.stringify({ version: 1, analytics: true, savedAt: new Date().toISOString() }),
    )

    expect(getConsentState()).toBeNull()
    expect(isAnalyticsAllowed()).toBe(false)
    expect(shouldShowBanner()).toBe(true)
  })

  it('ignore un payload corrompu ou incomplet', () => {
    localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, 'pas-du-json{')
    expect(getConsentState()).toBeNull()

    writeRawConsent({ analytics: 'oui', savedAt: new Date().toISOString() })
    expect(getConsentState()).toBeNull()

    writeRawConsent({ analytics: true, marketing: 'oui', savedAt: new Date().toISOString() })
    expect(getConsentState()).toBeNull()

    writeRawConsent({ analytics: true, savedAt: 'date-invalide' })
    expect(getConsentState()).toBeNull()
  })
})
