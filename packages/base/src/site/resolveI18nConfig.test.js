import { describe, expect, it } from 'vitest'

import { resolveI18nConfig } from './resolveI18nConfig.js'

describe('resolveI18nConfig()', () => {
  it('reste monolingue quand le manifest ne déclare que `locale`', () => {
    const resolved = resolveI18nConfig({ siteId: 'jackned', locale: 'fr' })
    expect(resolved.enabled).toBe(false)
    expect(resolved.defaultLocale).toBe('fr')
    expect(resolved.locales).toEqual(['fr'])
  })

  it('tolère un manifest sans `locale` ni `i18n`', () => {
    const resolved = resolveI18nConfig({})
    expect(resolved).toMatchObject({ enabled: false, defaultLocale: 'fr', locales: ['fr'] })
  })

  it('active les langues déclarées, langue par défaut en tête', () => {
    const resolved = resolveI18nConfig({
      siteId: 'sauvage-watches',
      locale: 'fr',
      i18n: { enabled: true, defaultLocale: 'fr', locales: ['en', 'de', 'fr'] },
    })
    expect(resolved.enabled).toBe(true)
    expect(resolved.locales).toEqual(['fr', 'en', 'de'])
  })

  it('ajoute la langue par défaut absente de `locales`', () => {
    const resolved = resolveI18nConfig({
      i18n: { defaultLocale: 'de', locales: ['en'] },
    })
    expect(resolved.locales).toEqual(['de', 'en'])
  })

  it('retombe sur `locale` quand `defaultLocale` est absent', () => {
    const resolved = resolveI18nConfig({ locale: 'de', i18n: { locales: ['de', 'en'] } })
    expect(resolved.defaultLocale).toBe('de')
  })

  it('respecte `enabled: false` malgré plusieurs langues', () => {
    const resolved = resolveI18nConfig({
      i18n: { enabled: false, defaultLocale: 'fr', locales: ['fr', 'en', 'de'] },
    })
    expect(resolved.enabled).toBe(false)
    expect(resolved.locales).toEqual(['fr'])
  })

  it('reste monolingue si une seule langue est déclarée', () => {
    const resolved = resolveI18nConfig({ i18n: { enabled: true, locales: ['fr'] } })
    expect(resolved.enabled).toBe(false)
  })

  it('rejette une langue non supportée', () => {
    expect(() => resolveI18nConfig({ i18n: { locales: ['fr', 'es'] } })).toThrow(/es/)
    expect(() => resolveI18nConfig({ i18n: { defaultLocale: 'es' } })).toThrow(/defaultLocale/)
  })

  it('rejette un `locales` qui n’est pas un tableau', () => {
    expect(() => resolveI18nConfig({ i18n: { locales: 'fr,en' } })).toThrow(/tableau/)
  })

  it('exclut `/admin` du préfixe par défaut et dérive la clé de stockage du siteId', () => {
    const resolved = resolveI18nConfig({
      siteId: 'place-des-montres',
      i18n: { locales: ['fr', 'en'] },
    })
    expect(resolved.excludePathPrefixes).toEqual(['/admin'])
    expect(resolved.storageKey).toBe('place-des-montres_locale_v1')
    expect(resolved.detect).toEqual({ storage: true, navigator: 'suggest' })
  })

  it('accepte les options de détection et d’exclusion explicites', () => {
    const resolved = resolveI18nConfig({
      i18n: {
        locales: ['fr', 'en'],
        excludePathPrefixes: ['/admin', '/checkout'],
        detect: { storage: false, navigator: 'off' },
        storageKey: 'pdm_lang',
      },
    })
    expect(resolved.excludePathPrefixes).toEqual(['/admin', '/checkout'])
    expect(resolved.detect).toEqual({ storage: false, navigator: 'off' })
    expect(resolved.storageKey).toBe('pdm_lang')
  })

  it('ignore un mode de détection navigateur inconnu', () => {
    const resolved = resolveI18nConfig({
      i18n: { locales: ['fr', 'en'], detect: { navigator: 'teleport' } },
    })
    expect(resolved.detect.navigator).toBe('suggest')
  })
})
