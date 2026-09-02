import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const getSiteConfigMock = vi.hoisted(() => vi.fn(() => ({ siteId: 'test-site' })))

vi.mock('@/site/getSiteConfig.js', () => ({
  getSiteConfig: getSiteConfigMock,
}))

import {
  MATCH_SESSION_TTL_MS,
  MATCH_SESSION_VERSION,
  clearMatchSession,
  createEmptyMatchSession,
  getMatchSessionStorageKey,
  loadMatchSession,
  parseMatchSession,
  reconcileMatchSession,
  saveMatchSession,
} from './matchSessionStorage.js'

/** `localStorage` minimal : l'environnement de test est Node, sans DOM. */
function installLocalStorage() {
  const store = new Map()
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  }
  return store
}

describe('matchSessionStorage', () => {
  let store

  beforeEach(() => {
    store = installLocalStorage()
  })

  afterEach(() => {
    delete globalThis.localStorage
  })

  it('scope la clé par site', () => {
    expect(getMatchSessionStorageKey()).toBe('watch-ecommerce:matchmaking:test-site')
  })

  it('écrit puis relit une session horodatée', () => {
    const session = {
      ...createEmptyMatchSession(),
      step: 'swipe',
      preferences: { budget: { min: 0, max: 8000 }, brand: ['rolex'] },
      seen: ['a', 'b'],
      liked: ['b'],
      passed: ['a'],
    }
    const written = saveMatchSession(session)
    expect(typeof written.savedAt).toBe('string')

    const loaded = loadMatchSession()
    expect(loaded.step).toBe('swipe')
    expect(loaded.preferences.budget).toEqual({ min: 0, max: 8000 })
    expect(loaded.preferences.brand).toEqual(['rolex'])
    expect(loaded.seen).toEqual(['a', 'b'])
    expect(loaded.liked).toEqual(['b'])
  })

  it('rejette une autre version', () => {
    expect(parseMatchSession({ ...createEmptyMatchSession(), version: 0, savedAt: 'x' })).toBeNull()
    store.set(
      getMatchSessionStorageKey(),
      JSON.stringify({ version: MATCH_SESSION_VERSION + 1, savedAt: new Date().toISOString() }),
    )
    expect(loadMatchSession()).toBeNull()
  })

  it('rejette une session périmée', () => {
    const old = new Date(Date.now() - MATCH_SESSION_TTL_MS - 1000).toISOString()
    store.set(
      getMatchSessionStorageKey(),
      JSON.stringify({ ...createEmptyMatchSession(), savedAt: old }),
    )
    expect(loadMatchSession()).toBeNull()
  })

  it('rejette un JSON corrompu sans lever', () => {
    store.set(getMatchSessionStorageKey(), '{not json')
    expect(loadMatchSession()).toBeNull()
  })

  it('ramène une étape inconnue et des listes douteuses à une forme sûre', () => {
    const parsed = parseMatchSession({
      version: MATCH_SESSION_VERSION,
      savedAt: new Date().toISOString(),
      step: 'teleport',
      stepIndex: -3,
      seen: ['a', 'a', 1, null],
      liked: 'b',
      passed: undefined,
      preferences: { brand: ['x'] },
    })
    expect(parsed.step).toBe('onboarding')
    expect(parsed.stepIndex).toBe(0)
    expect(parsed.seen).toEqual(['a'])
    expect(parsed.liked).toEqual([])
    expect(parsed.passed).toEqual([])
    expect(parsed.preferences.brand).toEqual(['x'])
  })

  it('reste inerte sans localStorage', () => {
    delete globalThis.localStorage
    expect(loadMatchSession()).toBeNull()
    expect(() => saveMatchSession(createEmptyMatchSession())).not.toThrow()
    expect(() => clearMatchSession()).not.toThrow()
  })

  it('efface la session', () => {
    saveMatchSession(createEmptyMatchSession())
    clearMatchSession()
    expect(loadMatchSession()).toBeNull()
  })
})

describe('reconcileMatchSession', () => {
  it('oublie les vues et passées disparues, conserve et signale les coups de cœur disparus', () => {
    const session = {
      ...createEmptyMatchSession(),
      seen: ['a', 'gone-seen', 'b'],
      passed: ['gone-seen'],
      liked: ['b', 'gone-liked'],
    }
    const { session: next, unavailableLikedIds } = reconcileMatchSession(session, [
      { id: 'a' },
      { id: 'b' },
    ])
    expect(next.seen).toEqual(['a', 'b'])
    expect(next.passed).toEqual([])
    expect(next.liked).toEqual(['b', 'gone-liked'])
    expect(unavailableLikedIds).toEqual(['gone-liked'])
  })
})
