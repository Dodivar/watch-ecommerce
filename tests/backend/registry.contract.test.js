import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'

import { listBuildableSiteIds } from '../helpers/sites.js'

const require = createRequire(import.meta.url)
const { buildRegistry, listSiteIds } = require('../../backend/sites/registry.js')

describe('backend registry', () => {
  it('charge tous les sites buildables sans en ignorer', async () => {
    const expectedIds = listBuildableSiteIds()
    const registryIds = listSiteIds().filter((id) =>
      expectedIds.includes(id),
    )

    const registry = await buildRegistry()

    expect(registry.byId.size).toBe(expectedIds.length)
    for (const id of expectedIds) {
      expect(registry.byId.has(id), `site manquant dans le registry: ${id}`).toBe(true)
    }
    expect(registryIds.length).toBe(expectedIds.length)
  })

  it('expose config.id et des origines si urls.production est définie', async () => {
    const registry = await buildRegistry()

    for (const entry of registry.list()) {
      expect(entry.id).toBeTruthy()
      expect(entry.config?.id).toBe(entry.id)
      const prod = entry.config?.urls?.production
      if (typeof prod === 'string' && prod.trim()) {
        expect(entry.allowedOrigins.length).toBeGreaterThan(0)
      }
    }
  })
})
