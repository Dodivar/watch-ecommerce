/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it } from 'vitest'

import {
  MATCH_ALERT_PREFERENCES_PATH,
  buildMatchAlertPayload,
  consumeAlertTokenFromLocation,
  readAlertTokenFromHash,
  recallAlertToken,
} from './watchMatchAlertService.js'
import { APP_ROUTE_META } from '@/site/appRouteMeta.js'

describe('page « mes préférences » — côté vitrine', () => {
  it('lit le jeton dans l’ancre du lien d’e-mail', () => {
    expect(readAlertTokenFromHash('#token=6f1c2a4e-8b3d')).toBe('6f1c2a4e-8b3d')
    expect(readAlertTokenFromHash('token=abc')).toBe('abc')
    expect(readAlertTokenFromHash('')).toBe('')
    expect(readAlertTokenFromHash('#autre=1')).toBe('')
  })

  it('retire le jeton de l’URL au démarrage, et seulement sur la page des préférences', () => {
    const calls = []
    const hist = { state: { s: 1 }, replaceState: (...args) => calls.push(args) }
    const token = consumeAlertTokenFromLocation(
      { pathname: '/en/coup-de-foudre/mes-preferences', search: '?a=1', hash: '#token=abc' },
      hist,
    )
    expect(token).toBe('abc')
    expect(calls).toEqual([[{ s: 1 }, '', '/en/coup-de-foudre/mes-preferences?a=1']])
    expect(recallAlertToken()).toBe('abc')

    expect(
      consumeAlertTokenFromLocation(
        { pathname: '/collection', search: '', hash: '#token=x' },
        hist,
      ),
    ).toBe('')
    expect(calls).toHaveLength(1)
  })

  it('pointe vers une route réellement déclarée', () => {
    expect(APP_ROUTE_META.map((r) => r.path)).toContain(MATCH_ALERT_PREFERENCES_PATH)
  })

  it('laisse `offered` traverser le payload d’inscription', () => {
    const payload = buildMatchAlertPayload({
      email: 'A@b.fr',
      criteria: { brand: ['rolex'], offered: { brand: ['rolex', 'tudor'] }, seen: ['w1'] },
    })
    expect(payload.criteria.offered).toEqual({ brand: ['rolex', 'tudor'] })
    expect(payload.criteria).not.toHaveProperty('seen')
  })
})
