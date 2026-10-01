import { beforeEach, describe, expect, it, vi } from 'vitest'

const getSiteConfigMock = vi.hoisted(() => vi.fn())
vi.mock('@/site/getSiteConfig.js', () => ({ getSiteConfig: getSiteConfigMock }))

import { isAuthenticated } from './maintenanceService.js'

describe('maintenanceService.isAuthenticated', () => {
  beforeEach(() => {
    const store = {}
    const storage = { getItem: (k) => store[k] ?? null }
    vi.stubGlobal('sessionStorage', storage)
    vi.stubGlobal('localStorage', storage)
  })

  it('ouvre le site à tous quand maintenance.enabled est false', () => {
    getSiteConfigMock.mockReturnValue({ siteId: 's', maintenance: { enabled: false } })
    expect(isAuthenticated()).toBe(true)
  })

  it.each([[{ enabled: true }], [{}], [undefined]])('reste verrouillé avec %j', (maintenance) => {
    getSiteConfigMock.mockReturnValue({ siteId: 's', maintenance })
    expect(isAuthenticated()).toBe(false)
  })
})
