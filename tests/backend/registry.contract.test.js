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

  it('recense les origines revendiquées par plusieurs sites', async () => {
    // `resolveSite` exclut ces origines du recoupement `X-Site-Id` / `Origin` : sans elles,
    // le dev local de toutes les vitrines sauf la première serait refusé. Les quatre
    // manifests déclarant `http://localhost:5173` en `urls.development`, l'ensemble ne peut
    // pas être vide — s'il l'est, c'est que la dérivation d'origines a changé.
    const registry = await buildRegistry()

    expect(registry.ambiguousOrigins).toBeInstanceOf(Set)
    expect(registry.ambiguousOrigins.has('http://localhost:5173')).toBe(true)

    for (const key of registry.ambiguousOrigins) {
      const claimants = registry.list().filter((entry) => entry.allowedOrigins.includes(key))
      expect(claimants.length, `origine ${key} marquée ambiguë à tort`).toBeGreaterThan(1)
    }
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
