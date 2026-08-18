import { describe, expect, it } from 'vitest'

import {
  isExcludedPath,
  localeHistoryBase,
  localePrefix,
  stripLocalePrefix,
  withLocalePrefix,
} from './localePaths.js'

const i18n = {
  enabled: true,
  defaultLocale: 'fr',
  locales: ['fr', 'en', 'de'],
  excludePathPrefixes: ['/admin'],
}
const monolingual = { enabled: false, defaultLocale: 'fr', locales: ['fr'] }

describe('localePrefix()', () => {
  it('ne préfixe pas la langue par défaut', () => {
    expect(localePrefix('fr', i18n)).toBe('')
  })

  it('préfixe les autres langues', () => {
    expect(localePrefix('de', i18n)).toBe('/de')
  })

  it('ne préfixe rien sur un site monolingue', () => {
    expect(localePrefix('en', monolingual)).toBe('')
  })
})

describe('withLocalePrefix()', () => {
  it('préfixe un chemin', () => {
    expect(withLocalePrefix('/collection', 'en', i18n)).toBe('/en/collection')
  })

  it('préfixe la racine sans slash en trop', () => {
    expect(withLocalePrefix('/', 'de', i18n)).toBe('/de')
  })

  it('retire le préfixe pour la langue par défaut', () => {
    expect(withLocalePrefix('/en/collection', 'fr', i18n)).toBe('/collection')
  })

  it('est idempotent (pas de /en/en/…)', () => {
    expect(withLocalePrefix('/en/collection', 'en', i18n)).toBe('/en/collection')
  })

  it('conserve query et hash', () => {
    expect(withLocalePrefix('/collection?page=2#top', 'de', i18n)).toBe('/de/collection?page=2#top')
  })

  it('ne préfixe jamais le back-office', () => {
    expect(withLocalePrefix('/admin/orders', 'de', i18n)).toBe('/admin/orders')
  })
})

describe('stripLocalePrefix()', () => {
  it('détache un préfixe de langue', () => {
    expect(stripLocalePrefix('/de/montre/abc', i18n)).toEqual({ locale: 'de', rest: '/montre/abc' })
  })

  it('rend la racine pour un préfixe seul', () => {
    expect(stripLocalePrefix('/en', i18n)).toEqual({ locale: 'en', rest: '/' })
  })

  it('laisse intact un chemin sans préfixe', () => {
    expect(stripLocalePrefix('/collection', i18n)).toEqual({ locale: null, rest: '/collection' })
  })

  it('découpe par segment : /entretien n’est pas la langue « en »', () => {
    expect(stripLocalePrefix('/entretien', i18n)).toEqual({ locale: null, rest: '/entretien' })
  })

  it('ignore une langue non activée par le site', () => {
    const frEn = { enabled: true, defaultLocale: 'fr', locales: ['fr', 'en'] }
    expect(stripLocalePrefix('/de/collection', frEn)).toEqual({
      locale: null,
      rest: '/de/collection',
    })
  })

  it('ne détache rien sur un site monolingue', () => {
    expect(stripLocalePrefix('/en/collection', monolingual)).toEqual({
      locale: null,
      rest: '/en/collection',
    })
  })
})

describe('isExcludedPath()', () => {
  it('reconnaît le back-office et ses sous-routes', () => {
    expect(isExcludedPath('/admin', i18n)).toBe(true)
    expect(isExcludedPath('/admin/watches/12/edit', i18n)).toBe(true)
  })

  it('ne confond pas un préfixe avec un chemin voisin', () => {
    expect(isExcludedPath('/administration', i18n)).toBe(false)
    expect(isExcludedPath('/collection', i18n)).toBe(false)
  })
})

describe('localeHistoryBase()', () => {
  it('rend la base Vite telle quelle pour la langue par défaut', () => {
    expect(localeHistoryBase('fr', i18n, '/')).toBe('/')
  })

  it('ajoute le segment de langue', () => {
    expect(localeHistoryBase('de', i18n, '/')).toBe('/de/')
  })

  it('compose avec une base Vite non racine', () => {
    expect(localeHistoryBase('en', i18n, '/shop/')).toBe('/shop/en/')
  })
})
