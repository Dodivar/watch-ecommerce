import { describe, expect, it } from 'vitest'

import { DEFAULT_RADIUS } from './defaultVisual.js'
import { resolveVisual, getRadiusPreset } from './resolveVisual.js'

describe('resolveVisual', () => {
  it('retourne l’échelle Tailwind par défaut si theme.radius est absent', () => {
    expect(resolveVisual({})).toEqual({ radius: { ...DEFAULT_RADIUS } })
  })

  it('retourne l’échelle Tailwind par défaut pour le preset rounded', () => {
    expect(resolveVisual({ theme: { radius: 'rounded' } })).toEqual({
      radius: { ...DEFAULT_RADIUS },
    })
  })

  it('applique le preset sharp : 0 sur les tokens sauf full', () => {
    const { radius } = resolveVisual({ theme: { radius: 'sharp' } })

    expect(radius.sm).toBe('0')
    expect(radius.DEFAULT).toBe('0')
    expect(radius.md).toBe('0')
    expect(radius.lg).toBe('0')
    expect(radius.xl).toBe('0')
    expect(radius['2xl']).toBe('0')
    expect(radius['3xl']).toBe('0')
    expect(radius.full).toBe('9999px')
  })

  it('fusionne un override partiel sur les défauts', () => {
    const { radius } = resolveVisual({ theme: { radius: { lg: '0.25rem' } } })

    expect(radius.lg).toBe('0.25rem')
    expect(radius.md).toBe(DEFAULT_RADIUS.md)
    expect(radius.full).toBe(DEFAULT_RADIUS.full)
  })

  it('rejette un preset inconnu', () => {
    expect(() => resolveVisual({ theme: { radius: 'unknown' } })).toThrow(
      'Unknown theme.radius preset: "unknown".',
    )
  })

  it('retourne le nom du preset actif', () => {
    expect(getRadiusPreset({})).toBe('rounded')
    expect(getRadiusPreset({ theme: { radius: 'sharp' } })).toBe('sharp')
    expect(getRadiusPreset({ theme: { radius: { lg: '0.25rem' } } })).toBe('custom')
  })
})
