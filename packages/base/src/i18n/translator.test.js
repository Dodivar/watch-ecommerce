import { describe, expect, it, vi } from 'vitest'

import { createTranslator, mergeMessages } from './translator.js'

const catalogs = {
  fr: {
    'cart.empty': 'Votre panier est vide.',
    'cart.itemCount': { one: '{count} article', other: '{count} articles' },
    'nav.hello': 'Bonjour {name}',
    'only.fr': 'Seulement en français',
  },
  en: {
    'cart.empty': 'Your cart is empty.',
    'cart.itemCount': { one: '{count} item', other: '{count} items' },
    'nav.hello': 'Hello {name}',
  },
  de: {
    'cart.empty': 'Ihr Warenkorb ist leer.',
    'cart.itemCount': { one: '{count} Artikel', other: '{count} Artikel' },
    'nav.hello': 'Hallo {name}',
  },
}

function make(locale, extra = {}) {
  return createTranslator({ locale, fallbackLocale: 'fr', catalogs, ...extra })
}

describe('t()', () => {
  it('traduit dans la langue active', () => {
    expect(make('de').t('cart.empty')).toBe('Ihr Warenkorb ist leer.')
  })

  it('interpole les paramètres', () => {
    expect(make('en').t('nav.hello', { name: 'Alex' })).toBe('Hello Alex')
  })

  it('laisse le jeton en place si le paramètre manque', () => {
    expect(make('en').t('nav.hello')).toBe('Hello {name}')
  })

  it('retombe sur la langue par défaut pour une clé non traduite', () => {
    expect(make('en').t('only.fr')).toBe('Seulement en français')
  })

  it('renvoie la clé si elle est introuvable partout', () => {
    expect(make('en').t('does.not.exist')).toBe('does.not.exist')
  })

  it('signale une clé manquante', () => {
    const onMissingKey = vi.fn()
    make('en', { onMissingKey }).t('only.fr')
    expect(onMissingKey).toHaveBeenCalledWith(expect.stringContaining('only.fr'))
  })

  it('choisit la forme « other » pour une entrée plurielle sans count', () => {
    expect(make('en').t('cart.itemCount')).toBe('{count} items')
  })
})

describe('tc()', () => {
  it('accorde en nombre', () => {
    const en = make('en')
    expect(en.tc('cart.itemCount', 1)).toBe('1 item')
    expect(en.tc('cart.itemCount', 3)).toBe('3 items')
  })

  it('applique les règles de la langue : le français range 0 au singulier', () => {
    // C'est précisément ce qu'un `count === 1` manquerait.
    expect(make('fr').tc('cart.itemCount', 0)).toBe('0 article')
    expect(make('en').tc('cart.itemCount', 0)).toBe('0 items')
    expect(make('de').tc('cart.itemCount', 0)).toBe('0 Artikel')
  })

  it('expose `count` à l’interpolation', () => {
    expect(make('de').tc('cart.itemCount', 7)).toBe('7 Artikel')
  })
})

describe('surcharges client', () => {
  it('remplace une clé du socle', () => {
    const t = make('en', { overrides: { en: { 'cart.empty': 'Nothing here yet.' } } }).t
    expect(t('cart.empty')).toBe('Nothing here yet.')
  })

  it('laisse intactes les clés non surchargées', () => {
    const t = make('en', { overrides: { en: { 'cart.empty': 'Nothing here yet.' } } }).t
    expect(t('nav.hello', { name: 'Alex' })).toBe('Hello Alex')
  })

  it('mergeMessages tolère une absence de surcharge', () => {
    expect(mergeMessages({ a: 1 }, undefined)).toEqual({ a: 1 })
  })
})
