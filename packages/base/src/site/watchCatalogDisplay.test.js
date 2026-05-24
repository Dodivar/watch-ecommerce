import { describe, expect, it } from 'vitest'

import { resolveWatchCatalogConfig } from './watchCatalogDisplay.js'

describe('resolveWatchCatalogConfig', () => {
  it('utilise retail par défaut', () => {
    const cfg = resolveWatchCatalogConfig({})
    expect(cfg.mode).toBe('retail')
    expect(cfg.isRetail).toBe(true)
    expect(cfg.display.showReference).toBe(false)
    expect(cfg.display.showSoldBadge).toBe(false)
  })

  it('active les flags resale pour mode resale', () => {
    const cfg = resolveWatchCatalogConfig({ watchCatalog: { mode: 'resale' } })
    expect(cfg.mode).toBe('resale')
    expect(cfg.isResale).toBe(true)
    expect(cfg.display.showReference).toBe(true)
    expect(cfg.display.showAdCode).toBe(true)
  })
})
