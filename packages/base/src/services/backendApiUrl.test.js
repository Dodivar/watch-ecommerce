import { afterEach, describe, expect, it, vi } from 'vitest'

import { getBackendApiUrl } from './backendApiUrl.js'

describe('getBackendApiUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('retourne localhost en développement', () => {
    vi.stubEnv('PROD', '')
    vi.stubEnv('DEV', '1')
    expect(getBackendApiUrl()).toBe('http://localhost:3000')
  })

  it('retourne VITE_BACKEND_URL normalisée en production', () => {
    vi.stubEnv('PROD', '1')
    vi.stubEnv('DEV', '')
    vi.stubEnv('VITE_BACKEND_URL', 'https://api.example.com/')
    expect(getBackendApiUrl()).toBe('https://api.example.com')
  })

  it('lève une erreur explicite si VITE_BACKEND_URL est absente en production', () => {
    vi.stubEnv('PROD', '1')
    vi.stubEnv('DEV', '')
    vi.stubEnv('VITE_BACKEND_URL', '')
    expect(() => getBackendApiUrl()).toThrow(/Backend non configuré/)
  })
})
