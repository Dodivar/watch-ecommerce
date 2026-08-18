/**
 * Détection de la langue active.
 *
 * Le module fige la langue au premier appel et lit le manifest au chargement : chaque cas
 * réimporte donc le module avec un manifest et un environnement navigateur neufs.
 *
 * @vitest-environment happy-dom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const MULTILINGUAL = {
  siteId: 'acme',
  locale: 'fr',
  i18n: { enabled: true, defaultLocale: 'fr', locales: ['fr', 'en', 'de'] },
}

/**
 * @param {Record<string, unknown>} siteConfig
 * @param {{ path?: string, languages?: string[], stored?: string }} [browser]
 */
async function loadActiveLocale(siteConfig, browser = {}) {
  vi.resetModules()
  vi.doMock('@site-config', () => ({ default: siteConfig }))

  window.history.replaceState({}, '', browser.path ?? '/')
  vi.spyOn(navigator, 'languages', 'get').mockReturnValue(browser.languages ?? ['fr-FR'])
  localStorage.clear()
  if (browser.stored) localStorage.setItem('acme_locale_v1', browser.stored)

  return import('./activeLocale.js')
}

beforeEach(() => localStorage.clear())
afterEach(() => vi.restoreAllMocks())

describe('getActiveLocale()', () => {
  it('donne la priorité au préfixe d’URL', async () => {
    const { getActiveLocale } = await loadActiveLocale(MULTILINGUAL, {
      path: '/de/collection',
      languages: ['en-US'],
      stored: 'en',
    })
    expect(getActiveLocale()).toBe('de')
  })

  it('utilise le choix mémorisé à défaut de préfixe', async () => {
    const { getActiveLocale } = await loadActiveLocale(MULTILINGUAL, {
      path: '/collection',
      languages: ['de-DE'],
      stored: 'en',
    })
    expect(getActiveLocale()).toBe('en')
  })

  it('utilise la langue du navigateur à défaut de choix mémorisé', async () => {
    const { getActiveLocale } = await loadActiveLocale(MULTILINGUAL, {
      path: '/collection',
      languages: ['de-CH', 'fr-FR'],
    })
    expect(getActiveLocale()).toBe('de')
  })

  it('retombe sur la langue par défaut si le navigateur ne propose rien d’activé', async () => {
    const { getActiveLocale } = await loadActiveLocale(MULTILINGUAL, {
      path: '/collection',
      languages: ['es-ES', 'it-IT'],
    })
    expect(getActiveLocale()).toBe('fr')
  })

  it('garde le back-office dans la langue par défaut', async () => {
    const { getActiveLocale } = await loadActiveLocale(MULTILINGUAL, {
      path: '/admin/orders',
      languages: ['de-DE'],
      stored: 'de',
    })
    expect(getActiveLocale()).toBe('fr')
  })

  it('reste sur la langue par défaut pour un site monolingue', async () => {
    const { getActiveLocale } = await loadActiveLocale(
      { siteId: 'jackned', locale: 'fr' },
      { path: '/collection', languages: ['de-DE'] },
    )
    expect(getActiveLocale()).toBe('fr')
  })

  it('ignore un choix mémorisé qui n’est plus une langue du site', async () => {
    const { getActiveLocale } = await loadActiveLocale(
      { siteId: 'acme', i18n: { defaultLocale: 'fr', locales: ['fr', 'en'] } },
      { path: '/collection', languages: ['it-IT'], stored: 'de' },
    )
    expect(getActiveLocale()).toBe('fr')
  })

  it('n’applique pas la détection navigateur quand elle est désactivée', async () => {
    const { getActiveLocale } = await loadActiveLocale(
      {
        siteId: 'acme',
        i18n: { defaultLocale: 'fr', locales: ['fr', 'de'], detect: { navigator: 'off' } },
      },
      { path: '/collection', languages: ['de-DE'] },
    )
    expect(getActiveLocale()).toBe('fr')
  })
})

describe('localizedPath() et préfixe actif', () => {
  it('préfixe les chemins dans la langue active', async () => {
    const { localizedPath, getActiveLocalePrefix } = await loadActiveLocale(MULTILINGUAL, {
      path: '/de/collection',
    })
    expect(getActiveLocalePrefix()).toBe('/de')
    expect(localizedPath('/montre/abc')).toBe('/de/montre/abc')
    expect(localizedPath('/montre/abc', 'fr')).toBe('/montre/abc')
  })

  it('ne préfixe rien dans la langue par défaut', async () => {
    const { localizedPath, getActiveLocalePrefix } = await loadActiveLocale(MULTILINGUAL, {
      path: '/collection',
    })
    expect(getActiveLocalePrefix()).toBe('')
    expect(localizedPath('/collection')).toBe('/collection')
  })
})

describe('setStoredLocale()', () => {
  it('mémorise un choix explicite', async () => {
    const { setStoredLocale, getStoredLocale } = await loadActiveLocale(MULTILINGUAL)
    setStoredLocale('de')
    expect(getStoredLocale()).toBe('de')
  })
})
