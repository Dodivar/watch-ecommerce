import { describe, expect, it } from 'vitest'

import {
  DEFAULT_WATCH_GUARANTEES,
  MAX_WATCH_GUARANTEES,
  MIN_WATCH_GUARANTEES,
  isWatchOutOfStock,
  resolveRetailTrustHighlights,
  resolveWatchCatalogConfig,
  resolveWatchGuarantees,
} from './watchCatalogDisplay.js'
import { resolveSiteConfig } from './resolveSiteConfig.js'

describe('resolveWatchCatalogConfig', () => {
  it('utilise retail par défaut', () => {
    const cfg = resolveWatchCatalogConfig({})
    expect(cfg.mode).toBe('retail')
    expect(cfg.isRetail).toBe(true)
    expect(cfg.appointmentEnabled).toBe(true)
    expect(cfg.display.showReference).toBe(false)
    expect(cfg.display.showSoldBadge).toBe(false)
    expect(cfg.display.showStockStatus).toBe(true)
  })

  it('active les flags resale pour mode resale', () => {
    const cfg = resolveWatchCatalogConfig({ watchCatalog: { mode: 'resale' } })
    expect(cfg.mode).toBe('resale')
    expect(cfg.isResale).toBe(true)
    expect(cfg.appointmentEnabled).toBe(false)
    expect(cfg.display.showReference).toBe(true)
    expect(cfg.display.showAdCode).toBe(true)
    expect(cfg.display.showStockStatus).toBe(false)
  })

  it('active la prise de rendez-vous en resale si watchCatalog.appointment', () => {
    const cfg = resolveWatchCatalogConfig({
      watchCatalog: { mode: 'resale', appointment: true },
    })
    expect(cfg.appointmentEnabled).toBe(true)
  })

  it('active la prise de rendez-vous par défaut en retail', () => {
    const cfg = resolveWatchCatalogConfig({ watchCatalog: { mode: 'retail' } })
    expect(cfg.appointmentEnabled).toBe(true)
  })

  it('conserve watchCatalog.guarantees', () => {
    const guarantees = {
      heading: 'Nos garanties',
      items: [{ id: 'a', title: 'A', text: 'Texte A.' }],
    }
    const cfg = resolveWatchCatalogConfig({ watchCatalog: { guarantees } })
    expect(cfg.guarantees).toEqual(guarantees)
  })
})

describe('resolveWatchGuarantees', () => {
  const sauvageCopy = {
    watchSecurityAuthentic: 'Texte authenticité Sauvage.',
    watchSecurityInsurance: 'Texte assurance Sauvage.',
  }

  it('retourne les garanties Sauvage par défaut', () => {
    const result = resolveWatchGuarantees({ copy: sauvageCopy })
    expect(result.heading).toBe(DEFAULT_WATCH_GUARANTEES.heading)
    expect(result.items).toHaveLength(6)
    expect(result.items[1].text).toBe('Texte authenticité Sauvage.')
    expect(result.items[3].text).toBe('Texte assurance Sauvage.')
  })

  it('résout une config client personnalisée', () => {
    const result = resolveWatchGuarantees({
      watchCatalog: {
        guarantees: {
          heading: 'Nos garanties',
          items: [
            { id: 'a', icon: 'payment', title: 'Paiement', text: 'Stripe.' },
            { id: 'b', icon: 'pickup', title: 'Retrait', text: 'En boutique.' },
            { id: 'c', icon: 'guarantee', title: 'Garantie', text: '2 ans.' },
          ],
        },
      },
    })
    expect(result.heading).toBe('Nos garanties')
    expect(result.items).toHaveLength(3)
    expect(result.items.map((i) => i.id)).toEqual(['a', 'b', 'c'])
  })

  it('utilise la config résolue via resolveSiteConfig', () => {
    const resolved = resolveSiteConfig({
      watchCatalog: {
        mode: 'retail',
        guarantees: {
          heading: 'Nos garanties et services',
          items: [
            { id: 'guarantee', icon: 'guarantee', title: 'Garantie 2 ans', text: 'Couverture 2 ans.' },
            { id: 'return', icon: 'return', title: 'Retour 30 jours', text: 'Retour sous 30 jours.' },
            { id: 'shipping', icon: 'shipping', title: 'Colissimo', text: 'Expédition 48 h.' },
          ],
        },
      },
    })
    const result = resolveWatchGuarantees(resolved)
    expect(result.heading).toBe('Nos garanties et services')
    expect(result.items).toHaveLength(3)
    expect(result.items[0].title).toBe('Garantie 2 ans')
  })

  it('ignore les items sans titre ou texte', () => {
    const result = resolveWatchGuarantees({
      watchCatalog: {
        guarantees: {
          items: [
            { id: 'ok', icon: 'payment', title: 'OK', text: 'Valide.' },
            { id: 'no-title', icon: 'payment', text: 'Sans titre.' },
            { id: 'no-text', icon: 'payment', title: 'Sans texte' },
          ],
        },
      },
    })
    expect(result.items).toHaveLength(1)
  })

  it('limite à MAX_WATCH_GUARANTEES items', () => {
    const items = Array.from({ length: 8 }, (_, i) => ({
      id: `g${i}`,
      icon: 'shield',
      title: `Garantie ${i}`,
      text: `Texte ${i}.`,
    }))
    const result = resolveWatchGuarantees({
      watchCatalog: { guarantees: { items } },
    })
    expect(result.items).toHaveLength(MAX_WATCH_GUARANTEES)
  })
})

describe('resolveRetailTrustHighlights', () => {
  it('retourne un tableau vide en mode resale', () => {
    expect(
      resolveRetailTrustHighlights({ watchCatalog: { mode: 'resale' } }, {}),
    ).toEqual([])
  })
})

describe('isWatchOutOfStock', () => {
  it('retail : true quand stock <= 0', () => {
    expect(isWatchOutOfStock({}, { stockQuantity: 0 })).toBe(true)
    expect(isWatchOutOfStock({}, { stockQuantity: -1 })).toBe(true)
  })

  it('retail : false quand stock > 0', () => {
    expect(isWatchOutOfStock({}, { stockQuantity: 3 })).toBe(false)
  })

  it('retail : false quand le stock est inconnu', () => {
    expect(isWatchOutOfStock({}, { stockQuantity: null })).toBe(false)
    expect(isWatchOutOfStock({}, {})).toBe(false)
  })

  it('resale : toujours false (pas de notion de stock)', () => {
    expect(
      isWatchOutOfStock({ watchCatalog: { mode: 'resale' } }, { stockQuantity: 0 }),
    ).toBe(false)
  })

  it('gère un watchItem absent', () => {
    expect(isWatchOutOfStock({}, null)).toBe(false)
  })
})
