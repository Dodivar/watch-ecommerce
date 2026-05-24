import { describe, expect, it } from 'vitest'

import { resolveIcon, ICON_REGISTRY } from './iconRegistry.js'

describe('iconRegistry', () => {
  it('résout les clés sémantiques connues', () => {
    expect(resolveIcon('guarantee')).toBe(ICON_REGISTRY.guarantee)
    expect(resolveIcon('atelier')).toBe(ICON_REGISTRY.atelier)
    expect(resolveIcon('sport')).toBe(ICON_REGISTRY.sport)
  })

  it('résout les alias envoi/shipping et retour/return', () => {
    expect(resolveIcon('envoi')).toBe(resolveIcon('shipping'))
    expect(resolveIcon('retour')).toBe(resolveIcon('return'))
  })

  it('utilise le fallback shield pour une clé inconnue', () => {
    expect(resolveIcon('unknown-key')).toBe(ICON_REGISTRY.shield)
    expect(resolveIcon('')).toBe(ICON_REGISTRY.default)
  })

  it('supporte un nom Lucide direct en kebab-case', () => {
    expect(resolveIcon('calendar')).toBe(ICON_REGISTRY.calendar)
  })
})
