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

/** Même environnement, pour le module de suggestion (qui lit `activeLocale.js`). */
async function loadSuggestion(siteConfig, browser = {}) {
  await loadActiveLocale(siteConfig, browser)
  return import('./localeSuggestion.js')
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

  // Googlebot rend avec un navigateur anglais : une URL sans préfixe qui suivrait la langue du
  // navigateur serait indexée en anglais sous une canonique française.
  it.each(['en-US', 'de-CH', 'es-ES'])(
    'sert la langue par défaut sans préfixe, quelle que soit la langue du navigateur (%s)',
    async (language) => {
      const { getActiveLocale } = await loadActiveLocale(MULTILINGUAL, {
        path: '/',
        languages: [language],
      })
      expect(getActiveLocale()).toBe('fr')
    },
  )

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

})

describe('getSuggestedLocale()', () => {
  it('propose la langue du navigateur sur une URL sans préfixe', async () => {
    const { getSuggestedLocale } = await loadSuggestion(MULTILINGUAL, {
      path: '/collection',
      languages: ['de-CH', 'fr-FR'],
    })
    expect(getSuggestedLocale('/collection')).toBe('de')
  })

  it('ne propose rien si le navigateur parle déjà la langue active', async () => {
    const { getSuggestedLocale } = await loadSuggestion(MULTILINGUAL, {
      path: '/collection',
      languages: ['fr-FR'],
    })
    expect(getSuggestedLocale('/collection')).toBeNull()
  })

  it('ne propose rien si le navigateur ne parle aucune langue du site', async () => {
    const { getSuggestedLocale } = await loadSuggestion(MULTILINGUAL, {
      path: '/collection',
      languages: ['es-ES', 'it-IT'],
    })
    expect(getSuggestedLocale('/collection')).toBeNull()
  })

  it('ne remet pas en cause un préfixe d’URL', async () => {
    const { getSuggestedLocale } = await loadSuggestion(MULTILINGUAL, {
      path: '/de/collection',
      languages: ['en-US'],
    })
    expect(getSuggestedLocale('/collection')).toBeNull()
  })

  it('ne remet pas en cause un choix mémorisé', async () => {
    const { getSuggestedLocale } = await loadSuggestion(MULTILINGUAL, {
      path: '/collection',
      languages: ['de-DE'],
      stored: 'fr',
    })
    expect(getSuggestedLocale('/collection')).toBeNull()
  })

  it('ne propose rien dans le back-office', async () => {
    const { getSuggestedLocale } = await loadSuggestion(MULTILINGUAL, {
      path: '/admin/orders',
      languages: ['de-DE'],
    })
    expect(getSuggestedLocale('/admin/orders')).toBeNull()
  })

  it('ne propose rien quand la détection est désactivée', async () => {
    const { getSuggestedLocale } = await loadSuggestion(
      {
        siteId: 'acme',
        i18n: { defaultLocale: 'fr', locales: ['fr', 'de'], detect: { navigator: 'off' } },
      },
      { path: '/collection', languages: ['de-DE'] },
    )
    expect(getSuggestedLocale('/collection')).toBeNull()
  })

  it('ne propose rien sur un site monolingue', async () => {
    const { getSuggestedLocale } = await loadSuggestion(
      { siteId: 'jackned', locale: 'fr' },
      { path: '/collection', languages: ['de-DE'] },
    )
    expect(getSuggestedLocale('/collection')).toBeNull()
  })

  it('rédige la suggestion dans la langue proposée', async () => {
    const { createSuggestionTranslator } = await loadSuggestion(MULTILINGUAL, {
      path: '/collection',
      languages: ['en-US'],
    })
    expect(createSuggestionTranslator('en').t('localeSuggestion.accept')).toBe('View in English')
    expect(createSuggestionTranslator('de').t('localeSuggestion.accept')).toBe('Auf Deutsch ansehen')
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
